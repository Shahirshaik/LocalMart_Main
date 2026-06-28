#!/usr/bin/env python3
"""
LocalMart — Automated Agent & Infrastructure Health Checker
============================================================
Run from:  C:\\LocalMart-1\\LocalMart_Main\\LocalMart\\
Usage:     python check_agent_health.py [--env .env.local]

Checks:
  1. Required environment variables (with severity grading)
  2. Supabase REST API reachability + table presence
  3. Python Agent Backend HTTP health endpoint
  4. WebSocket server handshake (wss:// or ws://)
  5. Supabase JWT validity
  6. Redis connectivity (if REDIS_PASSWORD is set)
  7. Marketing token freshness (Facebook, LinkedIn, Twilio)
"""

import os
import sys
import json
import time
import socket
import asyncio
import argparse
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path
from typing import Dict, Tuple, Optional

# ── ANSI colours ──────────────────────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
BLUE   = "\033[94m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def ok(label: str, detail: str = ""):
    print(f"  {GREEN}✓{RESET}  {label:<46} {BLUE}{detail}{RESET}")

def fail(label: str, detail: str = ""):
    print(f"  {RED}✗{RESET}  {label:<46} {RED}{detail}{RESET}")

def warn(label: str, detail: str = ""):
    print(f"  {YELLOW}⚠{RESET}  {label:<46} {YELLOW}{detail}{RESET}")

def info(label: str, detail: str = ""):
    print(f"  {CYAN}ℹ{RESET}  {label:<46} {detail}")

def section(title: str):
    print(f"\n{BOLD}{BLUE}{'━'*62}\n  {title}\n{'━'*62}{RESET}")

# ── Env loader ────────────────────────────────────────────────────────────────
def load_env(env_file: str) -> Dict[str, str]:
    """Load .env file; fall back up the tree; merge with OS env."""
    env: Dict[str, str] = dict(os.environ)
    for candidate in [env_file, f"LocalMart_Main/LocalMart/{env_file}", f"../{env_file}"]:
        p = Path(candidate)
        if p.exists():
            for raw in p.read_text(encoding="utf-8").splitlines():
                raw = raw.strip()
                if not raw or raw.startswith("#") or "=" not in raw:
                    continue
                key, _, val = raw.partition("=")
                env[key.strip()] = val.strip().strip('"').strip("'")
            info("Loaded env from", str(p.resolve()))
            break
    return env

# ── Required vars catalogue ───────────────────────────────────────────────────
REQUIRED_VARS = [
    # (env_key, severity, description)
    ("NEXT_PUBLIC_SUPABASE_URL",        "CRITICAL", "Supabase project REST + Realtime URL"),
    ("NEXT_PUBLIC_SUPABASE_ANON_KEY",   "CRITICAL", "Supabase anonymous auth key"),
    ("SUPABASE_SERVICE_ROLE_KEY",       "CRITICAL", "Server-side Supabase admin key"),
    ("SUPABASE_JWT_SECRET",             "HIGH",     "JWT verification secret (Settings → API)"),
    ("AGENT_BACKEND_URL",               "HIGH",     "Python agent orchestrator base URL"),
    ("NEXT_PUBLIC_WS_URL",              "HIGH",     "WebSocket URL for dashboard events"),
    ("ANTHROPIC_API_KEY",               "HIGH",     "Claude API key for AI agent reasoning"),
    ("AGENT_SERVICE_SECRET",            "HIGH",     "Inter-service HMAC secret (≥32 chars)"),
    ("EXECUTION_WEBHOOK_SECRET",        "HIGH",     "Webhook payload signature secret"),
    ("FACEBOOK_APP_ID",                 "MEDIUM",   "Facebook/Instagram marketing agent"),
    ("FACEBOOK_APP_SECRET",             "MEDIUM",   "Facebook OAuth refresh flow"),
    ("FACEBOOK_PAGE_ID",                "MEDIUM",   "Facebook page for post publishing"),
    ("INSTAGRAM_BUSINESS_ACCOUNT_ID",   "MEDIUM",   "Instagram business account"),
    ("LINKEDIN_CLIENT_ID",              "MEDIUM",   "LinkedIn marketing OAuth"),
    ("LINKEDIN_CLIENT_SECRET",          "MEDIUM",   "LinkedIn OAuth refresh token flow"),
    ("LINKEDIN_ORGANIZATION_URN",       "MEDIUM",   "LinkedIn org page URN for posts"),
    ("TWILIO_ACCOUNT_SID",              "MEDIUM",   "Twilio WhatsApp outbound messages"),
    ("TWILIO_AUTH_TOKEN",               "MEDIUM",   "Twilio auth"),
    ("RESEND_API_KEY",                  "LOW",      "Transactional email delivery"),
    ("REDIS_PASSWORD",                  "MEDIUM",   "Redis agent task queue"),
]

