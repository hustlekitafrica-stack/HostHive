import { NextRequest, NextResponse } from 'next/server';
import { getPosAuth } from '@/lib/pos/device-auth';

// POST /api/pos/inventory/seed
// Seeds pos_inventory from menu_items for the current host, skipping duplicates.
export async function POST(request: NextRequest) {
  try {
    const posAuth = await getPosAuth(request);
    if (!posAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { host_user_id, supabase } = posAuth;

    // 1. Get menu_item_ids already tracked in inventory for this host
    const { data: existing, error: existingError } = await supabase
      .from('pos_inventory')
      .select('menu_item_id')
      .eq('host_user_id', host_user_id)
      .not('menu_item_id', 'is', null);

    if (existingError) return NextResponse.json({ error: existingError.message }, { status: 400 });

    const existingIds = new Set((existing ?? []).map((r: { menu_item_id: string }) => r.menu_item_id));

    // 2. Fetch all active menu items (shared table — no host filter)
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, name, tab, active')
      .eq('active', true);

    if (menuError) return NextResponse.json({ error: menuError.message }, { status: 400 });

    // 3. Filter to items not yet in inventory, then build insert rows
    const toInsert = (menuItems ?? [])
      .filter((m: { id: string; name: string; tab: string; active: boolean }) => !existingIds.has(m.id))
      .map((m: { id: string; name: string; tab: string; active: boolean }) => ({
        host_user_id:      host_user_id,
        menu_item_id:      m.id,
        item_name:         m.name,
        category:          m.tab === 'drinks' ? 'bar' : 'food',
        unit:              'unit',
        quantity_in_stock: 0,
        reorder_level:     5,
        track_stock:       false,
      }));

    const skippedCount = (menuItems ?? []).length - toInsert.length;

    if (toInsert.length === 0) {
      return NextResponse.json({ success: true, seeded: 0, skipped: skippedCount });
    }

    const { error: insertError } = await supabase
      .from('pos_inventory')
      .insert(toInsert);

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });

    return NextResponse.json({ success: true, seeded: toInsert.length, skipped: skippedCount });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
