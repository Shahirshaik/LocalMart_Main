// POST /api/proposals/[id]/resubmit
//
// After board requests revision, the original submitter (or agent)
// can update the payload/description and resubmit →  PENDING_BOARD_REVIEW.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transition } from "@/lib/approval/machine";
import { checkGuard } from "@/lib/approval/guards";
import {
  ProposalEvent,
  ProposalState,
  ResubmitInput,
  Proposal,
} from "@/lib/approval/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err(401, "Unauthorized");

  const { data: profile } = await supabase
    .from("users").select("role, full_name").eq("id", user.id).single();
  if (!profile) return err(403, "Profile not found");

  const { data: proposal } = await supabase
    .from("proposals").select("*").eq("id", id).single();
  if (!proposal) return err(404, "Proposal not found");

  if (proposal.state !== ProposalState.REVISION_REQUESTED) {
    return err(409, `Proposal must be in REVISION_REQUESTED state to resubmit. Current: "${proposal.state}".`);
  }

  const guard = checkGuard(
    ProposalEvent.RESUBMIT,
    proposal as Proposal,
    profile.role as "ceo" | "board" | "agent",
    user.id,
  );
  if (!guard.allowed) return err(403, guard.reason!);

  const txn = transition(ProposalState.REVISION_REQUESTED, ProposalEvent.RESUBMIT);
  if (!txn.ok) return err(409, txn.error!);

  let body: ResubmitInput = {};
  try {
    body = await req.json();
  } catch {}

  const updatePayload: Record<string, unknown> = { state: txn.newState };
  if (body.updated_payload)     updatePayload.payload     = body.updated_payload;
  if (body.updated_description) updatePayload.description = body.updated_description;

  const { error: updateErr } = await supabase
    .from("proposals").update(updatePayload).eq("id", id);
  if (updateErr) return err(500, `Update failed: ${updateErr.message}`);

  await supabase.from("proposal_audit_log").insert({
    proposal_id:   id,
    event:         ProposalEvent.RESUBMIT,
    from_state:    ProposalState.REVISION_REQUESTED,
    to_state:      txn.newState,
    actor_user_id: user.id,
    actor_role:    profile.role,
    notes:         body.revision_notes ?? null,
  });

  // Notify board
  const { data: boardUsers } = await supabase
    .from("users").select("id").in("role", ["board", "ceo"]);
  if (boardUsers?.length) {
    await supabase.from("notifications").insert(
      boardUsers.map(u => ({
        user_id: u.id,
        title:   `Resubmitted: ${proposal.title}`,
        body:    `${profile.full_name ?? "The submitter"} revised and resubmitted the proposal.`,
        link:    `/board/approvals`,
        type:    "proposal",
      }))
    );
  }

  return NextResponse.json({ ok: true, new_state: txn.newState });
}

function err(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}
