'use client';

import { Printer, User, Clock, TrendingUp } from 'lucide-react';

export interface ShiftData {
  id: string;
  staff_name: string;
  opened_at: string;
  closed_at?: string;
  opening_float: number;
  total_cash_sales: number;
  total_mpesa_sales: number;
  total_card_sales: number;
  total_sales: number;
  total_orders: number;
  total_voids: number;
  expected_cash: number;
  cash_variance?: number;
  closing_cash_counted?: number;
  status: 'open' | 'closed';
}

interface ShiftSummaryProps {
  shift: ShiftData;
  currency: string;
  onPrintZReport?: () => void;
}

// --- Helpers ------------------------------------------------------------------

/** Format an amount as "KSh X,XXX" (no decimals). */
function fmt(amount: number): string {
  return `KSh ${Math.round(Math.abs(amount)).toLocaleString()}`;
}

/** Format an ISO timestamp as "04 Aug 2026, 08:00". */
function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return iso;
  }
}

// --- Sub-components -----------------------------------------------------------

function StatRow({
  label,
  value,
  valueClass = 'text-white',
  subValue,
}: {
  label: string;
  value: string;
  valueClass?: string;
  subValue?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
      <span className="text-slate-400 text-sm">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-semibold tabular-nums ${valueClass}`}>
          {value}
        </span>
        {subValue && (
          <p className="text-slate-500 text-xs">{subValue}</p>
        )}
      </div>
    </div>
  );
}

// --- Main component -----------------------------------------------------------

export function ShiftSummary({ shift, onPrintZReport }: ShiftSummaryProps) {
  // Derive expected cash and variance
  const expectedCash = shift.opening_float + shift.total_cash_sales;

  const variance: number | undefined =
    shift.cash_variance !== undefined
      ? shift.cash_variance
      : shift.closing_cash_counted !== undefined
        ? shift.closing_cash_counted - expectedCash
        : undefined;

  const varianceDisplay =
    variance !== undefined
      ? variance >= 0
        ? `+${fmt(variance)}`
        : `-${fmt(variance)}`
      : undefined;

  const varianceClass =
    variance !== undefined && variance < 0 ? 'text-red-400' : 'text-green-400';

  return (
    <div className="bg-slate-800 rounded-xl p-6 flex flex-col gap-5">

      {/* -- Header ------------------------------------------------ */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-white text-lg font-bold leading-tight">
            Shift Summary
          </h2>

          {/* Staff + time */}
          <div className="flex items-center gap-1.5 mt-1.5 text-slate-300 text-sm">
            <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="font-medium truncate">{shift.staff_name}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-1.5 mt-0.5 text-slate-500 text-xs">
            <Clock className="w-3 h-3 shrink-0" />
            <span>Opened {fmtTime(shift.opened_at)}</span>
            {shift.closed_at && (
              <>
                <span className="opacity-40">·</span>
                <span>Closed {fmtTime(shift.closed_at)}</span>
              </>
            )}
          </div>
        </div>

        {/* Status badge */}
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            shift.status === 'open'
              ? 'bg-green-500/15 text-green-400 border-green-500/30'
              : 'bg-slate-600/30 text-slate-400 border-slate-600/60'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              shift.status === 'open' ? 'bg-green-400 animate-pulse' : 'bg-slate-500'
            }`}
          />
          {shift.status === 'open' ? 'Open' : 'Closed'}
        </span>
      </div>

      {/* -- Hero totals -------------------------------------------- */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/60 rounded-lg px-4 py-3 border border-slate-700/40">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            <p className="text-slate-400 text-xs uppercase tracking-wide">
              Total Revenue
            </p>
          </div>
          <p className="text-green-400 text-2xl font-bold tabular-nums leading-none">
            {fmt(shift.total_sales)}
          </p>
        </div>

        <div className="bg-slate-900/60 rounded-lg px-4 py-3 border border-slate-700/40">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">
            Orders
          </p>
          <p className="text-white text-2xl font-bold tabular-nums leading-none">
            {shift.total_orders}
          </p>
        </div>
      </div>

      {/* -- Breakdown grid ----------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        {/* Left column – payment breakdown */}
        <div>
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">
            Payment Breakdown
          </p>
          <StatRow label="Cash Sales"  value={fmt(shift.total_cash_sales)}  />
          <StatRow label="M-Pesa Sales" value={fmt(shift.total_mpesa_sales)} />
          <StatRow label="Card Sales"   value={fmt(shift.total_card_sales)}  />
        </div>

        {/* Right column – cash reconciliation */}
        <div className="mt-4 sm:mt-0">
          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">
            Cash Reconciliation
          </p>
          <StatRow label="Opening Float" value={fmt(shift.opening_float)} />
          <StatRow label="Expected Cash"  value={fmt(expectedCash)} />
          {shift.closing_cash_counted !== undefined && (
            <StatRow
              label="Cash Counted"
              value={fmt(shift.closing_cash_counted)}
            />
          )}
          {shift.total_voids > 0 && (
            <StatRow
              label="Voids"
              value={`${shift.total_voids}`}
              valueClass="text-amber-400"
            />
          )}
        </div>
      </div>

      {/* -- Variance — only when closed ---------------------------- */}
      {shift.status === 'closed' && varianceDisplay !== undefined && (
        <div
          className={`flex items-center justify-between rounded-lg px-4 py-3 border ${
            (variance ?? 0) < 0
              ? 'bg-red-500/10 border-red-500/25'
              : 'bg-green-500/10 border-green-500/25'
          }`}
        >
          <div>
            <p className="text-slate-300 text-sm font-medium">Cash Variance</p>
            <p className="text-slate-500 text-xs mt-0.5">
              Counted vs Expected
            </p>
          </div>
          <span className={`text-base font-bold tabular-nums ${varianceClass}`}>
            {varianceDisplay}
          </span>
        </div>
      )}

      {/* -- Print Z-Report ------------------------------------------ */}
      {onPrintZReport && (
        <button
          onClick={onPrintZReport}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors border border-slate-600/60 mt-1"
        >
          <Printer className="w-4 h-4" />
          Print Z-Report
        </button>
      )}
    </div>
  );
}
