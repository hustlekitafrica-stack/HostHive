-- Add GPS coordinates columns to food_orders for delivery customers
-- Run once in Supabase SQL editor

ALTER TABLE food_orders
  ADD COLUMN IF NOT EXISTS delivery_lat  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS delivery_lng  DOUBLE PRECISION;
