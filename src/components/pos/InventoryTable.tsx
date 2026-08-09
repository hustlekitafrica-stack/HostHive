'use client';

import { Package, Edit2, Trash2, RefreshCw } from 'lucide-react';

export interface InventoryItem {
  id: string;
  item_name: string;
  category: 'food' | 'bar';
  unit: string;
  quantity_in_stock: number;
  reorder_level: number;
  cost_price: number;
  track_stock: boolean;
  menu_item_id?: string | null;
}

interface InventoryTableProps {
  items: InventoryItem[];
  loading: boolean;
  onRestock: (item: InventoryItem) => void;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
  showCategory?: boolean;
  readOnly?: boolean; // if true, only show restock button (for barman)
}

// --- Loading skeleton ---------------------------------------------------------

function SkeletonCell({ wide = false }: { wide?: boolean }) {
  return (
    <td className="px-4 py-3">
      <div className={`h-4 bg-slate-700 rounded animate-pulse ${wide ? 'w-32' : 'w-16'}`} />
    </td>
  );
}

function SkeletonRow({ colCount }: { colCount: number }) {
  return (
    <tr className="border-b border-slate-700/40">
      <SkeletonCell wide />
      {Array.from({ length: colCount - 2 }).map((_, i) => (
        <SkeletonCell key={i} />
      ))}
      {/* Actions skeleton */}
      <td className="px-4 py-3">
        <div className="h-7 bg-slate-700 rounded-lg animate-pulse w-20" />
      </td>
    </tr>
  );
}

// --- Main component -----------------------------------------------------------

export function InventoryTable({
  items,
  loading,
  onRestock,
  onEdit,
  onDelete,
  showCategory = false,
  readOnly = false,
}: InventoryTableProps) {
  // colCount = base (Item, Unit, In Stock, Reorder, Status, Actions) + optional Category
  const colCount = showCategory ? 7 : 6;

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-700/60">
      <table className="w-full text-sm text-left">

        {/* -- Header ------------------------------------------------ */}
        <thead>
          <tr className="bg-slate-800 border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wide">
            <th className="px-4 py-3 font-medium">Item Name</th>
            {showCategory && <th className="px-4 py-3 font-medium">Category</th>}
            <th className="px-4 py-3 font-medium">Unit</th>
            <th className="px-4 py-3 font-medium">In Stock</th>
            <th className="px-4 py-3 font-medium">Reorder Level</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>

        {/* -- Body -------------------------------------------------- */}
        <tbody className="divide-y divide-slate-700/40 bg-slate-900">

          {/* Loading: 5 skeleton rows */}
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} colCount={colCount} />
          ))}

          {/* Empty state */}
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={colCount} className="px-4 py-14 text-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Package className="w-9 h-9 opacity-40" />
                  <p className="text-sm">No items found</p>
                </div>
              </td>
            </tr>
          )}

          {/* Data rows */}
          {!loading && items.map((item) => {
            const isLow = item.quantity_in_stock <= item.reorder_level;

            return (
              <tr
                key={item.id}
                className={`transition-colors ${
                  isLow
                    ? 'bg-red-500/5 hover:bg-red-500/10'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                {/* Item Name */}
                <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                  {item.item_name}
                </td>

                {/* Category — conditional */}
                {showCategory && (
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        item.category === 'food'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-blue-500/15 text-blue-400'
                      }`}
                    >
                      {item.category === 'food' ? 'Food' : 'Bar'}
                    </span>
                  </td>
                )}

                {/* Unit */}
                <td className="px-4 py-3 text-slate-300">{item.unit}</td>

                {/* In Stock */}
                <td className={`px-4 py-3 font-semibold tabular-nums ${isLow ? 'text-red-400' : 'text-white'}`}>
                  {item.quantity_in_stock}
                </td>

                {/* Reorder Level */}
                <td className="px-4 py-3 text-slate-400 tabular-nums">
                  {item.reorder_level}
                </td>

                {/* Status badge */}
                <td className="px-4 py-3">
                  {isLow ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      Low Stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                      OK
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">

                    {/* Restock — always shown */}
                    <button
                      onClick={() => onRestock(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Restock
                    </button>

                    {/* Edit — hidden in readOnly */}
                    {!readOnly && onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-200 hover:text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    )}

                    {/* Delete — hidden in readOnly */}
                    {!readOnly && onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/25 active:bg-red-500/30 text-red-400 hover:text-red-300 text-xs font-medium rounded-lg transition-colors border border-red-500/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
