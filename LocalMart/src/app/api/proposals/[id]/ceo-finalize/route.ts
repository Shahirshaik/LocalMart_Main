// POST /api/proposals/[id]/ceo-finalize
//
// CEO gives absolute final sign-off (approve → EXECUTING) or veto (→ REJECTED).
// On approval, immediately spawns the executor as a background task.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transition, isCEOStage } from "@/lib/approval/machine";
import { checkGuard } from "@/lib/approval/guards";
import { executeProposal } from "@/lib/approval/executor";
import {
  ProposalEvent,
  ProposalState,
  CEOFinalizeInput,
  Proposal,
} from "@/lib/approval/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  // ── Auth ──────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err(401, "Unauthorized");

  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "ceo") {
    return err(403, "CEO finalization requires the CEO role. This is a hard, unconditional constraint.");
  }

  // ── Load proposal ─────────────────────────────────────────
  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();

  if (!proposal) return err(404, "Proposal not found.");

  if (!isCEOStage(proposal.state as ProposalState)) {
    return err(409, `Proposal is in state "${proposal.state}" — CEO finalization is not available now.`);
  }

  // ── Parse input ───────────────────────────────────────────
  let body: CEOFinalizeInput;
  try {
    body = await req.json();
  } catch {
    return err(400, "Invalid JSON body.");
  }

  if (!["approve", "veto"].includes(body.decision)) {
    return err(400, `decision must be "approve" or "veto".`);
  }

  const event = body.decision === "approve"
    ? ProposalEvent.CEO_APPROVE
    : ProposalEvent.CEO_VETO;

  // ── Permission guard ──────────────────────────────────────
  const guard = checkGuard(event, proposal as Proposal, "ceo", user.id);
  if (!guard.allowed) return err(403, guard.reason!);

  // ── State machine transition ───────────────────────────────
  const txn = transition(proposal.state as ProposalState, event);
  if (!txn.ok) return err(409, txn.error!);

  // ── Persist state change ──────────────────────────────────
  const updatePayload: Record<string, unknown> = {
    state:           txn.newState,
    ceo_notes:       body.notes ?? null,
    ceo_approved_by: user.id,
    ceo_approved_at: new Date().toISOString(),
  };

  if (txn.requiresExecution) {
    updatePayload.execution_started_at = new Date().toISOString();
  }

  const { error: updateErr } = await supabase
    .from("proposals")
    .update(updatePayload)
    .eq("id", id);

  if (updateErr) return err(500, `State update failed: ${updateErr.message}`);

  // ── Audit log ─────────────────────────────────────────────
  await supabase.from("proposal_audit_log").insert({
    proposal_id:   id,
    event,
    from_state:    proposal.state,
    to_state:      txn.newState,
    actor_user_id: user.id,
    actor_role:    "ceo",
    notes:         body.notes ?? null,
    metadata:      { decision: body.decision },
  });

  // ── Notify submitter ──────────────────────────────────────
  await supabase.from("notifications").insert({
    user_id: proposal.submitted_by_user_id,
    title:   body.decision === "approve"
      ? `CEO Approved: ${proposal.title}`
      : `CEO Vetoed: ${proposal.title}`,
    body: body.notes ??
      (body.decision === "approve"
        ? "Your proposal has been approved by the CEO and is now being executed."
        : "Your proposal has been vetoed by the CEO."),
    link: `/agent/proposals/${id}`,
    type: "proposal",
  });

  // ── Fire executor (non-blocking) ──────────────────────────
  if (txn.requiresExecution) {
    const appBase = process.env.NEXT_PUBLIC_APP_URL
      ?? req.headers.get("origin")
      ?? "http://localhost:3000";

    // Fire-and-forget — do NOT await this
    executeProposal({
      proposalId:   id,
      proposalType: proposal.proposal_type,
      payload:      proposal.payload as Record<string, unknown>,
      callbackBase: appBase,
    }).catch((execErr: Error) => {
      console.error(`[ceo-finalize] Executor launch failed for ${id}:`, execErr.message);
    });
  }

  return NextResponse.json({
    ok:        true,
    decision:  body.decision,
    new_state: txn.newState,
    executing: txn.requiresExecution ?? false,
  });
}

function err(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}
