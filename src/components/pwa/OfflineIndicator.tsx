'use client';

import { useEffect, useState } from 'react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-100 border-b-2 border-yellow-400 px-4 py-3 z-50">
      <div className="flex items-center gap-3 max-w-7xl mx-auto">
        <span className="text-xl">📡</span>
        <div>
          <p className="font-semibold text-yellow-900">You are offline</p>
          <p className="text-sm text-yellow-800">
            Some features may be limited. Changes will sync when you're back online.
          </p>
        </div>
      </div>
    </div>
  );
}
