'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Package, Plus, Sprout, AlertTriangle, X, Loader2,
} from 'lucide-react';
import { POSNav } from '@/components/pos/POSNav';
import { InventoryTable, InventoryItem } from '@/components/pos/InventoryTable';

// -- Types ---------------------------------------------------------------------

type ActiveTab = 'all' | 'food' | 'bar';

interface ItemForm {
  item_name:         string;
  category:          'food' | 'bar';
  unit:              string;
  quantity_in_stock: string;
  reorder_level:     string;
  cost_price:        string;
  selling_price:     string;
}

const EMPTY_FORM: ItemForm = {
  item_name: '', category: 'food', unit: 'unit',
  quantity_in_stock: '0', reorder_level: '5', cost_price: '', selling_price: '',
};

// -- Modal wrapper -------------------------------------------------------------

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

// -- ItemFormFields -------------------------------------------------------------

function ItemFormFields({
  form, setForm, currency,
}: { form: ItemForm; setForm: React.Dispatch<React.SetStateAction<ItemForm>>; currency: string }) {
  const field = (label: string, key: keyof ItemForm, type = 'text', extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      <input type={type} value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm
                   placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
        {...extra} />
    </div>
  );

  return (
    <div className="space-y-3">
      {field('Item Name *', 'item_name', 'text', { placeholder: 'e.g. Tusker Lager' })}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as 'food' | 'bar' }))}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
          <option value="food">Food</option>
          <option value="bar">Bar</option>
        </select>
      </div>
      {field('Unit', 'unit', 'text', { placeholder: 'e.g. bottle, kg, piece' })}
      {field('Quantity in Stock', 'quantity_in_stock', 'number', { min: '0', step: '1' })}
      {field('Reorder Level', 'reorder_level', 'number', { min: '0', step: '1' })}
      {field(`Cost Price (${currency})`, 'cost_price', 'number', { min: '0', step: '0.01', placeholder: '0.00' })}
      {form.category === 'bar' && (
        field(`Selling Price (${currency}) *`, 'selling_price', 'number', { min: '0', step: '0.01', placeholder: '0.00' })
      )}
      {form.category === 'bar' && (
        <p className="text-xs text-amber-400">Bar items need a selling price to appear on the POS menu.</p>
      )}
    </div>
  );
}

// -- Page ----------------------------------------------------------------------

