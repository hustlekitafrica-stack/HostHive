import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phone, email } = await request.json();

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hostbooks.ke';

    if (!accountSid || !authToken || !fromNumber) {
      console.log(`[WhatsApp] Trial expired — ${email} (${phone}). Twilio not configured.`);
      return NextResponse.json({ ok: true, note: 'WhatsApp not configured' });
    }

    if (!phone) {
      return NextResponse.json({ ok: false, error: 'No phone number provided' }, { status: 400 });
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+254${phone.replace(/^0/, '')}`;

    const body = [
      `Hello! 👋 Your HostBooks KE 14-day free trial has expired.`,
      ``,
      `To continue managing your properties without interruption, please upgrade your plan:`,
      ``,
      `💳 *KES 15,000* — Lifetime Access (pay once, use forever)`,
      `📅 *KES 500/month* — Flexible monthly plan`,
      ``,
      `👉 Upgrade now: ${appUrl}/upgrade`,
      ``,
      `All payments are made securely via M-Pesa.`,
      `Thank you for using HostBooks KE! 🏠`,
    ].join('\n');

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: `whatsapp:${formattedPhone}`,
          Body: body,
        }).toString(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp] Twilio error:', data);
      return NextResponse.json({ ok: false, error: data.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sid: data.sid });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[WhatsApp] Error:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
