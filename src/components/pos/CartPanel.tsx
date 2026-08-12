'use client';

import { useState } from 'react';
import { Minus, Plus, Trash2, MessageSquare, X, UserPlus, Loader2, UtensilsCrossed, Beer } from 'lucide-react';
import { canPerformTerminalAction } from '@/lib/pos/session';

/* ─── Types ─────────────────────────────────────────────────────────────── */
export interface CartItem {
  id:       string;
  name:     string;
  price:    number;
  qty:      number;
  subtotal: number;
  notes:    string;
  tab:      string;
}

export interface CartOrder {
  id:            string;
  order_number:  string;
  table_name:    string;
  total:         number;
  status:        string;
  items:         CartItem[];
  discountType:  'percent' | 'fixed' | '';
  discountValue: number;
}

export interface CartPanelProps {
  order:              CartOrder | null;
  role:               string;
  currency:           string;
  taxRate:            number;

  /* table / location */
  tableName?:         string;
  onTableNameChange?: (v: string) => void;

  /* item mutations */
  onUpdateQty:        (itemId: string, qty: number) => void;
  onUpdateNotes:      (itemId: string, notes: string) => void;
  onRemoveItem:       (itemId: string) => void;
  onApplyDiscount:    (type: 'percent' | 'fixed' | '', value: number) => void;

