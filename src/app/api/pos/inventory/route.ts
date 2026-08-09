import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/pos/inventory?category=food|bar
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let query = supabase
      .from('pos_inventory')
      .select('*')
      .eq('host_user_id', session.user.id)
      .order('category', { ascending: true })
      .order('item_name', { ascending: true });

    if (category === 'food' || category === 'bar') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ inventory: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/pos/inventory
// Body: { item_name, category?, unit?, quantity_in_stock?, reorder_level?, cost_price?, menu_item_id?, track_stock? }
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      item_name,
      category,
      unit,
      quantity_in_stock,
      reorder_level,
      cost_price,
      menu_item_id,
      track_stock,
    } = body;

    if (!item_name) {
      return NextResponse.json({ error: 'item_name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('pos_inventory')
      .insert({
        host_user_id:      session.user.id,
        item_name,
        category:          category          ?? null,
        unit:              unit              ?? null,
        quantity_in_stock: quantity_in_stock ?? 0,
        reorder_level:     reorder_level     ?? null,
        cost_price:        cost_price        ?? null,
        menu_item_id:      menu_item_id      ?? null,
        track_stock:       track_stock       ?? false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ item: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
