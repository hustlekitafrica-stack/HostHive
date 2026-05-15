'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { BedDouble, Users, ArrowRight } from 'lucide-react';

function BookingTypeContent() {
  const params = useSearchParams();
  const qs = params.toString() ? `?${params.toString()}` : '';

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-16">
      <div className="py-14 px-4 sm:px-6 text-center" style={{ background: 'linear-gradient(160deg, #0f172a, #0f172a)' }}>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">Book Your Stay</h1>
        <p className="text-white/60 text-base">How many rooms do you need?</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-5">

        <Link href={`/stay/book/single${qs}`}
          className="group flex items-center gap-6 bg-white rounded-3xl p-7 border-2 border-transparent hover:border-red-800 shadow-sm hover:shadow-xl transition-all duration-300">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#f0fdf4' }}>
            <BedDouble className="w-8 h-8" style={{ color: '#16a34a' }} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-gray-900 mb-1">Single Room</h2>
            <p className="text-sm text-gray-500 leading-snug">Perfect for individuals, couples, or families booking one room for their stay.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-red-800 group-hover:translate-x-1 transition-all flex-shrink-0" />
        </Link>

        <Link href={`/stay/book/group${qs}`}
          className="group flex items-center gap-6 bg-white rounded-3xl p-7 border-2 border-transparent hover:border-red-800 shadow-sm hover:shadow-xl transition-all duration-300">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#f0fdf4' }}>
            <Users className="w-8 h-8" style={{ color: '#16a34a' }} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-gray-900 mb-1">Group Booking</h2>
            <p className="text-sm text-gray-500 leading-snug">Travelling with a group? Reserve multiple rooms across different types in one request.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-red-800 group-hover:translate-x-1 transition-all flex-shrink-0" />
        </Link>

        <p className="text-center text-xs text-gray-400 pt-2">
          All bookings are requests — our team will call you within 2 hours to confirm.
        </p>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-2 rounded-full" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} /></div>}>
      <BookingTypeContent />
    </Suspense>
  );
}
