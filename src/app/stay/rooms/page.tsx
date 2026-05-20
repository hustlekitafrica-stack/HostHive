'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { BedDouble, Droplets, Users, Search, Heart, Plus, Check, ShoppingCart, ChevronDown, X, SlidersHorizontal, ArrowUpDown, Map } from 'lucide-react';
import { DatePickerModal, GuestsModal } from '@/components/stay/SearchWidget';
import SearchWidget from '@/components/stay/SearchWidget';
import CardImageCarousel from '@/components/stay/CardImageCarousel';
import { createClient } from '@/lib/supabase/client';

const ROOM_TYPES = ['All', 'Studio', 'Bedsitter', 'One Bedroom', 'Two Bedroom'];

function normalizeType(t: string): string {
  const m: Record<string, string> = {
    'studio': 'Studio', 'bedsitter': 'Bedsitter',
    '1br': 'One Bedroom', 'one-bedroom': 'One Bedroom', 'one bedroom': 'One Bedroom',
    '2br': 'Two Bedroom', 'two-bedroom': 'Two Bedroom', 'two bedroom': 'Two Bedroom',
  };
  const key = (t || '').toLowerCase();
  return m[key] || (t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Room');
}

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
  const [showDate,         setShowDate]         = useState(false);
  const [showGuests,       setShowGuests]       = useState(false);
  const [searchExpanded,   setSearchExpanded]   = useState(false);
  const [showSortSheet,   setShowSortSheet]   = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showMapView,     setShowMapView]     = useState(false);
  const [priceMin,         setPriceMin]         = useState<number | ''>('');
  const [priceMax,         setPriceMax]         = useState<number | ''>('');

  useEffect(() => {
    setCheckIn(params.get('checkIn') ?? '');
    setCheckOut(params.get('checkOut') ?? '');
    setAdults(Number(params.get('guests') ?? 2));
    setRooms(Number(params.get('rooms') ?? 1));
  }, [params]);

  // Lock body scroll (iOS-safe: position fixed technique)
  useEffect(() => {
    const anyOpen = showSortSheet || showFilterSheet || showMapView || showDate || showGuests;
    if (!anyOpen) return;
    const y = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${y}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, y);
    };
  }, [showSortSheet, showFilterSheet, showMapView, showDate, showGuests]);

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
    .filter(p => typeFilter === 'All' || normalizeType(p.type || '') === typeFilter)
    .filter(p => (p.max_guests ?? 2) >= guestFilter)
    .filter(p => priceMin === '' || Number(p.nightly_rate || 0) >= priceMin)
    .filter(p => priceMax === '' || Number(p.nightly_rate || 0) <= priceMax)
    .sort((a, b) => {
      if (sortBy === 'price_asc') return (a.nightly_rate || 0) - (b.nightly_rate || 0);
      if (sortBy === 'price_desc') return (b.nightly_rate || 0) - (a.nightly_rate || 0);
      return (a.name || '').localeCompare(b.name || '');
    });

  const nights = checkIn && checkOut && checkOut > checkIn
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* Search header — DESKTOP only: dark background matching home page */}
      <div className="hidden md:block px-4 sm:px-6" style={{ background: '#1e293b' }}>
        <div className="pt-16 pb-6 px-2 max-w-5xl mx-auto">
          <SearchWidget
            initialCheckIn={checkIn}
            initialCheckOut={checkOut}
            initialAdults={adults}
            initialRooms={rooms}
          />
        </div>
      </div>

      {/* MOBILE search card — white background, sits directly below fixed navbar */}
      <div className="md:hidden bg-white px-4 pb-3" style={{ paddingTop: '68px' }}>
        {!searchExpanded ? (
          <button
            onClick={() => setSearchExpanded(true)}
            className="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-4 text-left shadow-xl"
            style={{ border: '2.5px solid #d97706' }}>
            <Search className="w-5 h-5 flex-shrink-0 text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">Kogelo Suites</p>
              <p className="text-xs text-gray-500 truncate">
                {checkIn && checkOut
                  ? `${fmt(checkIn)} – ${fmt(checkOut)}${nights > 0 ? ` (${nights} night${nights !== 1 ? 's' : ''})` : ''} · `
                  : 'Any dates · '}
                {adults} adult{adults !== 1 ? 's' : ''}{children > 0 ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ border: '2.5px solid #d97706' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="font-bold text-gray-900 text-sm">Modify Search</p>
              <button onClick={() => setSearchExpanded(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <div>
                <p className="text-xs text-gray-400">Destination</p>
                <p className="text-sm font-semibold text-gray-900">Kogelo Suites, Kogelo</p>
              </div>
            </div>
            <button onClick={() => setShowDate(true)} className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 text-left hover:bg-gray-50">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <div className="flex-1">
                <p className="text-xs text-gray-400">Dates</p>
                <p className="text-sm font-semibold text-gray-900">{checkIn && checkOut ? `${fmt(checkIn)} – ${fmt(checkOut)}` : 'Select dates'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            <button onClick={() => setShowGuests(true)} className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 text-left hover:bg-gray-50">
              <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-400">Guests</p>
                <p className="text-sm font-semibold text-gray-900">{guestLabel}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            <div className="px-4 py-3">
              <button onClick={() => setSearchExpanded(false)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                style={{ background: '#16a34a' }}>
                <Search className="w-4 h-4" /> Done
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2 md:pt-4 pb-28 md:pb-8">

        {/* Sort/Filter/Map row — mobile only (compact) */}
        <div className="md:hidden flex border-b border-gray-200 mb-3 -mx-4">
          <button onClick={() => setShowSortSheet(true)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold text-gray-700">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort
          </button>
          <button onClick={() => setShowFilterSheet(true)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold border-x border-gray-200 ${ (typeFilter !== 'All' || priceMin !== '' || priceMax !== '') ? 'text-green-700' : 'text-gray-700' }`}>
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filter{(typeFilter !== 'All' || priceMin !== '' || priceMax !== '') ? ' •' : ''}
          </button>
          <button onClick={() => setShowMapView(true)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-bold text-gray-700">
            <Map className="w-3.5 h-3.5" /> Map
          </button>
        </div>

        {/* Main layout: sidebar + grid */}
        <div className="flex gap-6 items-start">

          {/* ── LEFT SIDEBAR – desktop only ── */}
          <aside className="hidden md:block w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
              <h3 className="font-black text-gray-900 mb-4 text-sm">Filters</h3>

              {/* Sort */}
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Sort by</p>
                {[['price_asc','Price: Low → High'],['price_desc','Price: High → Low'],['name','Name A–Z']].map(([v,l]) => (
                  <label key={v} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
                    <input type="radio" name="sort" checked={sortBy === v} onChange={() => setSortBy(v as any)} className="accent-green-600" />
                    <span className="text-sm text-gray-700">{l}</span>
                  </label>
                ))}
              </div>

              {/* Room Type */}
              <div className="border-t border-gray-100 pt-4 mb-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Room Type</p>
                {ROOM_TYPES.map(t => (
                  <label key={t} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
                    <input type="radio" name="roomType" checked={typeFilter === t} onChange={() => setTypeFilter(t)} className="accent-green-600" />
                    <span className="text-sm text-gray-700">{t}</span>
                  </label>
                ))}
              </div>

              {/* Price range */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Price / night (KSh)</p>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={priceMin}
                    onChange={e => setPriceMin(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-green-500" />
                  <input type="number" placeholder="Max" value={priceMax}
                    onChange={e => setPriceMax(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-green-500" />
                </div>
                {(priceMin !== '' || priceMax !== '' || typeFilter !== 'All') && (
                  <button onClick={() => { setPriceMin(''); setPriceMax(''); setTypeFilter('All'); }}
                    className="mt-3 text-xs font-bold underline" style={{ color: '#16a34a' }}>
                    Clear filters
                  </button>
                )}
              </div>

              {/* Map */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Location</p>
                <a
                  href="https://maps.google.com/maps?q=Kogelo+Suites,Kogelo,Siaya,Kenya"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                  <Map className="w-4 h-4 flex-shrink-0" />
                  View on Map
                </a>
              </div>
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <div className="flex-1 min-w-0">

            {/* Results count + group booking toggle */}
            <div className="flex items-center justify-between mb-4">
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
                    {normalizeType(p.type || '')}
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
          </div>{/* end flex-1 MAIN CONTENT */}
        </div>{/* end flex gap-6 sidebar+grid */}
      </div>{/* end max-w-7xl */}

      {/* Mobile floating cart FAB */}
      {isMultiMode && cart.length > 0 && (() => {
        const totalRooms = cart.reduce((s, c) => s + c.qty, 0);
        return (
          <button
            onClick={() => {
              sessionStorage.setItem('roomCart', JSON.stringify(cart));
              sessionStorage.setItem('roomCartMeta', JSON.stringify({ checkIn, checkOut, guests: adults + children }));
              window.location.href = '/stay/book/cart';
            }}
            className="md:hidden fixed bottom-24 right-4 z-50 flex items-center gap-2 text-white rounded-full shadow-2xl px-4 py-3 font-bold text-sm"
            style={{ background: '#16a34a' }}>
            <ShoppingCart className="w-5 h-5" />
            <span>{totalRooms}</span>
            <span className="hidden xs:inline">View Cart</span>
          </button>
        );
      })()}

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

      {/* ── MOBILE SORT BOTTOM SHEET ── */}
      {showSortSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden" onClick={() => setShowSortSheet(false)}>
          <div className="bg-black/70 absolute inset-0" />
          <div className="relative bg-white rounded-t-2xl shadow-2xl" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-base font-black text-gray-900">Sort by</h3>
              <button onClick={() => setShowSortSheet(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            {([
              ['price_asc',  'Price (lowest first)'],
              ['price_desc', 'Price (highest first)'],
              ['name',       'Name A–Z'],
            ] as [string, string][]).map(([v, l]) => (
              <label key={v} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-100 cursor-pointer">
                <input type="radio" name="sort_sheet" checked={sortBy === v}
                  onChange={() => { setSortBy(v as any); setShowSortSheet(false); }}
                  className="w-5 h-5 accent-blue-600 flex-shrink-0" />
                <span className={`text-sm ${sortBy === v ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{l}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ── MOBILE FILTER BOTTOM SHEET ── */}
      {showFilterSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden" onClick={() => setShowFilterSheet(false)}>
          <div className="bg-black/70 absolute inset-0" />
          <div className="relative bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <button onClick={() => setShowFilterSheet(false)} className="text-blue-600 p-1">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-black text-gray-900">Filters</h3>
              <button onClick={() => { setTypeFilter('All'); setPriceMin(''); setPriceMax(''); }}
                className="text-sm text-gray-400 font-semibold">Clear</button>
            </div>
            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-5 py-4" style={{ overscrollBehavior: 'contain' }}>
              {/* Budget */}
              <div className="mb-6">
                <h4 className="text-base font-black text-gray-900 mb-1">Your budget (per night)</h4>
                <p className="text-sm text-gray-500 mb-3">
                  KSh {priceMin !== '' ? Number(priceMin).toLocaleString() : '0'} — KSh {priceMax !== '' ? Number(priceMax).toLocaleString() : 'Any'}
                </p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 mb-1 block">Min (KSh)</label>
                    <input type="number" placeholder="0" value={priceMin}
                      onChange={e => setPriceMin(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 mb-1 block">Max (KSh)</label>
                    <input type="number" placeholder="Any" value={priceMax}
                      onChange={e => setPriceMax(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>
              {/* Room type filters */}
              <div>
                <h4 className="text-base font-black text-gray-900 mb-3">Room type</h4>
                {ROOM_TYPES.filter(t => t !== 'All').map(t => (
                  <label key={t} className="flex items-center gap-4 py-3 border-b border-gray-100 cursor-pointer">
                    <input type="checkbox" checked={typeFilter === t}
                      onChange={() => setTypeFilter(typeFilter === t ? 'All' : t)}
                      className="w-5 h-5 rounded accent-blue-600 flex-shrink-0" />
                    <span className="text-sm text-gray-800">{t}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Show results button */}
            <div className="px-5 pt-4 border-t border-gray-100" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
              <button onClick={() => setShowFilterSheet(false)}
                className="w-full py-3.5 rounded-xl text-base font-bold text-white"
                style={{ background: '#16a34a' }}>
                Show {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE MAP OVERLAY ── */}
      {showMapView && (
        <div className="fixed inset-0 z-50 flex flex-col md:hidden bg-white">
          {/* Search bar row */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
            <button onClick={() => setShowMapView(false)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <X className="w-4 h-4 text-gray-700" />
            </button>
            <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2 gap-2">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-500">Kogelo Suites, Kogelo</span>
            </div>
          </div>
          {/* Map iframe */}
          <div className="flex-1 relative" style={{ overscrollBehavior: 'contain' }}>
            <iframe
              src="https://maps.google.com/maps?q=Kogelo,Siaya,Kenya&t=&z=13&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            {/* Floating filter button */}
            <button
              onClick={() => { setShowMapView(false); setShowFilterSheet(true); }}
              className="absolute top-3 left-3 flex items-center gap-1.5 bg-white rounded-xl shadow-md px-3 py-2 text-sm font-bold text-gray-700 border border-gray-200">
              <SlidersHorizontal className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>
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
