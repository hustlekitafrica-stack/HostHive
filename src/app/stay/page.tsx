'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SearchWidget from '@/components/stay/SearchWidget';
import CardImageCarousel from '@/components/stay/CardImageCarousel';
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


function RoomCard({ property }: { property: any }) {
  return (
    <Link href={`/stay/rooms/${property.id}`} className="group flex-shrink-0 w-72 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative">
        <CardImageCarousel photos={property.photos ?? []} alt={property.name} height="h-48" />
        <div className="absolute top-3 left-3 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white capitalize z-10" style={{ background: '#16a34a' }}>
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
          <span className="text-xs font-bold text-white px-3 py-1.5 rounded-lg" style={{ background: '#16a34a' }}>View</span>
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
    <div className="bg-[#f8fafc]">

      {/* ═══ HERO ═══ */}
      <section className="relative pt-[68px] pb-4 px-2 sm:px-6 sm:pt-24 sm:pb-10" style={{ background: '#1e293b' }}>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl sm:text-4xl md:text-5xl font-black text-white mb-1 sm:mb-2 leading-tight px-2 sm:px-0">
            Find your perfect stay
          </h1>
          <p className="hidden sm:block text-white/80 sm:text-lg mb-5 sm:mb-7 px-2 sm:px-0">
            Discover rooms, suites, and more at Kogelo Suites…
          </p>

          {/* Search bar */}
          <SearchWidget />

        </div>
      </section>

      {/* ═══ AMENITIES ═══ */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#16a34a' }}>Everything You Need</p>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900">World-Class Amenities</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">Every detail has been considered to make your stay exceptional.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {AMENITIES.map(a => (
            <div key={a.label} className="group bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100">
              <div className="flex justify-center mb-4"><a.Icon className="w-8 h-8" style={{ color: '#16a34a' }} /></div>
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
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#16a34a' }}>Choose Your Space</p>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Our Rooms</h2>
              <p className="text-gray-500 mt-2">40 units — studios to suites, all in one exclusive compound.</p>
            </div>
            <Link href="/stay/rooms" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold hover:gap-3 transition-all" style={{ color: '#16a34a' }}>
              View all rooms →
            </Link>
          </div>

          {properties.length > 0 ? (
            <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              {properties.slice(0, 8).map(p => <RoomCard key={p.id} property={p} />)}
            </div>
          ) : (
            <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
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
            <Link href="/stay/rooms" className="inline-flex items-center gap-2 py-3 px-8 rounded-xl text-sm font-bold text-white" style={{ background: '#16a34a' }}>
              View All Rooms →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ DINING ═══ */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl overflow-hidden grid md:grid-cols-2" style={{ background: 'linear-gradient(135deg, #0f172a, #0f172a)' }}>
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
                  Menu
                </Link>
                <a href="tel:0726566795" className="inline-flex items-center gap-2 py-3 px-6 rounded-xl text-sm font-bold border border-white/30 text-white hover:bg-white/10 transition-all">
                  <Phone className="w-4 h-4" /> Call
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
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#16a34a' }}>The Kogelo Experience</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Why Guests Love Us</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { Icon: Leaf,     title: 'Peaceful & Private', desc: 'A secluded compound away from the city noise, with manicured gardens and a serene poolside atmosphere.' },
              { Icon: ChefHat,  title: 'Authentic Kitchen',  desc: 'Our chefs cook the way your grandmother did — with love, local ingredients, and the true Kogelo touch.' },
              { Icon: HomeIcon, title: 'Feels Like Home',    desc: 'Fully furnished, clean, and comfortable units. Whether one night or one month, you will feel right at home.' },
            ].map(f => (
              <div key={f.title} className="rounded-2xl p-8 border border-gray-100 hover:border-transparent hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: '#f0fdf4' }}>
                  <f.Icon className="w-6 h-6" style={{ color: '#16a34a' }} />
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
        <section className="py-20 px-4 sm:px-6" style={{ background: '#f8fafc' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#16a34a' }}>Guest Stories</p>
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
                        style={{ background: i === revIdx ? '#16a34a' : '#D1D5DB' }} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══ CTA ═══ */}
      <section className="py-24 px-4 sm:px-6 text-center" style={{ background: 'linear-gradient(135deg, #16a34a, #0f172a)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to Experience Kogelo?</h2>
          <p className="text-white/70 mb-10 text-lg">Book your stay today. Flexible dates. Instant confirmation.</p>
          <div className="flex items-center justify-center">
            <Link href="/stay/rooms" className="w-full sm:w-auto py-4 px-10 rounded-xl text-base font-bold bg-white transition-all hover:bg-gray-100" style={{ color: '#16a34a' }}>
              Browse Rooms
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