  /* order actions */
  onClear:            () => void;
  onCharge:           () => void;
  onSendToKitchen:    () => void;
  onHold:             () => void;
  onSplit:            () => void;
  onVoid?:            () => void;
  isSending?:         boolean;
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function calcTotals(order: CartOrder, taxRate: number) {
  const subtotal    = order.items.reduce((s, i) => s + i.subtotal, 0);
  const discountAmt =
    order.discountType === 'percent'
      ? subtotal * (order.discountValue / 100)
      : order.discountType === 'fixed'
      ? Math.min(order.discountValue, subtotal)
      : 0;
  const afterDiscount = subtotal - discountAmt;
  const taxAmt        = afterDiscount * (taxRate / 100);
  return { subtotal, discountAmt, taxAmt, total: afterDiscount + taxAmt };
}

/* Small helper: a grayed-out disabled button with tooltip */
function DisabledBtn({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <button
      disabled
      title="Manager / Cashier only"
      className={`opacity-40 cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export function CartPanel({
  order,
  role,
  currency,
  taxRate,
  tableName = '',
  onTableNameChange,
  onUpdateQty,
  onUpdateNotes,
  onRemoveItem,
  onApplyDiscount,
  onClear,
  onCharge,
  onSendToKitchen,
  onHold,
  onSplit,
  onVoid,
  isSending = false,
}: CartPanelProps) {
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesValue,     setNotesValue]     = useState('');
  const [showDiscount,   setShowDiscount]   = useState(false);
  const [discountType,   setDiscountType]   = useState<'percent' | 'fixed'>('percent');
  const [discountInput,  setDiscountInput]  = useState('');

  /* permissions */
  const canCharge   = canPerformTerminalAction(role, 'charge');
  const canDiscount = canPerformTerminalAction(role, 'apply_discount');
  const canSplit    = canPerformTerminalAction(role, 'split_bill');
  const canVoid     = canPerformTerminalAction(role, 'void_order');
  const canSend     = canPerformTerminalAction(role, 'send_to_kitchen');
  const canHold     = canPerformTerminalAction(role, 'hold_order');

  const hasItems     = (order?.items.length ?? 0) > 0;
  const hasBarItems  = (order?.items ?? []).some(i => i.tab === 'bar');
  const hasKitchItems = (order?.items ?? []).some(i => i.tab !== 'bar');
  const sendLabel = hasBarItems && hasKitchItems
    ? 'Send to Kitchen & Bar'
    : hasBarItems
    ? 'Send to Bar'
    : 'Send to Kitchen';
  const SendIcon  = hasBarItems && !hasKitchItems ? Beer : UtensilsCrossed;
  const totals    = order ? calcTotals(order, taxRate) : null;

  const applyDiscount = () => {
    const val = parseFloat(discountInput);
    if (!isNaN(val) && val >= 0) onApplyDiscount(discountType, val);
    setShowDiscount(false);
    setDiscountInput('');
  };

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#1e2436]">

      {/* ── Cart header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/60">
        <span className="text-white text-sm font-semibold">Cart:</span>
        <button
          onClick={onClear}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
        >
          Clear
        </button>
      </div>

      {/* ── Table number ────────────────────────────────────────── */}
      <div className="px-3 pt-2.5">
        <input
          type="text"
          value={tableName}
          onChange={e => onTableNameChange?.(e.target.value)}
          placeholder="Table number (optional)"
          className="w-full bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* ── Add customer ────────────────────────────────────────── */}
      <div className="px-3 pt-2">
        <button className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
          <UserPlus className="w-3.5 h-3.5" />
          + Add customer
        </button>
      </div>

      {/* ── Items list ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 pt-3 space-y-2">
        {!hasItems ? (
          <div className="h-24 flex items-center justify-center text-slate-500 text-xs text-center">
            Tap a menu item to add it
          </div>
        ) : (
          order!.items.map(item => (
            <div key={item.id} className="space-y-1">
              {/* Item row */}
              <div className="flex items-center gap-2">
                {/* Name + price */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{item.name}</p>
                  <p className="text-slate-400 text-[11px]">
                    {currency} {item.price.toFixed(2)}
                  </p>
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onUpdateQty(item.id, item.qty - 1)}
                    className="w-5 h-5 rounded-full bg-slate-700 hover:bg-red-500/30 hover:text-red-300 flex items-center justify-center text-white transition-all"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="text-white text-xs font-bold w-4 text-center select-none">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.id, item.qty + 1)}
                    className="w-5 h-5 rounded-full bg-slate-700 hover:bg-green-500/30 hover:text-green-300 flex items-center justify-center text-white transition-all"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Line total + delete */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-slate-300 text-xs w-14 text-right tabular-nums">
                    {currency} {item.subtotal.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="w-4 h-4 flex items-center justify-center text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Note row */}
              {editingNotesId === item.id ? (
                <div className="flex gap-1 ml-0.5">
                  <input
                    autoFocus
                    value={notesValue}
                    onChange={e => setNotesValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { onUpdateNotes(item.id, notesValue); setEditingNotesId(null); }
                      else if (e.key === 'Escape') setEditingNotesId(null);
                    }}
                    placeholder="Add a note…"
                    className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-white text-[11px] focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => { onUpdateNotes(item.id, notesValue); setEditingNotesId(null); }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 px-1 font-medium"
                  >Save</button>
                  <button onClick={() => setEditingNotesId(null)} className="text-slate-500 hover:text-slate-300">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditingNotesId(item.id); setNotesValue(item.notes); }}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-400 ml-0.5"
                >
                  <MessageSquare className="w-2.5 h-2.5" />
                  <span className="italic">{item.notes || 'Note:'}</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Totals + actions ────────────────────────────────────── */}
      <div className="border-t border-slate-700/60 px-3 pt-2.5 pb-3 space-y-2 bg-[#1e2436]">

        {/* Totals */}
        {totals && (
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="tabular-nums">{currency} {totals.subtotal.toFixed(2)}</span>
            </div>
            {order!.discountType && order!.discountValue > 0 && (
              <div className="flex items-center justify-between text-amber-400">
                <span className="flex items-center gap-1">
                  Discount
                  {order!.discountType === 'percent' && ` (${order!.discountValue}%)`}
                  <button onClick={() => onApplyDiscount('', 0)} className="text-slate-500 hover:text-slate-300 ml-0.5">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
                <span className="tabular-nums">−{currency} {totals.discountAmt.toFixed(2)}</span>
              </div>
            )}
            {taxRate > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Tax ({taxRate}%)</span>
                <span className="tabular-nums">{currency} {totals.taxAmt.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-semibold pt-0.5 border-t border-slate-700/50">
              <span>Total</span>
              <span className="tabular-nums">{currency} {totals.total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Discount input (inline) */}
        {showDiscount && (
          <div className="flex gap-1.5 items-center">
            <select
              value={discountType}
              onChange={e => setDiscountType(e.target.value as 'percent' | 'fixed')}
              className="bg-slate-700 border border-slate-600 rounded px-1.5 py-1 text-white text-xs focus:outline-none"
            >
              <option value="percent">%</option>
              <option value="fixed">{currency}</option>
            </select>
            <input
              autoFocus
              type="number"
              min="0"
              value={discountInput}
              onChange={e => setDiscountInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') applyDiscount(); else if (e.key === 'Escape') setShowDiscount(false); }}
              placeholder="Amount"
              className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500"
            />
            <button onClick={applyDiscount} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded font-medium">
              OK
            </button>
            <button onClick={() => setShowDiscount(false)} className="text-slate-500 hover:text-slate-300">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Pay button */}
        {canCharge ? (
          <button
            onClick={onCharge}
            disabled={!hasItems}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-white font-bold text-sm transition-all flex items-center justify-between px-4"
          >
            <span>Pay</span>
            <span className="tabular-nums">{currency} {(totals?.total ?? 0).toFixed(2)}</span>
          </button>
        ) : (
          <DisabledBtn className="w-full py-2.5 bg-blue-600 rounded-lg text-white font-bold text-sm flex items-center justify-between px-4">
            <span>Pay</span>
            <span className="tabular-nums">{currency} {(totals?.total ?? 0).toFixed(2)}</span>
          </DisabledBtn>
        )}

        {/* Apply discount */}
        {canDiscount ? (
          <button
            onClick={() => setShowDiscount(s => !s)}
            disabled={!hasItems}
            className="w-full py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-slate-200 text-xs font-medium transition-all"
          >
            Apply discount
          </button>
        ) : (
          <DisabledBtn className="w-full py-2 bg-slate-700 rounded-lg text-slate-200 text-xs font-medium">
            Apply discount
          </DisabledBtn>
        )}

        {/* Send to kitchen + Split by item */}
        <div className="grid grid-cols-2 gap-2">
          {canSend ? (
            <button
              onClick={onSendToKitchen}
              disabled={isSending || !hasItems}
              className="py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-slate-200 text-xs font-medium transition-all flex items-center justify-center gap-1"
            >
              {isSending
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <SendIcon className="w-3 h-3" />}
              <span>{isSending ? 'Sending…' : sendLabel}</span>
            </button>
          ) : (
            <DisabledBtn className="py-2 bg-slate-700 rounded-lg text-slate-200 text-xs font-medium flex items-center justify-center gap-1">
              <SendIcon className="w-3 h-3" />
              {sendLabel}
            </DisabledBtn>
          )}

          {canSplit ? (
            <button
              onClick={onSplit}
              disabled={!hasItems}
              className="py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-slate-200 text-xs font-medium transition-all"
            >
              Split by item
            </button>
          ) : (
            <DisabledBtn className="py-2 bg-slate-700 rounded-lg text-slate-200 text-xs font-medium">
              Split by item
            </DisabledBtn>
          )}
        </div>

        {/* Hold for later */}
        {canHold ? (
          <button
            onClick={onHold}
            disabled={!hasItems}
            className="w-full py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-medium transition-all"
          >
            Hold for later
          </button>
        ) : (
          <DisabledBtn className="w-full py-1.5 text-slate-400 rounded-lg text-xs font-medium">
            Hold for later
          </DisabledBtn>
        )}

        {/* Void order (manager only, only for saved orders) */}
        {order && !order.id.startsWith('new-') && (
          canVoid ? (
            <button
              onClick={onVoid}
              className="w-full py-1.5 text-red-500 hover:text-red-300 hover:bg-red-500/10 rounded-lg text-xs font-medium transition-all"
            >
              Void Order
            </button>
          ) : (
            <DisabledBtn className="w-full py-1.5 text-red-700 rounded-lg text-xs font-medium">
              Void Order
            </DisabledBtn>
          )
        )}
      </div>
    </div>
  );
}
