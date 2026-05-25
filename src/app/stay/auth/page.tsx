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
  const [loginStep, setLoginStep]   = useState<'email' | 'password'>('email');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [fullName, setFullName]     = useState('');
  const [regPhone, setRegPhone]     = useState('');
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
    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!regPhone.trim()) { setError('Please enter your phone number.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName.trim(), phone: regPhone.trim() } },
    });
    if (err) { setLoading(false); setError(err.message); return; }
    await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    router.replace(redirect);
  };

  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.boxShadow = '0 0 0 2px #22c55e';
    e.target.style.borderColor = '#22c55e';
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.boxShadow = '';
    e.target.style.borderColor = '#d1d5db';
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex flex-col px-5 pt-8 pb-6 max-w-md w-full mx-auto">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {tab === 'login' ? 'Sign in or create an account' : 'Create your account'}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {tab === 'login'
            ? 'Sign in using your Kogelo Suites account to manage your stay.'
            : 'Set up your account to start booking with Kogelo Suites.'}
        </p>

        {/* Tab switcher */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => { setTab('login'); setError(''); setLoginStep('email'); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-semibold transition-all"
            style={tab === 'login' ? { backgroundColor: '#1e293b', color: '#fff' } : { color: '#6b7280' }}
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-semibold transition-all"
            style={tab === 'register' ? { backgroundColor: '#1e293b', color: '#fff' } : { color: '#6b7280' }}
          >
            <UserPlus className="w-4 h-4" /> Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
            {error}
          </div>
        )}

        {tab === 'login' ? (
          loginStep === 'email' ? (
            <form onSubmit={(e) => { e.preventDefault(); if (!email) { setError('Please enter your email address'); return; } setError(''); setLoginStep('password'); }} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="Enter your email address" autoComplete="email"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none transition-all text-sm"
                  onFocus={inputFocus} onBlur={inputBlur} />
              </div>
              <button type="submit"
                className="w-full text-white font-semibold py-3 px-4 rounded-md transition-all duration-200 text-sm"
                style={{ backgroundColor: '#16a34a' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#15803d')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#16a34a')}>
                Continue with email
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Email address</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-md truncate">{email}</span>
                  <button type="button" onClick={() => { setLoginStep('email'); setError(''); }}
                    className="text-sm font-medium" style={{ color: '#16a34a' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#15803d')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#16a34a')}>
                    Change
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="Enter your password" autoComplete="current-password" autoFocus
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none transition-all text-sm pr-11"
                    onFocus={inputFocus} onBlur={inputBlur} />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full text-white font-semibold py-3 px-4 rounded-md transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#16a34a' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#15803d'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#16a34a'; }}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none transition-all text-sm"
                onFocus={inputFocus} onBlur={inputBlur} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Phone Number</label>
              <input type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)} required
                placeholder="+254 700 000 000"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none transition-all text-sm"
                onFocus={inputFocus} onBlur={inputBlur} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="Enter your email address" autoComplete="email"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none transition-all text-sm"
                onFocus={inputFocus} onBlur={inputBlur} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="At least 8 characters" autoComplete="new-password"
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none transition-all text-sm pr-11"
                  onFocus={inputFocus} onBlur={inputBlur} />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full text-white font-semibold py-3 px-4 rounded-md transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#16a34a' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#15803d'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#16a34a'; }}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 whitespace-nowrap">or use one of these options</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Social Buttons */}
        <div className="flex gap-3">
          <button type="button" className="flex-1 flex items-center justify-center py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors" title="Continue with Google">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>
          <button type="button" className="flex-1 flex items-center justify-center py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors" title="Continue with Apple">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
            </svg>
          </button>
          <button type="button" className="flex-1 flex items-center justify-center py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors" title="Continue with Facebook">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>
        </div>

        {/* Help */}
        <div className="mt-6 text-center">
          <button type="button" className="text-sm font-medium transition-colors" style={{ color: '#16a34a' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#15803d')}
            onMouseLeave={e => (e.currentTarget.style.color = '#16a34a')}>
            Having trouble signing in?
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            By signing in or creating an account, you agree with our{' '}
            <button className="underline" style={{ color: '#16a34a' }}>Terms &amp; conditions</button>
            {' '}and{' '}
            <button className="underline" style={{ color: '#16a34a' }}>Privacy statement</button>
          </p>
        </div>

        {/* Continue without signing in */}
        <div className="mt-6 text-center">
          <Link href="/stay" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Continue browsing without signing in
          </Link>
        </div>
      </main>
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
