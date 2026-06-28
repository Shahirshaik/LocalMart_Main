// ── Proposal State Machine — Types ────────────────────────────

/** All valid states in the approval lifecycle. */
export const ProposalState = {
  DRAFT:                "draft",
  PENDING_BOARD_REVIEW: "pending_board_review",
  REVISION_REQUESTED:   "revision_requested",
  PENDING_CEO_APPROVAL: "pending_ceo_approval",
  EXECUTING:            "executing",
  EXECUTED:             "executed",
  REJECTED:             "rejected",
  EXECUTION_FAILED:     "execution_failed",
} as const;
export type ProposalState = typeof ProposalState[keyof typeof ProposalState];

/** All valid events that drive state transitions. */
export const ProposalEvent = {
  SUBMIT:              "SUBMIT",
  BOARD_APPROVE:       "BOARD_APPROVE",
  BOARD_REJECT:        "BOARD_REJECT",
  REQUEST_REVISION:    "REQUEST_REVISION",
  RESUBMIT:            "RESUBMIT",
  CEO_APPROVE:         "CEO_APPROVE",
  CEO_VETO:            "CEO_VETO",
  EXECUTION_COMPLETE:  "EXECUTION_COMPLETE",
  EXECUTION_FAILED:    "EXECUTION_FAILED",
} as const;
export type ProposalEvent = typeof ProposalEvent[keyof typeof ProposalEvent];

/** Proposal types map to specific executor handlers. */
export type ProposalType =
  | "ad_budget_allocation"
  | "regional_policy_change"
  | "price_intervention"
  | "vendor_blacklist"
  | "mass_notification"
  | "agent_commission_change"
  | "vertical_launch"
  | "emergency_supply_procurement";

export type ProposalPriority = "critical" | "high" | "medium" | "low";

export interface Proposal {
  id:                      string;
  title:                   string;
  description:             string;
  proposal_type:           ProposalType;
  priority:                ProposalPriority;
  state:                   ProposalState;
  revision_count:          number;
  source_agent_id:         string | null;
  submitted_by_user_id:    string;
  payload:                 Record<string, unknown>;
  financial_impact_inr:    number | null;
  affected_pin_codes:      string[];
  affected_districts:      string[];
  affected_vertical:       string | null;
  board_vote_yes:          number;
  board_vote_no:           number;
  board_notes:             string | null;
  board_approved_at:       string | null;
  board_approved_by:       string | null;
  ceo_notes:               string | null;
  ceo_approved_at:         string | null;
  ceo_approved_by:         string | null;
  execution_result:        Record<string, unknown> | null;
  execution_started_at:    string | null;
  execution_completed_at:  string | null;
  execution_error:         string | null;
  board_deadline:          string | null;
  ceo_deadline:            string | null;
  created_at:              string;
  updated_at:              string;
}

// ── API Input Shapes ──────────────────────────────────────────

export interface CreateProposalInput {
  title:                 string;
  description:           string;
  proposal_type:         ProposalType;
  priority?:             ProposalPriority;
  payload:               Record<string, unknown>;
  financial_impact_inr?: number;
  affected_pin_codes?:   string[];
  affected_districts?:   string[];
  affected_vertical?:    string;
  source_agent_id?:      string;
}

export interface BoardVoteInput {
  vote:   "approve" | "reject" | "request_revision";
  notes?: string;
}

export interface CEOFinalizeInput {
  decision: "approve" | "veto";
  notes?:   string;
}

export interface ResubmitInput {
  updated_payload?:      Record<string, unknown>;
  updated_description?:  string;
  revision_notes?:       string;
}

// ── State Machine Outputs ─────────────────────────────────────

export interface TransitionResult {
  ok:                 boolean;
  newState?:          ProposalState;
  error?:             string;
  requiresExecution?: boolean;
}

export interface GuardResult {
  allowed:  boolean;
  reason?:  string;
}
