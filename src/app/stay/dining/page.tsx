'use client';

import { useState, useReducer, useEffect } from 'react';
import { MENU_DATA, MENU_TABS, ORDER_PHONE, ROOM_SERVICE_FEE, DELIVERY_FEE, type MenuItem, type MenuCategory } from '@/lib/menu-data';
import { Bell, Utensils, Bike, ShoppingCart, TrendingUp, Star, Phone, CheckCircle2, type LucideIcon } from 'lucide-react';

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

const ORDER_TYPES: { id: OrderType; label: string; Icon: LucideIcon; desc: string; fee?: number }[] = [
  { id: 'room_service', label: 'Room Service', Icon: Bell,     desc: 'Delivered to your door', fee: ROOM_SERVICE_FEE },
  { id: 'dine_in',      label: 'Dine In',      Icon: Utensils, desc: 'Eat at the restaurant', fee: 0 },
  { id: 'delivery',     label: 'Delivery',      Icon: Bike,     desc: 'Delivered outside', fee: DELIVERY_FEE },
];

function MenuItemCard({ item, qty, onAdd, onRemove }: { item: MenuItem; qty: number; onAdd: () => void; onRemove: () => void }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all flex gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <h4 className="font-bold text-gray-900 text-sm flex-1 leading-snug">{item.name}</h4>
          {item.tag === 'popular' && <span className="flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#D97706' }}><TrendingUp className="w-3 h-3" />Popular</span>}
          {item.tag === 'special' && <span className="flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#16a34a' }}><Star className="w-3 h-3" />Special</span>}
        </div>
        {item.description && <p className="text-xs text-gray-500 mt-1 leading-snug">{item.description}</p>}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-black text-gray-900 text-sm">
            {item.price === 0 ? 'Free' : `KSh ${item.price.toLocaleString()}`}
          </span>
          {item.price > 0 && (
            qty > 0 ? (
              <div className="flex items-center gap-2">
                <button onClick={onRemove} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors hover:bg-red-50" style={{ borderColor: '#16a34a', color: '#16a34a' }}>−</button>
                <span className="w-5 text-center font-black text-sm text-gray-900">{qty}</span>
                <button onClick={onAdd} className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white transition-all hover:opacity-90" style={{ background: '#16a34a' }}>+</button>
              </div>
            ) : (
              <button onClick={onAdd} className="px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90" style={{ background: '#16a34a' }}>Add</button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function DiningPage() {
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [activeTab, setActiveTab] = useState<typeof MENU_TABS[0]['id']>('breakfast');
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [cartOpen, setCartOpen] = useState(false);
  const [step, setStep] = useState<'menu' | 'details' | 'success'>('menu');
  const [dynamicMenu, setDynamicMenu] = useState<MenuCategory[] | null>(null);

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
  const [error,    setError]    = useState('');
  const [saving,   setSaving]   = useState(false);
  const [orderNum, setOrderNum] = useState('');

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const serviceFee = orderType === 'room_service' ? ROOM_SERVICE_FEE : 0;
  const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;
  const total = subtotal + serviceFee + deliveryFee;
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const menuData = dynamicMenu ?? MENU_DATA;
  const visibleCategories = menuData.filter(c => c.tab === activeTab);

  const handleSubmitOrder = async () => {
    setError('');
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!phone.trim()) { setError('Please enter your phone number.'); return; }
    if (orderType === 'room_service' && !room.trim()) { setError('Please enter your room number.'); return; }
    if (orderType === 'delivery' && !address.trim()) { setError('Please enter your delivery address.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/stay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_type: orderType,
          guest_name: name.trim(),
          guest_phone: phone.trim(),
          room_number: room.trim(),
          delivery_address: address.trim(),
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
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (step === 'success') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] px-4 pt-16">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-4"><CheckCircle2 className="w-16 h-16" style={{ color: '#16a34a' }} /></div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Order Received!</h2>
        {orderNum && <p className="text-sm font-bold mb-1" style={{ color: '#16a34a' }}>Order #{orderNum}</p>}
        <p className="text-gray-500 text-sm mb-6">
          {orderType === 'room_service' && 'Your meal will be delivered to your room shortly.'}
          {orderType === 'dine_in'      && 'Your order is being prepared. Please head to the restaurant.'}
          {orderType === 'delivery'     && 'Your order is on its way! You\'ll receive a call from us.'}
        </p>
        <a href={`tel:${ORDER_PHONE}`} className="flex items-center justify-center gap-1.5 text-sm text-gray-500 mb-6 hover:text-gray-700">
          <Phone className="w-4 h-4" />Questions? Call us: <span className="font-bold" style={{ color: '#16a34a' }}>{ORDER_PHONE}</span>
        </a>
        <button onClick={() => setStep('menu')} className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#16a34a' }}>
          Order Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">

      {/* ── Header ── */}
      <div className="pt-20 pb-6 px-4 sm:px-6" style={{ background: 'linear-gradient(160deg, #0f172a, #0f172a)' }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#D97706' }}>Kogelo Restaurant</p>
          <h1 className="text-2xl sm:text-4xl font-black text-white mb-1">Menu & Ordering</h1>
          <p className="text-white/60 text-xs sm:text-sm">
            <a href={`tel:${ORDER_PHONE}`} className="underline hover:text-white">Call: {ORDER_PHONE}</a>
          </p>

          {/* Order type selector */}
          <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {ORDER_TYPES.map(t => (
              <button key={t.id} onClick={() => setOrderType(t.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  orderType === t.id ? 'bg-white text-gray-900' : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}>
                <t.Icon className="w-4 h-4" />
                <span>{t.label}</span>
                {t.fee ? <span className={`text-xs font-normal ${orderType === t.id ? 'text-gray-500' : 'text-white/50'}`}>+KSh {t.fee}</span> : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* ── Menu ── */}
          <div className="lg:col-span-2">

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
              {MENU_TABS.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    activeTab === t.id ? 'text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                  }`}
                  style={activeTab === t.id ? { background: '#16a34a' } : {}}>
                  <span>{t.emoji}</span>{t.label}
                </button>
              ))}
            </div>

            {/* Items */}
            <div className="space-y-6">
              {visibleCategories.map(cat => (
                <div key={cat.id}>
                  <div className="mb-3">
                    <h3 className="font-black text-gray-900">{cat.name}</h3>
                    {cat.description && <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cat.items.map(item => {
                      const cartItem = cart.find(i => i.id === item.id);
                      return (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          qty={cartItem?.qty ?? 0}
                          onAdd={() => dispatch({ type: 'ADD', item })}
                          onRemove={() => dispatch({ type: 'REMOVE', id: item.id })}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Cart (desktop) ── */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #0f172a, #0f172a)' }}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-white">Your Order</h3>
                    <span className="text-xs font-bold text-white/70">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-xs text-white/60 mt-1 capitalize flex items-center gap-1">
                    {(() => { const T = ORDER_TYPES.find(t => t.id === orderType); return T ? <><T.Icon className="w-3 h-3" /> {T.label}</> : null; })()}
                  </p>
                </div>

                {step === 'menu' ? (
                  cart.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="flex justify-center mb-3"><ShoppingCart className="w-10 h-10 text-gray-300" /></div>
                      <p className="text-sm text-gray-400">Your cart is empty.<br />Add items from the menu.</p>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {cart.map(i => (
                          <div key={i.id} className="flex items-center justify-between gap-2 py-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-black text-white px-1.5 py-0.5 rounded" style={{ background: '#16a34a' }}>{i.qty}×</span>
                              <span className="text-sm text-gray-800 truncate">{i.name}</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900 flex-shrink-0">KSh {(i.price * i.qty).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-gray-100 mt-3 pt-3 space-y-1.5 text-sm">
                        <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>KSh {subtotal.toLocaleString()}</span></div>
                        {serviceFee > 0 && <div className="flex justify-between text-gray-500"><span>Room service fee</span><span>KSh {serviceFee.toLocaleString()}</span></div>}
                        {deliveryFee > 0 && <div className="flex justify-between text-gray-500"><span>Delivery fee</span><span>KSh {deliveryFee.toLocaleString()}</span></div>}
                        <div className="flex justify-between font-black text-gray-900 text-base pt-2 border-t border-gray-100"><span>Total</span><span>KSh {total.toLocaleString()}</span></div>
                      </div>
                      <button onClick={() => setStep('details')} className="w-full mt-4 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90" style={{ background: '#16a34a' }}>
                        Proceed to Checkout →
                      </button>
                    </div>
                  )
                ) : (
                  <div className="p-4 space-y-3">
                    <button onClick={() => setStep('menu')} className="text-xs font-semibold flex items-center gap-1 mb-1" style={{ color: '#16a34a' }}>
                      ← Back to menu
                    </button>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Your Name *</label>
                      <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name"
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-red-800" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Phone Number *</label>
                      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07XX XXX XXX" type="tel"
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-red-800" />
                    </div>
                    {orderType === 'room_service' && (
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Room Number *</label>
                        <input value={room} onChange={e => setRoom(e.target.value)} placeholder="e.g. 12"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-red-800" />
                      </div>
                    )}
                    {orderType === 'delivery' && (
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Delivery Address *</label>
                        <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} placeholder="Full delivery address"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-red-800 resize-none" />
                      </div>
                    )}
                    {orderType === 'dine_in' && (
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Arrival Time</label>
                        <input value={dineTime} onChange={e => setDineTime(e.target.value)} placeholder="e.g. 1:00 PM"
                          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-red-800" />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Notes</label>
                      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Allergies, preferences…"
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-red-800 resize-none" />
                    </div>
                    {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
                    <div className="flex justify-between font-black text-gray-900 text-base py-2 border-t border-gray-100"><span>Total</span><span>KSh {total.toLocaleString()}</span></div>
                    <button onClick={handleSubmitOrder} disabled={saving}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: '#16a34a' }}>
                      {saving ? 'Placing Order…' : 'Place Order'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile floating cart button ── */}
      {totalItems > 0 && !cartOpen && (
        <div className="lg:hidden fixed bottom-20 left-4 right-4 z-40">
          <button onClick={() => setCartOpen(true)}
            className="w-full py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-between px-6 shadow-2xl"
            style={{ background: '#16a34a' }}>
            <span className="flex items-center gap-2"><ShoppingCart className="w-4 h-4" />{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
            <span>KSh {total.toLocaleString()} · View Cart →</span>
          </button>
        </div>
      )}

      {/* ── Mobile cart sheet ── */}
      {cartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="relative bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
              <h3 className="font-black text-gray-900">Your Order</h3>
              <button onClick={() => setCartOpen(false)}>
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-4 space-y-3">
              {cart.map(i => (
                <div key={i.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-800 flex-1">{i.name}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => dispatch({ type: 'REMOVE', id: i.id })} className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold" style={{ borderColor: '#16a34a', color: '#16a34a' }}>−</button>
                    <span className="w-5 text-center text-sm font-bold">{i.qty}</span>
                    <button onClick={() => dispatch({ type: 'ADD', item: i })} className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#16a34a' }}>+</button>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-20 text-right">KSh {(i.price * i.qty).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>KSh {subtotal.toLocaleString()}</span></div>
                {serviceFee > 0 && <div className="flex justify-between text-gray-500"><span>Room service fee</span><span>KSh {serviceFee.toLocaleString()}</span></div>}
                {deliveryFee > 0 && <div className="flex justify-between text-gray-500"><span>Delivery fee</span><span>KSh {deliveryFee.toLocaleString()}</span></div>}
                <div className="flex justify-between font-black text-gray-900 text-base pt-2 border-t border-gray-100"><span>Total</span><span>KSh {total.toLocaleString()}</span></div>
              </div>

              {/* Details form in mobile sheet */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-gray-900 text-sm">Your Details</h4>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name *"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none" />
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number *" type="tel"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none" />
                {orderType === 'room_service' && <input value={room} onChange={e => setRoom(e.target.value)} placeholder="Room number *" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none" />}
                {orderType === 'delivery'     && <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} placeholder="Delivery address *" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none resize-none" />}
                {orderType === 'dine_in'      && <input value={dineTime} onChange={e => setDineTime(e.target.value)} placeholder="Arrival time" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none" />}
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Notes / allergies" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none resize-none" />
                {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
                <button onClick={handleSubmitOrder} disabled={saving}
                  className="w-full py-4 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: '#16a34a' }}>
                  {saving ? 'Placing Order…' : `Place Order · KSh ${total.toLocaleString()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
