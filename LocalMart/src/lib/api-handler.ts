/**
 * LocalMart — Resilient API Route Handler
 *
 * Wraps Next.js route handlers with:
 *   • Structured error logging (never leaks stack traces to clients)
 *   • CEO dashboard alert via Supabase `notifications` table
 *   • Circuit-breaker for repeated agent backend failures
 *   • Request/response timing for slow-path detection
 *
 * Usage:
 *   import { withErrorHandling } from "@/lib/api-handler";
 *   export const POST = withErrorHandling(async (req) => { ... });
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@/lib/supabase/server";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ApiHandler = (req: NextRequest, ctx?: unknown) => Promise<NextResponse>;

interface ErrorMeta extends Record<string, unknown> {
  route:      string;
  method:     string;
  message:    string;
  code:       string;
  durationMs: number;
  timestamp:  string;
}

// ── Circuit Breaker (in-memory per serverless instance) ───────────────────────

const CIRCUIT: Record<string, { failures: number; openUntil: number }> = {};
const FAILURE_THRESHOLD = 5;
const OPEN_WINDOW_MS    = 60_000;   // 1 minute

function circuitIsOpen(key: string): boolean {
  const c = CIRCUIT[key];
  if (!c) return false;
  if (c.openUntil && Date.now() < c.openUntil) return true;
  // Half-open: allow next request through
  if (c.openUntil && Date.now() >= c.openUntil) {
    c.openUntil = 0;
    return false;
  }
  return false;
}

function recordFailure(key: string) {
  if (!CIRCUIT[key]) CIRCUIT[key] = { failures: 0, openUntil: 0 };
  CIRCUIT[key].failures++;
  if (CIRCUIT[key].failures >= FAILURE_THRESHOLD) {
    CIRCUIT[key].openUntil = Date.now() + OPEN_WINDOW_MS;
    console.error(`[Circuit] OPEN for ${key} — too many failures (${CIRCUIT[key].failures})`);
  }
}

function recordSuccess(key: string) {
  if (CIRCUIT[key]) {
    CIRCUIT[key].failures = 0;
    CIRCUIT[key].openUntil = 0;
  }
}

// ── CEO Alert ─────────────────────────────────────────────────────────────────

async function alertCEO(meta: ErrorMeta) {
  try {
    const supabase  = await createClient();
    const CEO_EMAIL = process.env.CEO_EMAIL ?? "";
    if (!CEO_EMAIL) return;

    const { data: ceoUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", CEO_EMAIL)
      .single();

    if (!ceoUser?.id) return;

    await supabase.from("notifications").insert({
      user_id: ceoUser.id,
      type:    "system.error",
      title:   `API Error — ${meta.route}`,
      body:    `${meta.method} ${meta.route} failed: ${meta.message} (${meta.durationMs}ms)`,
      is_read: false,
      meta:    meta,
    });
  } catch {
    // Never let the alert mechanism crash the error handler
  }
}

// ── Structured Logger ─────────────────────────────────────────────────────────

function structuredLog(level: "error" | "warn" | "info", meta: Partial<ErrorMeta> & Record<string, unknown>) {
  const entry = {
    level,
    service: "localmart-nextjs",
    ...meta,
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// ── Main Wrapper ──────────────────────────────────────────────────────────────

export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, ctx?: unknown): Promise<NextResponse> => {
    const start  = Date.now();
    const route  = new URL(req.url).pathname;
    const method = req.method;

    // Circuit breaker check for agent backend routes
    const circuitKey = `${method}:${route}`;
    if (circuitIsOpen(circuitKey)) {
      structuredLog("warn", { route, method, message: "Circuit open — fast-fail" });
      return NextResponse.json(
        { error: "Service temporarily unavailable. Retry in 60 seconds." },
        { status: 503 },
      );
    }

    try {
      const response = await handler(req, ctx);
      const durationMs = Date.now() - start;

      // Log slow requests (>2s)
      if (durationMs > 2000) {
        structuredLog("warn", { route, method, durationMs, message: "Slow API response" });
      }

      // Record success for circuit breaker
      if (response.status < 500) recordSuccess(circuitKey);

      return response;

    } catch (err: unknown) {
      const durationMs = Date.now() - start;
      const message    = err instanceof Error ? err.message : String(err);
      const code       = (err as { code?: string }).code ?? "INTERNAL_ERROR";

      const meta: ErrorMeta = {
        route,
        method,
        message,
        code,
        durationMs,
        timestamp: new Date().toISOString(),
      };

      structuredLog("error", meta);
      recordFailure(circuitKey);

      // Alert CEO for unexpected 500s (fire-and-forget)
      alertCEO(meta).catch(() => {});

      // Never leak internals to the client
      return NextResponse.json(
        { error: "An internal error occurred. The team has been notified." },
        { status: 500 },
      );
    }
  };
}

// ── Agent Backend Fetch Helper (with timeout + structured logging) ─────────────

export async function fetchAgentBackend(
  path: string,
  payload: Record<string, unknown>,
  timeoutMs = 10_000,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const base   = process.env.AGENT_BACKEND_URL ?? "http://localhost:8000";
  const secret = process.env.AGENT_SERVICE_SECRET ?? "";
  const url    = `${base}${path}`;

  try {
    const res = await fetch(url, {
      method:  "POST",
      headers: {
        "Content-Type":        "application/json",
        "X-Service-Secret":    secret,
      },
      body:   JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      structuredLog("warn", {
        message:   "Agent backend non-200",
        path, status: res.status, data,
      });
    }

    return { ok: res.ok, status: res.status, data };

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isTimeout = msg.includes("timeout") || msg.includes("abort");

    structuredLog("error", {
      message: isTimeout ? "Agent backend timed out" : "Agent backend unreachable",
      path, error: msg,
    });

    return {
      ok:     false,
      status: isTimeout ? 504 : 503,
      data:   {
        run_id:  null,
        status:  isTimeout ? "backend_timeout" : "backend_offline",
        message: isTimeout
          ? `Agent backend timed out after ${timeoutMs}ms`
          : "Agent backend is not reachable. Start it with: python main.py",
      },
    };
  }
}

// ── Utility: require authenticated user or return 401 ─────────────────────────

export async function requireUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { user: null, errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user, errorResponse: null };
}

// ── Utility: require specific roles ──────────────────────────────────────────

export async function requireRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  allowedRoles: string[],
) {
  const { user, errorResponse } = await requireUser(supabase);
  if (errorResponse || !user) return { user: null, errorResponse: errorResponse! };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "";
  if (!allowedRoles.includes(role)) {
    return { user: null, errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, errorResponse: null };
}
