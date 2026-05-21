/**
 * POST /api/stay/pesapal/order
 * Creates a Pesapal payment order and returns a hosted-checkout redirect_url.
 *
 * Required env vars:
 *   PESAPAL_CONSUMER_KEY    – from Pesapal merchant portal
 *   PESAPAL_CONSUMER_SECRET – from Pesapal merchant portal
 *   PESAPAL_ENV             – "sandbox" | "live"  (default: sandbox)
 *   PESAPAL_CALLBACK_URL    – where guest lands after payment
 *   PESAPAL_IPN_URL         – your IPN endpoint URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { publicSupabase } from '@/lib/supabase/public';

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
  if (!data.token) throw new Error(data.message ?? 'Failed to get Pesapal token');
  return data.token as string;
}

async function registerIpn(token: string): Promise<string> {
  const ipnUrl = process.env.PESAPAL_IPN_URL ?? '';
  const res = await fetch(`${BASE_URL}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ url: ipnUrl, ipn_notification_type: 'POST' }),
  });
  const data = await res.json();
  return (data.ipn_id ?? '') as string;
}

export async function POST(req: NextRequest) {
  try {
    const { booking_request_id, amount, guest_name, guest_email, guest_phone } = await req.json();

    if (!booking_request_id || !amount) {
      return NextResponse.json({ error: 'booking_request_id and amount are required' }, { status: 400 });
    }

    if (!process.env.PESAPAL_CONSUMER_KEY || !process.env.PESAPAL_CONSUMER_SECRET) {
      return NextResponse.json({ error: 'Pesapal not configured — add PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET to .env.local' }, { status: 503 });
    }

    // Get auth token
    const token = await getPesapalToken();

    // Register IPN (idempotent – Pesapal deduplicates by URL)
    const ipnId = await registerIpn(token);

    // Submit order
    const callbackUrl = process.env.PESAPAL_CALLBACK_URL ?? '';
    const nameParts   = (guest_name ?? 'Guest').trim().split(' ');
    const firstName   = nameParts[0];
    const lastName    = nameParts.slice(1).join(' ') || nameParts[0];

    const orderPayload = {
      id:               booking_request_id,
      currency:         'KES',
      amount:           Number(amount),
      description:      `Kogelo Suites booking – ${booking_request_id.slice(0, 8).toUpperCase()}`,
      callback_url:     callbackUrl,
      redirect_mode:    '',
      notification_id:  ipnId,
      billing_address: {
        email_address: guest_email ?? '',
        phone_number:  guest_phone ?? '',
        first_name:    firstName,
        last_name:     lastName,
      },
    };

    const orderRes = await fetch(`${BASE_URL}/api/Transactions/SubmitOrderRequest`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify(orderPayload),
    });
    const orderData = await orderRes.json();

    if (!orderData.redirect_url) {
      return NextResponse.json({ error: orderData.message ?? 'Pesapal order failed' }, { status: 500 });
    }

    // Persist the order_tracking_id on the booking request
    await publicSupabase
      .from('booking_requests')
      .update({ pesapal_order_id: orderData.order_tracking_id, payment_status: 'pending' })
      .eq('id', booking_request_id);

    return NextResponse.json({
      redirect_url:      orderData.redirect_url,
      order_tracking_id: orderData.order_tracking_id,
    });
  } catch (err: any) {
    console.error('[pesapal/order]', err);
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 });
  }
}
