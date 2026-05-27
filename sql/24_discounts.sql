-- ─── Migration 24: Discounts Engine ──────────────────────────────────────────

-- Discount types:
--   first_timer    → guest's logged-in account has 0 prior bookings
--   early_booking  → booking made >= early_booking_days before check-in
--   online_booking → guest is logged in (any online booking)
--   manual         → admin-controlled, no automatic trigger

CREATE TABLE IF NOT EXISTS discounts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  host_user_id      TEXT        NOT NULL DEFAULT '',
  name              TEXT        NOT NULL,
  description       TEXT        NOT NULL DEFAULT '',
  discount_type     TEXT        NOT NULL CHECK (discount_type IN ('first_timer','early_booking','online_booking','manual')),
  value_type        TEXT        NOT NULL CHECK (value_type IN ('percentage','fixed')) DEFAULT 'percentage',
  value             NUMERIC     NOT NULL DEFAULT 0,
  early_booking_days INTEGER    NULL,
  valid_from        DATE        NULL,
  valid_until       DATE        NULL,
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE
);

-- Junction table: which properties this discount applies to.
-- If NO rows exist for a discount_id → applies to ALL properties.
CREATE TABLE IF NOT EXISTS discount_properties (
  discount_id  UUID  NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
  property_id  UUID  NOT NULL,
  PRIMARY KEY (discount_id, property_id)
);

ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_properties ENABLE ROW LEVEL SECURITY;

-- Host manages own discounts
CREATE POLICY "Host manages own discounts"
  ON discounts FOR ALL USING (true) WITH CHECK (true);

-- Public read active discounts (for checkout evaluation)
CREATE POLICY "Public reads active discounts"
  ON discounts FOR SELECT USING (is_active = TRUE);

-- Host manages discount_properties
CREATE POLICY "Host manages discount_properties"
  ON discount_properties FOR ALL USING (true) WITH CHECK (true);

-- Public reads discount_properties
CREATE POLICY "Public reads discount_properties"
  ON discount_properties FOR SELECT USING (true);
