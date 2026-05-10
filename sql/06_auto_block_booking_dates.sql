-- ============================================================================
-- Migration 06: Auto-block dates when a booking is created/cancelled/deleted
-- ============================================================================

-- 1. Add booking_id to blocked_dates so auto-blocks are linked to their booking.
--    ON DELETE CASCADE means deleting a booking automatically removes its block.
ALTER TABLE blocked_dates
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE;

-- Index for fast lookup by booking
CREATE INDEX IF NOT EXISTS idx_blocked_dates_booking_id ON blocked_dates(booking_id);


-- ============================================================================
-- 2. Trigger function: keep blocked_dates in sync with bookings
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_booking_blocked_dates()
RETURNS TRIGGER AS $$
BEGIN

  -- ── INSERT: any new active booking or manual block → block its dates ──
  IF TG_OP = 'INSERT' THEN
    IF NEW.status NOT IN ('cancelled', 'no_show') THEN
      INSERT INTO blocked_dates (property_id, user_id, start_date, end_date, reason, booking_id)
      VALUES (
        NEW.property_id,
        NEW.user_id,
        NEW.check_in,
        NEW.check_out,
        CASE
          WHEN NEW.status = 'blocked' THEN COALESCE(NEW.notes, 'Blocked')
          ELSE 'Booking (' || COALESCE(NEW.booking_source, 'Direct') || ')'
        END,
        NEW.id
      );
    END IF;

  -- ── UPDATE ──
  ELSIF TG_OP = 'UPDATE' THEN

    -- Booking cancelled/no-show → remove block
    IF NEW.status IN ('cancelled', 'no_show')
       AND OLD.status NOT IN ('cancelled', 'no_show') THEN
      DELETE FROM blocked_dates WHERE booking_id = NEW.id;

    -- Booking reinstated from cancelled → re-add block
    ELSIF OLD.status IN ('cancelled', 'no_show')
          AND NEW.status NOT IN ('cancelled', 'no_show', 'blocked') THEN
      INSERT INTO blocked_dates (property_id, user_id, start_date, end_date, reason, booking_id)
      VALUES (
        NEW.property_id,
        NEW.user_id,
        NEW.check_in,
        NEW.check_out,
        'Booking (' || COALESCE(NEW.booking_source, 'Direct') || ')',
        NEW.id
      )
      ON CONFLICT DO NOTHING;

    -- Dates changed on an active booking → update the block
    ELSIF NEW.status NOT IN ('cancelled', 'no_show')
          AND (NEW.check_in <> OLD.check_in OR NEW.check_out <> OLD.check_out) THEN
      UPDATE blocked_dates
      SET start_date = NEW.check_in,
          end_date   = NEW.check_out,
          updated_at = NOW()
      WHERE booking_id = NEW.id;

    END IF;

  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- 3. Attach trigger to bookings table
-- ============================================================================

DROP TRIGGER IF EXISTS booking_blocked_dates_trigger ON bookings;

CREATE TRIGGER booking_blocked_dates_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION sync_booking_blocked_dates();


-- ============================================================================
-- 4. Back-fill: block dates for all existing active bookings
-- ============================================================================

INSERT INTO blocked_dates (property_id, user_id, start_date, end_date, reason, booking_id)
SELECT
  b.property_id,
  b.user_id,
  b.check_in,
  b.check_out,
  'Booking (' || COALESCE(b.booking_source, 'Direct') || ')',
  b.id
FROM bookings b
WHERE b.status NOT IN ('cancelled', 'no_show', 'blocked')
  AND NOT EXISTS (
    SELECT 1 FROM blocked_dates bd WHERE bd.booking_id = b.id
  );
