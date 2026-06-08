import { NextRequest, NextResponse } from 'next/server';
import { publicSupabase } from '@/lib/supabase/public';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone   = searchParams.get('phone')?.trim();
  const userId  = searchParams.get('userId')?.trim();

  if (!phone && !userId) {
    return NextResponse.json({ error: 'phone or userId required' }, { status: 400 });
  }

  let query = publicSupabase
    .from('booking_requests')
    .select('id, created_at, guest_name, guest_phone, guest_email, check_in, check_out, nights, num_adults, num_children, room_details, total_amount, special_requests, status, updated_at')
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('guest_user_id', userId);
  } else if (phone) {
    query = query.eq('guest_phone', phone);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ bookings: data ?? [] });
}
