'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BedDouble, Droplets, Users, Home as HomeIcon, CheckCircle2, MapPin } from 'lucide-react';

function SingleBookingContent() {
  const params = useSearchParams();
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [step,       setStep]       = useState(1);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<any>(null);
  const [checkIn,    setCheckIn]    = useState(params.get('checkIn')  ?? today);
  const [checkOut,   setCheckOut]   = useState(params.get('checkOut') ?? tomorrow);
  const [adults,     setAdults]     = useState(Number(params.get('guests') ?? 1));
  const [children,   setChildren]   = useState(0);
  const [name,       setName]       = useState('');
  const [phone,      setPhone]      = useState('');
  const [email,      setEmail]      = useState('');
  const [requests,   setRequests]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [bookingId,  setBookingId]  = useState('');

  useEffect(() => {
    const prefillId = params.get('propertyId');
    fetch('/api/stay/properties')
      .then(r => r.json())
      .then(d => {
        const props = d.properties ?? [];
        setProperties(props);
        if (prefillId) {
          const prop = props.find((p: any) => p.id === prefillId);
          if (prop) { setSelected(prop); setStep(2); }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const nights = checkIn && checkOut && checkOut > checkIn
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) : 0;

  const total = selected ? Number(selected.nightly_rate ?? 0) * nights : 0;

  const handleSubmit = async () => {
    setError('');
    if (!name.trim())  { setError('Please enter your name.'); return; }
    if (!phone.trim()) { setError('Please enter your phone number.'); return; }
    if (nights <= 0)   { setError('Please select valid dates.'); return; }
    if (!selected)     { setError('Please select a room.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/stay/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: name.trim(), guest_phone: phone.trim(), guest_email: email.trim(),
          check_in: checkIn, check_out: checkOut, nights,
          num_adults: adults, num_children: children,
          room_details: [{
            property_id:   selected.id,
            property_name: selected.name,
            nightly_rate:  selected.nightly_rate,
            qty: 1, nights,
            subtotal: total,
          }],
          total_amount: total,
          special_requests: requests.trim(),
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setBookingId(data.id ?? '');
      setStep(4);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS = ['Dates', 'Room', 'Details'];

  /* ── Success ── */
  if (step === 4) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4 pt-16">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-5"><CheckCircle2 className="w-16 h-16" style={{ color: '#16a34a' }} /></div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Booking Request Sent!</h2>
        <p className="text-gray-500 text-sm mb-6">
          We've received your request for <strong>{selected?.name}</strong> from <strong>{checkIn}</strong> to <strong>{checkOut}</strong>.
          Our team will call you on <strong>{phone}</strong> within 2 hours to confirm.
        </p>
        <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2 mb-6 text-sm">
          <div className="flex justify-between text-gray-600"><span>Room</span><span className="font-semibold text-gray-900">{selected?.name}</span></div>
          <div className="flex justify-between text-gray-600"><span>Dates</span><span className="font-semibold text-gray-900">{checkIn} → {checkOut}</span></div>
          <div className="flex justify-between text-gray-600"><span>Nights</span><span className="font-semibold text-gray-900">{nights}</span></div>
          <div className="border-t border-gray-200 pt-2 flex justify-between font-black text-gray-900">
            <span>Estimated Total</span><span>KSh {total.toLocaleString()}</span>
          </div>
        </div>
        <Link href="/stay" className="block w-full py-3 rounded-xl text-sm font-bold text-white text-center" style={{ background: '#16a34a' }}>
          Back to Home
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-16">

      {/* Header */}
      <div className="py-10 px-4 sm:px-6" style={{ background: 'linear-gradient(160deg, #0f172a, #0f172a)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <Link href="/stay/book" className="text-white/60 hover:text-white text-sm font-semibold transition-colors">← Back</Link>
            <span className="text-white/30">/</span>
            <span className="text-white text-sm font-semibold">Single Room</span>
          </div>
          <h1 className="text-2xl font-black text-white mb-6">Book a Room</h1>
          {/* Progress */}
          <div className="flex items-center gap-0">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${
                    i + 1 < step  ? 'bg-white text-gray-900' :
                    i + 1 === step ? 'text-white border-2 border-white' : 'bg-white/20 text-white/60'
                  }`}>
                    {i + 1 < step ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs mt-1 font-semibold ${i + 1 <= step ? 'text-white' : 'text-white/50'}`}>{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-4 ${i + 1 < step ? 'bg-white' : 'bg-white/20'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Main */}
          <div className="lg:col-span-2">

            {/* Step 1 — Dates */}
            {step === 1 && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-black text-gray-900 mb-6">When are you visiting?</h2>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Check In *</label>
                      <input type="date" value={checkIn} min={today}
                        onChange={e => { setCheckIn(e.target.value); if (e.target.value >= checkOut) setCheckOut(''); }}
                        className="w-full text-sm font-semibold text-gray-900 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-800" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Check Out *</label>
                      <input type="date" value={checkOut} min={checkIn || today}
                        onChange={e => setCheckOut(e.target.value)}
                        className="w-full text-sm font-semibold text-gray-900 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-800" />
                    </div>
                  </div>
                  {nights > 0 && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800 font-semibold">
                      {nights} night{nights !== 1 ? 's' : ''} selected
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Adults</label>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setAdults(a => Math.max(1, a - 1))} className="w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-gray-600 hover:border-gray-900 border-gray-200">−</button>
                      <span className="w-8 text-center font-black text-gray-900">{adults}</span>
                      <button onClick={() => setAdults(a => a + 1)} className="w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-gray-600 hover:border-gray-900 border-gray-200">+</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Children</label>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setChildren(c => Math.max(0, c - 1))} className="w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-gray-600 hover:border-gray-900 border-gray-200">−</button>
                      <span className="w-8 text-center font-black text-gray-900">{children}</span>
                      <button onClick={() => setChildren(c => c + 1)} className="w-9 h-9 rounded-full border-2 flex items-center justify-center font-bold text-gray-600 hover:border-gray-900 border-gray-200">+</button>
                    </div>
                  </div>
                  <button onClick={() => { if (!checkIn || !checkOut || nights <= 0) { setError('Please select valid dates.'); return; } setError(''); setStep(2); }}
                    className="w-full py-4 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90" style={{ background: '#16a34a' }}>
                    Choose a Room →
                  </button>
                  {error && <p className="text-xs text-red-600 font-semibold text-center">{error}</p>}
                </div>
              </div>
            )}

            {/* Step 2 — Room selection (single select) */}
            {step === 2 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black text-gray-900">Choose Your Room</h2>
                  <span className="text-xs text-gray-500">{nights} night{nights !== 1 ? 's' : ''} · {adults + children} guest{adults + children !== 1 ? 's' : ''}</span>
                </div>
                {loading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {properties.map(prop => {
                      const isSelected = selected?.id === prop.id;
                      return (
                        <button key={prop.id} onClick={() => setSelected(prop)}
                          className={`w-full text-left bg-white rounded-2xl p-4 border-2 transition-all ${isSelected ? 'border-red-800' : 'border-gray-100 hover:border-gray-300'}`}>
                          <div className="flex gap-4">
                            <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                              {prop.photos?.[0] ? (
                                <img src={prop.photos[0]} alt={prop.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a, #16a34a)' }}>
                                  <HomeIcon className="w-8 h-8 text-white/50" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-bold text-gray-900 text-sm">{prop.name}</h3>
                                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                    <BedDouble className="w-3 h-3" />{prop.bedrooms ?? 1}
                                    <Droplets className="w-3 h-3" />{prop.bathrooms ?? 1}
                                    <Users className="w-3 h-3" />{prop.max_guests ?? 2} max
                                  </p>
                                  {prop.location && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{prop.location}</p>}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="font-black text-gray-900 text-sm">KSh {Number(prop.nightly_rate ?? 0).toLocaleString()}</div>
                                  <div className="text-xs text-gray-400">/ night</div>
                                  {nights > 0 && <div className="text-xs font-bold mt-0.5" style={{ color: '#16a34a' }}>KSh {(Number(prop.nightly_rate ?? 0) * nights).toLocaleString()} total</div>}
                                </div>
                              </div>
                              {isSelected && (
                                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: '#16a34a' }}>
                                  ✓ Selected
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="mt-6 flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-700 hover:border-gray-400">← Back</button>
                  <button onClick={() => { if (!selected) { setError('Please select a room.'); return; } setError(''); setStep(3); }}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#16a34a' }}>
                    Continue →
                  </button>
                </div>
                {error && <p className="mt-2 text-xs text-red-600 font-semibold text-center">{error}</p>}
              </div>
            )}

            {/* Step 3 — Details */}
            {step === 3 && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-black text-gray-900 mb-6">Your Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Full Name *</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe"
                      className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Phone Number *</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07XX XXX XXX" type="tel"
                      className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Email Address</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email"
                      className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Special Requests</label>
                    <textarea value={requests} onChange={e => setRequests(e.target.value)} rows={3}
                      placeholder="Any special requests, dietary requirements, accessibility needs…"
                      className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-800 resize-none" />
                  </div>
                  {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)} className="flex-1 py-4 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-700 hover:border-gray-400">← Back</button>
                    <button onClick={handleSubmit} disabled={submitting}
                      className="flex-1 py-4 rounded-xl text-sm font-bold text-white disabled:opacity-50 hover:opacity-90 transition-all" style={{ background: '#16a34a' }}>
                      {submitting ? 'Submitting…' : 'Submit Request'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              <div className="p-5 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #0f172a, #0f172a)' }}>
                <h3 className="font-black text-white text-sm">Booking Summary</h3>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between text-gray-600"><span>Check In</span><span className="font-semibold text-gray-900">{checkIn || '—'}</span></div>
                <div className="flex justify-between text-gray-600"><span>Check Out</span><span className="font-semibold text-gray-900">{checkOut || '—'}</span></div>
                <div className="flex justify-between text-gray-600"><span>Nights</span><span className="font-semibold text-gray-900">{nights || '—'}</span></div>
                <div className="flex justify-between text-gray-600"><span>Guests</span><span className="font-semibold text-gray-900">{adults + children}</span></div>
                {selected && (
                  <>
                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex justify-between text-gray-600 mb-1">
                        <span className="truncate flex-1 mr-2">{selected.name}</span>
                        <span className="font-semibold text-gray-900 flex-shrink-0">KSh {(Number(selected.nightly_rate) * nights).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex justify-between font-black text-gray-900 text-base">
                      <span>Est. Total</span><span>KSh {total.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-400">Payment settled directly at the property.</p>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function SingleBookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-2 rounded-full" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} /></div>}>
      <SingleBookingContent />
    </Suspense>
  );
}
