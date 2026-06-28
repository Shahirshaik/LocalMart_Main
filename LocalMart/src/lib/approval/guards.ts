// ── Proposal Approval — Authorization Guards ─────────────────
//
//  Each guard answers: "can this role/actor trigger this event?"
//  Guards are pure functions — no DB calls.

import { Proposal, ProposalEvent, GuardResult } from "./types";

type ActorRole = "ceo" | "board" | "agent" | "customer" | "vendor";

type GuardFn = (
  proposal: Proposal,
  actorRole: ActorRole,
  actorId:   string,
) => GuardResult;

const GUARDS: Partial<Record<ProposalEvent, GuardFn>> = {
  // ─ SUBMIT ─────────────────────────────────────────────────
  [ProposalEvent.SUBMIT]: (proposal, role, actorId) => {
    const isSelf = actorId === proposal.submitted_by_user_id;
    if (!["ceo", "board", "agent"].includes(role) && !isSelf) {
      return { allowed: false, reason: "Only agents, board members, or the CEO can submit proposals." };
    }
    return { allowed: true };
  },

  // ─ BOARD_APPROVE ──────────────────────────────────────────
  [ProposalEvent.BOARD_APPROVE]: (_p, role) => {
    if (!["board", "ceo"].includes(role)) {
      return { allowed: false, reason: "Only board members or the CEO can approve at the board stage." };
    }
    return { allowed: true };
  },

  // ─ BOARD_REJECT ───────────────────────────────────────────
  [ProposalEvent.BOARD_REJECT]: (_p, role) => {
    if (!["board", "ceo"].includes(role)) {
      return { allowed: false, reason: "Only board members or the CEO can reject at the board stage." };
    }
    return { allowed: true };
  },

  // ─ REQUEST_REVISION ───────────────────────────────────────
  [ProposalEvent.REQUEST_REVISION]: (_p, role) => {
    if (!["board", "ceo"].includes(role)) {
      return { allowed: false, reason: "Only board or CEO can request revisions." };
    }
    return { allowed: true };
  },

  // ─ RESUBMIT ───────────────────────────────────────────────
  [ProposalEvent.RESUBMIT]: (proposal, role, actorId) => {
    const isSelf = actorId === proposal.submitted_by_user_id;
    if (!isSelf && !["ceo", "board"].includes(role)) {
      return {
        allowed: false,
        reason:  "Only the original submitter, board, or CEO can resubmit after revision.",
      };
    }
    return { allowed: true };
  },

  // ─ CEO_APPROVE ────────────────────────────────────────────
  [ProposalEvent.CEO_APPROVE]: (_p, role) => {
    if (role !== "ceo") {
      return { allowed: false, reason: "CEO approval requires the CEO role. This is a hard constraint." };
    }
    return { allowed: true };
  },

  // ─ CEO_VETO ───────────────────────────────────────────────
  [ProposalEvent.CEO_VETO]: (_p, role) => {
    if (role !== "ceo") {
      return { allowed: false, reason: "Only the CEO can veto proposals." };
    }
    return { allowed: true };
  },
};

/**
 * Run the permission guard for a given event.
 * Returns `{ allowed: true }` if no guard is registered for the event.
 */
export function checkGuard(
  event:     ProposalEvent,
  proposal:  Proposal,
  actorRole: ActorRole,
  actorId:   string,
): GuardResult {
  const guard = GUARDS[event];
  if (!guard) return { allowed: true };
  return guard(proposal, actorRole, actorId);
}
