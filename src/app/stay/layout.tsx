'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function StayLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '/stay',             label: 'Home' },
    { href: '/stay/rooms',       label: 'Rooms' },
    { href: '/stay/dining',      label: 'Dining' },
    { href: '/stay/my-bookings', label: 'Trips' },
    { href: '/stay/profile',     label: 'Profile' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-sans), Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* ── Navigation ── */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{ background: '#1e293b' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/stay" className="flex items-center gap-2 flex-shrink-0">
            <span className="font-black text-lg tracking-tight text-white">Kogelo Suites</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors border ${
                  pathname === l.href
                    ? 'text-white border-white'
                    : 'text-white/80 border-transparent hover:text-white hover:bg-white/10'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Auth buttons + mobile menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/stay/auth"
              className="hidden md:inline-flex items-center px-4 py-1.5 rounded text-sm font-semibold text-white border border-white/40 hover:bg-white/10 transition-colors">
              Register
            </Link>
            <Link href="/stay/auth"
              className="hidden md:inline-flex items-center px-4 py-1.5 rounded text-sm font-semibold text-[#1e293b] bg-white hover:bg-gray-100 transition-colors">
              Sign in
            </Link>
            <button
              className="md:hidden p-2 rounded-lg"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/20" style={{ background: '#1e293b' }}>
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-6 py-4 text-sm font-semibold border-b border-white/10 ${
                  pathname === l.href ? 'text-white' : 'text-white/80'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="p-4 flex gap-3">
              <Link href="/stay/auth" onClick={() => setMenuOpen(false)}
                className="flex-1 text-center py-2.5 rounded text-sm font-semibold text-white border border-white/40">
                Register
              </Link>
              <Link href="/stay/auth" onClick={() => setMenuOpen(false)}
                className="flex-1 text-center py-2.5 rounded text-sm font-semibold text-[#1e293b] bg-white">
                Sign in
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
      <footer className="text-white" style={{ background: '#0f172a' }}>
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
                { href: '/stay/rooms',       label: 'Browse Rooms' },
                { href: '/stay/dining',      label: 'Restaurant & Dining' },
                { href: '/stay/book',        label: 'Make a Booking' },
                { href: '/stay/my-bookings', label: 'Trips' },
                { href: '/stay/profile',     label: 'Profile' },
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
            <p className="text-xs text-gray-600">  Kogelo. All rights reserved.</p>
            <p className="text-xs text-gray-600">Kogelo Suites &mdash; Kogelo, Kenya</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
