'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SearchWidget from '@/components/stay/SearchWidget';
import CardImageCarousel from '@/components/stay/CardImageCarousel';
import {
  Waves, Utensils, Wifi, Car, Bell, Leaf, ShieldCheck, Sparkles,
  BedDouble, Droplets, Users, MapPin, ChefHat, Home as HomeIcon,
  Search, Phone, TrendingUp, Star, Heart, type LucideIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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


function RoomCard({ property, wishlisted, onToggle }: { property: any; wishlisted: boolean; onToggle: (e: React.MouseEvent, id: string) => void }) {
  return (
    <Link href={`/stay/rooms/${property.id}`} className="group flex-shrink-0 w-64 sm:w-72 md:w-auto">
      {/* Image */}
      <div className="relative rounded-2xl overflow-hidden mb-3">
        <CardImageCarousel photos={property.photos ?? []} alt={property.name} height="h-52" />
        {/* Guest favourite badge */}
        <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 shadow-sm">
          <span className="text-xs font-bold text-gray-900">Guest favourite</span>
        </div>
        {/* Heart */}
        <button
          onClick={e => onToggle(e, property.id)}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm transition-all hover:scale-110"
          title={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}>
          <Heart className="w-4 h-4 transition-colors" style={{ color: wishlisted ? '#16a34a' : '#374151' }} fill={wishlisted ? '#16a34a' : 'none'} />
        </button>
      </div>
      {/* Info */}
      <div>
        <h3 className="font-bold text-gray-900 text-sm leading-snug truncate">{property.type ? `${property.type} in` : 'Stay in'} {property.city || property.location || 'Kogelo'}</h3>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{property.name}</p>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-sm font-semibold" style={{ color: '#D97706' }}>
            KSh {Number(property.nightly_rate || 0).toLocaleString()} <span className="font-normal text-gray-500">/ night</span>
          </p>
          <p className="text-xs text-gray-700 flex items-center gap-0.5 font-semibold">
            <Star className="w-3 h-3 fill-gray-800 stroke-none" /> {property.rating ?? '5.0'}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function StayHomePage() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [revIdx, setRevIdx] = useState(0);
  const reviewScrollRef = useRef<HTMLDivElement>(null);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [wishPending, setWishPending] = useState<Set<string>>(new Set());
  const [featuredDishes, setFeaturedDishes] = useState<any[]>([]);

  const FALLBACK_DISHES = [
    { image_url: '/images/chicken-pilau.jpg',     name: 'Chicken Pilau',      description: 'Spiced basmati rice',     price: 700, badge: "\u2b50 Chef's Pick",   badge_color: '#D97706' },
    { image_url: '/images/kienyeji-chicken.jpg',  name: 'Kienyeji Chicken',   description: 'Slow-cooked, rich sauce', price: 600, badge: '\ud83c\udf3f Traditional',   badge_color: '#16a34a' },
    { image_url: '/images/bbq-chicken-wings.jpg', name: 'BBQ Chicken Wings',  description: 'Smoky, sticky & charred',price: 600, badge: '\ud83d\udd25 Fan Favourite', badge_color: '#dc2626' },
    { image_url: '/images/tilapia.jpg',           name: 'Whole Tilapia',      description: 'In rich tomato sauce',    price: 800, badge: '\ud83d\udc1f Lake Fresh',    badge_color: '#0369a1' },
  ];

  useEffect(() => {
    fetch('/api/stay/properties')
      .then(r => r.json())
      .then(d => setProperties(d.properties ?? []))
      .catch(() => {});
    fetch('/api/stay/reviews')
      .then(r => r.json())
      .then(d => setReviews(d.reviews ?? []))
      .catch(() => {});
    fetch('/api/stay/wishlist')
      .then(r => r.json())
      .then(d => setWishlistIds(new Set(d.property_ids ?? [])))
      .catch(() => {});
    fetch('/api/featured-dishes')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.dishes?.length) setFeaturedDishes(d.dishes.filter((x: any) => x.is_active)); })
      .catch(() => {});
  }, []);

  const toggleWishlist = useCallback(async (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { router.push('/stay/auth?redirect=/stay'); return; }
    if (wishPending.has(propertyId)) return;
    setWishPending(prev => new Set(prev).add(propertyId));
    setWishlistIds(prev => { const s = new Set(prev); s.has(propertyId) ? s.delete(propertyId) : s.add(propertyId); return s; });
    const res = await fetch('/api/stay/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ property_id: propertyId }) });
    const data = await res.json();
    if (!res.ok) {
      alert(`Error: ${data.error || 'Failed to update wishlist'}`);
      setWishlistIds(prev => { const s = new Set(prev); s.has(propertyId) ? s.delete(propertyId) : s.add(propertyId); return s; });
    } else {
      alert(data.wishlisted ? 'Room saved to your wishlist' : 'Room removed from your wishlist');
    }
    setWishPending(prev => { const s = new Set(prev); s.delete(propertyId); return s; });
  }, [router, wishPending]);

  return (
    <div className="bg-[#f8fafc]">

      {/* ═══ HERO ═══ */}
      <section className="relative pt-[36px] pb-8 px-2 sm:px-6 sm:pt-24" style={{ background: '#1e293b' }}>
        {/* Desktop background image — place your hero image at /images/hero.jpg */}
        <div
          className="hidden sm:block absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero.jpg')" }}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(15, 23, 42, 0.72)' }} />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-2 leading-tight px-2 sm:px-0">
            Find your perfect stay
          </h1>
          <p className="text-white/80 text-sm sm:text-lg mb-7 px-2 sm:px-0">
            Discover rooms, suites, and more at Kogelo Suites…
          </p>

          {/* Search bar */}
          <SearchWidget />

        </div>
      </section>

      {/* ═══ ROOMS PREVIEW ═══ */}
      <section className="py-20 bg-white">
        <div className="px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#16a34a' }}>Choose Your Space</p>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Our Rooms</h2>
              <p className="text-gray-500 mt-2">{properties.length} unit{properties.length !== 1 ? 's' : ''} available — studios to suites, all in one exclusive compound.</p>
            </div>
            <Link href="/stay/rooms" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold hover:gap-3 transition-all" style={{ color: '#16a34a' }}>
              View all rooms →
            </Link>
          </div>

          {properties.length > 0 ? (
            <div className="flex md:grid md:grid-cols-3 lg:grid-cols-4 gap-5 overflow-x-auto md:overflow-visible pb-4 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0 scrollbar-hide">
              {properties.slice(0, 8).map(p => <RoomCard key={p.id} property={p} wishlisted={wishlistIds.has(p.id)} onToggle={toggleWishlist} />)}
            </div>
          ) : (
            <div className="flex md:grid md:grid-cols-4 gap-5 overflow-x-auto md:overflow-visible pb-4 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0 scrollbar-hide">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex-shrink-0 w-72 md:w-auto bg-gray-100 rounded-2xl overflow-hidden animate-pulse">
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

      {/* ═══ POOLSIDE PROPERTIES ═══ */}
      {(() => {
        const poolside = properties.filter(p =>
          (p.amenities ?? []).some((a: string) => a.toLowerCase().includes('pool'))
        );
        if (poolside.length === 0) return null;
        return (
          <section className="py-20 px-4 sm:px-6" style={{ background: 'linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)' }}>
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#16a34a' }}>Swim & Unwind</p>
                  <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Poolside Properties</h2>
                  <p className="text-gray-500 mt-2">{poolside.length} unit{poolside.length !== 1 ? 's' : ''} with direct or shared pool access — wake up steps from the water.</p>
                </div>
                <Link href="/stay/rooms" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold hover:gap-3 transition-all" style={{ color: '#16a34a' }}>
                  View all rooms →
                </Link>
              </div>
              <div className="flex md:grid md:grid-cols-3 lg:grid-cols-4 gap-5 overflow-x-auto md:overflow-visible pb-4 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0 scrollbar-hide">
                {poolside.slice(0, 8).map(p => (
                  <RoomCard key={p.id} property={p} wishlisted={wishlistIds.has(p.id)} onToggle={toggleWishlist} />
                ))}
              </div>
              <div className="mt-8 text-center sm:hidden">
                <Link href="/stay/rooms" className="inline-flex items-center gap-2 py-3 px-8 rounded-xl text-sm font-bold text-white" style={{ background: '#16a34a' }}>
                  View All Rooms →
                </Link>
              </div>
            </div>
          </section>
        );
      })()}

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

            <div className="hidden md:grid md:grid-cols-2 overflow-hidden" style={{ minHeight: '480px' }}>
              {(featuredDishes.length > 0 ? featuredDishes : FALLBACK_DISHES).map((dish) => (
                <div key={dish.name} className="relative overflow-hidden">
                  <img
                    src={dish.image_url}
                    alt={dish.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 58%)' }} />
                  <div className="absolute top-2.5 left-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: dish.badge_color }}>
                      {dish.badge}
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">{dish.name}</p>
                      <p className="text-white/65 text-xs">{dish.description}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-black text-white flex-shrink-0" style={{ background: dish.badge_color }}>
                      KSh {Number(dish.price).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
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

      {/* ═══ Guest Reviews ═══ */}
      {reviews.length > 0 && (
        <section className="py-20 px-4 sm:px-6" style={{ background: '#f8fafc' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#16a34a' }}>Guest Stories</p>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900">What Our Guests Say</h2>
            </div>

            {/* Mobile: scroll-snap swipe carousel */}
            <div className="sm:hidden">
              <div
                ref={reviewScrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-2"
                onScroll={e => {
                  const w = e.currentTarget.children[0]?.clientWidth ?? e.currentTarget.offsetWidth;
                  if (w) setRevIdx(Math.round(e.currentTarget.scrollLeft / (w + 16)));
                }}
              >
                {reviews.map((r, i) => (
                  <div key={i} className="min-w-[85vw] snap-start flex-shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
                      <div className="flex gap-0.5 mb-3">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className="w-4 h-4" fill={j < r.rating ? '#F59E0B' : 'none'} stroke={j < r.rating ? '#F59E0B' : '#D1D5DB'} />
                        ))}
                      </div>
                      {r.comment && (
                        <p className="text-gray-700 text-sm leading-relaxed mb-4 flex-1 italic">&ldquo;{r.comment}&rdquo;</p>
                      )}
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{r.guest_name}</p>
                        {r.property_name && <p className="text-xs text-gray-400 mt-0.5">{r.property_name}{r.stay_dates ? ` · ${r.stay_dates}` : ''}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {reviews.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-4">
                  {reviews.map((_, i) => (
                    <button key={i}
                      onClick={() => {
                        const el = reviewScrollRef.current;
                        if (!el) return;
                        const w = (el.children[0]?.clientWidth ?? el.offsetWidth) + 16;
                        el.scrollTo({ left: i * w, behavior: 'smooth' });
                      }}
                      className={`rounded-full transition-all duration-300 ease-in-out ${i === revIdx ? 'w-5 h-1.5 bg-gray-900' : 'w-1.5 h-1.5 bg-gray-300'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop: 3-column grid (max 9) */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.slice(0, 9).map((r, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4" fill={j < r.rating ? '#F59E0B' : 'none'} stroke={j < r.rating ? '#F59E0B' : '#D1D5DB'} />
                    ))}
                  </div>
                  {r.comment && (
                    <p className="text-gray-700 text-sm leading-relaxed mb-4 flex-1 italic line-clamp-4">&ldquo;{r.comment}&rdquo;</p>
                  )}
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{r.guest_name}</p>
                    {r.property_name && <p className="text-xs text-gray-400 mt-0.5">{r.property_name}{r.stay_dates ? ` · ${r.stay_dates}` : ''}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ CTA ═══ */}
      <section className="py-24 px-4 sm:px-6 text-center" style={{ background: 'radial-gradient(ellipse at 50% 0%, #166534 0%, #0f172a 65%)' }}>
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
