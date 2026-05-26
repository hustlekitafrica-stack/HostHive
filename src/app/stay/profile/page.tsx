'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Phone, CalendarDays, LogIn, ShieldCheck, LogOut, Pencil, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function GuestProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveMsgType, setSaveMsgType] = useState<'ok' | 'err'>('ok');

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/stay');
  };

  const startEditing = () => {
    setEditName(name === 'Guest' ? '' : name);
    setEditEmail(email);
    setSaveMsg('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveMsg('');
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveMsg('');
    const supabase = createClient();
    const updates: Record<string, string> = {};
    if (editName.trim()) updates.full_name = editName.trim();
    updates.profile_email = editEmail.trim();
    const { error } = await supabase.auth.updateUser({ data: updates });
    if (error) {
      setSaveMsgType('err');
      setSaveMsg('Failed to save. Please try again.');
    } else {
      if (editName.trim()) setName(editName.trim());
      setEmail(editEmail.trim());
      setEditing(false);
      setSaveMsgType('ok');
      setSaveMsg('Profile updated successfully.');
      setTimeout(() => setSaveMsg(''), 4000);
    }
    setSaving(false);
  };

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (user) {
        setLoggedIn(true);
        const meta = user.user_metadata ?? {};
        setEmail(user.email || (meta.profile_email as string) || '');
        setName((meta.full_name as string) || (meta.name as string) || 'Guest');
        setPhone(user.phone || (meta.phone as string) || '');
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] pt-5 sm:pt-24 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 rounded-full" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#f8fafc] pt-5 sm:pt-24 px-4 sm:px-6">
        <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: '#f0fdf4' }}>
            <LogIn className="w-8 h-8" style={{ color: '#16a34a' }} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Sign in to view your profile</h1>
          <p className="text-slate-500 text-sm mb-6">Manage your guest details and access your trips faster.</p>
          <Link href="/stay/auth" className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#16a34a' }}>
            Sign in or Register
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-5 sm:pt-24 px-4 sm:px-6 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-3xl p-8 sm:p-10 text-white mb-8" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#16a34a' }}>
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-sm font-semibold mb-1">Guest Profile</p>
              <h1 className="text-3xl font-black">{name}</h1>
              <p className="text-white/70 text-sm mt-1">Kogelo Suites guest account</p>
            </div>
          </div>
        </div>

        {saveMsg && !editing && (
          <div className={`mb-4 px-4 py-3 rounded-2xl text-sm font-semibold ${saveMsgType === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {saveMsg}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900">Personal Details</h2>
              {!editing && (
                <button onClick={startEditing} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Full Name</label>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-green-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                    Email <span className="font-normal text-slate-400 normal-case">(optional — for booking confirmations)</span>
                  </label>
                  <input
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-green-600 transition-colors"
                  />
                </div>
                {saveMsg && (
                  <p className={`text-sm font-semibold ${saveMsgType === 'err' ? 'text-red-600' : 'text-green-600'}`}>{saveMsg}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all"
                    style={{ background: '#16a34a' }}>
                    <Check className="w-4 h-4" />{saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                    <X className="w-4 h-4" />Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Full Name</p>
                    <p className="text-sm font-semibold text-slate-900">{name === 'Guest' ? <span className="text-slate-400 italic">Not set — tap Edit to add</span> : name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email</p>
                    <p className="text-sm font-semibold text-slate-900">{email || <span className="text-slate-400 italic">Not added yet — tap Edit to add</span>}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                  <Phone className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Phone</p>
                    <p className="text-sm font-semibold text-slate-900">{phone || 'Not added yet'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                  <ShieldCheck className="w-5 h-5" style={{ color: '#16a34a' }} />
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Account Status</p>
                    <p className="text-sm font-semibold text-slate-900">Active guest account</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-black text-slate-900 mb-5">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/stay/my-bookings" className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <CalendarDays className="w-5 h-5" style={{ color: '#16a34a' }} />
                <span className="text-sm font-bold text-slate-900">View Trips</span>
              </Link>
              <Link href="/stay/rooms" className="block text-center px-5 py-3 rounded-xl text-sm font-bold text-white" style={{ background: '#16a34a' }}>
                Book a Stay
              </Link>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full flex items-center gap-3 p-4 rounded-2xl bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50">
                <LogOut className="w-5 h-5 text-red-500" />
                <span className="text-sm font-bold text-red-600">{signingOut ? 'Signing out…' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
