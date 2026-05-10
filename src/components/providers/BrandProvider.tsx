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
    const applyBrand = () => {
      const primary = localStorage.getItem('brand_primary') || '#1e293b';
      const secondary = localStorage.getItem('brand_secondary') || '#16a34a';
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
