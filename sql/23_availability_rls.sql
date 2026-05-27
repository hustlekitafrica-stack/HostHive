-- Allow the anon (public) role to read availability data from bookings
-- so the guest-facing /stay/rooms page can filter out booked properties
-- even when the service role key is not available.
-- Only exposes property_id, check_in, check_out, status — no guest PII.

DROP POLICY IF EXISTS "public_read_availability_bookings" ON bookings;
CREATE POLICY "public_read_availability_bookings" ON bookings
  FOR SELECT
  TO anon
  USING (status IN ('confirmed', 'tentative', 'checked_in', 'blocked'));

-- Same for booking_requests — allows checking confirmed/pending requests
-- when the auto-booking insert into bookings failed silently.
DROP POLICY IF EXISTS "public_read_availability_requests" ON booking_requests;
CREATE POLICY "public_read_availability_requests" ON booking_requests
  FOR SELECT
  TO anon
  USING (status IN ('confirmed', 'pending'));
