'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Save, X, ChefHat } from 'lucide-react';

type Tab = 'breakfast' | 'mains' | 'snacks' | 'drinks' | 'sides';
const TABS: { id: Tab; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'mains',     label: 'Main Dishes' },
  { id: 'snacks',    label: 'Sharing Bites' },
  { id: 'drinks',    label: 'Drinks & Fruits' },
  { id: 'sides',     label: 'Sides' },
];

type MenuItem = {
  id: string;
  tab: Tab;
  category: string;
  name: string;
  description: string;
  price: number;
  tag: 'popular' | 'special' | null;
  active: boolean;
  position: number;
};

const EMPTY: Omit<MenuItem, 'id'> = {
  tab: 'breakfast', category: '', name: '', description: '', price: 0, tag: null, active: true, position: 0,
};

export default function MenuPage() {
  const [items, setItems]       = useState<MenuItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('breakfast');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<MenuItem | null>(null);
  const [form, setForm]         = useState<Omit<MenuItem, 'id'>>(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/stay/menu')
      .then(r => r.json())
      .then(d => setItems(d.items ?? []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const visibleItems = items.filter(i => i.tab === activeTab);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, tab: activeTab });
    setShowForm(true);
    setError('');
  };

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setForm({ tab: item.tab, category: item.category, name: item.name, description: item.description, price: item.price, tag: item.tag, active: item.active, position: item.position });
    setShowForm(true);
    setError('');
  };

  const closeForm = () => { setShowForm(false); setEditing(null); setError(''); };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Item name is required.'); return; }
    setSaving(true); setError('');
    try {
      const url    = editing ? `/api/stay/menu/${editing.id}` : '/api/stay/menu';
      const method = editing ? 'PATCH' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data   = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to save.'); return; }
      load();
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    setDeleting(id);
    await fetch(`/api/stay/menu/${id}`, { method: 'DELETE' });
    setItems(prev => prev.filter(i => i.id !== id));
    setDeleting(null);
  };

  const handleToggleActive = async (item: MenuItem) => {
    const res  = await fetch(`/api/stay/menu/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !item.active }) });
    const data = await res.json();
    if (res.ok) setItems(prev => prev.map(i => i.id === item.id ? data.item : i));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#9B1C1C' }}>
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Menu Management</h1>
              <p className="text-xs text-gray-500">{items.length} items across {TABS.length} categories</p>
            </div>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: '#9B1C1C' }}>
            <Plus className="w-4 h-4" />Add Item
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Tab Bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === t.id ? 'text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'}`}
              style={activeTab === t.id ? { background: '#9B1C1C' } : {}}>
              {t.label}
              <span className={`ml-1.5 text-xs ${activeTab === t.id ? 'text-white/70' : 'text-gray-400'}`}>
                ({items.filter(i => i.tab === t.id).length})
              </span>
            </button>
          ))}
        </div>

        {/* Item list */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 rounded-full border-2" style={{ borderColor: '#9B1C1C', borderTopColor: 'transparent' }} /></div>
        ) : visibleItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
            <ChefHat className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold text-sm mb-1">No items in this category yet.</p>
            <button onClick={openNew} className="mt-3 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#9B1C1C' }}>
              Add First Item
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleItems.map(item => (
              <div key={item.id} className={`bg-white rounded-2xl p-4 border transition-all flex items-center gap-4 ${item.active ? 'border-gray-100' : 'border-gray-100 opacity-50'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">{item.name}</span>
                    {item.tag === 'popular' && <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#D97706' }}>Popular</span>}
                    {item.tag === 'special' && <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#9B1C1C' }}>Special</span>}
                    {item.category && <span className="text-xs text-gray-400">{item.category}</span>}
                  </div>
                  {item.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>}
                  <p className="text-sm font-black mt-1" style={{ color: '#9B1C1C' }}>
                    {item.price === 0 ? 'Free' : `KSh ${item.price.toLocaleString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={() => handleToggleActive(item)} title={item.active ? 'Deactivate' : 'Activate'}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                    {item.active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => openEdit(item)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between" style={{ background: '#9B1C1C' }}>
              <h2 className="text-base font-black text-white">{editing ? 'Edit Item' : 'Add Menu Item'}</h2>
              <button onClick={closeForm} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {error && <div className="text-sm text-red-600 font-semibold bg-red-50 rounded-xl px-4 py-3">{error}</div>}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Item Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Masala Chips"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-800 transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Menu Tab</label>
                  <select value={form.tab} onChange={e => setForm(f => ({ ...f, tab: e.target.value as Tab }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-800 bg-white">
                    {TABS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Price (KSh)</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-800 transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Category Group</label>
                <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Sharing Bites, Beverages"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-800 transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Brief description…"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-800 transition-colors resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Badge</label>
                  <select value={form.tag ?? ''} onChange={e => setForm(f => ({ ...f, tag: (e.target.value || null) as 'popular' | 'special' | null }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-800 bg-white">
                    <option value="">None</option>
                    <option value="popular">Popular</option>
                    <option value="special">Special</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Sort Order</label>
                  <input type="number" value={form.position} onChange={e => setForm(f => ({ ...f, position: Number(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-800 transition-colors" />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  className="w-4 h-4 rounded accent-red-800" />
                <span className="text-sm font-semibold text-gray-700">Active (visible to guests)</span>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={closeForm} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: '#9B1C1C' }}>
                <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
