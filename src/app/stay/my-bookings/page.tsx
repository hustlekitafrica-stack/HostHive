'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, Clock, XCircle, BedDouble, Calendar, Phone, Search, ChevronRight } from 'lucide-react';

type BookingRequest = {
  id: string; created_at: string; guest_name: string; guest_phone: string;
  check_in: string; check_out: string; nights: number; num_adults: number;
  room_details: { property_name: string; qty: number; nightly_rate: number; subtotal: number }[];
  total_amount: number; special_requests: string; status: string; updated_at: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: typeof Clock }> = {
  pending:   { label: 'Pending Review',  color: 'bg-amber-50 text-amber-700 border-amber-200',  Icon: Clock },
  confirmed: { label: 'Confirmed',       color: 'bg-green-50 text-green-700 border-green-200',  Icon: CheckCircle2 },
  declined:  { label: 'Declined',        color: 'bg-red-50 text-red-700 border-red-200',        Icon: XCircle },
  cancelled: { label: 'Cancelled',       color: 'bg-gray-100 text-gray-500 border-gray-200',    Icon: XCircle },
};

function MyBookingsContent() {
  const [bookings,    setBookings]    = useState<BookingRequest[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userId,      setUserId]      = useState<string | null>(null);
  const [phone,       setPhone]       = useState('');
  const [searched,    setSearched]    = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        loadBookings({ userId: data.user.id });
      }
      setAuthChecked(true);
    });
  }, []);

  const loadBookings = async ({ userId, phone: ph }: { userId?: string; phone?: string }) => {
    setLoading(true); setError('');
    const qs = userId ? `userId=${userId}` : `phone=${encodeURIComponent(ph ?? '')}`;
    const res = await fetch(`/api/stay/my-bookings?${qs}`);
    const data = await res.json();
    if (data.error) setError(data.error);
    else setBookings(data.bookings ?? []);
    setLoading(false); setSearched(true);
  };

  const handlePhoneSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) { setError('Please enter your phone number.'); return; }
    loadBookings({ phone: phone.trim() });
  };

  if (!authChecked) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="animate-spin w-10 h-10 border-2 rounded-full" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-5 sm:pt-16 pb-24">
      {/* Header */}
      <div className="px-4 sm:px-6 mb-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/stay" className="inline-flex items-center text-gray-400 hover:text-gray-700 transition-colors mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </Link>
          <h1 className="text-2xl font-black text-gray-900">Trips</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track the status of your reservation requests.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">

        {/* Phone lookup (for guests not logged in) */}
        {!userId && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-black text-gray-900 mb-1">Find your bookings</h2>
            <p className="text-sm text-gray-500 mb-4">Enter the phone number you used when booking.</p>
            <form onSubmit={handlePhoneSearch} className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07XX XXX XXX" type="tel"
                  className="flex-1 text-sm outline-none text-gray-900 font-semibold placeholder:font-normal" />
              </div>
              <button type="submit" disabled={loading}
                className="px-5 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50"
                style={{ background: '#16a34a' }}>
                <Search className="w-4 h-4" />{loading ? 'Searching…' : 'Search'}
              </button>
            </form>
            {error && <p className="mt-2 text-xs text-red-600 font-semibold">{error}</p>}
            <p className="mt-4 text-xs text-gray-400">
              Have an account?{' '}
              <Link href="/login?redirect=/stay/my-bookings" className="font-bold hover:underline" style={{ color: '#16a34a' }}>
                Sign in
              </Link>{' '}to see all your bookings automatically.
            </p>
          </div>
        )}

        {/* Error for logged-in */}
        {userId && error && <p className="text-sm text-red-600 font-semibold px-1">{error}</p>}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1,2].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
          </div>
        )}

        {/* No results */}
        {!loading && searched && bookings.length === 0 && (
          <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm">
            <BedDouble className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-black text-gray-900 mb-1">No bookings found</h3>
            <p className="text-sm text-gray-400 mb-5">
              {userId ? "You haven't made any reservation requests yet." : "No bookings found for that phone number."}
            </p>
            <Link href="/stay/rooms" className="text-sm font-bold text-white px-6 py-3 rounded-xl inline-block" style={{ background: '#16a34a' }}>
              Browse Rooms
            </Link>
          </div>
        )}

        {/* Bookings list */}
        {!loading && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map(b => {
              const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending;
              const StatusIcon = cfg.Icon;
              const rooms = Array.isArray(b.room_details) ? b.room_details : [];
              return (
                <div key={b.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Status bar */}
                  <div className={`flex items-center gap-2 px-5 py-3 border-b text-xs font-bold ${cfg.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    {cfg.label}
                    {b.status === 'pending' && <span className="ml-auto text-xs font-normal opacity-70">We'll call you within 2 hours</span>}
                    {b.status === 'confirmed' && <span className="ml-auto text-xs font-normal opacity-70">Your room is reserved 🎉</span>}
                  </div>
                  <div className="p-5 space-y-3">
                    {/* Rooms */}
                    <div className="space-y-1">
                      {rooms.length > 0 ? rooms.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <BedDouble className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          {r.qty > 1 ? `${r.qty}× ` : ''}{r.property_name}
                        </div>
                      )) : (
                        <p className="text-sm text-gray-500">Room details unavailable</p>
                      )}
                    </div>
                    {/* Dates */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{b.check_in} → {b.check_out}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{b.nights} night{b.nights !== 1 ? 's' : ''}</span>
                    </div>
                    {/* Total + ref */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-400">Ref: {b.id.slice(0,8).toUpperCase()}</span>
                      <span className="font-black text-gray-900">KSh {Number(b.total_amount).toLocaleString()}</span>
                    </div>
                    {/* Special requests */}
                    {b.special_requests && (
                      <p className="text-xs text-gray-400 italic">"{b.special_requests}"</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f8fafc]"><div className="animate-spin w-10 h-10 border-2 rounded-full" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} /></div>}>
      <MyBookingsContent />
    </Suspense>
  );
}
