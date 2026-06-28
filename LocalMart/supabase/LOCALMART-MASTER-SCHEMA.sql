-- ============================================================
--  LOCALMART — MASTER POSTGRESQL SCHEMA
--  Version  : 2.0.0  (Enterprise Edition)
--  Platform : Supabase / PostgreSQL 15+
--  Author   : Principal Database Architect
--
--  VERTICAL COVERAGE
--  ─────────────────
--  01. Vegetables & Mandi Prices
--  02. Restaurants & Tiffin Centres
--  03. Gas & LPG Delivery
--  04. Construction Materials & Labour
--  05. Real Estate — Land / Home Sale
--  06. Real Estate — Rentals
--  07. Mechanics — Bike / Car / Auto
--  08. Grocery & Kirana
--  09. Jobs & Employment
--  10. Buy/Sell Vehicles
--  11. Furniture & Home
--  12. Electronics & Mobiles
--
--  ROLE HIERARCHY
--  ──────────────
--  ceo  >  board  >  agent  >  vendor  >  customer
--
--  RUN ORDER
--  ─────────
--  This file is self-contained and idempotent.
--  Safe to re-run; all CREATE statements use IF NOT EXISTS.
-- ============================================================


-- ============================================================
-- SECTION 0 : EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";     -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- fuzzy text search
CREATE EXTENSION IF NOT EXISTS "unaccent";      -- accent-insensitive search


-- ============================================================
-- SECTION 1 : ENUM TYPES
-- ============================================================

-- Drop and recreate or use IF NOT EXISTS workaround
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ceo','board','agent','vendor','customer');
EXCEPTION WHEN duplicate_object THEN
  -- add 'board' if it was missing from an older migration
  BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'board'; EXCEPTION WHEN others THEN NULL; END;
  BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'vendor'; EXCEPTION WHEN others THEN NULL; END;
END $$;

