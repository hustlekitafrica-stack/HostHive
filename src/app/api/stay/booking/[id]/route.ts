import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publicSupabase } from '@/lib/supabase/public';
import {
  sendSmsBulk,
  buildGuestAcceptedSms,
  buildGuestDeclinedSms,
  buildAdminConfirmedSms,
} from '@/lib/sms';

/** PATCH /api/stay/booking/[id] — host accepts or declines a booking request */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { status, notes, decline_reason, payment_link } = await req.json();
    if (!['confirmed', 'declined', 'cancelled', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (notes !== undefined) updates.special_requests = notes;
    if (decline_reason !== undefined) updates.decline_reason = decline_reason;

    const { data, error } = await publicSupabase
      .from('booking_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // ── Automated SMS ────────────────────────────────────────────────────────
    const req2       = data as any;
    const rooms      = Array.isArray(req2.room_details) ? req2.room_details : [];
    const propName   = rooms[0]?.property_name ?? 'Kogelo Suites';
    const adminPhone = process.env.ADMIN_PHONE ?? '';

    if (status === 'confirmed') {
      const messages = [
        {
          to:      req2.guest_phone,
          message: buildGuestAcceptedSms({
            guestName:    req2.guest_name,
            propertyName: propName,
            checkIn:      req2.check_in,
            checkOut:     req2.check_out,
            total:        Number(req2.total_amount),
            paymentLink:  payment_link,
          }),
        },
        ...(adminPhone ? [{
          to:      adminPhone,
          message: buildAdminConfirmedSms({
            guestName:    req2.guest_name,
            guestPhone:   req2.guest_phone,
            propertyName: propName,
            checkIn:      req2.check_in,
            checkOut:     req2.check_out,
            amount:       Number(req2.total_amount),
            ref:          req2.id,
          }),
        }] : []),
      ];
      sendSmsBulk(messages).catch(err => console.error('[SMS accept]', err));
    }

    if (status === 'declined') {
      sendSmsBulk([{
        to:      req2.guest_phone,
        message: buildGuestDeclinedSms({
          guestName:    req2.guest_name,
          propertyName: propName,
          checkIn:      req2.check_in,
          checkOut:     req2.check_out,
          reason:       decline_reason,
          adminPhone:   adminPhone || undefined,
        }),
      }]).catch(err => console.error('[SMS decline]', err));
    }
    // ────────────────────────────────────────────────────────────────────────

    return NextResponse.json({ booking: data });
  } catch (err) {
    console.error('[PATCH /api/stay/booking/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
