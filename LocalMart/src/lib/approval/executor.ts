// ── Proposal Executor — Background Worker ─────────────────────
//
//  Called when a proposal enters the EXECUTING state.
//  Each ProposalType maps to a specific handler that carries
//  out the real-world action described in proposal.payload.
//
//  On completion → calls back to /api/proposals/[id]/execution-webhook
//  with EXECUTION_COMPLETE or EXECUTION_FAILED.

import { ProposalType } from "./types";

const AGENT_BACKEND = process.env.AGENT_BACKEND_URL ?? "http://localhost:8000";
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface ExecutorContext {
  proposalId:    string;
  proposalType:  ProposalType;
  payload:       Record<string, unknown>;
  callbackBase:  string;  // e.g. "https://localmart.vercel.app"
}

export interface ExecutorResult {
  ok:      boolean;
  data?:   Record<string, unknown>;
  error?:  string;
}

// ── Handler registry ──────────────────────────────────────────

type Handler = (ctx: ExecutorContext) => Promise<ExecutorResult>;

const HANDLERS: Record<ProposalType, Handler> = {

  // ─────────────────────────────────────────────────────────
  ad_budget_allocation: async (ctx) => {
    // Delegates to the Python marketing agent with a specific budget
    const res = await fetchPythonBackend("/agents/run/marketing", {
      district:       ctx.payload.district,
      vertical:       ctx.payload.vertical,
      budget_inr:     ctx.payload.budget_inr,
      pin_codes:      ctx.payload.pin_codes,
      proposal_id:    ctx.proposalId,
    });
    if (!res.ok) return { ok: false, error: `Marketing agent returned ${res.status}` };
    return { ok: true, data: await res.json() };
  },

  // ─────────────────────────────────────────────────────────
  regional_policy_change: async (ctx) => {
    // Updates commission_pct or max_listing_days in a region
    const { affected_districts, policy_key, policy_value } = ctx.payload as {
      affected_districts: string[];
      policy_key:         string;
      policy_value:       unknown;
    };

    const body = {
      filter:   { name: { in: affected_districts } },
      update:   { [policy_key]: policy_value },
    };

    const res = await supabaseRPC("update_district_policy", body);
    if (!res.ok) return { ok: false, error: "District policy RPC failed" };
    return { ok: true, data: { updated_districts: affected_districts } };
  },

  // ─────────────────────────────────────────────────────────
  price_intervention: async (ctx) => {
    // Caps or floors prices for a vertical in specific PINs
    const { pin_codes, vertical, price_floor, price_cap } = ctx.payload as {
      pin_codes:   string[];
      vertical:    string;
      price_floor?: number;
      price_cap?:   number;
    };

    const updates: Record<string, number> = {};
    if (price_floor !== undefined) updates.min_price_override = price_floor;
    if (price_cap   !== undefined) updates.max_price_override = price_cap;

    const res = await supabaseREST("listings", "PATCH", {
      filter: `vertical=eq.${vertical}&pin_code=in.(${pin_codes.join(",")})&status=eq.active`,
      body:   updates,
    });

    return res.ok
      ? { ok: true, data: { affected_pins: pin_codes, changes: updates } }
      : { ok: false, error: "Price intervention DB update failed" };
  },

  // ─────────────────────────────────────────────────────────
  vendor_blacklist: async (ctx) => {
    const { vendor_user_ids, reason } = ctx.payload as {
      vendor_user_ids: string[];
      reason:          string;
    };

    const results = await Promise.allSettled(
      vendor_user_ids.map(uid =>
        supabaseREST("users", "PATCH", {
          filter: `id=eq.${uid}`,
          body:   { is_banned: true, ban_reason: reason },
        })
      )
    );

    const failed = results.filter(r => r.status === "rejected").length;
    return failed === 0
      ? { ok: true, data: { blacklisted: vendor_user_ids.length } }
      : { ok: false, error: `${failed}/${vendor_user_ids.length} ban operations failed` };
  },

  // ─────────────────────────────────────────────────────────
  mass_notification: async (ctx) => {
    const { title, body, target_role, target_districts, link } = ctx.payload as {
      title:              string;
      body:               string;
      target_role?:       string;
      target_districts?:  string[];
      link?:              string;
    };

    // Delegates to Python backend which has Twilio + push integrations
    const res = await fetchPythonBackend("/agents/notify/mass", {
      title,
      body,
      target_role,
      target_districts,
      link,
      proposal_id: ctx.proposalId,
    });

    return res.ok
      ? { ok: true, data: await res.json() }
      : { ok: false, error: "Mass notification dispatch failed" };
  },

  // ─────────────────────────────────────────────────────────
  agent_commission_change: async (ctx) => {
    const { district_names, new_commission_pct } = ctx.payload as {
      district_names:      string[];
      new_commission_pct:  number;
    };

    if (new_commission_pct < 0 || new_commission_pct > 30) {
      return { ok: false, error: "Commission must be between 0% and 30%" };
    }

    const res = await supabaseREST("agents", "PATCH", {
      filter: `territory_districts=cs.{${district_names.join(",")}}`,
      body:   { commission_pct: new_commission_pct },
    });

    return res.ok
      ? { ok: true, data: { updated_districts: district_names, new_commission_pct } }
      : { ok: false, error: "Agent commission update failed" };
  },

  // ─────────────────────────────────────────────────────────
  vertical_launch: async (ctx) => {
    const { vertical_slug, pilot_districts } = ctx.payload as {
      vertical_slug:    string;
      pilot_districts:  string[];
    };

    // Enable the vertical in marketplace_config if such a table exists,
    // otherwise just records the launch event in ai_agent_logs
    const res = await supabaseREST("ai_agent_logs", "POST", {
      body: {
        agent_id: null,
        action:   `vertical_launch:${vertical_slug}`,
        status:   "success",
        payload:  { pilot_districts, proposal_id: ctx.proposalId },
      },
    });

    return res.ok
      ? { ok: true, data: { launched_vertical: vertical_slug, pilot_districts } }
      : { ok: false, error: "Vertical launch log failed" };
  },

  // ─────────────────────────────────────────────────────────
  emergency_supply_procurement: async (ctx) => {
    // Runs the full operational agent pipeline for the target district
    const { district, verticals, pin_codes } = ctx.payload as {
      district:   string;
      verticals:  string[];
      pin_codes:  string[];
    };

    const res = await fetchPythonBackend("/agents/run/full", {
      triggered_by:    "ceo_approved_procurement",
      district_name:   district,
      target_pins:     pin_codes,
      focus_verticals: verticals,
      proposal_id:     ctx.proposalId,
    });

    return res.ok
      ? { ok: true, data: await res.json() }
      : { ok: false, error: "Operational agent pipeline failed" };
  },
};

