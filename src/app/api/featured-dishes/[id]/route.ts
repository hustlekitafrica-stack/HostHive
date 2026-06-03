import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name        !== undefined) updates.name        = body.name.trim();
    if (body.description !== undefined) updates.description = body.description.trim();
    if (body.price       !== undefined) updates.price       = Number(body.price);
    if (body.image_url   !== undefined) updates.image_url   = body.image_url;
    if (body.badge       !== undefined) updates.badge       = body.badge.trim();
    if (body.badge_color !== undefined) updates.badge_color = body.badge_color;
    if (body.sort_order  !== undefined) updates.sort_order  = Number(body.sort_order);
    if (body.is_active   !== undefined) updates.is_active   = body.is_active;

    const { data, error } = await supabase
      .from('featured_dishes')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ dish: data });
  } catch (err) {
    console.error('[featured-dishes PATCH]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('featured_dishes')
      .delete()
      .eq('id', params.id)
      .eq('user_id', session.user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[featured-dishes DELETE]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
