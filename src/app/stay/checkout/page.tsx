'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { CheckCircle2, BedDouble, Droplets, Users, Calendar, Moon, Tag } from 'lucide-react';

type Property = {
  id: string; name: string; type: string; nightly_rate: number;
  breakfast_rate: number;
  bedrooms: number; bathrooms: number; max_guests: number;
  photos: string[]; location: string;
};

type AuthUser = { id: string; email: string; name: string; phone: string };

type AppliedDiscount = {
  id: string;
  name: string;
  value_type: 'percentage' | 'fixed';
  value: number;
  saving: number;
};

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
  const [confetti,   setConfetti]   = useState(false);
  const [appliedDiscounts, setAppliedDiscounts] = useState<AppliedDiscount[]>([]);
  const [discountsLoading, setDiscountsLoading] = useState(false);

  const confettiPieces = useMemo(() => {
    const colors = ['#22c55e','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#ec4899','#f97316','#06b6d4','#fbbf24','#10b981','#ff6b6b','#4ecdc4'];
    const anims  = ['cf-a','cf-b','cf-c','cf-d','cf-e','cf-f'];
    return Array.from({ length: 160 }, (_, i) => {
      const isRibbon = i % 5 === 0;
      const isCircle = i % 7 === 0;
      return {
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 3.5,
        duration: 3 + Math.random() * 3,
        w: isRibbon ? 4 : isCircle ? 9 : 7 + Math.random() * 7,
        h: isRibbon ? 18 : isCircle ? 9 : 5 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        round: isCircle ? '50%' : isRibbon ? '1px' : '2px',
        anim: anims[i % anims.length],
      };
    });
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata ?? {};
        const u: AuthUser = {
          id:    data.user.id,
          email: meta.profile_email || data.user.email || '',
          name:  meta.full_name ?? meta.name ?? '',
          phone: data.user.phone ?? meta.phone ?? '',
        };
        setAuthUser(u);
        // Prefill name/phone/email from metadata; fall back to most recent booking
        if (u.name) setName(u.name);
        if (u.phone) setPhone(u.phone);
        if (u.email) setEmail(u.email);
        if (!u.name || !u.phone || !u.email) {
          try {
            const res = await fetch(`/api/stay/my-bookings?userId=${u.id}`);
            const d = await res.json();
            const prev = d.bookings?.[0];
            if (prev) {
              if (!u.name && prev.guest_name)   setName(prev.guest_name);
              if (!u.phone && prev.guest_phone) setPhone(prev.guest_phone);
              if (!u.email && prev.guest_email) setEmail(prev.guest_email);
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

  // Fetch applicable discounts once we have property, dates, and auth user resolved
  useEffect(() => {
    if (!propertyId || !checkIn || authLoading) return;
    setDiscountsLoading(true);
    const qs = new URLSearchParams({ propertyId, checkIn });
    if (authUser?.id) qs.set('userId', authUser.id);
    fetch(`/api/stay/applicable-discounts?${qs}`)
      .then(r => r.json())
      .then(d => {
        const raw = d.discounts ?? [];
        // Compute saving per discount against stayTotal (computed inline since state not yet set)
        const base = property
          ? property.nightly_rate * nights * rooms
          : 0;
        const withSavings: AppliedDiscount[] = raw.map((disc: { id: string; name: string; value_type: 'percentage' | 'fixed'; value: number }) => ({
          id:         disc.id,
          name:       disc.name,
          value_type: disc.value_type,
          value:      disc.value,
          saving:     disc.value_type === 'percentage'
            ? Math.round(base * disc.value / 100)
            : Number(disc.value),
        }));
        setAppliedDiscounts(withSavings);
      })
      .catch(() => {})
      .finally(() => setDiscountsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, checkIn, authUser, authLoading, property]);

  const stayTotal       = property ? property.nightly_rate * nights * rooms : 0;
  const breakfastTotal  = addBreakfast && property?.breakfast_rate ? property.breakfast_rate * guests * nights : 0;
  const totalDiscount   = appliedDiscounts.reduce((sum, d) => {
    const saving = d.value_type === 'percentage'
      ? Math.round(stayTotal * d.value / 100)
      : Number(d.value);
    return sum + saving;
  }, 0);
  const total           = Math.max(0, stayTotal + breakfastTotal - totalDiscount);

  const handleSubmit = async () => {
    setError('');
    if (!authUser) {
      router.push(`/stay/auth?redirect=${encodeURIComponent('/stay/checkout?' + params.toString())}`);
      return;
    }
    if (!name.trim())  { setError('Please enter your full name.'); return; }
    if (!phone.trim()) { setError('Please enter your phone number.'); return; }
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email address.'); return; }
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
          guest_email:      email.trim() || authUser?.email || '',

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
          discount_total:   totalDiscount,
          applied_discounts: appliedDiscounts.map(d => ({ id: d.id, name: d.name, saving: d.value_type === 'percentage' ? Math.round(stayTotal * d.value / 100) : d.value })),
          special_requests: requests.trim(),
          ...(authUser ? { user_id: authUser.id } : {}),
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setBookingRef(data.id ?? '');
      // Persist the email the guest used so it pre-fills on their next booking
      try {
        const supabase = createClient();
        await supabase.auth.updateUser({ data: { profile_email: email.trim() } });
      } catch { /* non-critical */ }
      setSuccess(true);
      setConfetti(true);
      setTimeout(() => setConfetti(false), 7000);
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
      <style>{`
        @keyframes cf-a{0%{transform:translate(0,-10px) rotate(0deg);opacity:1}30%{transform:translate(-28px,30vh) rotate(130deg)}65%{transform:translate(-10px,65vh) rotate(260deg);opacity:.9}100%{transform:translate(-25px,110vh) rotate(400deg);opacity:0}}
        @keyframes cf-b{0%{transform:translate(0,-10px) rotate(0deg);opacity:1}30%{transform:translate(28px,30vh) rotate(-130deg)}65%{transform:translate(10px,65vh) rotate(-260deg);opacity:.9}100%{transform:translate(25px,110vh) rotate(-400deg);opacity:0}}
        @keyframes cf-c{0%{transform:translate(0,-10px) rotate(0deg) scaleX(1);opacity:1}25%{transform:translate(18px,25vh) rotate(90deg) scaleX(-1)}50%{transform:translate(-18px,50vh) rotate(180deg) scaleX(1)}75%{transform:translate(22px,75vh) rotate(270deg) scaleX(-1);opacity:.85}100%{transform:translate(-12px,110vh) rotate(360deg) scaleX(1);opacity:0}}
        @keyframes cf-d{0%{transform:translate(0,-10px) rotate(0deg) scaleX(1);opacity:1}25%{transform:translate(-18px,25vh) rotate(-90deg) scaleX(-1)}50%{transform:translate(18px,50vh) rotate(-180deg) scaleX(1)}75%{transform:translate(-22px,75vh) rotate(-270deg) scaleX(-1);opacity:.85}100%{transform:translate(12px,110vh) rotate(-360deg) scaleX(1);opacity:0}}
        @keyframes cf-e{0%{transform:translate(0,-10px) rotate(0deg);opacity:1}20%{transform:translate(-10px,20vh) rotate(144deg)}40%{transform:translate(12px,40vh) rotate(288deg)}60%{transform:translate(-14px,60vh) rotate(432deg);opacity:.9}80%{transform:translate(8px,80vh) rotate(576deg)}100%{transform:translate(-6px,110vh) rotate(720deg);opacity:0}}
        @keyframes cf-f{0%{transform:translate(0,-10px) rotate(0deg);opacity:1}20%{transform:translate(10px,20vh) rotate(-144deg)}40%{transform:translate(-12px,40vh) rotate(-288deg)}60%{transform:translate(14px,60vh) rotate(-432deg);opacity:.9}80%{transform:translate(-8px,80vh) rotate(-576vh)}100%{transform:translate(6px,110vh) rotate(-720deg);opacity:0}}
      `}</style>
      {confetti && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {confettiPieces.map(p => (
            <div key={p.id} style={{
              position:'absolute', left:`${p.left}%`, top:0,
              width:`${p.w}px`, height:`${p.h}px`,
              backgroundColor:p.color, borderRadius:p.round,
              animation:`${p.anim} ${p.duration}s ${p.delay}s cubic-bezier(.4,0,.6,1) both`,
            }} />
          ))}
        </div>
      )}
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
          {totalDiscount > 0 && (
            <div className="flex justify-between text-green-700 font-semibold">
              <span>Discounts applied</span><span>−KSh {totalDiscount.toLocaleString()}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2 flex justify-between font-black text-gray-900">
            <span>Estimated Total</span><span>KSh {total.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/stay/my-bookings" className="flex-1 py-3 rounded-xl text-sm font-bold text-white text-center" style={{ background: '#16a34a' }}>
            <span className="sm:hidden">Track</span>
            <span className="hidden sm:inline">Track My Booking</span>
          </Link>
          <Link href="/stay" className="flex-1 py-3 rounded-xl text-sm font-bold text-center border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            <span className="sm:hidden">Home</span>
            <span className="hidden sm:inline">Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-[#f8fafc] min-h-screen flex flex-col pt-14 pb-20">

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-4 md:py-8">
        <div className="flex flex-col md:flex-row md:items-start md:gap-8">

          {/* ── Left: Guest form — always desktop, step 2 on mobile ── */}
          <div className={`md:flex-1 ${step === 1 ? 'hidden md:block' : 'space-y-5 pb-4'}`}>

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
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Email <span className="text-red-500">*</span></label>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email"
                    className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-800 transition-colors" />
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
          <div className={`md:w-80 md:flex-shrink-0 ${step === 2 ? 'hidden md:block' : 'pb-4'}`}>
            <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden md:sticky md:top-20">
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
                    {discountsLoading && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="animate-spin w-3 h-3 rounded-full border border-gray-300 border-t-green-600" />
                        Checking discounts…
                      </div>
                    )}
                    {appliedDiscounts.map(d => {
                      const saving = d.value_type === 'percentage'
                        ? Math.round(stayTotal * d.value / 100)
                        : d.value;
                      return (
                        <div key={d.id} className="flex justify-between text-green-700">
                          <span className="flex items-center gap-1.5">
                            <Tag className="w-3 h-3" />
                            {d.name} ({d.value_type === 'percentage' ? `${d.value}%` : `KSh ${d.value.toLocaleString()}`} off)
                          </span>
                          <span className="font-semibold">−KSh {saving.toLocaleString()}</span>
                        </div>
                      );
                    })}
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-green-800 font-bold text-xs bg-green-50 rounded-lg px-2 py-1.5">
                        <span>Total Savings</span>
                        <span>−KSh {totalDiscount.toLocaleString()}</span>
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

      {/* ── Sticky footer ── */}
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
            className={`flex-shrink-0 px-6 py-3 rounded-full text-sm font-bold text-white transition-all active:scale-95 md:hidden ${step === 2 ? 'hidden' : ''}`}
            style={{ background: '#16a34a' }}>
            Enter Details →
          </button>
          {/* Mobile step 2 + desktop: confirm */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !property}
            className={`flex-shrink-0 px-5 py-3 rounded-full text-sm font-bold text-white disabled:opacity-50 transition-all active:scale-95 ${step === 1 ? 'hidden md:block' : ''}`}
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
