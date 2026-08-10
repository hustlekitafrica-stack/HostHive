'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link          from 'next/link';
import toast         from 'react-hot-toast';
import { RefreshCw, ChefHat, ArrowLeft, Loader2, Wifi } from 'lucide-react';
import { KitchenOrderCard } from '@/components/pos/KitchenOrderCard';
import type { KitchenOrder } from '@/components/pos/KitchenOrderCard';
import { canAccess } from '@/lib/pos/session';

/* --- Types ----------------------------------------------------------------- */
interface StaffSession {
  staffId:   string;
  staffName: string;
  role:      string;
  shiftId:   string;
}

const REFRESH_INTERVAL_MS = 15_000;

/* --- Helpers --------------------------------------------------------------- */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function deduplicateOrders(orders: KitchenOrder[]): KitchenOrder[] {
  const seen = new Set<string>();
  return orders.filter(o => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });
}

/** Filter to orders that have at least one non-drinks item. */
function hasFoodItems(order: KitchenOrder): boolean {
  return order.items.some(i => i.tab !== 'drinks');
}

/* --- Component ------------------------------------------------------------- */
export default function KitchenPage() {
  const router = useRouter();

  const [orders,      setOrders]      = useState<KitchenOrder[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* -- Auth check ----------------------------------------------------------- */
  useEffect(() => {
    const raw = sessionStorage.getItem('pos_session');
    if (!raw) { router.replace('/pos'); return; }
    let session: StaffSession | null = null;
    try { session = JSON.parse(raw); } catch { /* ignore */ }
    if (!session) { router.replace('/pos'); return; }
    // stock_manager cannot access kitchen display
    if (!canAccess(session.role, 'kitchen')) {
      router.replace('/pos/inventory');
      return;
    }
  }, [router]);

  /* -- Fetch orders ---------------------------------------------------------- */
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else         setRefreshing(true);

    try {
      const res  = await fetch('/api/pos/orders?limit=100');
      const data = await res.json();

      if (!res.ok) {
        if (!silent) toast.error('Failed to load orders');
        return;
      }

      const all: KitchenOrder[] = (data.orders ?? []) as KitchenOrder[];

      /* Filter to active kitchen statuses + food-only */
      const filtered = deduplicateOrders(
        all.filter(
          o =>
            ['sent_to_kitchen', 'ready'].includes(o.status) &&
            hasFoodItems(o),
        ),
      ).sort(
        (a, b) =>
          new Date(a.kitchen_sent_at).getTime() - new Date(b.kitchen_sent_at).getTime(),
      );

      setOrders(filtered);
      setLastRefresh(new Date());
    } catch {
      if (!silent) toast.error('Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /* -- Initial load + auto-refresh ------------------------------------------- */
  useEffect(() => {
    fetchOrders(false);

    intervalRef.current = setInterval(() => {
      fetchOrders(true);
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchOrders]);

  /* -- Mark Ready ------------------------------------------------------------ */
  const handleMarkReady = useCallback(async (id: string) => {
    const res  = await fetch(`/api/pos/orders/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: 'ready' }),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error ?? 'Failed to update order');
      throw new Error(data.error);
    }

    setOrders(prev =>
      prev.map(o => o.id === id ? { ...o, status: 'ready' } : o),
    );
    toast.success('Order marked ready!', { icon: '✅' });
  }, []);

  /* -- Mark Done (kitchen complete — payment will happen at cashier) ---------  */
  const handleMarkDone = useCallback(async (id: string) => {
    const res  = await fetch(`/api/pos/orders/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        status:  'paid',
        paid_at: new Date().toISOString(),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error ?? 'Failed to mark done');
      throw new Error(data.error);
    }

    setOrders(prev => prev.filter(o => o.id !== id));
    toast.success('Order done!', { icon: '🍽️' });
  }, []);

  /* -- Render --------------------------------------------------------------- */
  return (
    <div className="min-h-screen flex flex-col bg-slate-900">

      {/* ══════════════════════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">

        <div className="flex items-center gap-3">
          <Link
            href="/pos/terminal"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:block">Terminal</span>
          </Link>

          <div className="hidden sm:block w-px h-5 bg-slate-700" />

          <h1 className="flex items-center gap-2 text-white font-bold text-lg">
            <ChefHat className="w-5 h-5 text-amber-400" />
            Kitchen Display
          </h1>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 ml-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-green-400 text-xs hidden sm:block">Live</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-slate-500 text-xs hidden md:flex items-center gap-1.5">
              <Wifi className="w-3 h-3" />
              Updated {formatTime(lastRefresh)}
            </span>
          )}

          <button
            onClick={() => fetchOrders(false)}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 text-xs font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>

          {/* Order count badge */}
          {orders.length > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full min-w-[28px] text-center">
              {orders.length}
            </span>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          BODY
      ══════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 p-4">

        {/* Loading spinner */}
        {loading && (
          <div className="h-64 flex items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            <span>Loading orders…</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-4xl">
              🍳
            </div>
            <div>
              <p className="text-white font-semibold text-lg">No pending orders</p>
              <p className="text-slate-500 text-sm mt-1">
                Waiting for orders from the terminal…
              </p>
            </div>
            <p className="text-slate-600 text-xs">
              Auto-refreshes every {REFRESH_INTERVAL_MS / 1000}s
            </p>
          </div>
        )}

        {/* Orders grid */}
        {!loading && orders.length > 0 && (
          <>
            {/* Status section: sent_to_kitchen */}
            {orders.some(o => o.status === 'sent_to_kitchen') && (
              <section className="mb-6">
                <h2 className="text-xs uppercase tracking-widest text-amber-400 font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  Cooking ({orders.filter(o => o.status === 'sent_to_kitchen').length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {orders
                    .filter(o => o.status === 'sent_to_kitchen')
                    .map(order => (
                      <KitchenOrderCard
                        key={order.id}
                        order={order}
                        onMarkReady={handleMarkReady}
                        onMarkDone={handleMarkDone}
                      />
                    ))}
                </div>
              </section>
            )}

            {/* Status section: ready */}
            {orders.some(o => o.status === 'ready') && (
              <section>
                <h2 className="text-xs uppercase tracking-widest text-green-400 font-semibold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                  Ready to Serve ({orders.filter(o => o.status === 'ready').length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {orders
                    .filter(o => o.status === 'ready')
                    .map(order => (
                      <KitchenOrderCard
                        key={order.id}
                        order={order}
                        onMarkReady={handleMarkReady}
                        onMarkDone={handleMarkDone}
                      />
                    ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* -- Subtle footer showing refresh countdown --------------------------- */}
      <footer className="text-center py-3 text-slate-700 text-xs">
        Auto-refreshes every {REFRESH_INTERVAL_MS / 1000} seconds
        {lastRefresh && ` · Last updated ${formatTime(lastRefresh)}`}
      </footer>
    </div>
  );
}
