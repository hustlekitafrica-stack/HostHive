import { NextRequest, NextResponse } from 'next/server';
import { getPosAuth } from '@/lib/pos/device-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const posAuth = await getPosAuth(request);
    if (!posAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { host_user_id, supabase } = posAuth;

    const { id } = await params;

    const { data, error } = await supabase
      .from('pos_orders')
      .select('*')
      .eq('id', id)
      .eq('host_user_id', host_user_id)
      .single();

    if (error || !data) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    return NextResponse.json({ order: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
      status,
      items,
      table_id,
      table_name,
      shift_id,
      staff_id,
      staff_name,
      order_type,
      customer_name,
      customer_phone,
      subtotal,
      discount_type,
      discount_value,
      discount_amount,
      tax_amount,
      total,
      payment_method,
      payment_reference,
      amount_tendered,
      change_given,
      notes,
      paid_at,
      kitchen_sent_at,
    } = body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status !== undefined) updates.status = status;
    if (items !== undefined) updates.items = items;
    if (table_id !== undefined) updates.table_id = table_id;
    if (table_name !== undefined) updates.table_name = table_name;
    if (shift_id !== undefined) updates.shift_id = shift_id;
    if (staff_id !== undefined) updates.staff_id = staff_id;
    if (staff_name !== undefined) updates.staff_name = staff_name;
    if (order_type !== undefined) updates.order_type = order_type;
    if (customer_name !== undefined) updates.customer_name = customer_name;
    if (customer_phone !== undefined) updates.customer_phone = customer_phone;
    if (subtotal !== undefined) updates.subtotal = subtotal;
    if (discount_type !== undefined) updates.discount_type = discount_type;
    if (discount_value !== undefined) updates.discount_value = discount_value;
    if (discount_amount !== undefined) updates.discount_amount = discount_amount;
    if (tax_amount !== undefined) updates.tax_amount = tax_amount;
    if (total !== undefined) updates.total = total;
    if (payment_method !== undefined) updates.payment_method = payment_method;
    if (payment_reference !== undefined) updates.payment_reference = payment_reference;
    if (amount_tendered !== undefined) updates.amount_tendered = amount_tendered;
    if (change_given !== undefined) updates.change_given = change_given;
    if (notes !== undefined) updates.notes = notes;
    if (paid_at !== undefined) updates.paid_at = paid_at;
    if (kitchen_sent_at !== undefined) updates.kitchen_sent_at = kitchen_sent_at;

    const { data, error } = await supabase
      .from('pos_orders')
      .update(updates)
      .eq('id', id)
      .eq('host_user_id', host_user_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    return NextResponse.json({ order: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
