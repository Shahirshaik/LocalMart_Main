/**
 * Sends password-setup emails only to the 2 rate-limited accounts.
 * Run this 1 hour after send-invites.js:
 *   node send-invites-remaining.js
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
const HOST     = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const REMAINING = [
  { email: "shaikshahir215455@gmail.com", role: "Board  " },
  { email: "shaikshahir65@gmail.com",     role: "Agent 2" },
];

function req(host, urlPath, method, body, headers) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = { hostname: host, path: urlPath, method,
      headers: { "Content-Type": "application/json", ...headers,
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}) } };
    const r = https.request(opts, (res) => {
      let d = ""; res.on("data", (c) => (d += c));
      res.on("end", () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
    });
    r.on("error", reject); if (data) r.write(data); r.end();
  });
}

(async () => {
  console.log("\n📧  Sending remaining 2 password-setup emails\n");
  for (const u of REMAINING) {
    process.stdout.write(`  ${u.role}  ${u.email} … `);
    const r = await req(HOST, "/auth/v1/recover", "POST",
      { email: u.email, redirectTo: "http://localhost:3000/auth/callback" },
      { apikey: ANON_KEY, Authorization: "Bearer " + ANON_KEY }
    );
    if (r.status === 200) process.stdout.write("✅ sent\n");
    else if (r.status === 429) process.stdout.write("⚠️  still rate-limited — try again later\n");
    else process.stdout.write(`❌ ${r.status}\n`);
    await new Promise(res => setTimeout(res, 3000));
  }
  console.log("\n✅ Done.\n");
})();
