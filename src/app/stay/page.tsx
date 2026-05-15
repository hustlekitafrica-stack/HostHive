'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Waves, Utensils, Wifi, Car, Bell, Leaf, ShieldCheck, Sparkles,
  BedDouble, Droplets, Users, MapPin, ChefHat, Home as HomeIcon,
  Search, Phone, TrendingUp, Star, ChevronLeft, ChevronRight, type LucideIcon,
} from 'lucide-react';

type Review = { id: string; guest_name: string; property_name: string; stay_dates: string; rating: number; comment: string; submitted_at: string };

type Amenity = { Icon: LucideIcon; label: string; desc: string };
const AMENITIES: Amenity[] = [
  { Icon: Waves,       label: 'Swimming Pool',     desc: 'Relax in our pristine outdoor pool' },
  { Icon: Utensils,    label: 'Restaurant',        desc: 'Authentic Kenyan & continental cuisine' },
  { Icon: Wifi,        label: 'Free WiFi',          desc: 'High-speed internet throughout' },
  { Icon: Car,         label: 'Secure Parking',    desc: 'Ample guarded parking on-site' },
  { Icon: Bell,        label: 'Room Service',      desc: 'Order meals delivered to your room' },
  { Icon: Leaf,        label: 'Garden Lounge',     desc: 'Lush outdoor seating & relaxation' },
  { Icon: ShieldCheck, label: '24/7 Security',     desc: 'Manned gate with CCTV' },
  { Icon: Sparkles,    label: 'Daily Housekeeping', desc: 'Fresh linen and clean rooms every day' },
];

const HIGHLIGHTS = [
  { number: '40', label: 'Units Available' },
  { number: '5★', label: 'Guest Rating'   },
  { number: '2',  label: 'Pools & Lounges' },
  { number: '1',  label: 'In-house Restaurant' },
];

