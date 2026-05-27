-- ─── Migration 25: Add discount columns to booking_requests ─────────────────

ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS discount_total   NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS applied_discounts JSONB   NOT NULL DEFAULT '[]'::jsonb;
