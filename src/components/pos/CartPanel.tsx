'use client';

import { useState } from 'react';
import { Minus, Plus, Trash2, MessageSquare, Tag, X } from 'lucide-react';

/* --- Types (mirrored from terminal page) ---------------------------------- */
export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  subtotal: number;
  notes: string;
  tab: string;
}

export interface CartOrder {
  id: string;
  order_number: string;
  table_name: string;
  total: number;
  status: string;
  items: CartItem[];
  discountType: 'percent' | 'fixed' | '';
  discountValue: number;
}

interface CartPanelProps {
  order: CartOrder | null;
  onUpdateQty:     (itemId: string, qty: number) => void;
  onUpdateNotes:   (itemId: string, notes: string) => void;
  onRemoveItem:    (itemId: string) => void;
  onApplyDiscount: (type: 'percent' | 'fixed' | '', value: number) => void;
  taxRate:  number;
  currency: string;
}

/* --- Helpers --------------------------------------------------------------- */
function calcTotals(
  order: CartOrder,
  taxRate: number,
): { subtotal: number; discountAmt: number; taxAmt: number; total: number } {
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

/* --- Component ------------------------------------------------------------- */
export function CartPanel({
  order,
  onUpdateQty,
  onUpdateNotes,
  onRemoveItem,
  onApplyDiscount,
  taxRate,
  currency,
}: CartPanelProps) {
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesValue, setNotesValue]         = useState('');
  const [showDiscount, setShowDiscount]     = useState(false);
  const [discountType, setDiscountType]     = useState<'percent' | 'fixed'>('percent');
  const [discountInput, setDiscountInput]   = useState('');

  /* -- Empty state -- */
  if (!order) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm p-4">
        No active order
      </div>
    );
  }

  const { subtotal, discountAmt, taxAmt, total } = calcTotals(order, taxRate);

  const applyDiscount = () => {
    const val = parseFloat(discountInput);
    if (!isNaN(val) && val >= 0) {
      onApplyDiscount(discountType, val);
    }
    setShowDiscount(false);
    setDiscountInput('');
  };

  const clearDiscount = () => {
    onApplyDiscount('', 0);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* -- Items list -- */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {order.items.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm text-center py-10 px-4">
            Tap a menu item to add it to this order
          </div>
        ) : (
          order.items.map(item => (
            <div
              key={item.id}
              className="bg-slate-900 rounded-xl p-3 space-y-2"
            >
              {/* Row 1: name + qty controls + delete */}
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium leading-snug">{item.name}</p>
                  <p className="text-green-400 text-xs mt-0.5">
                    {currency} {item.price.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onUpdateQty(item.id, item.qty - 1)}
                    className="w-6 h-6 rounded-full bg-slate-700 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center text-white transition-all"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-white font-bold text-sm w-5 text-center select-none">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.id, item.qty + 1)}
                    className="w-6 h-6 rounded-full bg-slate-700 hover:bg-green-500/20 hover:text-green-400 flex items-center justify-center text-white transition-all"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="w-6 h-6 rounded-full bg-red-500/10 hover:bg-red-500/25 flex items-center justify-center text-red-400 transition-all ml-0.5"
                    title="Remove item"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Row 2: notes */}
              {editingNotesId === item.id ? (
                <div className="flex gap-1.5">
                  <input
                    autoFocus
                    value={notesValue}
                    onChange={e => setNotesValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        onUpdateNotes(item.id, notesValue);
                        setEditingNotesId(null);
                      } else if (e.key === 'Escape') {
                        setEditingNotesId(null);
                      }
                    }}
                    placeholder="Add a note…"
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => {
                      onUpdateNotes(item.id, notesValue);
                      setEditingNotesId(null);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 px-2 font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingNotesId(null)}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingNotesId(item.id);
                    setNotesValue(item.notes);
                  }}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span className="italic">{item.notes || 'Add note…'}</span>
                </button>
              )}

              {/* Row 3: line total */}
              <div className="text-right text-slate-400 text-xs">
                = {currency} {item.subtotal.toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* -- Totals -- */}
      <div className="border-t border-slate-700 p-3 space-y-1.5 bg-slate-800/50">

        <div className="flex justify-between text-slate-400 text-sm">
          <span>Subtotal</span>
          <span>{currency} {subtotal.toFixed(2)}</span>
        </div>

        {order.discountType && order.discountValue > 0 ? (
          <div className="flex items-center justify-between text-amber-400 text-sm">
            <span className="flex items-center gap-1">
              Discount
              {order.discountType === 'percent' && ` (${order.discountValue}%)`}
              <button onClick={clearDiscount} className="ml-1 text-slate-500 hover:text-slate-300">
                <X className="w-3 h-3" />
              </button>
            </span>
            <span>−{currency} {discountAmt.toFixed(2)}</span>
          </div>
        ) : null}

        {taxRate > 0 && (
          <div className="flex justify-between text-slate-400 text-sm">
            <span>VAT ({taxRate}%)</span>
            <span>{currency} {taxAmt.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-white font-bold text-base pt-1.5 border-t border-slate-700">
          <span>TOTAL</span>
          <span>{currency} {total.toFixed(2)}</span>
        </div>

        {/* Discount toggle */}
        {!showDiscount ? (
          <button
            onClick={() => setShowDiscount(true)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-amber-400 transition-colors mt-1"
          >
            <Tag className="w-3 h-3" />
            {order.discountType ? 'Edit discount' : 'Add discount'}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 mt-1">
            <select
              value={discountType}
              onChange={e => setDiscountType(e.target.value as 'percent' | 'fixed')}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 text-xs focus:outline-none"
            >
              <option value="percent">%</option>
              <option value="fixed">Fixed</option>
            </select>
            <input
              autoFocus
              type="number"
              min="0"
              step="any"
              value={discountInput}
              onChange={e => setDiscountInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') applyDiscount(); }}
              placeholder="Amount"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={applyDiscount}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium px-1"
            >
              Apply
            </button>
            <button
              onClick={() => setShowDiscount(false)}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
