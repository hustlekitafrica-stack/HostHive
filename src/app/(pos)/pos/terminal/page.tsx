'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  LogOut, ShoppingBag, UtensilsCrossed,
  ChefHat, LayoutGrid, Loader2,
} from 'lucide-react';

import { MenuGrid }       from '@/components/pos/MenuGrid';
import { CartPanel }      from '@/components/pos/CartPanel';
import { PaymentModal }   from '@/components/pos/PaymentModal';
import { VoidModal }      from '@/components/pos/VoidModal';
import { OpenOrdersTabs } from '@/components/pos/OpenOrdersTabs';
import type { POSMenuItem }    from '@/components/pos/MenuGrid';
import type { PaymentPayload } from '@/components/pos/PaymentModal';
import { canAccess } from '@/lib/pos/session';

/* --- Types ----------------------------------------------------------------- */
interface StaffSession {
  staffId:   string;
  staffName: string;
  role:      string;
  shiftId:   string;
}

export interface CartItem {
  id:       string;
  name:     string;
  price:    number;
  qty:      number;
  subtotal: number;
  notes:    string;
  tab:      string;
}

interface OpenOrder {
  id:            string;
  order_number:  string;
  table_id:      string | null;
  table_name:    string;
  order_type:    'dine_in' | 'takeaway' | 'bar' | 'room_service';
  total:         number;
  status:        string;
  items:         CartItem[];
  discountType:  'percent' | 'fixed' | '';
  discountValue: number;
}

/* --- Helpers --------------------------------------------------------------- */
function calcTotal(
  items:         CartItem[],
  discountType:  'percent' | 'fixed' | '',
  discountValue: number,
  taxRate:       number,
): number {
  const sub  = items.reduce((s, i) => s + i.subtotal, 0);
  const disc = discountType === 'percent'
    ? sub * (discountValue / 100)
    : discountType === 'fixed'
    ? Math.min(discountValue, sub)
    : 0;
  const after = sub - disc;
  return after + after * (taxRate / 100);
}

function calcAmounts(
  items:         CartItem[],
  discountType:  'percent' | 'fixed' | '',
  discountValue: number,
  taxRate:       number,
) {
  const subtotal    = items.reduce((s, i) => s + i.subtotal, 0);
  const discountAmt = discountType === 'percent'
    ? subtotal * (discountValue / 100)
    : discountType === 'fixed'
    ? Math.min(discountValue, subtotal)
    : 0;
  const afterDiscount = subtotal - discountAmt;
  const taxAmount     = afterDiscount * (taxRate / 100);
  const total         = afterDiscount + taxAmount;
  return { subtotal, discountAmt, taxAmount, total };
}

function blankOrder(): OpenOrder {
  return {
    id:            `new-${Date.now()}`,
    order_number:  '',
    table_id:      null,
    table_name:    '',
    order_type:    'dine_in',
    total:         0,
    status:        'open',
    items:         [],
    discountType:  '',
    discountValue: 0,
  };
}

function mapDbOrder(row: Record<string, unknown>): OpenOrder {
  // Handle legacy 'dine-in' value from old data
  let orderType = ((row.order_type as string) ?? 'dine_in') as OpenOrder['order_type'];
  if ((orderType as string) === 'dine-in') orderType = 'dine_in';
  return {
    id:            row.id as string,
    order_number:  (row.order_number as string) ?? '',
    table_id:      (row.table_id as string | null) ?? null,
    table_name:    (row.table_name as string) ?? '',
    order_type:    orderType,
    total:         (row.total as number) ?? 0,
    status:        (row.status as string) ?? 'open',
    items:         (row.items as CartItem[]) ?? [],
    discountType:  ((row.discount_type as string) ?? '') as OpenOrder['discountType'],
    discountValue: (row.discount_value as number) ?? 0,
  };
}

