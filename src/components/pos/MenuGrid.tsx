'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';

type Tab = 'breakfast' | 'mains' | 'snacks' | 'drinks' | 'sides';

export interface POSMenuItem {
  id: string;
  tab: Tab;
  category: string;
  name: string;
  description: string;
  price: number;
  tag: 'popular' | 'special' | null;
  active: boolean;
  position: number;
  image_url: string | null;
}

interface MenuGridProps {
  onAddItem: (item: POSMenuItem) => void;
  currency?: string;
}

const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: 'breakfast', emoji: '🌅', label: 'Breakfast' },
  { id: 'mains',     emoji: '🍽️', label: 'Mains'     },
  { id: 'snacks',    emoji: '🥗', label: 'Bites'     },
  { id: 'drinks',    emoji: '🥤', label: 'Drinks'    },
  { id: 'sides',     emoji: '�', label: 'Sides'     },
];

export function MenuGrid({ onAddItem, currency = 'KSh' }: MenuGridProps) {
  const [items, setItems]       = useState<POSMenuItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('mains');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    fetch('/api/stay/menu')
      .then(r => r.json())
      .then(d => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const visible = items
    .filter(i => i.active)
    .filter(i => i.tab === activeTab)
    .filter(i =>
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => a.position - b.position);

  return (
    <div className="flex flex-col h-full gap-3">

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search menu…"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${activeTab === t.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
          >
            <span>{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Item grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading menu…</span>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          {search ? 'No items match your search.' : 'No items in this category.'}
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5 overflow-y-auto flex-1 pb-2 content-start">
          {visible.map(item => (
            <button
              key={item.id}
              onClick={() => onAddItem(item)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded-xl p-3 text-left transition-all active:scale-[0.97] flex flex-col gap-1.5 group"
            >
              {item.tag && (
                <span
                  className={`self-start text-xs px-1.5 py-0.5 rounded-full font-medium
                    ${item.tag === 'popular'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-blue-500/20 text-blue-300'
                    }`}
                >
                  {item.tag === 'popular' ? '⭐ Popular' : '✨ Special'}
                </span>
              )}

              <p className="text-white font-medium text-sm leading-snug line-clamp-2 group-hover:text-blue-100 transition-colors">
                {item.name}
              </p>

              {item.description && (
                <p className="text-slate-500 text-xs line-clamp-1">{item.description}</p>
              )}

              <p className="text-green-400 font-bold text-sm mt-auto pt-1">
                {currency} {item.price.toFixed(2)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
