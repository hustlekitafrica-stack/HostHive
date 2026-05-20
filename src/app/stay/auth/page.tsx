'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';

function StayAuthContent() {
  const router      = useRouter();
  const params      = useSearchParams();
  const redirect    = params.get('redirect') ?? '/stay';
  const [tab, setTab]               = useState<'login' | 'register'>('login');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    router.replace(redirect);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
    if (loginErr) {
      setError('Account created! Please sign in.');
      setTab('login');
      return;
    }
    router.replace(redirect);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6"
      style={{ background: 'linear-gradient(160deg, #0f172a 0%, #0f172a 50%, #f8fafc 100%)' }}>

      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/stay">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg" style={{ background: '#16a34a' }}>K</div>
            <span className="font-black text-2xl text-white tracking-tight">KOGELO SUITES</span>
          </div>
        </Link>
        <p className="text-white/60 text-sm mt-1">
          {tab === 'login' ? 'Welcome back! Sign in to continue.' : 'Create your account to book with us.'}
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Tabs */}
        <div className="grid grid-cols-2 border-b border-gray-100">
          <button onClick={() => { setTab('login'); setError(''); }}
            className={`flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${tab === 'login' ? 'text-white' : 'text-gray-400 hover:text-gray-600'}`}
            style={tab === 'login' ? { background: '#16a34a' } : {}}>
            <LogIn className="w-4 h-4" />Sign In
          </button>
          <button onClick={() => { setTab('register'); setError(''); }}
            className={`flex items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${tab === 'register' ? 'text-white' : 'text-gray-400 hover:text-gray-600'}`}
            style={tab === 'register' ? { background: '#16a34a' } : {}}>
            <UserPlus className="w-4 h-4" />Create Account
          </button>
        </div>

        <div className="p-7">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-700 text-sm font-semibold rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 outline-none focus:border-red-800 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 outline-none focus:border-red-800 transition-colors pr-11" />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-2xl text-sm font-black text-white disabled:opacity-50 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #16a34a, #0f172a)' }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 outline-none focus:border-red-800 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 outline-none focus:border-red-800 transition-colors pr-11" />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-2xl text-sm font-black text-white disabled:opacity-50 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #16a34a, #0f172a)' }}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}

          <p className="text-xs text-gray-400 text-center mt-5">
            By continuing you agree to our terms of service.
          </p>
        </div>
      </div>

      <Link href="/stay" className="mt-6 text-white/50 hover:text-white text-sm transition-colors">
        ← Continue browsing without signing in
      </Link>
    </div>
  );
}

export default function StayAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}><div className="animate-spin w-10 h-10 border-2 rounded-full" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} /></div>}>
      <StayAuthContent />
    </Suspense>
  );
}
