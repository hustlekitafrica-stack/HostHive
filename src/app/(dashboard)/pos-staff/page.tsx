'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  X,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

// -- Types ---------------------------------------------------------------------

type Role = 'manager' | 'cashier' | 'waiter' | 'barman' | 'stock_manager';

interface StaffMember {
  id: string;
  name: string;
  role: Role;
  active: boolean;
  created_at: string;
}

interface StaffForm {
  name: string;
  role: Role;
  pin: string;
}

const EMPTY_FORM: StaffForm = { name: '', role: 'cashier', pin: '' };

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'manager',       label: 'Manager' },
  { value: 'cashier',       label: 'Cashier' },
  { value: 'waiter',        label: 'Waiter' },
  { value: 'barman',        label: 'Barman' },
  { value: 'stock_manager', label: 'Stock Manager' },
];

// -- Role badge ----------------------------------------------------------------

const ROLE_COLORS: Record<Role, string> = {
  manager:       'bg-purple-500/20 text-purple-300 border-purple-500/30',
  cashier:       'bg-blue-500/20 text-blue-300 border-blue-500/30',
  waiter:        'bg-green-500/20 text-green-300 border-green-500/30',
  barman:        'bg-amber-500/20 text-amber-300 border-amber-500/30',
  stock_manager: 'bg-red-500/20 text-red-300 border-red-500/30',
};

