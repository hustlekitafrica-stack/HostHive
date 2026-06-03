import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('featured_dishes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('sort_order')
      .order('created_at');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ dishes: data ?? [] });
  } catch (err) {
    console.error('[featured-dishes GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, description = '', price = 0, image_url = '', badge = '', badge_color = '#D97706', sort_order = 0 } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const { data, error } = await supabase
      .from('featured_dishes')
      .insert({
        user_id: session.user.id,
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        image_url,
        badge: badge.trim(),
        badge_color,
        sort_order: Number(sort_order),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ dish: data }, { status: 201 });
  } catch (err) {
    console.error('[featured-dishes POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
