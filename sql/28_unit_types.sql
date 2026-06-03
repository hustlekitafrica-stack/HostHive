-- Migration: Unit Types
-- Allows each host to define their own property/unit type categories

CREATE TABLE IF NOT EXISTS unit_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

ALTER TABLE unit_types ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='unit_types' AND policyname='Users manage own unit types') THEN
    CREATE POLICY "Users manage own unit types"
      ON unit_types FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Seed default types for existing users who already have properties
-- (runs only if they have no unit types yet)
INSERT INTO unit_types (user_id, name, description, sort_order)
SELECT DISTINCT
  p.user_id,
  t.name,
  t.description,
  t.sort_order
FROM properties p
CROSS JOIN (VALUES
  ('Studio',       'Open-plan bedroom + living area',              1),
  ('One Bedroom',  'Separate bedroom + living space',             2),
  ('Two Bedroom',  'Two separate bedrooms',                       3),
  ('Three Bedroom','Three separate bedrooms',                     4),
  ('Four Bedroom', 'Four separate bedrooms',                      5)
) AS t(name, description, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM unit_types ut WHERE ut.user_id = p.user_id
)
ON CONFLICT (user_id, name) DO NOTHING;
