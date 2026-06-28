// POST /api/proposals/create
//
// Creates a new proposal in DRAFT state, then immediately fires the
// SUBMIT event to move it to PENDING_BOARD_REVIEW.
//
// Callable by: agents (from Python backend), board, CEO, or authenticated users.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transition } from "@/lib/approval/machine";
import {
  ProposalEvent,
  ProposalState,
  CreateProposalInput,
} from "@/lib/approval/types";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // ── Auth ──────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err(401, "Unauthorized");

  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || !["ceo", "board", "agent"].includes(profile.role)) {
    return err(403, "Only agents, board members, and the CEO can create proposals.");
  }

  // ── Input validation ──────────────────────────────────────
  let body: CreateProposalInput;
  try {
    body = await req.json();
  } catch {
    return err(400, "Invalid JSON body.");
  }

  const { title, description, proposal_type, payload } = body;
  if (!title?.trim())        return err(400, "title is required.");
  if (!description?.trim())  return err(400, "description is required.");
  if (!proposal_type)        return err(400, "proposal_type is required.");
  if (!payload)              return err(400, "payload is required.");

  // ── Validate state machine: DRAFT → PENDING_BOARD_REVIEW ──
  const txn = transition(ProposalState.DRAFT, ProposalEvent.SUBMIT);
  if (!txn.ok) return err(500, txn.error!);

  // ── Insert proposal ───────────────────────────────────────
  const { data: proposal, error: insertErr } = await supabase
    .from("proposals")
    .insert({
      title:                body.title.trim(),
      description:          body.description.trim(),
      proposal_type:        body.proposal_type,
      priority:             body.priority ?? "high",
      state:                txn.newState,          // pending_board_review
      submitted_by_user_id: user.id,
      source_agent_id:      body.source_agent_id ?? null,
      payload:              body.payload,
      financial_impact_inr: body.financial_impact_inr ?? null,
      affected_pin_codes:   body.affected_pin_codes ?? [],
      affected_districts:   body.affected_districts ?? [],
      affected_vertical:    body.affected_vertical ?? null,
    })
    .select()
    .single();

  if (insertErr || !proposal) {
    return err(500, `DB insert failed: ${insertErr?.message}`);
  }

  // ── Audit log ─────────────────────────────────────────────
  await supabase.from("proposal_audit_log").insert({
    proposal_id:   proposal.id,
    event:         ProposalEvent.SUBMIT,
    from_state:    ProposalState.DRAFT,
    to_state:      txn.newState,
    actor_user_id: user.id,
    actor_role:    profile.role,
    notes:         `Submitted by ${profile.full_name ?? user.email}`,
  });

  // ── Notify board members ──────────────────────────────────
  const { data: boardUsers } = await supabase
    .from("users")
    .select("id")
    .in("role", ["board", "ceo"]);

  if (boardUsers?.length) {
    await supabase.from("notifications").insert(
      boardUsers.map(u => ({
        user_id: u.id,
        title:   `New Proposal: ${proposal.title}`,
        body:    `${profile.full_name ?? "An agent"} submitted a ${proposal.priority} priority proposal requiring your review.`,
        link:    `/board/approvals`,
        type:    "proposal",
      }))
    );
  }

  return NextResponse.json(
    { ok: true, proposal_id: proposal.id, state: txn.newState, proposal },
    { status: 201 },
  );
}

function err(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}
