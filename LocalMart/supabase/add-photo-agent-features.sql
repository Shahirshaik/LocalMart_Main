-- ============================================================
-- LocalMart: Photo Upload + Agent Middleman Features
-- Run this in the Supabase SQL Editor
-- Safe to re-run (all statements use IF NOT EXISTS / ON CONFLICT)
-- ============================================================

-- ── 1. Supabase Storage bucket for listing photos ───────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  10485760,   -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE
  SET public           = true,
      file_size_limit  = 10485760,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Drop old policies first so this file is safe to re-run
DROP POLICY IF EXISTS "Auth users can upload listing images"     ON storage.objects;
DROP POLICY IF EXISTS "Public read listing images"              ON storage.objects;
DROP POLICY IF EXISTS "Auth users can delete own listing images" ON storage.objects;

-- Allow authenticated users to upload
CREATE POLICY "Auth users can upload listing images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'listing-images');

-- Allow anyone to read photos (public bucket)
CREATE POLICY "Public read listing images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

-- Allow owners to delete their own uploads
CREATE POLICY "Auth users can delete own listing images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'listing-images' AND auth.uid() = owner);


-- ── 2. contact_requests ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_requests (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id        UUID        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id          UUID        REFERENCES users(id) ON DELETE SET NULL,
  buyer_name        TEXT        NOT NULL,
  buyer_phone       TEXT        NOT NULL,
  message           TEXT,
  status            TEXT        NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'contacted', 'in_progress', 'closed', 'cancelled')),
  agent_id          UUID        REFERENCES agents(id) ON DELETE SET NULL,
  agent_notes       TEXT,
  commission_earned NUMERIC(10,2),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_requests_listing  ON contact_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_agent    ON contact_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status   ON contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_buyer    ON contact_requests(buyer_id);

CREATE OR REPLACE FUNCTION touch_contact_request()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_touch_contact_request ON contact_requests;
CREATE TRIGGER trg_touch_contact_request
  BEFORE UPDATE ON contact_requests
  FOR EACH ROW EXECUTE FUNCTION touch_contact_request();

ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create contact requests" ON contact_requests;
DROP POLICY IF EXISTS "Buyers can view own requests"       ON contact_requests;
DROP POLICY IF EXISTS "Agents can view area requests"      ON contact_requests;
DROP POLICY IF EXISTS "Agents can update their requests"   ON contact_requests;
DROP POLICY IF EXISTS "CEO full access contact_requests"   ON contact_requests;

CREATE POLICY "Anyone can create contact requests"
  ON contact_requests FOR INSERT WITH CHECK (true);

CREATE POLICY "Buyers can view own requests"
  ON contact_requests FOR SELECT
  USING (buyer_id = auth.uid());

CREATE POLICY "Agents can view area requests"
  ON contact_requests FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents a
      JOIN listings l ON l.id = contact_requests.listing_id
      WHERE a.user_id = auth.uid()
        AND (l.village_id = ANY(a.assigned_villages) OR a.id = contact_requests.agent_id)
    )
  );

CREATE POLICY "Agents can update their requests"
  ON contact_requests FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM agents a WHERE a.user_id = auth.uid() AND a.id = contact_requests.agent_id)
  );

CREATE POLICY "CEO full access contact_requests"
  ON contact_requests FOR ALL TO authenticated
  USING (is_ceo()) WITH CHECK (is_ceo());


-- ── 3. agent_earnings ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_earnings (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id            UUID          NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  contact_request_id  UUID          REFERENCES contact_requests(id) ON DELETE SET NULL,
  listing_id          UUID          REFERENCES listings(id) ON DELETE SET NULL,
  amount              NUMERIC(10,2) NOT NULL DEFAULT 0,
  type                TEXT          NOT NULL DEFAULT 'commission'
                      CHECK (type IN ('commission', 'referral_bonus', 'task_bonus', 'daily_bonus')),
  description         TEXT,
  earned_at           DATE          NOT NULL DEFAULT CURRENT_DATE,
  created_at          TIMESTAMPTZ   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_earnings_agent ON agent_earnings(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_earnings_date  ON agent_earnings(earned_at);

ALTER TABLE agent_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents view own earnings"   ON agent_earnings;
DROP POLICY IF EXISTS "CEO full access earnings"   ON agent_earnings;

CREATE POLICY "Agents view own earnings"
  ON agent_earnings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM agents a WHERE a.user_id = auth.uid() AND a.id = agent_id));

CREATE POLICY "CEO full access earnings"
  ON agent_earnings FOR ALL TO authenticated
  USING (is_ceo()) WITH CHECK (is_ceo());


-- ── 4. agent_referrals ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_referrals (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_agent_id UUID          NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  referred_user_id  UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code     TEXT          NOT NULL,
  status            TEXT          NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'rewarded')),
  bonus_amount      NUMERIC(10,2) DEFAULT 100,
  created_at        TIMESTAMPTZ   DEFAULT now(),
  UNIQUE (referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON agent_referrals(referrer_agent_id);

ALTER TABLE agent_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents view own referrals" ON agent_referrals;
DROP POLICY IF EXISTS "Anyone can insert referral" ON agent_referrals;
DROP POLICY IF EXISTS "CEO full access referrals"  ON agent_referrals;

CREATE POLICY "Agents view own referrals"
  ON agent_referrals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM agents a WHERE a.user_id = auth.uid() AND a.id = referrer_agent_id));

CREATE POLICY "Anyone can insert referral"
  ON agent_referrals FOR INSERT WITH CHECK (true);

CREATE POLICY "CEO full access referrals"
  ON agent_referrals FOR ALL TO authenticated
  USING (is_ceo()) WITH CHECK (is_ceo());


-- ── 5. local_services ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS local_services (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id   UUID    REFERENCES villages(id) ON DELETE CASCADE,
  name         TEXT    NOT NULL,
  service_type TEXT    NOT NULL
               CHECK (service_type IN (
                 'hospital','police','bank','government',
                 'transport','education','electricity','water','other'
               )),
  phone        TEXT,
  address      TEXT,
  timings      TEXT,
  is_emergency BOOLEAN DEFAULT false,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_local_services_village ON local_services(village_id);
CREATE INDEX IF NOT EXISTS idx_local_services_type    ON local_services(service_type);

ALTER TABLE local_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view local services"   ON local_services;
DROP POLICY IF EXISTS "Agents can manage local services" ON local_services;

CREATE POLICY "Anyone can view local services"
  ON local_services FOR SELECT USING (is_active = true);

CREATE POLICY "Agents can manage local services"
  ON local_services FOR ALL TO authenticated
  USING (is_agent() OR is_ceo()) WITH CHECK (is_agent() OR is_ceo());


-- ── 6. Seed emergency helplines ─────────────────────────────
INSERT INTO local_services (name, service_type, phone, is_emergency, is_active)
VALUES
  ('Police Emergency',      'police',      '100',    true,  true),
  ('Fire Emergency',        'other',       '101',    true,  true),
  ('Ambulance / Medical',   'hospital',    '108',    true,  true),
  ('Women Helpline',        'government',  '181',    true,  true),
  ('Child Helpline',        'government',  '1098',   true,  true),
  ('Electricity Complaint', 'electricity', '1912',   false, true),
  ('Water Board',           'water',       '155313', false, true)
ON CONFLICT DO NOTHING;


-- ── 7. Add columns to agents ─────────────────────────────────
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS commission_pct NUMERIC(5,2) DEFAULT 5.00;

UPDATE agents
  SET referral_code = UPPER(SUBSTRING(user_id::TEXT, 1, 8))
WHERE referral_code IS NULL;
