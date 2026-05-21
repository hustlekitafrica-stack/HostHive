-- Allow the public (unauthenticated / anon) to read active properties
-- This is required for the guest-facing stay/rooms page to work.

CREATE POLICY "Public can view active properties"
  ON properties FOR SELECT
  USING (status = 'active');

-- Also allow public read of property_photos and property_amenities
-- so the rooms page can load photos and amenity tags.

CREATE POLICY "Public can view property photos"
  ON property_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_photos.property_id
        AND properties.status = 'active'
    )
  );

CREATE POLICY "Public can view property amenities"
  ON property_amenities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_amenities.property_id
        AND properties.status = 'active'
    )
  );
