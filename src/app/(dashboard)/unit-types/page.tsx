'use client';

import { useState, useEffect } from 'react';

interface UnitType {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

const EMPTY_FORM = { name: '', description: '' };

export default function UnitTypesPage() {
  const [types, setTypes] = useState<UnitType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<UnitType | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      setSidebarCollapsed((e as CustomEvent<{ collapsed: boolean }>).detail.collapsed);
    };
    window.addEventListener('sidebarToggle', handler);
    return () => window.removeEventListener('sidebarToggle', handler);
  }, []);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/unit-types');
      const data = await res.json();
      setTypes(data.unit_types ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTypes(); }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (t: UnitType) => {
    setEditTarget(t);
    setForm({ name: t.name, description: t.description });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Name is required'); return; }
    setSaving(true);
    setFormError('');
    try {
      const url = editTarget ? `/api/unit-types/${editTarget.id}` : '/api/unit-types';
      const method = editTarget ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Failed to save'); return; }
      setShowModal(false);
      await fetchTypes();
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (t: UnitType) => {
    await fetch(`/api/unit-types/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !t.is_active }),
    });
    await fetchTypes();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/unit-types/${id}`, { method: 'DELETE' });
      setConfirmDeleteId(null);
      await fetchTypes();
    } finally {
      setDeletingId(null);
    }
  };

  const activeCount = types.filter(t => t.is_active).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className={`flex items-center justify-between px-4 lg:px-8 h-[80px] transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[100px]' : 'lg:pl-[300px]'}`}>
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-700"
              onClick={() => window.dispatchEvent(new CustomEvent('openMobileMenu'))}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Unit Types</h1>
              <p className="text-xs text-gray-400 hidden sm:block">Manage the property types available when adding new units</p>
            </div>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Type
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`px-4 py-6 sm:px-6 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[120px] lg:pr-[60px]' : 'lg:pl-[320px] lg:pr-[60px]'}`}>
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Types', value: loading ? '…' : types.length.toString() },
              { label: 'Active', value: loading ? '…' : activeCount.toString() },
              { label: 'Inactive', value: loading ? '…' : (types.length - activeCount).toString() },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white rounded-lg border border-gray-200 shadow-sm px-5 py-4">
                <p className="text-xs text-gray-500 font-medium mb-1">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Types list */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">All Unit Types</h2>
              <p className="text-xs text-gray-400 mt-0.5">These types appear as options when adding a new property.</p>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-400 text-sm">Loading…</div>
            ) : types.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                <p className="mb-3">No unit types yet.</p>
                <button onClick={openAdd} className="text-teal-600 hover:underline font-medium text-sm">Add your first type →</button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {types.map(t => (
                  <li key={t.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${t.is_active ? 'bg-teal-500' : 'bg-gray-300'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                        {t.description && <p className="text-xs text-gray-400 truncate mt-0.5">{t.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      {/* Toggle active */}
                      <button
                        onClick={() => handleToggle(t)}
                        title={t.is_active ? 'Deactivate' : 'Activate'}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                          t.is_active
                            ? 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {t.is_active ? 'Active' : 'Inactive'}
                      </button>
                      {/* Edit */}
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => setConfirmDeleteId(t.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Help note */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg px-5 py-4 text-sm text-teal-800">
            <p className="font-semibold mb-1">How unit types work</p>
            <p className="text-xs leading-relaxed text-teal-700">
              Types you add here appear as options in the <strong>Add Property</strong> wizard. 
              Deactivated types are hidden from the wizard but keep their existing assignments. 
              Default types (Studio, One Bedroom, etc.) are seeded automatically when you run the SQL migration.
            </p>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editTarget ? 'Edit Unit Type' : 'Add Unit Type'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Type Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Three Bedroom"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Three separate bedrooms with en-suite"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                />
              </div>
              {formError && <p className="text-sm text-red-600 font-medium">{formError}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
              >
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Type'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Unit Type?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently remove this type. Existing properties that use it will keep their current type label.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
              >
                {deletingId === confirmDeleteId ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
