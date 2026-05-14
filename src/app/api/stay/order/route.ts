import { NextRequest, NextResponse } from 'next/server';
import { publicSupabase } from '@/lib/supabase/public';
import { ROOM_SERVICE_FEE, DELIVERY_FEE } from '@/lib/menu-data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_type,
      guest_name, guest_phone,
      room_number = '',
      delivery_address = '',
      dine_in_time = '',
      items = [],
      notes = '',
    } = body;

    if (!guest_name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!guest_phone?.trim()) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    if (!items?.length) return NextResponse.json({ error: 'Your order is empty' }, { status: 400 });
    if (!['room_service', 'dine_in', 'delivery'].includes(order_type))
      return NextResponse.json({ error: 'Invalid order type' }, { status: 400 });
    if (order_type === 'room_service' && !room_number?.trim())
      return NextResponse.json({ error: 'Room number is required for room service' }, { status: 400 });
    if (order_type === 'delivery' && !delivery_address?.trim())
      return NextResponse.json({ error: 'Delivery address is required' }, { status: 400 });

    const subtotal = items.reduce((s: number, i: any) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0);
    const service_fee = order_type === 'room_service' ? ROOM_SERVICE_FEE : 0;
    const delivery_fee = order_type === 'delivery' ? DELIVERY_FEE : 0;
    const total = subtotal + service_fee + delivery_fee;

    const { data, error } = await publicSupabase
      .from('food_orders')
      .insert({
        order_type,
        guest_name: guest_name.trim(),
        guest_phone: guest_phone.trim(),
        room_number: room_number.trim(),
        delivery_address: delivery_address.trim(),
        dine_in_time: dine_in_time.trim(),
        items,
        subtotal,
        service_fee,
        delivery_fee,
        total,
        notes: notes.trim(),
        host_user_id: process.env.STAY_HOST_USER_ID ?? '',
      })
      .select('id, order_number')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, id: data.id, order_number: data.order_number });
  } catch (err) {
    console.error('[stay/order]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
