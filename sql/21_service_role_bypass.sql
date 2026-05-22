-- Migration 21: Service-role bypass policies for guests and bookings
-- This allows server-side API routes using SUPABASE_SERVICE_ROLE_KEY
-- to insert/update guests and bookings without RLS blocking them.
-- Run this in Supabase SQL Editor.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guests' AND policyname = 'Service role can manage guests'
  ) THEN
    EXECUTE 'CREATE POLICY "Service role can manage guests" ON guests FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Service role can manage bookings'
  ) THEN
    EXECUTE 'CREATE POLICY "Service role can manage bookings" ON bookings FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')';
  END IF;
END $$;
