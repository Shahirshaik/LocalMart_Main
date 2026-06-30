-- ══════════════════════════════════════════════════════════════════
-- STORAGE FIX — paste in Supabase SQL Editor and click RUN
-- Dashboard: https://supabase.com/dashboard/project/gpsmjadvqdcvoytkthjv/sql/new
-- ══════════════════════════════════════════════════════════════════

-- Step 1: Make sure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 10485760,
      allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];

-- Step 2: Enable RLS on storage.objects (safe to run even if already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop old policies that may be misconfigured
DROP POLICY IF EXISTS "Authenticated users can upload listing images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read listing images"                ON storage.objects;
DROP POLICY IF EXISTS "Users can update own listing images"          ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own listing images"          ON storage.objects;

-- Step 4: Create correct policies

-- Any logged-in user can upload to listing-images
CREATE POLICY "Authenticated users can upload listing images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listing-images');

-- Anyone (including unauthenticated visitors) can view images
CREATE POLICY "Public can read listing images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'listing-images');

-- Uploader can replace / update their own file
CREATE POLICY "Users can update own listing images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'listing-images' AND auth.uid()::text = owner_id::text);

-- Uploader can delete their own file
CREATE POLICY "Users can delete own listing images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'listing-images' AND auth.uid()::text = owner_id::text);

-- Verify — should show the bucket with public=true
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'listing-images';
