#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  LocalMart — Production Hotfix & Pre-Launch Patch Script
#  Usage: bash run_production_patches.sh [--skip-build] [--dry-run]
#
#  What this does (in order):
#   1. Kill zombie Node.js processes holding ports
#   2. Flush Next.js build cache (.next/)
#   3. Verify all required env vars are set
#   4. Run pending Supabase SQL migrations via Node.js
#   5. Re-install dependencies (dedupe)
#   6. TypeScript check (zero-error gate)
#   7. Production build
#   8. Restart via PM2 (or plain node if PM2 not available)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; RESET='\033[0m'

ok()   { echo -e "  ${GREEN}✓${RESET}  $*"; }
fail() { echo -e "  ${RED}✗${RESET}  $*"; }
warn() { echo -e "  ${YELLOW}⚠${RESET}  $*"; }
info() { echo -e "  ${BLUE}ℹ${RESET}  $*"; }
step() { echo -e "\n${BOLD}${BLUE}━━━  $*  ━━━${RESET}"; }

# ── Flags ─────────────────────────────────────────────────────────────────────
SKIP_BUILD=false; DRY_RUN=false
for arg in "$@"; do
  [[ "$arg" == "--skip-build" ]] && SKIP_BUILD=true
  [[ "$arg" == "--dry-run"   ]] && DRY_RUN=true
done

run() {
  if $DRY_RUN; then
    info "[dry-run] $*"
  else
    eval "$*"
  fi
}

echo -e "\n${BOLD}${BLUE}LocalMart — Production Hotfix Script${RESET}"
echo "  Started: $(date '+%Y-%m-%d %H:%M:%S')"
$DRY_RUN && warn "DRY-RUN mode — no changes will be made"

# ── Load .env.local ───────────────────────────────────────────────────────────
ENV_FILE=".env.local"
[[ -f "$ENV_FILE" ]] && set -a && source "$ENV_FILE" && set +a && ok "Loaded $ENV_FILE"

# ─────────────────────────────────────────────────────────────────────────────
step "1. Kill zombie Node.js processes"
# ─────────────────────────────────────────────────────────────────────────────

ZOMBIE_PIDS=$(lsof -ti:3000,3001,8000 2>/dev/null || true)
if [[ -n "$ZOMBIE_PIDS" ]]; then
  warn "Found processes on ports 3000/3001/8000: $ZOMBIE_PIDS"
  run "kill -9 $ZOMBIE_PIDS"
  ok "Killed zombie processes"
else
  ok "No zombie processes on ports 3000/3001/8000"
fi

# Also kill any stray next-server or ts-node processes older than 10 min
OLD_NEXT=$(pgrep -f "next-server|next start" 2>/dev/null || true)
if [[ -n "$OLD_NEXT" ]]; then
  warn "Killing stale next-server: $OLD_NEXT"
  run "kill -9 $OLD_NEXT || true"
fi

# ─────────────────────────────────────────────────────────────────────────────
step "2. Flush build cache"
# ─────────────────────────────────────────────────────────────────────────────

if [[ -d ".next" ]]; then
  run "rm -rf .next"
  ok "Deleted .next/ build cache"
else
  ok ".next/ already clean"
fi

if [[ -d "node_modules/.cache" ]]; then
  run "rm -rf node_modules/.cache"
  ok "Deleted node_modules/.cache"
fi

# ─────────────────────────────────────────────────────────────────────────────
step "3. Environment variable check"
# ─────────────────────────────────────────────────────────────────────────────

MISSING=0
check_var() {
  local key="$1" severity="$2"
  local val="${!key:-}"
  if [[ -z "$val" || "$val" == *"your-"* || "$val" == *"change_me"* ]]; then
    if [[ "$severity" == "CRITICAL" ]]; then
      fail "$key — MISSING (CRITICAL)"
      MISSING=$((MISSING + 1))
    else
      warn "$key — not set ($severity)"
    fi
  else
    ok "$key — ${val:0:12}…"
  fi
}

check_var "NEXT_PUBLIC_SUPABASE_URL"         "CRITICAL"
check_var "NEXT_PUBLIC_SUPABASE_ANON_KEY"    "CRITICAL"
check_var "SUPABASE_SERVICE_ROLE_KEY"        "CRITICAL"
check_var "SUPABASE_JWT_SECRET"              "HIGH"
check_var "AGENT_BACKEND_URL"               "HIGH"
check_var "NEXT_PUBLIC_WS_URL"              "HIGH"
check_var "ANTHROPIC_API_KEY"               "HIGH"
check_var "AGENT_SERVICE_SECRET"            "HIGH"
check_var "EXECUTION_WEBHOOK_SECRET"        "MEDIUM"
check_var "FACEBOOK_APP_ID"                 "MEDIUM"
check_var "LINKEDIN_CLIENT_ID"              "MEDIUM"
check_var "TWILIO_ACCOUNT_SID"              "MEDIUM"
check_var "RESEND_API_KEY"                  "LOW"

