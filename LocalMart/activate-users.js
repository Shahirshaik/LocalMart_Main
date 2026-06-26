/**
 * Run: node activate-users.js <SERVICE_ROLE_KEY>
 * Get key: Supabase Dashboard → Project Settings → API → service_role → Reveal → Copy
 */
const https = require("https");

const SVC = process.argv[2];
if (!SVC) {
  console.error("\nUsage: node activate-users.js <SERVICE_ROLE_KEY>");
  console.error("Get it: https://supabase.com/dashboard/project/yndznxjemhxwosooziho/settings/api\n");
  process.exit(1);
}

const HOST = "yndznxjemhxwosooziho.supabase.co";

const USERS = [
  { email: "shahirsha215.s@gmail.com",    password: "Admin@123",  name: "Shahir CEO",            role: "ceo"      },
  { email: "shaikshahir215455@gmail.com", password: "Admin@123",  name: "Shaik Shahir Board",    role: "ceo"      },
  { email: "shaiksalma863975@gmail.com",  password: "Agent@123",  name: "Shaik Salma Agent",     role: "agent"    },
  { email: "shaikshahir65@gmail.com",     password: "Agent@123",  name: "Shaik Shahir 65 Agent", role: "agent"    },
  { email: "contactgetjob786@gmail.com",  password: "Buyer@123",  name: "Anand Naidu",           role: "customer" },
  { email: "shaiknishar312@gmail.com",    password: "Buyer@123",  name: "Nishar",                role: "customer" },
  { email: "shaiknishar81@gmail.com",     password: "Vendor@123", name: "Nishar 81 Vendor",      role: "customer" },
];

function req(path, method, body, headers = {}) {
  return new Promise((resolve) => {
    const d = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: HOST, path, method,
      headers: {
        "Content-Type": "application/json",
        apikey: SVC,
        Authorization: "Bearer " + SVC,
        ...(d ? { "Content-Length": Buffer.byteLength(d) } : {}),
        ...headers,
      },
    };
    const r = https.request(opts, (res) => {
      let s = ""; res.on("data", c => s += c);
      res.on("end", () => { try { resolve({ status: res.statusCode, body: JSON.parse(s) }); } catch { resolve({ status: res.statusCode, body: s }); } });
    });
    r.on("error", e => resolve({ status: 0, body: e.message }));
    if (d) r.write(d); r.end();
  });
}

async function listUsers() {
  const r = await req("/auth/v1/admin/users?per_page=100", "GET");
  return r.status === 200 ? (r.body.users || []) : [];
}

async function confirmUser(id) {
  const r = await req(`/auth/v1/admin/users/${id}`, "PUT", { email_confirm: true });
  return r.status === 200;
}

async function updatePassword(id, password) {
  const r = await req(`/auth/v1/admin/users/${id}`, "PUT", { password });
  return r.status === 200;
}

async function setRole(id, role, full_name) {
  const r = await req(`/rest/v1/users?id=eq.${id}`, "PATCH",
    { role, full_name, is_verified: true },
    { Prefer: "return=minimal" }
  );
  return r.status === 204 || r.status === 200;
}

async function upsertRole(id, role, full_name) {
  const r = await req(`/rest/v1/users`, "POST",
    { id, role, full_name, is_verified: true },
    { Prefer: "resolution=merge-duplicates,return=minimal" }
  );
  return r.status === 201 || r.status === 200 || r.status === 204;
}

async function createBucket() {
  const r = await req("/storage/v1/bucket", "POST",
    { id: "listing-images", name: "listing-images", public: true, fileSizeLimit: 10485760 });
  return r.status === 200 || r.status === 201 || r.status === 409;
}

(async () => {
  console.log("\n🚀 LocalMart — Activating all accounts\n");

  const existing = await listUsers();
  if (!existing.length) {
    console.error("❌ Could not list users — check the service role key and try again.");
    process.exit(1);
  }

  const byEmail = Object.fromEntries(existing.map(u => [u.email, u]));

  for (const u of USERS) {
    process.stdout.write(`  ${u.email.padEnd(38)} `);
    let au = byEmail[u.email];

    if (!au) {
      // Create via admin API
      const cr = await req("/auth/v1/admin/users", "POST",
        { email: u.email, password: u.password, email_confirm: true, user_metadata: { full_name: u.name } });
      au = cr.body;
      process.stdout.write("created ");
    } else {
      await confirmUser(au.id);
      await updatePassword(au.id, u.password);
      process.stdout.write("confirmed+pw-reset ");
    }

    const roleOk = await upsertRole(au.id, u.role, u.name);
    console.log(`→ role:${u.role} ${roleOk ? "✅" : "⚠️ (run QUICK-FIX.sql for roles)"}`);
    await new Promise(r => setTimeout(r, 300));
  }

  process.stdout.write("\n  Storage bucket … ");
  const bOk = await createBucket();
  console.log(bOk ? "✅ listing-images ready" : "⚠️ (run QUICK-FIX.sql)");

  console.log("\n✅ Done! Login at: https://localmart-app.vercel.app/auth/login\n");
  console.log("  CEO   : shahirsha215.s@gmail.com    / Admin@123  → /dashboard");
  console.log("  Board : shaikshahir215455@gmail.com / Admin@123  → /dashboard");
  console.log("  Agent : shaiksalma863975@gmail.com  / Agent@123  → /agent");
  console.log("  Buyer : contactgetjob786@gmail.com  / Buyer@123  → /my-listings\n");
})();
