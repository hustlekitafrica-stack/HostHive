'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart2,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Banknote,
  Smartphone,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { POSSalesChart } from '@/components/pos/POSSalesChart';

// -- Types ---------------------------------------------------------------------

interface Summary {
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  cash_total: number;
  mpesa_total: number;
  card_total: number;
}

interface DailyPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface TopItem {
  name: string;
  total_qty: number;
  total_revenue: number;
}

interface Order {
  id: string;
  order_number?: string;
  table_id?: string;
  table_name?: string;
  staff_name?: string;
  total: number;
  payment_method: string;
  paid_at: string;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
}

// -- Helpers -------------------------------------------------------------------

function fmt(n: number, currency: string) {
  return `${currency} ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtShort(n: number, currency: string) {
  if (n >= 1_000_000) return `${currency} ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${currency} ${(n / 1_000).toFixed(1)}K`;
  return fmt(n, currency);
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' });
}

const PAGE_SIZE = 20;

// -- KPI Card ------------------------------------------------------------------

function KpiCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5 tabular-nums truncate">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// -- Page ----------------------------------------------------------------------

export default function PosReportsPage() {
  // Date filters — default last 30 days
  const today     = new Date();
  const thirtyAgo = new Date(today);
  thirtyAgo.setDate(thirtyAgo.getDate() - 29);

  const [dateFrom,     setDateFrom]     = useState(isoDate(thirtyAgo));
  const [dateTo,       setDateTo]       = useState(isoDate(today));
  const [staffFilter,  setStaffFilter]  = useState('');
  const [staffList,    setStaffList]    = useState<StaffMember[]>([]);
  const [currency,     setCurrency]     = useState('KSh');

  const [loading,      setLoading]      = useState(true);
  const [summary,      setSummary]      = useState<Summary | null>(null);
  const [daily,        setDaily]        = useState<DailyPoint[]>([]);
  const [topItems,     setTopItems]     = useState<TopItem[]>([]);
  const [orders,       setOrders]       = useState<Order[]>([]);

  // Pagination
  const [page, setPage] = useState(0);
  const pageOrders = orders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));

  // -- Fetch staff list (once) ----------------------------------------------

  useEffect(() => {
    fetch('/api/pos/staff')
      .then((r) => r.json())
      .then((d) => setStaffList(d.staff ?? []))
      .catch(() => {});

    fetch('/api/pos/settings')
      .then((r) => r.json())
      .then((d) => { if (d.settings?.currency) setCurrency(d.settings.currency); })
      .catch(() => {});
  }, []);

  // -- Fetch report data ----------------------------------------------------

  const fetchReport = useCallback(() => {
    setLoading(true);
    setPage(0);
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', `${dateFrom}T00:00:00.000Z`);
    if (dateTo)   params.set('date_to',   `${dateTo}T23:59:59.999Z`);
    if (staffFilter) params.set('staff_id', staffFilter);

    fetch(`/api/pos/reports?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setSummary(data.summary ?? null);
        setDaily(data.daily   ?? []);
        setTopItems(data.top_items ?? []);
        setOrders(data.orders ?? []);
      })
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo, staffFilter]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // -- Export CSV ------------------------------------------------------------

  const exportCsv = () => {
    if (orders.length === 0) { toast.error('No orders to export'); return; }
    const header = ['Order #', 'Table', 'Staff', 'Total', 'Payment Method', 'Paid At'];
    const rows   = orders.map((o) => [
      o.order_number ?? o.id.slice(0, 8),
      o.table_name   ?? o.table_id ?? '—',
      o.staff_name   ?? '—',
      o.total.toFixed(2),
      o.payment_method,
      o.paid_at ? fmtDateTime(o.paid_at) : '—',
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `pos-orders-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  // -- Payment method badge --------------------------------------------------

  const methodBadge = (method: string) => {
    const map: Record<string, string> = {
      cash:         'bg-green-500/20 text-green-300',
      mpesa:        'bg-emerald-500/20 text-emerald-300',
      mpesa_manual: 'bg-emerald-500/20 text-emerald-300',
      card:         'bg-blue-500/20 text-blue-300',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[method] ?? 'bg-slate-600 text-slate-300'}`}>
        {method === 'mpesa_manual' ? 'M-Pesa' : method.charAt(0).toUpperCase() + method.slice(1)}
      </span>
    );
  };

  // -- Render ----------------------------------------------------------------

  return (
    <div className="p-6 space-y-6 bg-slate-900 min-h-screen text-white">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-purple-500/20 rounded-xl">
          <BarChart2 className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">POS Sales Reports</h1>
          <p className="text-xs text-slate-400">Revenue, orders, and payment breakdown</p>
        </div>
      </div>

      {/* -- Filter bar --------------------------------------------------------- */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white
                         focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white
                         focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Staff</label>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white
                         focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="">All Staff</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500" />
        </div>
      ) : (
        <>
          {/* -- KPI cards -------------------------------------------------------- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              label="Total Revenue"
              value={fmtShort(summary?.total_revenue ?? 0, currency)}
              sub={fmt(summary?.total_revenue ?? 0, currency)}
              icon={<TrendingUp className="w-5 h-5 text-green-400" />}
              color="bg-green-500/20"
            />
            <KpiCard
              label="Total Orders"
              value={String(summary?.total_orders ?? 0)}
              icon={<ShoppingBag className="w-5 h-5 text-blue-400" />}
              color="bg-blue-500/20"
            />
            <KpiCard
              label="Avg Order Value"
              value={fmtShort(summary?.avg_order_value ?? 0, currency)}
              icon={<DollarSign className="w-5 h-5 text-purple-400" />}
              color="bg-purple-500/20"
            />
            {/* Payment split card */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-3">
              <p className="text-xs text-slate-400 font-medium">Payment Split</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Banknote className="w-3.5 h-3.5 text-green-400" />
                    Cash
                  </div>
                  <span className="font-semibold tabular-nums">{fmtShort(summary?.cash_total ?? 0, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    M-Pesa
                  </div>
                  <span className="font-semibold tabular-nums">{fmtShort(summary?.mpesa_total ?? 0, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                    Card
                  </div>
                  <span className="font-semibold tabular-nums">{fmtShort(summary?.card_total ?? 0, currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* -- Sales chart ------------------------------------------------------- */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-200">Daily Sales</h2>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-green-400 rounded inline-block" />Revenue</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-400 rounded inline-block" />Orders</span>
              </div>
            </div>
            <POSSalesChart daily={daily} currency={currency} />
          </div>

          {/* -- Top items --------------------------------------------------------- */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700">
              <h2 className="font-semibold text-slate-200">Top 10 Items</h2>
            </div>
            {topItems.length === 0 ? (
              <p className="px-5 py-8 text-slate-500 text-sm text-center">No item data available.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3 text-left font-medium">#</th>
                    <th className="px-5 py-3 text-left font-medium">Item</th>
                    <th className="px-5 py-3 text-right font-medium">Qty Sold</th>
                    <th className="px-5 py-3 text-right font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {topItems.map((item, i) => (
                    <tr key={item.name} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3 text-slate-500 font-medium">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-white">{item.name}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-slate-300">{item.total_qty}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-green-400 font-semibold">
                        {fmt(item.total_revenue, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* -- Recent orders ------------------------------------------------------ */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-200">Orders</h2>
                <p className="text-xs text-slate-500 mt-0.5">{orders.length} total</p>
              </div>
              <button
                onClick={exportCsv}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 hover:text-white transition-colors border border-slate-600"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>

            {orders.length === 0 ? (
              <p className="px-5 py-8 text-slate-500 text-sm text-center">No orders in this period.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="px-5 py-3 text-left font-medium">Order</th>
                        <th className="px-5 py-3 text-left font-medium">Table</th>
                        <th className="px-5 py-3 text-left font-medium">Staff</th>
                        <th className="px-5 py-3 text-right font-medium">Total</th>
                        <th className="px-5 py-3 text-center font-medium">Payment</th>
                        <th className="px-5 py-3 text-left font-medium">Paid At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60">
                      {pageOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="px-5 py-3 font-mono text-xs text-slate-400">
                            {o.order_number ?? `#${o.id.slice(0, 8)}`}
                          </td>
                          <td className="px-5 py-3 text-slate-300">{o.table_name ?? o.table_id ?? '—'}</td>
                          <td className="px-5 py-3 text-slate-300">{o.staff_name ?? '—'}</td>
                          <td className="px-5 py-3 text-right font-semibold tabular-nums text-white">
                            {fmt(o.total, currency)}
                          </td>
                          <td className="px-5 py-3 text-center">{methodBadge(o.payment_method)}</td>
                          <td className="px-5 py-3 text-xs text-slate-400">
                            {o.paid_at ? fmtDateTime(o.paid_at) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700">
                  <p className="text-xs text-slate-500">
                    Page {page + 1} of {totalPages} &mdash; {orders.length} orders
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
