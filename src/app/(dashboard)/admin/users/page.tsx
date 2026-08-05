'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Member = {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  access_level: string;
  is_active: boolean;
  created_at: string;
};

export default function AdminUsersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    role: 'admin',
    accessLevel: 'admin',
    pin: '',
  });
  const [resetPin, setResetPin] = useState<Record<string, string>>({});

  const fetchMembers = () => {
    setLoading(true);
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => { if (d.members) setMembers(d.members); })
      .catch(() => toast.error('Failed to load team members'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.members) setMembers(d.members);
      })
      .catch(() => { if (!cancelled) toast.error('Failed to load team members'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create user');
        return;
      }
      toast.success('User created');
      setForm({ fullName: '', email: '', role: 'admin', accessLevel: 'admin', pin: '' });
      fetchMembers();
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPin = async (id: string) => {
    const pin = resetPin[id];
    if (!pin) {
      toast.error('Enter a new PIN');
      return;
    }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to reset PIN');
        return;
      }
      toast.success('PIN reset');
      setResetPin((prev) => ({ ...prev, [id]: '' }));
    } catch {
      toast.error('Network error');
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update user');
        return;
      }
      toast.success('User updated');
      fetchMembers();
    } catch {
      toast.error('Network error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete user');
        return;
      }
      toast.success('User deleted');
      fetchMembers();
    } catch {
      toast.error('Network error');
    }
  };

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-surface-900 mb-2">Admin Users</h1>
      <p className="text-sm text-surface-600 mb-6">
        Create and manage staff PINs. Each user gets a unique PIN for login.
      </p>

      <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-6 mb-8 space-y-4">
        <h2 className="text-lg font-semibold text-surface-900">Add user</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full name"
            value={form.fullName}
            onChange={(e) => updateForm('fullName', e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => updateForm('email', e.target.value)}
            required
          />
          <Input
            label="Role"
            value={form.role}
            onChange={(e) => updateForm('role', e.target.value)}
            required
          />
          <Input
            label="Access level"
            value={form.accessLevel}
            onChange={(e) => updateForm('accessLevel', e.target.value)}
            required
          />
          <Input
            label="PIN"
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={form.pin}
            onChange={(e) => updateForm('pin', e.target.value)}
            required
          />
        </div>
        <Button type="submit" isLoading={saving}>
          Create user
        </Button>
      </form>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b border-surface-200 font-semibold text-surface-900">
          Team members
        </div>
        {loading && <p className="p-4 text-sm text-surface-500">Loading...</p>}
        <ul className="divide-y divide-surface-200">
          {members.map((m) => (
            <li key={m.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <p className="font-medium text-surface-900">{m.full_name || m.email}</p>
                <p className="text-sm text-surface-500">{m.email} &middot; {m.role} &middot; {m.access_level}</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="New PIN"
                  value={resetPin[m.id] || ''}
                  onChange={(e) => setResetPin((prev) => ({ ...prev, [m.id]: e.target.value }))}
                  className="w-32"
                />
                <Button size="sm" onClick={() => handleResetPin(m.id)}>
                  Reset PIN
                </Button>
                <Button
                  size="sm"
                  variant={m.is_active ? 'outline' : 'default'}
                  onClick={() => handleToggle(m.id, m.is_active)}
                >
                  {m.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(m.id)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
          {!loading && members.length === 0 && (
            <li className="p-4 text-sm text-surface-500">No team members found.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
