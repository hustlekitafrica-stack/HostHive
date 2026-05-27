'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Save, X, Tag, Calendar, BedDouble, Percent, DollarSign } from 'lucide-react';

type DiscountType = 'first_timer' | 'early_booking' | 'online_booking' | 'manual';
type ValueType    = 'percentage' | 'fixed';

type DiscountProperty = { property_id: string };

type Discount = {
  id: string;
  name: string;
  description: string;
  discount_type: DiscountType;
  value_type: ValueType;
  value: number;
  early_booking_days: number | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  discount_properties: DiscountProperty[];
};

type Property = { id: string; name: string };

const TYPE_LABELS: Record<DiscountType, string> = {
  first_timer:    'First-Timer',
  early_booking:  'Early Booking',
  online_booking: 'Online Booking',
  manual:         'Manual',
};

const TYPE_DESCRIPTIONS: Record<DiscountType, string> = {
  first_timer:    'Applied when a logged-in guest has no prior bookings',
  early_booking:  'Applied when booking is made X or more days before check-in',
  online_booking: 'Applied to any logged-in guest booking through the website',
  manual:         'Admin-controlled, never applied automatically',
};

const TYPE_COLORS: Record<DiscountType, string> = {
  first_timer:    '#7C3AED',
  early_booking:  '#0369A1',
  online_booking: '#16A34A',
  manual:         '#9B1C1C',
};

const EMPTY_FORM = {
  name:               '',
  description:        '',
  discount_type:      'first_timer' as DiscountType,
  value_type:         'percentage' as ValueType,
  value:              10,
  early_booking_days: 14,
  valid_from:         '',
  valid_until:        '',
  is_active:          true,
  property_ids:       [] as string[],
};

