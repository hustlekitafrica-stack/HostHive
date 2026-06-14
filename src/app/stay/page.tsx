import Link from 'next/link';
import Image from 'next/image';
import SearchWidget from '@/components/stay/SearchWidget';
import {
  Waves, Utensils, Wifi, Car, Bell, Leaf, ShieldCheck, Sparkles,
  ChefHat, Home as HomeIcon, Phone, type LucideIcon,
} from 'lucide-react';
import { publicSupabase } from '@/lib/supabase/public';
import { fetchAvailableProperties } from '@/lib/stay/fetchProperties';
import RoomGridClient from '@/components/stay/home/RoomGridClient';
import ReviewsSectionClient from '@/components/stay/home/ReviewsSectionClient';

type Amenity = { Icon: LucideIcon; label: string; desc: string };
const AMENITIES: Amenity[] = [
  { Icon: Waves,       label: 'Swimming Pool',      desc: 'Relax in our pristine outdoor pool' },
  { Icon: Utensils,    label: 'Restaurant',         desc: 'Authentic Kenyan & continental cuisine' },
  { Icon: Wifi,        label: 'Free WiFi',           desc: 'High-speed internet throughout' },
  { Icon: Car,         label: 'Secure Parking',     desc: 'Ample guarded parking on-site' },
  { Icon: Bell,        label: 'Room Service',       desc: 'Order meals delivered to your room' },
  { Icon: Leaf,        label: 'Garden Lounge',      desc: 'Lush outdoor seating & relaxation' },
  { Icon: ShieldCheck, label: '24/7 Security',      desc: 'Manned gate with CCTV' },
  { Icon: Sparkles,    label: 'Daily Housekeeping', desc: 'Fresh linen and clean rooms every day' },
];

const FALLBACK_DISHES = [
  { image_url: '/images/chicken-pilau.jpg',     name: 'Chicken Pilau',     description: 'Spiced basmati rice',      price: 700, badge: "⭐ Chef's Pick",    badge_color: '#D97706' },
  { image_url: '/images/kienyeji-chicken.jpg',  name: 'Kienyeji Chicken',  description: 'Slow-cooked, rich sauce',  price: 600, badge: '🌿 Traditional',    badge_color: '#16a34a' },
  { image_url: '/images/bbq-chicken-wings.jpg', name: 'BBQ Chicken Wings', description: 'Smoky, sticky & charred', price: 600, badge: '🔥 Fan Favourite',  badge_color: '#dc2626' },
  { image_url: '/images/tilapia.jpg',           name: 'Whole Tilapia',     description: 'In rich tomato sauce',     price: 800, badge: '🐟 Lake Fresh',     badge_color: '#0369a1' },
];

export default async function StayHomePage() {
  const hostId = process.env.STAY_HOST_USER_ID;

  const [properties, reviewsResult, dishesResult, ratingResult] = await Promise.all([
    fetchAvailableProperties(),
    (async () => {
      let q = publicSupabase
        .from('reviews')
        .select('id, guest_name, property_name, stay_dates, rating, comment, submitted_at')
        .eq('submitted', true)
        .order('submitted_at', { ascending: false })
        .limit(9);
      const { data } = await q;
      return data ?? [];
    })(),
    (async () => {
      let q = publicSupabase
        .from('featured_dishes')
        .select('id, name, description, price, image_url, badge, badge_color, sort_order')
        .eq('is_active', true)
        .order('sort_order')
        .order('created_at');
      if (hostId) q = (q as any).eq('user_id', hostId);
      const { data } = await q;
      return data ?? [];
    })(),
    (async () => {
      const { data } = await publicSupabase
        .from('property_reviews')
        .select('rating')
        .not('rating', 'is', null);
      if (!data || data.length === 0) return null;
      const avg = data.reduce((s, r) => s + (r.rating ?? 0), 0) / data.length;
      return { avg: Math.round(avg * 10) / 10, count: data.length };
    })(),
  ]);

  const dishes = dishesResult.length > 0 ? dishesResult : FALLBACK_DISHES;
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://kogelosuites.com';
  const aggregateRatingLd = ratingResult ? {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    '@id': `${BASE_URL}/stay`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: ratingResult.avg,
      reviewCount: ratingResult.count,
      bestRating: 5,
      worstRating: 1,
    },
  } : null;
  const poolside = properties.filter(p =>
    (p.amenities ?? []).some((a: string) => a.toLowerCase().includes('pool'))
  );

  return (
    <>
      {aggregateRatingLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRatingLd) }}
        />
      )}
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden w-full flex flex-col justify-center min-h-[260px] sm:min-h-[520px] pt-[36px] pb-10 px-4 sm:px-8 sm:pt-32 sm:pb-20">
        <Image src="/images/hero.jpg" alt="" aria-hidden fill priority className="object-cover z-0" />
        <div className="absolute inset-0 z-[1]" style={{ background: 'rgba(0,0,0,0.50)' }} />
        <div className="max-w-5xl mx-auto relative z-[2]">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black mb-2 leading-tight px-2 sm:px-0 text-white">
            Find your perfect stay
          </h1>
          <p className="text-sm sm:text-lg mb-7 px-2 sm:px-0 text-white/80">
            Discover rooms, suites, and more at Kogelo Suites…
          </p>
          <SearchWidget />
        </div>
      </section>

      <div className="bg-[#f8fafc]">

        {/* ═══ ROOMS PREVIEW ═══ */}
        <section className="py-20 bg-white">
          <div className="px-4 sm:px-6 max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#16a34a' }}>Choose Your Space</p>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Our Rooms</h2>
                <p className="text-gray-500 mt-2">
                  {properties.length} unit{properties.length !== 1 ? 's' : ''} available — studios to suites, all in one exclusive compound.
                </p>
              </div>
              <Link href="/stay/rooms" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold hover:gap-3 transition-all" style={{ color: '#16a34a' }}>
                View all rooms →
              </Link>
            </div>
            <RoomGridClient properties={properties} />
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
        {poolside.length > 0 && (
          <section className="py-20 px-4 sm:px-6" style={{ background: 'linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)' }}>
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#16a34a' }}>Swim & Unwind</p>
                  <h2 className="text-3xl sm:text-4xl font-black text-gray-900">Poolside Properties</h2>
                  <p className="text-gray-500 mt-2">
                    {poolside.length} unit{poolside.length !== 1 ? 's' : ''} with direct or shared pool access — wake up steps from the water.
                  </p>
                </div>
                <Link href="/stay/rooms" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold hover:gap-3 transition-all" style={{ color: '#16a34a' }}>
                  View all rooms →
                </Link>
              </div>
              <RoomGridClient properties={poolside} />
            </div>
          </section>
        )}

        {/* ═══ DINING ═══ */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-3xl overflow-hidden grid md:grid-cols-2" style={{ background: '#0f172a' }}>
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
              <div className="hidden md:grid md:grid-cols-2 gap-2 p-2" style={{ minHeight: '480px' }}>
                {dishes.map((dish: any) => (
                  <div key={dish.name} className="relative overflow-hidden rounded-2xl">
                    <img src={dish.image_url} alt={dish.name} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 58%)' }} />
                    <div className="absolute top-2.5 left-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: dish.badge_color }}>{dish.badge}</span>
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

        {/* ═══ GUEST REVIEWS ═══ */}
        <ReviewsSectionClient reviews={reviewsResult} />

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
    </>
  );
}
