'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { NumpadInput } from '@/components/pos/NumpadInput';

/* --- Types ----------------------------------------------------------------- */
interface VoidOrder {
  id: string;
  order_number: string;
}

interface VoidModalProps {
  open:      boolean;
  order:     VoidOrder | null;
  onClose:   () => void;
  onVoided:  () => void;
}

const PRESET_REASONS = [
  'Customer cancelled',
  'Wrong order entered',
  'Item unavailable',
  'Test / training order',
];

/* --- Component ------------------------------------------------------------- */
export function VoidModal({ open, order, onClose, onVoided }: VoidModalProps) {
  const [reason,     setReason]     = useState('');
  const [managerPin, setManagerPin] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  if (!open || !order) return null;

  const handleVoid = async () => {
    if (!reason.trim())        { setError('Please enter a reason.');        return; }
    if (managerPin.length < 4) { setError('Manager PIN must be 4 digits.'); return; }

    setLoading(true);
    setError('');

    try {
      const res  = await fetch(`/api/pos/orders/${order.id}/void`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ reason, manager_pin: managerPin }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Failed to void order');
        setManagerPin('');
        return;
      }

      /* Success — reset & notify parent */
      setReason('');
      setManagerPin('');
      setError('');
      onVoided();
    } catch {
      setError('Network error — please try again');
      setManagerPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setManagerPin('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl border border-red-900/40 flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Void Order</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          <p className="text-slate-400 text-sm">
            Voiding{' '}
            <span className="text-white font-semibold">{order.order_number}</span>.{' '}
            Requires manager authorisation.
          </p>

          {/* Quick-select reason */}
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Reason</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all
                    ${reason === r
                      ? 'bg-red-600/30 border border-red-500/50 text-red-300'
                      : 'bg-slate-700 border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-600'
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Or type a custom reason…"
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500 resize-none placeholder-slate-600 transition-colors"
            />
          </div>

          {/* Manager PIN */}
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">
              Manager PIN
            </p>
            <div className="flex justify-center">
              <NumpadInput
                value={managerPin}
                onChange={setManagerPin}
                maxLength={4}
                masked
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-700 flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 font-medium transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleVoid}
            disabled={loading || !reason.trim() || managerPin.length < 4}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all"
          >
            {loading ? 'Voiding…' : 'Void Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
