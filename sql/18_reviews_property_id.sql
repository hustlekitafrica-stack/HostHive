-- ─── Migration 18: Link WhatsApp reviews to a specific property ─────────────

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_property_id ON reviews(property_id);
