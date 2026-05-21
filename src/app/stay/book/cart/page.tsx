'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, ShoppingCart, Home as HomeIcon } from 'lucide-react';

type CartItem = { property: any; qty: number };

export default function CartPage() {
  const [cart, setCart]     = useState<CartItem[]>([]);
  const [meta, setMeta]     = useState<{ checkIn: string; checkOut: string; guests: number } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const c = sessionStorage.getItem('roomCart');
      const m = sessionStorage.getItem('roomCartMeta');
      if (c) setCart(JSON.parse(c));
      if (m) setMeta(JSON.parse(m));
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  const save = (next: CartItem[]) => {
    setCart(next);
    sessionStorage.setItem('roomCart', JSON.stringify(next));
  };

  const setQty = (id: string, qty: number) => {
    if (qty <= 0) { save(cart.filter(c => c.property.id !== id)); return; }
    save(cart.map(c => c.property.id === id ? { ...c, qty } : c));
  };

  const nights = meta?.checkIn && meta?.checkOut && meta.checkOut > meta.checkIn
    ? Math.round((new Date(meta.checkOut).getTime() - new Date(meta.checkIn).getTime()) / 86400000)
    : 0;

  const totalRooms = cart.reduce((s, c) => s + c.qty, 0);
  const total      = cart.reduce((s, c) => s + Number(c.property.nightly_rate || 0) * (nights || 1) * c.qty, 0);

  const fmt = (d: string) => {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleCheckout = () => {
    if (!meta) return;
    sessionStorage.setItem('roomCart', JSON.stringify(cart));
    sessionStorage.setItem('roomCartMeta', JSON.stringify(meta));
    const q = new URLSearchParams({
      fromCart: 'true',
      checkIn:  meta.checkIn,
      checkOut: meta.checkOut,
      guests:   String(meta.guests),
    });
    window.location.href = `/stay/book/group?${q.toString()}`;
  };

  if (!loaded) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full" />
    </div>
  );

  if (cart.length === 0) return (
    <div className="min-h-screen bg-[#f8fafc] pt-5 sm:pt-20 flex flex-col items-center justify-center px-4">
      <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
      <h2 className="text-xl font-black text-gray-900 mb-2">Your cart is empty</h2>
      <p className="text-sm text-gray-500 mb-6">Add rooms from the rooms page to continue.</p>
      <Link href="/stay/rooms" className="text-sm font-bold text-white px-6 py-3 rounded-xl" style={{ background: '#16a34a' }}>
        Browse Rooms
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-5 sm:pt-16">

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-32 space-y-4">

        {/* Room rows */}
        {cart.map(({ property: p, qty }) => (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex gap-4 p-4">
            {/* Thumbnail */}
            <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
              {p.photos?.[0] ? (
                <img src={p.photos[0]} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f172a,#16a34a)' }}>
                  <HomeIcon className="w-8 h-8 text-white/40" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm truncate">{p.name}</h3>
                  <p className="text-xs text-gray-400 capitalize">{p.type || 'Room'}</p>
                </div>
                <button onClick={() => setQty(p.id, 0)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-end">
                <div className="text-right">
                  <p className="font-black text-gray-900 text-sm">
                    KSh {(Number(p.nightly_rate || 0) * (nights || 1)).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    KSh {Number(p.nightly_rate || 0).toLocaleString()} / night{nights > 1 ? ` × ${nights} nights` : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Summary card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
          <h3 className="font-black text-gray-900">Order Summary</h3>
          {cart.map(({ property: p }) => (
            <div key={p.id} className="flex justify-between text-sm text-gray-600">
              <span className="truncate flex-1 mr-2">{p.name}</span>
              <span className="font-semibold text-gray-900 flex-shrink-0">
                KSh {(Number(p.nightly_rate || 0) * (nights || 1)).toLocaleString()}
              </span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-3 flex justify-between font-black text-gray-900 text-base">
            <span>Estimated Total</span>
            <span>KSh {total.toLocaleString()}</span>
          </div>
          <p className="text-xs text-gray-400">{totalRooms} room{totalRooms !== 1 ? 's' : ''} · {nights || '—'} night{(nights || 1) !== 1 ? 's' : ''} · Payment settled at property</p>
        </div>
      </div>

      {/* Sticky checkout bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 z-40" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-500">{totalRooms} room{totalRooms !== 1 ? 's' : ''}</p>
            <p className="font-black text-gray-900">KSh {total.toLocaleString()}</p>
          </div>
          <button onClick={handleCheckout}
            className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90" style={{ background: '#16a34a' }}>
            Proceed to Checkout →
          </button>
        </div>
      </div>
    </div>
  );
}
