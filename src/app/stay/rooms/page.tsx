'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { BedDouble, Droplets, Users, MapPin, Search, Heart, Plus, Check, ShoppingCart } from 'lucide-react';
import { DatePickerModal, GuestsModal } from '@/components/stay/SearchWidget';
import CardImageCarousel from '@/components/stay/CardImageCarousel';
import { createClient } from '@/lib/supabase/client';

const ROOM_TYPES = ['All', 'Studio', 'Apartment', 'Suite', 'Villa', 'Cottage', 'Loft', 'Penthouse'];

function RoomsContent() {
  const params  = useSearchParams();
  const router  = useRouter();
  const [properties,  setProperties]  = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [wishPending, setWishPending] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState('All');
  const [adults,    setAdults]    = useState(Number(params.get('guests') ?? 2));
  const [children,  setChildren]  = useState(0);
  const [rooms,        setRooms]        = useState(Number(params.get('rooms') ?? 1));
  const [isMultiMode,  setIsMultiMode]  = useState(Number(params.get('rooms') ?? 1) >= 2);
  const [cart,         setCart]         = useState<{ property: any; qty: number }[]>([]);
  const guestFilter = adults + children;
  const [checkIn,  setCheckIn]  = useState(params.get('checkIn')  ?? '');
  const [checkOut, setCheckOut] = useState(params.get('checkOut') ?? '');
  const [sortBy,   setSortBy]   = useState<'price_asc'|'price_desc'|'name'>('price_asc');
  const [showDate,   setShowDate]   = useState(false);
  const [showGuests, setShowGuests] = useState(false);

  useEffect(() => {
    fetch('/api/stay/properties')
      .then(r => r.json())
      .then(d => setProperties(d.properties ?? []))
      .finally(() => setLoading(false));
    fetch('/api/stay/wishlist')
      .then(r => r.json())
      .then(d => setWishlistIds(new Set(d.property_ids ?? [])));
  }, []);

  const toggleWishlist = useCallback(async (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { router.push(`/stay/auth?redirect=/stay/rooms`); return; }
    if (wishPending.has(propertyId)) return;
    const wasInSet = wishlistIds.has(propertyId);
    setWishPending(prev => new Set(prev).add(propertyId));
    setWishlistIds(prev => { const s = new Set(prev); s.has(propertyId) ? s.delete(propertyId) : s.add(propertyId); return s; });
    const res = await fetch('/api/stay/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ property_id: propertyId }) });
    const data = await res.json();
    if (!res.ok) {
      alert(`Error: ${data.error || 'Failed to update wishlist'}`);
      setWishlistIds(prev => { const s = new Set(prev); wasInSet ? s.add(propertyId) : s.delete(propertyId); return s; });
    } else {
      alert(data.wishlisted ? 'Room saved to your wishlist' : 'Room removed from your wishlist');
    }
    setWishPending(prev => { const s = new Set(prev); s.delete(propertyId); return s; });
  }, [router, wishPending]);

  function fmt(d: string) {
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  const guestLabel = `${adults} adult${adults !== 1 ? 's' : ''} · ${children} child${children !== 1 ? 'ren' : ''} · ${rooms} room${rooms !== 1 ? 's' : ''}`;

  const filtered = properties
    .filter(p => typeFilter === 'All' || (p.type || '').toLowerCase() === typeFilter.toLowerCase())
    .filter(p => (p.max_guests ?? 2) >= guestFilter)
    .sort((a, b) => {
      if (sortBy === 'price_asc') return (a.nightly_rate || 0) - (b.nightly_rate || 0);
      if (sortBy === 'price_desc') return (b.nightly_rate || 0) - (a.nightly_rate || 0);
      return (a.name || '').localeCompare(b.name || '');
    });

  const nights = checkIn && checkOut && checkOut > checkIn
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Search header */}
      <div className="pt-20 pb-16 px-4 sm:px-6" style={{ background: '#1e293b' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row rounded-lg overflow-visible" style={{ border: '3px solid #d97706' }}>
            <div className="flex-1 flex items-center gap-3 bg-white px-4 py-3 border-b lg:border-b-0 lg:border-r border-gray-200">
              <MapPin className="w-5 h-5 flex-shrink-0 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">Destination</p>
                <p className="text-sm font-semibold text-gray-900">Kogelo Suites, Kogelo</p>
              </div>
            </div>

            {/* Dates */}
            <div className="flex flex-1 bg-white border-b lg:border-b-0 lg:border-r border-gray-200">
              <button onClick={() => setShowDate(true)}
                className="flex items-center gap-3 px-4 py-3 flex-1 border-r border-gray-200 text-left">
                <svg className="w-5 h-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Check-in</p>
                  <p className="text-sm font-semibold text-gray-900">{fmt(checkIn) || 'Add date'}</p>
                </div>
              </button>
              <button onClick={() => setShowDate(true)}
                className="flex items-center gap-3 px-4 py-3 flex-1 text-left">
                <svg className="w-5 h-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Check-out</p>
                  <p className="text-sm font-semibold text-gray-900">{fmt(checkOut) || 'Add date'}</p>
                </div>
              </button>
            </div>

            {/* Guests */}
            <div className="flex items-center bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex-shrink-0">
              <button onClick={() => setShowGuests(true)} className="flex items-center gap-3 px-4 py-3 w-full text-left">
                <Users className="w-5 h-5 flex-shrink-0 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Guests</p>
                  <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{guestLabel}</p>
                </div>
                <svg className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
              </button>
            </div>

            <button className="px-8 py-4 text-base font-bold text-white transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 flex-shrink-0" style={{ background: '#16a34a' }}>
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end">
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
              className="bg-white text-gray-900 text-sm font-semibold rounded-lg px-4 py-2 outline-none">
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-8">

        {/* Type tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {ROOM_TYPES.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                typeFilter === t ? 'text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
              }`}
              style={typeFilter === t ? { background: '#16a34a' } : {}}>
              {t}
            </button>
          ))}
        </div>

        {/* Results count + group booking toggle */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-600">
            {loading ? 'Loading…' : `${filtered.length} room${filtered.length !== 1 ? 's' : ''} available`}
            {nights > 0 && ` · ${nights} night${nights !== 1 ? 's' : ''}`}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Group Booking</span>
            <button
              onClick={() => { setIsMultiMode(v => !v); setCart([]); }}
              aria-label="Toggle group booking"
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                isMultiMode ? 'bg-green-500' : 'bg-gray-300'
              }`}>
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                isMultiMode ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Room grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-52 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-8 bg-gray-200 rounded mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="flex justify-center mb-4"><Search className="w-14 h-14 text-gray-300" /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No rooms match your filters</h3>
            <p className="text-gray-500 mb-6">Try adjusting your dates or guest count</p>
            <button onClick={() => { setTypeFilter('All'); setAdults(2); setChildren(0); setRooms(1); }} className="text-sm font-bold text-white px-6 py-3 rounded-xl" style={{ background: '#16a34a' }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(p => (
              <Link key={p.id} href={`/stay/rooms/${p.id}${checkIn ? `?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guestFilter}` : ''}`}
                className={`group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 ${
                  isMultiMode && cart.some(c => c.property.id === p.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-100 bg-white'
                }`}>
                <div className="relative">
                  <CardImageCarousel photos={p.photos ?? []} alt={p.name} height="h-52" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold text-white capitalize z-10" style={{ background: '#16a34a' }}>
                    {p.type || 'Room'}
                  </div>
                  {/* Heart / wishlist button */}
                  <button
                    onClick={e => toggleWishlist(e, p.id)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md transition-all hover:scale-110"
                    title={wishlistIds.has(p.id) ? 'Remove from wishlist' : 'Save to wishlist'}>
                    <Heart
                      className="w-4 h-4 transition-colors"
                      style={{ color: '#16a34a' }}
                      fill={wishlistIds.has(p.id) ? '#16a34a' : 'none'}
                    />
                  </button>
                  {nights > 0 && (
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-xs font-black bg-white text-gray-900 z-10">
                      KSh {(Number(p.nightly_rate || 0) * nights).toLocaleString()} total
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 truncate">{p.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> {p.bedrooms ?? 1}</span>
                    <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> {p.bathrooms ?? 1}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.max_guests ?? 2}</span>
                  </div>
                  {p.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {p.amenities.slice(0, 3).map((a: string) => (
                        <span key={a} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{a}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <div>
                      <span className="font-black text-gray-900 text-base">KSh {Number(p.nightly_rate || 0).toLocaleString()}</span>
                      <span className="text-xs text-gray-400"> / night</span>
                    </div>
                    {isMultiMode && (() => {
                      const inCart = cart.some(c => c.property.id === p.id);
                      return inCart ? (
                        <button
                          onClick={e => { e.preventDefault(); e.stopPropagation(); setCart(prev => { const n = prev.filter(c => c.property.id !== p.id); sessionStorage.setItem('roomCart', JSON.stringify(n)); return n; }); }}
                          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border-2 transition-all"
                          style={{ color: '#16a34a', borderColor: '#16a34a', background: '#f0fdf4' }}>
                          <Check className="w-3 h-3" /> Added
                        </button>
                      ) : (
                        <button
                          onClick={e => { e.preventDefault(); e.stopPropagation(); setCart(prev => { const n = [...prev, { property: p, qty: 1 }]; sessionStorage.setItem('roomCart', JSON.stringify(n)); return n; }); }}
                          className="flex items-center gap-1 text-xs font-bold text-white px-3 py-1.5 rounded-lg"
                          style={{ background: '#16a34a' }}>
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Sticky cart bar — multi-room mode, desktop only */}
      {isMultiMode && cart.length > 0 && (() => {
        const totalRooms = cart.reduce((s, c) => s + c.qty, 0);
        const nights = checkIn && checkOut && checkOut > checkIn ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) : 0;
        const totalPrice = cart.reduce((s, c) => s + Number(c.property.nightly_rate || 0) * (nights || 1) * c.qty, 0);
        return (
          <div className="hidden md:flex fixed bottom-6 left-0 right-0 z-50 justify-center px-4 pointer-events-none">
            <div className="pointer-events-auto flex items-center justify-between gap-4 bg-gray-900 text-white rounded-2xl shadow-2xl px-5 py-3.5 w-full max-w-md">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm font-black">{totalRooms} room{totalRooms !== 1 ? 's' : ''} selected</p>
                  {nights > 0 && <p className="text-xs text-white/60">KSh {totalPrice.toLocaleString()} · {nights} night{nights !== 1 ? 's' : ''}</p>}
                </div>
              </div>
              <button
                onClick={() => {
                  sessionStorage.setItem('roomCart', JSON.stringify(cart));
                  sessionStorage.setItem('roomCartMeta', JSON.stringify({ checkIn, checkOut, guests: adults + children }));
                  window.location.href = '/stay/book/cart';
                }}
                className="text-sm font-bold px-4 py-2 rounded-xl text-white flex-shrink-0" style={{ background: '#16a34a' }}>
                View Cart →
              </button>
            </div>
          </div>
        );
      })()}

      {showDate && (
        <DatePickerModal
          checkIn={checkIn} checkOut={checkOut}
          onConfirm={(ci, co) => { setCheckIn(ci); setCheckOut(co); setShowDate(false); }}
          onClose={() => setShowDate(false)}
        />
      )}
      {showGuests && (
        <GuestsModal
          adults={adults} children={children} rooms={rooms}
          onConfirm={(a, c, r) => { setAdults(a); setChildren(c); setRooms(r); setShowGuests(false); }}
          onClose={() => setShowGuests(false)}
        />
      )}
    </div>
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-red-800 border-t-transparent rounded-full" /></div>}>
      <RoomsContent />
    </Suspense>
  );
}
