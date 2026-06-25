-- ============================================================
--  LocalMart — Supabase PostgreSQL Schema
--  Version : 1.0.0
--  Run this entire file in: Supabase → SQL Editor → New Query
-- ============================================================


-- ============================================================
-- SECTION 0 : EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";       -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- fuzzy text search on listings


-- ============================================================
-- SECTION 1 : ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('ceo','agent','customer','vendor');
CREATE TYPE listing_type AS ENUM ('sell','buy','rent','service','job','wanted');
CREATE TYPE price_type AS ENUM ('fixed','negotiable','free','per_day','per_month','per_kg','per_unit');
CREATE TYPE listing_status AS ENUM ('pending','active','sold','expired','rejected','draft');
CREATE TYPE task_priority AS ENUM ('low','medium','high','urgent');
CREATE TYPE task_status AS ENUM ('new','in_progress','done','cancelled');
CREATE TYPE app_language AS ENUM ('en','hi','te');
CREATE TYPE category_slug AS ENUM (
  'goods','services','property','jobs','transport','food','grocery',
  'vehicles','tiffin','gas','furniture','mobiles','second_hand','other'
);


-- ============================================================
-- SECTION 2 : CORE TABLES
-- ============================================================

-- ── 2.1  VILLAGES ──────────────────────────────────────────
CREATE TABLE villages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  region       TEXT NOT NULL,
  mandal       TEXT,
  state        TEXT NOT NULL DEFAULT 'Telangana',
  pin_code     TEXT,
  lat          NUMERIC(10, 6),
  lng          NUMERIC(10, 6),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2.2  USERS ─────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name     TEXT,
  phone         TEXT,
  role          user_role NOT NULL DEFAULT 'customer',
  language      app_language NOT NULL DEFAULT 'en',
  village_id    UUID REFERENCES villages (id) ON DELETE SET NULL,
  avatar_url    TEXT,
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2.3  CATEGORIES ────────────────────────────────────────
CREATE TABLE categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          category_slug NOT NULL,
  name_en       TEXT NOT NULL,
  name_hi       TEXT,
  name_te       TEXT,
  icon          TEXT NOT NULL DEFAULT 'ti-tag',
  parent_id     UUID REFERENCES categories (id) ON DELETE SET NULL,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO categories (slug, name_en, name_hi, name_te, icon, sort_order) VALUES
  ('goods','Physical Goods','भौतिक वस्तुएँ','భౌతిక వస్తువులు','ti-shopping-bag',1),
  ('services','Services','सेवाएं','సేవలు','ti-tool',2),
  ('property','Property / Land','संपत्ति / भूमि','ఆస్తి / భూమి','ti-home',3),
  ('jobs','Jobs','नौकरियां','ఉద్యోగాలు','ti-briefcase',4),
  ('transport','Transport Pool','परिवहन','రవాణా','ti-car',5),
  ('food','Restaurant / Food','रेस्तरां / भोजन','రెస్టారెంట్ / ఆహారం','ti-bowl',6),
  ('grocery','Grocery Vendor','किराना विक्रेता','కిరాణా విక్రేత','ti-basket',7),
  ('vehicles','Vehicles','वाहन','వాహనాలు','ti-motorbike',8),
  ('tiffin','Tiffin Centre','टिफिन केंद्र','టిఫిన్ సెంటర్','ti-lunch-box',9),
  ('gas','Gas Agency','गैस एजेंसी','గ్యాస్ ఏజెన్సీ','ti-flame',10),
  ('furniture','Furniture','फर्नीचर','ఫర్నిచర్','ti-armchair',11),
  ('mobiles','Mobiles & Electronics','मोबाइल और इलेक्ट्रॉनिक्स','మొబైల్స్ & ఎలక్ట్రానిక్స్','ti-device-mobile',12),
  ('second_hand','Second Hand Items','पुरानी वस्तुएँ','పాత వస్తువులు','ti-refresh',13),
  ('other','Other','अन्य','ఇతర','ti-dots',14);