PLACEHOLDER_PATTERNS = (
    "your-", "...", "change_me", "XXXXXXX", "ACxxxxxxx",
    "eyJhbGci...truncated", "sk-ant-api03-...", "re_...",
)

def is_placeholder(val: str) -> bool:
    if not val:
        return True
    for pat in PLACEHOLDER_PATTERNS:
        if val.lower().startswith(pat.lower()) or pat.lower() in val.lower():
            return True
    return False

def check_env_vars(env: Dict[str, str]) -> Dict[str, int]:
    section("1.  Environment Variables — Completeness & Severity Audit")
    counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "ok": 0}
    for key, severity, desc in REQUIRED_VARS:
        val = env.get(key, "")
        if not val or is_placeholder(val):
            counts[severity] += 1
            masked = "(empty)"
            if severity == "CRITICAL":
                fail(key, f"MISSING  ← {desc}")
            elif severity == "HIGH":
                fail(key, f"UNSET    ← {desc}")
            elif severity == "MEDIUM":
                warn(key, f"UNSET    ← {desc}")
            else:
                warn(key, f"optional — {desc}")
        else:
            masked = val[:10] + "…" if len(val) > 10 else val
            ok(key, f"{masked}  [{severity}]")
            counts["ok"] += 1

    # Extra sanity checks
    secret = env.get("AGENT_SERVICE_SECRET", "")
    if secret and not is_placeholder(secret) and len(secret) < 32:
        warn("AGENT_SERVICE_SECRET", f"too short ({len(secret)} chars, need ≥32) — brute-forceable")

    webhook_secret = env.get("EXECUTION_WEBHOOK_SECRET", "")
    if webhook_secret and not is_placeholder(webhook_secret) and len(webhook_secret) < 32:
        warn("EXECUTION_WEBHOOK_SECRET", f"too short ({len(webhook_secret)} chars, need ≥32)")

    return counts

# ── HTTP helper ───────────────────────────────────────────────────────────────
def http_get(url: str, headers: Optional[Dict] = None, timeout: int = 6) -> Tuple[int, str]:
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read(2000).decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read(500).decode("utf-8", errors="replace")
    except Exception as e:
        return 0, str(e)

