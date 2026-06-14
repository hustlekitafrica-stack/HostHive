'use client';

import { useState, useRef } from 'react';
import { Star } from 'lucide-react';

type Review = {
  id: string;
  guest_name: string;
  property_name: string;
  stay_dates: string;
  rating: number;
  comment: string;
  submitted_at: string;
};

export default function ReviewsSectionClient({ reviews }: { reviews: Review[] }) {
  const [revIdx, setRevIdx] = useState(0);
  const reviewScrollRef = useRef<HTMLDivElement>(null);

  if (reviews.length === 0) return null;

  return (
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
  );
}
