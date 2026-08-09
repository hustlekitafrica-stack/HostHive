import { NextRequest, NextResponse } from 'next/server';
import { getPosAuth } from '@/lib/pos/device-auth';

// PATCH /api/pos/inventory/[id]
// Body: { item_name?, category?, unit?, quantity_in_stock?, reorder_level?, cost_price?, track_stock? }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const posAuth = await getPosAuth(request);
    if (!posAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { host_user_id, supabase } = posAuth;

    const { id } = await params;
    const body = await request.json();
    const {
      item_name,
      category,
      unit,
      quantity_in_stock,
      reorder_level,
      cost_price,
      track_stock,
    } = body;

    // Build update payload — only include fields that were provided
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (item_name        !== undefined) updates.item_name        = item_name;
    if (category         !== undefined) updates.category         = category;
    if (unit             !== undefined) updates.unit             = unit;
    if (quantity_in_stock !== undefined) updates.quantity_in_stock = quantity_in_stock;
    if (reorder_level    !== undefined) updates.reorder_level    = reorder_level;
    if (cost_price       !== undefined) updates.cost_price       = cost_price;
    if (track_stock      !== undefined) updates.track_stock      = track_stock;

    const { data, error } = await supabase
      .from('pos_inventory')
      .update(updates)
      .eq('id', id)
      .eq('host_user_id', host_user_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/pos/inventory/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const posAuth = await getPosAuth(request);
    if (!posAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { host_user_id, supabase } = posAuth;

    const { id } = await params;

    const { error } = await supabase
      .from('pos_inventory')
      .delete()
      .eq('id', id)
      .eq('host_user_id', host_user_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
