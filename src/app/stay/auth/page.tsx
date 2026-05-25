'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length >= 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+254${digits.slice(1)}`;
  if (digits.length === 9) return `+254${digits}`;
  if (digits.length >= 10) return `+${digits}`;
  return raw.trim();
}

function PageFooter() {
  return (
    <>
      <div className="mt-8 pt-6 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400 leading-relaxed">
          By continuing, you agree with our{' '}
          <button className="underline" style={{ color: '#16a34a' }}>Terms &amp; conditions</button>
          {' '}and{' '}
          <button className="underline" style={{ color: '#16a34a' }}>Privacy statement</button>
        </p>
      </div>
    </>
  );
}

function StayAuthContent() {
  const router   = useRouter();
  const params   = useSearchParams();
  const redirect = params.get('redirect') ?? '/stay';

  const [step, setStep]               = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone]             = useState('');
  const [formattedPhone, setFmtPhone] = useState('');
  const [otp, setOtp]                 = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [countdown, setCountdown]     = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const supabase = createClient();

  // Lock page scroll while auth overlay is visible
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const fp = formatPhone(phone);
    if (fp.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number (e.g. 0712 345 678).');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({ phone: fp });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setFmtPhone(fp);
    setStep('otp');
    setCountdown(RESEND_SECONDS);
    setOtp(Array(OTP_LENGTH).fill(''));
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const handleVerifyOtp = async (token: string) => {
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.verifyOtp({ phone: formattedPhone, token, type: 'sms' });
    setLoading(false);
    if (err) {
      setError(err.message);
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
      return;
    }
    router.replace(redirect);
  };

  const handleOtpInput = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
      const next = [...Array(OTP_LENGTH).fill('')];
      digits.split('').forEach((d, i) => { next[i] = d; });
      setOtp(next);
      const focusIdx = Math.min(digits.length, OTP_LENGTH - 1);
      otpRefs.current[focusIdx]?.focus();
      if (digits.length === OTP_LENGTH) handleVerifyOtp(digits);
      return;
    }
    const digit = value.replace(/\D/g, '');
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
    if (digit && index === OTP_LENGTH - 1 && next.every(d => d !== '')) handleVerifyOtp(next.join(''));
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const next = [...otp]; next[index] = ''; setOtp(next);
      } else if (index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || loading) return;
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setCountdown(RESEND_SECONDS);
    setOtp(Array(OTP_LENGTH).fill(''));
    setTimeout(() => otpRefs.current[0]?.focus(), 50);
  };

  const phoneFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.boxShadow = '0 0 0 2px #22c55e';
    e.target.style.borderColor = '#22c55e';
  };
  const phoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.boxShadow = '';
    e.target.style.borderColor = '#d1d5db';
  };

  return (
    <div className="bg-white flex flex-col" style={{ height: 'calc(100dvh - 3.5rem)' }}>
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-6">
        <div className="w-full max-w-md">

        {step === 'phone' ? (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Sign in or create an account</h1>
            <p className="text-sm text-gray-500 mb-4">
              Enter your phone number to continue. We&apos;ll send you a one-time verification code.
            </p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">{error}</div>
            )}

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">Phone number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+254 700 000 000"
                  autoComplete="tel"
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:outline-none transition-all text-sm"
                  onFocus={phoneFocus}
                  onBlur={phoneBlur}
                />
                <p className="mt-1.5 text-xs text-gray-400">e.g. 0712 345 678 or +254 712 345 678</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-semibold py-3 px-4 rounded-md transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#16a34a' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#15803d'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#16a34a'; }}
              >
                {loading ? 'Sending code…' : 'Send verification code'}
              </button>
            </form>

            <PageFooter />
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Verify your phone number</h1>
            <p className="text-sm text-gray-500 mb-4">
              We&apos;ve sent a verification code to{' '}
              <span className="font-semibold text-gray-800">{formattedPhone}</span>.
              {' '}Please enter this code to continue.
            </p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">{error}</div>
            )}

            {/* 6-digit OTP boxes */}
            <div className="flex gap-2 mb-5">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={OTP_LENGTH}
                  value={digit}
                  onChange={e => handleOtpInput(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  onFocus={e => {
                    e.target.select();
                    e.target.style.boxShadow = '0 0 0 2px #22c55e';
                    e.target.style.borderColor = '#22c55e';
                  }}
                  onBlur={e => {
                    e.target.style.boxShadow = '';
                    e.target.style.borderColor = digit ? '#16a34a' : '#d1d5db';
                  }}
                  className="flex-1 aspect-square min-w-0 text-center text-xl font-bold text-gray-900 bg-white border-2 border-gray-300 rounded-xl focus:outline-none transition-all"
                />
              ))}
            </div>

            {/* Verify button */}
            <button
              type="button"
              disabled={loading || otp.some(d => !d)}
              onClick={() => handleVerifyOtp(otp.join(''))}
              className="w-full text-white font-semibold py-3 px-4 rounded-md transition-all duration-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed mb-5"
              style={{ backgroundColor: '#16a34a' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#15803d'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#16a34a'; }}
            >
              {loading ? 'Verifying…' : 'Verify phone number'}
            </button>

            {/* Resend */}
            <p className="text-sm text-center text-gray-500 mb-4">
              {countdown > 0 ? (
                <>Didn&apos;t receive a code? Request another in <strong>{countdown}s</strong></>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-medium underline transition-colors"
                  style={{ color: '#16a34a' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#15803d')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#16a34a')}
                >
                  Resend verification code
                </button>
              )}
            </p>

            {/* Back */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setStep('phone'); setError(''); setOtp(Array(OTP_LENGTH).fill('')); }}
                className="text-sm font-medium transition-colors"
                style={{ color: '#16a34a' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#15803d')}
                onMouseLeave={e => (e.currentTarget.style.color = '#16a34a')}
              >
                Back to phone number
              </button>
            </div>

            <PageFooter />
          </>
        )}
        </div>
      </main>
    </div>
  );
}

export default function StayAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-10 h-10 border-2 rounded-full" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} />
      </div>
    }>
      <StayAuthContent />
    </Suspense>
  );
}
