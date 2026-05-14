'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Star, CheckCircle2, AlertCircle } from 'lucide-react';

type ReviewInfo = { guest_name: string; property_name: string; stay_dates: string; submitted: boolean };

function ReviewContent() {
  const params = useSearchParams();
  const token  = params.get('token') ?? '';

  const [info,       setInfo]       = useState<ReviewInfo | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [notFound,   setNotFound]   = useState(false);
  const [rating,     setRating]     = useState(0);
  const [hovered,    setHovered]    = useState(0);
  const [comment,    setComment]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    fetch(`/api/stay/reviews/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setNotFound(true);
        else { setInfo(d.review); if (d.review.submitted) setSuccess(true); }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    setError('');
    if (!rating) { setError('Please select a star rating.'); return; }
    setSubmitting(true);
    const res  = await fetch(`/api/stay/reviews/${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment }),
    });
    const data = await res.json();
    if (data.error) setError(data.error);
    else setSuccess(true);
    setSubmitting(false);
  };

  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFBF5]">
      <div className="animate-spin w-10 h-10 border-2 rounded-full" style={{ borderColor: '#9B1C1C', borderTopColor: 'transparent' }} />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFBF5] px-4 pt-16 text-center">
      <AlertCircle className="w-14 h-14 text-gray-300 mb-4" />
      <h2 className="text-xl font-black text-gray-900 mb-2">Review link not found</h2>
      <p className="text-sm text-gray-400 mb-6">This link may have expired or is invalid.</p>
      <Link href="/stay" className="text-sm font-bold text-white px-6 py-3 rounded-xl" style={{ background: '#9B1C1C' }}>Back to Home</Link>
    </div>
  );

  if (success) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFBF5] px-4 pt-16 text-center">
      <CheckCircle2 className="w-16 h-16 mb-5" style={{ color: '#9B1C1C' }} />
      <h2 className="text-2xl font-black text-gray-900 mb-2">Thank you{info?.guest_name ? `, ${info.guest_name.split(' ')[0]}` : ''}!</h2>
      <p className="text-gray-500 text-sm mb-2">Your review has been submitted and will be featured on our website.</p>
      {Array.from({ length: rating || 5 }).map((_, i) => (
        <Star key={i} className="inline-block w-5 h-5 mb-4" fill="#F59E0B" stroke="#F59E0B" />
      ))}
      <Link href="/stay" className="block text-sm font-bold text-white px-8 py-3 rounded-xl mt-2" style={{ background: '#9B1C1C' }}>Back to Home</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFBF5] pt-16">
      <div className="py-10 px-4 sm:px-6 text-center" style={{ background: 'linear-gradient(160deg, #1A0800, #4a1010)' }}>
        <h1 className="text-2xl font-black text-white">Leave a Review</h1>
        <p className="text-white/60 mt-1 text-sm">Share your experience at Kogelo</p>
      </div>

      <div className="max-w-md mx-auto px-4 py-10 space-y-6">
        {/* Stay info */}
        {info && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-sm space-y-1">
            {info.property_name && <p className="font-black text-gray-900">{info.property_name}</p>}
            {info.stay_dates && <p className="text-gray-500">{info.stay_dates}</p>}
          </div>
        )}

        {/* Rating */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 text-center">How was your stay?</p>
          <div className="flex justify-center gap-2 mb-2">
            {[1,2,3,4,5].map(s => (
              <button key={s} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)} onClick={() => setRating(s)}>
                <Star
                  className="w-10 h-10 transition-all"
                  fill={(hovered || rating) >= s ? '#F59E0B' : 'none'}
                  stroke={(hovered || rating) >= s ? '#F59E0B' : '#D1D5DB'}
                />
              </button>
            ))}
          </div>
          {(hovered || rating) > 0 && (
            <p className="text-center text-sm font-bold text-amber-600">{LABELS[hovered || rating]}</p>
          )}
        </div>

        {/* Comment */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <label className="block text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Your Comments <span className="normal-case font-normal text-gray-400">(optional)</span></label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4}
            placeholder="Tell us about your room, the service, the food, what you loved…"
            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-800 resize-none transition-colors" />
        </div>

        {error && <p className="text-sm text-red-600 font-semibold text-center">{error}</p>}

        <button onClick={handleSubmit} disabled={submitting || !rating}
          className="w-full py-4 rounded-2xl text-base font-black text-white disabled:opacity-40 transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #9B1C1C, #4a1010)' }}>
          {submitting ? 'Submitting…' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#FFFBF5]"><div className="animate-spin w-10 h-10 border-2 rounded-full" style={{ borderColor: '#9B1C1C', borderTopColor: 'transparent' }} /></div>}>
      <ReviewContent />
    </Suspense>
  );
}