const ORDER_TYPES: { id: OpenOrder['order_type']; label: string; preset: string }[] = [
  { id: 'room_service', label: '🛎️ Room',     preset: ''          },
  { id: 'dine_in',      label: '🪑 Dine-in',  preset: ''          },
  { id: 'bar',          label: '🍺 Bar',       preset: 'Bar'       },
  { id: 'takeaway',     label: '🥡 Takeaway',  preset: 'Takeaway'  },
];

/* --- Inner component (needs Suspense for useSearchParams) ------------------ */
function TerminalInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  /* session */
  const [staff, setStaff] = useState<StaffSession | null>(null);

  /* orders */
  const [openOrders,    setOpenOrders]    = useState<OpenOrder[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  /* modals */
  const [showPayment, setShowPayment] = useState(false);
  const [showVoid,    setShowVoid]    = useState(false);

  /* settings */
  const [taxRate,  setTaxRate]  = useState(0);
  const [currency, setCurrency] = useState('KSh');

  /* loading */
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /* room/location input ref (for auto-focus) */
  const locationRef = useRef<HTMLInputElement>(null);

  /* -- Mount: read session, load settings + orders -------------------------- */
  useEffect(() => {
    const raw = sessionStorage.getItem('pos_session');
    if (!raw) { router.replace('/pos'); return; }

    let session: StaffSession;
    try {
      session = JSON.parse(raw);
    } catch {
      router.replace('/pos');
      return;
    }

    // stock_manager cannot use the terminal
    if (!canAccess(session.role, 'terminal')) {
      router.replace('/pos/inventory');
      return;
    }

    setStaff(session);

    /* Load settings and open orders in parallel */
    Promise.all([
      fetch('/api/pos/settings').then(r => r.json()),
      fetch(`/api/pos/orders?shift_id=${session.shiftId}&limit=50`).then(r => r.json()),
    ]).then(([settingsData, ordersData]) => {
      if (settingsData.settings) {
        setTaxRate(settingsData.settings.tax_rate ?? 0);
        setCurrency(settingsData.settings.currency ?? 'KSh');
      }

      /* Restore open/in-progress orders for this shift */
      const existing: OpenOrder[] = (ordersData.orders ?? [])
        .filter((o: Record<string, unknown>) =>
          ['open', 'sent_to_kitchen', 'ready'].includes(o.status as string),
        )
        .map(mapDbOrder);

      if (existing.length > 0) {
        setOpenOrders(existing);
        const paramTableId = searchParams.get('table_id');
        const matched = paramTableId
          ? existing.find(o => o.table_id === paramTableId)
          : null;
        setActiveOrderId(matched?.id ?? existing[0].id);
      } else {
        const first = blankOrder();
        setOpenOrders([first]);
        setActiveOrderId(first.id);
      }
    }).catch(err => {
      console.error('POS init error', err);
      toast.error('Failed to load POS data');
    }).finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -- Derived: active order ----------------------------------------------- */
  const activeOrder = openOrders.find(o => o.id === activeOrderId) ?? openOrders[0] ?? null;

  /* -- Helpers: mutate order list ------------------------------------------- */
  const patchOrder = useCallback(
    (id: string, patch: Partial<OpenOrder>) => {
      setOpenOrders(prev =>
        prev.map(o => o.id !== id ? o : { ...o, ...patch }),
      );
    },
    [],
  );

  /* -- Cart operations ------------------------------------------------------ */
  const addItemToCart = useCallback((menuItem: POSMenuItem) => {
    setOpenOrders(prev => {
      let orders   = [...prev];
      let targetId = activeOrderId;

      if (!targetId || !orders.find(o => o.id === targetId)) {
        const blank = blankOrder();
        orders   = [...orders, blank];
        targetId = blank.id;
        setActiveOrderId(blank.id);
      }

      return orders.map(o => {
        if (o.id !== targetId) return o;
        const existingIdx = o.items.findIndex(i => i.id === menuItem.id);
        const newItems: CartItem[] = existingIdx >= 0
          ? o.items.map((i, idx) =>
              idx === existingIdx
                ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.price }
                : i,
            )
          : [
              ...o.items,
              {
                id:       menuItem.id,
                name:     menuItem.name,
                price:    menuItem.price,
                qty:      1,
                subtotal: menuItem.price,
                notes:    '',
                tab:      menuItem.tab,
              },
            ];
        return {
          ...o,
          items: newItems,
          total: calcTotal(newItems, o.discountType, o.discountValue, taxRate),
        };
      });
    });
  }, [activeOrderId, taxRate]);

  const updateQty = useCallback((itemId: string, qty: number) => {
    if (!activeOrder) return;
    const newItems = qty < 1
      ? activeOrder.items.filter(i => i.id !== itemId)
      : activeOrder.items.map(i =>
          i.id === itemId ? { ...i, qty, subtotal: qty * i.price } : i,
        );
    patchOrder(activeOrder.id, {
      items: newItems,
      total: calcTotal(newItems, activeOrder.discountType, activeOrder.discountValue, taxRate),
    });
  }, [activeOrder, patchOrder, taxRate]);

  const updateNotes = useCallback((itemId: string, notes: string) => {
    if (!activeOrder) return;
    patchOrder(activeOrder.id, {
      items: activeOrder.items.map(i => i.id === itemId ? { ...i, notes } : i),
    });
  }, [activeOrder, patchOrder]);

  const removeItem = useCallback((itemId: string) => {
    if (!activeOrder) return;
    const newItems = activeOrder.items.filter(i => i.id !== itemId);
    patchOrder(activeOrder.id, {
      items: newItems,
      total: calcTotal(newItems, activeOrder.discountType, activeOrder.discountValue, taxRate),
    });
  }, [activeOrder, patchOrder, taxRate]);

  const handleApplyDiscount = useCallback(
    (type: 'percent' | 'fixed' | '', value: number) => {
      if (!activeOrder) return;
      patchOrder(activeOrder.id, {
        discountType:  type,
        discountValue: value,
        total: calcTotal(activeOrder.items, type, value, taxRate),
      });
    },
    [activeOrder, patchOrder, taxRate],
  );

  /* -- Order management ----------------------------------------------------- */
  const handleNewOrder = useCallback(() => {
    const blank = blankOrder();
    setOpenOrders(prev => [...prev, blank]);
    setActiveOrderId(blank.id);
  }, []);

  const handleSelectOrder = useCallback((id: string) => {
    setActiveOrderId(id);
  }, []);

  /* -- Order type change: auto-fill preset location ------------------------- */
  const handleOrderTypeChange = useCallback((newType: OpenOrder['order_type']) => {
    if (!activeOrder) return;
    const preset = ORDER_TYPES.find(t => t.id === newType)?.preset ?? '';
    patchOrder(activeOrder.id, {
      order_type: newType,
      table_name: preset,
    });
    if (newType === 'room_service' || (newType === 'dine_in' && !activeOrder.table_name)) {
      setTimeout(() => locationRef.current?.focus(), 50);
    }
  }, [activeOrder, patchOrder]);

  /* -- Save order to DB (create or update) ---------------------------------- */
  const saveOrderToDB = useCallback(async (order: OpenOrder): Promise<string> => {
    const { subtotal, discountAmt, taxAmount, total } = calcAmounts(
      order.items, order.discountType, order.discountValue, taxRate,
    );

    const payload = {
      shift_id:        staff?.shiftId ?? null,
      staff_id:        staff?.staffId ?? null,
      staff_name:      staff?.staffName ?? null,
      table_id:        null,           // room_number stored in table_name
      table_name:      order.table_name || null,
      order_type:      order.order_type,
      items:           order.items,
      subtotal,
      discount_type:   order.discountType  || null,
      discount_value:  order.discountValue || 0,
      discount_amount: discountAmt,
      tax_amount:      taxAmount,
      total,
    };

    const isNew = order.id.startsWith('new-');

    if (isNew) {
      const res  = await fetch('/api/pos/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create order');
      return data.order.id as string;
    } else {
      const res  = await fetch(`/api/pos/orders/${order.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...payload, items: order.items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to update order');
      return data.order.id as string;
    }
  }, [staff, taxRate]);

  /* -- Send to kitchen ------------------------------------------------------ */
  const handleSendToKitchen = useCallback(async () => {
    if (!activeOrder || activeOrder.items.length === 0) {
      toast.error('Add at least one item first.');
      return;
    }

    setIsSending(true);
    const prevId = activeOrder.id;

    try {
      const realId = await saveOrderToDB(activeOrder);

      await fetch(`/api/pos/orders/${realId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          status:          'sent_to_kitchen',
          kitchen_sent_at: new Date().toISOString(),
        }),
      });

      /* Print kitchen + bar tickets (fire-and-forget) */
      fetch('/api/pos/print', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type: 'both_tickets', order_id: realId }),
      }).catch(() => {});

      setOpenOrders(prev => prev.map(o =>
        o.id === prevId ? { ...o, id: realId, status: 'sent_to_kitchen' } : o,
      ));
      if (prevId !== realId) setActiveOrderId(realId);

      toast.success('Sent to kitchen!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setIsSending(false);
    }
  }, [activeOrder, saveOrderToDB]);

  /* -- Charge / open payment modal ------------------------------------------ */
  const handleCharge = useCallback(() => {
    if (!activeOrder || activeOrder.items.length === 0) {
      toast.error('Add at least one item first.');
      return;
    }
    setShowPayment(true);
  }, [activeOrder]);

  /* -- Confirm payment ------------------------------------------------------ */
  const handleConfirmPayment = useCallback(async (payment: PaymentPayload) => {
    if (!activeOrder) return;
    const prevId = activeOrder.id;

    try {
      const realId = await saveOrderToDB(activeOrder);

      const { total } = calcAmounts(
        activeOrder.items, activeOrder.discountType, activeOrder.discountValue, taxRate,
      );
      await fetch(`/api/pos/orders/${realId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          status:            'paid',
          payment_method:    payment.payment_method,
          payment_reference: payment.payment_reference,
          amount_tendered:   payment.amount_tendered,
          change_given:      payment.change_given,
          total,
          paid_at:           new Date().toISOString(),
        }),
      });

      /* Print customer receipt */
      fetch('/api/pos/print', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type: 'customer_receipt', order_id: realId }),
      }).catch(() => {});

      setOpenOrders(prev => {
        const remaining = prev.filter(o => o.id !== prevId && o.id !== realId);
        setActiveOrderId(remaining[0]?.id ?? null);
        return remaining;
      });

      setShowPayment(false);
      toast.success('Payment complete!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Unexpected error');
      throw err;
    }
  }, [activeOrder, saveOrderToDB, taxRate]);

  /* -- Void ----------------------------------------------------------------- */
  const handleVoided = useCallback(() => {
    if (!activeOrder) return;
    const voided = activeOrder.id;
    setOpenOrders(prev => {
      const remaining = prev.filter(o => o.id !== voided);
      setActiveOrderId(remaining[0]?.id ?? null);
      return remaining;
    });
    setShowVoid(false);
    toast.success('Order voided.');
  }, [activeOrder]);

  /* -- Loading screen ------------------------------------------------------- */
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        <span>Loading POS…</span>
      </div>
    );
  }

  /* -- Layout --------------------------------------------------------------- */
  return (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden">

      {/* ══════════════════════════════════════════════════════════════════════
          TOP BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center gap-3 min-h-[52px] flex-shrink-0">

        {/* Logo */}
        <span className="font-bold text-white text-sm tracking-tight whitespace-nowrap hidden sm:block">
          Kogelo POS
        </span>
        <div className="hidden sm:block w-px h-5 bg-slate-600" />

        {/* Open order tabs (fills middle) */}
        <div className="flex-1 overflow-hidden">
          <OpenOrdersTabs
            orders={openOrders}
            activeOrderId={activeOrderId}
            onSelect={handleSelectOrder}
            onNew={handleNewOrder}
          />
        </div>

        {/* Nav + staff actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
          <span className="text-slate-300 text-sm hidden lg:block">{staff?.staffName}</span>

          {/* Kitchen link */}
          <Link
            href="/pos/kitchen"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 text-xs font-medium transition-all"
            title="Kitchen Display"
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span className="hidden md:block">Kitchen</span>
          </Link>

          {/* Dashboard link */}
          <Link
            href="/pos/dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 text-xs font-medium transition-all"
            title="POS Dashboard"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden md:block">Dashboard</span>
          </Link>

          {/* Close shift */}
          <Link
            href="/pos/close-shift"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 text-xs font-medium transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Close Shift</span>
          </Link>

          {/* Logout */}
          <Link
            href="/pos"
            title="Exit POS"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN AREA
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">

        {/* -- LEFT PANEL: Menu -- */}
        <div className="flex-1 overflow-y-auto p-3 border-r border-slate-700">
          <MenuGrid
            onAddItem={addItemToCart}
            currency={currency}
          />
        </div>

        {/* -- RIGHT PANEL: Cart -- */}
        <div className="w-80 xl:w-96 flex flex-col bg-slate-800 flex-shrink-0">

          {/* Order header */}
          <div className="px-3 py-2.5 border-b border-slate-700 space-y-2">

            {/* Room / Location input */}
            <div className="relative">
              <input
                ref={locationRef}
                type="text"
                value={activeOrder?.table_name ?? ''}
                onChange={e => activeOrder && patchOrder(activeOrder.id, { table_name: e.target.value })}
                placeholder={
                  activeOrder?.order_type === 'room_service' ? 'Room number (e.g. 101)…' :
                  activeOrder?.order_type === 'dine_in'      ? 'Room or table…' :
                  'Location (optional)…'
                }
                className="w-full bg-slate-900 border border-slate-700 hover:border-slate-500 focus:border-blue-500 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Order type pills */}
            <div className="grid grid-cols-4 gap-1">
              {ORDER_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleOrderTypeChange(t.id)}
                  className={`py-1 rounded-lg text-xs font-medium transition-all text-center
                    ${activeOrder?.order_type === t.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cart items + totals */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <CartPanel
              order={activeOrder}
              onUpdateQty={updateQty}
              onUpdateNotes={updateNotes}
              onRemoveItem={removeItem}
              onApplyDiscount={handleApplyDiscount}
              taxRate={taxRate}
              currency={currency}
            />
          </div>

          {/* Action buttons */}
          <div className="p-3 border-t border-slate-700 space-y-2">
            {/* Send to kitchen */}
            <button
              onClick={handleSendToKitchen}
              disabled={isSending || !activeOrder || activeOrder.items.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all"
            >
              {isSending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <UtensilsCrossed className="w-4 h-4" />}
              {isSending ? 'Sending…' : 'Send to Kitchen'}
            </button>

            {/* Charge */}
            <button
              onClick={handleCharge}
              disabled={!activeOrder || activeOrder.items.length === 0}
              className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-bold text-base transition-all shadow-lg shadow-green-600/20"
            >
              Charge · {currency} {(activeOrder?.total ?? 0).toFixed(2)}
            </button>

            {/* Void */}
            {activeOrder && !activeOrder.id.startsWith('new-') && (
              <button
                onClick={() => setShowVoid(true)}
                className="w-full py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-all"
              >
                Void Order
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={showPayment}
        order={activeOrder}
        currency={currency}
        taxRate={taxRate}
        onClose={() => setShowPayment(false)}
        onConfirm={handleConfirmPayment}
      />

      {/* Void Modal */}
      <VoidModal
        open={showVoid}
        order={activeOrder
          ? { id: activeOrder.id, order_number: activeOrder.order_number || activeOrder.id }
          : null}
        onClose={() => setShowVoid(false)}
        onVoided={handleVoided}
      />
    </div>
  );
}

export default function TerminalPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TerminalInner />
    </Suspense>
  );
}
