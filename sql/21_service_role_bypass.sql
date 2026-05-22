-- Migration 21: API bypass policies for guests and bookings (single-tenant)
-- Allows server-side API routes to create/read guests and bookings
-- for the host user WITHOUT requiring an active browser session.
-- Works with both service_role key AND anon key.
-- Run this in Supabase SQL Editor.

-- ── GUESTS ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='guests' AND policyname='API can insert guests for host') THEN
    EXECUTE 'CREATE POLICY "API can insert guests for host" ON guests FOR INSERT WITH CHECK (user_id = ''626db9cc-8f80-422a-a70b-1a68b28a833a'')';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='guests' AND policyname='API can read guests for host') THEN
    EXECUTE 'CREATE POLICY "API can read guests for host" ON guests FOR SELECT USING (user_id = ''626db9cc-8f80-422a-a70b-1a68b28a833a'')';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='guests' AND policyname='API can update guests for host') THEN
    EXECUTE 'CREATE POLICY "API can update guests for host" ON guests FOR UPDATE USING (user_id = ''626db9cc-8f80-422a-a70b-1a68b28a833a'')';
  END IF;
END $$;

-- ── BOOKINGS ─────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bookings' AND policyname='API can insert bookings for host') THEN
    EXECUTE 'CREATE POLICY "API can insert bookings for host" ON bookings FOR INSERT WITH CHECK (user_id = ''626db9cc-8f80-422a-a70b-1a68b28a833a'')';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bookings' AND policyname='API can read bookings for host') THEN
    EXECUTE 'CREATE POLICY "API can read bookings for host" ON bookings FOR SELECT USING (user_id = ''626db9cc-8f80-422a-a70b-1a68b28a833a'')';
  END IF;
END $$;
