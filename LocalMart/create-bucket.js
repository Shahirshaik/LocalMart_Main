/**
 * LocalMart — Create Supabase Storage Bucket
 * ─────────────────────────────────────────────
 * Fixes the "bucket not found" error by creating the
 * 'listing-images' bucket via the Supabase Storage API.
 *
 * Run:  node create-bucket.js
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

const env      = loadEnv(path.join(__dirname, ".env.local"));
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SVC_KEY  = env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!URL_BASE || !ANON_KEY) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL / ANON_KEY missing from .env.local");
  process.exit(1);
}

const HOST = new URL(URL_BASE).hostname;
// Auth key: prefer service role (more permissions), fall back to anon
const AUTH_KEY = SVC_KEY || ANON_KEY;

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

async function createBucket() {
  console.log("\n🪣  LocalMart — Storage Bucket Setup");
  console.log("─".repeat(46));
  console.log("Project :", HOST);
  console.log("Auth key:", SVC_KEY ? "✅ Service Role (admin)" : "⚠️  Anon key (limited)");
  console.log("─".repeat(46));

  // ── Try to create the bucket ────────────────────────────────
  console.log("\n📦 Creating 'listing-images' bucket …");

  const r = await req(HOST, "/storage/v1/bucket", "POST",
    {
      id:              "listing-images",
      name:            "listing-images",
      public:          true,
      fileSizeLimit:   10485760,   // 10 MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    },
    { apikey: AUTH_KEY, Authorization: "Bearer " + AUTH_KEY }
  );

  if (r.status === 200 || r.status === 201) {
    console.log("  ✅ Bucket created successfully!");
    printSuccess();
    return;
  }

  if (r.status === 409 || JSON.stringify(r.body).toLowerCase().includes("already exist")) {
    console.log("  ℹ️  Bucket already exists — updating size limit to 10 MB …");
    // Patch the existing bucket
    const p = await req(HOST, "/storage/v1/bucket/listing-images", "PUT",
      { id: "listing-images", name: "listing-images", public: true, fileSizeLimit: 10485760 },
      { apikey: AUTH_KEY, Authorization: "Bearer " + AUTH_KEY }
    );
    if (p.status < 300) {
      console.log("  ✅ Bucket updated!");
      printSuccess();
    } else {
      console.log("  ⚠️  Could not update bucket:", JSON.stringify(p.body).slice(0, 200));
      printManualSteps();
    }
    return;
  }

  // Permission error — likely need service role key
  if (r.status === 400 || r.status === 403) {
    console.log("  ❌ Permission denied (status " + r.status + ").");
    console.log("  Error:", JSON.stringify(r.body).slice(0, 200));

    if (!SVC_KEY) {
      console.log("\n  💡 Add SUPABASE_SERVICE_ROLE_KEY to .env.local and re-run:");
      console.log("     Dashboard → Project Settings → API → Service Role Secret\n");
    }
    printManualSteps();
    return;
  }

  console.log("  ❌ Unexpected response (" + r.status + "):", JSON.stringify(r.body).slice(0, 200));
  printManualSteps();
}

function printSuccess() {
  console.log("\n✅ Storage is ready. Photo uploads will work now.");
  console.log("\nBucket details:");
  console.log("  Name         : listing-images");
  console.log("  Public       : yes (anyone can view photos)");
  console.log("  Max file size: 10 MB");
  console.log("  Allowed types: JPEG, PNG, WEBP, GIF");
}

function printManualSteps() {
  console.log("\n─".repeat(46));
  console.log("📋 Alternative: create the bucket manually in 30 seconds:\n");
  console.log("  1. Open https://supabase.com/dashboard");
  console.log("  2. Your project → Storage → New Bucket");
  console.log("  3. Name: listing-images");
  console.log("  4. ✅ Check 'Public bucket'");
  console.log("  5. File size limit: 10485760  (= 10 MB)");
  console.log("  6. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif");
  console.log("  7. Click Create");
  console.log("\n  Then run the SQL file in SQL Editor:");
  console.log("  supabase/add-photo-agent-features.sql");
  console.log("─".repeat(46) + "\n");
}

createBucket().catch(console.error);
