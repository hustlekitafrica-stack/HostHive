import { publicSupabase } from '@/lib/supabase/public';

export type StayProperty = {
  id: string;
  name: string;
  type: string;
  description: string;
  location: string;
  address: string;
  city: string;
  county: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  nightly_rate: number;
  weekend_rate: number;
  breakfast_rate: number;
  cover_photo: string;
  status: string;
  latitude: number;
  longitude: number;
  check_in_time: string;
  check_out_time: string;
  cancellation_policy: string;
  house_rules: Record<string, boolean> | null;
  slug: string | null;
  photos: string[];
  amenities: string[];
};

function addDays(d: string, n: number): string {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().split('T')[0];
}

export async function fetchAvailableProperties(
  checkIn?: string,
  checkOut?: string
): Promise<StayProperty[]> {
  const hostId = process.env.STAY_HOST_USER_ID;

  let query = publicSupabase
    .from('properties')
    .select(
      'id, name, type, description, location, address, city, county, bedrooms, bathrooms, max_guests, nightly_rate, weekend_rate, breakfast_rate, cover_photo, status, latitude, longitude, check_in_time, check_out_time, cancellation_policy, house_rules, slug'
    )
    .eq('status', 'active')
    .order('name');

  if (hostId) query = (query as any).eq('user_id', hostId);

  const { data: properties, error } = await query;
  if (error || !properties) return [];

  const today = new Date().toISOString().split('T')[0];
  const rangeStart = checkIn || today;
  const rangeEnd = checkOut || addDays(today, 1);
  const lastNight = addDays(rangeEnd, -1);
  const blockedIds = new Set<string>();

  try {
    let bq = publicSupabase
      .from('bookings')
      .select('property_id')
      .in('status', ['confirmed', 'tentative', 'checked_in', 'blocked'])
      .lte('check_in', lastNight)
      .gte('check_out', addDays(rangeStart, 1));
    if (hostId) bq = (bq as any).eq('user_id', hostId);
    const { data: bRows } = await bq;
    (bRows ?? []).forEach((b: any) => { if (b.property_id) blockedIds.add(b.property_id); });
  } catch { /* ignore */ }

  try {
    let rq = publicSupabase
      .from('booking_requests')
      .select('room_details')
      .in('status', ['confirmed', 'pending'])
      .lte('check_in', lastNight)
      .gte('check_out', addDays(rangeStart, 1));
    if (hostId) rq = (rq as any).eq('host_user_id', hostId);
    const { data: rRows } = await rq;
    (rRows ?? []).forEach((r: any) => {
      const rooms = Array.isArray(r.room_details) ? r.room_details : [];
      rooms.forEach((room: any) => { if (room.property_id) blockedIds.add(room.property_id); });
    });
  } catch { /* ignore */ }

  const available = (properties as any[]).filter((p) => !blockedIds.has(p.id));

  const withPhotos = await Promise.all(
    available.map(async (p) => {
      const [{ data: photos }, { data: amenities }] = await Promise.all([
        publicSupabase
          .from('property_photos')
          .select('url, sort_order')
          .eq('property_id', p.id)
          .order('sort_order')
          .limit(5),
        publicSupabase
          .from('property_amenities')
          .select('name')
          .eq('property_id', p.id),
      ]);
      return {
        ...p,
        photos: photos?.map((ph: any) => ph.url) ?? (p.cover_photo ? [p.cover_photo] : []),
        amenities: amenities?.map((a: any) => a.name) ?? [],
      } as StayProperty;
    })
  );

  return withPhotos;
}