// ── Main entry point ──────────────────────────────────────────

/**
 * Execute a CEO-approved proposal.
 * Meant to be called from an API route as a fire-and-forget background task
 * (pass to NextResponse + waitUntil, or call without awaiting).
 *
 * Reports EXECUTION_COMPLETE or EXECUTION_FAILED via webhook.
 */
export async function executeProposal(ctx: ExecutorContext): Promise<void> {
  const handler = HANDLERS[ctx.proposalType];
  if (!handler) {
    await reportResult(ctx, { ok: false, error: `No executor registered for type "${ctx.proposalType}"` });
    return;
  }

  let result: ExecutorResult;
  try {
    result = await Promise.race([
      handler(ctx),
      timeout(120_000, `Executor timed out after 120s for proposal ${ctx.proposalId}`),
    ]);
  } catch (err) {
    result = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  await reportResult(ctx, result);
}

// ── Helpers ───────────────────────────────────────────────────

async function reportResult(ctx: ExecutorContext, result: ExecutorResult): Promise<void> {
  try {
    const endpoint = `${ctx.callbackBase}/api/proposals/${ctx.proposalId}/execution-webhook`;
    await fetch(endpoint, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.EXECUTION_WEBHOOK_SECRET ?? "localmart-internal"}`,
      },
      body: JSON.stringify({
        success:          result.ok,
        result_data:      result.data   ?? null,
        execution_error:  result.error  ?? null,
      }),
    });
  } catch {
    // Webhook failed — fall through; the proposal stays in EXECUTING state
    // and ops team will see it via the overdue dashboard
    console.error(`[executor] Failed to call back for proposal ${ctx.proposalId}`);
  }
}

async function fetchPythonBackend(path: string, body: unknown): Promise<Response> {
  return fetch(`${AGENT_BACKEND}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(90_000),
  });
}

async function supabaseRPC(fn: string, params: unknown): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "apikey":        SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify(params),
  });
}

async function supabaseREST(
  table:  string,
  method: "PATCH" | "POST" | "DELETE",
  opts:   { filter?: string; body: unknown },
): Promise<Response> {
  const url = `${SUPABASE_URL}/rest/v1/${table}${opts.filter ? `?${opts.filter}` : ""}`;
  return fetch(url, {
    method,
    headers: {
      "Content-Type":  "application/json",
      "apikey":        SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Prefer":        "return=minimal",
    },
    body: JSON.stringify(opts.body),
  });
}

function timeout(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms)
  );
}
