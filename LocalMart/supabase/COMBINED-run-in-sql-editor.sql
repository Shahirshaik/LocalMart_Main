-- ============================================================
-- LocalMart — Combined Setup SQL
-- Paste this ENTIRE file into:
--   Supabase Dashboard → SQL Editor → New Query → Run All
-- Generated: 2026-06-25T15:37:07.867Z
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- migration-location.sql
-- ──────────────────────────────────────────────────────────

-- ============================================================
--  LocalMart — Location Migration
--  Run this in: Supabase → SQL Editor → New Query → Run
-- ============================================================

-- 1. Make village_id optional (users now enter full India address)
ALTER TABLE listings ALTER COLUMN village_id DROP NOT NULL;

-- 2. Add India address fields to listings
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS state      TEXT,
  ADD COLUMN IF NOT EXISTS district   TEXT,
  ADD COLUMN IF NOT EXISTS city       TEXT,
  ADD COLUMN IF NOT EXISTS area       TEXT,
  ADD COLUMN IF NOT EXISTS pin_code   TEXT;

-- 3. Enrich villages table with district + city columns
ALTER TABLE villages
  ADD COLUMN IF NOT EXISTS district   TEXT,
  ADD COLUMN IF NOT EXISTS city       TEXT;

-- 4. Backfill district from existing region column
UPDATE villages SET district = region WHERE district IS NULL;

-- 5. Backfill state on existing listings from joined villages
UPDATE listings l
SET
  state    = v.state,
  district = v.region,
  city     = v.name
FROM villages v
WHERE l.village_id = v.id
  AND l.state IS NULL;

-- 6. Add a `name` alias column to categories (so TypeScript types use `name`)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS name TEXT;
UPDATE categories SET name = name_en WHERE name IS NULL;

-- ✅ Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'listings'
  AND column_name IN ('state','district','city','area','pin_code','village_id')
ORDER BY column_name;


-- ──────────────────────────────────────────────────────────
-- seed-ap-villages.sql
-- ──────────────────────────────────────────────────────────

-- ============================================================
-- Andhra Pradesh Villages Seed
-- Run in: Supabase Dashboard → SQL Editor
-- Focus: Prakasam District → Pamuru & Markapur mandals
-- ============================================================