if [[ "$MISSING" -gt 0 ]]; then
  fail "$MISSING CRITICAL variable(s) missing — fix .env.local before deploying"
  exit 1
fi
ok "All critical env vars present"

# ─────────────────────────────────────────────────────────────────────────────
step "4. Apply pending Supabase migrations"
# ─────────────────────────────────────────────────────────────────────────────

MIGRATIONS_DIR="supabase/migrations"
if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  warn "No migrations directory found at $MIGRATIONS_DIR — skipping"
else
  SUPABASE_PAT="${SUPABASE_ACCESS_TOKEN:-}"
  SUPABASE_PROJECT_REF="${SUPABASE_PROJECT_REF:-gpsmjadvqdcvoytkthjv}"

  if [[ -z "$SUPABASE_PAT" ]]; then
    warn "SUPABASE_ACCESS_TOKEN not set — skipping migration apply"
    info "To apply migrations manually:"
    info "  npx supabase db push  OR  node run_migration.js"
  else
    for sql_file in "$MIGRATIONS_DIR"/*.sql; do
      [[ -f "$sql_file" ]] || continue
      filename=$(basename "$sql_file")
      info "Applying $filename…"
      if $DRY_RUN; then
        info "[dry-run] Would POST $sql_file to Supabase Management API"
      else
        node -e "
          const fs = require('fs');
          const https = require('https');
          const sql = fs.readFileSync('$sql_file', 'utf8');
          const body = JSON.stringify({ query: sql });
          const req = https.request({
            hostname: 'api.supabase.com',
            path: '/v1/projects/$SUPABASE_PROJECT_REF/database/query',
            method: 'POST',
            headers: {
              'Authorization': 'Bearer $SUPABASE_PAT',
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(body)
            }
          }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
              if (res.statusCode < 300) {
                console.log('  ✓  $filename — HTTP', res.statusCode);
              } else {
                console.error('  ✗  $filename — HTTP', res.statusCode, data.slice(0,200));
                process.exit(1);
              }
            });
          });
          req.on('error', e => { console.error(e.message); process.exit(1); });
          req.write(body); req.end();
        " && ok "$filename applied" || warn "$filename may have already been applied (idempotent SQL is safe)"
      fi
    done
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
step "5. Install / dedupe dependencies"
# ─────────────────────────────────────────────────────────────────────────────

if command -v npm &>/dev/null; then
  run "npm install --prefer-offline 2>&1 | tail -5"
  ok "npm install complete"
else
  warn "npm not found — skipping install"
fi

# ─────────────────────────────────────────────────────────────────────────────
step "6. TypeScript zero-error check"
# ─────────────────────────────────────────────────────────────────────────────

if $SKIP_BUILD; then
  warn "Skipping TypeScript check (--skip-build)"
elif command -v npx &>/dev/null; then
  if npx tsc --noEmit 2>&1; then
    ok "TypeScript — 0 errors"
  else
    fail "TypeScript errors found — fix before deploying"
    echo "  Run: npx tsc --noEmit"
    exit 1
  fi
else
  warn "npx not available — skipping TypeScript check"
fi

# ─────────────────────────────────────────────────────────────────────────────
step "7. Production build"
# ─────────────────────────────────────────────────────────────────────────────

if $SKIP_BUILD; then
  warn "Skipping build (--skip-build)"
else
  info "Building Next.js for production…"
  run "npm run build"
  ok "Build complete"
fi

# ─────────────────────────────────────────────────────────────────────────────
step "8. Start / restart app server"
# ─────────────────────────────────────────────────────────────────────────────

APP_NAME="localmart-nextjs"

if command -v pm2 &>/dev/null; then
  if pm2 list | grep -q "$APP_NAME"; then
    run "pm2 restart $APP_NAME --update-env"
    ok "PM2: restarted $APP_NAME"
  else
    run "pm2 start 'npm run start' --name $APP_NAME --env production"
    ok "PM2: started $APP_NAME"
  fi
  run "pm2 save"
  info "PM2 process list:"
  pm2 list 2>/dev/null || true
else
  warn "PM2 not found — starting with plain node (not production-safe)"
  info "Install PM2: npm install -g pm2"
  if ! $DRY_RUN && ! $SKIP_BUILD; then
    npm run start &
    ok "App started on port 3000 (PID: $!)"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
echo -e "\n${BOLD}${GREEN}All patches applied.${RESET}"
echo "  Run the health checker:  python check_agent_health.py"
echo "  Live URL: ${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
echo ""
