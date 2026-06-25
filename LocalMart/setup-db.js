/**
 * LocalMart — Automated Database Setup
 * ──────────────────────────────────────────────────────────────
 * What this does:
 *   1. Creates 3 users via Supabase Auth (CEO, Agent, Customer)
 *   2. Prints a combined SQL file path to paste in SQL Editor
 *
 * Run:  node setup-db.js
 */

const fs    = require("fs");
const path  = require("path");
const https = require("https");

// ── Load .env.local ───────────────────────────────────────────
function loadEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  fs.readFileSync(file, "utf8").split("\n").forEach((line) => {
    const eq = line.indexOf("=");
    if (eq < 1 || line.trim().startsWith("#")) return;
    env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  });
  return env;
}

const env        = loadEnv(path.join(__dirname, ".env.local"));
const URL_BASE   = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY   = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SVC_KEY    = env.SUPABASE_SERVICE_ROLE_KEY || "";
const ACC_TOKEN  = env.SUPABASE_ACCESS_TOKEN     || "";

if (!URL_BASE || !ANON_KEY) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL / ANON_KEY missing from .env.local");
  process.exit(1);
}

const HOST = new URL(URL_BASE).hostname;

// ── HTTP helper ───────────────────────────────────────────────
function req(host, urlPath, method, body, headers) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: host,
      path: urlPath,
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    };
    const r = https.request(opts, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

// ── Sign up a user (public endpoint) ─────────────────────────
async function signUp(email, password, fullName) {
  const r = await req(HOST, "/auth/v1/signup", "POST",
    { email, password, options: { data: { full_name: fullName } } },
    { apikey: ANON_KEY, Authorization: "Bearer " + ANON_KEY }
  );
  if (r.status === 200 && r.body?.user?.id) return { ok: true, id: r.body.user.id, existing: false };
  if (r.status === 422 && JSON.stringify(r.body).includes("already registered"))
    return { ok: true, id: null, existing: true };
  return { ok: false, error: JSON.stringify(r.body).slice(0, 200) };
}

// ── Set role via REST (only works if service role key available) ──
async function setRole(userId, role, fullName) {
  if (!SVC_KEY) return false;
  const r = await req(HOST, "/rest/v1/users?id=eq." + userId, "PATCH",
    { role, full_name: fullName, is_verified: true },
    { apikey: SVC_KEY, Authorization: "Bearer " + SVC_KEY, Prefer: "return=minimal" }
  );
  return r.status < 300;
}

// ── Generate combined SQL file ────────────────────────────────
function buildCombinedSQL() {
  const files = [
    "migration-location.sql",
    "seed-ap-villages.sql",
  ];
  const header = `-- ============================================================
-- LocalMart — Combined Setup SQL
-- Paste this ENTIRE file into:
--   Supabase Dashboard → SQL Editor → New Query → Run All
-- Generated: ${new Date().toISOString()}
-- ============================================================\n\n`;

  const body = files.map((f) => {
    const fp = path.join(__dirname, "supabase", f);
    if (!fs.existsSync(fp)) return `-- ⚠️  ${f} not found\n`;
    return `-- ${"─".repeat(58)}\n-- ${f}\n-- ${"─".repeat(58)}\n\n` + fs.readFileSync(fp, "utf8") + "\n\n";
  }).join("");

  const outPath = path.join(__dirname, "supabase", "COMBINED-run-in-sql-editor.sql");
  fs.writeFileSync(outPath, header + body, "utf8");
  return outPath;
}

// ── Main ──────────────────────────────────────────────────────
const USERS = [
  { email: "shaikshahir215455@gmail.com", password: "Boss@215455",  name: "Shaik Shahir",  role: "ceo"      },
  { email: "shaikshahir65@gmail.com",      password: "Salma@123",    name: "Shaik Salma",   role: "agent"    },
  { email: "shahirsha215.s@gmail.com",     password: "Shakib@123",   name: "Shaik Shakib",  role: "customer" },
];

(async () => {
  console.log("\n🛠️  LocalMart Database Setup\n" + "─".repeat(46));
  console.log("Project :", HOST);
  console.log("Anon key:", ANON_KEY ? "✅" : "❌");
  console.log("Svc key :", SVC_KEY  ? "✅ (roles will be set)" : "⚠️  not set — roles need SQL");
  console.log("─".repeat(46));

  // ── Step 1: Create users ──────────────────────────────────
  console.log("\n📋 Step 1 — Creating users via Auth API\n");
  for (const u of USERS) {
    process.stdout.write(`  ${u.role.padEnd(9)} ${u.email} … `);
    const r = await signUp(u.email, u.password, u.name);
    if (r.existing) {
      process.stdout.write("⏭️  already exists\n");
    } else if (r.ok) {
      process.stdout.write("✅ created");
      if (r.id && SVC_KEY) {
        const ok = await setRole(r.id, u.role, u.name);
        process.stdout.write(ok ? " · role set ✅" : " · role needs SQL ⚠️");
      } else if (r.id) {
        process.stdout.write(" · role needs SQL (no svc key)");
      }
      process.stdout.write("\n");
    } else {
      process.stdout.write(`❌ ${r.error}\n`);
    }
  }

  // ── Step 2: Build combined SQL file ──────────────────────
  console.log("\n📄 Step 2 — Building combined SQL file\n");
  const combinedPath = buildCombinedSQL();
  console.log("  ✅ Written to:");
  console.log("  " + combinedPath + "\n");

  // ── Instructions ─────────────────────────────────────────
  console.log("─".repeat(46));
  console.log("✅ Users created (or already existed).\n");
  console.log("🔗 One remaining step — run the SQL in Supabase:\n");
  console.log("   1. Open https://supabase.com/dashboard");
  console.log("   2. Open your project → SQL Editor → New Query");
  console.log("   3. Open the file:");
  console.log("      supabase\\COMBINED-run-in-sql-editor.sql");
  console.log("   4. Select All → Run");
  console.log("\n   This adds the location columns + Pamuru villages.");
  console.log("\n   After that, run the app:");
  console.log("      launch-local.bat");
  console.log("─".repeat(46) + "\n");

  if (!SVC_KEY) {
    console.log("💡 To auto-set user roles, add to .env.local:");
    console.log("   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key");
    console.log("   (Dashboard → Project Settings → API → Service Role Secret)\n");
    console.log("   Or just add these lines to the SQL file before running:\n");
    console.log(`   UPDATE public.users SET role='ceo'::user_role,     full_name='Shaik Shahir'  WHERE email='shaikshahir215455@gmail.com';`);
    console.log(`   UPDATE public.users SET role='agent'::user_role,   full_name='Shaik Salma'   WHERE email='shaikshahir65@gmail.com';`);
    console.log(`   UPDATE public.users SET role='customer'::user_role, full_name='Shaik Shakib'  WHERE email='shahirsha215.s@gmail.com';\n`);
  }
})();