export default function DiscountsPage() {
  const [discounts,  setDiscounts]  = useState<Discount[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState<Discount | null>(null);
  const [form,       setForm]       = useState({ ...EMPTY_FORM });
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [deleting,   setDeleting]   = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/discounts')
      .then(r => r.json())
      .then(d => setDiscounts(d.discounts ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    fetch('/api/stay/properties')
      .then(r => r.json())
      .then(d => setProperties((d.properties ?? []).map((p: Property) => ({ id: p.id, name: p.name }))));
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setError('');
    setShowForm(true);
  };

  const openEdit = (d: Discount) => {
    setEditing(d);
    setForm({
      name:               d.name,
      description:        d.description ?? '',
      discount_type:      d.discount_type,
      value_type:         d.value_type,
      value:              d.value,
      early_booking_days: d.early_booking_days ?? 14,
      valid_from:         d.valid_from ?? '',
      valid_until:        d.valid_until ?? '',
      is_active:          d.is_active,
      property_ids:       (d.discount_properties ?? []).map(dp => dp.property_id),
    });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); setError(''); };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Discount name is required.'); return; }
    if (Number(form.value) <= 0) { setError('Value must be greater than 0.'); return; }
    if (form.value_type === 'percentage' && Number(form.value) > 100) {
      setError('Percentage cannot exceed 100%.'); return;
    }
    if (form.discount_type === 'early_booking' && Number(form.early_booking_days) < 1) {
      setError('Early booking days must be at least 1.'); return;
    }

    setSaving(true); setError('');
    try {
      const payload = {
        name:               form.name.trim(),
        description:        form.description.trim(),
        discount_type:      form.discount_type,
        value_type:         form.value_type,
        value:              Number(form.value),
        early_booking_days: form.discount_type === 'early_booking' ? Number(form.early_booking_days) : null,
        valid_from:         form.valid_from  || null,
        valid_until:        form.valid_until || null,
        is_active:          form.is_active,
        property_ids:       form.property_ids,
      };

      const url    = editing ? `/api/discounts/${editing.id}` : '/api/discounts';
      const method = editing ? 'PATCH' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data   = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to save.'); return; }
      load();
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this discount? This cannot be undone.')) return;
    setDeleting(id);
    await fetch(`/api/discounts/${id}`, { method: 'DELETE' });
    setDiscounts(prev => prev.filter(d => d.id !== id));
    setDeleting(null);
  };

  const handleToggle = async (d: Discount) => {
    const res  = await fetch(`/api/discounts/${d.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !d.is_active }),
    });
    const data = await res.json();
    if (res.ok) setDiscounts(prev => prev.map(x => x.id === d.id ? { ...x, is_active: data.discount.is_active } : x));
  };

  const toggleProperty = (pid: string) => {
    setForm(f => ({
      ...f,
      property_ids: f.property_ids.includes(pid)
        ? f.property_ids.filter(id => id !== pid)
        : [...f.property_ids, pid],
    }));
  };

  const formatValue = (d: Discount) =>
    d.value_type === 'percentage' ? `${d.value}% off` : `KSh ${d.value.toLocaleString()} off`;

  const roomLabel = (d: Discount) => {
    const linked = (d.discount_properties ?? []).length;
    if (linked === 0) return 'All rooms';
    if (linked === 1) {
      const prop = properties.find(p => p.id === d.discount_properties[0].property_id);
      return prop?.name ?? '1 room';
    }
    return `${linked} rooms`;
  };

  const validityLabel = (d: Discount) => {
    if (!d.valid_from && !d.valid_until) return 'Always active';
    if (d.valid_from && d.valid_until) return `${d.valid_from} → ${d.valid_until}`;
    if (d.valid_from) return `From ${d.valid_from}`;
    return `Until ${d.valid_until}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#9B1C1C' }}>
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Discounts</h1>
              <p className="text-xs text-gray-500">
                {discounts.length} discount{discounts.length !== 1 ? 's' : ''} · {discounts.filter(d => d.is_active).length} active
              </p>
            </div>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: '#9B1C1C' }}>
            <Plus className="w-4 h-4" />Add Discount
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Info card */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 text-sm text-amber-800">
          <strong className="font-bold">How discounts stack:</strong> When a guest qualifies for multiple discounts, all qualifying amounts are added together (cumulative). Discounts are evaluated automatically at checkout.
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-8 h-8 rounded-full border-2" style={{ borderColor: '#9B1C1C', borderTopColor: 'transparent' }} />
          </div>
        ) : discounts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
            <Tag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold text-sm mb-1">No discounts created yet.</p>
            <p className="text-gray-400 text-xs mb-4">Create your first discount to start rewarding guests automatically.</p>
            <button onClick={openNew} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#9B1C1C' }}>
              Create First Discount
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {discounts.map(d => (
              <div key={d.id}
                className={`bg-white rounded-2xl border transition-all ${d.is_active ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
                <div className="p-4 flex items-start gap-4">
                  {/* Type color bar */}
                  <div className="w-1.5 self-stretch rounded-full flex-shrink-0" style={{ background: TYPE_COLORS[d.discount_type] }} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-gray-900 text-sm">{d.name}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: TYPE_COLORS[d.discount_type] }}>
                        {TYPE_LABELS[d.discount_type]}
                      </span>
                      {!d.is_active && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>
                      )}
                    </div>

                    {d.description && (
                      <p className="text-xs text-gray-500 mb-2">{d.description}</p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        {d.value_type === 'percentage'
                          ? <Percent className="w-3 h-3" />
                          : <DollarSign className="w-3 h-3" />}
                        <strong className="text-gray-700">{formatValue(d)}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-3 h-3" />
                        {roomLabel(d)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {validityLabel(d)}
                      </span>
                      {d.discount_type === 'early_booking' && d.early_booking_days && (
                        <span className="flex items-center gap-1">
                          <span>≥ {d.early_booking_days} days in advance</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => handleToggle(d)} title={d.is_active ? 'Deactivate' : 'Activate'}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                      {d.is_active
                        ? <ToggleRight className="w-5 h-5 text-green-500" />
                        : <ToggleLeft  className="w-5 h-5 text-gray-400" />}
                    </button>
                    <button onClick={() => openEdit(d)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(d.id)} disabled={deleting === d.id}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0" style={{ background: '#9B1C1C' }}>
              <h2 className="text-base font-black text-white">{editing ? 'Edit Discount' : 'New Discount'}</h2>
              <button onClick={closeForm} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {error && <div className="text-sm text-red-600 font-semibold bg-red-50 rounded-xl px-4 py-3">{error}</div>}

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Discount Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. First-Timer Welcome Offer"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-800 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Description <span className="font-normal normal-case text-gray-400">(optional)</span></label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Welcome offer for guests booking with us for the first time"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-800 transition-colors"
                />
              </div>

              {/* Trigger type */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Trigger Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(TYPE_LABELS) as DiscountType[]).map(t => (
                    <button key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, discount_type: t }))}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left border-2 transition-all ${form.discount_type === t ? 'text-white border-transparent' : 'text-gray-600 border-gray-200 bg-white hover:border-gray-300'}`}
                      style={form.discount_type === t ? { background: TYPE_COLORS[t], borderColor: TYPE_COLORS[t] } : {}}>
                      <div>{TYPE_LABELS[t]}</div>
                      <div className={`text-[10px] font-normal mt-0.5 leading-snug ${form.discount_type === t ? 'text-white/70' : 'text-gray-400'}`}>
                        {TYPE_DESCRIPTIONS[t]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Early booking days — only shown for early_booking */}
              {form.discount_type === 'early_booking' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Minimum Days in Advance *</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number" min={1}
                      value={form.early_booking_days}
                      onChange={e => setForm(f => ({ ...f, early_booking_days: Number(e.target.value) }))}
                      className="w-28 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-800 transition-colors"
                    />
                    <span className="text-sm text-gray-500">days before check-in</span>
                  </div>
                </div>
              )}

              {/* Value type + value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Value Type *</label>
                  <select
                    value={form.value_type}
                    onChange={e => setForm(f => ({ ...f, value_type: e.target.value as ValueType }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-800 bg-white">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (KSh)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    {form.value_type === 'percentage' ? 'Percentage (%)' : 'Amount (KSh)'} *
                  </label>
                  <input
                    type="number" min={0} max={form.value_type === 'percentage' ? 100 : undefined}
                    value={form.value}
                    onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))}
                    placeholder={form.value_type === 'percentage' ? '10' : '500'}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-800 transition-colors"
                  />
                </div>
              </div>

              {/* Applicable rooms */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Applicable Rooms</label>
                {properties.length === 0 ? (
                  <p className="text-xs text-gray-400">No rooms found. Discount will apply to all rooms.</p>
                ) : (
                  <div className="space-y-1.5">
                    <button type="button"
                      onClick={() => setForm(f => ({ ...f, property_ids: [] }))}
                      className={`w-full px-4 py-2.5 rounded-xl text-sm font-bold text-left border-2 transition-all ${form.property_ids.length === 0 ? 'border-transparent text-white' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'}`}
                      style={form.property_ids.length === 0 ? { background: '#16A34A' } : {}}>
                      🏠 All Rooms
                    </button>
                    <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto">
                      {properties.map(p => {
                        const selected = form.property_ids.includes(p.id);
                        return (
                          <button key={p.id} type="button"
                            onClick={() => toggleProperty(p.id)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-left border-2 transition-all ${selected ? 'border-transparent text-white' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'}`}
                            style={selected ? { background: '#9B1C1C' } : {}}>
                            {selected ? '✓ ' : ''}{p.name}
                          </button>
                        );
                      })}
                    </div>
                    {form.property_ids.length > 0 && (
                      <p className="text-xs text-gray-400">{form.property_ids.length} room{form.property_ids.length !== 1 ? 's' : ''} selected</p>
                    )}
                  </div>
                )}
              </div>

              {/* Validity dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Valid From <span className="font-normal normal-case text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={form.valid_from}
                    onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-800 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Valid Until <span className="font-normal normal-case text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-800 transition-colors"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 -mt-2">Leave dates empty to keep the discount permanently active.</p>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded accent-red-800"
                />
                <span className="text-sm font-semibold text-gray-700">Active (applied automatically at checkout)</span>
              </label>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button onClick={closeForm}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: '#9B1C1C' }}>
                <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Discount'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
