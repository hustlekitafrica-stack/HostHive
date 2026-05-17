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
  const ref = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!ref.current) return;
    const idx = Math.round(ref.current.scrollLeft / ref.current.offsetWidth);
    setCurrent(idx);
  };

  const goTo = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!ref.current) return;
    ref.current.scrollTo({ left: idx * ref.current.offsetWidth, behavior: 'smooth' });
    setCurrent(idx);
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
    <div className={`relative ${height} bg-gray-100`}>
      <div
        ref={ref}
        onScroll={handleScroll}
        className="flex h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide">
        {photos.map((src, i) => (
          <div key={i} className="flex-shrink-0 w-full h-full snap-center">
            <img src={src} alt={`${alt} ${i + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
      {photos.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
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