-- ── 2.4  LISTINGS ──────────────────────────────────────────
CREATE TABLE listings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  village_id      UUID NOT NULL REFERENCES villages (id) ON DELETE RESTRICT,
  category_id     UUID NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  agent_id        UUID REFERENCES users (id) ON DELETE SET NULL,
  type            listing_type NOT NULL DEFAULT 'sell',
  title           TEXT NOT NULL,
  description     TEXT,
  tags            TEXT[],
  images          TEXT[],
  custom_fields   JSONB,
  price           NUMERIC(12, 2),
  price_type      price_type NOT NULL DEFAULT 'fixed',
  currency        TEXT NOT NULL DEFAULT 'INR',
  status          listing_status NOT NULL DEFAULT 'pending',
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  view_count      INTEGER NOT NULL DEFAULT 0,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,
  activated_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listings_village   ON listings (village_id);
CREATE INDEX idx_listings_category  ON listings (category_id);
CREATE INDEX idx_listings_user      ON listings (user_id);
CREATE INDEX idx_listings_status    ON listings (status);
CREATE INDEX idx_listings_agent     ON listings (agent_id);
CREATE INDEX idx_listings_expires   ON listings (expires_at);
CREATE INDEX idx_listings_search    ON listings USING GIN (to_tsvector('english', title || ' ' || COALESCE(description,'')));
CREATE INDEX idx_listings_tags      ON listings USING GIN (tags);

-- ── 2.5  AGENTS ────────────────────────────────────────────
CREATE TABLE agents (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  assigned_villages   UUID[] NOT NULL DEFAULT '{}',
  commission_pct      NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
  total_listings      INTEGER NOT NULL DEFAULT 0,
  total_closed        INTEGER NOT NULL DEFAULT 0,
  rating              NUMERIC(3, 2),
  rating_count        INTEGER NOT NULL DEFAULT 0,
  notes               TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2.6  TASKS ─────────────────────────────────────────────
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assigned_by     UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  agent_id        UUID NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
  listing_id      UUID REFERENCES listings (id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  priority        task_priority NOT NULL DEFAULT 'medium',
  status          task_status NOT NULL DEFAULT 'new',
  due_date        DATE,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_agent    ON tasks (agent_id);
CREATE INDEX idx_tasks_status   ON tasks (status);
CREATE INDEX idx_tasks_due      ON tasks (due_date);

-- ── 2.7  LISTING REVIEWS ───────────────────────────────────
CREATE TABLE listing_reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id    UUID NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
  reviewer_id   UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  agent_id      UUID REFERENCES agents (id) ON DELETE SET NULL,
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_id, reviewer_id)
);

-- ── 2.8  NOTIFICATIONS ─────────────────────────────────────
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  body          TEXT,
  type          TEXT NOT NULL DEFAULT 'info',
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  link_type     TEXT,
  link_id       UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user ON notifications (user_id, is_read);


-- ============================================================
-- SECTION 3 : TRIGGERS & FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION set_listing_expiry()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status <> 'active' THEN
    NEW.activated_at := NOW();
    NEW.expires_at   := NOW() + INTERVAL '30 days';
    NEW.reviewed_at  := NOW();
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_listing_expiry
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION set_listing_expiry();

CREATE OR REPLACE FUNCTION expire_old_listings()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE listings SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' AND expires_at < NOW();
END;
$$;

CREATE OR REPLACE FUNCTION sync_agent_listing_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.agent_id IS NOT NULL AND NEW.status = 'active'
     AND (OLD.status <> 'active' OR OLD.agent_id IS DISTINCT FROM NEW.agent_id)
  THEN
    UPDATE agents SET total_listings = total_listings + 1 WHERE user_id = NEW.agent_id;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status = 'sold' AND OLD.status <> 'sold' AND NEW.agent_id IS NOT NULL THEN
    UPDATE agents SET total_closed = total_closed + 1 WHERE user_id = NEW.agent_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_agent_listing_count
  AFTER UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION sync_agent_listing_count();