export default function PosInventoryPage() {
  const router = useRouter();

  const [items,    setItems]    = useState<InventoryItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [currency, setCurrency] = useState('KSh');

  const [activeTab,     setActiveTab]     = useState<ActiveTab>('all');
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem,      setEditItem]      = useState<InventoryItem | null>(null);
  const [showRestock,   setShowRestock]   = useState(false);
  const [restockItem,   setRestockItem]   = useState<InventoryItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<InventoryItem | null>(null);

  const [addForm,     setAddForm]     = useState<ItemForm>(EMPTY_FORM);
  const [editForm,    setEditForm]    = useState<ItemForm>(EMPTY_FORM);
  const [restockQty,  setRestockQty]  = useState('');
  const [restockNote, setRestockNote] = useState('');
  const [saving,      setSaving]      = useState(false);

  // Auth guard
  useEffect(() => {
    if (!sessionStorage.getItem('pos_session')) { router.replace('/pos'); return; }
  }, [router]);

  const loadItems = useCallback(() => {
    setLoading(true);
    fetch('/api/pos/inventory')
      .then(r => r.json())
      .then(d => setItems(d.inventory ?? []))
      .catch(() => toast.error('Failed to load inventory'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadItems();
    fetch('/api/pos/settings').then(r => r.json()).then(d => {
      if (d.settings?.currency) setCurrency(d.settings.currency);
    }).catch(() => {});
  }, [loadItems]);

  const filtered = activeTab === 'all' ? items : items.filter(i => i.category === activeTab);
  const lowCount = items.filter(i => i.track_stock && (i.quantity_in_stock ?? 0) <= (i.reorder_level ?? 5)).length;

  const handleSeed = async () => {
    const tid = toast.loading('Seeding from menu…');
    try {
      const res  = await fetch('/api/pos/inventory/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Seed failed', { id: tid }); return; }
      toast.success(`Seeded ${data.seeded} items (${data.skipped} skipped)`, { id: tid });
      loadItems();
    } catch { toast.error('Network error', { id: tid }); }
  };

  const handleAdd = async () => {
    if (!addForm.item_name.trim()) { toast.error('Item name is required'); return; }
    if (addForm.category === 'bar' && !addForm.selling_price) {
      toast.error('Bar items must have a selling price'); return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/pos/inventory', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name:         addForm.item_name.trim(),
          category:          addForm.category,
          unit:              addForm.unit.trim() || null,
          quantity_in_stock: Number(addForm.quantity_in_stock) || 0,
          reorder_level:     Number(addForm.reorder_level)     || 5,
          cost_price:        addForm.cost_price     ? Number(addForm.cost_price)    : null,
          selling_price:     addForm.selling_price  ? Number(addForm.selling_price) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to add item'); return; }
      toast.success('Item added');
      setShowAddModal(false); setAddForm(EMPTY_FORM); loadItems();
    } catch { toast.error('Network error'); } finally { setSaving(false); }
  };

  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    setEditForm({
      item_name:         item.item_name,
      category:          (item.category as 'food' | 'bar') ?? 'food',
      unit:              item.unit ?? '',
      quantity_in_stock: String(item.quantity_in_stock ?? 0),
      reorder_level:     String(item.reorder_level ?? 5),
      cost_price:        item.cost_price    != null ? String(item.cost_price)    : '',
      selling_price:     item.selling_price != null ? String(item.selling_price) : '',
    });
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pos/inventory/${editItem.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name:         editForm.item_name.trim(),
          category:          editForm.category,
          unit:              editForm.unit.trim() || null,
          quantity_in_stock: Number(editForm.quantity_in_stock) || 0,
          reorder_level:     Number(editForm.reorder_level) || 5,
          cost_price:        editForm.cost_price    ? Number(editForm.cost_price)    : null,
          selling_price:     editForm.selling_price ? Number(editForm.selling_price) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to update'); return; }
      toast.success('Item updated');
      setShowEditModal(false); setEditItem(null); loadItems();
    } catch { toast.error('Network error'); } finally { setSaving(false); }
  };

  const handleDelete = async (item: InventoryItem) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/pos/inventory/${item.id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); toast.error(d.error ?? 'Delete failed'); return; }
      toast.success('Item deleted'); setDeleteConfirm(null); loadItems();
    } catch { toast.error('Network error'); } finally { setSaving(false); }
  };

  const openRestock = (item: InventoryItem) => {
    setRestockItem(item); setRestockQty(''); setRestockNote(''); setShowRestock(true);
  };

  const handleRestock = async () => {
    if (!restockItem) return;
    const qty = Number(restockQty);
    if (!qty || qty <= 0) { toast.error('Enter a positive quantity'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/pos/inventory/restock', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ inventory_id: restockItem.id, quantity: qty, notes: restockNote.trim() || undefined }] }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Restock failed'); return; }
      toast.success(`Added ${qty} to ${restockItem.item_name}`);
      setShowRestock(false); loadItems();
    } catch { toast.error('Network error'); } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <POSNav />

      <div className="p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 rounded-xl"><Package className="w-5 h-5 text-blue-400" /></div>
            <div>
              <h1 className="text-xl font-bold">Inventory Management</h1>
              <p className="text-xs text-slate-400">Full stock control &amp; reorder management</p>
            </div>
            {lowCount > 0 && (
              <span className="flex items-center gap-1 bg-red-500/20 text-red-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-red-500/30">
                <AlertTriangle className="w-3 h-3" />{lowCount} low stock
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSeed}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm text-slate-300 hover:text-white transition-colors border border-slate-600">
              <Sprout className="w-4 h-4 text-green-400" /> Seed from Menu
            </button>
            <button onClick={() => { setAddForm(EMPTY_FORM); setShowAddModal(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 bg-slate-800 rounded-xl p-1 w-fit border border-slate-700">
          {(['all', 'food', 'bar'] as ActiveTab[]).map(tab => {
            const tabLow = tab === 'all' ? lowCount
              : items.filter(i => i.category === tab && i.track_stock && (i.quantity_in_stock ?? 0) <= (i.reorder_level ?? 5)).length;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
                {tab === 'all' ? 'All' : tab === 'food' ? 'Food' : 'Bar'}
                {tabLow > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                    {tabLow}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>
        ) : (
          <InventoryTable items={filtered} loading={false} readOnly={false} showCategory={true}
            onRestock={openRestock} onEdit={openEdit} onDelete={item => setDeleteConfirm(item)} />
        )}

        {/* Modals */}
        {showRestock && restockItem && (
          <Modal title={`Restock: ${restockItem.item_name}`} onClose={() => setShowRestock(false)}>
            <div className="space-y-4">
              <div><label className="block text-xs font-medium text-slate-400 mb-1">Current Stock</label>
                <p className="text-white font-semibold">{restockItem.quantity_in_stock ?? 0} {restockItem.unit ?? 'units'}</p></div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1">Quantity to Add *</label>
                <input type="number" min="1" step="1" placeholder="0" value={restockQty} onChange={e => setRestockQty(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50" /></div>
              <div><label className="block text-xs font-medium text-slate-400 mb-1">Notes <span className="text-slate-500 font-normal">(optional)</span></label>
                <input type="text" placeholder="e.g. Delivery from supplier" value={restockNote} onChange={e => setRestockNote(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50" /></div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowRestock(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm transition-colors">Cancel</button>
                <button onClick={handleRestock} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Add Stock
                </button>
              </div>
            </div>
          </Modal>
        )}

        {showAddModal && (
          <Modal title="Add Inventory Item" onClose={() => setShowAddModal(false)}>
            <div className="space-y-4">
              <ItemFormFields form={addForm} setForm={setAddForm} currency={currency} />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm transition-colors">Cancel</button>
                <button onClick={handleAdd} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Add Item
                </button>
              </div>
            </div>
          </Modal>
        )}

        {showEditModal && editItem && (
          <Modal title={`Edit: ${editItem.item_name}`} onClose={() => setShowEditModal(false)}>
            <div className="space-y-4">
              <ItemFormFields form={editForm} setForm={setEditForm} currency={currency} />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm transition-colors">Cancel</button>
                <button onClick={handleEdit} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
                </button>
              </div>
            </div>
          </Modal>
        )}

        {deleteConfirm && (
          <Modal title="Delete Item?" onClose={() => setDeleteConfirm(null)}>
            <div className="space-y-4">
              <p className="text-slate-300 text-sm">Delete <span className="font-semibold text-white">{deleteConfirm.item_name}</span>? This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm transition-colors">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Delete
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
