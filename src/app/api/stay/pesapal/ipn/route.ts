/**
 * POST /api/stay/pesapal/ipn
 * Instant Payment Notification handler.
 * Pesapal calls this after a payment is completed.
 *
 * On successful payment:
 *  1. Verify transaction status with Pesapal
 *  2. Update booking_request: status='paid', payment_status='paid'
 *  3. Upsert into guests table
 *  4. Send confirmation SMS to guest + admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { publicSupabase } from '@/lib/supabase/public';
import {
  sendSmsBulk,
  buildGuestConfirmedSms,
  buildAdminConfirmedSms,
} from '@/lib/sms';

const BASE_URL =
  process.env.PESAPAL_ENV === 'live'
    ? 'https://pay.pesapal.com/v3'
    : 'https://cybqa.pesapal.com/pesapalv3';

async function getPesapalToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      consumer_key:    process.env.PESAPAL_CONSUMER_KEY ?? '',
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET ?? '',
    }),
  });
  const data = await res.json();
  if (!data.token) throw new Error('Failed to get token');
  return data.token as string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderTrackingId: string = body.OrderTrackingId ?? body.order_tracking_id ?? '';

    if (!orderTrackingId) {
      return NextResponse.json({ orderNotificationType: 'IPNCHANGE', orderTrackingId: '', orderMerchantReference: '', status: '500' });
    }

    // Verify transaction status with Pesapal
    const token = await getPesapalToken();
    const txRes = await fetch(
      `${BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } }
    );
    const tx = await txRes.json();

    // tx.payment_status_description: "Completed" | "Failed" | "Pending" | "Invalid"
    if (tx.payment_status_description !== 'Completed') {
      return NextResponse.json({ orderNotificationType: 'IPNCHANGE', orderTrackingId, orderMerchantReference: tx.merchant_reference ?? '', status: '200' });
    }

    // Find the booking request by pesapal_order_id
    const { data: bookingReq, error: fetchErr } = await publicSupabase
      .from('booking_requests')
      .select('*')
      .eq('pesapal_order_id', orderTrackingId)
      .single();

    if (fetchErr || !bookingReq) {
      console.error('[IPN] booking request not found for tracking id', orderTrackingId);
      return NextResponse.json({ orderNotificationType: 'IPNCHANGE', orderTrackingId, orderMerchantReference: '', status: '200' });
    }

    // Already processed?
    if (bookingReq.payment_status === 'paid') {
      return NextResponse.json({ orderNotificationType: 'IPNCHANGE', orderTrackingId, orderMerchantReference: bookingReq.id, status: '200' });
    }

    // Update booking request
    await publicSupabase
      .from('booking_requests')
      .update({
        payment_status:         'paid',
        pesapal_tracking_id:    orderTrackingId,
        status:                 'confirmed',
        updated_at:             new Date().toISOString(),
      })
      .eq('id', bookingReq.id);

    // Upsert guest
    await publicSupabase.from('guests').upsert({
      user_id:   bookingReq.host_user_id,
      name:      bookingReq.guest_name,
      phone:     bookingReq.guest_phone,
      email:     bookingReq.guest_email ?? '',
      source:    'online',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'phone,user_id', ignoreDuplicates: false });

    // Send confirmation SMS
    const rooms    = Array.isArray(bookingReq.room_details) ? bookingReq.room_details : [];
    const propName = rooms[0]?.property_name ?? 'Kogelo Suites';
    const adminPhone = process.env.ADMIN_PHONE ?? '';

    await sendSmsBulk([
      {
        to:      bookingReq.guest_phone,
        message: buildGuestConfirmedSms({
          guestName:    bookingReq.guest_name,
          propertyName: propName,
          checkIn:      bookingReq.check_in,
          checkOut:     bookingReq.check_out,
          nights:       Number(bookingReq.nights),
          total:        Number(bookingReq.total_amount),
          ref:          bookingReq.id,
        }),
      },
      ...(adminPhone ? [{
        to:      adminPhone,
        message: buildAdminConfirmedSms({
          guestName:    bookingReq.guest_name,
          guestPhone:   bookingReq.guest_phone,
          propertyName: propName,
          checkIn:      bookingReq.check_in,
          checkOut:     bookingReq.check_out,
          amount:       Number(bookingReq.total_amount),
          ref:          bookingReq.id,
        }),
      }] : []),
    ]);

    // ── Auto-create receipt for the full payment ────────────────────────────
    try {
      const hostId = bookingReq.host_user_id ?? '';
      let defaultTaxLines: { label: string; rate: number }[] = [];
      if (hostId) {
        const { data: profile } = await publicSupabase
          .from('profiles')
          .select('tax_lines')
          .eq('id', hostId)
          .maybeSingle();
        defaultTaxLines = Array.isArray(profile?.tax_lines) ? profile.tax_lines : [];
      }
      const roomsForReceipt = Array.isArray(bookingReq.room_details) ? bookingReq.room_details : [];
      const subtotal = roomsForReceipt.reduce((s: number, r: any) => s + Number(r.subtotal || 0), 0)
        || Number(bookingReq.total_amount);
      const resolvedTaxLines = defaultTaxLines.map((tl) => ({
        label:  tl.label,
        rate:   Number(tl.rate) || 0,
        amount: Math.round(subtotal * (Number(tl.rate) || 0) / 100 * 100) / 100,
      }));
      const taxTotal   = resolvedTaxLines.reduce((s, tl) => s + tl.amount, 0);
      const grandTotal = subtotal + taxTotal;
      await publicSupabase.from('receipts').insert({
        host_user_id:       hostId || null,
        booking_request_id: bookingReq.id,
        guest_name:         bookingReq.guest_name,
        guest_phone:        bookingReq.guest_phone,
        guest_email:        bookingReq.guest_email ?? '',
        property_name:      propName,
        room_details:       roomsForReceipt,
        check_in:           bookingReq.check_in,
        check_out:          bookingReq.check_out,
        nights:             Number(bookingReq.nights) || null,
        subtotal,
        tax_lines:          resolvedTaxLines,
        tax_total:          taxTotal,
        grand_total:        grandTotal,
        amount_paid:        grandTotal,
        balance_due:        0,
        payment_method:     'pesapal',
        payment_reference:  orderTrackingId,
        is_partial:         false,
      });
      console.log('[pesapal/ipn] ✓ receipt auto-created for booking', bookingReq.id);
    } catch (receiptErr) {
      console.error('[pesapal/ipn] receipt auto-create failed:', receiptErr);
    }
    // ────────────────────────────────────────────────────────────────────────

    // IPN response Pesapal expects
    return NextResponse.json({
      orderNotificationType: 'IPNCHANGE',
      orderTrackingId,
      orderMerchantReference: bookingReq.id,
      status: '200',
    });
  } catch (err: any) {
    console.error('[pesapal/ipn]', err);
    return NextResponse.json({
      orderNotificationType: 'IPNCHANGE',
      orderTrackingId: '',
      orderMerchantReference: '',
      status: '500',
    });
  }
}

// Pesapal also sends GET to verify the IPN URL is reachable
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
