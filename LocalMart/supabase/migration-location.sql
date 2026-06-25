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
