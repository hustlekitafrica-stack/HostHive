-- Migration: Add favicon_url and logo_url columns to profiles
-- logo_url was already in the UserProfile type but may not exist in the table

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS logo_url    TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS favicon_url TEXT NOT NULL DEFAULT '';
