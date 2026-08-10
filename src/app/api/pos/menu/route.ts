/**
 * GET /api/pos/menu
 *
 * Returns a unified menu for the POS terminal:
 *   - Food items: from the hotel `menu_items` table (breakfast, mains, snacks, drinks, sides)
 *   - Bar items: from `pos_inventory` where category = 'bar' AND selling_price IS NOT NULL
 *
 * All items are normalised to the POSMenuItem shape used by MenuGrid.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPosAuth } from '@/lib/pos/device-auth';

export interface POSMenuItem {
  id: string;
  tab: string;
  category: string;
  name: string;
  description: string;
  price: number;
  tag: 'popular' | 'special' | null;
  active: boolean;
  position: number;
  image_url: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const posAuth = await getPosAuth(request);
    if (!posAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { host_user_id, supabase } = posAuth;

    // 1. Food items from menu_items (filtered by host_user_id)
    const { data: menuData, error: menuErr } = await supabase
      .from('menu_items')
      .select('id, tab, category, name, description, price, tag, active, position, image_url')
      .eq('host_user_id', host_user_id)
      .eq('active', true)
      .order('tab')
      .order('position');

    if (menuErr) {
      console.error('[pos/menu] menu_items error', menuErr);
    }

    const foodItems: POSMenuItem[] = (menuData ?? []).map((m: Record<string, unknown>) => ({
      id:          m.id as string,
      tab:         (m.tab as string) ?? 'mains',
      category:    (m.category as string) ?? '',
      name:        (m.name as string) ?? '',
      description: (m.description as string) ?? '',
      price:       (m.price as number) ?? 0,
      tag:         (m.tag as 'popular' | 'special' | null) ?? null,
      active:      (m.active as boolean) ?? true,
      position:    (m.position as number) ?? 0,
      image_url:   (m.image_url as string | null) ?? null,
    }));

    // 2. Bar items from pos_inventory (selling_price must be set)
    const { data: barData, error: barErr } = await supabase
      .from('pos_inventory')
      .select('id, item_name, unit, selling_price, category')
      .eq('host_user_id', host_user_id)
      .eq('category', 'bar')
      .not('selling_price', 'is', null)
      .order('item_name');

    if (barErr) {
      console.error('[pos/menu] pos_inventory error', barErr);
    }

    const barItems: POSMenuItem[] = (barData ?? []).map((b: Record<string, unknown>, idx: number) => ({
      id:          b.id as string,
      tab:         'bar',
      category:    'bar',
      name:        (b.item_name as string) ?? '',
      description: (b.unit as string) ?? '',
      price:       (b.selling_price as number) ?? 0,
      tag:         null,
      active:      true,
      position:    idx,
      image_url:   null,
    }));

    return NextResponse.json({ items: [...foodItems, ...barItems] });
  } catch (err) {
    console.error('[pos/menu] unexpected error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
