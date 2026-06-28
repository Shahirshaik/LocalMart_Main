-- ============================================================
--  LocalMart — Proposal Approval State Machine
--  Migration 003: proposals, proposal_votes, proposal_audit_log
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE proposal_state AS ENUM (
    'draft',
    'pending_board_review',
    'revision_requested',
    'pending_ceo_approval',
    'executing',
    'executed',
    'rejected',
    'execution_failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE proposal_type AS ENUM (
    'ad_budget_allocation',
    'regional_policy_change',
    'price_intervention',
    'vendor_blacklist',
    'mass_notification',
    'agent_commission_change',
    'vertical_launch',
    'emergency_supply_procurement'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE proposal_priority AS ENUM ('critical', 'high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE board_vote_choice AS ENUM ('approve', 'reject', 'request_revision');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── proposals ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proposals (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  title                   TEXT NOT NULL,
  description             TEXT NOT NULL,
  proposal_type           proposal_type NOT NULL,
  priority                proposal_priority NOT NULL DEFAULT 'high',

  -- State machine
  state                   proposal_state NOT NULL DEFAULT 'draft',
  revision_count          SMALLINT NOT NULL DEFAULT 0,

  -- Origin
  source_agent_id         UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  submitted_by_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- The action payload the executor will run when approved
  payload                 JSONB NOT NULL DEFAULT '{}',

  -- Impact metadata (for board/CEO to assess risk)
  financial_impact_inr    NUMERIC(14,2),
  affected_pin_codes      TEXT[]   DEFAULT '{}',
  affected_districts      TEXT[]   DEFAULT '{}',
  affected_vertical       TEXT,

  -- Board stage
  board_vote_yes          SMALLINT NOT NULL DEFAULT 0,
  board_vote_no           SMALLINT NOT NULL DEFAULT 0,
  board_notes             TEXT,
  board_approved_at       TIMESTAMPTZ,
  board_approved_by       UUID REFERENCES users(id) ON DELETE SET NULL,

  -- CEO stage
  ceo_notes               TEXT,
  ceo_approved_at         TIMESTAMPTZ,
  ceo_approved_by         UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Execution
  execution_result        JSONB,
  execution_started_at    TIMESTAMPTZ,
  execution_completed_at  TIMESTAMPTZ,
  execution_error         TEXT,

  -- Timestamps
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Deadline (board must act within X hours for critical items)
  board_deadline          TIMESTAMPTZ,
  ceo_deadline            TIMESTAMPTZ
);

-- ── proposal_votes ────────────────────────────────────────────
-- Tracks every individual board member vote per proposal
CREATE TABLE IF NOT EXISTS proposal_votes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  voter_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  voter_role      TEXT NOT NULL,
  vote            board_vote_choice NOT NULL,
  notes           TEXT,
  voted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(proposal_id, voter_user_id)  -- one vote per person per proposal
);

