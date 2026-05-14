-- ─── Migration 14: Guest Reviews + Booking Request Updates ─────────────────

-- 1. Add guest_user_id and updated_at to booking_requests
ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS guest_user_id UUID,
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT NOW();

-- 2. Expand status to include 'declined'
ALTER TABLE booking_requests
  DROP CONSTRAINT IF EXISTS booking_requests_status_check;
ALTER TABLE booking_requests
  ADD CONSTRAINT booking_requests_status_check
  CHECK (status IN ('pending','confirmed','declined','cancelled'));

-- 3. Allow host to update booking_requests (accept / decline)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'booking_requests' AND policyname = 'Host can update booking requests'
  ) THEN
    EXECUTE 'CREATE POLICY "Host can update booking requests" ON booking_requests FOR UPDATE USING (true)';
  END IF;
END $$;

-- 4. Guest reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  booking_request_id  UUID REFERENCES booking_requests(id) ON DELETE SET NULL,
  review_token        UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  guest_name          TEXT NOT NULL DEFAULT '',
  guest_phone         TEXT NOT NULL DEFAULT '',
  property_name       TEXT NOT NULL DEFAULT '',
  stay_dates          TEXT NOT NULL DEFAULT '',
  rating              INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment             TEXT NOT NULL DEFAULT '',
  submitted           BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at        TIMESTAMPTZ,
  host_user_id        TEXT NOT NULL DEFAULT '',
  is_featured         BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Anyone can read submitted reviews') THEN
    EXECUTE 'CREATE POLICY "Anyone can read submitted reviews" ON reviews FOR SELECT USING (submitted = TRUE)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Host can insert review requests') THEN
    EXECUTE 'CREATE POLICY "Host can insert review requests" ON reviews FOR INSERT WITH CHECK (true)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Anyone can submit a review via token') THEN
    EXECUTE 'CREATE POLICY "Anyone can submit a review via token" ON reviews FOR UPDATE USING (true)';
  END IF;
END $$;
