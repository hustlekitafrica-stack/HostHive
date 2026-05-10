import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    const body = await request.json();
    const {
      guest_name,
      guest_phone,
      guest_email,
      property_id,
      check_in,
      check_out,
      nightly_rate,
      cleaning_fee,
      extra_fees,
      security_deposit,
      booking_source,
      notes,
      status,
      payment_intent,
      payments = [],
    } = body;

    // Fetch existing booking to get current values
    const { data: existing, error: fetchErr } = await supabase
      .from('bookings')
      .select('guest_id, check_in, check_out, nightly_rate, cleaning_fee, nights, total_amount, amount_paid, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (fetchErr || !existing) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    // Resolve final values (fall back to existing)
    const ci = check_in ?? existing.check_in;
    const co = check_out ?? existing.check_out;
    const resolvedNights = Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000);
    const resolvedRate = nightly_rate !== undefined ? Number(nightly_rate) : Number(existing.nightly_rate);
    const resolvedClean = cleaning_fee !== undefined ? Number(cleaning_fee) : Number(existing.cleaning_fee ?? 0);
    const resolvedExtra = extra_fees !== undefined ? Number(extra_fees) : 0;
    const resolvedTotal = resolvedRate * resolvedNights + resolvedClean + resolvedExtra;

    // New payment amounts from edit
    const newPaid = payment_intent !== undefined && payment_intent !== 'none'
      ? (payments as {amount:number}[]).reduce((s, p) => s + (Number(p.amount) || 0), 0)
      : 0;
    const totalPaid = Number(existing.amount_paid ?? 0) + newPaid;

    const updates: Record<string, unknown> = {
      check_in: ci,
      check_out: co,
      nights: resolvedNights,
      nightly_rate: resolvedRate,
      cleaning_fee: resolvedClean,
      total_amount: resolvedTotal,
      amount_paid: totalPaid,
      balance_due: Math.max(0, resolvedTotal - totalPaid),
      payment_status: totalPaid >= resolvedTotal && resolvedTotal > 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid',
    };
    if (property_id !== undefined) updates.property_id = property_id;
    if (booking_source !== undefined) updates.booking_source = booking_source;
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) updates.status = status;
    if (security_deposit !== undefined) updates.security_deposit = Number(security_deposit);

    // Update guest details if provided
    if (guest_name !== undefined && existing.guest_id) {
      await supabase
        .from('guests')
        .update({
          name: guest_name,
          ...(guest_phone !== undefined && { phone: guest_phone }),
          ...(guest_email !== undefined && { email: guest_email }),
        })
        .eq('id', existing.guest_id);
    }

    const { data: booking, error: updateErr } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 400 });

    // Sync blocked_dates
    if (booking) {
      const isNowCancelled = ['cancelled', 'no_show'].includes(booking.status ?? '');
      const wasActive = !['cancelled', 'no_show'].includes(existing.status ?? '');

      if (isNowCancelled && wasActive) {
        // Remove block — try by booking_id first, fall back to dates
        const { error: delErr } = await supabase.from('blocked_dates').delete().eq('booking_id', id);
        if (delErr) {
          await supabase.from('blocked_dates').delete()
            .eq('property_id', booking.property_id)
            .eq('user_id', userId)
            .eq('start_date', booking.check_in)
            .eq('end_date', booking.check_out);
        }
      } else if (!isNowCancelled) {
        // Update block dates if they changed
        const { error: upErr } = await supabase.from('blocked_dates')
          .update({ start_date: booking.check_in, end_date: booking.check_out, updated_at: new Date().toISOString() })
          .eq('booking_id', id);
        if (upErr) {
          // booking_id column missing — update by old dates
          await supabase.from('blocked_dates')
            .update({ start_date: booking.check_in, end_date: booking.check_out, updated_at: new Date().toISOString() })
            .eq('property_id', booking.property_id)
            .eq('user_id', userId)
            .eq('start_date', existing.check_in)
            .eq('end_date', existing.check_out);
        }
      }
    }

    // Record any new payment logs added during edit
    if (booking && payment_intent !== 'none' && (payments as {amount:number}[]).length > 0) {
      for (const pmt of payments as {amount:number; method:string; date_type:string; date:string|null; notes:string}[]) {
        const pmtAmt = Number(pmt.amount) || 0;
        if (pmtAmt <= 0) continue;
        const paidAt = pmt.date_type === 'pick' && pmt.date
          ? new Date(pmt.date).toISOString()
          : new Date().toISOString();
        await supabase.from('payment_logs').insert({
          booking_id: booking.id,
          user_id: userId,
          property_id: booking.property_id,
          amount: pmtAmt,
          currency: 'KES',
          payment_method: (pmt as {method:string}).method ?? 'cash',
          paid_at: paidAt,
        });
      }
    }

    return NextResponse.json({ booking });
  } catch (err) {
    console.error('[PATCH /api/bookings/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/bookings/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
