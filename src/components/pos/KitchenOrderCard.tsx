'use client';

import { useState } from 'react';
import { Clock, CheckCircle, ChefHat } from 'lucide-react';

export interface KitchenOrder {
  id: string;
  order_number: string;
  table_name: string;
  staff_name: string;
  status: string;
  items: { id: string; name: string; qty: number; notes?: string; tab?: string }[];
  kitchen_sent_at: string;
  order_type: string;
}

interface KitchenOrderCardProps {
  order: KitchenOrder;
  onMarkReady: (id: string) => Promise<void>;
  onMarkDone?: (id: string) => Promise<void>;
  section?: 'kitchen' | 'bar';
}

function getAgeStyle(sentAt: string): string {
  const mins = (Date.now() - new Date(sentAt).getTime()) / 60000;
  if (mins < 10) return 'border-green-500 bg-green-500/10';
  if (mins < 20) return 'border-amber-500 bg-amber-500/10';
  return 'border-red-500 bg-red-500/10';
}

function getAgeLabel(sentAt: string): string {
  const mins = Math.floor((Date.now() - new Date(sentAt).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  return `${mins} min ago`;
}

export function KitchenOrderCard({ order, onMarkReady, onMarkDone, section }: KitchenOrderCardProps) {
  const [loading, setLoading] = useState(false);
  const foodItems = section === 'bar'
    ? order.items.filter(i => i.tab === 'bar')
    : section === 'kitchen'
    ? order.items.filter(i => i.tab !== 'bar')
    : order.items.filter(i => i.tab !== 'drinks');

  const handle = async (fn: (id: string) => Promise<void>) => {
    setLoading(true);
    try { await fn(order.id); } finally { setLoading(false); }
  };

  return (
    <div className={`border-2 rounded-xl p-4 flex flex-col gap-3 transition-all ${getAgeStyle(order.kitchen_sent_at)}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-white text-lg">{order.order_number}</p>
          <p className="text-slate-300 text-sm">
            {order.table_name || order.order_type} · {order.staff_name}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5"/>
          {getAgeLabel(order.kitchen_sent_at)}
        </div>
      </div>

      <div className="border-t border-slate-700 pt-2 flex flex-col gap-1">
        {foodItems.map((item, i) => (
          <div key={i}>
            <p className="text-white font-medium text-sm">{item.qty}× {item.name}</p>
            {item.notes && <p className="text-slate-400 text-xs pl-4">↳ {item.notes}</p>}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-auto">
        {order.status === 'sent_to_kitchen' && (
          <button
            onClick={() => handle(onMarkReady)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-all"
          >
            <CheckCircle className="w-4 h-4"/>
            Mark Ready
          </button>
        )}
        {order.status === 'ready' && onMarkDone && (
          <button
            onClick={() => handle(onMarkDone)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-all"
          >
            <ChefHat className="w-4 h-4"/>
            Mark Done
          </button>
        )}
        {order.status === 'ready' && (
          <span className="flex-1 text-center py-2 text-green-400 font-medium text-sm border border-green-500 rounded-lg">
            ✓ Ready
          </span>
        )}
      </div>
    </div>
  );
}
