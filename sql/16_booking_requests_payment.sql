-- Migration 16: Add payment + decline columns to booking_requests
-- Run this in Supabase SQL editor

ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS pesapal_order_id     text,
  ADD COLUMN IF NOT EXISTS pesapal_tracking_id  text,
  ADD COLUMN IF NOT EXISTS payment_status       text DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS decline_reason       text;

-- Index for fast IPN lookup
CREATE INDEX IF NOT EXISTS idx_booking_requests_pesapal_order_id
  ON booking_requests (pesapal_order_id);
