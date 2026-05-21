-- Migration 17: Add breakfast_rate to properties for B&B add-on
-- Run this in Supabase SQL editor

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS breakfast_rate NUMERIC DEFAULT 0;

COMMENT ON COLUMN properties.breakfast_rate IS 'Per-person per-night breakfast add-on rate (KES). 0 = no B&B offered.';
