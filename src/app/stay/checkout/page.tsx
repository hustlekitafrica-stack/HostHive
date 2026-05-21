'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { CheckCircle2, BedDouble, Droplets, Users, Calendar, Moon } from 'lucide-react';

type Property = {
  id: string; name: string; type: string; nightly_rate: number;
  breakfast_rate: number;
  bedrooms: number; bathrooms: number; max_guests: number;
  photos: string[]; location: string;
};

type AuthUser = { id: string; email: string; name: string; phone: string };

function CheckoutContent() {
  const router      = useRouter();
  const params      = useSearchParams();
  const propertyId  = params.get('propertyId') ?? '';
  const checkIn     = params.get('checkIn')    ?? '';
  const checkOut    = params.get('checkOut')   ?? '';
  const guests      = Number(params.get('guests') ?? 1);
  const rooms       = Number(params.get('rooms')  ?? 1);

  const nights = checkIn && checkOut && checkOut > checkIn
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) : 0;

  const [property,   setProperty]   = useState<Property | null>(null);
  const [authUser,   setAuthUser]   = useState<AuthUser | null>(null);
  const [authLoading,setAuthLoading]= useState(true);
  const [propLoading,setPropLoading]= useState(true);

  const [name,       setName]       = useState('');
  const [phone,      setPhone]      = useState('');
  const [email,      setEmail]      = useState('');
  const [requests,   setRequests]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [step,       setStep]       = useState<1 | 2>(1);
  const [addBreakfast,setAddBreakfast] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata ?? {};
        const u: AuthUser = {
          id:    data.user.id,
          email: data.user.email ?? '',
          name:  meta.full_name ?? meta.name ?? '',
          phone: meta.phone ?? '',
        };
        setAuthUser(u);
        setEmail(u.email);
        // Prefill name/phone from metadata; fall back to most recent booking
        if (u.name) setName(u.name);
        if (u.phone) setPhone(u.phone);
        if (!u.name || !u.phone) {
          try {
            const res = await fetch(`/api/stay/my-bookings?userId=${u.id}`);
            const d = await res.json();
            const prev = d.bookings?.[0];
            if (prev) {
              if (!u.name && prev.guest_name)  setName(prev.guest_name);
              if (!u.phone && prev.guest_phone) setPhone(prev.guest_phone);
            }
          } catch { /* ignore */ }
        }
      }
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!propertyId) { setPropLoading(false); return; }
    fetch(`/api/stay/properties/${propertyId}`)
      .then(r => r.json())
      .then(d => setProperty(d.property ?? null))
      .finally(() => setPropLoading(false));
  }, [propertyId]);

  const stayTotal      = property ? property.nightly_rate * nights * rooms : 0;
  const breakfastTotal  = addBreakfast && property?.breakfast_rate ? property.breakfast_rate * guests * nights : 0;
  const total           = stayTotal + breakfastTotal;

  const handleSubmit = async () => {
    setError('');
    if (!authUser) {
      router.push(`/stay/auth?redirect=${encodeURIComponent('/stay/checkout?' + params.toString())}`);
      return;
    }
    if (!name.trim())  { setError('Please enter your full name.'); return; }
    if (!phone.trim()) { setError('Please enter your phone number.'); return; }
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!property)     { setError('Room information not found.'); return; }
    if (nights <= 0)   { setError('Invalid dates. Please go back and select valid dates.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/stay/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name:       name.trim(),
          guest_phone:      phone.trim(),
          guest_email:      email.trim(),
          check_in:         checkIn,
          check_out:        checkOut,
          nights,
          num_adults:       guests,
          num_children:     0,
          room_details: [{
            property_id:   property.id,
            property_name: property.name,
            nightly_rate:  property.nightly_rate,
            qty:           rooms,
            nights,
            subtotal:      total,
          }],
          total_amount:     total,
          special_requests: requests.trim(),
          ...(authUser ? { user_id: authUser.id } : {}),
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setBookingRef(data.id ?? '');
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading ── */
  if (authLoading || propLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="animate-spin w-10 h-10 border-2 rounded-full" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} />
    </div>
  );

  /* ── Success ── */
  if (success) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4 pt-16">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-5">
          <CheckCircle2 className="w-16 h-16" style={{ color: '#16a34a' }} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Reservation Requested!</h2>
        {bookingRef && <p className="text-xs font-bold mb-3 font-mono" style={{ color: '#16a34a' }}>Ref: {bookingRef.slice(0, 8).toUpperCase()}</p>}
        <p className="text-gray-500 text-sm mb-6">
          We've received your request for <strong>{rooms > 1 ? `${rooms}× ` : ''}{property?.name}</strong>,{' '}
          {checkIn} → {checkOut}. Our team will call <strong>{phone}</strong> within 2 hours to confirm.
        </p>
        <div className="bg-gray-50 rounded-2xl p-4 text-left text-sm space-y-2 mb-6">
          <div className="flex justify-between text-gray-600"><span>Room</span><span className="font-semibold text-gray-900">{rooms > 1 ? `${rooms}× ` : ''}{property?.name}</span></div>
          <div className="flex justify-between text-gray-600"><span>Check-in</span><span className="font-semibold text-gray-900">{checkIn}</span></div>
          <div className="flex justify-between text-gray-600"><span>Check-out</span><span className="font-semibold text-gray-900">{checkOut}</span></div>
          <div className="flex justify-between text-gray-600"><span>Nights</span><span className="font-semibold text-gray-900">{nights}</span></div>
          <div className="border-t border-gray-200 pt-2 flex justify-between font-black text-gray-900">
            <span>Estimated Total</span><span>KSh {total.toLocaleString()}</span>
          </div>
        </div>
        <Link href="/stay/my-bookings" className="block w-full py-3 rounded-xl text-sm font-bold text-white text-center mb-3" style={{ background: '#16a34a' }}>
          Track My Booking
        </Link>
        <Link href="/stay" className="block w-full py-3 rounded-xl text-sm font-bold text-center border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
          Back to Home
        </Link>
      </div>
    </div>
  );

  return (
    <div className="bg-[#f8fafc] h-[100dvh] overflow-hidden flex flex-col lg:h-auto lg:min-h-screen lg:overflow-visible lg:pt-16 lg:pb-28">

      <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full px-4 sm:px-6 lg:py-4">
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-5 lg:gap-8 overflow-hidden">

          {/* ── Left: Guest form — always desktop, step 2 on mobile ── */}
          <div className={`lg:col-span-3 ${step === 1 ? 'hidden lg:block' : 'flex-1 flex flex-col justify-center overflow-y-auto pb-20 space-y-5'}`}>

            {/* Guest details form */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-black text-gray-900 mb-5">
                {authUser ? 'Your Details' : 'Guest Details'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Full Name <span className="text-red-500">*</span></label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe"
                    className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-800 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Phone Number <span className="text-red-500">*</span></label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07XX XXX XXX" type="tel"
                    className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-800 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email"
                    readOnly={!!authUser}
                    className={`w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none transition-colors ${authUser ? 'bg-gray-50 text-gray-500 cursor-default' : 'focus:border-red-800'}`} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Special Requests <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
                  <textarea value={requests} onChange={e => setRequests(e.target.value)} rows={3}
                    placeholder="Early check-in, specific floor, dietary requirements, accessibility needs…"
                    className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-800 transition-colors resize-none" />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 font-semibold px-1">{error}</p>}
          </div>

          {/* ── Right: Booking summary — always desktop, step 1 on mobile ── */}
          <div className={`lg:col-span-2 ${step === 2 ? 'hidden lg:block' : 'flex-1 flex items-center justify-center pb-20'}`}>
            <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden lg:sticky lg:top-24">
              <div className="p-5" style={{ background: 'linear-gradient(135deg, #0f172a, #0f172a)' }}>
                <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">Booking Summary</p>
                <h3 className="font-black text-white text-base">{property?.name ?? '—'}</h3>
                {property?.location && <p className="text-xs text-white/60 mt-0.5">{property.location}</p>}
              </div>

              {property && (
                <div className="p-5 space-y-4">
                  {/* Room specs */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{property.bedrooms} bed</span>
                    <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5" />{property.bathrooms} bath</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />up to {property.max_guests}</span>
                  </div>

                  <div className="border-t border-gray-100 pt-4 space-y-2.5 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Check-in</span>
                      <span className="font-semibold text-gray-900">{checkIn || '—'}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Check-out</span>
                      <span className="font-semibold text-gray-900">{checkOut || '—'}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span className="flex items-center gap-1.5"><Moon className="w-3.5 h-3.5" />Nights</span>
                      <span className="font-semibold text-gray-900">{nights || '—'}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Guests</span>
                      <span className="font-semibold text-gray-900">{guests}</span>
                    </div>
                    {rooms > 1 && (
                      <div className="flex justify-between text-gray-600">
                        <span className="flex items-center gap-1.5"><BedDouble className="w-3.5 h-3.5" />Rooms</span>
                        <span className="font-semibold text-gray-900">{rooms}</span>
                      </div>
                    )}
                  </div>

                  {/* B&B add-on toggle */}
                  {property.breakfast_rate > 0 && (
                    <div className="border-t border-gray-100 pt-4">
                      <label className="flex items-center justify-between cursor-pointer gap-3">
                        <div>
                          <p className="text-sm font-bold text-gray-900">🍳 Add Breakfast</p>
                          <p className="text-xs text-gray-500">KSh {property.breakfast_rate.toLocaleString()} / person / night</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAddBreakfast(v => !v)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${addBreakfast ? 'bg-amber-500' : 'bg-gray-200'}`}>
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${addBreakfast ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </label>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>KSh {property.nightly_rate.toLocaleString()} × {nights} night{nights !== 1 ? 's' : ''}{rooms > 1 ? ` × ${rooms}` : ''}</span>
                      <span>KSh {stayTotal.toLocaleString()}</span>
                    </div>
                    {addBreakfast && breakfastTotal > 0 && (
                      <div className="flex justify-between text-gray-500">
                        <span>Breakfast × {guests} guest{guests !== 1 ? 's' : ''} × {nights} night{nights !== 1 ? 's' : ''}</span>
                        <span>KSh {breakfastTotal.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-gray-900 text-base pt-1 border-t border-gray-100">
                      <span>Estimated Total</span>
                      <span>KSh {total.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-snug">Payment is settled directly at the property. No card required.</p>
                  </div>
                </div>
              )}

              {!property && !propLoading && (
                <div className="p-5 text-sm text-gray-400 text-center">Room details unavailable.</div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Sticky footer (matches room page style) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white"
        style={{ boxShadow: '0 -2px 16px rgba(0,0,0,0.10)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-gray-900">KSh {total.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-500 truncate">
              {nights} night{nights !== 1 ? 's' : ''}{property ? ` · ${property.name}` : ''}
            </p>
          </div>
          {/* Mobile step 1: go to details */}
          <button
            onClick={() => setStep(2)}
            className={`flex-shrink-0 px-6 py-3 rounded-full text-sm font-bold text-white transition-all active:scale-95 lg:hidden ${step === 2 ? 'hidden' : ''}`}
            style={{ background: '#16a34a' }}>
            Enter Details →
          </button>
          {/* Mobile step 2 + desktop: confirm */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !property}
            className={`flex-shrink-0 px-5 py-3 rounded-full text-sm font-bold text-white disabled:opacity-50 transition-all active:scale-95 ${step === 1 ? 'hidden lg:block' : ''}`}
            style={{ background: '#16a34a' }}>
            {submitting ? 'Sending…' : 'Confirm Reservation'}
          </button>
        </div>
      </div>

    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f8fafc]"><div className="animate-spin w-10 h-10 border-2 rounded-full" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
