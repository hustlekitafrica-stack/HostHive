'use client';

import { Plus } from 'lucide-react';

export interface TabOrder {
  id: string;
  order_number: string;
  table_name: string;
  items: { qty: number }[];
}

interface OpenOrdersTabsProps {
  orders: TabOrder[];
  activeOrderId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function OpenOrdersTabs({
  orders,
  activeOrderId,
  onSelect,
  onNew,
}: OpenOrdersTabsProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1">
      {orders.map(order => {
        const isActive   = order.id === activeOrderId;
        const itemCount  = order.items.reduce((s, i) => s + i.qty, 0);
        const label      = order.table_name || order.order_number || 'New Order';

        return (
          <button
            key={order.id}
            onClick={() => onSelect(order.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
              ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
              }`}
          >
            <span className="max-w-[110px] truncate">{label}</span>
            {itemCount > 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center leading-none
                  ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-300'}`}
              >
                {itemCount}
              </span>
            )}
          </button>
        );
      })}

      <button
        onClick={onNew}
        className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-dashed border-slate-600 hover:border-slate-500"
        title="New order"
      >
        <Plus className="w-3.5 h-3.5" />
        New
      </button>
    </div>
  );
}
