'use client';

import { useEffect } from 'react';

function darkenHex(hex: string, factor: number): string {
  try {
    const clean = hex.replace('#', '');
    const r = Math.round(parseInt(clean.slice(0, 2), 16) * factor);
    const g = Math.round(parseInt(clean.slice(2, 4), 16) * factor);
    const b = Math.round(parseInt(clean.slice(4, 6), 16) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return '#0f172a';
  }
}

export function BrandProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const STALE_PRIMARIES   = ['#1e1245', '#1e1042', '#1a1035'];
    const STALE_SECONDARIES = ['#ec4899', '#db2777'];

    const applyBrand = () => {
      let primary   = localStorage.getItem('brand_primary')   || '#1e293b';
      let secondary = localStorage.getItem('brand_secondary') || '#16a34a';
      if (STALE_PRIMARIES.includes(primary))     { primary   = '#1e293b'; localStorage.setItem('brand_primary',   primary); }
      if (STALE_SECONDARIES.includes(secondary)) { secondary = '#16a34a'; localStorage.setItem('brand_secondary', secondary); }
      document.documentElement.style.setProperty('--brand-primary', primary);
      document.documentElement.style.setProperty('--brand-secondary', secondary);
      document.documentElement.style.setProperty('--brand-primary-dark', darkenHex(primary, 0.75));
    };
    applyBrand();
    window.addEventListener('brandUpdated', applyBrand);
    return () => window.removeEventListener('brandUpdated', applyBrand);
  }, []);

  return <>{children}</>;
}