function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ROLE_COLORS[role] ?? 'bg-slate-600 text-slate-300'}`}>
      {ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role}
    </span>
  );
}

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

// -- StaffFormFields -----------------------------------------------------------

function StaffFormFields({
  form,
  setForm,
  pinLabel = 'PIN (4 digits)',
  pinRequired = true,
}: {
  form: StaffForm;
  setForm: React.Dispatch<React.SetStateAction<StaffForm>>;
  pinLabel?: string;
  pinRequired?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Name *</label>
        <input
          type="text"
          placeholder="e.g. Jane Doe"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm
                     placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Role *</label>
        <select
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          {pinLabel}
          {!pinRequired && <span className="text-slate-500 font-normal ml-1">(leave blank to keep current)</span>}
        </label>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          pattern="\d{4}"
          placeholder="••••"
          value={form.pin}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
            setForm((f) => ({ ...f, pin: val }));
          }}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm
                     tracking-widest font-mono placeholder-slate-500
                     focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
        />
        {form.pin.length > 0 && form.pin.length < 4 && (
          <p className="text-xs text-amber-400 mt-1">{4 - form.pin.length} more digit{4 - form.pin.length > 1 ? 's' : ''} needed</p>
        )}
      </div>
    </div>
  );
}

// -- Page ----------------------------------------------------------------------

export default function PosStaffPage() {
  const [staff,         setStaff]         = useState<StaffMember[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStaff,     setEditStaff]     = useState<StaffMember | null>(null);
  const [addForm,       setAddForm]       = useState<StaffForm>(EMPTY_FORM);
  const [editForm,      setEditForm]      = useState<StaffForm>(EMPTY_FORM);
  const [saving,        setSaving]        = useState(false);
  const [togglingId,    setTogglingId]    = useState<string | null>(null);

  // -- Fetch staff ----------------------------------------------------------

  const loadStaff = useCallback(() => {
    setLoading(true);
    fetch('/api/pos/staff')
      .then((r) => r.json())
      .then((d) => setStaff(d.staff ?? []))
      .catch(() => toast.error('Failed to load staff'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  // -- Add staff -------------------------------------------------------------

  const handleAdd = async () => {
    if (!addForm.name.trim()) { toast.error('Name is required'); return; }
    if (addForm.pin.length !== 4) { toast.error('PIN must be exactly 4 digits'); return; }
    setSaving(true);
    try {
      const res  = await fetch('/api/pos/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addForm.name.trim(), role: addForm.role, pin: addForm.pin }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to add staff'); return; }
      toast.success(`${addForm.name} added`);
      setShowAddModal(false);
      setAddForm(EMPTY_FORM);
      loadStaff();
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  // -- Edit staff ------------------------------------------------------------

  const openEdit = (member: StaffMember) => {
    setEditStaff(member);
    setEditForm({ name: member.name, role: member.role, pin: '' });
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    if (!editStaff) return;
    if (!editForm.name.trim()) { toast.error('Name is required'); return; }
    if (editForm.pin && editForm.pin.length !== 4) { toast.error('PIN must be exactly 4 digits'); return; }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: editForm.name.trim(),
        role: editForm.role,
      };
      if (editForm.pin) payload.pin = editForm.pin;

      const res  = await fetch(`/api/pos/staff/${editStaff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to update staff'); return; }
      toast.success('Staff updated');
      setShowEditModal(false);
      setEditStaff(null);
      loadStaff();
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  // -- Toggle active ---------------------------------------------------------

  const toggleActive = async (member: StaffMember) => {
    const newActive = !member.active;
    const action    = newActive ? 'Activate' : 'Deactivate';
    if (!newActive && !confirm(`Deactivate ${member.name}? They will no longer be able to log in.`)) return;

    setTogglingId(member.id);
    try {
      const res  = await fetch(`/api/pos/staff/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newActive }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? `${action} failed`); return; }
      toast.success(`${member.name} ${newActive ? 'activated' : 'deactivated'}`);
      setStaff((prev) =>
        prev.map((s) => (s.id === member.id ? { ...s, active: newActive } : s)),
      );
    } catch {
      toast.error('Network error');
    } finally {
      setTogglingId(null);
    }
  };

  // -- Date formatting -------------------------------------------------------

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-KE', { dateStyle: 'medium' });

  // -- Stats -----------------------------------------------------------------

  const activeCount   = staff.filter((s) => s.active).length;
  const inactiveCount = staff.length - activeCount;

  // -- Render ----------------------------------------------------------------

  return (
    <div className="p-6 space-y-6 bg-slate-900 min-h-screen text-white">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 rounded-xl">
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">POS Staff Management</h1>
            <p className="text-xs text-slate-400">
              {activeCount} active · {inactiveCount} inactive
            </p>
          </div>
        </div>
        <button
          onClick={() => { setAddForm(EMPTY_FORM); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      {/* Staff table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
        </div>
      ) : staff.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <Users className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm">No staff members yet. Add your first one.</p>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
                  <th className="px-5 py-3 text-left font-medium">Name</th>
                  <th className="px-5 py-3 text-left font-medium">Role</th>
                  <th className="px-5 py-3 text-center font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Created</th>
                  <th className="px-5 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {staff.map((member) => (
                  <tr
                    key={member.id}
                    className={`transition-colors hover:bg-slate-700/30 ${!member.active ? 'opacity-60' : ''}`}
                  >
                    {/* Name */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-white">{member.name}</span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3">
                      <RoleBadge role={member.role} />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3 text-center">
                      {member.active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-600/40 text-slate-400 border border-slate-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Created */}
                    <td className="px-5 py-3 text-slate-400 text-xs">{fmtDate(member.created_at)}</td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(member)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Activate / Deactivate */}
                        <button
                          onClick={() => toggleActive(member)}
                          disabled={togglingId === member.id}
                          title={member.active ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            member.active
                              ? 'text-slate-400 hover:text-red-400 hover:bg-red-400/10'
                              : 'text-slate-400 hover:text-green-400 hover:bg-green-400/10'
                          } disabled:opacity-40`}
                        >
                          {togglingId === member.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : member.active ? (
                            <ToggleRight className="w-5 h-5 text-green-400" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-slate-500" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -- Add Staff modal ----------------------------------------------------- */}
      {showAddModal && (
        <Modal title="Add Staff Member" onClose={() => setShowAddModal(false)}>
          <div className="space-y-4">
            <StaffFormFields form={addForm} setForm={setAddForm} pinRequired={true} />

            {/* PIN hint */}
            <div className="flex items-start gap-2 bg-slate-700/40 rounded-lg px-3 py-2.5">
              <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400">
                The PIN is used to authenticate this staff member at the POS terminal.
                Store it securely.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500
                           text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Staff
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* -- Edit Staff modal ---------------------------------------------------- */}
      {showEditModal && editStaff && (
        <Modal title={`Edit: ${editStaff.name}`} onClose={() => setShowEditModal(false)}>
          <div className="space-y-4">
            <StaffFormFields
              form={editForm}
              setForm={setEditForm}
              pinLabel="New PIN (4 digits)"
              pinRequired={false}
            />
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500
                           text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
