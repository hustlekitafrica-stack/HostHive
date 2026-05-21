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
        const req2 = data as any;
        const rooms = Array.isArray(req2.room_details) ? req2.room_details : [];
        // Upsert guest
        let guestId: string | null = null;
        const { data: existingGuest } = await publicSupabase
          .from('guests').select('id').eq('user_id', hostId)
          .ilike('name', (req2.guest_name ?? '').trim()).maybeSingle();
        if (existingGuest) {
          guestId = existingGuest.id;
          await publicSupabase.from('guests').update({ phone: req2.guest_phone, email: req2.guest_email }).eq('id', guestId);
        } else {
          const { data: ng } = await publicSupabase.from('guests')
            .insert({ user_id: hostId, name: (req2.guest_name ?? '').trim(), phone: req2.guest_phone ?? '', email: req2.guest_email ?? '' })
            .select('id').single();
          if (ng) guestId = ng.id;
        }
        // Create one booking per room line
        for (const room of rooms) {
          if (!room.property_id) continue;
          const nights = req2.nights || Math.round((new Date(req2.check_out).getTime() - new Date(req2.check_in).getTime()) / 86400000);
          const totalAmt = Number(room.subtotal) || 0;
          const { data: bk } = await publicSupabase.from('bookings').insert({
            user_id: hostId, property_id: room.property_id, guest_id: guestId,
            check_in: req2.check_in, check_out: req2.check_out, nights,
            nightly_rate: Number(room.nightly_rate) || 0, cleaning_fee: 0,
            security_deposit: 0, total_amount: totalAmt, amount_paid: 0,
            balance_due: totalAmt, payment_status: 'unpaid', status: 'confirmed',
            booking_source: 'Online', notes: req2.special_requests || '',
          }).select('id').single();
          if (bk) {
            const bdRow = { property_id: room.property_id, user_id: hostId, start_date: req2.check_in, end_date: req2.check_out, reason: 'Online Booking', booking_id: bk.id };
            const { error: bdErr } = await publicSupabase.from('blocked_dates').insert(bdRow);
            if (bdErr) await publicSupabase.from('blocked_dates').insert({ ...bdRow, booking_id: undefined });
          }
        }
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
