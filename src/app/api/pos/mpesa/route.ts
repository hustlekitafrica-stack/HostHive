import { NextRequest, NextResponse } from 'next/server';

// ─── Env vars (same set as /api/stay/mpesa) ──────────────────────────────────
// MPESA_CONSUMER_KEY=
// MPESA_CONSUMER_SECRET=
// MPESA_SHORTCODE=
// MPESA_PASSKEY=
// MPESA_CALLBACK_URL=
// MPESA_ENV=production   (or 'sandbox' for testing)
// ─────────────────────────────────────────────────────────────────────────────

const DARAJA_BASE =
  process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

async function getOAuthToken(): Promise<string> {
  const key    = process.env.MPESA_CONSUMER_KEY    ?? '';
  const secret = process.env.MPESA_CONSUMER_SECRET ?? '';
  const creds  = Buffer.from(`${key}:${secret}`).toString('base64');

  const res = await fetch(
    `${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${creds}` } }
  );
  if (!res.ok) throw new Error('Failed to get M-Pesa OAuth token');
  const data = await res.json();
  return data.access_token as string;
}

function getTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 14);
}

// POST /api/pos/mpesa
// Body: { phone: string; amount: number; order_number?: string }
export async function POST(req: NextRequest) {
  try {
    const { phone, amount, order_number } = await req.json();

    if (!phone || !amount) {
      return NextResponse.json({ error: 'phone and amount are required' }, { status: 400 });
    }

    const shortcode   = process.env.MPESA_SHORTCODE    ?? '';
    const passkey     = process.env.MPESA_PASSKEY      ?? '';
    const callbackUrl = process.env.MPESA_CALLBACK_URL ?? '';
    const timestamp   = getTimestamp();
    const password    = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    // Normalise phone: 07XXXXXXXX → 2547XXXXXXXX
    const normalised = phone.replace(/^0/, '254').replace(/^\+/, '');

    const token = await getOAuthToken();

    const payload = {
      BusinessShortCode: shortcode,
      Password:          password,
      Timestamp:         timestamp,
      TransactionType:   'CustomerPayBillOnline',
      Amount:            Math.ceil(amount),
      PartyA:            normalised,
      PartyB:            shortcode,
      PhoneNumber:       normalised,
      CallBackURL:       callbackUrl,
      AccountReference:  order_number ?? 'POS Order',
      TransactionDesc:   'Restaurant Payment',
    };

    const stkRes = await fetch(
      `${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`,
      {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      }
    );

    const stkData = await stkRes.json();

    if (stkData.ResponseCode !== '0') {
      return NextResponse.json(
        { error: stkData.errorMessage ?? stkData.ResponseDescription ?? 'STK Push failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success:             true,
      checkout_request_id: stkData.CheckoutRequestID,
      merchant_request_id: stkData.MerchantRequestID,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
