-- HostBooks KE - Add house rules and additional rules columns to properties
-- Run in Supabase SQL Editor

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS house_rules JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS additional_rules TEXT;
