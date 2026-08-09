'use client';

import { useState, useEffect } from 'react';
import { Users, Plus } from 'lucide-react';

export interface POSTable {
  id: string;
  name: string;
  section: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  current_order_id?: string | null;
}

interface TableMapProps {
  onSelectTable: (table: POSTable) => void;
  onNewTable?: () => void;
  refreshKey?: number;
}

const STATUS_STYLES = {
  available: 'bg-green-500/20 border-green-500 text-green-300 hover:bg-green-500/30',
  occupied:  'bg-red-500/20 border-red-500 text-red-300 hover:bg-red-500/30',
  reserved:  'bg-amber-500/20 border-amber-500 text-amber-300 hover:bg-amber-500/30',
};

const STATUS_LABEL = {
  available: 'Available',
  occupied:  'Occupied',
  reserved:  'Reserved',
};

const SECTIONS = ['main', 'bar', 'outdoor'];

export function TableMap({ onSelectTable, onNewTable, refreshKey }: TableMapProps) {
  const [tables, setTables] = useState<POSTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pos/tables');
      if (res.ok) {
        const d = await res.json();
        setTables(d.tables ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [refreshKey]);

  const visible = activeSection === 'all'
    ? tables
    : tables.filter(t => t.section === activeSection);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Section filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', ...SECTIONS].map(s => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all
              ${activeSection === s
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"/>Available</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>Occupied</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>Reserved</span>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">Loading tables…</div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 overflow-y-auto flex-1 pb-2">
          {visible.map(table => (
            <button
              key={table.id}
              onClick={() => onSelectTable(table)}
              className={`border-2 rounded-xl p-3 flex flex-col items-center gap-1 transition-all active:scale-95 cursor-pointer ${STATUS_STYLES[table.status]}`}
            >
              <span className="font-bold text-sm">{table.name}</span>
              <span className="flex items-center gap-1 text-xs opacity-70">
                <Users className="w-3 h-3"/>{table.capacity}
              </span>
              <span className="text-xs opacity-60 capitalize">{STATUS_LABEL[table.status]}</span>
            </button>
          ))}

          {onNewTable && (
            <button
              onClick={onNewTable}
              className="border-2 border-dashed border-slate-600 rounded-xl p-3 flex flex-col items-center gap-1 text-slate-500 hover:border-slate-400 hover:text-slate-400 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5"/>
              <span className="text-xs">Add Table</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
