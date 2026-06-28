// POST /api/proposals/[id]/board-vote
//
// Board member casts a vote on a proposal:
//   "approve"          → aggregates; if YES votes > threshold → PENDING_CEO_APPROVAL
//   "reject"           → immediately REJECTED
//   "request_revision" → REVISION_REQUESTED (agent must resubmit)
//
// Board approval threshold: majority of active board members (min 1).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transition, isBoardStage } from "@/lib/approval/machine";
import { checkGuard } from "@/lib/approval/guards";
import {
  ProposalEvent,
  ProposalState,
  BoardVoteInput,
  Proposal,
} from "@/lib/approval/types";

const BOARD_APPROVAL_THRESHOLD = Number(
  process.env.BOARD_APPROVAL_THRESHOLD ?? "1"
); // votes needed to advance

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

  if (!profile) return err(403, "User profile not found.");

  // ── Load proposal ─────────────────────────────────────────
  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();

  if (!proposal) return err(404, "Proposal not found.");

  if (!isBoardStage(proposal.state as ProposalState)) {
    return err(409, `Proposal is in state "${proposal.state}" — board voting is not allowed now.`);
  }

  // ── Parse & validate input ────────────────────────────────
  let body: BoardVoteInput;
  try {
    body = await req.json();
  } catch {
    return err(400, "Invalid JSON body.");
  }

  if (!["approve", "reject", "request_revision"].includes(body.vote)) {
    return err(400, `vote must be one of: approve, reject, request_revision.`);
  }

  // ── Map vote → event ──────────────────────────────────────
  const eventMap: Record<string, ProposalEvent> = {
    approve:          ProposalEvent.BOARD_APPROVE,
    reject:           ProposalEvent.BOARD_REJECT,
    request_revision: ProposalEvent.REQUEST_REVISION,
  };
  const event = eventMap[body.vote];

  // ── Permission guard ──────────────────────────────────────
  const guard = checkGuard(event, proposal as Proposal, profile.role as "ceo" | "board", user.id);
  if (!guard.allowed) return err(403, guard.reason!);

  // ── Validate state machine ────────────────────────────────
  const txn = transition(proposal.state as ProposalState, event);
  if (!txn.ok) return err(409, txn.error!);

  // ── Record individual vote ────────────────────────────────
  const { error: voteErr } = await supabase
    .from("proposal_votes")
    .upsert(
      {
        proposal_id:   id,
        voter_user_id: user.id,
        voter_role:    profile.role,
        vote:          body.vote,
        notes:         body.notes ?? null,
      },
      { onConflict: "proposal_id,voter_user_id" }
    );

  if (voteErr) return err(500, `Vote record failed: ${voteErr.message}`);

  // ── Tally current yes votes ───────────────────────────────
  const { count: yesCount } = await supabase
    .from("proposal_votes")
    .select("*", { count: "exact", head: true })
    .eq("proposal_id", id)
    .eq("vote", "approve");

  const newYesTotal = yesCount ?? 0;

  // For APPROVE: only advance if threshold is met
  const shouldAdvance =
    body.vote === "approve"
      ? newYesTotal >= BOARD_APPROVAL_THRESHOLD
      : true; // reject and revision always advance immediately

  let newState: ProposalState = proposal.state as ProposalState;
  let noTotal                  = proposal.board_vote_no;

  if (body.vote === "reject") noTotal = (proposal.board_vote_no ?? 0) + 1;

  if (shouldAdvance) {
    newState = txn.newState!;

    const updatePayload: Record<string, unknown> = {
      state:          newState,
      board_vote_yes: newYesTotal,
      board_vote_no:  noTotal,
      board_notes:    body.notes ?? proposal.board_notes,
    };

    if (body.vote === "approve") {
      updatePayload.board_approved_at = new Date().toISOString();
      updatePayload.board_approved_by = user.id;
    }
    if (body.vote === "request_revision") {
      updatePayload.revision_count = (proposal.revision_count ?? 0) + 1;
    }

    const { error: updateErr } = await supabase
      .from("proposals")
      .update(updatePayload)
      .eq("id", id);

    if (updateErr) return err(500, `State update failed: ${updateErr.message}`);

    // ── Audit log ──────────────────────────────────────────
    await supabase.from("proposal_audit_log").insert({
      proposal_id:   id,
      event,
      from_state:    proposal.state,
      to_state:      newState,
      actor_user_id: user.id,
      actor_role:    profile.role,
      notes:         body.notes ?? null,
      metadata:      { yes_votes: newYesTotal, threshold: BOARD_APPROVAL_THRESHOLD },
    });

    // ── Notifications ──────────────────────────────────────
    if (newState === ProposalState.PENDING_CEO_APPROVAL) {
      // Notify CEO
      const { data: ceoUsers } = await supabase
        .from("users").select("id").eq("role", "ceo");
      if (ceoUsers?.length) {
        await supabase.from("notifications").insert(
          ceoUsers.map(u => ({
            user_id: u.id,
            title:   `Board Approved: ${proposal.title}`,
            body:    `Board has approved the proposal. Your final sign-off is required.`,
            link:    `/ceo/approvals`,
            type:    "proposal",
          }))
        );
      }
    }

    if (newState === ProposalState.REVISION_REQUESTED || newState === ProposalState.REJECTED) {
      // Notify submitter
      await supabase.from("notifications").insert({
        user_id: proposal.submitted_by_user_id,
        title:   newState === ProposalState.REJECTED
          ? `Proposal Rejected: ${proposal.title}`
          : `Revision Requested: ${proposal.title}`,
        body:    body.notes ?? "Board has sent feedback on your proposal.",
        link:    `/agent/proposals/${id}`,
        type:    "proposal",
      });
    }

  } else {
    // Vote recorded but threshold not yet met — just update tally
    await supabase
      .from("proposals")
      .update({ board_vote_yes: newYesTotal, board_vote_no: noTotal })
      .eq("id", id);
  }

  return NextResponse.json({
    ok: true,
    vote_recorded: body.vote,
    state_changed:  shouldAdvance,
    new_state:      newState,
    yes_votes:      newYesTotal,
    threshold:      BOARD_APPROVAL_THRESHOLD,
  });
}

function err(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}
