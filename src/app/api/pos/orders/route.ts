import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const shift_id = searchParams.get('shift_id');
    const limit = parseInt(searchParams.get('limit') ?? '100', 10);
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');

    let query = supabase
      .from('pos_orders')
      .select('*')
      .eq('host_user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) query = query.eq('status', status);
    if (shift_id) query = query.eq('shift_id', shift_id);
    if (date_from) query = query.gte('created_at', date_from);
    if (date_to) query = query.lte('created_at', date_to);

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ orders: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      table_id,
      table_name,
      shift_id,
      staff_id,
      staff_name,
      order_type,
      items,
      customer_name,
      customer_phone,
      subtotal,
      discount_type,
      discount_value,
      discount_amount,
      tax_amount,
      total,
      notes,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items must be a non-empty array' }, { status: 400 });
    }
    if (subtotal === undefined || subtotal === null) {
      return NextResponse.json({ error: 'subtotal is required' }, { status: 400 });
    }
    if (total === undefined || total === null) {
      return NextResponse.json({ error: 'total is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('pos_orders')
      .insert({
        host_user_id: session.user.id,
        table_id: table_id ?? null,
        table_name: table_name ?? null,
        shift_id: shift_id ?? null,
        staff_id: staff_id ?? null,
        staff_name: staff_name ?? null,
        order_type: order_type ?? null,
        items,
        customer_name: customer_name ?? null,
        customer_phone: customer_phone ?? null,
        subtotal,
        discount_type: discount_type ?? null,
        discount_value: discount_value ?? null,
        discount_amount: discount_amount ?? null,
        tax_amount: tax_amount ?? null,
        total,
        notes: notes ?? null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ order: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
