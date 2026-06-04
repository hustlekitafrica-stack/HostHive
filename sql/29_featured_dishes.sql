-- Migration: Featured Dishes
-- Powers the 4-strip dining showcase card on the homepage

CREATE TABLE IF NOT EXISTS featured_dishes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  price        INTEGER NOT NULL DEFAULT 0,
  image_url    TEXT NOT NULL DEFAULT '',
  badge        TEXT NOT NULL DEFAULT '',
  badge_color  TEXT NOT NULL DEFAULT '#D97706',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE featured_dishes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'featured_dishes' AND policyname = 'Users manage own featured dishes'
  ) THEN
    CREATE POLICY "Users manage own featured dishes"
      ON featured_dishes FOR ALL
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'featured_dishes' AND policyname = 'Public can read active featured dishes'
  ) THEN
    CREATE POLICY "Public can read active featured dishes"
      ON featured_dishes FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

-- Seed default dishes for existing users (only if they have none yet)
INSERT INTO featured_dishes (user_id, name, description, price, image_url, badge, badge_color, sort_order)
SELECT DISTINCT
  p.user_id,
  d.name,
  d.description,
  d.price,
  d.image_url,
  d.badge,
  d.badge_color,
  d.sort_order
FROM properties p
CROSS JOIN (VALUES
  ('Chicken Pilau',     'Spiced basmati rice',       700, '/images/chicken-pilau.jpg',     '⭐ Chef''s Pick',   '#D97706', 1),
  ('Kienyeji Chicken',  'Slow-cooked, rich sauce',   600, '/images/kienyeji-chicken.jpg',  '🌿 Traditional',   '#16a34a', 2),
  ('BBQ Chicken Wings', 'Smoky, sticky & charred',   600, '/images/bbq-chicken-wings.jpg', '🔥 Fan Favourite', '#dc2626', 3),
  ('Whole Tilapia',     'In rich tomato sauce',      800, '/images/tilapia.jpg',           '🐟 Lake Fresh',    '#0369a1', 4)
) AS d(name, description, price, image_url, badge, badge_color, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM featured_dishes fd WHERE fd.user_id = p.user_id
)
ON CONFLICT DO NOTHING;
