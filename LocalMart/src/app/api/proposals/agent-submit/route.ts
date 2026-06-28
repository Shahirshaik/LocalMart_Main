// POST /api/proposals/agent-submit
//
// Service-account endpoint for the Python agent backend.
// Uses SUPABASE_SERVICE_ROLE_KEY instead of a user session.
// Protected by AGENT_SERVICE_SECRET env var.
//
// The Python agent calls this after detecting a high-impact action
// that requires human approval before execution.

import { NextRequest, NextResponse } from "next/server";
import { createClient as createBrowserClient } from "@supabase/supabase-js";
import { transition } from "@/lib/approval/machine";
import {
  ProposalEvent,
  ProposalState,
  CreateProposalInput,
} from "@/lib/approval/types";

const SERVICE_SECRET = process.env.AGENT_SERVICE_SECRET ?? "localmart-agent-secret";
const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function serviceSupabase() {
  return createBrowserClient(SUPABASE_URL, SERVICE_KEY);
}

export async function POST(req: NextRequest) {
  // ── Service secret auth ───────────────────────────────────
  const secret = req.headers.get("x-agent-secret");
  if (secret !== SERVICE_SECRET) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let body: CreateProposalInput & {
    agent_id?:       string;
    submitter_role?: "agent" | "ceo" | "board";
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = serviceSupabase();

  // Resolve the system agent user (or find an active agent to attribute it to)
  const { data: agentUser } = await supabase
    .from("users")
    .select("id, role")
    .eq("role", "agent")
    .limit(1)
    .single();

  if (!agentUser) {
    return NextResponse.json(
      { ok: false, error: "No agent user found to submit on behalf of. Seed an agent account first." },
      { status: 500 },
    );
  }

  // ── State machine: DRAFT → PENDING_BOARD_REVIEW ───────────
  const txn = transition(ProposalState.DRAFT, ProposalEvent.SUBMIT);
  if (!txn.ok) return NextResponse.json({ ok: false, error: txn.error }, { status: 500 });

  const { data: proposal, error: insertErr } = await supabase
    .from("proposals")
    .insert({
      title:                body.title,
      description:          body.description,
      proposal_type:        body.proposal_type,
      priority:             body.priority ?? "high",
      state:                txn.newState,
      submitted_by_user_id: agentUser.id,
      source_agent_id:      body.source_agent_id ?? body.agent_id ?? null,
      payload:              body.payload,
      financial_impact_inr: body.financial_impact_inr ?? null,
      affected_pin_codes:   body.affected_pin_codes ?? [],
      affected_districts:   body.affected_districts ?? [],
      affected_vertical:    body.affected_vertical  ?? null,
    })
    .select()
    .single();

  if (insertErr || !proposal) {
    return NextResponse.json({ ok: false, error: insertErr?.message }, { status: 500 });
  }

  // Audit
  await supabase.from("proposal_audit_log").insert({
    proposal_id: proposal.id,
    event:       ProposalEvent.SUBMIT,
    from_state:  ProposalState.DRAFT,
    to_state:    txn.newState,
    actor_role:  "system_agent",
    notes:       `Auto-submitted by AI agent${body.agent_id ? ` (${body.agent_id})` : ""}`,
  });

  // Notify board
  const { data: boardUsers } = await supabase
    .from("users").select("id").in("role", ["board", "ceo"]);
  if (boardUsers?.length) {
    await supabase.from("notifications").insert(
      boardUsers.map(u => ({
        user_id: u.id,
        title:   `AI Agent Proposal: ${proposal.title}`,
        body:    `An autonomous agent has submitted a ${proposal.priority} priority proposal requiring board review.`,
        link:    `/board/approvals`,
        type:    "proposal",
      }))
    );
  }

  return NextResponse.json(
    { ok: true, proposal_id: proposal.id, state: txn.newState },
    { status: 201 },
  );
}
