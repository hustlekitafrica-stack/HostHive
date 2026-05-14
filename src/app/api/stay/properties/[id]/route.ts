import { NextRequest, NextResponse } from 'next/server';
import { publicSupabase } from '@/lib/supabase/public';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [propRes, photoRes, amenRes] = await Promise.all([
      publicSupabase.from('properties').select('*').eq('id', id).eq('status', 'active').single(),
      publicSupabase.from('property_photos').select('url, sort_order').eq('property_id', id).order('sort_order'),
      publicSupabase.from('property_amenities').select('name').eq('property_id', id),
    ]);

    if (propRes.error || !propRes.data) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const p = propRes.data;
    const photos = photoRes.data?.map((ph: any) => ph.url) ?? (p.cover_photo ? [p.cover_photo] : []);
    const amenities = amenRes.data?.map((a: any) => a.name) ?? [];

    const { data: bookings } = await publicSupabase
      .from('bookings')
      .select('check_in, check_out')
      .eq('property_id', id)
      .not('status', 'in', '("cancelled","blocked")')
      .gte('check_out', new Date().toISOString().split('T')[0]);

    return NextResponse.json({ property: { ...p, photos, amenities }, bookedDates: bookings ?? [] });
  } catch (err) {
    console.error('[stay/properties/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
