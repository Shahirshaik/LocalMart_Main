// ── Proposal Approval — Pure State Machine ────────────────────
//
//  This module contains ZERO side-effects.
//  It only answers: "given state S and event E, what state comes next?"
//
//  State diagram:
//
//    DRAFT ──[SUBMIT]──► PENDING_BOARD_REVIEW
//                              │
//             ┌────────────────┼────────────────────┐
//      [BOARD_APPROVE]  [BOARD_REJECT]  [REQUEST_REVISION]
//             │                │                │
//      PENDING_CEO_APPROVAL  REJECTED   REVISION_REQUESTED
//             │                              │
//     [CEO_APPROVE] [CEO_VETO]         [RESUBMIT]──► PENDING_BOARD_REVIEW
//             │          │
//         EXECUTING    REJECTED
//             │
//   [EXECUTION_COMPLETE] [EXECUTION_FAILED]
//             │                  │
//          EXECUTED      EXECUTION_FAILED

import { ProposalState, ProposalEvent, TransitionResult } from "./types";

type TransitionMap = Partial<Record<ProposalState, Partial<Record<ProposalEvent, ProposalState>>>>;

const TRANSITIONS: TransitionMap = {
  [ProposalState.DRAFT]: {
    [ProposalEvent.SUBMIT]: ProposalState.PENDING_BOARD_REVIEW,
  },
  [ProposalState.PENDING_BOARD_REVIEW]: {
    [ProposalEvent.BOARD_APPROVE]:    ProposalState.PENDING_CEO_APPROVAL,
    [ProposalEvent.BOARD_REJECT]:     ProposalState.REJECTED,
    [ProposalEvent.REQUEST_REVISION]: ProposalState.REVISION_REQUESTED,
  },
  [ProposalState.REVISION_REQUESTED]: {
    [ProposalEvent.RESUBMIT]:      ProposalState.PENDING_BOARD_REVIEW,
    [ProposalEvent.BOARD_REJECT]:  ProposalState.REJECTED,
  },
  [ProposalState.PENDING_CEO_APPROVAL]: {
    [ProposalEvent.CEO_APPROVE]: ProposalState.EXECUTING,
    [ProposalEvent.CEO_VETO]:    ProposalState.REJECTED,
  },
  [ProposalState.EXECUTING]: {
    [ProposalEvent.EXECUTION_COMPLETE]: ProposalState.EXECUTED,
    [ProposalEvent.EXECUTION_FAILED]:   ProposalState.EXECUTION_FAILED,
  },
  // EXECUTION_FAILED is soft-terminal: CEO can re-trigger by re-approving
  [ProposalState.EXECUTION_FAILED]: {
    [ProposalEvent.CEO_APPROVE]: ProposalState.EXECUTING,
    [ProposalEvent.CEO_VETO]:    ProposalState.REJECTED,
  },
};

/** States from which no further event can move the proposal. */
const TERMINAL_STATES = new Set<ProposalState>([
  ProposalState.EXECUTED,
  ProposalState.REJECTED,
]);

/**
 * Pure transition function.
 * Returns `{ ok: true, newState }` or `{ ok: false, error }`.
 * Caller is responsible for persisting `newState` to the database.
 */
export function transition(
  currentState: ProposalState,
  event: ProposalEvent,
): TransitionResult {
  if (TERMINAL_STATES.has(currentState)) {
    return {
      ok:    false,
      error: `State "${currentState}" is terminal — no further transitions are allowed.`,
    };
  }

  const stateMap = TRANSITIONS[currentState];
  if (!stateMap) {
    return {
      ok:    false,
      error: `No transitions registered for state "${currentState}".`,
    };
  }

  const nextState = stateMap[event];
  if (!nextState) {
    const valid = Object.keys(stateMap).join(", ");
    return {
      ok:    false,
      error: `Event "${event}" is invalid in state "${currentState}". Valid events: [${valid}].`,
    };
  }

  return {
    ok:                 true,
    newState:           nextState,
    requiresExecution:  nextState === ProposalState.EXECUTING,
  };
}

/** Returns the set of events that are valid in the given state. */
export function allowedEvents(state: ProposalState): ProposalEvent[] {
  if (TERMINAL_STATES.has(state)) return [];
  return Object.keys(TRANSITIONS[state] ?? {}) as ProposalEvent[];
}

export function isTerminal(state: ProposalState): boolean {
  return TERMINAL_STATES.has(state);
}

export function isBoardStage(state: ProposalState): boolean {
  return (
    state === ProposalState.PENDING_BOARD_REVIEW ||
    state === ProposalState.REVISION_REQUESTED
  );
}

export function isCEOStage(state: ProposalState): boolean {
  return state === ProposalState.PENDING_CEO_APPROVAL;
}
