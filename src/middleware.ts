import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { updateSession } from '@/lib/supabase/middleware';

const ADMIN_DOMAIN      = process.env.NEXT_PUBLIC_ADMIN_DOMAIN      || 'admin.kogelosuites.com';
const RESTAURANT_DOMAIN = process.env.NEXT_PUBLIC_RESTAURANT_DOMAIN || 'restaurant.kogelosuites.com';
const POS_DOMAIN        = process.env.NEXT_PUBLIC_POS_DOMAIN        || 'pos.kogelosuites.com';

const ADMIN_PATH_PREFIXES = [
  '/dashboard', '/bookings', '/bookings-enhanced', '/calendar', '/booking-calendar',
  '/guests', '/payments', '/reports', '/reports-custom', '/settings', '/expenses',
  '/expenses-enhanced', '/properties', '/unit-types', '/unit-performance', '/discounts',
  '/tax', '/alerts', '/integrations', '/menu', '/data-management', '/dashboard-analytics',
  '/balance-sheet', '/requests', '/onboarding', '/upgrade', '/auth/login', '/admin',
  // POS dashboard pages
  '/pos-reports', '/pos-inventory', '/pos-staff',
  // POS terminal routes (require Supabase session for API calls)
  '/pos',
];

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(request: NextRequest) {
  const url      = request.nextUrl.clone();
  const hostname = request.headers.get('host') ?? '';

  const isPOS        = hostname === POS_DOMAIN || hostname.startsWith('pos.');
  const isRestaurant = !isPOS && (hostname === RESTAURANT_DOMAIN || hostname.startsWith('restaurant.'));
  const isAdmin      = !isPOS && !isRestaurant && (hostname === ADMIN_DOMAIN || hostname.startsWith('admin.'));
  const isGuest      = !isPOS && !isRestaurant && !isAdmin;

  // ── POS subdomain ────────────────────────────────────────────────────────
  if (isPOS) {
    // Root → POS staff login
    if (url.pathname === '/') {
      url.pathname = '/pos';
      return NextResponse.redirect(url);
    }
    // Allow POS pages and API routes; block everything else
    const allowedOnPOS =
      url.pathname.startsWith('/pos') ||
      url.pathname.startsWith('/api/pos') ||
      url.pathname.startsWith('/_next') ||
      url.pathname.startsWith('/icons') ||
      url.pathname === '/pos-manifest.json' ||
      url.pathname === '/pos-sw.js';
    if (!allowedOnPOS) {
      url.pathname = '/pos';
      return NextResponse.redirect(url);
    }
    // Refresh Supabase session (cookies shared via .kogelosuites.com domain)
    return updateSession(request);
  }

  // ── Restaurant subdomain ─────────────────────────────────────────────────
  if (isRestaurant) {
    const rewriteUrl = url.clone();
    rewriteUrl.pathname = '/restaurant';
    return NextResponse.rewrite(rewriteUrl);
  }

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
    // Redirect /stay/dining → restaurant subdomain
    if (url.pathname === '/stay/dining' || url.pathname.startsWith('/stay/dining/')) {
      return NextResponse.redirect(`https://${RESTAURANT_DOMAIN}`);
    }
    // Block dashboard routes on guest domain
    if (
      url.pathname.startsWith('/dashboard') ||
      url.pathname.startsWith('/auth/login') ||
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

  const response = await updateSession(request);

  if (isAdminPath(url.pathname)) {
    const res = response instanceof NextResponse ? response : NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user && url.pathname !== '/auth/login') {
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }

    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
