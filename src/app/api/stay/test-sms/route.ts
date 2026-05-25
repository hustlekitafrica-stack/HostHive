import { NextRequest, NextResponse } from 'next/server';
import { sendSms } from '@/lib/sms';

/**
 * GET /api/stay/test-sms
 * Returns current SMS config status (no secrets exposed).
 *
 * POST /api/stay/test-sms  { "to": "+254XXXXXXXXX" }
 * Sends a real test SMS to the given number and returns the result.
 */

export async function GET() {
  const provider  = process.env.SMS_PROVIDER    ?? null;
  const hasApiKey = !!(process.env.SMS_API_KEY);
  const hasUser   = !!(process.env.SMS_USERNAME);
  const adminPhone = process.env.ADMIN_PHONE    ?? null;

  const configured = provider === 'africastalking' || provider === 'twilio';

  return NextResponse.json({
    configured,
    provider:    provider  ?? '⚠️  NOT SET — SMS_PROVIDER missing',
    hasApiKey:   hasApiKey  ? '✅ set' : '❌ missing SMS_API_KEY',
    hasUsername: hasUser    ? '✅ set' : '❌ missing SMS_USERNAME',
    adminPhone:  adminPhone ?? '⚠️  NOT SET — host will not receive notifications',
    hint: configured
      ? 'Config looks OK. POST to this endpoint with { "to": "+254..." } to send a real test.'
      : 'Add SMS_PROVIDER, SMS_API_KEY, SMS_USERNAME to .env.local then restart the dev server.',
  });
}

export async function POST(req: NextRequest) {
  const provider = process.env.SMS_PROVIDER ?? null;
  if (!provider) {
    return NextResponse.json({ ok: false, error: 'SMS_PROVIDER not set in .env.local' }, { status: 400 });
  }

  let to = '';
  try {
    const body = await req.json();
    to = body.to ?? '';
  } catch {
    return NextResponse.json({ ok: false, error: 'Send JSON body: { "to": "+254..." }' }, { status: 400 });
  }

  if (!to) {
    return NextResponse.json({ ok: false, error: 'Missing "to" field' }, { status: 400 });
  }

  const result = await sendSms(to, `✅ Kogelo Suites SMS test — provider: ${provider}. If you receive this, SMS is working!`);
  return NextResponse.json({ provider, to, ...result });
}
