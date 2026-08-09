/**
 * POST /api/pos/setup-device
 *
 * Called once by the admin from the dashboard to register a POS device.
 * Requires a live Supabase session (admin must be logged in).
 * Sets a signed `pos-device-token` cookie valid for 30 days on the
 * `.kogelosuites.com` domain so it is accessible from pos.kogelosuites.com.
 *
 * DELETE /api/pos/setup-device
 * Clears the cookie (revoke device access).
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { signDeviceToken, POS_DEVICE_COOKIE } from '@/lib/pos/device-auth';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

function cookieOptions(value: string, maxAge: number) {
  return {
    name: POS_DEVICE_COOKIE,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
    // Share across all *.kogelosuites.com subdomains in production
    ...(process.env.NODE_ENV === 'production' && { domain: '.kogelosuites.com' }),
  };
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to set up a POS device.' },
        { status: 401 }
      );
    }

    const token = signDeviceToken(session.user.id);
    const response = NextResponse.json({ ok: true, message: 'POS device registered.' });
    response.cookies.set(cookieOptions(token, COOKIE_MAX_AGE));
    return response;
  } catch (err) {
    console.error('[setup-device] error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest) {
  const response = NextResponse.json({ ok: true, message: 'POS device unregistered.' });
  response.cookies.set(cookieOptions('', 0)); // clear cookie
  return response;
}
