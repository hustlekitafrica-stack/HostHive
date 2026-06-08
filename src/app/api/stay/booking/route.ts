import { NextRequest, NextResponse } from 'next/server';
import { publicSupabase } from '@/lib/supabase/public';
import { sendSmsBulk, buildGuestRequestSms, buildAdminRequestSms, normalizePhone } from '@/lib/sms';
import { fireMakeBookingWebhook } from '@/lib/makeWebhook';

export async function POST(req: NextRequest) {
  console.log('[booking] POST received');
  try {
    const body = await req.json();
    console.log('[booking] body parsed, guest_email:', body.guest_email ?? '(missing)');
    const {
      guest_name, guest_phone, guest_email = '',
      check_in, check_out, nights,
      num_adults = 1, num_children = 0,
      room_details = [],
      total_amount = 0,
      discount_total = 0,
      applied_discounts = [],
      special_requests = '',
      user_id = null,
    } = body;

    if (!guest_name?.trim()) return NextResponse.json({ error: 'Guest name is required' }, { status: 400 });
    if (!guest_phone?.trim()) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    if (!guest_email?.trim()) return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest_email.trim())) return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    if (!check_in || !check_out) return NextResponse.json({ error: 'Dates are required' }, { status: 400 });
    if (!room_details?.length) return NextResponse.json({ error: 'Please select at least one room' }, { status: 400 });

    const basePayload = {
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
    };

    let { data, error } = await publicSupabase
      .from('booking_requests')
      .insert({ ...basePayload, discount_total: Number(discount_total) || 0, applied_discounts })
      .select('id')
      .single();

    // If discount columns don't exist yet (migration pending), retry without them
    if (error?.message?.includes('applied_discounts') || error?.message?.includes('discount_total')) {
      ({ data, error } = await publicSupabase
        .from('booking_requests')
        .insert(basePayload)
        .select('id')
        .single());
    }

    if (error) {
      console.error('[booking] Supabase insert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: 'Booking could not be created.' }, { status: 500 });
    console.log('[booking] insert OK, id:', data.id, '— firing Make.com webhook');

    // ── Make.com webhook — AI-personalised emails (non-blocking) ────────────
    const firstRoom = Array.isArray(room_details) && room_details.length > 0 ? room_details[0] : null;
    const propertyName = firstRoom?.property_name ?? 'Kogelo Suites';

    fireMakeBookingWebhook({
      id:               data.id,
      guest_name:       guest_name.trim(),
      guest_email:      guest_email.trim(),
      guest_phone:      guest_phone.trim(),
      check_in,
      check_out,
      nights:           Number(nights),
      room_name:        propertyName,
      room_details:     Array.isArray(room_details) ? room_details : [],
      total_amount:     Number(total_amount),
      special_requests: special_requests.trim(),
      admin_email:      process.env.ADMIN_EMAIL ?? '',
    });
    // ────────────────────────────────────────────────────────────────────────

    // ── Automated SMS (non-blocking) ────────────────────────────────────────
    const adminPhone   = normalizePhone(process.env.ADMIN_PHONE ?? '');
    const guestE164    = normalizePhone(guest_phone.trim());

    const smsResults = await sendSmsBulk([
      {
        to:      guestE164,
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
