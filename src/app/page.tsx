'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-surface-900 mb-4">
          HostBooks KE
        </h1>
        <p className="text-surface-600 mb-8">
          Loading your dashboard...
        </p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    </div>
  );
}
