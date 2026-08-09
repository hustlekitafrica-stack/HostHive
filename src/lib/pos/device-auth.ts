/**
 * POS Device Authentication
 *
 * The POS terminal (pos.kogelosuites.com) is used by staff members who do NOT
 * have a Supabase auth session — only the property admin does. To solve this,
 * the admin runs a one-time "Setup Device" step which sets a signed httpOnly
 * cookie (`pos-device-token`) containing the admin's host_user_id.
 *
 * All POS API routes call `getPosAuth(request)` which:
 *   1. Checks for a live Supabase session (works when admin is on dashboard).
 *   2. Falls back to verifying the pos-device-token cookie.
 *
 * When using the device token the admin client is used (bypasses RLS).
 * All queries already filter by host_user_id explicitly, so this is safe.
 */

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SupabaseClient } from '@supabase/supabase-js';

export const POS_DEVICE_COOKIE = 'pos-device-token';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Use the service-role key as HMAC secret — never exposed to the client. */
function getSecret(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return key;
}

/**
 * Create a signed token: `<host_user_id>:<expiry_ms>:<hmac_hex>`
 * Valid for 30 days.
 */
export function signDeviceToken(host_user_id: string): string {
  const expiry = Date.now() + THIRTY_DAYS_MS;
  const payload = `${host_user_id}:${expiry}`;
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  return `${payload}:${sig}`;
}

/** Returns the host_user_id if the token is valid and unexpired, else null. */
export function verifyDeviceToken(token: string): string | null {
  const parts = token.split(':');
  if (parts.length !== 3) return null;
  const [host_user_id, expiryStr, sig] = parts;

  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry) || Date.now() > expiry) return null;

  const payload = `${host_user_id}:${expiryStr}`;
  const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');

  // Timing-safe comparison
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) {
      return null;
    }
  } catch {
    return null; // buffer length mismatch → invalid
  }

  return host_user_id;
}

export interface PosAuthContext {
  host_user_id: string;
  supabase: SupabaseClient;
}

/**
 * Resolves the POS auth context from a request.
 *
 * Priority:
 *   1. Active Supabase session (admin on dashboard).
 *   2. Verified `pos-device-token` cookie (POS tablet, staff PIN login screen).
 *
 * Returns null if neither is present / valid (caller should return 401).
 */
export async function getPosAuth(request: NextRequest): Promise<PosAuthContext | null> {
  // --- 1. Try Supabase session ---
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return { host_user_id: session.user.id, supabase };
    }
  } catch {
    // createClient can throw in Edge environments; fall through to cookie check
  }

  // --- 2. Try device cookie ---
  const token = request.cookies.get(POS_DEVICE_COOKIE)?.value;
  if (token) {
    const host_user_id = verifyDeviceToken(token);
    if (host_user_id) {
      // Admin client bypasses RLS; routes filter by host_user_id explicitly.
      return { host_user_id, supabase: createAdminClient() };
    }
  }

  return null;
}
