import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { reason, manager_pin } = body;

    if (!reason || !manager_pin) {
      return NextResponse.json({ error: 'reason and manager_pin are required' }, { status: 400 });
    }

    // Step 1: Fetch the order and verify ownership
    const { data: order, error: orderError } = await supabase
      .from('pos_orders')
      .select('*')
      .eq('id', id)
      .eq('host_user_id', session.user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Step 2: Reject if already voided or paid
    if (order.status === 'void') {
      return NextResponse.json({ error: 'Order is already voided' }, { status: 400 });
    }
    if (order.status === 'paid') {
      return NextResponse.json({ error: 'Paid orders cannot be voided' }, { status: 400 });
    }

    // Step 3: Find an active manager for this host
    const { data: manager, error: managerError } = await supabase
      .from('pos_staff')
      .select('id, pin_hash')
      .eq('host_user_id', session.user.id)
      .eq('role', 'manager')
      .eq('active', true)
      .single();

    if (managerError || !manager) {
      return NextResponse.json({ error: 'No active manager found for this account' }, { status: 400 });
    }

    // Step 4: Verify the manager PIN
    const pinValid = await bcrypt.compare(String(manager_pin), manager.pin_hash);
    if (!pinValid) {
      return NextResponse.json({ error: 'Invalid manager PIN' }, { status: 400 });
    }

    // Step 5: Void the order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('pos_orders')
      .update({
        status: 'void',
        void_reason: reason,
        void_authorised_by: manager.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('host_user_id', session.user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Step 6: Free up the table if the order was assigned to one
    if (order.table_id) {
      await supabase
        .from('pos_tables')
        .update({
          status: 'available',
          current_order_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.table_id)
        .eq('host_user_id', session.user.id);
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