-- ── proposal_audit_log ────────────────────────────────────────
-- Immutable append-only ledger of every state transition
CREATE TABLE IF NOT EXISTS proposal_audit_log (
  id              BIGSERIAL PRIMARY KEY,
  proposal_id     UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  event           TEXT NOT NULL,
  from_state      proposal_state NOT NULL,
  to_state        proposal_state NOT NULL,
  actor_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_role      TEXT,
  notes           TEXT,
  metadata        JSONB DEFAULT '{}',
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_proposals_state
  ON proposals(state);
CREATE INDEX IF NOT EXISTS idx_proposals_submitted_by
  ON proposals(submitted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_source_agent
  ON proposals(source_agent_id) WHERE source_agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_priority_state
  ON proposals(priority, state);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_proposal
  ON proposal_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_audit_proposal
  ON proposal_audit_log(proposal_id, occurred_at DESC);

-- ── updated_at trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION touch_proposals_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proposals_updated_at ON proposals;
CREATE TRIGGER trg_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION touch_proposals_updated_at();

-- ── Auto-log trigger ──────────────────────────────────────────
-- Fires on every state change and inserts into proposal_audit_log
CREATE OR REPLACE FUNCTION log_proposal_transition()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.state IS DISTINCT FROM NEW.state THEN
    INSERT INTO proposal_audit_log(proposal_id, event, from_state, to_state)
    VALUES (NEW.id, 'STATE_CHANGE', OLD.state, NEW.state);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_proposal_transition ON proposals;
CREATE TRIGGER trg_log_proposal_transition
  AFTER UPDATE OF state ON proposals
  FOR EACH ROW EXECUTE FUNCTION log_proposal_transition();

-- ── Auto-deadline trigger ─────────────────────────────────────
-- Sets board_deadline when proposal reaches pending_board_review
CREATE OR REPLACE FUNCTION set_proposal_deadlines()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  hours_board INT := CASE NEW.priority
    WHEN 'critical' THEN 4
    WHEN 'high'     THEN 24
    WHEN 'medium'   THEN 48
    ELSE                 72
  END;
BEGIN
  IF NEW.state = 'pending_board_review' AND OLD.state != 'pending_board_review' THEN
    NEW.board_deadline := now() + (hours_board || ' hours')::INTERVAL;
  END IF;
  IF NEW.state = 'pending_ceo_approval' AND OLD.state != 'pending_ceo_approval' THEN
    NEW.ceo_deadline := now() + (hours_board / 2 || ' hours')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proposal_deadlines ON proposals;
CREATE TRIGGER trg_proposal_deadlines
  BEFORE UPDATE OF state ON proposals
  FOR EACH ROW EXECUTE FUNCTION set_proposal_deadlines();

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE proposals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_audit_log ENABLE ROW LEVEL SECURITY;

-- proposals: CEO sees all; board sees pending_board_review and up; agents see their own
CREATE POLICY proposals_ceo_all ON proposals
  FOR ALL TO authenticated
  USING (is_ceo());

CREATE POLICY proposals_board_read ON proposals
  FOR SELECT TO authenticated
  USING (
    is_board_or_above()
    AND state IN (
      'pending_board_review','revision_requested',
      'pending_ceo_approval','executing','executed','rejected','execution_failed'
    )
  );

CREATE POLICY proposals_agent_own ON proposals
  FOR ALL TO authenticated
  USING (submitted_by_user_id = auth.uid());

-- proposal_votes: board+ can insert; board+ can read
CREATE POLICY votes_insert_board ON proposal_votes
  FOR INSERT TO authenticated
  WITH CHECK (is_board_or_above() AND voter_user_id = auth.uid());

CREATE POLICY votes_read_board ON proposal_votes
  FOR SELECT TO authenticated
  USING (is_board_or_above());

CREATE POLICY votes_read_own ON proposal_votes
  FOR SELECT TO authenticated
  USING (voter_user_id = auth.uid());

-- audit log: read-only for board+
CREATE POLICY audit_read_board ON proposal_audit_log
  FOR SELECT TO authenticated
  USING (is_board_or_above());

-- ── Views ─────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_proposals_dashboard AS
SELECT
  p.id,
  p.title,
  p.proposal_type,
  p.priority,
  p.state,
  p.financial_impact_inr,
  p.affected_districts,
  p.affected_vertical,
  p.board_vote_yes,
  p.board_vote_no,
  p.revision_count,
  p.created_at,
  p.board_deadline,
  p.ceo_deadline,
  u.full_name    AS submitted_by_name,
  a.name         AS source_agent_name,
  CASE
    WHEN p.state = 'pending_board_review' AND p.board_deadline < now()  THEN TRUE
    WHEN p.state = 'pending_ceo_approval' AND p.ceo_deadline  < now()  THEN TRUE
    ELSE FALSE
  END AS is_overdue
FROM proposals p
LEFT JOIN users     u ON u.id = p.submitted_by_user_id
LEFT JOIN ai_agents a ON a.id = p.source_agent_id;

-- ── Notification function ─────────────────────────────────────
-- Called after transition to push in-app notifications
CREATE OR REPLACE FUNCTION notify_proposal_stakeholders(
  p_proposal_id UUID,
  p_event       TEXT,
  p_message     TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_proposal proposals%ROWTYPE;
BEGIN
  SELECT * INTO v_proposal FROM proposals WHERE id = p_proposal_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Notify submitter
  INSERT INTO notifications(user_id, title, body, link, type)
  VALUES (
    v_proposal.submitted_by_user_id,
    'Proposal Update: ' || v_proposal.title,
    p_message,
    '/agent/proposals/' || p_proposal_id,
    'proposal'
  );

  -- Notify CEO on board approval
  IF p_event = 'BOARD_APPROVED' THEN
    INSERT INTO notifications(user_id, title, body, link, type)
    SELECT id, 'Action Required: ' || v_proposal.title, p_message,
           '/ceo/approvals/' || p_proposal_id, 'proposal'
    FROM users WHERE role = 'ceo';
  END IF;
END;
$$;
