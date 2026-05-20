'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BedDouble, Droplets, Users, Home as HomeIcon, CheckCircle2, MapPin, Plus, Minus } from 'lucide-react';

type SelectedRoom = { property: any; qty: number };

function GroupBookingContent() {
  const params = useSearchParams();
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const fromCart = params.get('fromCart') === 'true';

  const [step,       setStep]       = useState(fromCart ? 3 : 1);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<SelectedRoom[]>([]);
  const [checkIn,    setCheckIn]    = useState(params.get('checkIn')  ?? today);
  const [checkOut,   setCheckOut]   = useState(params.get('checkOut') ?? tomorrow);
  const [adults,     setAdults]     = useState(Number(params.get('guests') ?? 2));
  const [children,   setChildren]   = useState(0);
  const [groupName,  setGroupName]  = useState('');
  const [name,       setName]       = useState('');
  const [phone,      setPhone]      = useState('');
  const [email,      setEmail]      = useState('');
  const [requests,   setRequests]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    if (fromCart) {
      try {
        const c = sessionStorage.getItem('roomCart');
        if (c) setSelected(JSON.parse(c));
      } catch { /* ignore */ }
    }
    fetch('/api/stay/properties')
      .then(r => r.json())
      .then(d => setProperties(d.properties ?? []))
      .finally(() => setLoading(false));
  }, []);

  const nights = checkIn && checkOut && checkOut > checkIn
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) : 0;
  const totalRooms  = selected.reduce((s, r) => s + r.qty, 0);
  const total       = selected.reduce((s, r) => s + Number(r.property.nightly_rate ?? 0) * nights * r.qty, 0);

  const toggleRoom = (prop: any) => {
    setSelected(sel => {
      const exists = sel.find(r => r.property.id === prop.id);
      if (exists) return sel.filter(r => r.property.id !== prop.id);
      return [...sel, { property: prop, qty: 1 }];
    });
  };

  const setQty = (propId: string, qty: number) => {
    if (qty <= 0) { setSelected(sel => sel.filter(r => r.property.id !== propId)); return; }
    setSelected(sel => sel.map(r => r.property.id === propId ? { ...r, qty } : r));
  };

  const handleSubmit = async () => {
    setError('');
    if (!name.trim())          { setError('Please enter the group leader name.'); return; }
    if (!phone.trim())         { setError('Please enter a phone number.'); return; }
    if (nights <= 0)           { setError('Please select valid dates.'); return; }
    if (selected.length === 0) { setError('Please select at least one room.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/stay/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: name.trim(), guest_phone: phone.trim(), guest_email: email.trim(),
          check_in: checkIn, check_out: checkOut, nights,
          num_adults: adults, num_children: children,
          room_details: selected.map(r => ({
            property_id:   r.property.id,
            property_name: r.property.name,
            nightly_rate:  r.property.nightly_rate,
            qty: r.qty, nights,
            subtotal: Number(r.property.nightly_rate) * nights * r.qty,
          })),
          total_amount: total,
          special_requests: [groupName && `Group: ${groupName}`, requests.trim()].filter(Boolean).join(' | '),
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setStep(4);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS = ['Dates & Group', 'Rooms', 'Details'];

  /* ── Success ── */
  if (step === 4) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4 pt-16">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-5"><CheckCircle2 className="w-16 h-16" style={{ color: '#16a34a' }} /></div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Group Booking Sent!</h2>
        <p className="text-gray-500 text-sm mb-6">
          We've received your group request for <strong>{totalRooms} room{totalRooms !== 1 ? 's' : ''}</strong> from <strong>{checkIn}</strong> to <strong>{checkOut}</strong>.
          Our team will call <strong>{phone}</strong> within 2 hours to confirm.
        </p>
        <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2 mb-6 text-sm">
          {selected.map(r => (
            <div key={r.property.id} className="flex justify-between text-gray-600">
              <span className="flex-1 truncate mr-2">{r.property.name}{r.qty > 1 ? ` × ${r.qty}` : ''}</span>
              <span className="font-semibold text-gray-900 flex-shrink-0">KSh {(Number(r.property.nightly_rate) * nights * r.qty).toLocaleString()}</span>
            </div>
          ))}
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
    <div className="min-h-screen bg-[#f8fafc] pt-5 sm:pt-20">

      {/* Header */}
      <div className="px-4 sm:px-6 pb-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/stay/rooms" className="inline-flex items-center text-gray-400 hover:text-gray-700 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </Link>
            <h1 className="text-xl font-black text-gray-900">Group Booking</h1>
          </div>
          {/* Progress — stretches full width on mobile */}
          <div className="flex items-center w-full">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${
                    i + 1 < step  ? 'text-white' : i + 1 === step ? 'text-white border-2' : 'text-gray-400 border-2 border-gray-200'
                  }`} style={i + 1 < step ? { background: '#16a34a' } : i + 1 === step ? { borderColor: '#16a34a', color: '#16a34a' } : {}}>
                    {i + 1 < step ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs mt-1 font-semibold ${
                    i + 1 < step ? 'text-green-700' : i + 1 === step ? 'text-gray-900' : 'text-gray-400'
                  }`}>{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 ${
                    i + 1 < step ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Main */}
          <div className="lg:col-span-2">

            {/* Step 1 — Dates & group size */}
            {step === 1 && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-black text-gray-900 mb-6">Dates & Group Size</h2>
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
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Group Name <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                    <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. Smith Family, Nairobi Conference"
                      className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-800" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                  <button onClick={() => { if (!checkIn || !checkOut || nights <= 0) { setError('Please select valid dates.'); return; } setError(''); setStep(2); }}
                    className="w-full py-4 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90" style={{ background: '#16a34a' }}>
                    Select Rooms →
                  </button>
                  {error && <p className="text-xs text-red-600 font-semibold text-center">{error}</p>}
                </div>
              </div>
            )}

            {/* Step 2 — Multi-room selection */}
            {step === 2 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black text-gray-900">Select Rooms</h2>
                  <span className="text-xs text-gray-500">{nights} night{nights !== 1 ? 's' : ''} · {adults + children} guests</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">Add as many room types as your group needs. You can adjust quantities per room type.</p>
                {selected.length > 0 && (
                  <div className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-between" style={{ background: '#16a34a' }}>
                    <span>{totalRooms} room{totalRooms !== 1 ? 's' : ''} selected</span>
                    <span>KSh {total.toLocaleString()} total</span>
                  </div>
                )}
                {loading ? (
                  <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
                ) : (
                  <div className="space-y-3">
                    {properties.map(prop => {
                      const sel = selected.find(r => r.property.id === prop.id);
                      return (
                        <div key={prop.id} className={`bg-white rounded-2xl p-4 border-2 transition-all ${sel ? 'border-red-800' : 'border-gray-100 hover:border-gray-300'}`}>
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
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="font-black text-gray-900 text-sm">KSh {Number(prop.nightly_rate ?? 0).toLocaleString()}</div>
                                  <div className="text-xs text-gray-400">/ night</div>
                                </div>
                              </div>
                              <div className="mt-3 flex items-center justify-between">
                                {sel ? (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-gray-500">Rooms:</span>
                                    <button
                                      onClick={e => { e.stopPropagation(); if (sel.qty > 1) setQty(prop.id, sel.qty - 1); }}
                                      disabled={sel.qty <= 1}
                                      className="w-7 h-7 rounded-full border-2 flex items-center justify-center disabled:opacity-30"
                                      style={{ borderColor: '#16a34a', color: '#16a34a' }}>
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="font-black text-sm text-gray-900 w-5 text-center">{sel.qty}</span>
                                    <button
                                      onClick={e => { e.stopPropagation(); setQty(prop.id, sel.qty + 1); }}
                                      className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                                      style={{ background: '#16a34a' }}>
                                      <Plus className="w-3 h-3" />
                                    </button>
                                    {nights > 0 && (
                                      <span className="text-xs font-bold" style={{ color: '#16a34a' }}>
                                        KSh {(Number(prop.nightly_rate) * nights * sel.qty).toLocaleString()}
                                      </span>
                                    )}
                                    <button onClick={e => { e.stopPropagation(); toggleRoom(prop); }} className="text-xs font-semibold text-gray-400 hover:text-red-700 ml-1">Remove</button>
                                  </div>
                                ) : (
                                  <button onClick={e => { e.stopPropagation(); toggleRoom(prop); }} className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-1.5 rounded-lg" style={{ background: '#16a34a' }}>
                                    <Plus className="w-3 h-3" /> Add
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="mt-6 flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-700 hover:border-gray-400">← Back</button>
                  <button onClick={() => { if (!selected.length) { setError('Please select at least one room.'); return; } setError(''); setStep(3); }}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#16a34a' }}>
                    Continue →
                  </button>
                </div>
                {error && <p className="mt-2 text-xs text-red-600 font-semibold text-center">{error}</p>}
              </div>
            )}

            {/* Step 3 — Group leader details */}
            {step === 3 && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-black text-gray-900 mb-1">Group Leader Details</h2>
                <p className="text-sm text-gray-500 mb-6">We'll contact this person to confirm the group reservation.</p>
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
                      placeholder="Adjacent rooms, dietary requirements, accessibility, arrival time…"
                      className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-800 resize-none" />
                  </div>
                  {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)} className="flex-1 py-4 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-700 hover:border-gray-400">← Back</button>
                    <button onClick={handleSubmit} disabled={submitting}
                      className="flex-1 py-4 rounded-xl text-sm font-bold text-white disabled:opacity-50 hover:opacity-90 transition-all" style={{ background: '#16a34a' }}>
                      {submitting ? 'Submitting…' : 'Submit Group Request'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar summary — hidden on mobile */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              <div className="p-5 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #0f172a, #0f172a)' }}>
                <h3 className="font-black text-white text-sm">Group Summary</h3>
                {groupName && <p className="text-xs text-white/60 mt-0.5">{groupName}</p>}
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between text-gray-600"><span>Check In</span><span className="font-semibold text-gray-900">{checkIn || '—'}</span></div>
                <div className="flex justify-between text-gray-600"><span>Check Out</span><span className="font-semibold text-gray-900">{checkOut || '—'}</span></div>
                <div className="flex justify-between text-gray-600"><span>Nights</span><span className="font-semibold text-gray-900">{nights || '—'}</span></div>
                <div className="flex justify-between text-gray-600"><span>Group size</span><span className="font-semibold text-gray-900">{adults + children} people</span></div>
                {selected.length > 0 && (
                  <>
                    <div className="border-t border-gray-100 pt-3 space-y-1.5">
                      {selected.map(r => (
                        <div key={r.property.id} className="flex justify-between text-gray-600">
                          <span className="truncate flex-1 mr-2">{r.property.name}{r.qty > 1 ? ` ×${r.qty}` : ''}</span>
                          <span className="font-semibold text-gray-900 flex-shrink-0">KSh {(Number(r.property.nightly_rate) * nights * r.qty).toLocaleString()}</span>
                        </div>
                      ))}
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

export default function GroupBookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-2 rounded-full" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} /></div>}>
      <GroupBookingContent />
    </Suspense>
  );
}
