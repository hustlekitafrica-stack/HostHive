'use client';

import { useState } from 'react';
import { X, Banknote, Smartphone, CreditCard, DollarSign } from 'lucide-react';

/* --- Types ----------------------------------------------------------------- */
interface CartItem {
  subtotal: number;
}

interface PayModalOrder {
  id: string;
  order_number: string;
  total: number;
  items: CartItem[];
  discountType: 'percent' | 'fixed' | '';
  discountValue: number;
}

export interface PaymentPayload {
  payment_method:    'cash' | 'mpesa' | 'card' | 'mpesa_manual';
  payment_reference: string;
  amount_tendered:   number;
  change_given:      number;
}

interface PaymentModalProps {
  open:      boolean;
  order:     PayModalOrder | null;
  currency:  string;
  taxRate:   number;
  onClose:   () => void;
  onConfirm: (payment: PaymentPayload) => Promise<void>;
}

type Method = 'cash' | 'mpesa' | 'card' | 'mpesa_manual';

const METHODS: { id: Method; label: string; icon: React.ElementType }[] = [
  { id: 'cash',         label: 'Cash',          icon: Banknote     },
  { id: 'mpesa',        label: 'M-Pesa STK',    icon: Smartphone   },
  { id: 'card',         label: 'Card',           icon: CreditCard   },
  { id: 'mpesa_manual', label: 'M-Pesa Manual',  icon: DollarSign   },
];

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

/* --- Helpers --------------------------------------------------------------- */
function calcTotal(order: PayModalOrder, taxRate: number): number {
  const subtotal    = order.items.reduce((s, i) => s + i.subtotal, 0);
  const discountAmt =
    order.discountType === 'percent'
      ? subtotal * (order.discountValue / 100)
      : order.discountType === 'fixed'
      ? Math.min(order.discountValue, subtotal)
      : 0;
  const afterDiscount = subtotal - discountAmt;
  const taxAmt        = afterDiscount * (taxRate / 100);
  return afterDiscount + taxAmt;
}

/* --- Component ------------------------------------------------------------- */
export function PaymentModal({
  open,
  order,
  currency,
  taxRate,
  onClose,
  onConfirm,
}: PaymentModalProps) {
  const [method,    setMethod]    = useState<Method>('cash');
  const [tendered,  setTendered]  = useState('');
  const [reference, setReference] = useState('');
  const [loading,   setLoading]   = useState(false);

  if (!open || !order) return null;

  const total      = calcTotal(order, taxRate);
  const tenderedNum = parseFloat(tendered) || 0;
  const change      = Math.max(0, tenderedNum - total);

  const canConfirm =
    method === 'cash'
      ? tenderedNum >= total
      : method === 'card'
      ? true
      : reference.trim().length > 0;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm({
        payment_method:    method,
        payment_reference: reference.trim(),
        amount_tendered:   method === 'cash' ? tenderedNum : total,
        change_given:      method === 'cash' ? change      : 0,
      });
      /* Reset on success */
      setTendered('');
      setReference('');
      setMethod('cash');
    } finally {
      setLoading(false);
    }
  };

  const discountAmt =
    order.discountType === 'percent'
      ? order.items.reduce((s, i) => s + i.subtotal, 0) * (order.discountValue / 100)
      : order.discountType === 'fixed'
      ? order.discountValue
      : 0;

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl border border-slate-700 flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white">Process Payment</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {/* Order total banner */}
          <div className="bg-slate-900 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">
              {order.order_number} · Amount Due
            </p>
            <p className="text-4xl font-extrabold text-white tabular-nums">
              {currency} {total.toFixed(2)}
            </p>
            {discountAmt > 0 && (
              <p className="text-amber-400 text-xs mt-1">
                Discount applied: −{currency} {discountAmt.toFixed(2)}
              </p>
            )}
          </div>

          {/* Payment method selector */}
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Payment Method</p>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setMethod(m.id); setTendered(''); setReference(''); }}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all
                      ${method === m.id
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                        : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                      }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash: amount tendered */}
          {method === 'cash' && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Amount Tendered</p>
              <div className="relative mb-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium select-none">
                  {currency}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={tendered}
                  onChange={e => setTendered(e.target.value)}
                  placeholder={total.toFixed(2)}
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-14 pr-4 py-3 text-white text-right text-xl font-semibold focus:outline-none focus:border-blue-500 tabular-nums"
                />
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 flex-wrap">
                {QUICK_AMOUNTS.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setTendered(String(amt))}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm font-medium transition-all"
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
                <button
                  onClick={() => setTendered(total.toFixed(2))}
                  className="px-3 py-1.5 bg-green-700/40 hover:bg-green-700/70 border border-green-600/40 rounded-lg text-green-300 text-sm font-medium transition-all"
                >
                  Exact
                </button>
              </div>

              {/* Change display */}
              {tenderedNum > 0 && (
                <div className={`mt-4 rounded-xl p-3 text-center border
                  ${change > 0
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-slate-700/50 border-slate-600'
                  }`}
                >
                  <p className="text-slate-400 text-xs mb-0.5">Change</p>
                  <p className={`text-2xl font-bold tabular-nums ${change > 0 ? 'text-green-400' : 'text-slate-400'}`}>
                    {currency} {change.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* M-Pesa / Card reference */}
          {(method === 'mpesa' || method === 'mpesa_manual' || method === 'card') && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                {method === 'card' ? 'Card Reference (optional)' : 'M-Pesa Transaction Code'}
              </p>
              <input
                type="text"
                value={reference}
                onChange={e => setReference(e.target.value.toUpperCase())}
                placeholder={
                  method === 'mpesa' || method === 'mpesa_manual'
                    ? 'e.g. QHB2XXXXXX'
                    : 'Optional reference…'
                }
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white tracking-widest font-mono focus:outline-none focus:border-blue-500"
              />
              {(method === 'mpesa' || method === 'mpesa_manual') && (
                <p className="text-slate-500 text-xs mt-1">
                  Enter the M-Pesa confirmation code from the customer&apos;s phone.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-700">
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed rounded-xl text-white font-bold text-lg transition-all shadow-lg shadow-green-600/20 disabled:shadow-none"
          >
            {loading
              ? 'Processing…'
              : `Confirm ${method === 'cash' ? `· Change ${currency} ${change.toFixed(2)}` : `· ${currency} ${total.toFixed(2)}`}`}
          </button>
        </div>
      </div>
    </div>
  );
}
