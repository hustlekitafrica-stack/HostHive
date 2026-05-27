'use client';

import { useState, useReducer, useEffect } from 'react';
import { MENU_DATA, MENU_TABS, ORDER_PHONE, ROOM_SERVICE_FEE, DELIVERY_FEE, type MenuItem, type MenuCategory } from '@/lib/menu-data';
import { Bell, Utensils, Bike, ShoppingCart, TrendingUp, Star, Phone, CheckCircle2, ArrowLeft, ChevronRight, type LucideIcon } from 'lucide-react';

function DotsLoader() {
  return (
    <span className="flex items-center justify-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-current dot-bounce" />
      <span className="w-2 h-2 rounded-full bg-current dot-bounce dot-bounce-2" />
      <span className="w-2 h-2 rounded-full bg-current dot-bounce dot-bounce-3" />
    </span>
  );
}

type CartItem = MenuItem & { qty: number };
type CartAction =
  | { type: 'ADD'; item: MenuItem }
  | { type: 'REMOVE'; id: string }
  | { type: 'CLEAR' };

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find(i => i.id === action.item.id);
      if (existing) return state.map(i => i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...state, { ...action.item, qty: 1 }];
    }
    case 'REMOVE':
      return state.map(i => i.id === action.id ? { ...i, qty: i.qty - 1 } : i).filter(i => i.qty > 0);
    case 'CLEAR':
      return [];
  }
}

type OrderType = 'room_service' | 'dine_in' | 'delivery';
type Step = 'type' | 'menu' | 'details' | 'payment' | 'success';

const ORDER_TYPES: { id: OrderType; label: string; Icon: LucideIcon; desc: string; fee?: number }[] = [
  { id: 'room_service', label: 'Room Service', Icon: Bell,     desc: 'Delivered to your door', fee: ROOM_SERVICE_FEE },
  { id: 'dine_in',      label: 'Dine In',      Icon: Utensils, desc: 'Eat at the restaurant',  fee: 0 },
  { id: 'delivery',     label: 'Delivery',      Icon: Bike,     desc: 'Delivered outside',      fee: DELIVERY_FEE },
];

function MenuItemCard({ item, qty, onAdd, onRemove }: { item: MenuItem; qty: number; onAdd: () => void; onRemove: () => void }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="font-bold text-gray-900 text-sm leading-snug flex-1 min-w-0">{item.name}</h4>
        {item.tag === 'popular' && <span className="flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#D97706' }}><TrendingUp className="w-3 h-3" />Popular</span>}
        {item.tag === 'special' && <span className="flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#16a34a' }}><Star className="w-3 h-3" />Special</span>}
      </div>
      {item.description && <p className="text-xs text-gray-500 mb-3 leading-snug">{item.description}</p>}
      <div className="flex items-center justify-between mt-2">
        <span className="font-black text-gray-900 text-sm">
          {item.price === 0 ? 'Free' : `KSh ${item.price.toLocaleString()}`}
        </span>
        {item.price > 0 && (
          qty > 0 ? (
            <div className="flex items-center gap-2">
              <button onClick={onRemove} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold" style={{ borderColor: '#16a34a', color: '#16a34a' }}>−</button>
              <span className="w-5 text-center font-black text-sm text-gray-900">{qty}</span>
              <button onClick={onAdd} className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: '#16a34a' }}>+</button>
            </div>
          ) : (
            <button onClick={onAdd} className="px-4 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#16a34a' }}>Add</button>
          )
        )}
      </div>
    </div>
  );
}

