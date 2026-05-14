'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function StayLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === '/stay';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '/stay',             label: 'Home' },
    { href: '/stay/rooms',       label: 'Rooms' },
    { href: '/stay/dining',      label: 'Dining' },
    { href: '/stay/my-bookings', label: 'My Bookings' },
  ];

  const transparent = isHome && !scrolled;

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-sans), Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* ── Navigation ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          transparent ? 'bg-transparent' : 'bg-white shadow-sm border-b border-gray-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/stay" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#9B1C1C' }}>
              <span className="text-white font-black text-sm">K</span>
            </div>
            <span className={`font-black text-xl tracking-tight transition-colors ${transparent ? 'text-white' : 'text-gray-900'}`}>
              KOGELO
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  pathname === l.href
                    ? transparent ? 'text-white bg-white/20' : 'text-[#9B1C1C] bg-red-50'
                    : transparent ? 'text-white/90 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* CTA + mobile menu */}
          <div className="flex items-center gap-3">
            <Link
              href="/stay/book"
              className="hidden md:inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: '#9B1C1C' }}
            >
              Book Now
            </Link>
            <button
              className="md:hidden p-2 rounded-lg"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle menu"
            >
              <svg className={`w-6 h-6 ${transparent ? 'text-white' : 'text-gray-900'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-6 py-4 text-sm font-semibold border-b border-gray-50 ${pathname === l.href ? 'text-[#9B1C1C]' : 'text-gray-700'}`}
              >
                {l.label}
              </Link>
            ))}
            <div className="p-4">
              <Link
                href="/stay/book"
                onClick={() => setMenuOpen(false)}
                className="block text-center py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: '#9B1C1C' }}
              >
                Book Now
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="text-white" style={{ background: '#1A0800' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#9B1C1C' }}>
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
                { href: '/stay/rooms',       label: 'Browse Rooms' },
                { href: '/stay/dining',      label: 'Restaurant & Dining' },
                { href: '/stay/book',        label: 'Make a Booking' },
                { href: '/stay/my-bookings', label: 'My Bookings' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-gray-400 hover:text-white transition-colors">{l.label}</Link>
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
                Kenya
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-600">© {new Date().getFullYear()} Kogelo. All rights reserved.</p>
            <p className="text-xs text-gray-600">Kogelo Suites &mdash; Kogelo, Kenya</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
