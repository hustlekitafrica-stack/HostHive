-- ─── Migration 15: Dynamic Menu Items ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS menu_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  tab           TEXT NOT NULL CHECK (tab IN ('breakfast','mains','snacks','drinks','sides')),
  category      TEXT NOT NULL DEFAULT '',
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  price         INTEGER NOT NULL DEFAULT 0,
  tag           TEXT CHECK (tag IN ('popular','special') OR tag IS NULL),
  position      INTEGER NOT NULL DEFAULT 0,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  host_user_id  TEXT NOT NULL DEFAULT ''
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active menu items"
  ON menu_items FOR SELECT USING (active = TRUE);

CREATE POLICY "Host can manage menu items"
  ON menu_items FOR ALL USING (true) WITH CHECK (true);