export default function DiningPage() {
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [step, setStep] = useState<Step>('type');
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [activeTab, setActiveTab] = useState<typeof MENU_TABS[0]['id']>('breakfast');
  const [dynamicMenu,  setDynamicMenu]  = useState<MenuCategory[] | null>(null);
  const [properties,   setProperties]   = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (step === 'type') {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [step]);

  useEffect(() => {
    fetch('/api/stay/properties')
      .then(r => r.json())
      .then(d => setProperties((d.properties ?? []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/stay/menu')
      .then(r => r.json())
      .then(d => {
        const dbItems: Array<{ id: string; tab: MenuCategory['tab']; category: string; name: string; description: string; price: number; tag?: 'popular' | 'special' | null }> = d.items ?? [];
        if (dbItems.length === 0) return;
        const categoryMap = new Map<string, MenuCategory>();
        dbItems.forEach(item => {
          const key = `${item.tab}||${item.category || item.name}`;
          if (!categoryMap.has(key)) {
            categoryMap.set(key, { id: key, name: item.category || item.name, tab: item.tab, items: [] as MenuItem[] });
          }
          categoryMap.get(key)!.items.push({ id: item.id, name: item.name, price: item.price, description: item.description, tag: item.tag ?? undefined });
        });
        setDynamicMenu(Array.from(categoryMap.values()));
      })
      .catch(() => {});
  }, []);

  // Form state
  const [name,     setName]     = useState('');
  const [phone,    setPhone]    = useState('');
  const [room,     setRoom]     = useState('');
  const [address,  setAddress]  = useState('');
  const [dineTime, setDineTime] = useState('');
  const [notes,    setNotes]    = useState('');
  const [error,      setError]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [orderNum,   setOrderNum]   = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [stkSent,    setStkSent]    = useState(false);
  const [stkLoading, setStkLoading] = useState(false);

  const subtotal    = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const serviceFee  = orderType === 'room_service' ? ROOM_SERVICE_FEE : 0;
  const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;
  const total       = subtotal + serviceFee + deliveryFee;
  const totalItems  = cart.reduce((s, i) => s + i.qty, 0);

  const menuData          = dynamicMenu ?? MENU_DATA;
  const visibleCategories = menuData.filter(c => c.tab === activeTab);

  const validateDetails = (): boolean => {
    if (!name.trim())  { setError('Please enter your name.'); return false; }
    if (!phone.trim()) { setError('Please enter your phone number.'); return false; }
    if (orderType === 'room_service' && !room.trim())    { setError('Please enter your room number.'); return false; }
    if (orderType === 'delivery'     && !address.trim()) { setError('Please enter your delivery address.'); return false; }
    setError(''); return true;
  };

  const handleStkPush = async () => {
    setError(''); setStkLoading(true);
    const phoneToUse = mpesaPhone.trim() || phone.trim();
    if (!phoneToUse) { setError('Please enter your M-Pesa phone number.'); setStkLoading(false); return; }
    try {
      const res = await fetch('/api/stay/mpesa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneToUse,
          amount: total,
          account_ref: name.trim() || 'Kogelo Order',
          description: `Food Order - ${selectedType?.label ?? ''}`,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setStkSent(true);
    } catch { setError('Could not send M-Pesa prompt. Please try again.');
    } finally { setStkLoading(false); }
  };

  const handleSubmitOrder = async () => {
    setError(''); setSaving(true);
    try {
      const res = await fetch('/api/stay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_type: orderType, guest_name: name.trim(), guest_phone: phone.trim(),
          room_number: room.trim(), delivery_address: address.trim(),
          dine_in_time: dineTime.trim(),
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setOrderNum(data.order_number ?? '');
      dispatch({ type: 'CLEAR' });
      setStep('success');
    } catch { setError('Something went wrong. Please try again.');
    } finally { setSaving(false); }
  };

  const selectedType = ORDER_TYPES.find(t => t.id === orderType);

  // ── STEP 1: Choose Order Type ────────────────────────────────────────────
  if (step === 'type') return (
    <div className="flex items-center justify-center px-4" style={{ background: '#0f172a', height: 'calc(100dvh - 3.5rem)' }}>
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-black text-white mb-1">How would you like to order?</h1>
        <p className="text-white/50 text-sm mb-5">Select an option to get started</p>
        <div className="space-y-3">
          {ORDER_TYPES.map(t => (
            <button key={t.id} onClick={() => { setOrderType(t.id); setStep('menu'); }}
              className="w-full rounded-2xl p-5 text-left transition-all flex items-center gap-4 border border-white/10 active:scale-[0.98]"
              style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#16a34a' }}>
                <t.Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-base">{t.label}</p>
                <p className="text-white/50 text-sm">{t.desc}</p>
                {t.fee ? <p className="text-xs font-bold mt-0.5" style={{ color: '#D97706' }}>+KSh {t.fee} fee</p>
                       : <p className="text-xs font-bold mt-0.5 text-green-400">No extra charge</p>}
              </div>
              <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ── STEP 2: Menu ─────────────────────────────────────────────────────────
  if (step === 'menu') return (
    <div className="min-h-screen bg-[#f8fafc] overflow-x-hidden">
      {/* Page header — same pattern as Trips page */}
      <div className="px-4 sm:px-6 pt-5 sm:pt-16 mb-2">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setStep('type')} className="inline-flex items-center text-gray-400 hover:text-gray-700 transition-colors mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-2xl font-black text-gray-900">{selectedType?.label ?? 'Menu'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedType?.fee ? `+KSh ${selectedType.fee} service fee` : 'No extra charge'}
          </p>
        </div>
      </div>
      {/* Sticky category tabs */}
      <div className="sticky z-30 bg-white border-b border-gray-100" style={{ top: '3.5rem' }}>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3 max-w-2xl mx-auto">
          {MENU_TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === t.id ? 'text-white' : 'text-gray-500 border border-gray-200 bg-white'
              }`}
              style={activeTab === t.id ? { background: '#16a34a' } : {}}>
              <span>{t.emoji}</span>{t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 pt-4 pb-36 space-y-6 max-w-2xl mx-auto">
        {visibleCategories.map(cat => (
          <div key={cat.id}>
            <h3 className="font-black text-gray-900 mb-1">{cat.name}</h3>
            {cat.description && <p className="text-xs text-gray-500 mb-3">{cat.description}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cat.items.map(item => {
                const ci = cart.find(i => i.id === item.id);
                return <MenuItemCard key={item.id} item={item} qty={ci?.qty ?? 0}
                  onAdd={() => dispatch({ type: 'ADD', item })}
                  onRemove={() => dispatch({ type: 'REMOVE', id: item.id })} />;
              })}
            </div>
          </div>
        ))}
      </div>
      {totalItems > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-40 flex justify-center px-4 md:static md:mt-6 md:px-0 md:mb-20">
          <button onClick={() => setStep('details')}
            className="w-full max-w-lg py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-between px-5 shadow-2xl"
            style={{ background: '#16a34a' }}>
            <span className="flex items-center gap-2"><ShoppingCart className="w-4 h-4" />{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
            <span>KSh {total.toLocaleString()} · Checkout →</span>
          </button>
        </div>
      )}
    </div>
  );

  // ── STEP 3: Details ──────────────────────────────────────────────────────
  if (step === 'details') return (
    <div className="min-h-screen bg-[#f8fafc] overflow-x-hidden">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => setStep('menu')} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <p className="font-black text-gray-900 text-sm">Your Details</p>
          <p className="text-xs text-gray-400">Step 3 of 4</p>
        </div>
        <span className="text-xs font-bold text-gray-400">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
      </div>
      <div className="px-4 py-5 pb-36 space-y-4 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Order Summary</p>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {cart.map(i => (
              <div key={i.id} className="flex justify-between text-sm">
                <span className="text-gray-600 flex-1 min-w-0 truncate">{i.qty}× {i.name}</span>
                <span className="font-bold text-gray-900 ml-2 flex-shrink-0">KSh {(i.price * i.qty).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-2 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>KSh {subtotal.toLocaleString()}</span></div>
            {serviceFee  > 0 && <div className="flex justify-between text-gray-500"><span>Room service fee</span><span>KSh {serviceFee.toLocaleString()}</span></div>}
            {deliveryFee > 0 && <div className="flex justify-between text-gray-500"><span>Delivery fee</span><span>KSh {deliveryFee.toLocaleString()}</span></div>}
            <div className="flex justify-between font-black text-gray-900 text-base pt-1 border-t border-gray-100"><span>Total</span><span>KSh {total.toLocaleString()}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Contact Details</p>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Full Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number *</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07XX XXX XXX" type="tel"
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500" />
          </div>
          {orderType === 'room_service' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Room / Property *</label>
              {properties.length > 0 ? (
                <select value={room} onChange={e => setRoom(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500 bg-white">
                  <option value="">Select your room…</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              ) : (
                <input value={room} onChange={e => setRoom(e.target.value)} placeholder="e.g. Room 12"
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500" />
              )}
            </div>
          )}
          {orderType === 'delivery' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Delivery Address *</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} placeholder="Full delivery address"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500 resize-none" />
            </div>
          )}
          {orderType === 'dine_in' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Arrival Time</label>
              <input value={dineTime} onChange={e => setDineTime(e.target.value)} placeholder="e.g. 1:00 PM"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500" />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Notes / Allergies</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any special requests?"
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500 resize-none" />
          </div>
        </div>
        {error && <p className="text-xs text-red-600 font-semibold px-1">{error}</p>}
        <button onClick={() => setStep('menu')}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 pt-1">
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </button>
      </div>
      <div className="fixed bottom-16 left-0 right-0 z-40 flex justify-center px-4 pb-1 md:static md:mt-2 md:px-0 md:pb-0 md:mb-20">
        <button onClick={() => { if (validateDetails()) setStep('payment'); }}
          className="w-full max-w-lg py-4 rounded-2xl text-sm font-bold text-white shadow-xl"
          style={{ background: '#16a34a' }}>
          Continue to Payment →
        </button>
      </div>
    </div>
  );

  // ── STEP 4: M-Pesa STK Push ──────────────────────────────────────────────
  if (step === 'payment') return (
    <div className="min-h-screen bg-[#f8fafc] overflow-x-hidden">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => { setStep('details'); setStkSent(false); setError(''); }}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="font-black text-gray-900 text-sm">Pay via M-Pesa</p>
          <p className="text-xs text-gray-400">Step 4 of 4</p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto pb-10 md:pb-20">
        {/* Amount banner */}
        <div className="rounded-2xl p-6 text-center text-white" style={{ background: 'linear-gradient(135deg, #0f172a, #16a34a)' }}>
          <p className="text-sm text-white/70 mb-1">Amount Due</p>
          <p className="text-4xl font-black">KSh {total.toLocaleString()}</p>
          <p className="text-xs text-white/50 mt-1">{totalItems} item{totalItems !== 1 ? 's' : ''} · {selectedType?.label}</p>
        </div>

        {!stkSent ? (
          /* ── Send STK prompt ── */
          <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#16a34a' }}>
                <span className="text-white text-sm font-black">M</span>
              </div>
              <p className="font-black text-gray-900">M-Pesa STK Push</p>
            </div>
            <p className="text-sm text-gray-500">We'll send a payment prompt directly to your phone. Enter your M-Pesa PIN when it arrives.</p>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">M-Pesa Phone Number</label>
              <input
                value={mpesaPhone || phone}
                onChange={e => setMpesaPhone(e.target.value)}
                placeholder="07XX XXX XXX"
                type="tel"
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">Pre-filled from your contact details — edit if different.</p>
            </div>
            {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
            <button onClick={handleStkPush} disabled={stkLoading}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white disabled:opacity-50"
              style={{ background: '#16a34a' }}>
              {stkLoading ? <DotsLoader /> : `Send M-Pesa Prompt · KSh ${total.toLocaleString()}`}
            </button>
          </div>
        ) : (
          /* ── Waiting for payment ── */
          <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse" style={{ background: '#f0fdf4' }}>
                <span className="text-3xl font-black text-green-700">M</span>
              </div>
            </div>
            <div>
              <p className="font-black text-gray-900 text-lg">Check your phone!</p>
              <p className="text-sm text-gray-500 mt-1">An M-Pesa prompt has been sent to <span className="font-bold text-gray-800">{mpesaPhone || phone}</span>. Enter your PIN to complete payment.</p>
            </div>
            <div className="rounded-xl p-3 text-sm" style={{ background: '#f0fdf4' }}>
              <p className="text-green-800 font-semibold">Amount: <span className="font-black">KSh {total.toLocaleString()}</span></p>
            </div>
            <button onClick={() => { setStkSent(false); setError(''); }}
              className="text-xs text-gray-400 underline hover:text-gray-600">
              Didn't receive it? Send again
            </button>
          </div>
        )}

        {/* Order summary */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Order for {name}</p>
          <div className="space-y-1.5">
            {cart.map(i => (
              <div key={i.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{i.qty}× {i.name}</span>
                <span className="font-bold text-gray-900">KSh {(i.price * i.qty).toLocaleString()}</span>
              </div>
            ))}
          </div>
          {(serviceFee > 0 || deliveryFee > 0) && (
            <div className="border-t border-gray-100 mt-2 pt-2 space-y-1 text-sm">
              {serviceFee  > 0 && <div className="flex justify-between text-gray-500"><span>Room service fee</span><span>KSh {serviceFee.toLocaleString()}</span></div>}
              {deliveryFee > 0 && <div className="flex justify-between text-gray-500"><span>Delivery fee</span><span>KSh {deliveryFee.toLocaleString()}</span></div>}
            </div>
          )}
        </div>

        {stkSent && (
          <>
            {error && <p className="text-xs text-red-600 font-semibold px-1">{error}</p>}
            <button onClick={handleSubmitOrder} disabled={saving}
              className="w-full py-4 rounded-2xl text-sm font-bold text-white shadow-xl disabled:opacity-50"
              style={{ background: '#16a34a' }}>
              {saving ? <DotsLoader /> : 'I\'ve Paid · Confirm Order'}
            </button>
          </>
        )}

        <button onClick={() => { setStep('details'); setStkSent(false); setError(''); }}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-4 h-4" /> Back to Details
        </button>
      </div>
    </div>
  );

  // ── STEP 5: Success ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4 pt-20 pb-24 overflow-x-hidden">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center">
        <div className="flex justify-center mb-4"><CheckCircle2 className="w-16 h-16" style={{ color: '#16a34a' }} /></div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Order Confirmed!</h2>
        {orderNum && <p className="text-sm font-bold mb-2" style={{ color: '#16a34a' }}>Order #{orderNum}</p>}
        <p className="text-gray-500 text-sm mb-6">
          {orderType === 'room_service' && 'Your meal will be delivered to your room shortly.'}
          {orderType === 'dine_in'      && 'Your order is being prepared. Please head to the restaurant.'}
          {orderType === 'delivery'     && "Your order is on its way! We'll call you to confirm."}
        </p>
        <a href={`tel:${ORDER_PHONE}`} className="flex items-center justify-center gap-1.5 text-sm text-gray-500 mb-6 hover:text-gray-700">
          <Phone className="w-4 h-4" /> Questions? <span className="font-bold" style={{ color: '#16a34a' }}>{ORDER_PHONE}</span>
        </a>
        <button onClick={() => { setStep('type'); setOrderType(null); }}
          className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#16a34a' }}>
          Order Again
        </button>
      </div>
    </div>
  );
}
