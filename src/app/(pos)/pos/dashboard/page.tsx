'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Monitor, ChefHat, BarChart2, Package, Users,
  Settings, ShoppingBag, DollarSign, ShoppingCart,
  Banknote, Smartphone, CreditCard, Loader2,
} from 'lucide-react';
import { POSNav } from '@/components/pos/POSNav';
import { getDefaultRoute } from '@/lib/pos/session';

/* --- Types ----------------------------------------------------------------- */
interface StaffSession {
  staffId:   string;
  staffName: string;
  role:      string;
  shiftId:   string;
}

interface TodayStats {
  total_revenue:   number;
  total_orders:    number;
  cash_total:      number;
  mpesa_total:     number;
  card_total:      number;
  avg_order_value: number;
}

/* --- Role-gated nav tiles -------------------------------------------------- */
interface NavTile {
  href:    string;
  label:   string;
  sub:     string;
  icon:    React.ElementType;
  color:   string;
  roles:   string[];   // empty = all roles
}

const TILES: NavTile[] = [
  {
    href: '/pos/terminal', label: 'Terminal',   sub: 'Take orders',
    icon: Monitor,  color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    roles: [],
  },
  {
    href: '/pos/kitchen',  label: 'Kitchen',    sub: 'Display orders',
    icon: ChefHat,  color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    roles: [],
  },
  {
    href: '/pos/reports',  label: 'Reports',    sub: 'Sales & revenue',
    icon: BarChart2, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    roles: ['manager'],
  },
  {
    href: '/pos/inventory', label: 'Inventory', sub: 'Stock levels',
    icon: Package,  color: 'bg-green-500/20 text-green-400 border-green-500/30',
    roles: ['manager', 'stock_manager'],
  },
  {
    href: '/pos/staff',    label: 'Staff',      sub: 'Manage team',
    icon: Users,    color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    roles: ['manager'],
  },
  {
    href: '/pos/settings', label: 'Settings',   sub: 'Printers & config',
    icon: Settings, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    roles: ['manager'],
  },
  {
    href: '/pos/close-shift', label: 'Close Shift', sub: 'End your shift',
    icon: ShoppingBag, color: 'bg-red-500/20 text-red-400 border-red-500/30',
    roles: [],
  },
];

/* --- Helpers --------------------------------------------------------------- */
function fmt(n: number, currency: string) {
  return `${currency} ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtShort(n: number, currency: string) {
  if (n >= 1_000_000) return `${currency} ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${currency} ${(n / 1_000).toFixed(1)}K`;
  return fmt(n, currency);
}

function isoToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/* --- KPI Card --------------------------------------------------------------- */
function KpiCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
      <div className={`p-2 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-lg font-bold text-white tabular-nums">{value}</p>
      </div>
    </div>
  );
}

/* --- Page ------------------------------------------------------------------ */
export default function POSDashboardPage() {
  const router = useRouter();
  const [session,  setSession]  = useState<StaffSession | null>(null);
  const [stats,    setStats]    = useState<TodayStats | null>(null);
  const [currency, setCurrency] = useState('KSh');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem('pos_session');
    if (!raw) { router.replace('/pos'); return; }

    let sess: StaffSession;
    try { sess = JSON.parse(raw); } catch { router.replace('/pos'); return; }

    // Only managers can view the dashboard
    if (sess.role !== 'manager') {
      router.replace(getDefaultRoute(sess.role));
      return;
    }

    setSession(sess);

    const today = isoToday();
    Promise.all([
      fetch('/api/pos/settings').then(r => r.json()),
      fetch(`/api/pos/reports?date_from=${today}T00:00:00.000Z&date_to=${today}T23:59:59.999Z`)
        .then(r => r.json()),
    ]).then(([settingsData, reportData]) => {
      if (settingsData.settings?.currency) setCurrency(settingsData.settings.currency);
      if (reportData.summary) setStats(reportData.summary);
    }).catch(() => {
      /* stats are non-critical */
    }).finally(() => setLoading(false));
  }, [router]);

  const role = session?.role ?? '';
  const visibleTiles = TILES.filter(t => t.roles.length === 0 || t.roles.includes(role));

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <POSNav />

      <div className="flex-1 p-5 space-y-6 max-w-4xl mx-auto w-full">

        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-white">
            {session ? `Welcome, ${session.staffName}` : 'POS Dashboard'}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Today's KPIs */}
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading today&apos;s stats…</span>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KpiCard
              label="Today's Revenue"
              value={fmtShort(stats.total_revenue, currency)}
              icon={<DollarSign className="w-4 h-4" />}
              color="bg-green-500/20 text-green-400"
            />
            <KpiCard
              label="Orders"
              value={String(stats.total_orders)}
              icon={<ShoppingCart className="w-4 h-4" />}
              color="bg-blue-500/20 text-blue-400"
            />
            <KpiCard
              label="Cash"
              value={fmtShort(stats.cash_total, currency)}
              icon={<Banknote className="w-4 h-4" />}
              color="bg-amber-500/20 text-amber-400"
            />
            <KpiCard
              label="M-Pesa"
              value={fmtShort(stats.mpesa_total, currency)}
              icon={<Smartphone className="w-4 h-4" />}
              color="bg-emerald-500/20 text-emerald-400"
            />
            <KpiCard
              label="Card"
              value={fmtShort(stats.card_total, currency)}
              icon={<CreditCard className="w-4 h-4" />}
              color="bg-purple-500/20 text-purple-400"
            />
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No sales yet today.</p>
        )}

        {/* Navigation tiles */}
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {visibleTiles.map(tile => (
              <Link
                key={tile.href}
                href={tile.href}
                className={`flex flex-col gap-3 p-4 rounded-2xl border bg-slate-800 hover:bg-slate-750 hover:scale-[1.01] transition-all active:scale-[0.98] ${tile.color}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tile.color}`}>
                  <tile.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{tile.label}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{tile.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
