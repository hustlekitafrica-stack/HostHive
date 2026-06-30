'use client';

import { useState, useReducer, useEffect, useRef, useCallback } from 'react';
import {
  ShoppingCart, MapPin, Phone, CheckCircle2, ArrowLeft,
  Star, Clock, Navigation, Loader2, Minus, Plus, X, ChevronRight, Bell,
} from 'lucide-react';
import { MENU_DATA, MENU_TABS, ORDER_PHONE, ROOM_SERVICE_FEE, DELIVERY_FEE, type MenuItem, type MenuCategory } from '@/lib/menu-data';

// ─── Types ────────────────────────────────────────────────────────────────────

type CartItem = MenuItem & { qty: number };
type CartAction =
  | { type: 'ADD'; item: MenuItem }
  | { type: 'REMOVE'; id: string }
  | { type: 'CLEAR' };
type OrderType = 'room_service' | 'dine_in' | 'delivery';
type View = 'menu' | 'checkout' | 'payment' | 'success';

// ─── Cart reducer ─────────────────────────────────────────────────────────────

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD': {
      const ex = state.find(i => i.id === action.item.id);
      if (ex) return state.map(i => i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...state, { ...action.item, qty: 1 }];
    }
    case 'REMOVE':
      return state.map(i => i.id === action.id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0);
    case 'CLEAR':
      return [];
  }
}

// ─── Tab emoji ────────────────────────────────────────────────────────────────

const TAB_EMOJI: Record<string, string> = {
  breakfast: '☕',
  mains:     '🍖',
  snacks:    '🍗',
  drinks:    '🥤',
  sides:     '🥗',
};

const CATEGORY_EMOJI: Record<string, string> = {
  healthy:    '🥘', 'trad-plate': '🍛', english:   '🍳', 'eng-plate': '🥚',
  mains:      '🍖', sharing:      '🍗', beverages: '☕', fruits:     '🍉',
  sides:      '🥗', vegetables:   '🌿',
};

// ─── Popular card (Uber Eats horizontal scroll card) ───────────────────────

type PopularItem = {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  badge: string;
  badgeColor: string;
  tabId?: string;
  tag?: 'popular' | 'special';
};

const TAB_GRADIENT: Record<string, string> = {
  breakfast: 'linear-gradient(135deg, #92400e, #D97706)',
  mains:     'linear-gradient(135deg, #14532d, #16a34a)',
  snacks:    'linear-gradient(135deg, #7c2d12, #ea580c)',
  drinks:    'linear-gradient(135deg, #0c4a6e, #0ea5e9)',
  sides:     'linear-gradient(135deg, #134e4a, #0f766e)',
};