CREATE OR REPLACE FUNCTION refresh_agent_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE agents a
  SET rating = sub.avg_rating, rating_count = sub.cnt, updated_at = NOW()
  FROM (
    SELECT AVG(r.rating)::NUMERIC(3,2) AS avg_rating, COUNT(*) AS cnt
    FROM listing_reviews r
    JOIN listings l ON l.id = r.listing_id
    WHERE l.agent_id = NEW.agent_id
  ) sub
  WHERE a.user_id = NEW.agent_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_agent_rating
  AFTER INSERT OR UPDATE ON listing_reviews
  FOR EACH ROW WHEN (NEW.agent_id IS NOT NULL)
  EXECUTE FUNCTION refresh_agent_rating();

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_villages_updated BEFORE UPDATE ON villages       FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_users_updated    BEFORE UPDATE ON users          FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_agents_updated   BEFORE UPDATE ON agents         FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_tasks_updated    BEFORE UPDATE ON tasks          FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE OR REPLACE FUNCTION stamp_task_completion()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status <> 'done' THEN NEW.completed_at := NOW(); END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_task_completion
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION stamp_task_completion();


-- ============================================================
-- SECTION 4 : ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE villages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_reviews  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_ceo() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ceo');
$$;
CREATE OR REPLACE FUNCTION is_agent() RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'agent');
$$;
CREATE OR REPLACE FUNCTION my_role() RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- Villages
CREATE POLICY "villages_select_all" ON villages FOR SELECT USING (is_active = TRUE OR is_ceo());
CREATE POLICY "villages_ceo_all"    ON villages FOR ALL   USING (is_ceo()) WITH CHECK (is_ceo());

-- Users
CREATE POLICY "users_select_own"  ON users FOR SELECT USING (id = auth.uid() OR is_ceo() OR is_agent());
CREATE POLICY "users_update_own"  ON users FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM users WHERE id = auth.uid()));
CREATE POLICY "users_ceo_all"     ON users FOR ALL USING (is_ceo()) WITH CHECK (is_ceo());

-- Categories
CREATE POLICY "categories_select_active" ON categories FOR SELECT USING (is_active = TRUE OR is_ceo());
CREATE POLICY "categories_ceo_all"       ON categories FOR ALL   USING (is_ceo()) WITH CHECK (is_ceo());

-- Listings
CREATE POLICY "listings_public_select"  ON listings FOR SELECT USING (status = 'active');
CREATE POLICY "listings_owner_select"   ON listings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "listings_agent_select"   ON listings FOR SELECT
  USING (is_agent() AND village_id = ANY (SELECT UNNEST(assigned_villages) FROM agents WHERE user_id = auth.uid()));
CREATE POLICY "listings_agent_update"   ON listings FOR UPDATE
  USING (is_agent() AND village_id = ANY (SELECT UNNEST(assigned_villages) FROM agents WHERE user_id = auth.uid()));
CREATE POLICY "listings_owner_insert"   ON listings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "listings_owner_update"   ON listings FOR UPDATE
  USING (user_id = auth.uid() AND status IN ('draft','pending'));
CREATE POLICY "listings_ceo_all"        ON listings FOR ALL USING (is_ceo()) WITH CHECK (is_ceo());

-- Agents
CREATE POLICY "agents_ceo_all"    ON agents FOR ALL    USING (is_ceo()) WITH CHECK (is_ceo());
CREATE POLICY "agents_self_select" ON agents FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "agents_self_update" ON agents FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid()
    AND commission_pct    = (SELECT commission_pct    FROM agents WHERE user_id = auth.uid())
    AND assigned_villages = (SELECT assigned_villages FROM agents WHERE user_id = auth.uid()));

-- Tasks
CREATE POLICY "tasks_ceo_all"          ON tasks FOR ALL USING (is_ceo()) WITH CHECK (is_ceo());
CREATE POLICY "tasks_agent_select"     ON tasks FOR SELECT
  USING (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY "tasks_agent_update_status" ON tasks FOR UPDATE
  USING (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()))
  WITH CHECK (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid())
    AND assigned_by = (SELECT assigned_by FROM tasks WHERE id = tasks.id)
    AND agent_id    = (SELECT agent_id    FROM tasks WHERE id = tasks.id));

