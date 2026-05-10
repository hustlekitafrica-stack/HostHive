-- Migration: Add missing columns to properties table
-- Run this in Supabase SQL Editor

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Nairobi',
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Kenya',
  ADD COLUMN IF NOT EXISTS check_in_time TEXT DEFAULT '14:00',
  ADD COLUMN IF NOT EXISTS check_out_time TEXT DEFAULT '11:00',
  ADD COLUMN IF NOT EXISTS check_in_method TEXT,
  ADD COLUMN IF NOT EXISTS check_in_instructions TEXT,
  ADD COLUMN IF NOT EXISTS caretaker_name TEXT,
  ADD COLUMN IF NOT EXISTS caretaker_phone TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_policy TEXT DEFAULT 'moderate';
