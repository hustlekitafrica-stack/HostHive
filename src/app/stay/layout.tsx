'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const NAV_LINKS = [
  {
    href: '/stay',
    label: 'Home',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/stay/rooms',
    label: 'Rooms',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
      </svg>
    ),
  },
  {
    href: '/stay/wishlist',
    label: 'Wishlist',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
  {
    href: 'https://restaurant.kogelosuites.com',
    label: 'Dining',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M8 7c0-2 1-4 4-4s4 2 4 4v2H8V7zM6 21h12" />
      </svg>
    ),
  },
  {
    href: '/stay/my-bookings',
    label: 'Trips',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: '/stay/profile',
    label: 'Profile',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function StayLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const isPropertyPage = /^\/stay\/rooms\/[^/]+/.test(pathname);
  const isRoomsPage    = pathname === '/stay/rooms';
  const isCheckoutPage = pathname.startsWith('/stay/checkout');
  const isCartPage     = pathname.startsWith('/stay/book/cart');
  const router    = useRouter();
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [loggedIn,   setLoggedIn]   = useState(false);
  const [userMeta,   setUserMeta]   = useState<{ name: string; avatar: string | null } | null>(null);
  const [brandLogo,  setBrandLogo]  = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
      if (data.session?.user) {
        const u = data.session.user;
        setUserMeta({
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Guest',
          avatar: u.user_metadata?.avatar_url || null,
        });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session);
      if (session?.user) {
        const u = session.user;
        setUserMeta({
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Guest',
          avatar: u.user_metadata?.avatar_url || null,
        });
      } else {
        setUserMeta(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    fetch('/api/stay/brand')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.logo_url) setBrandLogo(d.logo_url); })
      .catch(() => {});
  }, []);

  const handleNavClick = useCallback((href: string) => {
    setMenuOpen(false);
    if (href === pathname) return;
    if (href.startsWith('http')) {
      window.location.href = href;
      return;
    }
    setLoading(true);
    router.push(href);
    setTimeout(() => setLoading(false), 3000);
  }, [router, pathname]);

  return (
    <div className="w-full min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-sans), Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* ── Top Navigation ── */}
      {!isPropertyPage && <header className="fixed top-0 left-0 right-0 z-50" style={{ background: '#1e293b' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* LEFT: back button (mobile rooms) + logo */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {isRoomsPage && (
              <button className="md:hidden p-2 -ml-2 rounded-lg" onClick={() => router.back()} aria-label="Go back">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
            )}
            <Link href="/stay" className="flex items-center gap-2 flex-shrink-0">
              {brandLogo ? (
                <img src={brandLogo} alt="Logo" className="h-8 w-auto max-w-[120px] object-contain" />
              ) : (
                <span className="font-black text-lg tracking-tight text-white">Kogelo Suites</span>
              )}
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {NAV_LINKS.filter(l => l.label !== 'Profile' && !((l.label === 'Trips') && !loggedIn)).map(l => (
              <button key={l.href} onClick={() => handleNavClick(l.href)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors border ${
                  pathname === l.href
                    ? 'text-white border-white'
                    : 'text-white/80 border-transparent hover:text-white hover:bg-white/10'
                }`}>
                {l.label}
              </button>
            ))}
          </nav>

          {/* Auth buttons / user avatar (desktop) + hamburger (mobile always) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {loggedIn && userMeta ? (
              <Link href="/stay/profile"
                className="hidden md:flex items-center justify-center w-9 h-9 rounded-full overflow-hidden border-2 border-white/30 hover:border-white transition-all flex-shrink-0"
                title={`${userMeta.name} — View Profile`}>
                {userMeta.avatar ? (
                  <img src={userMeta.avatar} alt={userMeta.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-black text-white" style={{ background: '#16a34a' }}>
                    {userMeta.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
            ) : (
              <>
                <Link href="/stay/auth"
                  className="hidden md:inline-flex items-center px-4 py-1.5 rounded text-sm font-semibold text-white border border-white/40 hover:bg-white/10 transition-colors">
                  Register
                </Link>
                <Link href="/stay/auth"
                  className="hidden md:inline-flex items-center px-4 py-1.5 rounded text-sm font-semibold text-[#1e293b] bg-white hover:bg-gray-100 transition-colors">
                  Sign in
                </Link>
              </>
            )}
            {/* Mobile hamburger — hidden on rooms page (back button moved to left) */}
            {!isRoomsPage && (
              <button className="md:hidden p-2 rounded-lg" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  {menuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>}
                </svg>
              </button>
            )}
          </div>
        </div>

      </header>}

      {/* ── Mobile full-page menu overlay ── */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col" style={{ background: '#0f172a' }}>
          {/* Top bar with close */}
          <div className="flex items-center justify-between px-5 h-14 border-b border-white/10" style={{ background: '#1e293b' }}>
            <span className="font-black text-white text-lg">Kogelo Suites</span>
            <button onClick={() => setMenuOpen(false)} className="p-2 text-white/70 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">

            {/* Auth */}
            {!loggedIn ? (
              <div className="flex gap-3">
                <button onClick={() => handleNavClick('/stay/auth')}
                  className="flex-1 text-center py-3 rounded-xl text-sm font-bold text-white border border-white/30">
                  Register
                </button>
                <button onClick={() => handleNavClick('/stay/auth')}
                  className="flex-1 text-center py-3 rounded-xl text-sm font-bold text-[#0f172a] bg-white">
                  Sign in
                </button>
              </div>
            ) : userMeta && (
              <div className="flex items-center gap-3 py-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-black text-white flex-shrink-0" style={{ background: '#16a34a' }}>
                  {userMeta.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-white/50 font-semibold">Welcome back</p>
                  <p className="text-white font-bold truncate max-w-[200px]">{userMeta.name}</p>
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Quick Links</p>
              <ul className="space-y-1">
                {[
                  { href: '/stay/rooms',        label: 'Browse Rooms' },
                  { href: 'https://restaurant.kogelosuites.com', label: 'Restaurant & Dining' },
                  { href: '/stay/rooms',         label: 'Make a Booking' },
                  { href: '/stay/reviews/new',   label: 'Write a Review' },
                  ...(loggedIn ? [
                    { href: '/stay/my-bookings', label: 'My Trips' },
                    { href: '/stay/profile',     label: 'My Profile' },
                  ] : []),
                ].map((l, i) => (
                  <li key={`${l.href}-${i}`}>
                    <button onClick={() => handleNavClick(l.href)}
                      className="w-full flex items-center gap-3 py-3 border-b border-white/5 text-white/80 hover:text-white transition-colors text-base font-semibold">
                      <svg className="w-4 h-4 flex-shrink-0 text-[#16a34a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Contact Us</p>
              <ul className="space-y-4 text-white/70 text-sm">
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#16a34a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  0726 566 795
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0 text-[#16a34a]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Milimani, Museum Road, Kisumu, Kenya
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom branding */}
          <div className="px-6 py-4 border-t border-white/10">
            <p className="text-xs text-white/30 text-center">© Kogelo Suites. All rights reserved.</p>
          </div>
        </div>
      )}

      {/* ── Page content ── */}
      <main className={`w-full flex-1${isPropertyPage ? '' : ' pt-14'}`} style={{ overflowX: 'clip' }}>
        {children}
      </main>

      {/* ── Wave loading overlay ── */}
      {loading && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center" style={{ background: 'rgba(15,23,42,0.85)' }}>
          <div className="flex items-end gap-3 mb-4">
            <span className="w-4 h-4 rounded-full bg-[#16a34a] dot-wave" />
            <span className="w-4 h-4 rounded-full bg-[#16a34a] dot-wave dot-wave-2" />
            <span className="w-4 h-4 rounded-full bg-[#16a34a] dot-wave dot-wave-3" />
          </div>
          <p className="text-white/60 text-sm font-medium tracking-wide">Loading…</p>
        </div>
      )}

      {/* ── Mobile sticky bottom nav ── */}
      {!isPropertyPage && !isRoomsPage && !isCheckoutPage && !isCartPage && <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 flex items-stretch" style={{ background: '#1e293b' }}>
        {NAV_LINKS.filter(l => {
          if (l.label === 'Rooms') return false;
          if (l.label === 'Trips' && !loggedIn) return false;
          return true;
        }).map(l => {
          const active = !l.href.startsWith('http') && pathname === l.href;
          return (
            <button key={l.href} onClick={() => handleNavClick(l.href)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                active ? 'text-[#16a34a]' : 'text-white/50 hover:text-white'
              }`}>
              {l.icon}
              <span className="text-[10px] font-semibold">{l.label}</span>
            </button>
          );
        })}
      </nav>}

      {/* ── Footer (desktop only) ── */}
      <footer className="hidden md:block text-white" style={{ background: '#0f172a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#16a34a' }}>
                <span className="text-white font-black text-sm">K</span>
              </div>
              <span className="font-black text-xl tracking-tight">KOGELO</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Experience authentic Kenyan hospitality. 40 thoughtfully designed units with a restaurant, swimming pool, and more.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-300 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { href: '/stay/rooms',        label: 'Browse Rooms' },
                { href: 'https://restaurant.kogelosuites.com', label: 'Restaurant & Dining' },
                { href: '/stay/book',         label: 'Make a Booking' },
                { href: '/stay/reviews/new',  label: 'Write a Review' },
                ...(loggedIn ? [
                  { href: '/stay/my-bookings', label: 'Trips' },
                  { href: '/stay/profile',     label: 'Profile' },
                ] : []),
              ].map(l => (
                <li key={l.href}>
                  {l.href.startsWith('http') ? (
                    <a href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">{l.label}</a>
                  ) : (
                    <Link href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-300 mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                0726 566 795
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Milimani, Museum Road, Kisumu, Kenya
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-600">  Kogelo. All rights reserved.</p>
            <p className="text-xs text-gray-600">Kogelo Suites &mdash; Milimani, Museum Road, Kisumu, Kenya</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
