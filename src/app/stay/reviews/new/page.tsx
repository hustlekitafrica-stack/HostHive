'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

const CATS = [
  { key: 'cleanliness',    label: 'Cleanliness',    desc: 'Was the space clean and well maintained?' },
  { key: 'accuracy',       label: 'Accuracy',        desc: 'Did the listing match the description?' },
  { key: 'checkin',        label: 'Check-in',        desc: 'How smooth was the check-in process?' },
  { key: 'communication',  label: 'Communication',   desc: 'Was the host responsive and helpful?' },
  { key: 'location_score', label: 'Location',        desc: 'How was the location and surroundings?' },
  { key: 'value_score',    label: 'Value',           desc: 'Was the price fair for what you received?' },
];

const OVERALL_LABELS = ['', 'Horrible', 'Below expectations', 'Okay', 'Good', 'Amazing!'];

function StarRow({ label, desc, value, onChange }: {
  label: string; desc: string; value: number; onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} type="button"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(i)}>
            <svg className="w-7 h-7 transition-transform hover:scale-110" viewBox="0 0 24 24"
              fill={i <= active ? '#16a34a' : 'none'}
              stroke={i <= active ? '#16a34a' : '#d1d5db'} strokeWidth="1.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

function WriteReviewContent() {
  const router      = useRouter();
  const params      = useSearchParams();
  const propertyId   = params.get('property_id') ?? '';
  const propertyName = decodeURIComponent(params.get('property_name') ?? 'this property');

  const [overall,    setOverall]    = useState(0);
  const [hoverAll,   setHoverAll]   = useState(0);
  const [cats,       setCats]       = useState<Record<string, number>>({});
  const [comment,    setComment]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState(false);
  const [ready,      setReady]      = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        const redirect = encodeURIComponent(`/stay/reviews/new?property_id=${propertyId}&property_name=${encodeURIComponent(propertyName)}`);
        router.replace(`/stay/auth?redirect=${redirect}`);
      } else {
        setReady(true);
      }
    });
  }, []);

  const activeAll = hoverAll || overall;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!propertyId) { setError('Could not determine which property to review. Please go back and try again.'); return; }
    if (overall === 0) { setError('Please select an overall rating.'); return; }
    if (!comment.trim()) { setError('Please write a review.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/stay/property-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propertyId, rating: overall, ...cats, comment }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit review');
      setSuccess(true);
      setTimeout(() => {
        router.push(propertyId ? `/stay/rooms/${propertyId}` : '/stay/rooms');
      }, 2200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 rounded-full border-t-transparent" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!propertyId) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-base font-semibold text-red-600 mb-4">No property selected.</p>
        <p className="text-sm text-gray-500 mb-6">Please navigate to a property listing and use the &quot;Write a review&quot; link from there.</p>
        <Link href="/stay/rooms" className="text-sm font-semibold underline text-gray-700">Browse properties</Link>
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: '#f0fdf4' }}>
          <svg className="w-8 h-8" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
        <p className="text-sm text-gray-500">Your review has been submitted. Redirecting back to the property…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pt-16 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Back */}
        <Link
          href={propertyId ? `/stay/rooms/${propertyId}` : '/stay/rooms'}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Back
        </Link>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">How was your stay?</h1>
        <p className="text-sm text-gray-500 mb-8">
          {propertyName !== 'this property'
            ? `Share your experience at ${propertyName}`
            : 'Your honest feedback helps other guests make better decisions.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Overall star rating */}
          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-5">Overall rating</p>
            <div className="flex justify-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map(i => (
                <button key={i} type="button"
                  onMouseEnter={() => setHoverAll(i)}
                  onMouseLeave={() => setHoverAll(0)}
                  onClick={() => setOverall(i)}>
                  <svg className="w-12 h-12 transition-all duration-100 hover:scale-110" viewBox="0 0 24 24"
                    fill={i <= activeAll ? '#16a34a' : 'none'}
                    stroke={i <= activeAll ? '#16a34a' : '#d1d5db'} strokeWidth="1.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </button>
              ))}
            </div>
            {activeAll > 0 && (
              <p className="text-base font-bold" style={{ color: '#16a34a' }}>{OVERALL_LABELS[activeAll]}</p>
            )}
          </div>

          {/* Category ratings */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Rate each aspect <span className="text-gray-400 font-normal">(optional)</span></p>
            <div className="bg-white border border-gray-100 rounded-2xl px-4 divide-y divide-gray-50">
              {CATS.map(c => (
                <StarRow
                  key={c.key}
                  label={c.label}
                  desc={c.desc}
                  value={cats[c.key] ?? 0}
                  onChange={v => setCats(prev => ({ ...prev, [c.key]: v }))}
                />
              ))}
            </div>
          </div>

          {/* Written review */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">Your review</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value.slice(0, 1000))}
              rows={5}
              maxLength={1000}
              placeholder="Tell future guests about your experience — what you loved, what could be improved, and anything they should know before booking…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 resize-none focus:outline-none placeholder-gray-400 transition-colors"
              style={{ outlineColor: '#16a34a' }}
              onFocus={e => { e.target.style.borderColor = '#16a34a'; e.target.style.boxShadow = '0 0 0 2px #bbf7d0'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{comment.length} / 1000</p>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 font-medium bg-red-50 px-4 py-3 rounded-xl">{error}</p>
          )}

          {/* Submit */}
          <button type="submit" disabled={submitting || overall === 0}
            className="w-full py-4 rounded-xl text-white font-bold text-base transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#16a34a' }}>
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>

          <p className="text-xs text-center text-gray-400">
            By submitting, you agree that your review will be publicly visible on this listing.
          </p>
        </form>
      </div>
    </div>
  );
}

export default function WriteReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 rounded-full border-t-transparent" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} />
      </div>
    }>
      <WriteReviewContent />
    </Suspense>
  );
}
