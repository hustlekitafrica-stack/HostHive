import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import { POSPWASetup } from '@/components/pos/POSPWASetup';

export const metadata: Metadata = {
  title: 'Kogelo POS',
  description: 'Point of Sale terminal — Kogelo Suites Bar & Restaurant',
  manifest: '/pos-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kogelo POS',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
};

export default function POSLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Toaster position="top-center" />
      <POSPWASetup />
      {children}
    </div>
  );
}
