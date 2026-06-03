-- Migration 27: Receipts table + tax config columns on profiles
-- Run this in the Supabase SQL editor

-- ── 1. Auto-increment receipt number sequence ────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1001;

-- ── 2. Receipts table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS receipts (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number      TEXT        UNIQUE NOT NULL
                                  DEFAULT ('RCT-' || LPAD(nextval('receipt_number_seq')::text, 5, '0')),
  receipt_token       TEXT        UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  host_user_id        UUID        REFERENCES auth.users(id),
  booking_request_id  UUID        REFERENCES booking_requests(id),

  -- Guest info
  guest_name          TEXT        NOT NULL,
  guest_phone         TEXT        NOT NULL,
  guest_email         TEXT,

  -- Booking details
  property_name       TEXT,
  room_details        JSONB       NOT NULL DEFAULT '[]',
  check_in            DATE,
  check_out           DATE,
  nights              INTEGER,

  -- Amounts (all in KSh)
  subtotal            NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_lines           JSONB       NOT NULL DEFAULT '[]',
  -- Each tax_line: { "label": "VAT", "rate": 16, "amount": 1600 }
  tax_total           NUMERIC(14,2) NOT NULL DEFAULT 0,
  grand_total         NUMERIC(14,2) NOT NULL DEFAULT 0,
  amount_paid         NUMERIC(14,2) NOT NULL DEFAULT 0,
  balance_due         NUMERIC(14,2) NOT NULL DEFAULT 0,

  -- Payment details
  payment_method      TEXT        DEFAULT 'cash',
  payment_reference   TEXT,
  is_partial          BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Notes
  notes               TEXT,

  issued_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. Row-level security ────────────────────────────────────────────────────
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Public can read any receipt by token (guest link access)
CREATE POLICY "Public read receipts" ON receipts
  FOR SELECT USING (true);

-- Host (service role) can insert/update/delete own receipts
CREATE POLICY "Host manage receipts" ON receipts
  FOR ALL USING (host_user_id = auth.uid());

-- ── 4. Index for fast token lookup ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_receipts_token   ON receipts (receipt_token);
CREATE INDEX IF NOT EXISTS idx_receipts_host    ON receipts (host_user_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_booking ON receipts (booking_request_id);

-- ── 5. Add tax config + KRA PIN to profiles ─────────────────────────────────
-- kra_pin already defined in schema but may not exist in older DBs
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kra_pin    TEXT;
-- tax_lines: array of { label: string, rate: number }
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_lines  JSONB DEFAULT '[]'::jsonb;
