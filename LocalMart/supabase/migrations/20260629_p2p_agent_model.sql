-- ============================================================
-- LocalMart P2P Agent Model Migration
-- Business: zero-commission peer-to-peer marketplace where
-- one exclusive Master Agent per PIN code mediates deals.
-- Revenue model: premium ad placements only.
-- ============================================================

-- 1. PIN CODE AGENT REGISTRY
--    Enforces exactly ONE master agent per 6-digit Indian PIN code.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pin_code_agents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_code        char(6)     NOT NULL,
  master_agent_id uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  district        text,
  state           text,
  coverage_villages text[],            -- list of village names covered
  is_active       boolean     NOT NULL DEFAULT true,
  commission_pct  numeric(4,2) NOT NULL DEFAULT 5.00,  -- agent keeps 100%
  activated_at    timestamptz  NOT NULL DEFAULT now(),
  created_at      timestamptz  NOT NULL DEFAULT now(),

  -- Hard constraint: only one active master agent per PIN code
  CONSTRAINT pin_code_unique_agent UNIQUE (pin_code)
);

CREATE INDEX IF NOT EXISTS idx_pin_code_agents_agent ON pin_code_agents(master_agent_id);
CREATE INDEX IF NOT EXISTS idx_pin_code_agents_pin   ON pin_code_agents(pin_code);

-- Backfill pin_code into agents table if it doesn't have one yet
ALTER TABLE agents ADD COLUMN IF NOT EXISTS pin_code char(6);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS state    text;


-- 2. SUB-AGENT NETWORK
--    Master agents can register local village leaders / trusted contacts
--    as sub-agents to help verify deals within specific wards/villages.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sub_agents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_agent_id uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id         uuid        REFERENCES users(id) ON DELETE SET NULL,  -- if they have an account
  name            text        NOT NULL,
  phone           text,
  village         text        NOT NULL,
  ward            text,
  pin_code        char(6),
  status          text        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','active','suspended')),
  verification_notes text,
  verified_at     timestamptz,
  verified_by     uuid        REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_agents_master ON sub_agents(master_agent_id);
CREATE INDEX IF NOT EXISTS idx_sub_agents_pin    ON sub_agents(pin_code);


-- 3. CONVERSATIONS — P2P + OPTIONAL AGENT MEDIATION
--    Buyers and sellers chat directly for free.
--    Optional agent_invited flag + escrow fields for mediated deals.
-- ------------------------------------------------------------
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS agent_invited          boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS agent_id               uuid        REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transaction_status     text        NOT NULL DEFAULT 'DIRECT'
                           CHECK (transaction_status IN ('DIRECT','AGENT_REQUESTED','AGENT_MEDIATED','SETTLED','CANCELLED')),
  ADD COLUMN IF NOT EXISTS agreed_amount          numeric(12,2),
  ADD COLUMN IF NOT EXISTS agent_commission_escrow numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS settled_at             timestamptz,
  ADD COLUMN IF NOT EXISTS settlement_notes       text;

CREATE INDEX IF NOT EXISTS idx_conversations_agent    ON conversations(agent_id) WHERE agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_status   ON conversations(transaction_status);

-- Messages: add is_agent flag for agent-sent system messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS is_agent boolean NOT NULL DEFAULT false;


-- 4. PREMIUM ADVERTISEMENTS
--    Company revenue comes entirely from ad placements, not transactions.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS premium_advertisements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_name text        NOT NULL,
  advertiser_email text       NOT NULL,
  business_type   text        NOT NULL,   -- restaurant, property, service, general, etc.
  headline        text        NOT NULL,
  sub_text        text,
  cta_label       text        NOT NULL DEFAULT 'Learn More',
  cta_url         text        NOT NULL,
  image_url       text,
  emoji           text,
  gradient_from   text        NOT NULL DEFAULT '#7C3AED',
  gradient_to     text        NOT NULL DEFAULT '#4C1D95',
  accent_color    text        NOT NULL DEFAULT '#FFCE32',

  -- Targeting
  target_pin_codes  text[],              -- NULL = nationwide
  target_states     text[],
  target_categories text[],

  -- Slot & billing
  slot_type       text        NOT NULL DEFAULT 'carousel'
                  CHECK (slot_type IN ('carousel','banner','sidebar','sponsored_listing')),
  package_name    text        NOT NULL DEFAULT 'basic',
  price_inr       numeric(10,2) NOT NULL DEFAULT 999.00,
  impressions_cap integer,               -- NULL = unlimited
  clicks_cap      integer,

  -- Analytics
  impressions     integer     NOT NULL DEFAULT 0,
  clicks          integer     NOT NULL DEFAULT 0,
  ctr             numeric(5,4) GENERATED ALWAYS AS (
                    CASE WHEN impressions > 0 THEN clicks::numeric / impressions ELSE 0 END
                  ) STORED,

  -- Lifecycle
  status          text        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','active','paused','expired','rejected')),
  starts_at       timestamptz NOT NULL DEFAULT now(),
  ends_at         timestamptz,
  approved_by     uuid        REFERENCES users(id),
  approved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ads_status     ON premium_advertisements(status);
CREATE INDEX IF NOT EXISTS idx_ads_slot       ON premium_advertisements(slot_type);
CREATE INDEX IF NOT EXISTS idx_ads_starts_at  ON premium_advertisements(starts_at);
CREATE INDEX IF NOT EXISTS idx_ads_ends_at    ON premium_advertisements(ends_at)  WHERE ends_at IS NOT NULL;

-- Helper view: ads currently live
CREATE OR REPLACE VIEW active_ads AS
  SELECT * FROM premium_advertisements
  WHERE status = 'active'
    AND starts_at <= now()
    AND (ends_at IS NULL OR ends_at > now())
    AND (impressions_cap IS NULL OR impressions < impressions_cap);


-- 5. ROW-LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE pin_code_agents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_agents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_advertisements ENABLE ROW LEVEL SECURITY;

-- Anyone can read active pin_code_agents (needed for "Request Agent" lookup)
CREATE POLICY pin_code_agents_read ON pin_code_agents
  FOR SELECT USING (is_active = true);

-- Only the master agent can manage their own record
CREATE POLICY pin_code_agents_write ON pin_code_agents
  FOR ALL USING (auth.uid() = master_agent_id);

-- Master agent manages their own sub-agents
CREATE POLICY sub_agents_master_rw ON sub_agents
  FOR ALL USING (auth.uid() = master_agent_id);

-- Sub-agent can read their own record
CREATE POLICY sub_agents_self_read ON sub_agents
  FOR SELECT USING (auth.uid() = user_id);

-- Active ads are public
CREATE POLICY ads_public_read ON premium_advertisements
  FOR SELECT USING (status = 'active');

-- CEO/admin can manage ads (role check via users table)
CREATE POLICY ads_admin_write ON premium_advertisements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('ceo', 'board')
    )
  );
