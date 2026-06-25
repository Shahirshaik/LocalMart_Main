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