-- Reviews
CREATE POLICY "reviews_select_all"  ON listing_reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews_insert_own"  ON listing_reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "reviews_update_own"  ON listing_reviews FOR UPDATE USING (reviewer_id = auth.uid());
CREATE POLICY "reviews_ceo_all"     ON listing_reviews FOR ALL USING (is_ceo()) WITH CHECK (is_ceo());

-- Notifications
CREATE POLICY "notif_own"        ON notifications FOR ALL    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notif_ceo_insert" ON notifications FOR INSERT WITH CHECK (is_ceo() OR is_agent());


-- ============================================================
-- SECTION 5 : VIEWS
-- ============================================================

CREATE OR REPLACE VIEW v_listings_full AS
SELECT l.id, l.title, l.type, l.status, l.price, l.price_type, l.is_featured,
       l.view_count, l.submitted_at, l.expires_at,
       c.name_en AS category, c.slug AS category_slug, c.icon AS category_icon,
       v.name AS village, v.region,
       u.full_name AS owner_name, u.phone AS owner_phone, u.role AS owner_role,
       ag.full_name AS agent_name
FROM listings l
JOIN categories c  ON c.id = l.category_id
JOIN villages   v  ON v.id = l.village_id
JOIN users      u  ON u.id = l.user_id
LEFT JOIN users ag ON ag.id = l.agent_id;

CREATE OR REPLACE VIEW v_agent_summary AS
SELECT a.id, u.full_name, u.phone, u.village_id, a.commission_pct,
       a.total_listings, a.total_closed, a.rating, a.rating_count, a.is_active,
       COALESCE(ROUND(a.total_closed::NUMERIC / NULLIF(a.total_listings,0) * 100, 1), 0) AS close_rate_pct,
       COUNT(t.id) FILTER (WHERE t.status = 'new')         AS tasks_new,
       COUNT(t.id) FILTER (WHERE t.status = 'in_progress') AS tasks_in_progress,
       COUNT(t.id) FILTER (WHERE t.status = 'done')        AS tasks_done
FROM agents a
JOIN users  u ON u.id = a.user_id
LEFT JOIN tasks t ON t.agent_id = a.id
GROUP BY a.id, u.full_name, u.phone, u.village_id,
         a.commission_pct, a.total_listings, a.total_closed, a.rating, a.rating_count, a.is_active;

CREATE OR REPLACE VIEW v_pending_queue AS
SELECT l.id, l.title, l.type, c.name_en AS category, v.name AS village,
       u.full_name AS submitted_by, u.phone AS contact, l.submitted_at
FROM listings l
JOIN categories c ON c.id = l.category_id
JOIN villages   v ON v.id = l.village_id
JOIN users      u ON u.id = l.user_id
WHERE l.status = 'pending'
ORDER BY l.submitted_at ASC;


-- ============================================================
-- SECTION 6 : SEED DATA — VILLAGES
-- ============================================================

INSERT INTO villages (name, region, mandal, pin_code) VALUES
  ('Nalgonda',    'Nalgonda', 'Nalgonda',    '508001'),
  ('Suryapet',    'Suryapet', 'Suryapet',    '508213'),
  ('Miryalaguda', 'Nalgonda', 'Miryalaguda', '508207'),
  ('Huzurnagar',  'Suryapet', 'Huzurnagar',  '508204'),
  ('Bhongir',     'Yadadri',  'Bhongir',     '508116'),
  ('Ramannapeta', 'Yadadri',  'Ramannapeta', '508254'),
  ('Devarakonda', 'Nalgonda', 'Devarakonda', '508248'),
  ('Nakrekal',    'Nalgonda', 'Nakrekal',    '508112'),
  ('Choutuppal',  'Yadadri',  'Choutuppal',  '508252'),
  ('Mothkur',     'Nalgonda', 'Mothkur',     '508246');


-- ============================================================
-- SECTION 7 : MAKE YOURSELF CEO
-- ============================================================
-- After signing up, run:
-- UPDATE users SET role = 'ceo', is_verified = TRUE WHERE id = '<your-uuid>';


-- ============================================================
-- SECTION 8 : REALTIME  (run in Dashboard or uncomment)
-- ============================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE listings;
-- ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
