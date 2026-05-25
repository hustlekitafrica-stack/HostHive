import { NextRequest, NextResponse } from 'next/server';
import { publicSupabase } from '@/lib/supabase/public';
import { sendSmsBulk, buildGuestRequestSms, buildAdminRequestSms } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      guest_name, guest_phone, guest_email = '',
      check_in, check_out, nights,
      num_adults = 1, num_children = 0,
      room_details = [],
      total_amount = 0,
      special_requests = '',
      user_id = null,
    } = body;

    if (!guest_name?.trim()) return NextResponse.json({ error: 'Guest name is required' }, { status: 400 });
    if (!guest_phone?.trim()) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    if (!check_in || !check_out) return NextResponse.json({ error: 'Dates are required' }, { status: 400 });
    if (!room_details?.length) return NextResponse.json({ error: 'Please select at least one room' }, { status: 400 });

    const { data, error } = await publicSupabase
      .from('booking_requests')
      .insert({
        guest_name: guest_name.trim(),
        guest_phone: guest_phone.trim(),
        guest_email: guest_email.trim(),
        check_in,
        check_out,
        nights,
        num_adults,
        num_children,
        room_details,
        total_amount,
        special_requests: special_requests.trim(),
        host_user_id: process.env.STAY_HOST_USER_ID ?? '',
        ...(user_id ? { guest_user_id: user_id } : {}),
      })
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // ── Automated SMS (non-blocking) ────────────────────────────────────────
    const firstRoom = Array.isArray(room_details) && room_details.length > 0 ? room_details[0] : null;
    const propertyName = firstRoom?.property_name ?? 'Kogelo Suites';
    const adminPhone   = process.env.ADMIN_PHONE ?? '';

    const smsResults = await sendSmsBulk([
      {
        to:      guest_phone.trim(),
        message: buildGuestRequestSms({
          guestName:    guest_name.trim(),
          propertyName,
          checkIn:      check_in,
          checkOut:     check_out,
          nights:       Number(nights),
          ref:          data.id,
        }),
      },
      ...(adminPhone ? [{
        to:      adminPhone,
        message: buildAdminRequestSms({
          guestName:    guest_name.trim(),
          guestPhone:   guest_phone.trim(),
          propertyName,
          checkIn:      check_in,
          checkOut:     check_out,
          nights:       Number(nights),
          total:        Number(total_amount),
        }),
      }] : []),
    ]).catch(err => { console.error('[SMS booking]', err); return []; });
    // ────────────────────────────────────────────────────────────────────────

    const smsErrors = smsResults.filter(r => !r.ok).map(r => r.error);
    if (smsErrors.length) console.error('[SMS booking errors]', smsErrors);

    return NextResponse.json({ success: true, id: data.id, sms: smsResults });
  } catch (err) {
    console.error('[stay/booking]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
