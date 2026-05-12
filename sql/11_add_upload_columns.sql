-- HostBooks KE - Add upload URL columns
-- Run in Supabase SQL Editor after 10_storage_setup.sql

-- Property photo URLs array
ALTER TABLE properties ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}';

-- Expense receipt URL
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Profile avatar URL
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
