'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Heart, Home as HomeIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Props {
  photos: string[];
  propertyName: string;
  propertyId: string;
  propertySlug: string;
}

export default function RoomDetailGallery({ photos, propertyName, propertyId, propertySlug }: Props) {
  const router = useRouter();
  const [photoIdx,    setPhotoIdx]    = useState(0);
  const [lightbox,    setLightbox]    = useState(false);
  const [mobileSlide, setMobileSlide] = useState(0);
  const [wishlisted,  setWishlisted]  = useState(false);
  const [wishLoading, setWishLoading] = useState(false);
  const swipeStartX = useRef(0);
  const swipeMoved  = useRef(false);

  const handleWishlist = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { router.push(`/stay/auth?redirect=/stay/rooms/${propertySlug}`); return; }
    setWishLoading(true);
    const res  = await fetch('/api/stay/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ property_id: propertyId }) });
    const data = await res.json();
    if (!res.ok) {
      alert(`Error: ${data.error || 'Failed to update wishlist'}`);
    } else {
      setWishlisted(data.wishlisted);
      alert(data.wishlisted ? 'Room saved to your wishlist' : 'Room removed from your wishlist');
    }
    setWishLoading(false);
  };

  return (
    <>
      {/* ── Mobile Gallery ── */}
      <div className="block sm:hidden relative">
        {photos.length > 0 ? (
          <div
            className="relative w-full h-[340px] overflow-hidden bg-gray-900 select-none touch-pan-y"
            onTouchStart={e => { swipeStartX.current = e.touches[0].clientX; swipeMoved.current = false; }}
            onTouchMove={e => { if (Math.abs(e.touches[0].clientX - swipeStartX.current) > 5) swipeMoved.current = true; }}
            onTouchEnd={e => {
              if (!swipeMoved.current) return;
              const dx = swipeStartX.current - e.changedTouches[0].clientX;
              if (Math.abs(dx) > 40) {
                setMobileSlide(prev => dx > 0 ? Math.min(photos.length - 1, prev + 1) : Math.max(0, prev - 1));
              }
              swipeMoved.current = false;
            }}
          >
            {photos.map((p, i) => (
              <div key={i} className="absolute inset-0 transition-transform duration-300 ease-in-out" style={{ transform: `translateX(${(i - mobileSlide) * 100}%)` }}>
                <img src={p} alt={propertyName} className="w-full h-full object-cover pointer-events-none" draggable={false} />
              </div>
            ))}
            <Link href="/stay/rooms" className="absolute top-16 left-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow z-20">
              <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </Link>
            <div className="absolute top-16 right-4 flex gap-2 z-20">
              <button className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow">
                <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
              </button>
              <button onClick={handleWishlist} disabled={wishLoading} className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow">
                <Heart className="w-4 h-4" style={{ color: '#16a34a' }} fill={wishlisted ? '#16a34a' : 'none'} />
              </button>
            </div>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20">
              {photos.length <= 12 ? (
                photos.map((_, i) => (
                  <button key={i} onClick={() => setMobileSlide(i)}
                    className={`rounded-full transition-all duration-200 ${i === mobileSlide ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
                    aria-label={`Photo ${i + 1}`} />
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

      {/* ── Title row (desktop) ── */}
      <div className="hidden sm:block max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-3">
        <Link href="/stay/rooms" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          All Rooms
        </Link>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">{propertyName}</h1>
          <div className="flex items-center gap-4 flex-shrink-0 mt-0.5">
            <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 underline hover:text-gray-900 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
              Share
            </button>
            <button onClick={handleWishlist} disabled={wishLoading}
              className="flex items-center gap-1.5 text-sm font-semibold underline transition-colors hover:opacity-80 disabled:opacity-50"
              style={{ color: wishlisted ? '#16a34a' : '#374151' }}>
              <Heart className="w-4 h-4" style={{ color: '#16a34a' }} fill={wishlisted ? '#16a34a' : 'none'} />
              {wishlisted ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Photo Grid (desktop) ── */}
      <div className="hidden sm:block max-w-7xl mx-auto px-4 sm:px-6">
        {photos.length > 0 ? (
          <div className="relative grid grid-cols-4 grid-rows-2 gap-1.5 rounded-xl overflow-hidden h-72 sm:h-[420px]">
            <div className="col-span-2 row-span-2 relative cursor-pointer" onClick={() => { setPhotoIdx(0); setLightbox(true); }}>
              <img src={photos[0]} alt={propertyName} className="w-full h-full object-cover hover:brightness-90 transition-all" />
            </div>
            {photos.slice(1, 5).map((url, i) => (
              <div key={i} className="relative cursor-pointer overflow-hidden" onClick={() => { setPhotoIdx(i + 1); setLightbox(true); }}>
                <img src={url} alt="" className="w-full h-full object-cover hover:brightness-90 transition-all" />
              </div>
            ))}
            {Array.from({ length: Math.max(0, 4 - photos.length + 1) }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-gray-200" />
            ))}
            <button onClick={() => { setPhotoIdx(0); setLightbox(true); }}
              className="absolute bottom-4 right-4 flex items-center gap-2 bg-white text-gray-900 text-sm font-semibold px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 shadow-md transition-colors z-10">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
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
    </>
  );
}
