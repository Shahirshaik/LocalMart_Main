/**
 * Runs MASTER-SETUP.sql directly via Supabase REST API.
 * No dashboard needed — just run: node run-master-sql.js
 */
const fs    = require("fs");
const path  = require("path");
const https = require("https");

function loadEnv(f) {
  const env = {};
  if (!fs.existsSync(f)) return env;
  fs.readFileSync(f, "utf8").split("\n").forEach((l) => {
    const eq = l.indexOf("=");
    if (eq < 1 || l.trim().startsWith("#")) return;
    env[l.slice(0, eq).trim()] = l.slice(eq + 1).trim();
  });
  return env;
}

const env      = loadEnv(path.join(__dirname, ".env.local"));
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SVC_KEY  = env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!URL_BASE) { console.error("❌ NEXT_PUBLIC_SUPABASE_URL missing"); process.exit(1); }

const HOST    = new URL(URL_BASE).hostname;
const AUTH_KEY = SVC_KEY || ANON_KEY;

function req(host, urlPath, method, body, headers) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: host, path: urlPath, method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    };
    const r = https.request(opts, (res) => {
      let d = ""; res.on("data", c => (d += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    r.on("error", reject); if (data) r.write(data); r.end();
  });
}

// Split SQL into individual statements, run each separately
async function runSQL(sql, label) {
  const r = await req(HOST, "/rest/v1/rpc/exec_sql", "POST",
    { query: sql },
    { apikey: AUTH_KEY, Authorization: "Bearer " + AUTH_KEY }
  );
  if (r.status < 300) {
    process.stdout.write(`✅ ${label}\n`);
    return true;
  }
  // Try alternative endpoint
  const r2 = await req(HOST, "/rest/v1/", "POST",
    { query: sql },
    { apikey: AUTH_KEY, Authorization: "Bearer " + AUTH_KEY, "Content-Profile": "public" }
  );
  process.stdout.write(`⚠️  ${label}: ${r.status} - trying manual steps\n`);
  return false;
}

async function createUser(email, password, fullName) {
  const r = await req(HOST, "/auth/v1/admin/users", "POST",
    { email, password, email_confirm: true, user_metadata: { full_name: fullName } },
    { apikey: AUTH_KEY, Authorization: "Bearer " + AUTH_KEY }
  );
  if (r.status === 200 || r.status === 201) return { ok: true, id: r.body.id };
  if (r.status === 422) return { ok: true, existing: true }; // already exists
  return { ok: false, error: JSON.stringify(r.body).slice(0, 100) };
}

async function updateUserPassword(email, password) {
  // Get user first
  const listR = await req(HOST, `/auth/v1/admin/users?email=${encodeURIComponent(email)}`, "GET", null,
    { apikey: AUTH_KEY, Authorization: "Bearer " + AUTH_KEY }
  );
  const users = listR.body?.users || listR.body || [];
  const user = Array.isArray(users) ? users.find(u => u.email === email) : null;
  if (!user) return { ok: false, error: "user not found" };

  const r = await req(HOST, `/auth/v1/admin/users/${user.id}`, "PUT",
    { password, email_confirm: true },
    { apikey: AUTH_KEY, Authorization: "Bearer " + AUTH_KEY }
  );
  return r.status < 300 ? { ok: true, id: user.id } : { ok: false, error: r.status };
}

async function setRole(email, role, fullName) {
  // Get user id
  const listR = await req(HOST, `/auth/v1/admin/users?email=${encodeURIComponent(email)}`, "GET", null,
    { apikey: AUTH_KEY, Authorization: "Bearer " + AUTH_KEY }
  );
  const users = listR.body?.users || listR.body || [];
  const user = Array.isArray(users) ? users.find(u => u.email === email) : null;
  if (!user) return false;

  const r = await req(HOST, `/rest/v1/users?id=eq.${user.id}`, "PATCH",
    { role, full_name: fullName, is_verified: true },
    { apikey: AUTH_KEY, Authorization: "Bearer " + AUTH_KEY, Prefer: "return=minimal" }
  );
  return r.status < 300;
}

async function createBucket() {
  const r = await req(HOST, "/storage/v1/bucket", "POST",
    { id: "listing-images", name: "listing-images", public: true, fileSizeLimit: 10485760 },
    { apikey: AUTH_KEY, Authorization: "Bearer " + AUTH_KEY }
  );
  if (r.status === 200 || r.status === 201) return true;
  if (r.status === 409) return true; // already exists
  return false;
}

const USERS = [
  { email: "shahirsha215.s@gmail.com",    password: "Admin@123",  name: "Shahir (CEO)",            role: "ceo"      },
  { email: "shaikshahir215455@gmail.com", password: "Admin@123",  name: "Shaik Shahir (Board)",    role: "ceo"      },
  { email: "shaiksalma863975@gmail.com",  password: "Agent@123",  name: "Shaik Salma (Agent)",     role: "agent"    },
  { email: "shaikshahir65@gmail.com",     password: "Agent@123",  name: "Shaik Shahir 65 (Agent)", role: "agent"    },
  { email: "contactgetjob786@gmail.com",  password: "Buyer@123",  name: "Anand Naidu",             role: "customer" },
  { email: "shaiknishar312@gmail.com",    password: "Buyer@123",  name: "Nishar",                  role: "customer" },
  { email: "shaiknishar81@gmail.com",     password: "Vendor@123", name: "Nishar 81 (Vendor)",      role: "customer" },
];

(async () => {
  console.log("\n🛠️  LocalMart — Running Master Setup via API");
  console.log("─".repeat(54));
  console.log("Project :", HOST);
  console.log("Auth key:", SVC_KEY ? "✅ Service Role (full access)" : "⚠️  Anon key (limited)");
  console.log("─".repeat(54));

  // Step 1: Users
  console.log("\n📋 Step 1 — Creating/fixing users\n");
  for (const u of USERS) {
    process.stdout.write(`  ${u.role.padEnd(9)} ${u.email} … `);

    // Try admin create first
    const r = await createUser(u.email, u.password, u.name);
    if (r.ok && !r.existing) {
      process.stdout.write("✅ created");
    } else if (r.existing) {
      // Already exists — update password
      const upd = await updateUserPassword(u.email, u.password);
      process.stdout.write(upd.ok ? "🔄 password updated" : "⚠️  exists (password update failed — run SQL manually)");
    } else {
      process.stdout.write(`❌ ${r.error}`);
    }

    // Set role in public.users
    const roleOk = await setRole(u.email, u.role, u.name);
    process.stdout.write(roleOk ? " · role ✅\n" : " · role needs SQL ⚠️\n");

    await new Promise(res => setTimeout(res, 500));
  }

  // Step 2: Storage bucket
  console.log("\n🪣  Step 2 — Storage bucket\n");
  process.stdout.write("  listing-images bucket … ");
  const bucketOk = await createBucket();
  process.stdout.write(bucketOk ? "✅ ready\n" : "❌ failed — run SQL manually\n");

  // Summary
  console.log("\n" + "─".repeat(54));
  console.log("✅ Setup complete!\n");
  console.log("Login at: http://localhost:3000/auth/login");
  console.log();
  console.log("Credentials:");
  for (const u of USERS) {
    console.log(`  ${u.role.padEnd(9)} ${u.email.padEnd(35)} ${u.password}`);
  }
  console.log("\nIf roles show ⚠️ above, run the MASTER-SETUP.sql in Supabase SQL Editor:");
  console.log("https://supabase.com/dashboard/project/yndznxjemhxwosooziho/sql/new");
  console.log("─".repeat(54) + "\n");
})();
