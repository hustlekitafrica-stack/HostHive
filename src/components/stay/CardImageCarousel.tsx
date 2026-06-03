'use client';

import { useState, useRef, useEffect } from 'react';
import { Home as HomeIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface CardImageCarouselProps {
  photos: string[];
  alt?: string;
  height?: string;
}

export default function CardImageCarousel({ photos, alt = 'Room', height = 'h-48' }: CardImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const swiping = useRef(false);
  const isHorizontal = useRef(false);

  const goTo = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent(Math.max(0, Math.min(photos.length - 1, idx)));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    swiping.current = false;
    isHorizontal.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dx > 5 || dy > 5) {
      isHorizontal.current = dx > dy;
      if (isHorizontal.current) swiping.current = true;
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!swiping.current) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) {
      setCurrent(prev =>
        dx > 0
          ? Math.min(photos.length - 1, prev + 1)
          : Math.max(0, prev - 1)
      );
    }
    swiping.current = false;
    isHorizontal.current = false;
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleTouchMove = (e: TouchEvent) => {
      if (isHorizontal.current) e.preventDefault();
    };
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', handleTouchMove);
  }, []);

  if (!photos?.length) {
    return (
      <div className={`${height} flex items-center justify-center`}
        style={{ background: 'linear-gradient(135deg, #0f172a, #16a34a)' }}>
        <HomeIcon className="w-12 h-12 text-white/50" />
      </div>
    );
  }

  const prev = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setCurrent(c => Math.max(0, c - 1)); };
  const next = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setCurrent(c => Math.min(photos.length - 1, c + 1)); };

  return (
    <div
      ref={containerRef}
      className={`group/carousel relative ${height} bg-gray-100 overflow-hidden touch-pan-y`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {photos.map((src, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(${(i - current) * 100}%)` }}
        >
          <img src={src} alt={`${alt} ${i + 1}`} className="w-full h-full object-cover" draggable={false} />
        </div>
      ))}
      {photos.length > 1 && (
        <>
          {/* Prev arrow */}
          <button
            onClick={prev}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow transition-opacity duration-200 ${
              current === 0 ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover/carousel:opacity-100'
            }`}
          >
            <ChevronLeft className="w-4 h-4 text-gray-800" />
          </button>
          {/* Next arrow */}
          <button
            onClick={next}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow transition-opacity duration-200 ${
              current === photos.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover/carousel:opacity-100'
            }`}
          >
            <ChevronRight className="w-4 h-4 text-gray-800" />
          </button>
          {/* Dot indicators */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
            {photos.map((_, i) => (
              <button key={i} onClick={(e) => goTo(i, e)}
                className={`rounded-full transition-all duration-200 ${
                  i === current ? 'bg-white w-4 h-1.5' : 'bg-white/50 w-1.5 h-1.5'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
