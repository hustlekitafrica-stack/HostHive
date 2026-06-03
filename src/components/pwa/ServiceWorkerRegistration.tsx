'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    const suppressInstallPrompt = (e: Event) => { e.preventDefault(); };
    window.addEventListener('beforeinstallprompt', suppressInstallPrompt);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('Service worker registration failed:', error);
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', suppressInstallPrompt);
    };
  }, []);

  return null;
}
