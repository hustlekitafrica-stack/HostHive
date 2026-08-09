import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/pos/shifts/[id]
// Returns the shift plus a total_orders count for the shift.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { data: shift, error: shiftError } = await supabase
      .from('pos_shifts')
      .select('*')
      .eq('id', id)
      .eq('host_user_id', session.user.id)
      .single();

    if (shiftError || !shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Count orders belonging to this shift
    const { count, error: countError } = await supabase
      .from('pos_orders')
      .select('*', { count: 'exact', head: true })
      .eq('shift_id', id);

    if (countError) return NextResponse.json({ error: countError.message }, { status: 400 });

    return NextResponse.json({ shift: { ...shift, total_orders: count ?? 0 } });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/pos/shifts/[id]
// Body: { closing_cash_counted, notes? }
// Closes the shift and calculates all summary figures.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { closing_cash_counted, notes } = body;

    if (closing_cash_counted === undefined || closing_cash_counted === null) {
      return NextResponse.json({ error: 'closing_cash_counted is required' }, { status: 400 });
    }

    // 1. Fetch the shift
    const { data: shift, error: shiftError } = await supabase
      .from('pos_shifts')
      .select('*')
      .eq('id', id)
      .eq('host_user_id', session.user.id)
      .single();

    if (shiftError || !shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // 2. Guard against double-close
    if (shift.status === 'closed') {
      return NextResponse.json({ error: 'Shift is already closed' }, { status: 400 });
    }

    // 3. Fetch all paid orders for this shift
    const { data: paidOrders, error: ordersError } = await supabase
      .from('pos_orders')
      .select('total, payment_method')
      .eq('shift_id', id)
      .eq('status', 'paid');

    if (ordersError) return NextResponse.json({ error: ordersError.message }, { status: 400 });

    const orders = paidOrders ?? [];

    const total_cash_sales  = orders
      .filter(o => o.payment_method === 'cash')
      .reduce((sum, o) => sum + (o.total ?? 0), 0);

    const total_mpesa_sales = orders
      .filter(o => o.payment_method === 'mpesa' || o.payment_method === 'mpesa_manual')
      .reduce((sum, o) => sum + (o.total ?? 0), 0);

    const total_card_sales  = orders
      .filter(o => o.payment_method === 'card')
      .reduce((sum, o) => sum + (o.total ?? 0), 0);

    const total_sales  = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
    const total_orders = orders.length;

    // 4. Count void orders
    const { count: voidCount, error: voidError } = await supabase
      .from('pos_orders')
      .select('*', { count: 'exact', head: true })
      .eq('shift_id', id)
      .eq('status', 'void');

    if (voidError) return NextResponse.json({ error: voidError.message }, { status: 400 });

    const total_voids = voidCount ?? 0;

    // 5. Cash reconciliation
    const expected_cash  = (shift.opening_float ?? 0) + total_cash_sales;
    const cash_variance  = closing_cash_counted - expected_cash;

    // 6. Close the shift
    const { data: updated, error: updateError } = await supabase
      .from('pos_shifts')
      .update({
        status:               'closed',
        closed_at:            new Date().toISOString(),
        closing_cash_counted,
        notes:                notes ?? null,
        total_cash_sales,
        total_mpesa_sales,
        total_card_sales,
        total_sales,
        total_orders,
        total_voids,
        expected_cash,
        cash_variance,
      })
      .eq('id', id)
      .eq('host_user_id', session.user.id)
      .select()
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

    return NextResponse.json({ shift: updated });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
