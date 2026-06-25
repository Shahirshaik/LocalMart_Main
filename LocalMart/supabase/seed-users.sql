-- ============================================================
--  LocalMart — Seed 3 Users (CEO, Agent, Customer)
--  Run this in: Supabase → SQL Editor → New Query → Run
-- ============================================================

DO $$
DECLARE
  ceo_id      uuid := gen_random_uuid();
  agent_id    uuid := gen_random_uuid();
  customer_id uuid := gen_random_uuid();
BEGIN

  -- ── CEO: Shaik Shahir ─────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES (
    ceo_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'shaikshahir215455@gmail.com',
    crypt('Boss@215455', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Shaik Shahir","username":"LocalMartBoss"}',
    NOW(), NOW(), '', '', '', ''
  );
  -- Set CEO role (trigger auto-creates public.users row)
  UPDATE public.users
    SET role = 'ceo', full_name = 'Shaik Shahir', is_verified = TRUE
    WHERE id = ceo_id;

  -- ── Agent: Shaik Salma ────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES (
    agent_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'shaikshahir65@gmail.com',
    crypt('Salma@123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Shaik Salma","username":"SalmaAgent"}',
    NOW(), NOW(), '', '', '', ''
  );
  UPDATE public.users
    SET role = 'agent', full_name = 'Shaik Salma', is_verified = TRUE
    WHERE id = agent_id;

  -- ── Customer: Shaik Shakib ────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) VALUES (
    customer_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'shahirsha215.s@gmail.com',
    crypt('Shakib@123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Shaik Shakib","username":"ShakibCustomer"}',
    NOW(), NOW(), '', '', '', ''
  );
  UPDATE public.users
    SET role = 'customer', full_name = 'Shaik Shakib', is_verified = FALSE
    WHERE id = customer_id;

END $$;

-- ── Verify users were created ─────────────────────────────────
SELECT u.full_name, au.email, u.role, u.is_verified
FROM public.users u
JOIN auth.users au ON au.id = u.id
WHERE au.email IN (
  'shaikshahir215455@gmail.com',
  'shaikshahir65@gmail.com',
  'shahirsha215.s@gmail.com'
);
