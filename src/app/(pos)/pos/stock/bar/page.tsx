'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  GlassWater,
  ArrowLeft,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';
import { InventoryTable, InventoryItem } from '@/components/pos/InventoryTable';

// -- Modal wrapper -------------------------------------------------------------

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h3 className="font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

// -- Page ----------------------------------------------------------------------

export default function BarStockPage() {
  const router = useRouter();

  // Session
  const [staffName, setStaffName] = useState('');

  // Data
  const [items,   setItems]   = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Restock modal
  const [showRestock,  setShowRestock]  = useState(false);
  const [restockItem,  setRestockItem]  = useState<InventoryItem | null>(null);
  const [restockQty,   setRestockQty]   = useState('');
  const [restockNote,  setRestockNote]  = useState('');
  const [saving,       setSaving]       = useState(false);

  // -- Auth guard ----------------------------------------------------------

  useEffect(() => {
    const sId   = sessionStorage.getItem('staffId')   ?? '';
    const sName = sessionStorage.getItem('staffName') ?? '';
    const sRole = sessionStorage.getItem('role')      ?? '';
    const shId  = sessionStorage.getItem('shiftId')   ?? '';

    if (!sId || !shId) { router.replace('/pos'); return; }
    if (sRole !== 'barman' && sRole !== 'manager') {
      router.replace('/pos/terminal');
      return;
    }
    setStaffName(sName);
  }, [router]);

  // -- Data fetching --------------------------------------------------------

  const loadItems = useCallback(() => {
    setLoading(true);
    fetch('/api/pos/inventory?category=bar')
      .then((r) => r.json())
      .then((d) => setItems(d.inventory ?? []))
      .catch(() => toast.error('Failed to load bar inventory'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  // -- Derived --------------------------------------------------------------

  const lowCount = items.filter(
    (i) => i.track_stock && (i.quantity_in_stock ?? 0) <= (i.reorder_level ?? 5),
  ).length;

  // -- Restock ---------------------------------------------------------------

  const openRestock = (item: InventoryItem) => {
    setRestockItem(item);
    setRestockQty('');
    setRestockNote('');
    setShowRestock(true);
  };

  const handleRestock = async () => {
    if (!restockItem) return;
    const qty = Number(restockQty);
    if (!qty || qty <= 0) { toast.error('Enter a positive quantity'); return; }
    setSaving(true);
    try {
      const res  = await fetch('/api/pos/inventory/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ inventory_id: restockItem.id, quantity: qty, notes: restockNote.trim() || undefined }],
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Restock failed'); return; }
      toast.success(`Added ${qty} to ${restockItem.item_name}`);
      setShowRestock(false);
      loadItems();
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  // -- Render ----------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-900 text-white">

      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <GlassWater className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Bar Stock</h1>
              <p className="text-xs text-slate-400">{staffName}</p>
            </div>
          </div>
          <Link
            href="/pos/terminal"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Terminal
          </Link>
        </div>
      </header>

      <main className="p-6 space-y-5">

        {/* Low stock banner */}
        {lowCount > 0 ? (
          <div className="flex items-center gap-3 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-300 font-medium">
              {lowCount} item{lowCount > 1 ? 's' : ''} need{lowCount === 1 ? 's' : ''} restocking
            </p>
            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {lowCount}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-green-900/20 border border-green-500/30 rounded-xl px-4 py-3">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <p className="text-sm text-green-300 font-medium">All bar stock levels are healthy</p>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
          </div>
        ) : (
          <InventoryTable
            items={items}
            loading={false}
            readOnly={true}
            showCategory={false}
            onRestock={openRestock}
          />
        )}
      </main>

      {/* -- Restock modal ------------------------------------------------------- */}
      {showRestock && restockItem && (
        <Modal title={`Restock: ${restockItem.item_name}`} onClose={() => setShowRestock(false)}>
          <div className="space-y-4">
            <div className="bg-slate-700/40 rounded-lg px-4 py-3 text-sm">
              <span className="text-slate-400">Current stock: </span>
              <span className="font-semibold text-white">
                {restockItem.quantity_in_stock ?? 0} {restockItem.unit ?? 'units'}
              </span>
              {restockItem.track_stock &&
                (restockItem.quantity_in_stock ?? 0) <= (restockItem.reorder_level ?? 5) && (
                <span className="ml-2 text-red-400 text-xs">(below reorder level)</span>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Quantity to Add *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="0"
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                autoFocus
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Notes <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Delivery from supplier"
                value={restockNote}
                onChange={(e) => setRestockNote(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm
                           focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowRestock(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRestock}
                disabled={saving || !restockQty}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700
                           disabled:text-slate-500 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Stock
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
