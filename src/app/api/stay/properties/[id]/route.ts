import { NextRequest, NextResponse } from 'next/server';
import { publicSupabase } from '@/lib/supabase/public';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: param } = await params;
    const col = UUID_RE.test(param) ? 'id' : 'slug';

    const propRes = await publicSupabase.from('properties').select('*').eq(col, param).eq('status', 'active').single();
    if (propRes.error || !propRes.data) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    const id = propRes.data.id;

    const [photoRes, amenRes] = await Promise.all([
      publicSupabase.from('property_photos').select('url, sort_order').eq('property_id', id).order('sort_order'),
      publicSupabase.from('property_amenities').select('name').eq('property_id', id),
    ]);

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
