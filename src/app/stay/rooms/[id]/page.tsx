'use client';

import { useState, useEffect, Suspense, use, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { BedDouble, Droplets, Users, Home as HomeIcon, MapPin, Clock, Check, ShieldOff, PawPrint, VolumeX, DoorOpen, Search, Heart, type LucideIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// ── Date helpers ──────────────────────────────────────────────────────────────
const CAL_DAY  = ['S','M','T','W','T','F','S'];
const CAL_MON  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function daysInMo(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDayMo(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function isoStr(d: Date) { return d.toISOString().split('T')[0]; }
function fmtShort(d: string) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
}

// ── InlinePicker ──────────────────────────────────────────────────────────────
function fmtLong(d: string) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
interface InlinePickerProps {
  checkIn: string; checkOut: string;
  activeField: 'in' | 'out';
  city?: string;
  onSelect: (field: 'in' | 'out', date: string) => void;
  onClear: () => void;
  onClose: () => void;
}
function InlinePicker({ checkIn, checkOut, activeField, city, onSelect, onClear, onClose }: InlinePickerProps) {
  const [offset, setOffset] = useState(0);
  const ref   = useRef<HTMLDivElement>(null);
  const today = isoStr(new Date());
  const now   = new Date();

  const nights = checkIn && checkOut && checkOut > checkIn
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) : 0;

  const headerTitle = nights > 0
    ? `${nights} night${nights !== 1 ? 's' : ''}${city ? ` in ${city}` : ''}`
    : activeField === 'in' ? 'Select check-in date' : 'Select checkout date';

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  function renderMonth(year: number, month: number) {
    const fd   = firstDayMo(year, month);
    const days = daysInMo(year, month);
    return (
      <div key={`${year}-${month}`} className="flex-1 min-w-0">
        <div className="grid grid-cols-7 mb-3">
          {CAL_DAY.map((d, i) => (
            <div key={i} className="text-center text-xs font-semibold text-gray-400 py-1 tracking-wide">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: fd }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1;
            const ds  = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const isPast  = ds < today;
            const isCI    = ds === checkIn;
            const isCO    = ds === checkOut;
            const inRange = !!(checkIn && checkOut && ds > checkIn && ds < checkOut);
            return (
              <button key={day} disabled={isPast} onClick={() => !isPast && onSelect(activeField, ds)}
                className={['relative h-11 w-full flex items-center justify-center transition-colors',
                  isPast ? 'cursor-not-allowed' : 'cursor-pointer',
                  inRange ? 'bg-green-50' : '',
                ].join(' ')}>
                {isPast ? (
                  <span className="line-through text-gray-300 text-sm select-none">{day}</span>
                ) : (isCI || isCO) ? (
                  <>
                    <span className="absolute w-10 h-10 rounded-full" style={{ background: '#16a34a' }} />
                    <span className="relative text-white font-bold text-sm">{day}</span>
                  </>
                ) : (
                  <span className="relative font-medium text-gray-900 text-sm w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">{day}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const leftD  = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const rightD = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 p-7 w-[700px]">
      {/* Header */}
      <div className="mb-5">
        <h3 className="text-xl font-bold text-gray-900 leading-tight">{headerTitle}</h3>
        {checkIn && checkOut && nights > 0 && (
          <p className="text-sm mt-1 font-medium" style={{ color: '#0d9488' }}>
            {fmtLong(checkIn)} – {fmtLong(checkOut)}
          </p>
        )}
      </div>
      {/* Month nav + grids */}
      <div className="flex items-start gap-2">
        <button onClick={() => setOffset(o => Math.max(0, o - 1))} disabled={offset === 0}
          className="mt-5 p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-20 flex-shrink-0">
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="flex gap-8 flex-1">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-center mb-3 text-gray-900">{CAL_MON[leftD.getMonth()]} {leftD.getFullYear()}</p>
            {renderMonth(leftD.getFullYear(), leftD.getMonth())}
          </div>
          <div className="w-px bg-gray-100 self-stretch" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-center mb-3 text-gray-900">{CAL_MON[rightD.getMonth()]} {rightD.getFullYear()}</p>
            {renderMonth(rightD.getFullYear(), rightD.getMonth())}
          </div>
        </div>
        <button onClick={() => setOffset(o => o + 1)}
          className="mt-5 p-1.5 rounded-full hover:bg-gray-100 flex-shrink-0">
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 9h20M8 2v3M16 2v3"/>
        </svg>
        <button onClick={onClear} className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">Clear dates</button>
      </div>
    </div>
  );
}

// ── ReviewsSection ────────────────────────────────────────────────────────────
const CAT_RATINGS = [
  { label: 'Cleanliness',    score: 4.9, icon: (<svg className="w-5 h-5 mx-auto mt-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75a.75.75 0 00-1.5 0v.75H6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 006 22.5h12a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018 4.5h-2.25V3.75a.75.75 0 00-1.5 0v.75h-4.5V3.75z"/></svg>) },
  { label: 'Accuracy',       score: 4.8, icon: (<svg className="w-5 h-5 mx-auto mt-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>) },
  { label: 'Check-in',       score: 4.9, icon: (<svg className="w-5 h-5 mx-auto mt-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>) },
  { label: 'Communication',  score: 4.8, icon: (<svg className="w-5 h-5 mx-auto mt-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>) },
  { label: 'Location',       score: 4.8, icon: (<svg className="w-5 h-5 mx-auto mt-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/></svg>) },
  { label: 'Value',          score: 4.8, icon: (<svg className="w-5 h-5 mx-auto mt-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z"/></svg>) },
];
const FILTER_TAGS = [
  { label: 'Cleanliness', count: 8,  emoji: '🧹' },
  { label: 'Walkability', count: 6,  emoji: '🚶' },
  { label: 'Location',    count: 5,  emoji: '📍' },
  { label: 'Comfort',     count: 4,  emoji: '🛋️' },
  { label: 'Hospitality', count: 3,  emoji: '😊' },
  { label: 'Amenities',   count: 2,  emoji: '✨' },
];
const STAR_DIST = [7, 3, 1, 1, 0];
const MOCK_REVIEWS = [
  { name: 'James M.',  initials: 'JM', years: '2 years',  date: 'April 2026',    stay: 'Stayed a few nights', text: "Excellent property! The room was spotlessly clean and exactly as described. The host was very responsive and friendly throughout our stay. Great location close to everything you need..." },
  { name: 'Amina W.',  initials: 'AW', years: '1 year',   date: 'March 2026',    stay: 'Stayed with family',  text: "Wonderful experience! Great for families with everything provided. Check-in was smooth and the host was incredibly helpful and welcoming. The room was spacious and comfortable..." },
  { name: 'Peter K.',  initials: 'PK', years: '3 years',  date: 'February 2026', stay: 'Stayed about a week', text: "Fantastic property in a great location. Amenities were top-notch and everything was very clean. The host goes above and beyond to make guests feel at home. Will definitely return..." },
  { name: 'Grace O.',  initials: 'GO', years: '2 years',  date: 'January 2026',  stay: 'Stayed a few nights', text: "Beautiful property with great views. The host was incredibly welcoming and made sure we had everything we needed. Room was immaculate and the bed was extremely comfortable..." },
];
const OVERALL_RATING = 4.92;
const REVIEW_COUNT   = 12;

function ReviewsSection({ propertyId, propertyName }: { propertyId?: string; propertyName?: string }) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [expanded,     setExpanded]     = useState<number[]>([]);
  const [realReviews,  setRealReviews]  = useState<any[] | null>(null);
  const maxBar = Math.max(...STAR_DIST);

  useEffect(() => {
    if (!propertyId) return;
    fetch(`/api/stay/property-reviews?property_id=${propertyId}`)
      .then(r => r.json())
      .then(d => setRealReviews(d.reviews ?? []))
      .catch(() => setRealReviews([]));
  }, [propertyId]);

  const reviews = realReviews && realReviews.length > 0
    ? realReviews.map((r: any) => ({
        name: r.reviewer_name,
        initials: r.reviewer_name.split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase(),
        years: '',
        date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        text: r.comment,
      }))
    : MOCK_REVIEWS;

  const overallRating = realReviews && realReviews.length > 0
    ? Number((realReviews.reduce((s: number, r: any) => s + r.rating, 0) / realReviews.length).toFixed(2))
    : OVERALL_RATING;
  const reviewCount = realReviews && realReviews.length > 0 ? realReviews.length : REVIEW_COUNT;

  return (
    <div className="pt-8 border-t border-gray-100">

      {/* ── Mobile: compact rating row ── */}
      <div className="md:hidden flex items-center justify-between mb-5 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 fill-gray-900" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <span className="text-base font-bold text-gray-900">{overallRating}</span>
          <span className="text-sm text-gray-500">· {reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
        </div>
        {propertyId && (
          <Link href={`/stay/reviews/new?property_id=${propertyId}&property_name=${encodeURIComponent(propertyName ?? '')}`}
            className="text-sm font-semibold underline text-gray-700 hover:text-gray-900 transition-colors">
            Write a review
          </Link>
        )}
      </div>

      {/* ── Desktop: star + count header + breakdown ── */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 fill-gray-900" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            <span className="text-xl font-bold text-gray-900">{overallRating} · {reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
          </div>
          {propertyId && (
            <Link href={`/stay/reviews/new?property_id=${propertyId}&property_name=${encodeURIComponent(propertyName ?? '')}`}
              className="text-sm font-semibold underline text-gray-700 hover:text-gray-900 transition-colors">
              Write a review
            </Link>
          )}
        </div>
        <p className="text-xs text-gray-400 underline cursor-pointer mb-6">How reviews work</p>
        <div className="flex flex-wrap gap-8 mb-6 pb-6 border-b border-gray-100">
          <div className="min-w-[110px]">
            <p className="text-xs font-semibold text-gray-700 mb-2">Overall rating</p>
            {STAR_DIST.map((count, i) => (
              <div key={i} className="flex items-center gap-2 mb-1.5">
                <span className="text-xs text-gray-500 w-2">{5 - i}</span>
                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-900 rounded-full" style={{ width: `${maxBar > 0 ? (count / maxBar) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
          {CAT_RATINGS.map(c => (
            <div key={c.label} className="text-center min-w-[70px]">
              <p className="text-xs font-semibold text-gray-700 mb-1">{c.label}</p>
              <p className="text-xl font-bold text-gray-900">{c.score}</p>
              {c.icon}
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile: section heading ── */}
      <p className="md:hidden text-base font-bold text-gray-900 mb-3">Guest reviews mention</p>

      {/* Filter chips — horizontal scroll on mobile, wrap on desktop */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide md:flex-wrap md:overflow-visible">
          {FILTER_TAGS.map((t: any) => (
            <button key={t.label}
              onClick={() => setActiveFilter((f: string | null) => f === t.label ? null : t.label)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${
                activeFilter === t.label
                  ? 'text-white border-transparent'
                  : 'border-gray-200 text-gray-700 hover:border-green-400'
              }`}
              style={activeFilter === t.label ? { background: '#16a34a', borderColor: '#16a34a' } : {}}>
              {t.emoji && <span className="text-base leading-none">{t.emoji}</span>}
              {t.label}
              <span className={activeFilter === t.label ? 'text-white/70' : 'text-gray-400'}>{t.count}</span>
            </button>
          ))}
      </div>

      {/* Review cards — horizontal scroll on mobile, 2-col grid on desktop */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide md:overflow-visible md:grid md:grid-cols-2 md:gap-8 md:pb-0">
          {reviews.map((r, i) => {
            const isExpanded = expanded.includes(i);
            const SHORT = 150;
            return (
              <div key={i} className="flex-shrink-0 w-[82vw] snap-start rounded-2xl border border-gray-100 bg-white p-4 md:w-auto md:rounded-none md:border-0 md:bg-transparent md:p-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: '#16a34a' }}>
                    {r.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.years} staying here</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <svg key={j} className="w-3 h-3 fill-gray-900" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">· {r.date}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {isExpanded || r.text.length <= SHORT ? r.text.replace('...', '') : r.text.slice(0, SHORT) + '...'}
                </p>
                {r.text.length > SHORT && (
                  <button
                    onClick={() => setExpanded(prev => isExpanded ? prev.filter(x => x !== i) : [...prev, i])}
                    className="text-sm font-bold underline text-gray-900 mt-1 hover:text-gray-600">
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ── Amenity icon map ─────────────────────────────────────────────────────────
const IC = 'w-6 h-6 flex-shrink-0';
const AMENITY_MAP: { keywords: string[]; svg: React.ReactNode }[] = [
  { keywords: ['wifi','wi-fi','internet','wireless','broadband'],
    svg: <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg> },
  { keywords: ['kitchen','cook','dining','microwave','oven','fridge','refrigerator'],
    svg: <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3v7"/></svg> },
  { keywords: ['tv','television','netflix','cable','screen','projector'],
    svg: <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="13" rx="2"/><path strokeLinecap="round" d="M8 7L12 3l4 4"/></svg> },
  { keywords: ['parking','garage','car park'],
    svg: <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
  { keywords: ['washer','washing','laundry','dryer'],
    svg: <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="12" cy="13" r="5"/><path strokeLinecap="round" d="M8 5h.01M11 5h.01"/></svg> },
  { keywords: ['air con','ac','a/c','climate','cooling','heating','heat'],
    svg: <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9.59 4.59A2 2 0 1011 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1019.5 12H2"/></svg> },
  { keywords: ['pool','swim','hot tub','jacuzzi'],
    svg: <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" d="M2 12c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0M2 18c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0"/><circle cx="7" cy="6" r="2"/><path strokeLinecap="round" d="M7 8v3"/></svg> },
  { keywords: ['gym','fitness','workout','exercise'],
    svg: <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 4v16M18 4v16M3 8h3M18 8h3M3 16h3M18 16h3M9 12h6"/></svg> },
  { keywords: ['bath','tub','bathtub'],
    svg: <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6V3a1 1 0 011-1h1a1 1 0 011 1v1M4 10h16v2a6 6 0 01-6 6H10a6 6 0 01-6-6v-2zM2 18h20M6 22l1-4M18 22l-1-4"/></svg> },
  { keywords: ['workspace','desk','office','work','laptop'],
    svg: <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="14" rx="2"/><path strokeLinecap="round" d="M8 22h8M12 18v4"/></svg> },
  { keywords: ['garden','yard','lawn','outdoor','patio','terrace','balcony'],
    svg: <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2a7 7 0 017 7c0 3.87-3.13 7-7 7s-7-3.13-7-7a7 7 0 017-7z"/><path strokeLinecap="round" d="M12 9v13M9 12l3-3 3 3"/></svg> },
  { keywords: ['view','skyline','city','mountain','sea','ocean','lake','river'],
    svg: <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path strokeLinecap="round" d="M2 13l5-5 4 4 3-3 8 5"/></svg> },
  { keywords: ['security','camera','cctv','safe','lock','alarm'],
    svg: <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> },
  { keywords: ['breakfast','coffee','tea','meals'],
    svg: <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg> },
  { keywords: ['elevator','lift'],
    svg: <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><path strokeLinecap="round" d="M9 10l3-3 3 3M9 14l3 3 3-3"/></svg> },
  { keywords: ['pet','animal','dog','cat'],
    svg: <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"/></svg> },
  { keywords: ['towel','linen','bedding','sheets'],
    svg: <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v2H4V4zm0 4h16v12H4V8zm4 3h8M8 15h5"/></svg> },
];
function getAmenityIcon(name: string): React.ReactNode {
  const lower = name.toLowerCase();
  for (const entry of AMENITY_MAP) {
    if (entry.keywords.some(k => lower.includes(k))) return entry.svg;
  }
  return (
    <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
    </svg>
  );
}

function RoomDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [checkIn,  setCheckIn]  = useState(params.get('checkIn')  ?? today);
  const [checkOut, setCheckOut] = useState(params.get('checkOut') ?? tomorrow);
  const [adults,   setAdults]   = useState(Number(params.get('guests') ?? 1));
  const [children, setChildren] = useState(0);
  const [infants,  setInfants]  = useState(0);
  const [pets,     setPets]     = useState(0);
  const [rooms,    setRooms]    = useState(1);
  const [showPicker,     setShowPicker]     = useState<'in' | 'out' | null>(null);
  const [showGuestPanel, setShowGuestPanel] = useState(false);
  const [wishlisted,     setWishlisted]     = useState(false);
  const [wishLoading,    setWishLoading]    = useState(false);
  const [mobileSlide,    setMobileSlide]    = useState(0);
  const swipeStartX = useRef(0);
  const guests = adults + children;

  useEffect(() => {
    fetch(`/api/stay/properties/${id}`)
      .then(r => r.json())
      .then(d => setProperty(d.property ?? null))
      .finally(() => setLoading(false));
    fetch('/api/stay/wishlist')
      .then(r => r.json())
      .then(d => setWishlisted((d.property_ids ?? []).includes(id)));
  }, [id]);

  const handleWishlist = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { router.push(`/stay/auth?redirect=/stay/rooms/${id}`); return; }
    setWishLoading(true);
    const res = await fetch('/api/stay/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ property_id: id }) });
    const data = await res.json();
    setWishlisted(data.wishlisted);
    setWishLoading(false);
  };

  const nights = checkIn && checkOut && checkOut > checkIn
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) : 0;
  const rate = Number(property?.nightly_rate ?? 0);
  const total = rate * nights * rooms;

  const handleBook = () => {
    router.push(`/stay/checkout?propertyId=${id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${adults + children}&rooms=${rooms}`);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="animate-spin w-10 h-10 border-2 rounded-full border-t-transparent" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!property) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc] pt-20">
      <Search className="w-16 h-16 text-gray-300" />
      <h2 className="text-2xl font-bold text-gray-900">Room not found</h2>
      <Link href="/stay/rooms" className="text-sm font-bold text-white px-6 py-3 rounded-xl" style={{ background: '#16a34a' }}>Back to Rooms</Link>
    </div>
  );

  const photos: string[] = property.photos?.length ? property.photos : [];
  const amenities: string[] = property.amenities ?? [];

  const HOUSE_RULES = [
    { Icon: Clock,     label: `Check-in from ${property.check_in_time ?? '14:00'}` },
    { Icon: DoorOpen,  label: `Check-out by ${property.check_out_time ?? '11:00'}` },
    property.house_rules?.noSmoking  && { Icon: ShieldOff, label: 'No smoking' },
    property.house_rules?.noPets     && { Icon: PawPrint,  label: 'No pets' },
    property.house_rules?.noParties  && { Icon: VolumeX,   label: 'No parties / events' },
    property.house_rules?.quietHours && { Icon: VolumeX,   label: 'Quiet hours after 10pm' },
  ].filter(Boolean) as { Icon: LucideIcon; label: string }[];

  return (
    <div className="min-h-screen bg-[#f8fafc] overflow-x-hidden">

      {/* ── Mobile Gallery (full-width, sm:hidden) ── */}
      <div className="block sm:hidden relative">
        {photos.length > 0 ? (
          <div
            className="relative w-full h-[340px] overflow-hidden bg-gray-900 select-none"
            onTouchStart={e => { swipeStartX.current = e.touches[0].clientX; }}
            onTouchEnd={e => {
              const diff = swipeStartX.current - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 40) {
                if (diff > 0) setMobileSlide(s => Math.min(photos.length - 1, s + 1));
                else setMobileSlide(s => Math.max(0, s - 1));
              }
            }}
          >
            <img
              src={photos[mobileSlide]}
              alt={property.name}
              className="w-full h-full object-cover pointer-events-none"
            />
            {/* Back */}
            <Link href="/stay/rooms" className="absolute top-16 left-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow z-20">
              <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </Link>
            {/* Share + Heart */}
            <div className="absolute top-16 right-4 flex gap-2 z-20">
              <button className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow">
                <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
              </button>
              <button onClick={handleWishlist} disabled={wishLoading} className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow">
                <Heart className="w-4 h-4" style={{ color: '#16a34a' }} fill={wishlisted ? '#16a34a' : 'none'} />
              </button>
            </div>
            {/* Dots / counter */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-1.5 z-20">
              {photos.length <= 12 ? (
                photos.map((_, i) => (
                  <div key={i} className={`rounded-full transition-all duration-200 ${
                    i === mobileSlide ? 'w-2 h-2 bg-white shadow-md' : 'w-1.5 h-1.5 bg-white/50'
                  }`} />
                ))
              ) : (
                <div className="bg-black/60 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {mobileSlide + 1} / {photos.length}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full h-[340px] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a, #16a34a)' }}>
            <HomeIcon className="w-16 h-16 text-white/40" />
          </div>
        )}
      </div>

      {/* ── Mobile Hero Info ── */}
      <div className="block sm:hidden bg-white px-4 pt-5 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{property.name}</h1>
        <p className="text-sm text-gray-600 mb-0.5">
          {property.type ? `Entire ${property.type} in` : 'Property in'} {[property.city, 'Kenya'].filter(Boolean).join(', ')}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          {property.max_guests ?? 2} guest{(property.max_guests ?? 2) !== 1 ? 's' : ''} · 
          {property.bedrooms ?? 1} bedroom{(property.bedrooms ?? 1) !== 1 ? 's' : ''} · 
          {property.bathrooms ?? 1} bath{(property.bathrooms ?? 1) !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-3 py-3 border-t border-b border-gray-100 mb-3">
          <div>
            <p className="text-base font-bold text-gray-900">4.92</p>
            <p className="text-yellow-400 text-sm leading-none">★★★★★</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center flex-1">
            <p className="text-xs font-bold text-gray-800">Guest favorite</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-right">
            <p className="text-base font-bold text-gray-900">12</p>
            <p className="text-xs text-gray-500">Reviews</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full px-4 py-2 w-fit" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: '#16a34a' }}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1" fill="currentColor"/></svg>
          <span className="text-sm font-semibold" style={{ color: '#16a34a' }}>Prices include all fees</span>
        </div>
      </div>

      {/* ── Title row (above gallery, desktop only) ── */}
      <div className="hidden sm:block max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-3">
        <Link href="/stay/rooms" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          All Rooms
        </Link>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">{property.name}</h1>
          <div className="flex items-center gap-4 flex-shrink-0 mt-0.5">
            <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 underline hover:text-gray-900 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
              Share
            </button>
            <button
              onClick={handleWishlist}
              disabled={wishLoading}
              className="flex items-center gap-1.5 text-sm font-semibold underline transition-colors hover:opacity-80 disabled:opacity-50"
              style={{ color: wishlisted ? '#16a34a' : '#374151' }}>
              <Heart
                className="w-4 h-4 transition-all"
                style={{ color: '#16a34a' }}
                fill={wishlisted ? '#16a34a' : 'none'}
              />
              {wishlisted ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Photo Gallery (desktop only) ── */}
      <div className="hidden sm:block max-w-7xl mx-auto px-4 sm:px-6">
        {photos.length > 0 ? (
          <div className="relative grid grid-cols-4 grid-rows-2 gap-1.5 rounded-xl overflow-hidden h-72 sm:h-[420px]">
            <div className="col-span-2 row-span-2 relative cursor-pointer" onClick={() => { setPhotoIdx(0); setLightbox(true); }}>
              <img src={photos[0]} alt={property.name} className="w-full h-full object-cover hover:brightness-90 transition-all" />
            </div>
            {photos.slice(1, 5).map((url, i) => (
              <div key={i} className="relative cursor-pointer overflow-hidden" onClick={() => { setPhotoIdx(i + 1); setLightbox(true); }}>
                <img src={url} alt="" className="w-full h-full object-cover hover:brightness-90 transition-all" />
              </div>
            ))}
            {Array.from({ length: Math.max(0, 4 - photos.length + 1) }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-gray-200" />
            ))}
            {/* Show all photos button */}
            <button
              onClick={() => { setPhotoIdx(0); setLightbox(true); }}
              className="absolute bottom-4 right-4 flex items-center gap-2 bg-white text-gray-900 text-sm font-semibold px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 shadow-md transition-colors z-10">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              Show all photos
            </button>
          </div>
        ) : (
          <div className="h-72 sm:h-[420px] rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a, #16a34a)' }}>
            <HomeIcon className="w-20 h-20 text-white/40" />
          </div>
        )}
      </div>

      {/* ── Below-gallery info bar (desktop only) ── */}
      <div className="hidden sm:flex max-w-7xl mx-auto px-4 sm:px-6 py-4 flex-wrap items-center justify-between gap-3 overflow-hidden">
        <div>
          <p className="text-base font-semibold text-gray-900">
            {(property.type ? property.type.charAt(0).toUpperCase() + property.type.slice(1) : 'Room')} in {[property.city, property.county, 'Kenya'].filter(Boolean).join(', ')}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {property.max_guests ?? 2} guest{(property.max_guests ?? 2) !== 1 ? 's' : ''} · 
            {property.bedrooms ?? 1} bedroom{(property.bedrooms ?? 1) !== 1 ? 's' : ''} · 
            {property.bathrooms ?? 1} bath{(property.bathrooms ?? 1) !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full px-4 py-2 flex-shrink-0" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: '#16a34a' }}>
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1" fill="currentColor"/>
          </svg>
          <span className="text-sm font-semibold" style={{ color: '#16a34a' }}>Prices include all fees</span>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={() => setLightbox(false)}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <button className="absolute left-4 text-white/80 hover:text-white" onClick={e => { e.stopPropagation(); setPhotoIdx(i => (i - 1 + photos.length) % photos.length); }}>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <img src={photos[photoIdx]} alt="" className="max-w-4xl max-h-[85vh] w-full object-contain px-16" onClick={e => e.stopPropagation()} />
          <button className="absolute right-4 text-white/80 hover:text-white" onClick={e => { e.stopPropagation(); setPhotoIdx(i => (i + 1) % photos.length); }}>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
          <div className="absolute bottom-4 text-white/60 text-sm">{photoIdx + 1} / {photos.length}</div>
        </div>
      )}

      {/* ── Content + Booking Sidebar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-32 lg:pb-12">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* Left — details */}
          <div className="lg:col-span-2 space-y-8">

            {/* Location detail */}
            <div className="pb-4 border-b border-gray-100">
              <p className="text-gray-500 flex items-center gap-1.5 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#16a34a' }} />
                {[property.location, property.city, property.county].filter(Boolean).join(', ')}
              </p>
            </div>

            {/* Description */}
            {property.description && (
              <div>
                <h2 className="text-lg font-black text-gray-900 mb-3">About this room</h2>
                <p className="text-gray-600 leading-relaxed">{property.description}</p>
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="pt-6 border-t border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">What this place offers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
                  {(amenities.slice(0, 10)).map(a => (
                    <div key={a} className="flex items-center gap-4 text-gray-800">
                      <span className="text-gray-600">{getAmenityIcon(a)}</span>
                      <span className="text-sm text-gray-800">{a}</span>
                    </div>
                  ))}
                </div>
                {amenities.length > 10 && (
                  <button
                    onClick={() => {}}
                    className="mt-6 px-5 py-2.5 border-2 border-gray-800 rounded-lg text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors">
                    Show all {amenities.length} amenities
                  </button>
                )}
              </div>
            )}

            {/* House rules */}
            {HOUSE_RULES.length > 0 && (
              <div>
                <h2 className="text-lg font-black text-gray-900 mb-4">House Rules</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {HOUSE_RULES.map(r => (
                    <div key={r.label} className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-3">
                      <r.Icon className="w-4 h-4" style={{ color: '#16a34a' }} />{r.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancellation */}
            {property.cancellation_policy && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <h2 className="text-sm font-black text-gray-900 mb-1">
                  Cancellation Policy — {(property.cancellation_policy).charAt(0).toUpperCase() + property.cancellation_policy.slice(1)}
                </h2>
                <p className="text-sm text-gray-600">
                  {property.cancellation_policy === 'flexible'  && 'Free cancellation up to 24 hours before check-in.'}
                  {property.cancellation_policy === 'moderate'  && 'Free cancellation up to 5 days before check-in.'}
                  {property.cancellation_policy === 'strict'    && 'No refund once booking is confirmed.'}
                  {property.cancellation_policy === 'non-refundable' && 'This rate is non-refundable.'}
                </p>
              </div>
            )}

            {/* Reviews */}
            <ReviewsSection propertyId={id} propertyName={property.name} />
          </div>

          {/* Right — Airbnb-style booking widget (desktop only) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 relative">

                {/* Header */}
                {nights > 0 ? (
                  <div className="mb-5">
                    <span className="text-2xl font-black text-gray-900">KSh {rate.toLocaleString()}</span>
                    <span className="text-gray-500 text-sm"> / night</span>
                  </div>
                ) : (
                  <h3 className="text-xl font-bold text-gray-900 mb-5">Add dates for prices</h3>
                )}

                {/* Date + Guests fields */}
                <div className="rounded-xl border-2 border-gray-300 overflow-visible mb-4">
                  {/* Check-in / Checkout row — relative so picker anchors here */}
                  <div className="relative">
                    <div className="grid grid-cols-2">
                      <button
                        onClick={() => setShowPicker(v => v === 'in' ? null : 'in')}
                        className={`px-3 py-3 text-left border-r border-gray-200 transition-colors ${
                          showPicker === 'in' ? 'outline outline-2 -outline-offset-2 rounded-tl-xl' : ''
                        }`}
                        style={showPicker === 'in' ? { outlineColor: '#16a34a' } : {}}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">Check-in</p>
                        <p className={`text-sm font-semibold ${checkIn ? 'text-gray-900' : 'text-gray-400'}`}>
                          {checkIn ? fmtShort(checkIn) : 'Add date'}
                        </p>
                      </button>
                      <button
                        onClick={() => setShowPicker(v => v === 'out' ? null : 'out')}
                        className={`px-3 py-3 text-left transition-colors ${
                          showPicker === 'out' ? 'outline outline-2 -outline-offset-2 rounded-tr-xl' : ''
                        }`}
                        style={showPicker === 'out' ? { outlineColor: '#16a34a' } : {}}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">Checkout</p>
                        <p className={`text-sm font-semibold ${checkOut ? 'text-gray-900' : 'text-gray-400'}`}>
                          {checkOut ? fmtShort(checkOut) : 'Add date'}
                        </p>
                      </button>
                    </div>

                    {/* Inline date picker — anchored right below the date row */}
                    {showPicker && (
                      <InlinePicker
                        checkIn={checkIn} checkOut={checkOut}
                        activeField={showPicker}
                        city={property.city ?? property.county ?? ''}
                        onSelect={(field, date) => {
                          if (field === 'in') {
                            setCheckIn(date);
                            if (date >= checkOut) setCheckOut('');
                            setShowPicker('out');
                          } else {
                            setCheckOut(date);
                            setShowPicker(null);
                          }
                        }}
                        onClear={() => { setCheckIn(''); setCheckOut(''); setShowPicker(null); }}
                        onClose={() => setShowPicker(null)}
                      />
                    )}
                  </div>

                  {/* Guests row */}
                  <div className="relative">
                    <button
                      onClick={() => setShowGuestPanel(v => !v)}
                      className={`w-full border-t border-gray-200 px-3 py-3 flex items-center justify-between text-left transition-colors ${
                        showGuestPanel ? 'outline outline-2 -outline-offset-2 rounded-b-xl' : ''
                      }`}
                      style={showGuestPanel ? { outlineColor: '#16a34a' } : {}}>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">Guests</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {guests} guest{guests !== 1 ? 's' : ''}
                          {infants > 0 ? `, ${infants} infant${infants !== 1 ? 's' : ''}` : ''}
                          {pets > 0 ? `, ${pets} pet${pets !== 1 ? 's' : ''}` : ''}
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-gray-500 flex-shrink-0 transition-transform" style={{ transform: showGuestPanel ? 'rotate(180deg)' : 'none' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
                    </button>

                    {/* Guest breakdown panel */}
                    {showGuestPanel && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 p-5">
                        {([
                          { label: 'Adults',   sub: 'Age 13+',     val: adults,   set: setAdults,   min: 1, max: property.max_guests ?? 10 },
                          { label: 'Children', sub: 'Ages 2–12',   val: children, set: setChildren, min: 0, max: property.max_guests ?? 10 },
                          { label: 'Infants',  sub: 'Under 2',     val: infants,  set: setInfants,  min: 0, max: 5 },
                          { label: 'Pets',     sub: 'Bringing a service animal?', val: pets, set: setPets, min: 0, max: 5 },
                        ] as const).map(row => (
                          <div key={row.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                            <div>
                              <p className="text-sm font-bold text-gray-900">{row.label}</p>
                              <p className="text-xs font-medium" style={{ color: '#16a34a' }}>{row.sub}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => (row.set as React.Dispatch<React.SetStateAction<number>>)(v => Math.max(row.min, v - 1))}
                                disabled={row.val <= row.min}
                                className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-lg font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{ borderColor: '#16a34a', color: '#16a34a' }}>
                                −
                              </button>
                              <span className="w-5 text-center text-sm font-semibold text-gray-900">{row.val}</span>
                              <button
                                onClick={() => (row.set as React.Dispatch<React.SetStateAction<number>>)(v => Math.min(row.max, v + 1))}
                                disabled={row.val >= row.max || (row.label !== 'Infants' && row.label !== 'Pets' && adults + children >= (property.max_guests ?? 10))}
                                className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-lg font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{ borderColor: '#16a34a', color: '#16a34a' }}>
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                        <p className="text-xs mt-3 mb-3" style={{ color: '#16a34a' }}>
                          This place has a maximum of {property.max_guests ?? 10} guests, not including infants.
                        </p>
                        <div className="flex justify-end">
                          <button onClick={() => setShowGuestPanel(false)} className="text-sm font-bold text-gray-900 underline hover:text-gray-600">Close</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price breakdown */}
                {nights > 0 && (
                  <div className="border-t border-gray-100 pt-4 space-y-2 text-sm mb-4">
                    <div className="flex justify-between text-gray-600">
                      <span>KSh {rate.toLocaleString()} × {nights} night{nights !== 1 ? 's' : ''}{rooms > 1 ? ` × ${rooms} rooms` : ''}</span>
                      <span>KSh {total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-black text-gray-900 pt-2 border-t border-gray-100 text-base">
                      <span>Total</span>
                      <span>KSh {total.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* CTA */}
                <button onClick={handleBook}
                  className="w-full py-3.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: '#16a34a' }}>
                  {nights > 0 ? 'Reserve' : 'Check availability'}
                </button>
                <p className="text-xs text-center text-gray-400 mt-3">No payment now — we'll confirm within 2 hours.</p>
              </div>
            </div>
          </div>

        </div>
      </div>


      {/* ── Mobile sticky booking bar ── */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white"
        style={{ boxShadow: '0 -2px 16px rgba(0,0,0,0.10)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-gray-900">KSh {rate.toLocaleString()}</span>
              <span className="text-sm text-gray-500">/ night</span>
            </div>
            {nights > 0 ? (
              <p className="text-xs text-gray-500 truncate">
                {fmtShort(checkIn)} – {fmtShort(checkOut)} · {nights} night{nights !== 1 ? 's' : ''}
                {total > 0 && <> · <span className="font-semibold">KSh {total.toLocaleString()}</span> total</>}
              </p>
            ) : (
              <p className="text-xs text-gray-400">Add dates for total price</p>
            )}
          </div>
          <button
            onClick={handleBook}
            className="flex-shrink-0 px-6 py-3 rounded-full text-sm font-bold text-white transition-all active:scale-95"
            style={{ background: '#16a34a' }}
          >
            {nights > 0 ? 'Reserve' : 'Check availability'}
          </button>
        </div>
      </div>

    </div>
  );
}

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-2 rounded-full border-t-transparent" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} /></div>}>
      <RoomDetailContent id={id} />
    </Suspense>
  );
}
