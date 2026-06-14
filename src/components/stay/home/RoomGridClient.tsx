'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import CardImageCarousel from '@/components/stay/CardImageCarousel';
import type { StayProperty } from '@/lib/stay/fetchProperties';
import { toRoomSlug } from '@/lib/stay/roomSlug';

function RoomCard({ property, wishlisted, onToggle }: {
  property: StayProperty;
  wishlisted: boolean;
  onToggle: (e: React.MouseEvent, id: string) => void;
}) {
  const beds = property.bedrooms ?? 1;
  const badge = beds === 0 ? 'Studio' : beds === 1 ? '1 Bedroom' : `${beds} Bedrooms`;
  return (
    <Link href={`/stay/rooms/${toRoomSlug(property.name, property.id)}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <div className="relative aspect-[4/5]">
          <CardImageCarousel photos={property.photos ?? []} alt={property.name} height="h-full" />
          <div className="absolute top-2 left-2 z-10 bg-white rounded-lg px-1.5 py-0.5 shadow-sm sm:top-3 sm:left-3 sm:rounded-xl sm:px-3 sm:py-1.5">
            <span className="text-[10px] font-bold text-gray-900 sm:text-sm">{badge}</span>
          </div>
        </div>
        <div className="flex items-center justify-between px-2 py-2 gap-1 sm:px-3 sm:py-3 sm:gap-2">
          <p className="font-semibold text-gray-900 text-[11px] truncate min-w-0 sm:text-sm">{property.name}</p>
          <span className="flex-shrink-0 bg-gray-100 rounded-full px-2 py-0.5 text-[10px] font-medium text-gray-600 whitespace-nowrap sm:px-4 sm:py-1.5 sm:text-sm">
            See details
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function RoomGridClient({ properties }: { properties: StayProperty[] }) {
  const router = useRouter();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [wishPending, setWishPending] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/stay/wishlist')
      .then(r => r.json())
      .then(d => setWishlistIds(new Set(d.property_ids ?? [])))
      .catch(() => {});
  }, []);

  const toggleWishlist = useCallback(async (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { router.push('/stay/auth?redirect=/stay'); return; }
    if (wishPending.has(propertyId)) return;
    setWishPending(prev => new Set(prev).add(propertyId));
    setWishlistIds(prev => { const s = new Set(prev); s.has(propertyId) ? s.delete(propertyId) : s.add(propertyId); return s; });
    const res = await fetch('/api/stay/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ property_id: propertyId }) });
    const data = await res.json();
    if (!res.ok) {
      alert(`Error: ${data.error || 'Failed to update wishlist'}`);
      setWishlistIds(prev => { const s = new Set(prev); s.has(propertyId) ? s.delete(propertyId) : s.add(propertyId); return s; });
    } else {
      alert(data.wishlisted ? 'Room saved to your wishlist' : 'Room removed from your wishlist');
    }
    setWishPending(prev => { const s = new Set(prev); s.delete(propertyId); return s; });
  }, [router, wishPending]);

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">No rooms available right now</h3>
        <p className="text-gray-500 text-sm max-w-xs">All units are currently occupied. Please check back soon or contact us directly.</p>
        <a href="tel:+254700000000" className="mt-6 inline-flex items-center gap-2 py-2.5 px-6 rounded-xl text-sm font-bold text-white" style={{ background: '#16a34a' }}>
          Contact Us
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-5 md:overflow-visible md:pb-0">
        {properties.slice(0, 8).map(p => (
          <div key={p.id} className="flex-shrink-0 w-[46vw] sm:w-56 md:w-auto">
            <RoomCard property={p} wishlisted={wishlistIds.has(p.id)} onToggle={toggleWishlist} />
          </div>
        ))}
      </div>
      <div className="mt-8 text-center sm:hidden">
        <Link href="/stay/rooms" className="inline-flex items-center gap-2 py-3 px-8 rounded-xl text-sm font-bold text-white" style={{ background: '#16a34a' }}>
          View All Rooms →
        </Link>
      </div>
    </>
  );
}
