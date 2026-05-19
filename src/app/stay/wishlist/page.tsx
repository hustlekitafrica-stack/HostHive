'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BedDouble, Droplets, Users, Heart, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import CardImageCarousel from '@/components/stay/CardImageCarousel';

export default function WishlistPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [authed,     setAuthed]     = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        router.replace('/stay/auth?redirect=/stay/wishlist');
        return;
      }
      setAuthed(true);

      // Fetch wishlist IDs client-side (avoids server-side session cookie issues)
      const { data: wishlistRows } = await supabase
        .from('guest_wishlists')
        .select('property_id')
        .eq('user_id', session.user.id);

      const ids = (wishlistRows ?? []).map((r: any) => r.property_id);

      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch all properties and filter to wishlisted ones
      const res = await fetch('/api/stay/properties');
      const d = await res.json();
      const all = d.properties ?? [];
      setProperties(all.filter((p: any) => ids.includes(p.id)));
      setLoading(false);
    });
  }, [router]);

  async function removeFromWishlist(propertyId: string) {
    setProperties(prev => prev.filter(p => p.id !== propertyId));
    await fetch('/api/stay/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property_id: propertyId }),
    });
  }

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-5 sm:pt-20 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <Link href="/stay/rooms" className="inline-flex items-center text-gray-400 hover:text-gray-700 transition-colors mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#f0fdf4' }}>
              <Heart className="w-5 h-5" style={{ color: '#16a34a' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Saved Properties</h1>
              <p className="text-sm text-gray-500 mt-0.5">{properties.length} saved</p>
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-52 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: '#f0fdf4' }}>
              <Heart className="w-10 h-10" style={{ color: '#16a34a' }} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No saved properties yet</h2>
            <p className="text-gray-500 mb-6 max-w-xs">Tap the heart on any room to save it here for later.</p>
            <Link href="/stay/rooms"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ background: '#16a34a' }}>
              <Search className="w-4 h-4" /> Browse Rooms
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {properties.map(p => (
              <div key={p.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 relative">
                <div className="relative">
                  <CardImageCarousel photos={p.photos ?? []} alt={p.name} height="h-52" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold text-white capitalize z-10" style={{ background: '#16a34a' }}>
                    {p.type || 'Room'}
                  </div>
                  {/* Remove from wishlist */}
                  <button
                    onClick={() => removeFromWishlist(p.id)}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110"
                    style={{ background: '#16a34a' }}
                    title="Remove from wishlist">
                    <Heart className="w-4 h-4 text-white fill-white" />
                  </button>
                </div>
                <Link href={`/stay/rooms/${p.id}`} className="block p-4">
                  <h3 className="font-bold text-gray-900 mb-1 truncate">{p.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> {p.bedrooms ?? 1}</span>
                    <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> {p.bathrooms ?? 1}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.max_guests ?? 2}</span>
                  </div>
                  {p.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {p.amenities.slice(0, 3).map((a: string) => (
                        <span key={a} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{a}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <div>
                      <span className="font-black text-gray-900 text-base">KSh {Number(p.nightly_rate || 0).toLocaleString()}</span>
                      <span className="text-xs text-gray-400"> / night</span>
                    </div>
                    <span className="text-xs font-bold text-white px-3 py-1.5 rounded-lg" style={{ background: '#16a34a' }}>
                      View Room
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
