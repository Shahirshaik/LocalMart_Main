-- ══════════════════════════════════════════════════════
-- QUICK FIX — paste this in Supabase SQL Editor and RUN
-- URL: https://supabase.com/dashboard/project/yndznxjemhxwosooziho/sql/new
-- ══════════════════════════════════════════════════════

-- 1. Confirm all 7 emails so login works immediately
UPDATE auth.users
SET email_confirmed_at = now(), updated_at = now()
WHERE email = ANY(ARRAY[
  'shahirsha215.s@gmail.com',
  'shaikshahir215455@gmail.com',
  'shaiksalma863975@gmail.com',
  'shaikshahir65@gmail.com',
  'contactgetjob786@gmail.com',
  'shaiknishar312@gmail.com',
  'shaiknishar81@gmail.com'
]);

-- 2. Set roles in public.users
INSERT INTO public.users (id, role, full_name, is_verified)
SELECT
  id,
  CASE email
    WHEN 'shahirsha215.s@gmail.com'    THEN 'ceo'
    WHEN 'shaikshahir215455@gmail.com' THEN 'ceo'
    WHEN 'shaiksalma863975@gmail.com'  THEN 'agent'
    WHEN 'shaikshahir65@gmail.com'     THEN 'agent'
    ELSE 'customer'
  END::user_role,
  CASE email
    WHEN 'shahirsha215.s@gmail.com'    THEN 'Shahir CEO'
    WHEN 'shaikshahir215455@gmail.com' THEN 'Shaik Shahir Board'
    WHEN 'shaiksalma863975@gmail.com'  THEN 'Shaik Salma Agent'
    WHEN 'shaikshahir65@gmail.com'     THEN 'Shaik Shahir 65 Agent'
    WHEN 'contactgetjob786@gmail.com'  THEN 'Anand Naidu'
    WHEN 'shaiknishar312@gmail.com'    THEN 'Nishar'
    ELSE 'Nishar 81 Vendor'
  END,
  true
FROM auth.users
WHERE email = ANY(ARRAY[
  'shahirsha215.s@gmail.com','shaikshahir215455@gmail.com',
  'shaiksalma863975@gmail.com','shaikshahir65@gmail.com',
  'contactgetjob786@gmail.com','shaiknishar312@gmail.com','shaiknishar81@gmail.com'
])
ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role, full_name = EXCLUDED.full_name, is_verified = true;

-- 3. Create storage bucket for image uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('listing-images','listing-images',true,10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET public=true, file_size_limit=10485760;

-- Verify: should show 7 rows with email_ok=true
SELECT u.email, p.role::text, u.email_confirmed_at IS NOT NULL AS email_ok
FROM auth.users u JOIN public.users p ON p.id=u.id
WHERE u.email = ANY(ARRAY[
  'shahirsha215.s@gmail.com','shaikshahir215455@gmail.com',
  'shaiksalma863975@gmail.com','shaikshahir65@gmail.com',
  'contactgetjob786@gmail.com','shaiknishar312@gmail.com','shaiknishar81@gmail.com'
]);
