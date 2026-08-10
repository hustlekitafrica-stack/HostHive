'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PosInventoryRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/pos/inventory'); }, [router]);
  return null;
}
