'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  LogOut,
  Clock,
  ShoppingBag,
  Banknote,
  Smartphone,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Printer,
  ChevronRight,
} from 'lucide-react';

// -- Types ---------------------------------------------------------------------

interface ShiftData {
  id: string;
  staff_id: string;
  staff_name: string;
  opened_at: string;
  closed_at: string | null;
  status: 'open' | 'closed';
  opening_float: number;
  total_orders: number;
  // The PATCH endpoint computes these fields when closing.
  // On GET they may already exist if it was auto-calculated on open or from a previous partial close.
  total_cash_sales?: number;
  total_mpesa_sales?: number;
  total_card_sales?: number;
  total_sales?: number;
}

// -- Helpers -------------------------------------------------------------------

function fmt(n: number) {
  return n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

// -- Page ----------------------------------------------------------------------

export default function CloseShiftPage() {
  const router = useRouter();

  // Session state
  const [staffId,   setStaffId]   = useState('');
  const [staffName, setStaffName] = useState('');
  const [shiftId,   setShiftId]   = useState('');

  // Shift data
  const [shift,     setShift]     = useState<ShiftData | null>(null);
  const [loading,   setLoading]   = useState(true);

  // Form state
  const [closingCash, setClosingCash] = useState('');
  const [notes,       setNotes]       = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  // -- Read sessionStorage & guard ------------------------------------------

  useEffect(() => {
    const sId   = sessionStorage.getItem('staffId')   ?? '';
    const sName = sessionStorage.getItem('staffName') ?? '';
    const shId  = sessionStorage.getItem('shiftId')   ?? '';

    if (!sId || !shId) {
      router.replace('/pos');
      return;
    }

    setStaffId(sId);
    setStaffName(sName);
    setShiftId(shId);

    // Fetch shift
    fetch(`/api/pos/shifts/${shId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.shift) setShift(data.shift);
        else toast.error('Could not load shift data');
      })
      .catch(() => toast.error('Network error loading shift'))
      .finally(() => setLoading(false));
  }, [router]);

  // -- Derived values -------------------------------------------------------

  const openingFloat     = shift?.opening_float   ?? 0;
  const totalCashSales   = shift?.total_cash_sales ?? 0;
  const totalMpesaSales  = shift?.total_mpesa_sales ?? 0;
  const totalCardSales   = shift?.total_card_sales ?? 0;
  const totalRevenue     = shift?.total_sales ?? (totalCashSales + totalMpesaSales + totalCardSales);
  const totalOrders      = shift?.total_orders ?? 0;
  const expectedCash     = openingFloat + totalCashSales;
  const counted          = Number(closingCash) || 0;
  const difference       = counted - expectedCash;
  const differenceLabel  = difference === 0
    ? 'Balanced'
    : difference > 0
    ? `+KSh ${fmt(difference)} over`
    : `KSh ${fmt(Math.abs(difference))} short`;
  const differenceColor  = difference === 0
    ? 'text-green-400'
    : difference > 0
    ? 'text-blue-400'
    : 'text-red-400';

  // -- Submit ----------------------------------------------------------------

  const handleCloseShift = async () => {
    if (!closingCash.trim()) return;
    setSubmitting(true);

    try {
      // 1. PATCH shift
      const patchRes = await fetch(`/api/pos/shifts/${shiftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closing_cash_counted: Number(closingCash),
          notes: notes.trim() || null,
        }),
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok) {
        toast.error(patchData.error ?? 'Failed to close shift');
        setSubmitting(false);
        return;
      }

      // 2. Print Z-report
      const printRes = await fetch('/api/pos/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'z_report', shift_id: shiftId }),
      });
      const printData = await printRes.json();
      if (printData.printers_failed?.length) {
        toast('Z-Report queued but printer unreachable', {
          icon: '⚠️',
          style: { background: '#1e293b', color: '#fbbf24', border: '1px solid #f59e0b' },
        });
      } else {
        toast.success('Printed Z-Report to bar printer');
      }

      // 3. Clear sessionStorage
      sessionStorage.removeItem('staffId');
      sessionStorage.removeItem('staffName');
      sessionStorage.removeItem('role');
      sessionStorage.removeItem('shiftId');

      // 4. Navigate back
      router.push('/pos');
    } catch {
      toast.error('Unexpected error closing shift');
      setSubmitting(false);
    }
  };

  // -- Loading ---------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500" />
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Shift not found.
      </div>
    );
  }

  // -- Render ----------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-xl">
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Close Shift</h1>
              <p className="text-xs text-slate-400">{staffName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Opened {fmtTime(shift.opened_at)}</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* -- Shift summary card ------------------------------------------- */}
        <section className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700">
            <h2 className="font-semibold text-slate-200">Shift Summary</h2>
          </div>

          <div className="p-5 space-y-4">
            {/* Orders + Revenue row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-700/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingBag className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-slate-400">Total Orders</span>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">{totalOrders}</p>
              </div>
              <div className="bg-slate-700/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Banknote className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-slate-400">Total Revenue</span>
                </div>
                <p className="text-2xl font-bold text-green-400 tabular-nums">
                  KSh {fmt(totalRevenue)}
                </p>
              </div>
            </div>

            {/* Payment breakdown */}
            <div className="space-y-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                Payment Breakdown
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-slate-300">Cash Sales</span>
                  </div>
                  <span className="font-semibold tabular-nums">KSh {fmt(totalCashSales)}</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-slate-300">M-Pesa Sales</span>
                  </div>
                  <span className="font-semibold tabular-nums">KSh {fmt(totalMpesaSales)}</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-slate-300">Card Sales</span>
                  </div>
                  <span className="font-semibold tabular-nums">KSh {fmt(totalCardSales)}</span>
                </div>
              </div>
            </div>

            {/* Cash reconciliation */}
            <div className="space-y-2 pt-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                Cash Reconciliation
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-700/30 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-slate-500 mb-0.5">Opening Float</p>
                  <p className="font-semibold tabular-nums">KSh {fmt(openingFloat)}</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-slate-500 mb-0.5">Expected Cash</p>
                  <p className="font-semibold tabular-nums">KSh {fmt(expectedCash)}</p>
                </div>
              </div>
            </div>

            {/* Live difference preview */}
            {closingCash && (
              <div
                className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                  difference === 0
                    ? 'border-green-500/30 bg-green-500/10'
                    : difference > 0
                    ? 'border-blue-500/30 bg-blue-500/10'
                    : 'border-red-500/30 bg-red-500/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  {difference === 0 ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertTriangle className={`w-4 h-4 ${difference > 0 ? 'text-blue-400' : 'text-red-400'}`} />
                  )}
                  <span className="text-sm font-medium">Variance</span>
                </div>
                <span className={`font-bold tabular-nums ${differenceColor}`}>
                  {differenceLabel}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* -- Closing cash input ---------------------------------------------- */}
        <section className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Actual Cash in Drawer (KSh)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={closingCash}
              onChange={(e) => setClosingCash(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-lg font-semibold
                         placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500
                         tabular-nums"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Any discrepancies or notes about this shift…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white
                         placeholder-slate-500 resize-none focus:outline-none focus:ring-2
                         focus:ring-red-500/50 focus:border-red-500"
            />
          </div>
        </section>

        {/* -- Action button --------------------------------------------------- */}
        <button
          onClick={handleCloseShift}
          disabled={!closingCash.trim() || submitting}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg
                     bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500
                     disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          {submitting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              <Printer className="w-5 h-5" />
              Close Shift &amp; Print Z-Report
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-600 pb-4">
          This action is irreversible. The Z-Report will be sent to the bar printer.
        </p>
      </main>
    </div>
  );
}
