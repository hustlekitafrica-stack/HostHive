import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const ADMIN_DOMAIN  = process.env.NEXT_PUBLIC_ADMIN_DOMAIN  || 'admin.kogelosuites.com';
const GUEST_DOMAIN  = process.env.NEXT_PUBLIC_GUEST_DOMAIN  || 'kogelosuites.com';

export async function middleware(request: NextRequest) {
  const url      = request.nextUrl.clone();
  const hostname = request.headers.get('host') ?? '';

  const isAdmin = hostname === ADMIN_DOMAIN || hostname.startsWith('admin.');
  const isGuest = hostname === GUEST_DOMAIN || (!isAdmin && !hostname.startsWith('admin.'));

  // ── Admin subdomain ──────────────────────────────────────────────────────
  if (isAdmin) {
    // Block guest routes on admin domain
    if (url.pathname.startsWith('/stay')) {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    // Root → dashboard
    if (url.pathname === '/') {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // ── Guest domain ─────────────────────────────────────────────────────────
  if (isGuest) {
    // Block dashboard routes on guest domain
    if (
      url.pathname.startsWith('/dashboard') ||
      url.pathname.startsWith('/auth/login') ||
      url.pathname.startsWith('/auth/register') ||
      url.pathname.startsWith('/guests') ||
      url.pathname.startsWith('/properties') ||
      url.pathname.startsWith('/reports') ||
      url.pathname.startsWith('/settings') ||
      url.pathname.startsWith('/expenses') ||
      url.pathname.startsWith('/alerts') ||
      url.pathname.startsWith('/menu') ||
      url.pathname.startsWith('/requests')
    ) {
      url.pathname = '/stay';
      return NextResponse.redirect(url);
    }
    // Root → /stay
    if (url.pathname === '/') {
      url.pathname = '/stay';
      return NextResponse.redirect(url);
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
