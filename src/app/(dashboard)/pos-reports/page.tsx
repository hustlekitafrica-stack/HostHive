'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PosReportsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/pos/reports'); }, [router]);
  return null;
}