DO $$ BEGIN CREATE TYPE listing_status AS ENUM (
  'draft','pending','active','sold','rented','expired','rejected','archived'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE listing_type AS ENUM (
  'sell','buy','rent','service','job','wanted','mandi'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE price_unit AS ENUM (
  'fixed','negotiable','free',
  'per_day','per_week','per_month','per_year',
  'per_kg','per_quintal','per_tonne',
  'per_unit','per_dozen','per_litre','per_hour'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE property_type AS ENUM (
  'land','house','apartment','villa','commercial_space',
  'farm','plot','shop','warehouse','office'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE construction_category AS ENUM (
  'cement','steel','sand','gravel','bricks','tiles',
  'wood','paint','glass','plumbing','electrical','labour','other'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE vehicle_type AS ENUM (
  'motorcycle','scooter','car','auto_rickshaw',
  'tractor','truck','tempo','bicycle','other'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE fuel_type AS ENUM (
  'petrol','diesel','electric','cng','lpg','other'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE cuisine_type AS ENUM (
  'north_indian','south_indian','chinese','biryani','street_food',
  'tiffin','sweets','bakery','fast_food','multi_cuisine','other'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE app_language AS ENUM ('en','hi','te','ta','kn','ml','bn','mr','gu','pa'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE task_priority AS ENUM ('low','medium','high','urgent'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE task_status   AS ENUM ('new','in_progress','done','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE approval_status AS ENUM (
  'draft',
  'agent_submitted',
  'board_review',
  'board_approved','board_rejected',
  'ceo_review',
  'ceo_approved','ceo_rejected',
  'executed','cancelled'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE gas_cylinder_type AS ENUM (
  'domestic_14kg','commercial_19kg','industrial_47kg','auto_lpg','other'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE mechanic_service AS ENUM (
  'oil_change','puncture_repair','battery','brake','engine_repair',
  'ac_service','denting_painting','tyre_change','general_service','other'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================
-- SECTION 2 : GEOGRAPHIC HIERARCHY
-- ============================================================
-- india_states → india_districts → india_taluks → india_pin_codes
-- All listing and user tables FK into india_pin_codes.pin_code
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS india_states (
  id          SMALLSERIAL PRIMARY KEY,
  code        CHAR(2)  NOT NULL UNIQUE,          -- ISO 3166-2 short (e.g. 'TG','MH')
  name        TEXT     NOT NULL UNIQUE,
  name_hi     TEXT,                               -- Hindi name
  region      TEXT,                               -- North / South / East / West / Central / NE
  is_ut       BOOLEAN  NOT NULL DEFAULT FALSE,    -- Union Territory flag
  capital     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS india_districts (
  id          SERIAL PRIMARY KEY,
  state_id    SMALLINT NOT NULL REFERENCES india_states(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  name_hi     TEXT,
  headquarters TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (state_id, name)
);

CREATE TABLE IF NOT EXISTS india_taluks (
  id           SERIAL PRIMARY KEY,
  district_id  INTEGER NOT NULL REFERENCES india_districts(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  name_hi      TEXT,
  taluk_type   TEXT DEFAULT 'taluk',             -- taluk / mandal / tehsil / block / circle
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (district_id, name)
);

CREATE TABLE IF NOT EXISTS india_pin_codes (
  pin_code    CHAR(6)  NOT NULL,
  taluk_id    INTEGER  REFERENCES india_taluks(id) ON DELETE SET NULL,
  district_id INTEGER  NOT NULL REFERENCES india_districts(id) ON DELETE RESTRICT,
  state_id    SMALLINT NOT NULL REFERENCES india_states(id) ON DELETE RESTRICT,
  office_name TEXT,                              -- Post office name
  village     TEXT,
  city        TEXT,
  lat         NUMERIC(10,7),
  lng         NUMERIC(10,7),
  is_active   BOOLEAN  NOT NULL DEFAULT TRUE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (pin_code, COALESCE(office_name,'_'))
);

-- Convenience view: flat geography
CREATE OR REPLACE VIEW v_geo_full AS
SELECT
  p.pin_code,
  p.office_name,
  p.village,
  p.city,
  p.lat,
  p.lng,
  t.name        AS taluk,
  t.taluk_type,
  d.name        AS district,
  s.name        AS state,
  s.code        AS state_code,
  s.is_ut
FROM india_pin_codes p
JOIN india_districts d ON d.id = p.district_id
JOIN india_states   s ON s.id  = p.state_id
LEFT JOIN india_taluks t ON t.id = p.taluk_id;


-- ── GEOGRAPHY INDEXES ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pin_district ON india_pin_codes (district_id);
CREATE INDEX IF NOT EXISTS idx_pin_state    ON india_pin_codes (state_id);
CREATE INDEX IF NOT EXISTS idx_pin_active   ON india_pin_codes (pin_code) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_district_state ON india_districts (state_id);
CREATE INDEX IF NOT EXISTS idx_taluk_district ON india_taluks (district_id);

-- GiST index for radius queries (lat/lng)
CREATE INDEX IF NOT EXISTS idx_pin_geo
  ON india_pin_codes USING GIST (
    point(lng::float8, lat::float8)
  ) WHERE lat IS NOT NULL AND lng IS NOT NULL;


-- ============================================================
-- SECTION 3 : USERS & ROLE PROFILES
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT,
  phone        TEXT UNIQUE,
  role         user_role      NOT NULL DEFAULT 'customer',
  language     app_language   NOT NULL DEFAULT 'en',

  -- Location (PIN-code level precision)
  pin_code     CHAR(6),
  district_id  INTEGER REFERENCES india_districts(id) ON DELETE SET NULL,
  state_id     SMALLINT REFERENCES india_states(id) ON DELETE SET NULL,

  avatar_url   TEXT,
  bio          TEXT,
  is_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  kyc_status   TEXT NOT NULL DEFAULT 'pending',  -- pending / verified / rejected
  referral_code TEXT UNIQUE,
  referred_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create public.users row when auth.users is inserted
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── VENDOR PROFILES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name   TEXT NOT NULL,
  gst_number      TEXT,
  pan_number      TEXT,
  business_type   TEXT,                           -- sole_proprietor / partnership / pvt_ltd / etc.
  established_year SMALLINT,
  website_url     TEXT,
  whatsapp        TEXT,
  open_hours      JSONB DEFAULT '{}',             -- {"mon":"09:00-21:00","sun":"closed"}
  service_pin_codes TEXT[],                       -- Array of PINs they serve
  rating          NUMERIC(3,2),
  rating_count    INTEGER NOT NULL DEFAULT 0,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── AGENT PROFILES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Coverage territory (array of PIN codes)
  assigned_pin_codes TEXT[] NOT NULL DEFAULT '{}',
  assigned_districts INTEGER[] NOT NULL DEFAULT '{}',
  assigned_states    SMALLINT[] NOT NULL DEFAULT '{}',

  -- Verticals this agent specialises in
  specialised_verticals TEXT[] NOT NULL DEFAULT '{}',

  -- Performance
  commission_pct    NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  total_listings    INTEGER NOT NULL DEFAULT 0,
  total_closed      INTEGER NOT NULL DEFAULT 0,
  total_referrals   INTEGER NOT NULL DEFAULT 0,
  rating            NUMERIC(3,2),
  rating_count      INTEGER NOT NULL DEFAULT 0,
  referral_code     TEXT UNIQUE,

  -- Agent metadata
  notes             TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── BOARD MEMBER PROFILES ─────────────────────────────────
CREATE TABLE IF NOT EXISTS board_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  designation     TEXT NOT NULL DEFAULT 'Board Member',   -- Board Member / Director / Advisor
  department      TEXT,                                   -- Operations / Finance / Technology / Growth
  oversight_states SMALLINT[] NOT NULL DEFAULT '{}',      -- Which states they oversee
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  appointed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  term_ends_at    TIMESTAMPTZ
);


-- ============================================================
-- SECTION 4 : MASTER LISTING TABLE
-- ============================================================
-- Every vertical extends this single master table.
-- Vertical-specific data lives in vertical_* extension tables.
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS listings (
  -- Identity
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id        UUID REFERENCES agents(id) ON DELETE SET NULL,
  vendor_id       UUID REFERENCES vendor_profiles(id) ON DELETE SET NULL,

  -- Vertical classification
  vertical        TEXT NOT NULL,                  -- 'vegetables','food','gas','construction','property','rentals','mechanics','grocery','jobs','vehicles','furniture','mobiles'
  sub_category    TEXT,                           -- Finer bucket within vertical

  -- Core listing data
  type            listing_type   NOT NULL DEFAULT 'sell',
  title           TEXT NOT NULL,
  description     TEXT,
  tags            TEXT[] DEFAULT '{}',
  images          TEXT[] DEFAULT '{}',            -- Supabase Storage URLs
  custom_fields   JSONB  DEFAULT '{}',

  -- Pricing
  price           NUMERIC(15,2),
  price_min       NUMERIC(15,2),                  -- For range pricing
  price_max       NUMERIC(15,2),
  price_unit      price_unit NOT NULL DEFAULT 'fixed',
  currency        CHAR(3)   NOT NULL DEFAULT 'INR',
  is_negotiable   BOOLEAN NOT NULL DEFAULT FALSE,

  -- Geography (all 4 levels stored for fast filtering)
  pin_code        CHAR(6),
  district_id     INTEGER  REFERENCES india_districts(id) ON DELETE SET NULL,
  state_id        SMALLINT REFERENCES india_states(id)    ON DELETE SET NULL,
  address_line    TEXT,
  lat             NUMERIC(10,7),
  lng             NUMERIC(10,7),

  -- Status & moderation
  status          listing_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  is_urgent       BOOLEAN NOT NULL DEFAULT FALSE,
  boosted_until   TIMESTAMPTZ,

  -- Counters
  view_count      INTEGER NOT NULL DEFAULT 0,
  contact_count   INTEGER NOT NULL DEFAULT 0,
  save_count      INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,
  activated_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  sold_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── LISTING IMAGES (normalised) ───────────────────────────
CREATE TABLE IF NOT EXISTS listing_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  caption     TEXT,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- SECTION 5 : VERTICAL EXTENSION TABLES
-- ============================================================
-- Each table has a 1:1 FK to listings(id).
-- JOIN listings l ON l.id = ve.listing_id WHERE l.vertical = '...'
-- ──────────────────────────────────────────────────────────────

-- ── 5A. VEGETABLES & MANDI ────────────────────────────────
CREATE TABLE IF NOT EXISTS ve_vegetables (
  listing_id       UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,

  -- Commodity details
  commodity_name   TEXT NOT NULL,                 -- Tomato / Onion / Rice / Wheat / etc.
  commodity_code   TEXT,                          -- APMC commodity code
  variety          TEXT,                          -- Hybrid / Desi / Organic

  -- Mandi pricing (fluctuates daily)
  mandi_min_price  NUMERIC(10,2),                -- ₹ per quintal / kg
  mandi_max_price  NUMERIC(10,2),
  mandi_modal_price NUMERIC(10,2),               -- Most common price
  price_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  price_unit       TEXT NOT NULL DEFAULT 'per_quintal',

  -- Produce details
  quantity_available NUMERIC(10,2),
  quantity_unit    TEXT DEFAULT 'kg',             -- kg / quintal / tonne / dozen / piece
  quality_grade    TEXT,                          -- A / B / C / Premium
  is_organic       BOOLEAN NOT NULL DEFAULT FALSE,
  harvest_date     DATE,
  expiry_date      DATE,

  -- Source
  farm_name        TEXT,
  farmer_name      TEXT,
  apmc_market      TEXT,                          -- APMC market name
  mandal           TEXT,

  -- Delivery
  delivery_available BOOLEAN NOT NULL DEFAULT FALSE,
  min_order_qty    NUMERIC(10,2),
  packaging        TEXT                           -- Loose / Bag / Box / Crate
);

-- Mandi price history (separate table for time-series)
CREATE TABLE IF NOT EXISTS mandi_price_history (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commodity    TEXT NOT NULL,
  variety      TEXT,
  district_id  INTEGER NOT NULL REFERENCES india_districts(id) ON DELETE CASCADE,
  apmc_market  TEXT,
  price_date   DATE NOT NULL,
  min_price    NUMERIC(10,2) NOT NULL,
  max_price    NUMERIC(10,2) NOT NULL,
  modal_price  NUMERIC(10,2) NOT NULL,
  unit         TEXT NOT NULL DEFAULT 'per_quintal',
  source       TEXT DEFAULT 'agmarknet',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (commodity, district_id, price_date, apmc_market)
);


-- ── 5B. RESTAURANTS & TIFFIN ──────────────────────────────
CREATE TABLE IF NOT EXISTS ve_restaurants (
  listing_id       UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,

  -- Business identity
  restaurant_name  TEXT NOT NULL,
  fssai_number     TEXT,                          -- Food Safety licence
  cuisine          cuisine_type[] NOT NULL DEFAULT '{"other"}',
  is_pure_veg      BOOLEAN NOT NULL DEFAULT FALSE,
  is_jain_friendly BOOLEAN NOT NULL DEFAULT FALSE,

  -- Operations
  seating_capacity INTEGER,
  has_ac           BOOLEAN NOT NULL DEFAULT FALSE,
  has_parking      BOOLEAN NOT NULL DEFAULT FALSE,
  accepts_online_booking BOOLEAN NOT NULL DEFAULT FALSE,

  -- Delivery
  delivery_available BOOLEAN NOT NULL DEFAULT FALSE,
  delivery_radius_km NUMERIC(5,2),
  min_order_amount NUMERIC(8,2),
  platform_links   JSONB DEFAULT '{}',            -- {"zomato":"url","swiggy":"url"}

  -- Menu summary (full menu in a separate table)
  price_range_min  NUMERIC(8,2),
  price_range_max  NUMERIC(8,2),
  speciality_dish  TEXT,
  timings          JSONB DEFAULT '{}',            -- {"open":"08:00","close":"22:00","days":["Mon","Tue",...]}
  home_delivery_timing JSONB DEFAULT '{}'
);

-- Menu items (tiffin / restaurant)
CREATE TABLE IF NOT EXISTS restaurant_menu_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id   UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  category     TEXT,                              -- Starter / Main / Dessert / Tiffin item
  price        NUMERIC(8,2) NOT NULL,
  is_veg       BOOLEAN NOT NULL DEFAULT TRUE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  image_url    TEXT,
  sort_order   SMALLINT DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── 5C. GAS & LPG DELIVERY ────────────────────────────────
CREATE TABLE IF NOT EXISTS ve_gas (
  listing_id         UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,

  agency_name        TEXT NOT NULL,
  distributor_name   TEXT,
  oil_company        TEXT,                        -- HPCL / BPCL / IOCL / Indane
  dealer_code        TEXT,

  cylinder_type      gas_cylinder_type NOT NULL DEFAULT 'domestic_14kg',
  cylinder_price     NUMERIC(8,2) NOT NULL,       -- Current MRP
  subsidy_price      NUMERIC(8,2),                -- After Ujjwala / subsidy
  cylinder_price_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Service details
  delivery_available BOOLEAN NOT NULL DEFAULT TRUE,
  delivery_charge    NUMERIC(6,2) DEFAULT 0,
  delivery_time_hours INTEGER,                    -- Expected delivery in hours
  service_area_pin_codes TEXT[] DEFAULT '{}',
  accepts_digital_payment BOOLEAN DEFAULT TRUE,
  booking_methods    TEXT[] DEFAULT '{"phone"}',  -- phone / whatsapp / app / website

  -- Connections
  new_connection_available BOOLEAN DEFAULT FALSE,
  transfer_available BOOLEAN DEFAULT FALSE,
  safety_equipment_available BOOLEAN DEFAULT FALSE,

  -- Auto-LPG
  is_auto_lpg        BOOLEAN DEFAULT FALSE,
  pump_address       TEXT
);

-- Gas price history
CREATE TABLE IF NOT EXISTS gas_price_history (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oil_company  TEXT NOT NULL,
  cylinder_type gas_cylinder_type NOT NULL,
  state_id     SMALLINT NOT NULL REFERENCES india_states(id),
  price        NUMERIC(8,2) NOT NULL,
  subsidy_price NUMERIC(8,2),
  effective_date DATE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (oil_company, cylinder_type, state_id, effective_date)
);


-- ── 5D. CONSTRUCTION MATERIALS & LABOUR ───────────────────
CREATE TABLE IF NOT EXISTS ve_construction (
  listing_id      UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,

  -- Material identity
  category        construction_category NOT NULL DEFAULT 'other',
  material_name   TEXT NOT NULL,
  brand           TEXT,
  grade_or_spec   TEXT,                           -- M25 cement / Fe500 steel / etc.

  -- Quantity
  quantity        NUMERIC(12,2),
  quantity_unit   TEXT DEFAULT 'kg',
  min_order_qty   NUMERIC(12,2),
  bulk_discount_pct NUMERIC(5,2),

  -- Delivery
  delivery_available BOOLEAN DEFAULT FALSE,
  delivery_radius_km NUMERIC(5,2),
  delivery_charge NUMERIC(8,2),
  loading_facility BOOLEAN DEFAULT FALSE,

  -- Labour (if type = labour)
  is_labour_service BOOLEAN DEFAULT FALSE,
  labour_type     TEXT,                           -- Mason / Carpenter / Plumber / Electrician / Painter
  experience_years INTEGER,
  daily_rate      NUMERIC(8,2),
  team_size       INTEGER,
  tools_included  BOOLEAN DEFAULT FALSE,

  -- Certifications
  isi_marked      BOOLEAN DEFAULT FALSE,
  bis_certified   BOOLEAN DEFAULT FALSE
);


-- ── 5E. REAL ESTATE — PROPERTY (SALE & RENTAL) ────────────
CREATE TABLE IF NOT EXISTS ve_real_estate (
  listing_id       UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,

  -- Property classification
  property_type    property_type NOT NULL DEFAULT 'house',
  is_for_rent      BOOLEAN NOT NULL DEFAULT FALSE,  -- FALSE = Sale, TRUE = Rental

  -- Dimensions
  plot_area_sqft   NUMERIC(12,2),
  builtup_area_sqft NUMERIC(12,2),
  carpet_area_sqft NUMERIC(12,2),
  floors_total     SMALLINT,
  floor_number     SMALLINT,
  facing           TEXT,                          -- East / West / North / South / North-East / etc.

  -- Bedroom / bathroom
  bedrooms         SMALLINT,
  bathrooms        SMALLINT,
  balconies        SMALLINT,
  parking_slots    SMALLINT,

  -- Age & legal
  construction_year SMALLINT,
  possession_status TEXT,                         -- Ready / Under Construction / Immediate
  ownership_type   TEXT,                          -- Freehold / Leasehold / Co-op / Govt Allotment
  title_status     TEXT,                          -- Clear / Disputed / Under Litigation
  rera_number      TEXT,
  encumbrance_free BOOLEAN DEFAULT TRUE,

  -- Amenities (stored as JSONB for flexibility)
  amenities        JSONB DEFAULT '{}',
  -- e.g. {"lift":true,"gym":false,"swimming_pool":false,"power_backup":true,"security_24x7":true}

  -- Rental-specific
  rent_per_month   NUMERIC(12,2),
  security_deposit NUMERIC(12,2),
  maintenance_charge NUMERIC(8,2),
  furnishing       TEXT,                          -- Unfurnished / Semi / Fully
  preferred_tenant TEXT,                          -- Family / Bachelor / Company
  min_lease_months INTEGER,

  -- Sale-specific
  sale_price       NUMERIC(15,2),
  price_per_sqft   NUMERIC(10,2),
  includes_gst     BOOLEAN DEFAULT FALSE,
  home_loan_available BOOLEAN DEFAULT FALSE,
  bank_approved    BOOLEAN DEFAULT FALSE,

  -- Nearby landmarks (stored as JSONB)
  nearby           JSONB DEFAULT '{}'
  -- e.g. {"hospital_km":1.2,"school_km":0.5,"bus_stop_km":0.1,"market_km":0.8}
);


-- ── 5F. MECHANICS — BIKE / CAR / AUTO ─────────────────────
CREATE TABLE IF NOT EXISTS ve_mechanics (
  listing_id        UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,

  -- Shop identity
  shop_name         TEXT NOT NULL,
  mechanic_name     TEXT,
  years_experience  INTEGER,

  -- Vehicle types served
  vehicle_types     vehicle_type[] NOT NULL DEFAULT '{"car"}',
  brand_speciality  TEXT[],                       -- Maruti / Honda / Bajaj / TVS / etc.

  -- Services offered
  services          mechanic_service[] NOT NULL DEFAULT '{"general_service"}',
  service_descriptions JSONB DEFAULT '{}',        -- {"oil_change":"₹300 incl filter","puncture":"₹50 per tyre"}

  -- Facility
  has_workshop      BOOLEAN DEFAULT TRUE,
  pickup_drop_available BOOLEAN DEFAULT FALSE,
  pickup_charge     NUMERIC(6,2),

  -- Certifications
  oem_authorised    BOOLEAN DEFAULT FALSE,        -- Maruti True Value / Honda Pro etc.
  certifications    TEXT[],

  -- Pricing
  inspection_charge NUMERIC(6,2) DEFAULT 0,
  accepts_insurance BOOLEAN DEFAULT FALSE,
  insurance_partners TEXT[],

  -- Timing
  open_days         TEXT[] DEFAULT '{"Mon","Tue","Wed","Thu","Fri","Sat"}',
  open_time         TIME,
  close_time        TIME,
  is_24x7           BOOLEAN DEFAULT FALSE
);


-- ── 5G. GROCERY & KIRANA ──────────────────────────────────
CREATE TABLE IF NOT EXISTS ve_grocery (
  listing_id        UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  shop_name         TEXT NOT NULL,
  gstin             TEXT,
  product_name      TEXT NOT NULL,
  brand             TEXT,
  weight_or_size    TEXT,                         -- 500g / 1L / 1kg / etc.
  mrp               NUMERIC(8,2),
  selling_price     NUMERIC(8,2) NOT NULL,
  stock_qty         INTEGER DEFAULT 0,
  is_in_stock       BOOLEAN DEFAULT TRUE,
  expiry_date       DATE,
  home_delivery     BOOLEAN DEFAULT FALSE,
  min_order_amt     NUMERIC(8,2),
  delivery_area_pin_codes TEXT[] DEFAULT '{}'
);


-- ── 5H. JOBS & EMPLOYMENT ─────────────────────────────────
CREATE TABLE IF NOT EXISTS ve_jobs (
  listing_id         UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,

  -- Employer / Job details
  company_name       TEXT,
  job_title          TEXT NOT NULL,
  department         TEXT,
  industry           TEXT,
  job_type           TEXT NOT NULL DEFAULT 'full_time',  -- full_time / part_time / contract / internship / daily_wage
  work_mode          TEXT NOT NULL DEFAULT 'on_site',    -- on_site / remote / hybrid

  -- Compensation
  salary_min         NUMERIC(12,2),
  salary_max         NUMERIC(12,2),
  salary_unit        TEXT DEFAULT 'per_month',           -- per_day / per_month / per_year
  includes_esi       BOOLEAN DEFAULT FALSE,
  includes_pf        BOOLEAN DEFAULT FALSE,

  -- Requirements
  min_education      TEXT,                               -- 10th / 12th / Diploma / Graduation
  min_experience_yrs INTEGER DEFAULT 0,
  skills             TEXT[] DEFAULT '{}',
  languages          TEXT[] DEFAULT '{"Hindi"}',

  -- Openings
  openings           INTEGER DEFAULT 1,
  gender_preference  TEXT DEFAULT 'any',                 -- any / male / female
  age_min            SMALLINT,
  age_max            SMALLINT,

  -- Application
  apply_via          TEXT DEFAULT 'phone',               -- phone / whatsapp / email / walk_in
  walk_in_address    TEXT,
  walk_in_days       TEXT[],
  interview_process  TEXT,
  joining_date       DATE
);


-- ── 5I. BUY/SELL VEHICLES ─────────────────────────────────
CREATE TABLE IF NOT EXISTS ve_vehicles (
  listing_id      UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,

  make            TEXT NOT NULL,                 -- Maruti / Honda / Bajaj / Hero / Tata / etc.
  model           TEXT NOT NULL,
  variant         TEXT,
  year            SMALLINT NOT NULL,
  vehicle_type    vehicle_type NOT NULL DEFAULT 'car',
  fuel_type       fuel_type NOT NULL DEFAULT 'petrol',
  transmission    TEXT DEFAULT 'manual',         -- manual / automatic / amt
  colour          TEXT,

  -- Odometer
  km_driven       INTEGER,
  no_of_owners    SMALLINT DEFAULT 1,

  -- Condition
  condition       TEXT DEFAULT 'good',           -- excellent / good / fair / needs_repair
  accident_history BOOLEAN DEFAULT FALSE,
  is_rc_available BOOLEAN DEFAULT TRUE,
  insurance_valid_until DATE,
  puc_valid_until DATE,
  hypothecation   BOOLEAN DEFAULT FALSE,         -- Under loan?

  -- Features
  features        JSONB DEFAULT '{}',
  -- e.g. {"abs":true,"airbags":2,"sunroof":false,"reverse_camera":true}

  seller_type     TEXT DEFAULT 'individual'      -- individual / dealer
);


-- ── 5J. FURNITURE & HOME ──────────────────────────────────
CREATE TABLE IF NOT EXISTS ve_furniture (
  listing_id    UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  item_name     TEXT NOT NULL,
  category      TEXT,                            -- Sofa / Bed / Wardrobe / Table / Chair / Appliance
  brand         TEXT,
  material      TEXT,                            -- Wood / Steel / Fabric / Plastic
  colour        TEXT,
  dimensions    TEXT,                            -- "6x4 ft" / "L200xW90xH75 cm"
  age_years     SMALLINT,
  condition     TEXT DEFAULT 'good',
  assembly_required BOOLEAN DEFAULT FALSE,
  delivery_available BOOLEAN DEFAULT FALSE
);


-- ── 5K. ELECTRONICS & MOBILES ─────────────────────────────
CREATE TABLE IF NOT EXISTS ve_electronics (
  listing_id     UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
  item_name      TEXT NOT NULL,
  brand          TEXT NOT NULL,
  model          TEXT,
  category       TEXT,                           -- Mobile / Laptop / TV / AC / Washing Machine
  storage        TEXT,                           -- 128GB / 256GB / 512GB
  ram            TEXT,
  colour         TEXT,
  condition      TEXT DEFAULT 'good',
  warranty_months SMALLINT DEFAULT 0,
  bill_available BOOLEAN DEFAULT FALSE,
  box_available  BOOLEAN DEFAULT FALSE,
  age_months     SMALLINT,
  imei           TEXT,                           -- For mobiles (masked)
  is_unlocked    BOOLEAN DEFAULT TRUE
);


-- ============================================================
-- SECTION 6 : COMMERCE, WORKFLOWS & ENGAGEMENT
-- ============================================================

-- ── Contact Requests (buyer ↔ seller connection) ──────────
CREATE TABLE IF NOT EXISTS contact_requests (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id       UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id         UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Collected from un-authenticated or new users too
  buyer_name       TEXT NOT NULL,
  buyer_phone      TEXT NOT NULL,
  buyer_email      TEXT,
  message          TEXT,

  -- Agent handling
  agent_id         UUID REFERENCES agents(id) ON DELETE SET NULL,
  agent_notes      TEXT,
  commission_earned NUMERIC(10,2),
  site_visit_scheduled_at TIMESTAMPTZ,
  site_visit_done  BOOLEAN DEFAULT FALSE,

  status           TEXT NOT NULL DEFAULT 'new',  -- new / contacted / in_progress / closed / cancelled
  closed_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Saved / Wishlist ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_listings (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

-- ── Listing Reviews ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS listing_reviews (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id   UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reviewer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id     UUID REFERENCES agents(id) ON DELETE SET NULL,
  rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title        TEXT,
  comment      TEXT,
  is_verified_buyer BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_id, reviewer_id)
);

-- ── Agent Earnings (commission ledger) ────────────────────
CREATE TABLE IF NOT EXISTS agent_earnings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id            UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  contact_request_id  UUID REFERENCES contact_requests(id) ON DELETE SET NULL,
  listing_id          UUID REFERENCES listings(id) ON DELETE SET NULL,
  type                TEXT NOT NULL DEFAULT 'commission',  -- commission / referral_bonus / task_bonus / daily_bonus
  amount              NUMERIC(12,2) NOT NULL DEFAULT 0,
  description         TEXT,
  earned_at           DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_at             TIMESTAMPTZ,
  is_paid             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tasks (assigned by CEO/Board/Agent) ───────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assigned_by  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  agent_id     UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  listing_id   UUID REFERENCES listings(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  priority     task_priority NOT NULL DEFAULT 'medium',
  status       task_status   NOT NULL DEFAULT 'new',
  due_date     DATE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Notifications ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT,
  type        TEXT NOT NULL DEFAULT 'info',   -- info / success / warning / listing / task / approval
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  link_type   TEXT,                           -- listing / task / workflow / profile
  link_id     UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- SECTION 7 : APPROVAL WORKFLOW — STATE MACHINE
-- ============================================================
--
--  STATES
--  ───────
--  draft ──► agent_submitted
--  agent_submitted ──► board_review
--  board_review ──► board_approved ──► ceo_review
--  board_review ──► board_rejected ──► agent_submitted (resubmit)
--  ceo_review ──► ceo_approved ──► executed
--  ceo_review ──► ceo_rejected ──► board_review (re-review)
--  any ──► cancelled
--
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS approval_workflows (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  description     TEXT,

  -- Who submitted (always an agent or CEO)
  submitted_by    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Workflow type
  type            TEXT NOT NULL DEFAULT 'listing_action',
  -- listing_action / price_change / agent_task / marketing_campaign / policy_change / village_expansion

  -- Reference to the entity being acted on
  entity_type     TEXT,                           -- listing / agent / vendor / campaign
  entity_id       UUID,

  -- Payload (flexible JSONB for type-specific data)
  payload         JSONB NOT NULL DEFAULT '{}',

  -- State machine
  status          approval_status NOT NULL DEFAULT 'draft',

  -- Agent layer
  agent_notes     TEXT,
  agent_submitted_at TIMESTAMPTZ,

  -- Board layer
  board_reviewer  UUID REFERENCES users(id) ON DELETE SET NULL,
  board_notes     TEXT,
  board_reviewed_at TIMESTAMPTZ,
  board_rejection_reason TEXT,

  -- CEO layer
  ceo_reviewer    UUID REFERENCES users(id) ON DELETE SET NULL,
  ceo_notes       TEXT,
  ceo_reviewed_at TIMESTAMPTZ,
  ceo_rejection_reason TEXT,

  -- Execution
  executed_at     TIMESTAMPTZ,
  execution_log   JSONB DEFAULT '{}',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- State machine transition log (audit trail)
CREATE TABLE IF NOT EXISTS workflow_transitions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id   UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  from_status   approval_status,
  to_status     approval_status NOT NULL,
  transitioned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes         TEXT,
  transitioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-log every status change
CREATE OR REPLACE FUNCTION log_workflow_transition()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO workflow_transitions (workflow_id, from_status, to_status, transitioned_at)
    VALUES (NEW.id, OLD.status, NEW.status, NOW());
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workflow_transition ON approval_workflows;
CREATE TRIGGER trg_workflow_transition
  BEFORE UPDATE ON approval_workflows
  FOR EACH ROW EXECUTE FUNCTION log_workflow_transition();


-- ============================================================
-- SECTION 8 : AI MULTI-AGENT ECOSYSTEM TABLES
-- ============================================================

-- Agent types: 'operations' | 'marketing' | 'user_proxy' | 'coordinator'

CREATE TABLE IF NOT EXISTS ai_agents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL UNIQUE,
  type          TEXT NOT NULL,                    -- operations / marketing / user_proxy / coordinator
  model         TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  system_prompt TEXT,
  tools         TEXT[] DEFAULT '{}',              -- Tool names this agent can use
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  max_iterations INTEGER DEFAULT 10,
  temperature   NUMERIC(3,2) DEFAULT 0.3,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_agent_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id        UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  agent_type      TEXT NOT NULL,
  action          TEXT NOT NULL,                  -- route_listing / boost_listing / answer_query / etc.

  -- Context
  listing_id      UUID REFERENCES listings(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  workflow_id     UUID REFERENCES approval_workflows(id) ON DELETE SET NULL,

  -- LLM I/O
  input_tokens    INTEGER,
  output_tokens   INTEGER,
  input           JSONB DEFAULT '{}',
  output          JSONB DEFAULT '{}',

  status          TEXT NOT NULL DEFAULT 'completed',  -- pending / processing / completed / failed / requires_approval
  error_message   TEXT,
  duration_ms     INTEGER,

  -- Did this agent action trigger a human approval?
  requires_human_approval BOOLEAN NOT NULL DEFAULT FALSE,
  workflow_created_id UUID REFERENCES approval_workflows(id) ON DELETE SET NULL,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent message bus (inter-agent communication)
CREATE TABLE IF NOT EXISTS ai_agent_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_agent_type TEXT NOT NULL,
  to_agent_type   TEXT NOT NULL,
  message_type    TEXT NOT NULL,                  -- task / result / escalate / broadcast
  payload         JSONB NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'pending', -- pending / delivered / processed
  priority        SMALLINT DEFAULT 5,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at    TIMESTAMPTZ,
  processed_at    TIMESTAMPTZ
);

-- Seed default AI agents
INSERT INTO ai_agents (name, type, system_prompt, tools) VALUES
  (
    'Operations Agent',
    'operations',
    'You are the Operations Agent for LocalMart India. You assign listings to the right agents based on their territory and expertise, monitor listing quality, track performance metrics, and manage the operational backbone of the marketplace.',
    ARRAY['assign_listing','update_listing_status','create_task','query_agents','get_listings_by_pin']
  ),
  (
    'Marketing Agent',
    'marketing',
    'You are the Marketing Agent for LocalMart India. You identify high-value listings, boost them via featured placements, target buyers by PIN code, run promotional campaigns, and report on conversion metrics.',
    ARRAY['boost_listing','create_campaign','send_notification','query_listings','get_buyer_intent']
  ),
  (
    'User Proxy Agent',
    'user_proxy',
    'You are the User Proxy Agent for LocalMart India. You handle buyer queries in the user''s local language, facilitate negotiations between buyers and sellers, schedule site visits, and escalate complex cases to human agents.',
    ARRAY['answer_query','schedule_visit','send_message','create_contact_request','translate_message']
  ),
  (
    'Agent Coordinator',
    'coordinator',
    'You are the Agent Coordinator for LocalMart India. You route incoming tasks to the correct specialist agent (Operations / Marketing / User Proxy), resolve conflicts, maintain the task queue, and escalate to human approval workflows when required.',
    ARRAY['route_task','broadcast_message','escalate_to_human','get_agent_status','summarise_activity']
  )
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- SECTION 9 : COMPREHENSIVE INDEXES
-- ============================================================

-- ── Listings — the most-queried table ─────────────────────
CREATE INDEX IF NOT EXISTS idx_listings_vertical    ON listings (vertical);
CREATE INDEX IF NOT EXISTS idx_listings_status      ON listings (status);
CREATE INDEX IF NOT EXISTS idx_listings_pin         ON listings (pin_code);
CREATE INDEX IF NOT EXISTS idx_listings_district    ON listings (district_id);
CREATE INDEX IF NOT EXISTS idx_listings_state       ON listings (state_id);
CREATE INDEX IF NOT EXISTS idx_listings_user        ON listings (user_id);
CREATE INDEX IF NOT EXISTS idx_listings_agent       ON listings (agent_id);
CREATE INDEX IF NOT EXISTS idx_listings_featured    ON listings (is_featured) WHERE is_featured;
CREATE INDEX IF NOT EXISTS idx_listings_expires     ON listings (expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_listings_submitted   ON listings (submitted_at DESC);

-- Composite: the #1 query pattern — active listings by area and vertical
CREATE INDEX IF NOT EXISTS idx_listings_area_vertical
  ON listings (state_id, district_id, vertical, status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_listings_pin_vertical
  ON listings (pin_code, vertical, status)
  WHERE status IN ('active','pending');

-- Full-text search on title + description
CREATE INDEX IF NOT EXISTS idx_listings_fts
  ON listings USING GIN (
    to_tsvector('english', unaccent(title) || ' ' || unaccent(COALESCE(description,'')))
  );

-- Tags array search
CREATE INDEX IF NOT EXISTS idx_listings_tags ON listings USING GIN (tags);

-- GiST index for radius / bounding-box queries
CREATE INDEX IF NOT EXISTS idx_listings_geo
  ON listings USING GIST (point(lng::float8, lat::float8))
  WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- ── Users ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_role     ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_pin      ON users (pin_code);
CREATE INDEX IF NOT EXISTS idx_users_district ON users (district_id);
CREATE INDEX IF NOT EXISTS idx_users_active   ON users (is_active) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_users_verified ON users (is_verified) WHERE is_verified;

-- ── Agents ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_agents_pin_codes  ON agents USING GIN (assigned_pin_codes);
CREATE INDEX IF NOT EXISTS idx_agents_districts  ON agents USING GIN (assigned_districts);
CREATE INDEX IF NOT EXISTS idx_agents_verticals  ON agents USING GIN (specialised_verticals);
CREATE INDEX IF NOT EXISTS idx_agents_active     ON agents (is_active) WHERE is_active;

-- ── Contact requests ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contacts_listing ON contact_requests (listing_id);
CREATE INDEX IF NOT EXISTS idx_contacts_agent   ON contact_requests (agent_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status  ON contact_requests (status);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contact_requests (created_at DESC);

-- ── Notifications ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON notifications (user_id, is_read)
  WHERE is_read = FALSE;

-- ── Mandi prices ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mandi_commodity ON mandi_price_history (commodity, price_date DESC);
CREATE INDEX IF NOT EXISTS idx_mandi_district  ON mandi_price_history (district_id, price_date DESC);

-- ── Approval workflows ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_workflow_status  ON approval_workflows (status);
CREATE INDEX IF NOT EXISTS idx_workflow_submitter ON approval_workflows (submitted_by);
CREATE INDEX IF NOT EXISTS idx_workflow_board   ON approval_workflows (board_reviewer) WHERE board_reviewer IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_ceo     ON approval_workflows (ceo_reviewer) WHERE ceo_reviewer IS NOT NULL;

-- ── Tasks ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tasks_agent  ON tasks (agent_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due    ON tasks (due_date) WHERE status <> 'done';

-- ── AI logs ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ai_logs_agent_type ON ai_agent_logs (agent_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_listing    ON ai_agent_logs (listing_id) WHERE listing_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_msgs_to         ON ai_agent_messages (to_agent_type, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mandi_price_uniq
  ON mandi_price_history (commodity, district_id, price_date, COALESCE(apmc_market,'_'));

-- ── Vertical extension tables ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_veg_commodity  ON ve_vegetables (commodity_name, price_date DESC);
CREATE INDEX IF NOT EXISTS idx_veg_organic    ON ve_vegetables (is_organic) WHERE is_organic;
CREATE INDEX IF NOT EXISTS idx_gas_type       ON ve_gas (cylinder_type);
CREATE INDEX IF NOT EXISTS idx_re_type        ON ve_real_estate (property_type, is_for_rent);
CREATE INDEX IF NOT EXISTS idx_mech_vehicles  ON ve_mechanics USING GIN (vehicle_types);
CREATE INDEX IF NOT EXISTS idx_job_type       ON ve_jobs (job_type, industry);
CREATE INDEX IF NOT EXISTS idx_vehicle_make   ON ve_vehicles (make, model, year);


-- ============================================================
-- SECTION 10 : FUNCTIONS & TRIGGERS
-- ============================================================

-- ── touch updated_at on every UPDATE ──────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$$;

DO $$ DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users','agents','vendor_profiles','listings',
    'contact_requests','tasks','approval_workflows'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated ON %s;
       CREATE TRIGGER trg_%s_updated
         BEFORE UPDATE ON %s
         FOR EACH ROW EXECUTE FUNCTION touch_updated_at()',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END $$;

-- ── Auto-set listing expiry when activated ────────────────
CREATE OR REPLACE FUNCTION set_listing_expiry()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status <> 'active') THEN
    NEW.activated_at := NOW();
    NEW.reviewed_at  := NOW();
    NEW.expires_at   := NOW() + INTERVAL '30 days';
  END IF;
  IF NEW.status IN ('sold','rented') AND OLD.status <> NEW.status THEN
    NEW.sold_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_listing_expiry ON listings;
CREATE TRIGGER trg_listing_expiry
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION set_listing_expiry();

-- ── Expire listings past their expiry_at ─────────────────
CREATE OR REPLACE FUNCTION expire_old_listings()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE listings SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' AND expires_at < NOW();
END;
$$;

-- ── Sync agent listing counts ─────────────────────────────
CREATE OR REPLACE FUNCTION sync_agent_stats()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.agent_id IS NOT NULL AND NEW.status = 'active' AND (OLD.status <> 'active' OR OLD.agent_id IS DISTINCT FROM NEW.agent_id) THEN
      UPDATE agents SET total_listings = total_listings + 1 WHERE id = NEW.agent_id;
    END IF;
    IF NEW.status IN ('sold','rented') AND OLD.status NOT IN ('sold','rented') AND NEW.agent_id IS NOT NULL THEN
      UPDATE agents SET total_closed = total_closed + 1 WHERE id = NEW.agent_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agent_stats ON listings;
CREATE TRIGGER trg_agent_stats
  AFTER UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION sync_agent_stats();

-- ── Refresh agent rating after review ────────────────────
CREATE OR REPLACE FUNCTION refresh_agent_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE agents a
  SET rating       = sub.avg,
      rating_count = sub.cnt,
      updated_at   = NOW()
  FROM (
    SELECT AVG(r.rating)::NUMERIC(3,2) AS avg, COUNT(*) AS cnt
    FROM listing_reviews r
    JOIN listings l ON l.id = r.listing_id
    WHERE l.agent_id = NEW.agent_id
  ) sub
  WHERE a.id = (SELECT agent_id FROM listings WHERE id = NEW.listing_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agent_rating ON listing_reviews;
CREATE TRIGGER trg_agent_rating
  AFTER INSERT OR UPDATE ON listing_reviews
  FOR EACH ROW EXECUTE FUNCTION refresh_agent_rating();

-- ── Helper functions for RLS ──────────────────────────────
CREATE OR REPLACE FUNCTION is_ceo() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ceo');
$$;

CREATE OR REPLACE FUNCTION is_board_or_above() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ceo','board'));
$$;

CREATE OR REPLACE FUNCTION is_agent_or_above() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ceo','board','agent'));
$$;

CREATE OR REPLACE FUNCTION my_role() RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION my_agent_id() RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM agents WHERE user_id = auth.uid();
$$;


-- ============================================================
-- SECTION 11 : ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_listings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_reviews  ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_earnings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE india_states     ENABLE ROW LEVEL SECURITY;
ALTER TABLE india_districts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE india_taluks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE india_pin_codes  ENABLE ROW LEVEL SECURITY;

-- ── Geography — public read ────────────────────────────────
CREATE POLICY "geo_public_read" ON india_states     FOR SELECT USING (true);
CREATE POLICY "geo_public_read" ON india_districts  FOR SELECT USING (true);
CREATE POLICY "geo_public_read" ON india_taluks     FOR SELECT USING (true);
CREATE POLICY "geo_public_read" ON india_pin_codes  FOR SELECT USING (is_active);
CREATE POLICY "geo_ceo_all"     ON india_states     FOR ALL USING (is_ceo()) WITH CHECK (is_ceo());
CREATE POLICY "geo_ceo_all"     ON india_districts  FOR ALL USING (is_ceo()) WITH CHECK (is_ceo());
CREATE POLICY "geo_ceo_all"     ON india_taluks     FOR ALL USING (is_ceo()) WITH CHECK (is_ceo());
CREATE POLICY "geo_ceo_all"     ON india_pin_codes  FOR ALL USING (is_ceo()) WITH CHECK (is_ceo());

-- ── Users ─────────────────────────────────────────────────
CREATE POLICY "users_select_own_or_agent_up"
  ON users FOR SELECT
  USING (id = auth.uid() OR is_agent_or_above());

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM users WHERE id = auth.uid()));

CREATE POLICY "users_ceo_all" ON users FOR ALL USING (is_ceo()) WITH CHECK (is_ceo());

-- ── Listings ──────────────────────────────────────────────
CREATE POLICY "listings_active_public"
  ON listings FOR SELECT USING (status = 'active');

CREATE POLICY "listings_owner_select"
  ON listings FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "listings_agent_territory"
  ON listings FOR SELECT
  USING (
    is_agent_or_above() AND (
      pin_code = ANY (SELECT unnest(a.assigned_pin_codes) FROM agents a WHERE a.user_id = auth.uid())
      OR district_id = ANY (SELECT unnest(a.assigned_districts) FROM agents a WHERE a.user_id = auth.uid())
    )
  );

CREATE POLICY "listings_owner_insert"
  ON listings FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "listings_owner_update"
  ON listings FOR UPDATE
  USING (user_id = auth.uid() AND status IN ('draft','pending'));

CREATE POLICY "listings_agent_update"
  ON listings FOR UPDATE
  USING (
    is_agent_or_above() AND (
      pin_code = ANY (SELECT unnest(a.assigned_pin_codes) FROM agents a WHERE a.user_id = auth.uid())
    )
  );

CREATE POLICY "listings_ceo_all"
  ON listings FOR ALL USING (is_ceo()) WITH CHECK (is_ceo());

-- ── Contact requests ──────────────────────────────────────
CREATE POLICY "contacts_own"    ON contact_requests FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY "contacts_agent"  ON contact_requests FOR SELECT USING (agent_id = my_agent_id());
CREATE POLICY "contacts_insert" ON contact_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "contacts_agent_update" ON contact_requests FOR UPDATE USING (agent_id = my_agent_id());
CREATE POLICY "contacts_ceo"    ON contact_requests FOR ALL USING (is_board_or_above());

-- ── Approval workflows ────────────────────────────────────
CREATE POLICY "workflow_submitter"
  ON approval_workflows FOR SELECT USING (submitted_by = auth.uid());

CREATE POLICY "workflow_board_select"
  ON approval_workflows FOR SELECT
  USING (is_board_or_above() AND status IN ('board_review','board_approved','board_rejected','ceo_review','ceo_approved','ceo_rejected','executed'));

CREATE POLICY "workflow_agent_insert"
  ON approval_workflows FOR INSERT
  WITH CHECK (submitted_by = auth.uid() AND is_agent_or_above());

CREATE POLICY "workflow_board_update"
  ON approval_workflows FOR UPDATE
  USING (is_board_or_above());

CREATE POLICY "workflow_ceo_all"
  ON approval_workflows FOR ALL USING (is_ceo()) WITH CHECK (is_ceo());

-- ── Notifications ─────────────────────────────────────────
CREATE POLICY "notif_own"
  ON notifications FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "notif_ceo_insert"
  ON notifications FOR INSERT WITH CHECK (is_agent_or_above());

-- ── Tasks ─────────────────────────────────────────────────
CREATE POLICY "tasks_ceo_all"    ON tasks FOR ALL USING (is_board_or_above()) WITH CHECK (is_board_or_above());
CREATE POLICY "tasks_agent_own"  ON tasks FOR SELECT USING (agent_id = my_agent_id());
CREATE POLICY "tasks_agent_upd"  ON tasks FOR UPDATE USING (agent_id = my_agent_id());

-- ── Agent earnings ────────────────────────────────────────
CREATE POLICY "earnings_own"     ON agent_earnings FOR SELECT USING (agent_id = my_agent_id());
CREATE POLICY "earnings_ceo"     ON agent_earnings FOR ALL USING (is_board_or_above());

-- ── AI logs ───────────────────────────────────────────────
CREATE POLICY "ai_logs_ceo"      ON ai_agent_logs FOR ALL USING (is_ceo());


-- ============================================================
-- SECTION 12 : MATERIALISED VIEWS & REGULAR VIEWS
-- ============================================================

-- ── Full listing detail view ──────────────────────────────
CREATE OR REPLACE VIEW v_listings_full AS
SELECT
  l.id, l.vertical, l.type, l.title, l.description,
  l.price, l.price_unit, l.price_min, l.price_max,
  l.is_negotiable, l.is_featured, l.is_urgent,
  l.status, l.view_count, l.contact_count, l.save_count,
  l.submitted_at, l.expires_at, l.images,
  l.pin_code, l.address_line, l.lat, l.lng,
  d.name  AS district,
  s.name  AS state,
  s.code  AS state_code,
  t.name  AS taluk,
  u.full_name  AS owner_name,
  u.phone      AS owner_phone,
  u.role       AS owner_role,
  au.full_name AS agent_name,
  au.phone     AS agent_phone,
  v.business_name AS vendor_name
FROM listings l
JOIN india_districts d ON d.id = l.district_id
JOIN india_states    s ON s.id = l.state_id
LEFT JOIN india_pin_codes pc ON pc.pin_code = l.pin_code AND pc.is_active
LEFT JOIN india_taluks t    ON t.id = pc.taluk_id
LEFT JOIN users u  ON u.id = l.user_id
LEFT JOIN agents a ON a.id = l.agent_id
LEFT JOIN users au ON au.id = a.user_id
LEFT JOIN vendor_profiles v ON v.id = l.vendor_id;

-- ── Agent summary view ────────────────────────────────────
CREATE OR REPLACE VIEW v_agent_summary AS
SELECT
  a.id, a.user_id,
  u.full_name, u.phone, u.pin_code,
  a.commission_pct,
  a.total_listings, a.total_closed,
  ROUND(a.total_closed::NUMERIC / NULLIF(a.total_listings,0) * 100, 1) AS close_rate_pct,
  a.rating, a.rating_count,
  a.specialised_verticals,
  a.is_active, a.joined_at,
  COUNT(t.id) FILTER (WHERE t.status = 'new')         AS tasks_new,
  COUNT(t.id) FILTER (WHERE t.status = 'in_progress') AS tasks_active,
  COUNT(t.id) FILTER (WHERE t.status = 'done')        AS tasks_done,
  COALESCE(SUM(ae.amount) FILTER (WHERE ae.is_paid = false), 0) AS pending_earnings
FROM agents a
JOIN users u ON u.id = a.user_id
LEFT JOIN tasks t        ON t.agent_id = a.id
LEFT JOIN agent_earnings ae ON ae.agent_id = a.id
GROUP BY a.id, a.user_id, u.full_name, u.phone, u.pin_code,
         a.commission_pct, a.total_listings, a.total_closed,
         a.rating, a.rating_count, a.specialised_verticals, a.is_active, a.joined_at;

-- ── Pending approvals queue ───────────────────────────────
CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT
  aw.id, aw.title, aw.type, aw.status,
  aw.payload, aw.entity_type, aw.entity_id,
  u.full_name AS submitted_by_name,
  u.role      AS submitted_by_role,
  aw.agent_submitted_at,
  aw.board_reviewed_at,
  EXTRACT(EPOCH FROM (NOW() - aw.agent_submitted_at))/3600 AS hours_waiting
FROM approval_workflows aw
JOIN users u ON u.id = aw.submitted_by
WHERE aw.status IN ('agent_submitted','board_review','ceo_review')
ORDER BY aw.agent_submitted_at ASC;

-- ── Mandi prices (latest per commodity per district) ─────
CREATE OR REPLACE VIEW v_mandi_latest AS
SELECT DISTINCT ON (commodity, district_id)
  m.commodity, m.variety, m.district_id,
  d.name AS district, s.name AS state,
  m.apmc_market, m.min_price, m.max_price, m.modal_price,
  m.unit, m.price_date
FROM mandi_price_history m
JOIN india_districts d ON d.id = m.district_id
JOIN india_states    s ON s.id = d.state_id
ORDER BY commodity, district_id, price_date DESC;


-- ============================================================
-- SECTION 13 : SEED DATA
-- ============================================================

-- ── Indian States ─────────────────────────────────────────
INSERT INTO india_states (code, name, region, is_ut, capital) VALUES
  ('AP','Andhra Pradesh',     'South',   false, 'Amaravati'),
  ('AR','Arunachal Pradesh',  'NE',      false, 'Itanagar'),
  ('AS','Assam',              'NE',      false, 'Dispur'),
  ('BR','Bihar',              'East',    false, 'Patna'),
  ('CG','Chhattisgarh',       'Central', false, 'Raipur'),
  ('GA','Goa',                'West',    false, 'Panaji'),
  ('GJ','Gujarat',            'West',    false, 'Gandhinagar'),
  ('HR','Haryana',            'North',   false, 'Chandigarh'),
  ('HP','Himachal Pradesh',   'North',   false, 'Shimla'),
  ('JH','Jharkhand',          'East',    false, 'Ranchi'),
  ('KA','Karnataka',          'South',   false, 'Bengaluru'),
  ('KL','Kerala',             'South',   false, 'Thiruvananthapuram'),
  ('MP','Madhya Pradesh',     'Central', false, 'Bhopal'),
  ('MH','Maharashtra',        'West',    false, 'Mumbai'),
  ('MN','Manipur',            'NE',      false, 'Imphal'),
  ('ML','Meghalaya',          'NE',      false, 'Shillong'),
  ('MZ','Mizoram',            'NE',      false, 'Aizawl'),
  ('NL','Nagaland',           'NE',      false, 'Kohima'),
  ('OD','Odisha',             'East',    false, 'Bhubaneswar'),
  ('PB','Punjab',             'North',   false, 'Chandigarh'),
  ('RJ','Rajasthan',          'North',   false, 'Jaipur'),
  ('SK','Sikkim',             'NE',      false, 'Gangtok'),
  ('TN','Tamil Nadu',         'South',   false, 'Chennai'),
  ('TG','Telangana',          'South',   false, 'Hyderabad'),
  ('TR','Tripura',            'NE',      false, 'Agartala'),
  ('UP','Uttar Pradesh',      'North',   false, 'Lucknow'),
  ('UK','Uttarakhand',        'North',   false, 'Dehradun'),
  ('WB','West Bengal',        'East',    false, 'Kolkata'),
  -- Union Territories
  ('AN','Andaman & Nicobar',  'South',   true,  'Port Blair'),
  ('CH','Chandigarh',         'North',   true,  'Chandigarh'),
  ('DH','Dadra & Nagar Haveli and Daman & Diu','West',true,'Daman'),
  ('DL','Delhi',              'North',   true,  'New Delhi'),
  ('JK','Jammu & Kashmir',    'North',   true,  'Srinagar'),
  ('LA','Ladakh',             'North',   true,  'Leh'),
  ('LD','Lakshadweep',        'South',   true,  'Kavaratti'),
  ('PY','Puducherry',         'South',   true,  'Puducherry')
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- END OF SCHEMA
-- ============================================================
-- Tables  : 32
-- Views   : 6
-- Indexes : 40+
-- Triggers: 8
-- RLS Policies: 30+
-- ============================================================
