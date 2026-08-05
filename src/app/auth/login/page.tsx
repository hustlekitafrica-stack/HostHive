'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const PIN_LENGTH = 4;

export default function LoginPage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const submitPin = async (pin: string) => {
    if (pin.length < PIN_LENGTH) {
      toast.error('Please enter your full PIN');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message || 'Invalid PIN');
        setDigits(Array(PIN_LENGTH).fill(''));
        setTimeout(() => refs.current[0]?.focus(), 50);
        return;
      }
      toast.success('Login successful!');
      router.push(data.redirect || '/dashboard');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (index: number, value: string) => {
    // Handle paste: spread across boxes
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, '').slice(0, PIN_LENGTH);
      const next = [...Array(PIN_LENGTH).fill('')];
      pasted.split('').forEach((d, i) => { next[i] = d; });
      setDigits(next);
      const focusIdx = Math.min(pasted.length, PIN_LENGTH - 1);
      refs.current[focusIdx]?.focus();
      if (pasted.length === PIN_LENGTH) submitPin(pasted);
      return;
    }

    const digit = value.replace(/\D/g, '');
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < PIN_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
    if (digit && index === PIN_LENGTH - 1 && next.every((d) => d !== '')) {
      submitPin(next.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < PIN_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitPin(digits.join(''));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header
        className="flex items-center px-4 py-3"
        style={{ backgroundColor: '#1e293b' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: '#16a34a' }}
          >
            KS
          </div>
          <span className="text-white font-bold text-base">Kogelo Suites</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm text-center">
          {/* Lock icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#f0fdf4' }}
          >
            <svg className="w-8 h-8" fill="none" stroke="#16a34a" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin PIN</h1>
          <p className="text-sm text-gray-500 mb-8">
            Enter your {PIN_LENGTH}-digit PIN to sign in
          </p>

          <form onSubmit={handleSubmit}>
            {/* PIN boxes */}
            <div className="flex justify-center gap-3 mb-8">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { refs.current[i] = el; }}
                  type="password"
                  inputMode="numeric"
                  maxLength={PIN_LENGTH}
                  value={digit}
                  autoFocus={i === 0}
                  disabled={loading}
                  onChange={(e) => handleInput(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#16a34a';
                    e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = digit ? '#16a34a' : '#d1d5db';
                    e.target.style.boxShadow = '';
                  }}
                  className="w-14 h-14 text-center text-2xl font-bold text-gray-900 border-2 rounded-xl outline-none transition-all duration-150 disabled:opacity-50"
                  style={{
                    borderColor: digit ? '#16a34a' : '#d1d5db',
                    backgroundColor: digit ? '#f0fdf4' : '#ffffff',
                  }}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || digits.some((d) => !d)}
              className="w-full text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#16a34a' }}
              onMouseEnter={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#15803d';
              }}
              onMouseLeave={(e) => {
                if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#16a34a';
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