-- ── Pamuru Mandal Villages ────────────────────────────────────
INSERT INTO villages (name, region, district, city, state, pin_code, is_active) VALUES
  ('Pamuru',            'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Gurrampodu',        'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Kothapalli',        'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Koppolu',           'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Cherukupalli',      'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Darbavaram',        'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Vempadu',           'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Kondaveedu',        'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Narasimhapuram',    'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Chittedu',          'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Bejjanki',          'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Ramannapeta',       'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Gajuluru',          'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Chellampadu',       'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Varipalli',         'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Kodavali',          'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Lingasamudram',     'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Vellampalli',       'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Pedaparimi',        'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Chinnaparimi',      'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Thummalapenta',     'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Gangadevipalle',    'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true),
  ('Krishnapuram',      'Prakasam', 'Prakasam', 'Pamuru',  'Andhra Pradesh', '523272', true)
ON CONFLICT DO NOTHING;

-- ── Markapur Mandal Villages ──────────────────────────────────
INSERT INTO villages (name, region, district, city, state, pin_code, is_active) VALUES
  ('Markapur',          'Prakasam', 'Prakasam', 'Markapur', 'Andhra Pradesh', '523316', true),
  ('Bethapudi',         'Prakasam', 'Prakasam', 'Markapur', 'Andhra Pradesh', '523316', true),
  ('Pothulavaripalem',  'Prakasam', 'Prakasam', 'Markapur', 'Andhra Pradesh', '523316', true),
  ('Koripadu',          'Prakasam', 'Prakasam', 'Markapur', 'Andhra Pradesh', '523316', true),
  ('Gurrampadu',        'Prakasam', 'Prakasam', 'Markapur', 'Andhra Pradesh', '523316', true),
  ('Tammampadu',        'Prakasam', 'Prakasam', 'Markapur', 'Andhra Pradesh', '523316', true),
  ('Velugubanda',       'Prakasam', 'Prakasam', 'Markapur', 'Andhra Pradesh', '523316', true),
  ('Mudumala',          'Prakasam', 'Prakasam', 'Markapur', 'Andhra Pradesh', '523316', true),
  ('Sivaramapuram',     'Prakasam', 'Prakasam', 'Markapur', 'Andhra Pradesh', '523316', true),
  ('Chagantipadu',      'Prakasam', 'Prakasam', 'Markapur', 'Andhra Pradesh', '523316', true)
ON CONFLICT DO NOTHING;

-- ── Bestavaripeta Mandal (adjacent to Pamuru) ─────────────────
INSERT INTO villages (name, region, district, city, state, pin_code, is_active) VALUES
  ('Bestavaripeta',     'Prakasam', 'Prakasam', 'Bestavaripeta', 'Andhra Pradesh', '523270', true),
  ('Tripuranthakam',    'Prakasam', 'Prakasam', 'Bestavaripeta', 'Andhra Pradesh', '523333', true),
  ('Mundlamur',         'Prakasam', 'Prakasam', 'Bestavaripeta', 'Andhra Pradesh', '523336', true),
  ('Donakonda',         'Prakasam', 'Prakasam', 'Bestavaripeta', 'Andhra Pradesh', '523346', true),
  ('Podili',            'Prakasam', 'Prakasam', 'Bestavaripeta', 'Andhra Pradesh', '523240', true),
  ('Kurichedu',         'Prakasam', 'Prakasam', 'Bestavaripeta', 'Andhra Pradesh', '523272', true)
ON CONFLICT DO NOTHING;

-- ── Giddalur Mandal ───────────────────────────────────────────
INSERT INTO villages (name, region, district, city, state, pin_code, is_active) VALUES
  ('Giddalur',          'Prakasam', 'Prakasam', 'Giddalur', 'Andhra Pradesh', '523357', true),
  ('Cumbum',            'Prakasam', 'Prakasam', 'Giddalur', 'Andhra Pradesh', '523323', true),
  ('Dornala',           'Prakasam', 'Prakasam', 'Giddalur', 'Andhra Pradesh', '523357', true),
  ('Ardhaveedu',        'Prakasam', 'Prakasam', 'Giddalur', 'Andhra Pradesh', '523357', true)
ON CONFLICT DO NOTHING;

-- ── Ongole Mandal (District HQ) ───────────────────────────────
INSERT INTO villages (name, region, district, city, state, pin_code, is_active) VALUES
  ('Ongole',            'Prakasam', 'Prakasam', 'Ongole',   'Andhra Pradesh', '523001', true),
  ('Kothapatnam',       'Prakasam', 'Prakasam', 'Ongole',   'Andhra Pradesh', '523001', true),
  ('Ramayapatnam',      'Prakasam', 'Prakasam', 'Ongole',   'Andhra Pradesh', '523001', true)
ON CONFLICT DO NOTHING;

-- ── Darsi Mandal ──────────────────────────────────────────────
INSERT INTO villages (name, region, district, city, state, pin_code, is_active) VALUES
  ('Darsi',             'Prakasam', 'Prakasam', 'Darsi',    'Andhra Pradesh', '523247', true),
  ('Karavadi',          'Prakasam', 'Prakasam', 'Darsi',    'Andhra Pradesh', '523247', true),
  ('Ballikurava',       'Prakasam', 'Prakasam', 'Darsi',    'Andhra Pradesh', '523247', true)
ON CONFLICT DO NOTHING;

-- ── Kandukur Mandal ───────────────────────────────────────────
INSERT INTO villages (name, region, district, city, state, pin_code, is_active) VALUES
  ('Kandukur',          'Prakasam', 'Prakasam', 'Kandukur', 'Andhra Pradesh', '523105', true),
  ('Singarayakonda',    'Prakasam', 'Prakasam', 'Kandukur', 'Andhra Pradesh', '523101', true)
ON CONFLICT DO NOTHING;

-- ── Kanigiri Mandal ───────────────────────────────────────────
INSERT INTO villages (name, region, district, city, state, pin_code, is_active) VALUES
  ('Kanigiri',          'Prakasam', 'Prakasam', 'Kanigiri', 'Andhra Pradesh', '523230', true),
  ('Kondapi',           'Prakasam', 'Prakasam', 'Kanigiri', 'Andhra Pradesh', '523230', true),
  ('Zarugumilli',       'Prakasam', 'Prakasam', 'Kanigiri', 'Andhra Pradesh', '523261', true),
  ('Racherla',          'Prakasam', 'Prakasam', 'Kanigiri', 'Andhra Pradesh', '523372', true),
  ('Martur',            'Prakasam', 'Prakasam', 'Kanigiri', 'Andhra Pradesh', '523325', true),
  ('Veligandla',        'Prakasam', 'Prakasam', 'Kanigiri', 'Andhra Pradesh', '523253', true),
  ('Komarolu',          'Prakasam', 'Prakasam', 'Kanigiri', 'Andhra Pradesh', '523367', true)
ON CONFLICT DO NOTHING;



-- ──────────────────────────────────────────────────────────────
-- User Roles & Confirmation (auto-generated from setup-db.js)
-- ──────────────────────────────────────────────────────────────

-- Mark all 3 users as email-confirmed so they can log in immediately
UPDATE auth.users SET
  email_confirmed_at = NOW(),
  confirmation_sent_at = NULL,
  raw_app_meta_data = raw_app_meta_data || '{"provider":"email","providers":["email"]}'::jsonb
WHERE email IN (
  'shaikshahir215455@gmail.com',
  'shaikshahir65@gmail.com',
  'shahirsha215.s@gmail.com'
);

-- Set correct roles on public.users
UPDATE public.users SET role = 'ceo'::user_role,      full_name = 'Shaik Shahir',  is_verified = true
  WHERE id = 'c5770f18-3f93-4e63-bbe8-0f97b79fe074';

UPDATE public.users SET role = 'agent'::user_role,    full_name = 'Shaik Salma',   is_verified = true
  WHERE id = '440d6228-4b66-4b95-8ed9-68cab0b87f07';

UPDATE public.users SET role = 'customer'::user_role, full_name = 'Shaik Shakib',  is_verified = true
  WHERE id = 'd1e98ae9-4695-4b03-8e6f-f47444a76571';

-- Verify
SELECT au.email, u.full_name, u.role, au.email_confirmed_at IS NOT NULL AS confirmed
FROM auth.users au
JOIN public.users u ON u.id = au.id
WHERE au.email IN (
  'shaikshahir215455@gmail.com',
  'shaikshahir65@gmail.com',
  'shahirsha215.s@gmail.com'
)
ORDER BY u.role;
