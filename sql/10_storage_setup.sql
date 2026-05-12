-- HostBooks KE - Storage Buckets Setup
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- ============================================================================
-- 1. CREATE STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'property-photos',
    'property-photos',
    true,
    10485760, -- 10 MB per file
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'profile-photos',
    'profile-photos',
    true,
    3145728, -- 3 MB per file
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  ),
  (
    'expense-receipts',
    'expense-receipts',
    false, -- private bucket
    10485760, -- 10 MB per file
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
  )
ON CONFLICT (id) DO NOTHING;


-- ============================================================================
-- 2. RLS POLICIES — property-photos (public read, owner write)
-- ============================================================================

-- Allow anyone to view property photos (public bucket)
CREATE POLICY "property-photos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');

-- Allow authenticated users to upload to their own folder only
CREATE POLICY "property-photos: owner insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow owners to update their own files
CREATE POLICY "property-photos: owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'property-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow owners to delete their own files
CREATE POLICY "property-photos: owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ============================================================================
-- 3. RLS POLICIES — profile-photos (public read, owner write)
-- ============================================================================

CREATE POLICY "profile-photos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "profile-photos: owner insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profile-photos: owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "profile-photos: owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ============================================================================
-- 4. RLS POLICIES — expense-receipts (private, owner only)
-- ============================================================================

-- Only the owner can view their receipts
CREATE POLICY "expense-receipts: owner read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'expense-receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "expense-receipts: owner insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'expense-receipts'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "expense-receipts: owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'expense-receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "expense-receipts: owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'expense-receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ============================================================================
-- FOLDER STRUCTURE (for reference — enforced by RLS above)
-- ============================================================================
-- property-photos/
--   {user_id}/
--     {property_id}/
--       photo_1.jpg
--       photo_2.jpg
--
-- profile-photos/
--   {user_id}/
--     avatar.jpg
--
-- expense-receipts/
--   {user_id}/
--     {expense_id}/
--       receipt.pdf
-- ============================================================================
