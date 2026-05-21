'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

function CallbackContent() {
  const params           = useSearchParams();
  const trackingId       = params.get('OrderTrackingId') ?? params.get('order_tracking_id') ?? '';
  const merchantRef      = params.get('OrderMerchantReference') ?? '';
  const [status, setStatus] = useState<'checking' | 'paid' | 'pending' | 'failed'>('checking');

  useEffect(() => {
    if (!trackingId) { setStatus('failed'); return; }
    // Poll the booking request to see if IPN already confirmed it
    const poll = async () => {
      try {
        const res  = await fetch(`/api/stay/my-bookings?ref=${merchantRef}`);
        const data = await res.json();
        const req  = (data.bookings ?? [])[0];
        if (req?.payment_status === 'paid') {
          setStatus('paid');
        } else {
          setStatus('pending');
        }
      } catch {
        setStatus('pending');
      }
    };
    poll();
  }, [trackingId, merchantRef]);

  if (status === 'checking') return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="animate-spin w-10 h-10 border-2 rounded-full" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} />
    </div>
  );

  if (status === 'paid') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <CheckCircle2 className="w-16 h-16 mx-auto mb-5" style={{ color: '#16a34a' }} />
        <h2 className="text-2xl font-black text-gray-900 mb-2">Payment Confirmed!</h2>
        <p className="text-gray-500 text-sm mb-6">Your booking has been confirmed. Check your phone for an SMS with all the details.</p>
        <Link href="/stay/my-bookings" className="block w-full py-3 rounded-xl text-sm font-bold text-white text-center mb-3" style={{ background: '#16a34a' }}>
          View My Booking
        </Link>
        <Link href="/stay" className="block w-full py-3 rounded-xl text-sm font-bold text-center border-2 border-gray-200 text-gray-600 hover:bg-gray-50">
          Back to Home
        </Link>
      </div>
    </div>
  );

  if (status === 'pending') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <Clock className="w-16 h-16 mx-auto mb-5 text-amber-500" />
        <h2 className="text-2xl font-black text-gray-900 mb-2">Payment Processing</h2>
        <p className="text-gray-500 text-sm mb-6">Your payment is being verified. This may take a moment. You'll receive an SMS once confirmed.</p>
        <Link href="/stay/my-bookings" className="block w-full py-3 rounded-xl text-sm font-bold text-white text-center mb-3" style={{ background: '#16a34a' }}>
          Check My Bookings
        </Link>
        <Link href="/stay" className="block w-full py-3 rounded-xl text-sm font-bold text-center border-2 border-gray-200 text-gray-600 hover:bg-gray-50">
          Back to Home
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <XCircle className="w-16 h-16 mx-auto mb-5 text-red-500" />
        <h2 className="text-2xl font-black text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-500 text-sm mb-6">We couldn't verify your payment. Please contact us for assistance.</p>
        <Link href="/stay" className="block w-full py-3 rounded-xl text-sm font-bold text-center border-2 border-gray-200 text-gray-600 hover:bg-gray-50">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f8fafc]"><div className="animate-spin w-10 h-10 border-2 rounded-full" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} /></div>}>
      <CallbackContent />
    </Suspense>
  );
}
