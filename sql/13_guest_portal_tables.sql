-- ─── Guest Portal Tables ──────────────────────────────────────────────────────

-- Booking requests submitted by guests (pending host confirmation)
CREATE TABLE IF NOT EXISTS booking_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  guest_name       TEXT NOT NULL,
  guest_phone      TEXT NOT NULL,
  guest_email      TEXT NOT NULL DEFAULT '',
  check_in         DATE NOT NULL,
  check_out        DATE NOT NULL,
  nights           INTEGER NOT NULL,
  num_adults       INTEGER NOT NULL DEFAULT 1,
  num_children     INTEGER NOT NULL DEFAULT 0,
  room_details     JSONB NOT NULL DEFAULT '[]',
  total_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
  special_requests TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','cancelled')),
  host_user_id     TEXT NOT NULL DEFAULT ''
);

-- Food orders (room service / dine-in / delivery)
CREATE TABLE IF NOT EXISTS food_orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  order_number     TEXT UNIQUE NOT NULL DEFAULT
                     'KO-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8)),
  order_type       TEXT NOT NULL
                     CHECK (order_type IN ('room_service','dine_in','delivery')),
  guest_name       TEXT NOT NULL,
  guest_phone      TEXT NOT NULL,
  room_number      TEXT NOT NULL DEFAULT '',
  delivery_address TEXT NOT NULL DEFAULT '',
  dine_in_time     TEXT NOT NULL DEFAULT '',
  items            JSONB NOT NULL DEFAULT '[]',
  subtotal         NUMERIC(10,2) NOT NULL DEFAULT 0,
  service_fee      NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee     NUMERIC(10,2) NOT NULL DEFAULT 0,
  total            NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes            TEXT NOT NULL DEFAULT '',
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','received','preparing','ready','delivered','cancelled')),
  host_user_id     TEXT NOT NULL DEFAULT ''
);

-- RLS
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit booking request"
  ON booking_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read booking requests"
  ON booking_requests FOR SELECT USING (true);

ALTER TABLE food_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create food order"
  ON food_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read food orders"
  ON food_orders FOR SELECT USING (true);

-- Allow public read of active properties for the guest portal
-- Run this if you are NOT using SUPABASE_SERVICE_ROLE_KEY in your API routes:
-- CREATE POLICY "Public can view active properties"
--   ON properties FOR SELECT USING (status = 'active');
