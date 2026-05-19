'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, Mail, Phone, CalendarDays, LogIn, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function GuestProfilePage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (user) {
        setEmail(user.email ?? '');
        setName((user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || 'Guest');
        setPhone((user.user_metadata?.phone as string) || '');
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

  if (!email) {
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

        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-black text-slate-900 mb-5">Personal Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email</p>
                  <p className="text-sm font-semibold text-slate-900">{email}</p>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
