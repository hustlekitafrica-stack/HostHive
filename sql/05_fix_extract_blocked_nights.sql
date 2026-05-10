-- Fix: EXTRACT(DAY FROM date - date) fails because DATE - DATE returns INTEGER in PostgreSQL.
-- EXTRACT only works on dates, timestamps, and intervals — not integers.
-- Replace with direct integer subtraction.

CREATE OR REPLACE FUNCTION recalculate_unit_stats(
  p_property_id UUID, p_year INTEGER, p_month INTEGER
) RETURNS void AS $$
DECLARE
  v_days_in_month INTEGER := DATE_PART('days', 
    DATE_TRUNC('month', MAKE_DATE(p_year, p_month, 1)) + INTERVAL '1 month - 1 day')::INTEGER;
  v_blocked_nights INTEGER := 0;
  v_booked_nights INTEGER := 0;
  v_total_revenue DECIMAL(10, 2) := 0;
  v_total_bookings INTEGER := 0;
  v_total_guests INTEGER := 0;
  v_avg_stay DECIMAL(5, 2) := 0;
  v_user_id UUID;
BEGIN
  -- Get user_id for this property
  SELECT user_id INTO v_user_id FROM properties WHERE id = p_property_id;

  -- Calculate blocked nights
  -- FIX: DATE - DATE already returns INTEGER; do not wrap with EXTRACT()
  SELECT COALESCE(SUM((end_date - start_date)::INTEGER), 0)
  INTO v_blocked_nights
  FROM blocked_dates
  WHERE property_id = p_property_id
    AND EXTRACT(YEAR FROM start_date) = p_year
    AND EXTRACT(MONTH FROM start_date) = p_month;

  -- Calculate booked nights and revenue from bookings
  SELECT 
    COALESCE(SUM(nights), 0),
    COALESCE(SUM(total_amount), 0),
    COUNT(*),
    COALESCE(SUM(num_adults + num_children), 0),
    COALESCE(AVG(nights), 0)
  INTO v_booked_nights, v_total_revenue, v_total_bookings, v_total_guests, v_avg_stay
  FROM bookings
  WHERE property_id = p_property_id
    AND EXTRACT(YEAR FROM check_in) = p_year
    AND EXTRACT(MONTH FROM check_in) = p_month
    AND status NOT IN ('cancelled', 'no_show');

  -- Insert or update unit_monthly_stats
  INSERT INTO unit_monthly_stats (
    property_id, user_id, year, month,
    total_revenue, total_bookings, booked_nights,
    available_nights, occupancy_rate, adr, revpar,
    avg_stay_length, total_guests, updated_at
  )
  VALUES (
    p_property_id,
    v_user_id,
    p_year,
    p_month,
    v_total_revenue,
    v_total_bookings,
    v_booked_nights,
    v_days_in_month - v_blocked_nights,
    CASE WHEN (v_days_in_month - v_blocked_nights) > 0 
      THEN (v_booked_nights::REAL / (v_days_in_month - v_blocked_nights) * 100)::DECIMAL(5, 2)
      ELSE 0 END,
    CASE WHEN v_booked_nights > 0 
      THEN (v_total_revenue / v_booked_nights)::DECIMAL(10, 2)
      ELSE 0 END,
    CASE WHEN (v_days_in_month - v_blocked_nights) > 0
      THEN (v_total_revenue / (v_days_in_month - v_blocked_nights))::DECIMAL(10, 2)
      ELSE 0 END,
    v_avg_stay,
    v_total_guests,
    NOW()
  )
  ON CONFLICT (property_id, year, month) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    total_bookings = EXCLUDED.total_bookings,
    booked_nights = EXCLUDED.booked_nights,
    available_nights = EXCLUDED.available_nights,
    occupancy_rate = EXCLUDED.occupancy_rate,
    adr = EXCLUDED.adr,
    revpar = EXCLUDED.revpar,
    avg_stay_length = EXCLUDED.avg_stay_length,
    total_guests = EXCLUDED.total_guests,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
