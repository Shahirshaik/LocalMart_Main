/**
 * LocalMart — Send Password-Setup Emails
 * ─────────────────────────────────────────────────────────
 * Sends a "Set your password" email to every user so they
 * can choose their own password and log in immediately.
 *
 * Run AFTER the SQL has been executed in Supabase:
 *   node send-invites.js
 */

const fs    = require("fs");
const path  = require("path");
const https = require("https");

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

const env      = loadEnv(path.join(__dirname, ".env.local"));
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const HOST     = new URL(URL_BASE).hostname;

const USERS = [
  { email: "shahirsha215.s@gmail.com",    role: "CEO          " },
  { email: "shaikshahir215455@gmail.com", role: "Board        " },
  { email: "shaiksalma863975@gmail.com",  role: "Agent 1      " },
  { email: "shaikshahir65@gmail.com",     role: "Agent 2      " },
  { email: "contactgetjob786@gmail.com",  role: "Buyer 1      " },
  { email: "shaiknishar312@gmail.com",    role: "Buyer 2      " },
  { email: "shaiknishar81@gmail.com",     role: "Vendor       " },
];

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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log("\n📧  LocalMart — Sending password-setup emails");
  console.log("─".repeat(52));
  console.log("Project :", HOST);
  console.log("─".repeat(52));
  console.log();

  let ok = 0, fail = 0;

  for (const u of USERS) {
    process.stdout.write(`  ${u.role} ${u.email} … `);

    const r = await req(HOST, "/auth/v1/recover", "POST",
      {
        email:      u.email,
        redirectTo: "http://localhost:3000/auth/callback",
      },
      { apikey: ANON_KEY, Authorization: "Bearer " + ANON_KEY }
    );

    if (r.status === 200) {
      process.stdout.write("✅ email sent\n");
      ok++;
    } else if (r.status === 429) {
      process.stdout.write("⚠️  rate-limited — wait 1 hour and re-run\n");
      fail++;
    } else {
      process.stdout.write(`❌ ${r.status} — ${JSON.stringify(r.body).slice(0, 80)}\n`);
      fail++;
    }

    // Supabase free tier: ~4 emails/hour cap.  Space them out.
    await sleep(2000);
  }

  console.log();
  console.log("─".repeat(52));
  console.log(`✅ ${ok} sent   ❌ ${fail} failed`);
  console.log();
  console.log("Each user will receive an email with a link:");
  console.log('  "Set Password for LocalMart"');
  console.log();
  console.log("Flow after they click the link:");
  console.log("  1. They land on → http://localhost:3000/auth/update-password");
  console.log("  2. They set their own password");
  console.log("  3. Auto-redirected to their dashboard");
  console.log("─".repeat(52) + "\n");
})();
