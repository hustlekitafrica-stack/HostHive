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
    const OLD_PRIMARY = '#1e293b';
    const OLD_SECONDARY = '#16a34a';
    const NEW_PRIMARY = '#1e1245';
    const NEW_SECONDARY = '#ec4899';

    const applyBrand = () => {
      let primary = localStorage.getItem('brand_primary') || NEW_PRIMARY;
      let secondary = localStorage.getItem('brand_secondary') || NEW_SECONDARY;
      if (primary === OLD_PRIMARY) { primary = NEW_PRIMARY; localStorage.setItem('brand_primary', NEW_PRIMARY); }
      if (secondary === OLD_SECONDARY) { secondary = NEW_SECONDARY; localStorage.setItem('brand_secondary', NEW_SECONDARY); }
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
