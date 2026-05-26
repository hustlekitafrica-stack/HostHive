'use client';

import { useState, useRef } from 'react';
import { Home as HomeIcon } from 'lucide-react';

interface CardImageCarouselProps {
  photos: string[];
  alt?: string;
  height?: string;
}

export default function CardImageCarousel({ photos, alt = 'Room', height = 'h-48' }: CardImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number>(0);
  const swiping = useRef(false);

  const goTo = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent(Math.max(0, Math.min(photos.length - 1, idx)));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    swiping.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (Math.abs(e.touches[0].clientX - touchStartX.current) > 5) {
      swiping.current = true;
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
  };

  if (!photos?.length) {
    return (
      <div className={`${height} flex items-center justify-center`}
        style={{ background: 'linear-gradient(135deg, #0f172a, #16a34a)' }}>
        <HomeIcon className="w-12 h-12 text-white/50" />
      </div>
    );
  }

  return (
    <div
      className={`relative ${height} bg-gray-100 overflow-hidden touch-pan-y`}
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
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
          {photos.map((_, i) => (
            <button key={i} onClick={(e) => goTo(i, e)}
              className={`rounded-full transition-all duration-200 ${
                i === current ? 'bg-white w-4 h-1.5' : 'bg-white/50 w-1.5 h-1.5'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
