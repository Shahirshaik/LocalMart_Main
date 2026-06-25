-- ============================================================
-- LocalMart — Force-fix all 7 accounts (passwords + roles)
-- Paste into: Supabase → SQL Editor → Run
-- Works whether accounts exist or not. Safe to re-run.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ════════════════════════════════════════════════════════════
-- PART A: Create or update auth.users (login credentials)
-- ════════════════════════════════════════════════════════════

-- CEO — shahirsha215.s@gmail.com
INSERT INTO auth.users
  (id, instance_id, aud, role, email, encrypted_password,
   email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'shahirsha215.s@gmail.com',
   crypt('Demo@CEO123', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Shahir"}', now(), now())
ON CONFLICT (email) DO UPDATE
  SET encrypted_password = crypt('Demo@CEO123', gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at         = now();

-- Board — shaikshahir215455@gmail.com
INSERT INTO auth.users
  (id, instance_id, aud, role, email, encrypted_password,
   email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'shaikshahir215455@gmail.com',
   crypt('Demo@Board123', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Shaik Shahir"}', now(), now())
ON CONFLICT (email) DO UPDATE
  SET encrypted_password = crypt('Demo@Board123', gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at         = now();

-- Agent 1 — shaiksalma863975@gmail.com
INSERT INTO auth.users
  (id, instance_id, aud, role, email, encrypted_password,
   email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'shaiksalma863975@gmail.com',
   crypt('Demo@Ag1234', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Shaik Salma"}', now(), now())
ON CONFLICT (email) DO UPDATE
  SET encrypted_password = crypt('Demo@Ag1234', gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at         = now();

-- Agent 2 — shaikshahir65@gmail.com
INSERT INTO auth.users
  (id, instance_id, aud, role, email, encrypted_password,
   email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'shaikshahir65@gmail.com',
   crypt('Demo@Ag5678', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Shaik Shahir 65"}', now(), now())
ON CONFLICT (email) DO UPDATE
  SET encrypted_password = crypt('Demo@Ag5678', gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at         = now();

-- Buyer 1 — contactgetjob786@gmail.com
INSERT INTO auth.users
  (id, instance_id, aud, role, email, encrypted_password,
   email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'contactgetjob786@gmail.com',
   crypt('Demo@Buy123', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Anand Naidu"}', now(), now())
ON CONFLICT (email) DO UPDATE
  SET encrypted_password = crypt('Demo@Buy123', gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at         = now();

-- Buyer 2 — shaiknishar312@gmail.com
INSERT INTO auth.users
  (id, instance_id, aud, role, email, encrypted_password,
   email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'shaiknishar312@gmail.com',
   crypt('Demo@Buy456', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nishar"}', now(), now())
ON CONFLICT (email) DO UPDATE
  SET encrypted_password = crypt('Demo@Buy456', gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at         = now();

-- Vendor — shaiknishar81@gmail.com
INSERT INTO auth.users
  (id, instance_id, aud, role, email, encrypted_password,
   email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
   'authenticated', 'authenticated',
   'shaiknishar81@gmail.com',
   crypt('Demo@Vend123', gen_salt('bf')),
   now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nishar 81"}', now(), now())
ON CONFLICT (email) DO UPDATE
  SET encrypted_password = crypt('Demo@Vend123', gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at         = now();


-- ════════════════════════════════════════════════════════════
-- PART B: Set correct roles in public.users
-- ════════════════════════════════════════════════════════════

-- Upsert CEO profiles
INSERT INTO public.users (id, role, full_name, is_verified)
SELECT id, 'ceo'::user_role, 'Shahir (CEO)', true
FROM auth.users WHERE email = 'shahirsha215.s@gmail.com'
ON CONFLICT (id) DO UPDATE
  SET role = 'ceo'::user_role, full_name = 'Shahir (CEO)', is_verified = true;

INSERT INTO public.users (id, role, full_name, is_verified)
SELECT id, 'ceo'::user_role, 'Shaik Shahir (Board)', true
FROM auth.users WHERE email = 'shaikshahir215455@gmail.com'
ON CONFLICT (id) DO UPDATE
  SET role = 'ceo'::user_role, full_name = 'Shaik Shahir (Board)', is_verified = true;

-- Upsert Agent profiles
INSERT INTO public.users (id, role, full_name, is_verified)
SELECT id, 'agent'::user_role, 'Shaik Salma', true
FROM auth.users WHERE email = 'shaiksalma863975@gmail.com'
ON CONFLICT (id) DO UPDATE
  SET role = 'agent'::user_role, full_name = 'Shaik Salma', is_verified = true;

INSERT INTO public.users (id, role, full_name, is_verified)
SELECT id, 'agent'::user_role, 'Shaik Shahir 65', true
FROM auth.users WHERE email = 'shaikshahir65@gmail.com'
ON CONFLICT (id) DO UPDATE
  SET role = 'agent'::user_role, full_name = 'Shaik Shahir 65', is_verified = true;

-- Upsert Customer profiles
INSERT INTO public.users (id, role, full_name, is_verified)
SELECT id, 'customer'::user_role, 'Anand Naidu', true
FROM auth.users WHERE email = 'contactgetjob786@gmail.com'
ON CONFLICT (id) DO UPDATE
  SET role = 'customer'::user_role, full_name = 'Anand Naidu', is_verified = true;

INSERT INTO public.users (id, role, full_name, is_verified)
SELECT id, 'customer'::user_role, 'Nishar', true
FROM auth.users WHERE email = 'shaiknishar312@gmail.com'
ON CONFLICT (id) DO UPDATE
  SET role = 'customer'::user_role, full_name = 'Nishar', is_verified = true;

INSERT INTO public.users (id, role, full_name, is_verified)
SELECT id, 'customer'::user_role, 'Nishar 81', true
FROM auth.users WHERE email = 'shaiknishar81@gmail.com'
ON CONFLICT (id) DO UPDATE
  SET role = 'customer'::user_role, full_name = 'Nishar 81', is_verified = true;


-- ════════════════════════════════════════════════════════════
-- PART C: Create agents records for Agent 1 & Agent 2
-- ════════════════════════════════════════════════════════════

INSERT INTO public.agents (user_id, commission_pct, referral_code, is_active, assigned_villages)
SELECT id, 5.00, UPPER(SUBSTRING(id::TEXT, 1, 8)), true, '{}'
FROM auth.users WHERE email = 'shaiksalma863975@gmail.com'
ON CONFLICT (user_id) DO UPDATE
  SET is_active = true, commission_pct = 5.00;

INSERT INTO public.agents (user_id, commission_pct, referral_code, is_active, assigned_villages)
SELECT id, 5.00, UPPER(SUBSTRING(id::TEXT, 1, 8)), true, '{}'
FROM auth.users WHERE email = 'shaikshahir65@gmail.com'
ON CONFLICT (user_id) DO UPDATE
  SET is_active = true, commission_pct = 5.00;


-- ════════════════════════════════════════════════════════════
-- PART D: Disable email confirmation requirement (optional)
-- This stops Supabase from asking users to confirm email
-- ════════════════════════════════════════════════════════════

UPDATE auth.config
SET mailer_autoconfirm = true
WHERE id = 1;


-- ════════════════════════════════════════════════════════════
-- FINAL CHECK — should show all 7 rows with email_confirmed=true
-- ════════════════════════════════════════════════════════════

SELECT
  u.email,
  p.full_name,
  p.role::TEXT                        AS role,
  u.email_confirmed_at IS NOT NULL    AS email_confirmed,
  p.is_verified
FROM auth.users u
JOIN public.users p ON p.id = u.id
WHERE u.email IN (
  'shahirsha215.s@gmail.com',
  'shaikshahir215455@gmail.com',
  'shaiksalma863975@gmail.com',
  'shaikshahir65@gmail.com',
  'contactgetjob786@gmail.com',
  'shaiknishar312@gmail.com',
  'shaiknishar81@gmail.com'
)
ORDER BY p.role, u.email;
