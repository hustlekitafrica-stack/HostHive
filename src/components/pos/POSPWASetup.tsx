'use client';

import { useEffect } from 'react';

/**
 * Registers the POS service worker and sets up the PWA.
 * Renders nothing — purely a side-effect component included in the (pos) layout.
 */
export function POSPWASetup() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/pos-sw.js', { scope: '/pos' })
      .then((reg) => {
        console.log('[POS SW] registered', reg.scope);
      })
      .catch((err) => {
        // Non-fatal — the app works without the SW (online only)
        console.warn('[POS SW] registration failed', err);
      });
  }, []);

  return null;
}
