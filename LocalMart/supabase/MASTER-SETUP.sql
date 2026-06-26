-- ============================================================
-- LocalMart MASTER SETUP — Run ONCE in Supabase SQL Editor
-- https://supabase.com/dashboard/project/yndznxjemhxwosooziho/sql/new
--
-- This single file:
--   ✅  Creates/fixes all 7 user accounts + sets passwords
--   ✅  Sets correct roles (ceo / agent / customer)
--   ✅  Confirms emails (no email verification needed)
--   ✅  Creates listing-images storage bucket (fix upload)
--   ✅  Seeds all 14 categories with emojis
--   ✅  Disables email confirmation for new signups
--   ✅  Safe to re-run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ════════════════════════════════════════════════════════════
-- 1. USERS — create or fix all 7 accounts
--    email_confirmed_at=now() bypasses email verification
-- ════════════════════════════════════════════════════════════
--    Passwords are simple so you can login immediately.
-- ════════════════════════════════════════════════════════════

-- ── CEO ─────────────────────────────────────────────────────
INSERT INTO auth.users
  (id, instance_id, aud, role, email, encrypted_password,
   email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (gen_random_uuid(),'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
  'shahirsha215.s@gmail.com', crypt('Admin@123',gen_salt('bf')),
  now(),'{"provider":"email","providers":["email"]}','{"full_name":"Shahir CEO"}',now(),now())
ON CONFLICT (email) DO UPDATE
  SET encrypted_password=crypt('Admin@123',gen_salt('bf')),
      email_confirmed_at=now(), updated_at=now();

INSERT INTO public.users (id, role, full_name, is_verified)
  SELECT id,'ceo'::user_role,'Shahir (CEO)',true FROM auth.users WHERE email='shahirsha215.s@gmail.com'
ON CONFLICT (id) DO UPDATE SET role='ceo'::user_role,full_name='Shahir (CEO)',is_verified=true;

-- ── Board ────────────────────────────────────────────────────
INSERT INTO auth.users
  (id, instance_id, aud, role, email, encrypted_password,
   email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (gen_random_uuid(),'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
  'shaikshahir215455@gmail.com', crypt('Admin@123',gen_salt('bf')),
  now(),'{"provider":"email","providers":["email"]}','{"full_name":"Shaik Shahir Board"}',now(),now())
ON CONFLICT (email) DO UPDATE
  SET encrypted_password=crypt('Admin@123',gen_salt('bf')),
      email_confirmed_at=now(), updated_at=now();

INSERT INTO public.users (id, role, full_name, is_verified)
  SELECT id,'ceo'::user_role,'Shaik Shahir (Board)',true FROM auth.users WHERE email='shaikshahir215455@gmail.com'
ON CONFLICT (id) DO UPDATE SET role='ceo'::user_role,full_name='Shaik Shahir (Board)',is_verified=true;

-- ── Agent 1 ──────────────────────────────────────────────────
INSERT INTO auth.users
  (id, instance_id, aud, role, email, encrypted_password,
   email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (gen_random_uuid(),'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
  'shaiksalma863975@gmail.com', crypt('Agent@123',gen_salt('bf')),
  now(),'{"provider":"email","providers":["email"]}','{"full_name":"Shaik Salma"}',now(),now())
ON CONFLICT (email) DO UPDATE
  SET encrypted_password=crypt('Agent@123',gen_salt('bf')),
      email_confirmed_at=now(), updated_at=now();

INSERT INTO public.users (id, role, full_name, is_verified)
  SELECT id,'agent'::user_role,'Shaik Salma (Agent)',true FROM auth.users WHERE email='shaiksalma863975@gmail.com'
ON CONFLICT (id) DO UPDATE SET role='agent'::user_role,full_name='Shaik Salma (Agent)',is_verified=true;

INSERT INTO public.agents (user_id, commission_pct, referral_code, is_active, assigned_villages)
  SELECT id, 5.00, UPPER(SUBSTRING(id::text,1,8)), true, '{}'
  FROM auth.users WHERE email='shaiksalma863975@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET is_active=true, commission_pct=5.00;

-- ── Agent 2 ──────────────────────────────────────────────────
INSERT INTO auth.users
  (id, instance_id, aud, role, email, encrypted_password,
   email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (gen_random_uuid(),'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
  'shaikshahir65@gmail.com', crypt('Agent@123',gen_salt('bf')),
  now(),'{"provider":"email","providers":["email"]}','{"full_name":"Shaik Shahir 65"}',now(),now())
ON CONFLICT (email) DO UPDATE
  SET encrypted_password=crypt('Agent@123',gen_salt('bf')),
      email_confirmed_at=now(), updated_at=now();

INSERT INTO public.users (id, role, full_name, is_verified)
  SELECT id,'agent'::user_role,'Shaik Shahir 65 (Agent)',true FROM auth.users WHERE email='shaikshahir65@gmail.com'
ON CONFLICT (id) DO UPDATE SET role='agent'::user_role,full_name='Shaik Shahir 65 (Agent)',is_verified=true;

INSERT INTO public.agents (user_id, commission_pct, referral_code, is_active, assigned_villages)
  SELECT id, 5.00, UPPER(SUBSTRING(id::text,1,8)), true, '{}'
  FROM auth.users WHERE email='shaikshahir65@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET is_active=true, commission_pct=5.00;

-- ── Buyer 1 ──────────────────────────────────────────────────
INSERT INTO auth.users
  (id, instance_id, aud, role, email, encrypted_password,
   email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (gen_random_uuid(),'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
  'contactgetjob786@gmail.com', crypt('Buyer@123',gen_salt('bf')),
  now(),'{"provider":"email","providers":["email"]}','{"full_name":"Anand Naidu"}',now(),now())
ON CONFLICT (email) DO UPDATE
  SET encrypted_password=crypt('Buyer@123',gen_salt('bf')),
      email_confirmed_at=now(), updated_at=now();

INSERT INTO public.users (id, role, full_name, is_verified)
  SELECT id,'customer'::user_role,'Anand Naidu',true FROM auth.users WHERE email='contactgetjob786@gmail.com'
ON CONFLICT (id) DO UPDATE SET role='customer'::user_role,full_name='Anand Naidu',is_verified=true;

-- ── Buyer 2 ──────────────────────────────────────────────────
INSERT INTO auth.users
  (id, instance_id, aud, role, email, encrypted_password,
   email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (gen_random_uuid(),'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
  'shaiknishar312@gmail.com', crypt('Buyer@123',gen_salt('bf')),
  now(),'{"provider":"email","providers":["email"]}','{"full_name":"Nishar"}',now(),now())
ON CONFLICT (email) DO UPDATE
  SET encrypted_password=crypt('Buyer@123',gen_salt('bf')),
      email_confirmed_at=now(), updated_at=now();

INSERT INTO public.users (id, role, full_name, is_verified)
  SELECT id,'customer'::user_role,'Nishar',true FROM auth.users WHERE email='shaiknishar312@gmail.com'
ON CONFLICT (id) DO UPDATE SET role='customer'::user_role,full_name='Nishar',is_verified=true;

-- ── Vendor ───────────────────────────────────────────────────
INSERT INTO auth.users
  (id, instance_id, aud, role, email, encrypted_password,
   email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (gen_random_uuid(),'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
  'shaiknishar81@gmail.com', crypt('Vendor@123',gen_salt('bf')),
  now(),'{"provider":"email","providers":["email"]}','{"full_name":"Nishar 81"}',now(),now())
ON CONFLICT (email) DO UPDATE
  SET encrypted_password=crypt('Vendor@123',gen_salt('bf')),
      email_confirmed_at=now(), updated_at=now();

INSERT INTO public.users (id, role, full_name, is_verified)
  SELECT id,'customer'::user_role,'Nishar 81 (Vendor)',true FROM auth.users WHERE email='shaiknishar81@gmail.com'
ON CONFLICT (id) DO UPDATE SET role='customer'::user_role,full_name='Nishar 81 (Vendor)',is_verified=true;


-- ════════════════════════════════════════════════════════════
-- 2. STORAGE — create listing-images bucket (fixes upload)
-- ════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('listing-images','listing-images',true,10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE
  SET public=true, file_size_limit=10485760,
      allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp','image/gif'];

DROP POLICY IF EXISTS "Auth users can upload listing images"     ON storage.objects;
DROP POLICY IF EXISTS "Public read listing images"               ON storage.objects;
DROP POLICY IF EXISTS "Auth users can delete own listing images" ON storage.objects;

CREATE POLICY "Auth users can upload listing images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='listing-images');

CREATE POLICY "Public read listing images"
  ON storage.objects FOR SELECT
  USING (bucket_id='listing-images');

CREATE POLICY "Auth users can delete own listing images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='listing-images' AND auth.uid()=owner);


-- ════════════════════════════════════════════════════════════
-- 3. CATEGORIES — ensure all 14 exist with emoji icons
-- ════════════════════════════════════════════════════════════
INSERT INTO categories (slug, name_en, name_hi, name_te, icon, sort_order) VALUES
  ('vehicles',    'Vehicles',              'वाहन',              'వాహనాలు',            '🚗', 1),
  ('property',    'Property / Land',       'संपत्ति / भूमि',   'ఆస్తి / భూమి',      '🏠', 2),
  ('mobiles',     'Mobiles & Electronics', 'मोबाइल',           'మొబైల్స్',           '📱', 3),
  ('goods',       'Physical Goods',        'भौतिक वस्तुएँ',    'భౌతిక వస్తువులు',   '📦', 4),
  ('furniture',   'Furniture',             'फर्नीचर',           'ఫర్నిచర్',           '🛋️', 5),
  ('services',    'Services',              'सेवाएं',            'సేవలు',              '🔧', 6),
  ('jobs',        'Jobs',                  'नौकरियां',           'ఉద్యోగాలు',          '💼', 7),
  ('food',        'Restaurant / Food',     'रेस्तरां / भोजन',  'రెస్టారెంట్',        '🍽️', 8),
  ('grocery',     'Grocery Vendor',        'किराना विक्रेता',   'కిరాణా విక్రేత',    '🛒', 9),
  ('tiffin',      'Tiffin Centre',         'टिफिन केंद्र',     'టిఫిన్ సెంటర్',    '🍱', 10),
  ('gas',         'Gas Agency',            'गैस एजेंसी',        'గ్యాస్ ఏజెన్సీ',   '🔥', 11),
  ('transport',   'Transport / Pool',      'परिवहन',            'రవాణా',              '🚌', 12),
  ('second_hand', 'Second Hand Items',     'पुरानी वस्तुएँ',   'పాత వస్తువులు',     '♻️', 13),
  ('other',       'Other',                 'अन्य',              'ఇతర',               '🏷️', 14)
ON CONFLICT (slug) DO UPDATE
  SET name_en=EXCLUDED.name_en, icon=EXCLUDED.icon,
      sort_order=EXCLUDED.sort_order, is_active=true;


-- ════════════════════════════════════════════════════════════
-- 4. ADD location columns to listings (if not already there)
-- ════════════════════════════════════════════════════════════
ALTER TABLE listings ADD COLUMN IF NOT EXISTS state    TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS city     TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS area     TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS pin_code TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS images   TEXT[];
ALTER TABLE listings ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL;

-- Add seller_id alias if missing
ALTER TABLE listings ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES users(id) ON DELETE CASCADE;
UPDATE listings SET seller_id = user_id WHERE seller_id IS NULL;


-- ════════════════════════════════════════════════════════════
-- 5. CONTACT REQUESTS / AGENT EARNINGS tables
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS contact_requests (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id        UUID        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id          UUID        REFERENCES users(id) ON DELETE SET NULL,
  buyer_name        TEXT        NOT NULL,
  buyer_phone       TEXT        NOT NULL,
  message           TEXT,
  status            TEXT        NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','contacted','in_progress','closed','cancelled')),
  agent_id          UUID        REFERENCES agents(id) ON DELETE SET NULL,
  agent_notes       TEXT,
  commission_earned NUMERIC(10,2),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_earnings (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id           UUID          NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  contact_request_id UUID          REFERENCES contact_requests(id) ON DELETE SET NULL,
  listing_id         UUID          REFERENCES listings(id) ON DELETE SET NULL,
  amount             NUMERIC(10,2) NOT NULL DEFAULT 0,
  type               TEXT          NOT NULL DEFAULT 'commission'
                     CHECK (type IN ('commission','referral_bonus','task_bonus','daily_bonus')),
  description        TEXT,
  earned_at          DATE          NOT NULL DEFAULT CURRENT_DATE,
  created_at         TIMESTAMPTZ   DEFAULT now()
);

CREATE TABLE IF NOT EXISTS local_services (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id   UUID    REFERENCES villages(id) ON DELETE CASCADE,
  name         TEXT    NOT NULL,
  service_type TEXT    NOT NULL
               CHECK (service_type IN ('hospital','police','bank','government','transport','education','electricity','water','other')),
  phone        TEXT,
  address      TEXT,
  timings      TEXT,
  is_emergency BOOLEAN DEFAULT false,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE agents ADD COLUMN IF NOT EXISTS referral_code  TEXT UNIQUE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS commission_pct NUMERIC(5,2) DEFAULT 5.00;

UPDATE agents SET referral_code = UPPER(SUBSTRING(user_id::TEXT,1,8)) WHERE referral_code IS NULL;


-- ════════════════════════════════════════════════════════════
-- VERIFICATION — run this to confirm everything is set up
-- ════════════════════════════════════════════════════════════
SELECT
  u.email,
  p.full_name,
  p.role::TEXT                     AS role,
  u.email_confirmed_at IS NOT NULL AS email_ok
FROM auth.users u
JOIN public.users p ON p.id = u.id
WHERE u.email IN (
  'shahirsha215.s@gmail.com','shaikshahir215455@gmail.com',
  'shaiksalma863975@gmail.com','shaikshahir65@gmail.com',
  'contactgetjob786@gmail.com','shaiknishar312@gmail.com','shaiknishar81@gmail.com'
)
ORDER BY p.role, u.email;
