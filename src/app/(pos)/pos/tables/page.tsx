'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter }                          from 'next/navigation';
import Link                                   from 'next/link';
import toast                                  from 'react-hot-toast';
import {
  ArrowLeft, Plus, X, LayoutGrid, Loader2,
  MonitorCheck,
} from 'lucide-react';
import { TableMap } from '@/components/pos/TableMap';
import type { POSTable } from '@/components/pos/TableMap';

/* --- Types ----------------------------------------------------------------- */
interface StaffSession {
  staffId:   string;
  staffName: string;
  role:      string;
  shiftId:   string;
}

interface NewTableForm {
  name:     string;
  section:  'main' | 'bar' | 'outdoor';
  capacity: string;
}

const SECTION_OPTIONS: NewTableForm['section'][] = ['main', 'bar', 'outdoor'];

const EMPTY_FORM: NewTableForm = {
  name:     '',
  section:  'main',
  capacity: '4',
};

/* --- Component ------------------------------------------------------------- */
export default function TablesPage() {
  const router = useRouter();

  const [staff,   setStaff]   = useState<StaffSession | null>(null);
  const [mapKey,  setMapKey]  = useState(0);   /* bump to force TableMap refresh */

  /* Add-table modal */
  const [showAdd,  setShowAdd]  = useState(false);
  const [form,     setForm]     = useState<NewTableForm>(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState('');

  /* Confirm-new-order prompt (for available table click) */
  const [pendingTable, setPendingTable] = useState<POSTable | null>(null);

  /* -- Auth check ----------------------------------------------------------- */
  useEffect(() => {
    const raw = sessionStorage.getItem('pos_session');
    if (!raw) { router.replace('/pos'); return; }
    try {
      setStaff(JSON.parse(raw));
    } catch {
      router.replace('/pos');
    }
  }, [router]);

  /* -- Table click handler -------------------------------------------------  */
  const handleSelectTable = useCallback((table: POSTable) => {
    if (table.status === 'occupied') {
      /* Navigate to terminal filtered to this table */
      router.push(`/pos/terminal?table_id=${table.id}`);
    } else if (table.status === 'available') {
      setPendingTable(table);
    } else {
      /* Reserved — just notify */
      toast(`Table ${table.name} is reserved.`, { icon: '🔒' });
    }
  }, [router]);

  /* -- Start new order for a table ------------------------------------------  */
  const handleStartOrder = useCallback(() => {
    if (!pendingTable) return;
    /* Store the desired table_id in sessionStorage so the terminal page can
       pre-assign it when creating the first blank order. */
    sessionStorage.setItem('pos_pending_table', JSON.stringify({
      id:   pendingTable.id,
      name: pendingTable.name,
    }));
    router.push('/pos/terminal');
  }, [pendingTable, router]);

  /* -- Add table ------------------------------------------------------------- */
  const handleAddTable = useCallback(async () => {
    if (!form.name.trim()) { setFormErr('Table name is required.'); return; }

    setSaving(true);
    setFormErr('');
    try {
      const res  = await fetch('/api/pos/tables', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:     form.name.trim(),
          section:  form.section,
          capacity: parseInt(form.capacity, 10) || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormErr(data.error ?? 'Failed to add table');
        return;
      }

      toast.success(`Table "${data.table.name}" added!`);
      setForm(EMPTY_FORM);
      setShowAdd(false);
      setMapKey(k => k + 1);   /* refresh TableMap */
    } catch {
      setFormErr('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  }, [form]);

  /* -- Render --------------------------------------------------------------- */
  if (!staff) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">

      {/* ══════════════════════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/pos/terminal"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:block">Back to Terminal</span>
          </Link>

          <div className="w-px h-5 bg-slate-700 hidden sm:block" />

          <h1 className="flex items-center gap-2 text-white font-bold">
            <LayoutGrid className="w-5 h-5 text-blue-400" />
            Table Map
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pos/terminal"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 text-xs font-medium transition-all"
          >
            <MonitorCheck className="w-3.5 h-3.5" />
            Terminal
          </Link>
          <button
            onClick={() => { setForm(EMPTY_FORM); setFormErr(''); setShowAdd(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-xs font-medium transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Table
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          TABLE MAP
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-hidden p-4">
        <TableMap
          onSelectTable={handleSelectTable}
          onNewTable={() => { setForm(EMPTY_FORM); setFormErr(''); setShowAdd(true); }}
          refreshKey={mapKey}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ADD TABLE MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-700">

            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Add New Table
              </h2>
              <button
                onClick={() => setShowAdd(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">

              {/* Name */}
              <div>
                <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">
                  Table Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Table 1, Bar Seat A…"
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Section */}
              <div>
                <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">
                  Section
                </label>
                <div className="flex gap-2">
                  {SECTION_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => setForm(p => ({ ...p, section: s }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all
                        ${form.section === s
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">
                  Capacity (seats)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={form.capacity}
                  onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Error */}
              {formErr && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  {formErr}
                </p>
              )}
            </div>

            <div className="px-5 py-4 border-t border-slate-700 flex gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTable}
                disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-white font-medium transition-all"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                  </span>
                ) : 'Add Table'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          NEW ORDER PROMPT (available table clicked)
      ══════════════════════════════════════════════════════════════════════ */}
      {pendingTable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-xs shadow-2xl border border-slate-700 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
              <LayoutGrid className="w-7 h-7 text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{pendingTable.name}</h3>
            <p className="text-slate-400 text-sm mb-6">
              Start a new order for this table?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingTable(null)}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleStartOrder}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 rounded-xl text-white font-bold transition-all"
              >
                Start Order →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
