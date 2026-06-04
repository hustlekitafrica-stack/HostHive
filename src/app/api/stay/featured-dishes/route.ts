import { NextResponse } from 'next/server';
import { publicSupabase } from '@/lib/supabase/public';

export async function GET() {
  try {
    const hostId = process.env.STAY_HOST_USER_ID;

    let query = publicSupabase
      .from('featured_dishes')
      .select('id, name, description, price, image_url, badge, badge_color, sort_order')
      .eq('is_active', true)
      .order('sort_order')
      .order('created_at');

    if (hostId) query = query.eq('user_id', hostId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ dishes: data ?? [] });
  } catch (err) {
    console.error('[stay/featured-dishes GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