def http_post(url: str, payload: dict, headers: Optional[Dict] = None, timeout: int = 8) -> Tuple[int, str]:
    data = json.dumps(payload).encode("utf-8")
    h = {"Content-Type": "application/json", **(headers or {})}
    req = urllib.request.Request(url, data=data, headers=h, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read(2000).decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read(500).decode("utf-8", errors="replace")
    except Exception as e:
        return 0, str(e)

# ── Supabase checks ───────────────────────────────────────────────────────────
REQUIRED_TABLES = [
    "users", "listings", "conversations", "messages",
    "notifications", "villages",
]

def check_supabase(env: Dict[str, str]) -> bool:
    section("2.  Supabase Database — REST API + Schema")
    url  = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    anon = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    svc  = env.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not url or is_placeholder(url):
        fail("Supabase URL", "not configured — skipping all DB checks")
        return False

    # 1. REST health ping
    status, body = http_get(
        f"{url}/rest/v1/",
        headers={"apikey": anon, "Authorization": f"Bearer {anon}"},
    )
    if status == 200:
        ok("Supabase REST API", f"HTTP {status} — online")
    else:
        fail("Supabase REST API", f"HTTP {status} — {body[:80]}")
        return False

    # 2. Table presence (using service role to bypass RLS)
    key = svc if svc and not is_placeholder(svc) else anon
    for table in REQUIRED_TABLES:
        s, b = http_get(
            f"{url}/rest/v1/{table}?select=id&limit=1",
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
        )
        if s in (200, 206):
            ok(f"Table: {table}", "exists + readable")
        elif s == 401:
            warn(f"Table: {table}", "RLS blocking — use service role key")
        elif s == 404:
            fail(f"Table: {table}", "NOT FOUND — run migration")
        else:
            warn(f"Table: {table}", f"HTTP {s} — {b[:60]}")

    # 3. Realtime WebSocket (just a TCP connect to port 443)
    try:
        host = url.replace("https://", "").replace("http://", "").split("/")[0]
        sock = socket.create_connection((host, 443), timeout=5)
        sock.close()
        ok("Supabase Realtime host", f"{host}:443 — reachable")
    except Exception as e:
        fail("Supabase Realtime host", str(e))

    return True

# ── Agent backend checks ──────────────────────────────────────────────────────
def check_agent_backend(env: Dict[str, str]) -> bool:
    section("3.  Python Agent Backend (FastAPI)")
    base = env.get("AGENT_BACKEND_URL", "http://localhost:8000")
    if is_placeholder(base):
        warn("AGENT_BACKEND_URL", "not set — assuming http://localhost:8000")
        base = "http://localhost:8000"

    # Health endpoint
    status, body = http_get(f"{base}/health")
    if status == 200:
        try:
            data = json.loads(body)
            ok("Agent backend /health", f"status={data.get('status','?')}  version={data.get('version','?')}")
        except Exception:
            ok("Agent backend /health", f"HTTP {status} — online")
    elif status == 0:
        fail("Agent backend /health", f"Connection refused at {base} — is main.py running?")
        return False
    else:
        fail("Agent backend /health", f"HTTP {status} — {body[:80]}")
        return False

    # Agent list / status
    for path in ["/agents/status", "/agents/list"]:
        s, b = http_get(f"{base}{path}")
        if s == 200:
            ok(f"Agent endpoint {path}", "OK")
        elif s == 404:
            warn(f"Agent endpoint {path}", "not found (optional)")
        else:
            warn(f"Agent endpoint {path}", f"HTTP {s}")

    # Dry-run trigger (no side effects)
    s, b = http_post(
        f"{base}/agents/run/full",
        {"dry_run": True, "triggered_by": "health_check"},
    )
    if s in (200, 202):
        ok("Agent /agents/run/full dry-run", "accepted")
    elif s == 422:
        ok("Agent /agents/run/full endpoint", f"reachable (422 validation — dry_run may not be supported)")
    elif s == 0:
        fail("Agent /agents/run/full", "no response — backend may be partially up")
    else:
        warn("Agent /agents/run/full", f"HTTP {s} — {b[:80]}")

    return True

# ── WebSocket check ───────────────────────────────────────────────────────────
def check_websocket(env: Dict[str, str]) -> bool:
    section("4.  WebSocket Server — Dashboard Event Bus")
    ws_url = env.get("NEXT_PUBLIC_WS_URL", "")
    if not ws_url or is_placeholder(ws_url):
        warn("NEXT_PUBLIC_WS_URL", "not set — dashboard will not receive agent events")
        return False

    # Convert wss:// → https:// for TCP check
    host_part = ws_url.replace("wss://", "").replace("ws://", "").split("/")[0]
    port = 443 if ws_url.startswith("wss://") else 80
    if ":" in host_part:
        parts = host_part.rsplit(":", 1)
        host_part = parts[0]
        try: port = int(parts[1])
        except ValueError: pass

    try:
        sock = socket.create_connection((host_part, port), timeout=5)
        sock.close()
        ok(f"WebSocket host {host_part}:{port}", "TCP reachable")
    except Exception as e:
        fail(f"WebSocket host {host_part}:{port}", str(e))
        info("Fix", "Start your WS server or check NEXT_PUBLIC_WS_URL in Vercel env")
        return False

    # Try the HTTP upgrade probe (101 Switching Protocols expected)
    ws_http = ws_url.replace("wss://", "https://").replace("ws://", "http://")
    s, b = http_get(ws_http, headers={
        "Upgrade": "websocket",
        "Connection": "Upgrade",
        "Sec-WebSocket-Version": "13",
        "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==",
    })
    if s == 101:
        ok("WebSocket upgrade handshake", "HTTP 101 — WS server confirmed")
    elif s in (400, 426):
        warn("WebSocket upgrade handshake", f"HTTP {s} — server exists but rejected bare HTTP probe (expected for wss://)")
    elif s == 0:
        fail("WebSocket upgrade handshake", "no response")
    else:
        warn("WebSocket upgrade handshake", f"HTTP {s} — check nginx proxy config")

    return True

# ── JWT secret check ──────────────────────────────────────────────────────────
def check_jwt(env: Dict[str, str]):
    section("5.  JWT Secret Validity")
    secret = env.get("SUPABASE_JWT_SECRET", "")
    if not secret or is_placeholder(secret):
        fail("SUPABASE_JWT_SECRET", "missing — backend cannot verify user tokens")
        return

    if len(secret) < 32:
        warn("SUPABASE_JWT_SECRET", f"only {len(secret)} chars — Supabase requires ≥32")
    else:
        ok("SUPABASE_JWT_SECRET", f"length={len(secret)} chars — looks valid")

    # Try to decode the anon key's sub-header (no signature check needed for format)
    anon = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    if anon and not is_placeholder(anon):
        try:
            import base64
            parts = anon.split(".")
            if len(parts) == 3:
                padded = parts[1] + "=="
                payload = json.loads(base64.b64decode(padded).decode())
                role    = payload.get("role", "?")
                exp     = payload.get("exp", 0)
                if exp and exp < time.time():
                    fail("Anon key expiry", f"EXPIRED at {time.ctime(exp)} — regenerate in Supabase")
                else:
                    exp_str = time.ctime(exp) if exp else "never"
                    ok("Anon key JWT structure", f"role={role}  exp={exp_str}")
        except Exception as e:
            warn("Anon key JWT structure", f"could not decode: {e}")

# ── Redis check ───────────────────────────────────────────────────────────────
def check_redis(env: Dict[str, str]):
    section("6.  Redis — Agent Task Queue")
    password = env.get("REDIS_PASSWORD", "")
    if not password or is_placeholder(password):
        warn("REDIS_PASSWORD", "not configured — task queue disabled")
        return

    redis_host = env.get("REDIS_HOST", "localhost")
    redis_port = int(env.get("REDIS_PORT", "6379"))
    try:
        sock = socket.create_connection((redis_host, redis_port), timeout=3)
        # Send PING command
        sock.send(b"*1\r\n$4\r\nPING\r\n")
        resp = sock.recv(32)
        sock.close()
        if b"+PONG" in resp:
            ok(f"Redis {redis_host}:{redis_port}", "PONG — connected")
        else:
            warn(f"Redis {redis_host}:{redis_port}", f"unexpected response: {resp[:20]}")
    except Exception as e:
        fail(f"Redis {redis_host}:{redis_port}", str(e))
        info("Fix", "docker run -d -p 6379:6379 redis:7 redis-server --requirepass $REDIS_PASSWORD")

# ── Marketing token check ─────────────────────────────────────────────────────
def check_marketing_tokens(env: Dict[str, str]):
    section("7.  Marketing Agent — OAuth Token Status")
    checks = [
        ("FACEBOOK_APP_ID",               "Facebook App ID"),
        ("FACEBOOK_APP_SECRET",           "Facebook App Secret"),
        ("FACEBOOK_PAGE_ID",              "Facebook Page ID"),
        ("INSTAGRAM_BUSINESS_ACCOUNT_ID", "Instagram Business Account"),
        ("LINKEDIN_CLIENT_ID",            "LinkedIn Client ID"),
        ("LINKEDIN_CLIENT_SECRET",        "LinkedIn Client Secret"),
        ("LINKEDIN_ORGANIZATION_URN",     "LinkedIn Org URN"),
        ("TWILIO_ACCOUNT_SID",            "Twilio SID"),
        ("TWILIO_AUTH_TOKEN",             "Twilio Auth Token"),
    ]
    all_missing = True
    for key, label in checks:
        val = env.get(key, "")
        if val and not is_placeholder(val):
            ok(label, val[:12] + "…")
            all_missing = False
        else:
            warn(label, "not set — marketing posts for this channel will fail")

    if all_missing:
        print(f"\n  {RED}All marketing tokens are missing.{RESET}")
        print(f"  The Marketing Agent will log errors and skip every channel.")
        print(f"  Fill in .env.local (or Vercel env vars) from the platform OAuth consoles.\n")

    # Validate Facebook token format
    fb_token = env.get("FACEBOOK_USER_TOKEN", "")
    if fb_token and not is_placeholder(fb_token):
        if len(fb_token) > 100:
            ok("Facebook User Token", "looks like a long-lived token (>100 chars)")
        else:
            warn("Facebook User Token", f"only {len(fb_token)} chars — may be short-lived; run token_refresh.py")

    # Validate Twilio SID format
    sid = env.get("TWILIO_ACCOUNT_SID", "")
    if sid and not is_placeholder(sid) and not sid.startswith("AC"):
        fail("Twilio Account SID", "must start with 'AC' — check your Twilio console")

# ── Summary ───────────────────────────────────────────────────────────────────
def print_summary(env_counts: Dict[str, int], supabase_ok: bool, backend_ok: bool, ws_ok: bool):
    section("Summary & Recommended Actions")
    total_issues = env_counts["CRITICAL"] + env_counts["HIGH"]

    if env_counts["CRITICAL"] > 0:
        print(f"  {RED}{BOLD}CRITICAL ({env_counts['CRITICAL']} vars missing){RESET}")
        print(f"  → App WILL NOT FUNCTION. Fill these in .env.local and re-run.\n")

    if env_counts["HIGH"] > 0:
        print(f"  {YELLOW}{BOLD}HIGH ({env_counts['HIGH']} vars missing){RESET}")
        print(f"  → Agents / WebSocket / AI features will silently fail.\n")

    if not backend_ok:
        print(f"  {RED}Agent backend offline{RESET}")
        print(f"  → cd backend && python main.py   (or docker compose up agent-backend)\n")

    if not ws_ok:
        print(f"  {YELLOW}WebSocket unreachable{RESET}")
        print(f"  → CEO/Board dashboards won't receive real-time updates.\n")
        print(f"  → Ensure nginx proxies /ws/ → ws://localhost:8000/ws/\n")

    if total_issues == 0 and supabase_ok and backend_ok and ws_ok:
        print(f"  {GREEN}{BOLD}All systems HEALTHY ✓{RESET}  LocalMart is ready for users.\n")
    else:
        print(f"  {YELLOW}Fix the issues above, then re-run this script.{RESET}\n")

# ── Entry point ───────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="LocalMart Health Checker")
    parser.add_argument("--env", default=".env.local", help="Path to .env file")
    parser.add_argument("--skip-ws", action="store_true", help="Skip WebSocket check (use in CI)")
    args = parser.parse_args()

    print(f"\n{BOLD}{BLUE}LocalMart — Automated Diagnostic Report{RESET}")
    print(f"  Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")

    env         = load_env(args.env)
    env_counts  = check_env_vars(env)
    sub_ok      = check_supabase(env)
    backend_ok  = check_agent_backend(env)
    ws_ok       = (not args.skip_ws) and check_websocket(env)
    check_jwt(env)
    check_redis(env)
    check_marketing_tokens(env)
    print_summary(env_counts, sub_ok, backend_ok, ws_ok)

if __name__ == "__main__":
    main()
