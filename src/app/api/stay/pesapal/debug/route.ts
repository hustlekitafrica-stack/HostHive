/**
 * GET /api/stay/pesapal/debug
 * Diagnostic endpoint – shows which Pesapal environment is active and
 * returns the raw Pesapal token response so you can identify auth errors.
 * REMOVE THIS ROUTE once the issue is resolved.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const env    = process.env.PESAPAL_ENV ?? '(not set)';
  const key    = process.env.PESAPAL_CONSUMER_KEY ?? '';
  const secret = process.env.PESAPAL_CONSUMER_SECRET ?? '';

  const baseUrl =
    process.env.PESAPAL_ENV === 'live'
      ? 'https://pay.pesapal.com/v3'
      : 'https://cybqa.pesapal.com/pesapalv3';

  const maskedKey    = key    ? `${key.slice(0, 6)}***` : '(empty)';
  const maskedSecret = secret ? `${secret.slice(0, 4)}***` : '(empty)';

  let tokenResponse: unknown = null;
  let httpStatus: number | null = null;
  let fetchError: string | null = null;

  try {
    const res = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body:    JSON.stringify({ consumer_key: key, consumer_secret: secret }),
    });
    httpStatus = res.status;
    const text = await res.text();
    try {
      tokenResponse = JSON.parse(text);
    } catch {
      tokenResponse = text;
    }
  } catch (err: any) {
    fetchError = err.message ?? String(err);
  }

  return NextResponse.json({
    config: {
      PESAPAL_ENV:      env,
      baseUrl,
      maskedKey,
      maskedSecret,
      PESAPAL_CALLBACK_URL: process.env.PESAPAL_CALLBACK_URL ?? '(not set)',
      PESAPAL_IPN_URL:      process.env.PESAPAL_IPN_URL      ?? '(not set)',
    },
    tokenRequest: {
      httpStatus,
      fetchError,
      pesapalResponse: tokenResponse,
    },
  });
}
