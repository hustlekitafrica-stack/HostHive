import { NextResponse } from 'next/server';
import { publicSupabase } from '@/lib/supabase/public';

export async function GET(req: Request) {
  try {
    const hostId = process.env.STAY_HOST_USER_ID;
    const { searchParams } = new URL(req.url);
    const checkIn  = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');

    let query = publicSupabase
      .from('properties')
      .select('id, name, type, description, location, address, city, county, bedrooms, bathrooms, max_guests, nightly_rate, weekend_rate, cover_photo, status, latitude, longitude, check_in_time, check_out_time')
      .eq('status', 'active')
      .order('name');

    if (hostId) query = query.eq('user_id', hostId);

    const { data: properties, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Exclude properties with overlapping active bookings for the requested dates
    const today = new Date().toISOString().split('T')[0];
    const rangeStart = checkIn  || today;
    const rangeEnd   = checkOut || today;
    let blockedIds: Set<string> = new Set();
    try {
      let bq = publicSupabase
        .from('bookings')
        .select('property_id')
        .in('status', ['confirmed', 'tentative', 'checked_in', 'blocked'])
        .lt('check_in',  rangeEnd)
        .gt('check_out', rangeStart);
      if (hostId) bq = bq.eq('user_id', hostId);
      const { data: bRows } = await bq;
      blockedIds = new Set((bRows ?? []).map((b: any) => b.property_id));
    } catch { /* if RLS blocks the query, show all active properties */ }

    const withPhotos = await Promise.all(
      (properties ?? []).filter((p: any) => !blockedIds.has(p.id)).map(async (p: any) => {
        const { data: photos } = await publicSupabase
          .from('property_photos')
          .select('url, sort_order')
          .eq('property_id', p.id)
          .order('sort_order')
          .limit(5);
        const { data: amenities } = await publicSupabase
          .from('property_amenities')
          .select('name')
          .eq('property_id', p.id);
        return {
          ...p,
          photos: photos?.map((ph: any) => ph.url) ?? (p.cover_photo ? [p.cover_photo] : []),
          amenities: amenities?.map((a: any) => a.name) ?? [],
        };
      })
    );

    return NextResponse.json({ properties: withPhotos });
  } catch (err) {
    console.error('[stay/properties]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
