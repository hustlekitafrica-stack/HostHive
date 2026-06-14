'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const CAT_RATINGS = [
  { label: 'Cleanliness',   score: 4.9, icon: (<svg className="w-5 h-5 mx-auto mt-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75a.75.75 0 00-1.5 0v.75H6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 006 22.5h12a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018 4.5h-2.25V3.75a.75.75 0 00-1.5 0v.75h-4.5V3.75z"/></svg>) },
  { label: 'Accuracy',      score: 4.8, icon: (<svg className="w-5 h-5 mx-auto mt-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>) },
  { label: 'Check-in',      score: 4.9, icon: (<svg className="w-5 h-5 mx-auto mt-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>) },
  { label: 'Communication', score: 4.8, icon: (<svg className="w-5 h-5 mx-auto mt-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>) },
  { label: 'Location',      score: 4.8, icon: (<svg className="w-5 h-5 mx-auto mt-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/></svg>) },
  { label: 'Value',         score: 4.8, icon: (<svg className="w-5 h-5 mx-auto mt-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z"/></svg>) },
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

function ReviewCard({ r, short = 150 }: { r: any; short?: number }) {
  const [expanded, setExpanded] = useState(false);
  const rating = Number(r.rating ?? 5);
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: '#16a34a' }}>{r.initials}</div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
          {r.stay && <p className="text-xs text-gray-400">{r.stay}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mb-3">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, j) => (
            <svg key={j} className={`w-3 h-3 ${j < rating ? 'fill-amber-400' : 'fill-gray-200'}`} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          ))}
        </div>
        <span className="text-xs text-gray-400">· {r.date}</span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed flex-1">
        {expanded || r.text.length <= short ? r.text : r.text.slice(0, short) + '…'}
      </p>
      {r.text.length > short && (
        <button onClick={() => setExpanded(v => !v)} className="text-sm font-bold underline text-gray-900 mt-2 self-start hover:text-gray-600">
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

export default function RoomDetailReviews({ propertyId, propertyName }: { propertyId?: string; propertyName?: string }) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [slide,        setSlide]        = useState(0);
  const [rawReviews,   setRawReviews]   = useState<any[] | null>(null);
  const maxBar = Math.max(...STAR_DIST);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!propertyId) return;
    fetch(`/api/stay/reviews?property_id=${propertyId}`)
      .then(r => r.json())
      .then(d => setRawReviews(d.reviews ?? []))
      .catch(() => setRawReviews([]));
  }, [propertyId]);

  const reviews = (rawReviews ?? []).map((r: any) => ({
    name: r.guest_name || 'Guest',
    initials: (r.guest_name || 'G').split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase(),
    stay: r.stay_dates || '',
    date: r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
    rating: r.rating ?? 5,
    text: r.comment || '',
  }));

  const overallRating = reviews.length > 0
    ? Number((reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)) : 0;
  const reviewCount = reviews.length;
  const clampedSlide = Math.min(slide, Math.max(0, reviews.length - 1));

  function scrollToSlide(i: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.offsetWidth, behavior: 'smooth' });
    setSlide(i);
  }

  if (rawReviews !== null && reviews.length === 0) {
    return (
      <div className="pt-8 border-t border-gray-100 text-center py-12">
        <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>
        <p className="text-sm font-semibold text-gray-500">No reviews yet</p>
        <p className="text-xs text-gray-400 mt-1">Be the first to review this property after your stay.</p>
      </div>
    );
  }

  if (rawReviews === null) return null;

  return (
    <div className="pt-8 border-t border-gray-100">
      <div className="md:hidden flex items-center justify-between mb-5 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 fill-amber-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
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

      <p className="md:hidden text-base font-bold text-gray-900 mb-3">Guest reviews mention</p>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide md:flex-wrap md:overflow-visible">
        {FILTER_TAGS.map((t: any) => (
          <button key={t.label}
            onClick={() => setActiveFilter((f: string | null) => f === t.label ? null : t.label)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${
              activeFilter === t.label ? 'text-white border-transparent' : 'border-gray-200 text-gray-700 hover:border-green-400'
            }`}
            style={activeFilter === t.label ? { background: '#16a34a', borderColor: '#16a34a' } : {}}>
            {t.emoji && <span className="text-base leading-none">{t.emoji}</span>}
            {t.label}
            <span className={activeFilter === t.label ? 'text-white/70' : 'text-gray-400'}>{t.count}</span>
          </button>
        ))}
      </div>

      <div className="md:hidden">
        <div ref={scrollRef} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide rounded-2xl"
          onScroll={e => { const w = e.currentTarget.offsetWidth; if (w) setSlide(Math.round(e.currentTarget.scrollLeft / w)); }}>
          {reviews.map((r, i) => (
            <div key={i} className="min-w-full snap-start"><ReviewCard r={r} /></div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 px-1">
          <button onClick={() => scrollToSlide(Math.max(0, clampedSlide - 1))} disabled={clampedSlide === 0}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center transition-colors disabled:opacity-30 hover:border-gray-400" aria-label="Previous review">
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="flex items-center gap-1.5">
            {reviews.map((_, i) => (
              <button key={i} onClick={() => scrollToSlide(i)} aria-label={`Go to review ${i + 1}`}
                className={`rounded-full transition-all duration-200 ${i === clampedSlide ? 'w-5 h-2 bg-gray-900' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'}`} />
            ))}
          </div>
          <button onClick={() => scrollToSlide(Math.min(reviews.length - 1, clampedSlide + 1))} disabled={clampedSlide === reviews.length - 1}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center transition-colors disabled:opacity-30 hover:border-gray-400" aria-label="Next review">
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">{clampedSlide + 1} of {reviews.length}</p>
      </div>

      <div className="hidden md:grid md:grid-cols-2 md:gap-6">
        {reviews.map((r, i) => <ReviewCard key={i} r={r} />)}
      </div>
    </div>
  );
}
