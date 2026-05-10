-- HostBooks KE - Subscription & Trial Columns
-- Run this in Supabase SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trial_start        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS subscription_plan   TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_phone      TEXT;

-- Index for fast subscription status lookups
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status
  ON profiles(subscription_status);

-- Backfill: mark any existing profiles as trial with start = created_at
UPDATE profiles
SET
  trial_start        = created_at,
  subscription_status = 'trial'
WHERE trial_start IS NULL;
