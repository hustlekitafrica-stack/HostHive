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
    // Single-tenant: STAY_HOST_USER_ID in env is sufficient; fall back to session
    if (!process.env.STAY_HOST_USER_ID) {
      const supabase = await createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // ── Auto-create booking + guest when confirmed ────────────────────────────
    if (status === 'confirmed') {
      const hostId = process.env.STAY_HOST_USER_ID;
      if (hostId) {
        // Use publicSupabase (service_role key) so RLS is bypassed server-side.
        // createClient() requires an active browser session which may not exist
        // when STAY_HOST_USER_ID is set and session check is skipped.
        const bReq = data as any;
        const bRooms = Array.isArray(bReq.room_details) ? bReq.room_details : [];

        // Upsert guest
        let guestId: string | null = null;
        const { data: existingGuest, error: egErr } = await publicSupabase
          .from('guests').select('id').eq('user_id', hostId)
          .ilike('name', (bReq.guest_name ?? '').trim()).maybeSingle();
        if (egErr) console.error('[auto-booking] guest lookup:', egErr.message);

        if (existingGuest) {
          guestId = existingGuest.id;
          await publicSupabase.from('guests')
            .update({ phone: bReq.guest_phone, email: bReq.guest_email })
            .eq('id', guestId);
        } else {
          const { data: ng, error: ngErr } = await publicSupabase.from('guests')
            .insert({ user_id: hostId, name: (bReq.guest_name ?? '').trim(), phone: bReq.guest_phone ?? '', email: bReq.guest_email ?? '' })
            .select('id').single();
          if (ngErr) console.error('[auto-booking] guest insert:', ngErr.message);
          if (ng) guestId = ng.id;
        }

        // Create one booking per room line
        for (const room of bRooms) {
          if (!room.property_id || !guestId) {
            console.error('[auto-booking] skipping room — no property_id or guestId', { property_id: room.property_id, guestId });
            continue;
          }
          const bNights = bReq.nights || Math.round((new Date(bReq.check_out).getTime() - new Date(bReq.check_in).getTime()) / 86400000);
          const totalAmt = Number(room.subtotal) || 0;
          const { error: bkErr } = await publicSupabase.from('bookings').insert({
            user_id: hostId, property_id: room.property_id, guest_id: guestId,
            check_in: bReq.check_in, check_out: bReq.check_out, nights: bNights,
            nightly_rate: Number(room.nightly_rate) || 0, cleaning_fee: 0,
            security_deposit: 0, total_amount: totalAmt, amount_paid: 0,
            balance_due: totalAmt, payment_status: 'unpaid', status: 'confirmed',
            booking_source: 'Online', notes: bReq.special_requests || '',
          });
          if (bkErr) console.error('[auto-booking] booking insert:', bkErr.message);
          else console.log('[auto-booking] booking created for property', room.property_id);
        }
      } else {
        console.warn('[auto-booking] STAY_HOST_USER_ID not set — skipping auto-booking');
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

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
