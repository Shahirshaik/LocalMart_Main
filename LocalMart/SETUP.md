# LocalMart — Setup Guide

## Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) account

---

## Step 1 — Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to **SQL Editor → New Query**
3. Paste the entire contents of `supabase/schema.sql` and click **Run**
4. Go to **Project Settings → API** and copy:
   - `yndznxjemhxwosooziho`
   - `eu-west-1` key

---

## Step 2 — Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your Supabase values:

```
NEXT_PUBLIC_SUPABASE_URL=https://yndznxjemhxwosooziho.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_rpS7C_U0fvCDn1soB2r2UQ_CRCZWOIk
```

---

## Step 3 — Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

---

## Step 4 — Make Yourself CEO

1. Register an account at http://localhost:3000/auth/signup
2. In Supabase Dashboard → **Authentication → Users**, copy your UUID
3. Run in SQL Editor:

```sql
UPDATE users SET role = 'ceo', is_verified = TRUE WHERE id = 'paste-your-uuid-here';
```

4. Sign out and back in — you'll be redirected to `/dashboard`

---

## Step 5 — Add Agents

In CEO Dashboard → **Agents** → click **Add Agent** → paste the user's UUID (after they sign up)

You can also directly promote from SQL:
```sql
UPDATE users SET role = 'agent' WHERE id = 'agent-uuid';
INSERT INTO agents (user_id) VALUES ('agent-uuid') ON CONFLICT DO NOTHING;
```

Then assign villages to them:
```sql
UPDATE agents SET assigned_villages = ARRAY(
  SELECT id FROM villages WHERE name IN ('Nalgonda', 'Suryapet')
) WHERE user_id = 'agent-uuid';
```

---

## App Structure

```
/                     → Public marketplace (browse listings)
/listings             → Filtered listings page
/listings/new         → Submit a new listing (requires login)
/listings/[id]        → Listing detail + contact seller
/auth/login           → Sign in
/auth/signup          → Register
/dashboard            → CEO overview (CEO only)
/dashboard/listings   → All listings + approval queue
/dashboard/agents     → Agent management
/dashboard/villages   → Village management
/dashboard/tasks      → Task assignment
/agent                → Agent task list (Agents only)
/agent/listings       → Listings in agent's villages
```

---

## Storage Buckets (optional — for image uploads)

In Supabase Dashboard → **Storage → New bucket**:

1. `listing-images` — Public, 5MB max
2. `avatars` — Public, 1MB max
