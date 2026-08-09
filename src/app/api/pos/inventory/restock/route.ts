import { NextRequest, NextResponse } from 'next/server';
import { getPosAuth } from '@/lib/pos/device-auth';

interface RestockItem {
  inventory_id: string;
  quantity: number;
  notes?: string;
}

// POST /api/pos/inventory/restock
// Body: { items: Array<{ inventory_id, quantity, notes? }> }
export async function POST(request: NextRequest) {
  try {
    const posAuth = await getPosAuth(request);
    if (!posAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { host_user_id, supabase } = posAuth;

    const body = await request.json();
    const { items } = body as { items: RestockItem[] };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items array is required and must not be empty' }, { status: 400 });
    }

    const now = new Date().toISOString();
    let updatedCount = 0;

    for (const item of items) {
      const { inventory_id, quantity, notes } = item;

      if (!inventory_id || typeof quantity !== 'number' || quantity <= 0) {
        return NextResponse.json(
          { error: `Invalid item: inventory_id and a positive quantity are required` },
          { status: 400 }
        );
      }

      // 1. Increment quantity_in_stock on the inventory row (must belong to this host)
      const { data: existing, error: fetchError } = await supabase
        .from('pos_inventory')
        .select('id, quantity_in_stock')
        .eq('id', inventory_id)
        .eq('host_user_id', host_user_id)
        .single();

      if (fetchError || !existing) {
        return NextResponse.json(
          { error: `Inventory item ${inventory_id} not found` },
          { status: 404 }
        );
      }

      const { error: updateError } = await supabase
        .from('pos_inventory')
        .update({
          quantity_in_stock: (existing.quantity_in_stock ?? 0) + quantity,
          updated_at: now,
        })
        .eq('id', inventory_id)
        .eq('host_user_id', host_user_id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      // 2. Record the movement
      const { error: movementError } = await supabase
        .from('pos_inventory_movements')
        .insert({
          inventory_id,
          host_user_id:    host_user_id,
          movement_type:   'restock',
          quantity_change: quantity,
          notes:           notes ?? null,
        });

      if (movementError) {
        return NextResponse.json({ error: movementError.message }, { status: 400 });
      }

      updatedCount++;
    }

    return NextResponse.json({ success: true, updated: updatedCount });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