function PopularCard({ item, qty, onAdd, onRemove }: {
  item: PopularItem;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const bg    = TAB_GRADIENT[item.tabId ?? ''] ?? TAB_GRADIENT.mains;
  const emoji = TAB_EMOJI[item.tabId ?? '']    ?? '🍽️';
  return (
    <div style={{ width: 158, flexShrink: 0 }} className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
      <div className="relative" style={{ height: 112 }}>
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: bg }}>
            {emoji}
          </div>
        )}
        <div
          className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-[10px] font-bold"
          style={{ background: item.badgeColor }}
        >
          {item.badge}
        </div>
      </div>
      <div className="p-3">
        <p className="font-bold text-sm text-gray-900 leading-tight line-clamp-1 mb-0.5">{item.name}</p>
        <div className="flex items-center gap-1 mb-2.5">
          <span className="text-xs font-semibold" style={{ color: '#16a34a' }}>KSh {item.price.toLocaleString()}</span>
          <span className="text-[10px] text-gray-300 mx-0.5">·</span>
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span className="text-[11px] text-gray-500">4.8</span>
        </div>
        {qty === 0 ? (
          <button onClick={onAdd} className="w-full py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#16a34a' }}>
            + Add
          </button>
        ) : (
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1">
            <button onClick={onRemove} style={{ color: '#16a34a' }}><Minus className="w-3 h-3" /></button>
            <span className="text-xs font-black text-gray-900">{qty}</span>
            <button onClick={onAdd} style={{ color: '#16a34a' }}><Plus className="w-3 h-3" /></button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Full menu card (2-col grid, Uber Eats card style) ─────────────────────────

function MenuCard({ item, qty, onAdd, onRemove, tabId }: {
  item: MenuItem; qty: number; onAdd: () => void; onRemove: () => void; tabId: string;
}) {
  const bg    = TAB_GRADIENT[tabId] ?? TAB_GRADIENT.mains;
  const emoji = CATEGORY_EMOJI[item.id.replace(/\d+$/, '')] ?? TAB_EMOJI[tabId] ?? '🍽️';
  const badge = item.tag === 'popular'
    ? { text: '⭐ Chef\'s Pick', bg: '#D97706',  color: '#fff' }
    : item.tag === 'special'
    ? { text: '🌿 Traditional',  bg: '#16a34a', color: '#fff' }
    : null;
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100" style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
      {/* Image area */}
      <div className="relative" style={{ height: 148 }}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: bg }}>
            {emoji}
          </div>
        )}
        {badge && (
          <div
            className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.text}
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-3">
        <p className="font-black text-gray-900 text-base leading-snug mb-1 line-clamp-2">{item.name}</p>
        <div className="flex items-center gap-1.5 mb-3">
          <span className="font-bold text-base" style={{ color: '#16a34a' }}>
            {item.price === 0 ? 'Free' : `KSh ${item.price.toLocaleString()}`}
          </span>
          {item.price > 0 && (
            <>
              <span className="text-gray-300 text-sm">·</span>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm text-gray-500">4.8</span>
            </>
          )}
        </div>
        {item.price > 0 && (
          qty === 0 ? (
            <button
              onClick={onAdd}
              className="w-full py-2.5 rounded-xl text-sm font-black text-white"
              style={{ background: '#16a34a' }}
            >
              + Add
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: '#16a34a' }}>
              <button onClick={onRemove} className="text-white"><Minus className="w-4 h-4" /></button>
              <span className="font-black text-white">{qty}</span>
              <button onClick={onAdd} className="text-white"><Plus className="w-4 h-4" /></button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─── Uber Eats–style menu item row ───────────────────────────────────────────

function ItemRow({
  item, qty, onAdd, onRemove,
}: { item: MenuItem; qty: number; onAdd: () => void; onRemove: () => void }) {
  const emoji = CATEGORY_EMOJI[item.id.replace(/\d+$/, '')] ?? '🍽️';
  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
      {/* Left: text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-gray-900 text-sm leading-snug">{item.name}</span>
          {item.tag === 'popular' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0" style={{ background: '#D97706' }}>Popular</span>
          )}
          {item.tag === 'special' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0" style={{ background: '#16a34a' }}>Special</span>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-gray-500 leading-snug line-clamp-2 mb-1">{item.description}</p>
        )}
        <span className="text-sm font-bold text-gray-800">
          {item.price === 0 ? 'Complimentary' : `KSh ${item.price.toLocaleString()}`}
        </span>
      </div>
      {/* Right: image + stepper */}
      {item.price > 0 && (
        <div className="relative flex-shrink-0">
          <div
            className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl"
            style={{ background: '#f1f5f9' }}
          >
            {emoji}
          </div>
          {qty === 0 ? (
            <button
              onClick={onAdd}
              className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md text-base font-bold"
              style={{ background: '#16a34a' }}
              aria-label={`Add ${item.name}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          ) : (
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white rounded-full shadow-md px-1 py-0.5 border border-gray-100">
              <button onClick={onRemove} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ color: '#16a34a' }}>
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs font-black text-gray-900 w-4 text-center">{qty}</span>
              <button onClick={onAdd} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ color: '#16a34a' }}>
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const HOTEL_URL = 'https://kogelosuites.com';
const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export default function RestaurantPage() {
  const [cart, dispatch]              = useReducer(cartReducer, []);
  const [view, setView]               = useState<View>('menu');
  const [orderType, setOrderType]      = useState<OrderType>('dine_in');
  const [checkoutStep, setCheckoutStep] = useState<'type' | 'details'>('type');
  const [activeTab, setActiveTab]      = useState<string>('all');
  const [showCart, setShowCart]        = useState(false);
  const [featuredDishes, setFeaturedDishes] = useState<any[]>([]);
  const [dynamicMenu, setDynamicMenu]  = useState<MenuCategory[] | null>(null);

  const [name,        setName]        = useState('');
  const [phone,       setPhone]       = useState('');
  const [roomNumber,  setRoomNumber]  = useState('');
  const [dineInTime,  setDineInTime]  = useState('');
  const [address,     setAddress]     = useState('');
  const [gpsLat,      setGpsLat]      = useState<number | null>(null);
  const [gpsLng,      setGpsLng]      = useState<number | null>(null);
  const [gpsLoading,  setGpsLoading]  = useState(false);
  const [gpsError,    setGpsError]    = useState('');
  const [notes,       setNotes]       = useState('');
  const [properties,  setProperties]  = useState<{ id: string; name: string }[]>([]);

  const [orderId,      setOrderId]      = useState('');
  const [orderNumber,  setOrderNumber]  = useState('');
  const [mpesaPhone,   setMpesaPhone]   = useState('');
  const [payError,     setPayError]     = useState('');
  const [payLoading,   setPayLoading]   = useState(false);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // ── Fetch featured dishes ──────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/stay/featured-dishes')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.dishes?.length) setFeaturedDishes(d.dishes); })
      .catch(() => {});
  }, []);

  // ── Fetch dynamic menu ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/stay/menu')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.items?.length) setDynamicMenu(d.items); })
      .catch(() => {});
  }, []);

  // ── Fetch properties for room service dropdown ─────────────────────────────
  useEffect(() => {
    fetch('/api/stay/properties')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.properties?.length) setProperties(d.properties); })
      .catch(() => {});
  }, []);

  const menuData: MenuCategory[] = dynamicMenu
    ? MENU_TABS.map(t => ({
        id: t.id, name: t.label, tab: t.id,
        items: dynamicMenu
          .filter((x: any) => x.tab === t.id)
          .map((x: any) => ({ id: x.id, name: x.name, price: Number(x.price), description: x.description, tag: x.tag, image_url: x.image_url ?? undefined })),
      })).filter(c => c.items.length)
    : MENU_DATA;

  // ── Computed totals ────────────────────────────────────────────────────────
  const subtotal     = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const serviceFee   = orderType === 'room_service' ? ROOM_SERVICE_FEE : 0;
  const deliveryFee  = orderType === 'delivery' ? DELIVERY_FEE : 0;
  const total        = subtotal + serviceFee + deliveryFee;
  const cartCount    = cart.reduce((s, i) => s + i.qty, 0);

  // ── Sticky tab scroll ──────────────────────────────────────────────────────
  const scrollToSection = useCallback((tab: string) => {
    setActiveTab(tab);
    const el = sectionRefs.current[tab];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // ── GPS ────────────────────────────────────────────────────────────────────
  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) { setGpsError('Geolocation not supported by your browser.'); return; }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setGpsLat(lat);
        setGpsLng(lng);
        if (GMAPS_KEY) {
          try {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GMAPS_KEY}`
            );
            const data = await res.json();
            const formatted = data?.results?.[0]?.formatted_address;
            if (formatted) setAddress(formatted);
          } catch { /* leave address as-is */ }
        }
        setGpsLoading(false);
      },
      err => {
        setGpsError(err.code === 1 ? 'Location access denied. Please type your address.' : 'Could not get location. Please type your address.');
        setGpsLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  // ── Submit order ───────────────────────────────────────────────────────────
  const handleCheckout = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    if (orderType === 'room_service' && !roomNumber.trim()) { setPayError('Please enter your room or unit number.'); return; }
    if (orderType === 'delivery'     && !address.trim())    { setPayError('Please enter your delivery address.'); return; }
    const res = await fetch('/api/stay/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_type: orderType,
        guest_name: name,
        guest_phone: phone,
        room_number:     orderType === 'room_service' ? roomNumber : '',
        delivery_address: orderType === 'delivery'   ? address    : '',
        delivery_lat:    orderType === 'delivery'    ? gpsLat     : null,
        delivery_lng:    orderType === 'delivery'    ? gpsLng     : null,
        dine_in_time:    orderType === 'dine_in'     ? dineInTime : '',
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
        notes,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setPayError(data.error ?? 'Something went wrong.'); return; }
    setOrderId(data.id);
    setOrderNumber(data.order_number);
    setMpesaPhone(phone.startsWith('0') ? '254' + phone.slice(1) : phone.startsWith('+') ? phone.slice(1) : phone);
    setView('payment');
  }, [orderType, name, phone, roomNumber, address, gpsLat, gpsLng, dineInTime, cart, notes]);

  // ── Trigger M-Pesa STK push ────────────────────────────────────────────────
  const handlePay = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    setPayLoading(true);
    try {
      const res = await fetch('/api/stay/mpesa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: mpesaPhone, amount: total, order_id: orderId }),
      });
      const data = await res.json();
      if (!res.ok) { setPayError(data.error ?? 'Payment failed. Please try again.'); setPayLoading(false); return; }
      dispatch({ type: 'CLEAR' });
      setView('success');
    } catch {
      setPayError('Network error. Please try again.');
      setPayLoading(false);
    }
  }, [mpesaPhone, total, orderId]);

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: PAYMENT
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'payment') return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6 space-y-5">
        <button onClick={() => setView('checkout')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#16a34a' }}>
            <Phone className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-black text-xl text-gray-900">M-Pesa Payment</h2>
          <p className="text-sm text-gray-500 mt-1">Order <span className="font-bold text-gray-800">{orderNumber}</span></p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: '#f0fdf4' }}>
          <p className="text-xs text-gray-500 mb-1">Amount to pay</p>
          <p className="text-3xl font-black" style={{ color: '#16a34a' }}>KSh {total.toLocaleString()}</p>
        </div>
        <form onSubmit={handlePay} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">M-Pesa Number</label>
            <input
              type="tel"
              value={mpesaPhone}
              onChange={e => setMpesaPhone(e.target.value)}
              placeholder="254712345678"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-[11px] text-gray-400 mt-1">Format: 254XXXXXXXXX</p>
          </div>
          {payError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{payError}</p>}
          <button
            type="submit"
            disabled={payLoading}
            className="w-full py-3.5 rounded-xl text-sm font-black text-white disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: '#16a34a' }}
          >
            {payLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending prompt…</> : `Pay KSh ${total.toLocaleString()} via M-Pesa`}
          </button>
        </form>
        <p className="text-[11px] text-center text-gray-400">
          A prompt will appear on your phone. Enter your M-Pesa PIN to complete payment.
        </p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: SUCCESS
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'success') return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8 text-center space-y-4">
        <CheckCircle2 className="w-16 h-16 mx-auto" style={{ color: '#16a34a' }} />
        <h2 className="font-black text-2xl text-gray-900">Order Placed!</h2>
        <p className="text-sm text-gray-500">
          {orderNumber && <span className="block font-bold text-gray-800 mb-1">{orderNumber}</span>}
          {orderType === 'room_service' && 'Your meal will be delivered to your room shortly.'}
          {orderType === 'dine_in'      && 'Your order is being prepared. Please come to the restaurant.'}
          {orderType === 'delivery'     && "Your order is on the way! We'll call you to confirm."}
        </p>
        <a href={'tel:' + ORDER_PHONE} className="flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-700">
          <Phone className="w-4 h-4" /> Questions? <span className="font-bold" style={{ color: '#16a34a' }}>{ORDER_PHONE}</span>
        </a>
        <button
          onClick={() => { setView('menu'); setOrderType('dine_in'); }}
          className="w-full py-3 rounded-xl text-sm font-bold text-white"
          style={{ background: '#16a34a' }}
        >
          Order Again
        </button>
        <a href={HOTEL_URL} className="block text-sm text-gray-400 hover:text-gray-600">← Back to Hotel</a>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: CHECKOUT — Step 1: order type selection
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'checkout' && checkoutStep === 'type') return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3">
        <button onClick={() => setView('menu')} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <span className="font-black text-base text-gray-900">How would you like it?</span>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-10 space-y-3">
        {/* Compact cart pill */}
        <div className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between border border-gray-100">
          <span className="text-sm text-gray-500">{cartCount} item{cartCount !== 1 ? 's' : ''} in cart</span>
          <span className="font-black text-gray-900">KSh {subtotal.toLocaleString()}</span>
        </div>

        <p className="text-xs text-gray-400 px-1 pt-1">Select how you'd like to receive your order</p>

        {/* Room Service */}
        <button
          onClick={() => { setOrderType('room_service'); setCheckoutStep('details'); }}
          className="w-full text-left bg-white rounded-2xl p-4 flex items-center gap-4 border-2 transition-all hover:border-green-400 active:scale-[0.99]"
          style={{ borderColor: '#e5e7eb' }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: '#fef3c7' }}>🛎</div>
          <div className="flex-1">
            <p className="font-black text-gray-900 text-base">Room Service</p>
            <p className="text-xs text-gray-500 mt-0.5">Delivered straight to your room</p>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full mt-1.5 inline-block" style={{ background: '#fef3c7', color: '#92400e' }}>+KSh {ROOM_SERVICE_FEE} service fee</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </button>

        {/* Dine In */}
        <button
          onClick={() => { setOrderType('dine_in'); setCheckoutStep('details'); }}
          className="w-full text-left bg-white rounded-2xl p-4 flex items-center gap-4 border-2 transition-all hover:border-green-400 active:scale-[0.99]"
          style={{ borderColor: '#e5e7eb' }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: '#f0fdf4' }}>🍽</div>
          <div className="flex-1">
            <p className="font-black text-gray-900 text-base">Dine In</p>
            <p className="text-xs text-gray-500 mt-0.5">Come to the restaurant — we'll have it ready</p>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full mt-1.5 inline-block" style={{ background: '#f0fdf4', color: '#14532d' }}>No extra fee</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </button>

        {/* Delivery */}
        <button
          onClick={() => { setOrderType('delivery'); setCheckoutStep('details'); }}
          className="w-full text-left bg-white rounded-2xl p-4 flex items-center gap-4 border-2 transition-all hover:border-green-400 active:scale-[0.99]"
          style={{ borderColor: '#e5e7eb' }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: '#eff6ff' }}>🚴</div>
          <div className="flex-1">
            <p className="font-black text-gray-900 text-base">Delivery</p>
            <p className="text-xs text-gray-500 mt-0.5">We bring it to your location</p>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full mt-1.5 inline-block" style={{ background: '#eff6ff', color: '#1e40af' }}>+KSh {DELIVERY_FEE} delivery fee</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </button>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: CHECKOUT — Step 2: details & confirm
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'checkout') return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3">
        <button onClick={() => setCheckoutStep('type')} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <span className="font-black text-base text-gray-900">
            {orderType === 'room_service' ? '🛎 Room Service' : orderType === 'dine_in' ? '🍽 Dine In' : '🚴 Delivery'}
          </span>
          <p className="text-[11px] text-gray-400 leading-none mt-0.5">Your details</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 pb-10 space-y-4">
        {/* Cart summary */}
        <div className="bg-white rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="font-black text-sm text-gray-900">Your Items</h3>
          </div>
          {cart.map(item => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                  <button onClick={() => dispatch({ type: 'REMOVE', id: item.id })} className="text-gray-500 hover:text-red-500">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-black text-gray-900 w-4 text-center">{item.qty}</span>
                  <button onClick={() => dispatch({ type: 'ADD', item })} style={{ color: '#16a34a' }}>
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-sm text-gray-800">{item.name}</span>
              </div>
              <span className="text-sm font-bold text-gray-900">KSh {(item.price * item.qty).toLocaleString()}</span>
            </div>
          ))}
          <div className="px-4 py-3 space-y-1 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>KSh {subtotal.toLocaleString()}</span>
            </div>
            {serviceFee > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Room service fee</span><span>KSh {serviceFee}</span>
              </div>
            )}
            {deliveryFee > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery fee</span><span>KSh {deliveryFee}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-gray-900 pt-1 border-t border-gray-200">
              <span>Total</span><span>KSh {total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Contact + delivery details form */}
        <form onSubmit={handleCheckout} className="bg-white rounded-2xl p-4 space-y-4">
          <h3 className="font-black text-sm text-gray-900">Your Details</h3>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Jane Auma"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="e.g. 0712345678" type="tel"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          {orderType === 'room_service' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Room / Unit Number</label>
              {properties.length > 0 ? (
                <select value={roomNumber} onChange={e => setRoomNumber(e.target.value)} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                  <option value="">Select your room…</option>
                  {properties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              ) : (
                <input value={roomNumber} onChange={e => setRoomNumber(e.target.value)} required placeholder="e.g. Room 12"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              )}
            </div>
          )}

          {orderType === 'dine_in' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Arrival Time (optional)</label>
              <input value={dineInTime} onChange={e => setDineInTime(e.target.value)} type="time"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          )}

          {orderType === 'delivery' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700">Delivery Address</label>
              <button
                type="button"
                onClick={handleGPS}
                disabled={gpsLoading}
                className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl border transition-all disabled:opacity-60"
                style={{ borderColor: '#16a34a', color: '#16a34a', background: '#f0fdf4' }}
              >
                {gpsLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Locating…</>
                  : <><Navigation className="w-4 h-4" /> Use my location</>}
              </button>
              {gpsError && <p className="text-xs text-red-500">{gpsError}</p>}
              {gpsLat && <p className="text-xs text-green-600 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location detected — edit below if needed</p>}
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                required
                placeholder="Type or confirm your delivery address"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Special Instructions (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Allergies, preferences…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
          </div>

          {payError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{payError}</p>}

          <button type="submit" className="w-full py-3.5 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2" style={{ background: '#16a34a' }}>
            Continue to Payment <ChevronRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: MENU — Uber Eats home UI
  // ══════════════════════════════════════════════════════════════════════════

  const tabsForMenu = MENU_TABS.filter(t => menuData.some(c => c.tab === t.id));

  const popularItems: PopularItem[] = featuredDishes.length > 0
    ? featuredDishes.map((d: any) => ({
        id: d.id,
        name: d.name,
        price: Number(d.price),
        description: d.description,
        imageUrl: d.image_url,
        badge: d.badge || '🔥 Popular',
        badgeColor: d.badge_color || '#D97706',
        tag: 'popular' as const,
      }))
    : MENU_DATA
        .flatMap(cat => cat.items.map(item => ({ ...item, tabId: cat.tab })))
        .filter(item => item.tag === 'popular' || item.tag === 'special')
        .slice(0, 8)
        .map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description,
          imageUrl: undefined,
          badge: item.tag === 'popular' ? '🔥 Popular' : '⭐ Special',
          badgeColor: item.tag === 'popular' ? '#D97706' : '#16a34a',
          tag: item.tag,
          tabId: item.tabId,
        }));

  return (
    <div className="min-h-screen" style={{ background: '#f4f4f4', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Sticky top bar (always white — Uber Eats style) ── */}
      <header className="sticky top-0 z-50 bg-white h-14 flex items-center justify-between px-4 border-b border-gray-100">
        <a href={HOTEL_URL} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <ArrowLeft className="w-4 h-4 text-gray-700" />
        </a>
        <span className="font-black text-gray-900 text-base">Kogelo Restaurant</span>
        <div className="flex items-center gap-1.5">
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Bell className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={() => setShowCart(true)}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center relative"
            aria-label="View cart"
          >
            <ShoppingCart className="w-4 h-4 text-gray-700" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center" style={{ background: '#16a34a' }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── WHITE TOP SECTION ── */}
      <div className="bg-white">

        {/* ROW 3: Large circular category icons */}
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
          <div className="flex gap-5 px-4 pb-5 pt-2 min-w-max">
            {tabsForMenu.map(tab => (
              <button
                key={tab.id}
                onClick={() => scrollToSection(tab.id)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all"
                  style={{
                    background: '#fff',
                    boxShadow: activeTab === tab.id
                      ? '0 0 0 2.5px #16a34a, 0 2px 10px rgba(0,0,0,0.10)'
                      : '0 2px 10px rgba(0,0,0,0.10)',
                  }}
                >
                  {TAB_EMOJI[tab.id] ?? '🍽️'}
                </div>
                <span className="text-[11px] font-semibold text-gray-700 whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Info strip */}
        <div className="border-t border-gray-100 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
          <div className="flex items-center gap-3 px-4 py-2.5 min-w-max">
            <span className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5" /> 7 AM – 10 PM
            </span>
            <span className="w-px h-4 bg-gray-200" />
            <a href={'tel:' + ORDER_PHONE} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 whitespace-nowrap">
              <Phone className="w-3.5 h-3.5" /> {ORDER_PHONE}
            </a>
          </div>
        </div>
      </div>

      {/* ── Section divider ── */}
      <div style={{ height: 8, background: '#f4f4f4' }} />

      {/* ── ⭐ Popular Right Now (Uber Eats "Featured" section) ── */}
      {popularItems.length > 0 && (
        <div className="bg-white py-4">
          <div className="flex items-center justify-between px-4 mb-3">
            <div>
              <h2 className="font-black text-base text-gray-900">⭐ Popular Right Now</h2>
              <p className="text-xs text-gray-400 mt-0.5">Most ordered from Kogelo Restaurant</p>
            </div>
            <button
              onClick={() => scrollToSection(tabsForMenu[0]?.id ?? '')}
              className="flex items-center gap-0.5 text-xs font-bold"
              style={{ color: '#16a34a' }}
            >
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
            <div className="flex gap-3 px-4" style={{ minWidth: 'max-content', paddingBottom: 4 }}>
              {popularItems.map(pItem => (
                <PopularCard
                  key={pItem.id}
                  item={pItem}
                  qty={cart.find(c => c.id === pItem.id)?.qty ?? 0}
                  onAdd={() => dispatch({ type: 'ADD', item: { id: pItem.id, name: pItem.name, price: pItem.price, description: pItem.description, tag: pItem.tag } })}
                  onRemove={() => dispatch({ type: 'REMOVE', id: pItem.id })}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Section divider ── */}
      <div style={{ height: 8, background: '#f4f4f4' }} />

      {/* ── Sticky mini tab bar (sticks below top bar when scrolling) ── */}
      <div className="sticky z-30 bg-white border-b border-gray-100 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ top: 56, WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
        <div className="flex gap-1 px-4 py-2" style={{ minWidth: 'max-content' }}>
          {tabsForMenu.map(t => (
            <button
              key={t.id}
              onClick={() => scrollToSection(t.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap"
              style={activeTab === t.id
                ? { background: '#16a34a', color: '#fff' }
                : { background: '#f1f5f9', color: '#374151' }}
            >
              {TAB_EMOJI[t.id]} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Menu sections ── */}
      <div className="pb-32">
        {tabsForMenu.map(tab => {
          const cats = menuData.filter(c => c.tab === tab.id);
          return (
            <div key={tab.id} ref={el => { sectionRefs.current[tab.id] = el; }}>
              {/* Section header */}
              <div className="flex items-center justify-between px-4 py-3 bg-white">
                <h2 className="font-black text-base text-gray-900">{TAB_EMOJI[tab.id]} {tab.label}</h2>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              {/* Items */}
              <div className="bg-white">
                {cats.map(cat => (
                  <div key={cat.id}>
                    {cats.length > 1 && (
                      <div className="px-4 pt-3 pb-0">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{cat.name}</p>
                        {cat.description && <p className="text-[11px] text-gray-400 mt-0.5">{cat.description}</p>}
                      </div>
                    )}
                    {cats.length === 1 && cat.description && (
                      <p className="px-4 text-xs text-gray-400 -mt-1 mb-1">{cat.description}</p>
                    )}
                    <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
                      <div className="flex gap-3 px-4 pb-3" style={{ minWidth: 'max-content' }}>
                        {cat.items.map(item => (
                          <div key={item.id} style={{ width: 'min(47vw, 210px)', flexShrink: 0 }}>
                            <MenuCard
                              item={item}
                              tabId={tab.id}
                              qty={cart.find(c => c.id === item.id)?.qty ?? 0}
                              onAdd={() => dispatch({ type: 'ADD', item })}
                              onRemove={() => dispatch({ type: 'REMOVE', id: item.id })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Thick separator between sections */}
              <div style={{ height: 8, background: '#f4f4f4' }} />
            </div>
          );
        })}
      </div>

      {/* ── Floating cart button ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-40 max-w-2xl mx-auto">
          <button
            onClick={() => { setCheckoutStep('type'); setView('checkout'); }}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl text-white font-black shadow-xl transition-transform hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: '#16a34a' }}
          >
            <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-black">{cartCount}</span>
            <span className="flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> View cart</span>
            <span>KSh {total.toLocaleString()}</span>
          </button>
        </div>
      )}

      {/* ── Cart drawer ── */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="relative bg-white rounded-t-3xl p-5 max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-gray-900">Your Cart</h3>
              <button onClick={() => setShowCart(false)} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            {cart.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Your cart is empty</p>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                        <button onClick={() => dispatch({ type: 'REMOVE', id: item.id })} className="text-gray-500">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black w-4 text-center">{item.qty}</span>
                        <button onClick={() => dispatch({ type: 'ADD', item })} style={{ color: '#16a34a' }}>
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm text-gray-800">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold">KSh {(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-black text-gray-900 pt-3 text-base">
                  <span>Total</span><span>KSh {total.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => { setShowCart(false); setCheckoutStep('type'); setView('checkout'); }}
                  className="mt-4 w-full py-3.5 rounded-xl text-sm font-black text-white"
                  style={{ background: '#16a34a' }}
                >
                  Checkout · KSh {total.toLocaleString()}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
