'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !businessName || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword, fullName, businessName }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error?.message || 'Registration failed');
        return;
      }
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        toast.success('Account created! Please log in.');
        router.push('/auth/login');
        return;
      }
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
          <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{background:'#9B1C1C'}}>KS</div>
                <span className="text-sm text-white font-bold">Kogelo Suites</span>
              </div>
              <span className="text-xs text-slate-400">Need help?</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Sign up</h1>
          </div>
          <div className="px-6 sm:px-8 py-6 sm:py-8">
            <form onSubmit={handleRegister} className="space-y-4">
              <input type="text" value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
              <input type="text" value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Business / Property Name"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
              <input type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ololo@gmail.com"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
              <input type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your Password"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
              <input type="password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all" />
              <button type="submit" disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
              <Link href="/auth/login"
                className="block text-center text-slate-400 hover:text-slate-300 text-sm transition-colors">
                Already have an account?{' '}
                <span className="text-green-400 hover:text-green-300">Log in</span>
              </Link>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}