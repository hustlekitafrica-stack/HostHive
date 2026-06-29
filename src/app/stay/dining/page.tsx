'use client';

import { useEffect } from 'react';

const RESTAURANT_URL = process.env.NEXT_PUBLIC_RESTAURANT_DOMAIN
  ? ('https://' + process.env.NEXT_PUBLIC_RESTAURANT_DOMAIN)
  : 'https://restaurant.kogelosuites.com';

export default function DiningRedirect() {
  useEffect(() => {
    window.location.replace(RESTAURANT_URL);
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
      <p className="text-white/60 text-sm">Redirecting to Kogelo Restaurant\u2026</p>
    </div>
  );
}