function SearchWidget() {
  const router = useRouter();
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [checkIn,  setCheckIn]  = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [adults,   setAdults]   = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms,    setRooms]    = useState(1);
  const [guestOpen, setGuestOpen] = useState(false);

  const guestLabel = `${adults} adult${adults !== 1 ? 's' : ''} · ${children} child${children !== 1 ? 'ren' : ''} · ${rooms} room${rooms !== 1 ? 's' : ''}`;

  const handleSearch = () => {
    setGuestOpen(false);
    router.push(`/stay/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${adults + children}&rooms=${rooms}`);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* Main bar */}
      <div className="flex flex-col lg:flex-row rounded-lg overflow-visible" style={{ border: '3px solid #FFB700' }}>

        {/* Destination */}
        <div className="flex-1 flex items-center gap-3 bg-white px-4 py-3 border-b lg:border-b-0 lg:border-r border-gray-200">
          <svg className="w-5 h-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <div className="flex-1">
            <input
              type="text"
              defaultValue="Kogelo Suites, Kogelo"
              readOnly
              className="w-full text-gray-900 font-semibold text-sm outline-none bg-transparent cursor-default placeholder-gray-400"
              placeholder="Where are you going?"
            />
            <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">Kogelo, Siaya County, Kenya</p>
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center bg-white border-b lg:border-b-0 lg:border-r border-gray-200">
          <div className="flex items-center gap-3 px-4 py-3 flex-1 border-r border-gray-200">
            <svg className="w-5 h-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Check-in</p>
              <input type="date" value={checkIn} min={today}
                onChange={e => { setCheckIn(e.target.value); if (e.target.value >= checkOut) setCheckOut(e.target.value); }}
                className="text-sm font-semibold text-gray-900 outline-none bg-transparent w-32" />
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 flex-1">
            <svg className="w-5 h-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Check-out</p>
              <input type="date" value={checkOut} min={checkIn}
                onChange={e => setCheckOut(e.target.value)}
                className="text-sm font-semibold text-gray-900 outline-none bg-transparent w-32" />
            </div>
          </div>
        </div>

        {/* Guests */}
        <div className="relative flex items-center bg-white border-b lg:border-b-0 lg:border-r border-gray-200">
          <button onClick={() => setGuestOpen(o => !o)} className="flex items-center gap-3 px-4 py-3 w-full text-left">
            <svg className="w-5 h-5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Guests</p>
              <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{guestLabel}</p>
            </div>
            <svg className={`w-4 h-4 text-gray-400 ml-2 transition-transform ${guestOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
          </button>

          {/* Guest dropdown */}
          {guestOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl p-5 min-w-[280px]">
              {[
                { label: 'Adults', sub: 'Ages 18+', val: adults, set: setAdults, min: 1 },
                { label: 'Children', sub: 'Ages 0–17', val: children, set: setChildren, min: 0 },
                { label: 'Rooms', sub: '', val: rooms, set: setRooms, min: 1 },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-3 border-b last:border-0 border-gray-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{row.label}</p>
                    {row.sub && <p className="text-xs text-gray-400">{row.sub}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => row.set((v: number) => Math.max(row.min, v - 1))}
                      className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-900 transition-colors font-bold text-lg leading-none disabled:opacity-30"
                      disabled={row.val === row.min}>−</button>
                    <span className="text-sm font-bold w-4 text-center">{row.val}</span>
                    <button onClick={() => row.set((v: number) => Math.min(20, v + 1))}
                      className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-900 transition-colors font-bold text-lg leading-none">+</button>
                  </div>
                </div>
              ))}
              <button onClick={() => setGuestOpen(false)}
                className="mt-3 w-full py-2 rounded-lg text-sm font-bold text-white" style={{ background: '#003580' }}>Done</button>
            </div>
          )}
        </div>

        {/* Book Now */}
        <button onClick={handleSearch}
          className="px-8 py-4 text-base font-bold text-white transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 flex-shrink-0"
          style={{ background: '#003580' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          Book Now
        </button>
      </div>
    </div>
  );
}

function RoomCard({ property }: { property: any }) {
  return (
    <Link href={`/stay/rooms/${property.id}`} className="group flex-shrink-0 w-72 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {property.photos?.[0] ? (
          <img src={property.photos[0]} alt={property.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4a1010, #9B1C1C)' }}>
            <HomeIcon className="w-12 h-12 text-white/50" />
          </div>
        )}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold text-white capitalize" style={{ background: '#9B1C1C' }}>
          {property.type || 'Room'}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">{property.name}</h3>
        <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
          {property.location || property.city || 'Kogelo'}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> {property.bedrooms ?? 1} bed{property.bedrooms !== 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> {property.bathrooms ?? 1} bath</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {property.max_guests ?? 2}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-black text-gray-900">KSh {Number(property.nightly_rate || 0).toLocaleString()}</span>
            <span className="text-xs text-gray-400"> / night</span>
          </div>
          <span className="text-xs font-bold text-white px-3 py-1.5 rounded-lg" style={{ background: '#9B1C1C' }}>View</span>
        </div>
      </div>
    </Link>
  );
}

export default function StayHomePage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [revIdx, setRevIdx] = useState(0);

  useEffect(() => {
    fetch('/api/stay/properties')
      .then(r => r.json())
      .then(d => setProperties(d.properties ?? []))
      .catch(() => {});
    fetch('/api/stay/reviews')
      .then(r => r.json())
      .then(d => setReviews(d.reviews ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="bg-[#FFFBF5]">

      {/* ═══ HERO ═══ */}
      <section className="relative pt-20 pb-16 sm:pb-24 px-4 sm:px-6" style={{ background: '#003580' }}>
        <div className="max-w-5xl mx-auto">

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-2 leading-tight">
              Find your next stay
            </h1>
            <p className="text-white/80 text-base sm:text-lg">
              Search rooms, suites, and more at Kogelo Suites…
            </p>
          </div>

          {/* Search bar */}
          <SearchWidget />

          {/* Stats row */}
          <div className="mt-10 flex items-center gap-6 flex-wrap">
            {HIGHLIGHTS.map(h => (
              <div key={h.label} className="flex items-center gap-2">
                <span className="text-xl font-black text-white">{h.number}</span>
                <span className="text-xs text-white/60">{h.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AMENITIES ═══ */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9B1C1C' }}>Everything You Need</p>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900">World-Class Amenities</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">Every detail has been considered to make your stay exceptional.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {AMENITIES.map(a => (
            <div key={a.label} className="group bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100">
              <div className="flex justify-center mb-4"><a.Icon className="w-8 h-8" style={{ color: '#9B1C1C' }} /></div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">{a.label}</h3>
              <p className="text-xs text-gray-500 leading-snug">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ ROOMS PREVIEW ═══ */}
      <section className="py-20 bg-white">
        <div className="px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9B1C1C' }}>Choose Your Space</p>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Our Rooms</h2>
              <p className="text-gray-500 mt-2">40 units — studios to suites, all in one exclusive compound.</p>
            </div>
            <Link href="/stay/rooms" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold hover:gap-3 transition-all" style={{ color: '#9B1C1C' }}>
              View all rooms →
            </Link>
          </div>

          {properties.length > 0 ? (
            <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              {properties.slice(0, 8).map(p => <RoomCard key={p.id} property={p} />)}
            </div>
          ) : (
            <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex-shrink-0 w-72 bg-gray-100 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-8 bg-gray-200 rounded mt-4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link href="/stay/rooms" className="inline-flex items-center gap-2 py-3 px-8 rounded-xl text-sm font-bold text-white" style={{ background: '#9B1C1C' }}>
              View All Rooms →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ DINING ═══ */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl overflow-hidden grid md:grid-cols-2" style={{ background: 'linear-gradient(135deg, #1A0800, #4a1010)' }}>
            <div className="p-10 md:p-14 flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#D97706' }}>Kogelo Restaurant</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
                Authentic Flavours,<br />Every Meal
              </h2>
              <p className="text-white/70 leading-relaxed mb-8">
                From hearty Kenyan breakfasts to slow-cooked main dishes, our kitchen serves the real taste of home. Order to your room, dine with us, or get it delivered.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                {[
                  { Icon: ChefHat,  label: 'Breakfast' },
                  { Icon: Utensils, label: 'Mains' },
                  { Icon: Waves,    label: 'Beverages' },
                  { Icon: Bell,     label: 'Room Service' },
                ].map(tag => (
                  <span key={tag.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white/80 border border-white/20">
                    <tag.Icon className="w-3 h-3" />{tag.label}
                  </span>
                ))}
              </div>
              <div className="flex gap-3">
                <Link href="/stay/dining" className="inline-flex items-center gap-2 py-3 px-6 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90" style={{ background: '#D97706' }}>
                  View Menu & Order
                </Link>
                <a href="tel:0726566795" className="inline-flex items-center gap-2 py-3 px-6 rounded-xl text-sm font-bold border border-white/30 text-white hover:bg-white/10 transition-all">
                  <Phone className="w-4 h-4" /> Call to Order
                </a>
              </div>
            </div>

            <div className="relative hidden md:block min-h-64">
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <Utensils className="w-40 h-40 text-white" />
              </div>
              <div className="absolute inset-0 grid grid-cols-2 gap-3 p-8 opacity-90">
                {['¼ Traditional Chicken — KSh 600', 'Whole Tilapia — KSh 800', 'Chicken Pilau — KSh 700', 'BBQ Chicken Wings — KSh 600'].map((item, i) => (
                  <div key={i} className="rounded-xl p-4 text-xs font-semibold text-white" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ EXPERIENCE / WHY US ═══ */}
      <section className="py-20 bg-white px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9B1C1C' }}>The Kogelo Experience</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Why Guests Love Us</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { Icon: Leaf,     title: 'Peaceful & Private', desc: 'A secluded compound away from the city noise, with manicured gardens and a serene poolside atmosphere.' },
              { Icon: ChefHat,  title: 'Authentic Kitchen',  desc: 'Our chefs cook the way your grandmother did — with love, local ingredients, and the true Kogelo touch.' },
              { Icon: HomeIcon, title: 'Feels Like Home',    desc: 'Fully furnished, clean, and comfortable units. Whether one night or one month, you will feel right at home.' },
            ].map(f => (
              <div key={f.title} className="rounded-2xl p-8 border border-gray-100 hover:border-transparent hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: '#FFF0F0' }}>
                  <f.Icon className="w-6 h-6" style={{ color: '#9B1C1C' }} />
                </div>
                <h3 className="font-black text-xl text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Guest Reviews Carousel ═══ */}
      {reviews.length > 0 && (
        <section className="py-20 px-4 sm:px-6" style={{ background: '#FFFBF5' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#9B1C1C' }}>Guest Stories</p>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900">What Our Guests Say</h2>
            </div>
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10 text-center min-h-[220px] flex flex-col items-center justify-center">
                <div className="flex gap-1 justify-center mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-5 h-5" fill={i < reviews[revIdx].rating ? '#F59E0B' : 'none'} stroke={i < reviews[revIdx].rating ? '#F59E0B' : '#D1D5DB'} />
                  ))}
                </div>
                {reviews[revIdx].comment && (
                  <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-6 max-w-2xl italic">
                    &ldquo;{reviews[revIdx].comment}&rdquo;
                  </p>
                )}
                <div>
                  <p className="font-black text-gray-900">{reviews[revIdx].guest_name}</p>
                  {reviews[revIdx].property_name && <p className="text-sm text-gray-400 mt-0.5">{reviews[revIdx].property_name}{reviews[revIdx].stay_dates ? ` · ${reviews[revIdx].stay_dates}` : ''}</p>}
                </div>
              </div>
              {reviews.length > 1 && (
                <>
                  <button onClick={() => setRevIdx(i => (i - 1 + reviews.length) % reviews.length)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button onClick={() => setRevIdx(i => (i + 1) % reviews.length)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="flex justify-center gap-2 mt-5">
                    {reviews.map((_, i) => (
                      <button key={i} onClick={() => setRevIdx(i)}
                        className="w-2 h-2 rounded-full transition-all"
                        style={{ background: i === revIdx ? '#9B1C1C' : '#D1D5DB' }} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══ CTA ═══ */}
      <section className="py-24 px-4 sm:px-6 text-center" style={{ background: 'linear-gradient(135deg, #9B1C1C, #4a1010)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to Experience Kogelo?</h2>
          <p className="text-white/70 mb-10 text-lg">Book your stay today. Flexible dates. Instant confirmation.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/stay/book" className="w-full sm:w-auto py-4 px-10 rounded-xl text-base font-bold bg-white transition-all hover:bg-gray-100" style={{ color: '#9B1C1C' }}>
              Book Your Stay
            </Link>
            <Link href="/stay/rooms" className="w-full sm:w-auto py-4 px-10 rounded-xl text-base font-bold border-2 border-white/40 text-white hover:bg-white/10 transition-all">
              Browse Rooms
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
