import { NextRequest, NextResponse } from 'next/server';
import { getPosAuth } from '@/lib/pos/device-auth';

interface OrderRow {
  id: string;
  total: number;
  payment_method: string;
  paid_at: string;
  items: Array<{ name: string; qty: number; price: number; subtotal: number }> | null;
  [key: string]: unknown;
}

// GET /api/pos/reports?date_from=ISO&date_to=ISO&staff_id=optional
export async function GET(request: NextRequest) {
  try {
    const posAuth = await getPosAuth(request);
    if (!posAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { host_user_id, supabase } = posAuth;

    const { searchParams } = new URL(request.url);
    const date_from = searchParams.get('date_from');
    const date_to   = searchParams.get('date_to');
    const staff_id  = searchParams.get('staff_id');

    // 1. Build the query
    let query = supabase
      .from('pos_orders')
      .select('*')
      .eq('host_user_id', host_user_id)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })
      .limit(200);

    if (date_from) query = query.gte('paid_at', date_from);
    if (date_to)   query = query.lte('paid_at', date_to);
    if (staff_id)  query = query.eq('staff_id', staff_id);

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const orders = (data ?? []) as OrderRow[];

    // 2. Summary aggregation
    const total_revenue = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
    const total_orders  = orders.length;
    const avg_order_value = total_orders > 0 ? total_revenue / total_orders : 0;

    const cash_total  = orders
      .filter(o => o.payment_method === 'cash')
      .reduce((sum, o) => sum + (o.total ?? 0), 0);

    const mpesa_total = orders
      .filter(o => o.payment_method === 'mpesa' || o.payment_method === 'mpesa_manual')
      .reduce((sum, o) => sum + (o.total ?? 0), 0);

    const card_total  = orders
      .filter(o => o.payment_method === 'card')
      .reduce((sum, o) => sum + (o.total ?? 0), 0);

    // 3. Daily breakdown — group by paid_at date
    const dailyMap = new Map<string, { date: string; revenue: number; orders: number }>();
    for (const o of orders) {
      if (!o.paid_at) continue;
      const date = o.paid_at.slice(0, 10); // YYYY-MM-DD
      const existing = dailyMap.get(date) ?? { date, revenue: 0, orders: 0 };
      existing.revenue += o.total ?? 0;
      existing.orders  += 1;
      dailyMap.set(date, existing);
    }
    const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // 4. Top items — aggregate across all orders' items jsonb array in JS
    const itemTotals = new Map<string, { name: string; total_qty: number; total_revenue: number }>();
    for (const o of orders) {
      const items = Array.isArray(o.items) ? o.items : [];
      for (const item of items) {
        const key = item.name ?? 'Unknown';
        const existing = itemTotals.get(key) ?? { name: key, total_qty: 0, total_revenue: 0 };
        existing.total_qty     += item.qty ?? 0;
        existing.total_revenue += item.subtotal ?? (item.price ?? 0) * (item.qty ?? 0);
        itemTotals.set(key, existing);
      }
    }
    const top_items = Array.from(itemTotals.values())
      .sort((a, b) => b.total_qty - a.total_qty)
      .slice(0, 10);

    return NextResponse.json({
      summary: {
        total_revenue,
        total_orders,
        avg_order_value,
        cash_total,
        mpesa_total,
        card_total,
      },
      daily,
      top_items,
      orders,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
