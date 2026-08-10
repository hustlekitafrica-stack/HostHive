'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PosStaffRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/pos/staff'); }, [router]);
  return null;
}
