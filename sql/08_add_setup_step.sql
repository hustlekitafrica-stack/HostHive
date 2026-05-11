-- Migration: Add setup_step column to properties table
-- Run this in Supabase SQL Editor

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS setup_step INTEGER DEFAULT NULL;
