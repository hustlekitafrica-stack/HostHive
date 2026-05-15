'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BedDouble, Droplets, Users, Home as HomeIcon, MapPin, Search, ArrowRight } from 'lucide-react';

const ROOM_TYPES = ['All', 'Studio', 'Apartment', 'Suite', 'Villa', 'Cottage', 'Loft', 'Penthouse'];

function RoomsContent() {
  const params = useSearchParams();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');
  const [guestFilter, setGuestFilter] = useState(Number(params.get('guests') ?? 1));
  const [checkIn,  setCheckIn]  = useState(params.get('checkIn')  ?? '');
  const [checkOut, setCheckOut] = useState(params.get('checkOut') ?? '');
  const [sortBy,   setSortBy]   = useState<'price_asc'|'price_desc'|'name'>('price_asc');

  useEffect(() => {
    fetch('/api/stay/properties')
      .then(r => r.json())
      .then(d => setProperties(d.properties ?? []))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];

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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 leading-tight">
            Find your next stay
          </h1>
          <p className="text-white/80 text-base sm:text-lg mb-14">
            Search rooms, suites, and more at Kogelo Suites…
          </p>

          <div className="flex flex-col lg:flex-row rounded-lg overflow-visible" style={{ border: '3px solid #d97706' }}>
            <div className="flex-1 flex items-center gap-3 bg-white px-4 py-3 border-b lg:border-b-0 lg:border-r border-gray-200">
              <MapPin className="w-5 h-5 flex-shrink-0 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">Destination</p>
                <p className="text-sm font-semibold text-gray-900">Kogelo Suites, Kogelo</p>
              </div>
            </div>

            <div className="flex items-center bg-white border-b lg:border-b-0 lg:border-r border-gray-200">
              <div className="px-4 py-3 flex-1 border-r border-gray-200">
                <label className="block text-xs text-gray-400 mb-0.5">Check-in</label>
                <input type="date" value={checkIn} min={today}
                  onChange={e => { setCheckIn(e.target.value); if (e.target.value >= checkOut) setCheckOut(''); }}
                  className="text-sm font-semibold text-gray-900 outline-none bg-transparent w-32" />
              </div>
              <div className="px-4 py-3 flex-1">
                <label className="block text-xs text-gray-400 mb-0.5">Check-out</label>
                <input type="date" value={checkOut} min={checkIn || today}
                  onChange={e => setCheckOut(e.target.value)}
                  className="text-sm font-semibold text-gray-900 outline-none bg-transparent w-32" />
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-3 border-b lg:border-b-0 lg:border-r border-gray-200">
              <Users className="w-5 h-5 flex-shrink-0 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Guests</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setGuestFilter(g => Math.max(1, g - 1))} className="w-6 h-6 rounded-full border border-gray-300 text-gray-600 text-sm flex items-center justify-center font-bold">−</button>
                  <span className="text-gray-900 font-bold text-sm min-w-4 text-center">{guestFilter}</span>
                  <button onClick={() => setGuestFilter(g => Math.min(20, g + 1))} className="w-6 h-6 rounded-full border border-gray-300 text-gray-600 text-sm flex items-center justify-center font-bold">+</button>
                </div>
              </div>
            </div>

            <button className="px-8 py-4 text-base font-bold text-white transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 flex-shrink-0" style={{ background: '#16a34a' }}>
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <Link href={`/stay/book/single${checkIn ? `?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guestFilter}` : ''}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white border border-white/20 hover:bg-white/10 transition-colors">
                <BedDouble className="w-4 h-4" /> Single Room <ArrowRight className="w-3 h-3" />
              </Link>
              <Link href={`/stay/book/group${checkIn ? `?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guestFilter}` : ''}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white border border-white/20 hover:bg-white/10 transition-colors">
                <Users className="w-4 h-4" /> Group Booking <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
              className="bg-white text-gray-900 text-sm font-semibold rounded-lg px-4 py-2 outline-none">
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

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

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-600">
            {loading ? 'Loading…' : `${filtered.length} room${filtered.length !== 1 ? 's' : ''} available`}
            {nights > 0 && ` · ${nights} night${nights !== 1 ? 's' : ''}`}
          </p>
          {(checkIn && checkOut) && (
            <Link href={`/stay/book?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guestFilter}`}
              className="text-sm font-bold text-white px-4 py-2 rounded-lg transition-all hover:opacity-90"
              style={{ background: '#16a34a' }}>
              Book Multiple Rooms →
            </Link>
          )}
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
            <button onClick={() => { setTypeFilter('All'); setGuestFilter(1); }} className="text-sm font-bold text-white px-6 py-3 rounded-xl" style={{ background: '#16a34a' }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(p => (
              <Link key={p.id} href={`/stay/rooms/${p.id}${checkIn ? `?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guestFilter}` : ''}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <div className="relative h-52 overflow-hidden bg-gray-100">
                  {p.photos?.[0] ? (
                    <img src={p.photos[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a, #16a34a)' }}>
                      <HomeIcon className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold text-white capitalize" style={{ background: '#16a34a' }}>
                    {p.type || 'Room'}
                  </div>
                  {nights > 0 && (
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-xs font-black bg-white text-gray-900">
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
                    <span className="text-xs font-bold text-white px-3 py-1.5 rounded-lg group-hover:opacity-90" style={{ background: '#16a34a' }}>
                      View Room
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
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
