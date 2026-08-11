'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Clock, Lock, Loader2 } from 'lucide-react';

import { POSNav }         from '@/components/pos/POSNav';
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

  /* room/location input ref (kept for potential future auto-focus) */
  const locationRef = useRef<HTMLInputElement>(null); // eslint-disable-line @typescript-eslint/no-unused-vars

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

  /* -- Hold for later -------------------------------------------------------- */
  const handleHold = useCallback(async () => {
    if (!activeOrder || activeOrder.items.length === 0) {
      toast.error('Add at least one item first.');
      return;
    }
    try {
      const realId = await saveOrderToDB(activeOrder);
      await fetch(`/api/pos/orders/${realId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'on_hold' }),
      });
      setOpenOrders(prev => {
        const remaining = prev.filter(o => o.id !== activeOrder.id && o.id !== realId);
        setActiveOrderId(remaining[0]?.id ?? null);
        return remaining;
      });
      toast.success('Order held.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to hold order');
    }
  }, [activeOrder, saveOrderToDB]);

  /* -- Split bill (placeholder) --------------------------------------------- */
  const handleSplit = useCallback(() => {
    toast('Split by item coming soon.', { icon: '✂️' });
  }, []);

  /* -- Clear cart ------------------------------------------------------------ */
  const handleClear = useCallback(() => {
    if (!activeOrderId) return;
    patchOrder(activeOrderId, { items: [], total: 0, discountType: '', discountValue: 0 });
  }, [activeOrderId, patchOrder]);

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
    <div className="h-screen flex overflow-hidden bg-slate-900">

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
      <POSNav />

      {/* ── CENTER: order tabs + menu grid ───────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-800">

        {/* Thin order-tabs row */}
        <div className="px-3 py-1.5 border-b border-slate-800 bg-slate-900 flex-shrink-0">
          <OpenOrdersTabs
            orders={openOrders}
            activeOrderId={activeOrderId}
            onSelect={handleSelectOrder}
            onNew={handleNewOrder}
          />
        </div>

        {/* Order type pills */}
        <div className="px-3 py-1.5 border-b border-slate-800 bg-slate-900 flex-shrink-0">
          <div className="flex gap-1">
            {ORDER_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => handleOrderTypeChange(t.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all
                  ${activeOrder?.order_type === t.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Menu grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <MenuGrid onAddItem={addItemToCart} currency={currency} />
        </div>
      </div>

      {/* ── RIGHT: cart column ───────────────────────────────────────── */}
      <div className="w-72 xl:w-80 flex flex-col bg-[#1e2436] flex-shrink-0">

        {/* Time Clock + Lock row */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/60">
          <Link
            href="/pos/close-shift"
            className="flex items-center gap-1.5 flex-1 px-2.5 py-1.5 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 rounded-lg text-slate-300 text-xs font-medium transition-all"
          >
            <Clock className="w-3.5 h-3.5" />
            Time clock
          </Link>
          <Link
            href="/pos"
            onClick={() => sessionStorage.removeItem('pos_session')}
            title="Lock terminal"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 rounded-lg text-slate-300 text-xs font-medium transition-all"
          >
            <Lock className="w-3.5 h-3.5" />
            Lock
          </Link>
        </div>

        {/* Cart panel (fills remaining height) */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <CartPanel
            order={activeOrder}
            role={staff?.role ?? ''}
            currency={currency}
            taxRate={taxRate}
            tableName={activeOrder?.table_name ?? ''}
            onTableNameChange={v => activeOrder && patchOrder(activeOrder.id, { table_name: v })}
            onUpdateQty={updateQty}
            onUpdateNotes={updateNotes}
            onRemoveItem={removeItem}
            onApplyDiscount={handleApplyDiscount}
            onClear={handleClear}
            onCharge={handleCharge}
            onSendToKitchen={handleSendToKitchen}
            onHold={handleHold}
            onSplit={handleSplit}
            onVoid={() => setShowVoid(true)}
            isSending={isSending}
          />
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
