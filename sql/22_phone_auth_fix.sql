-- Fix: allow phone-only OTP users (no email) to be created without errors
-- Root cause: profiles.email had NOT NULL constraint, breaking phone OTP signups
-- Run this in Supabase SQL Editor

-- 1. Make email nullable in profiles (phone-only users have no email)
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- 2. Replace the seed_user_defaults trigger to also safely create a profile row
--    for phone-only users (email will be NULL, which is now allowed)
CREATE OR REPLACE FUNCTION seed_user_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert a minimal profile so profile-dependent queries don't break
  INSERT INTO profiles (id, email, phone)
  VALUES (
    NEW.id,
    NULLIF(NEW.email, ''),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Seed default income categories
  INSERT INTO income_categories (user_id, name, is_default, icon, color, sort_order)
  VALUES
    (NEW.id, 'Short Stay Rental',        true, '🏠', '#0f766e',  1),
    (NEW.id, 'Long Stay Rental',         true, '📅', '#0f766e',  2),
    (NEW.id, 'Security Deposit Kept',    true, '🔒', '#d97706',  3),
    (NEW.id, 'Cleaning Fee',             true, '🧹', '#0f766e',  4),
    (NEW.id, 'Early Check-in Fee',       true, '⏰', '#0f766e',  5),
    (NEW.id, 'Late Check-out Fee',       true, '⏰', '#0f766e',  6),
    (NEW.id, 'Extra Guest Fee',          true, '👥', '#0f766e',  7),
    (NEW.id, 'Airport Pickup',           true, '🚗', '#0f766e',  8),
    (NEW.id, 'Laundry Services',         true, '🧺', '#0f766e',  9),
    (NEW.id, 'Other Services',           true, '⭐', '#0f766e', 10);

  -- Seed default expense categories
  INSERT INTO expense_categories (user_id, name, is_default, icon, color, sort_order)
  VALUES
    (NEW.id, 'Caretaker/Housekeeper Salary',  true, '👤', '#ef4444',  1),
    (NEW.id, 'Cleaning Supplies',             true, '🧹', '#ef4444',  2),
    (NEW.id, 'Internet/WiFi Bill',            true, '📡', '#ef4444',  3),
    (NEW.id, 'Electricity Bill',              true, '⚡', '#ef4444',  4),
    (NEW.id, 'Water Bill',                    true, '💧', '#ef4444',  5),
    (NEW.id, 'DSTV/Netflix Subscription',     true, '📺', '#ef4444',  6),
    (NEW.id, 'Property Maintenance & Repairs',true, '🔧', '#ef4444',  7),
    (NEW.id, 'Airbnb/Booking.com Commission', true, '💳', '#ef4444',  8),
    (NEW.id, 'Furnishings & Appliances',      true, '🛋️', '#ef4444',  9),
    (NEW.id, 'Toiletries & Consumables',      true, '🧴', '#ef4444', 10),
    (NEW.id, 'Security/Guard Services',       true, '🔐', '#ef4444', 11),
    (NEW.id, 'Property Insurance',            true, '🛡️', '#ef4444', 12),
    (NEW.id, 'Service Charge/Strata Fee',     true, '🏢', '#ef4444', 13),
    (NEW.id, 'Laundry',                       true, '🧺', '#ef4444', 14),
    (NEW.id, 'Refunds to Guests',             true, '↩️', '#ef4444', 15),
    (NEW.id, 'Marketing & Photography',       true, '📸', '#ef4444', 16),
    (NEW.id, 'Accountant/Legal Fees',         true, '⚖️', '#ef4444', 17),
    (NEW.id, 'Other',                         true, '⭐', '#ef4444', 18);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Replace handle_new_user function (safe with NULL emails for phone-only users)
--    This covers: (a) trigger already exists in Supabase dashboard — function body updated
--                 (b) trigger doesn't exist — function + trigger both created below
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NULLIF(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the duplicate trigger created by a previous migration run (if it exists)
-- on_auth_user_created already calls handle_new_user(), so the duplicate is not needed
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
