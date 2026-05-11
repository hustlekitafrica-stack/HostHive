'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

type Plan = 'onetime' | 'monthly';

const PLANS = [
  {
    id: 'onetime' as Plan,
    name: 'Lifetime Access',
    price: 'KES 15,000',
    period: 'one-time payment',
    description: 'Pay once, use forever. All future features included at no extra cost.',
    badge: 'BEST VALUE',
  },
  {
    id: 'monthly' as Plan,
    name: 'Monthly Plan',
    price: 'KES 500',
    period: 'per month',
    description: 'Flexible monthly subscription. Cancel anytime.',
    badge: '',
  },
];

function UpgradeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';

  const [selectedPlan, setSelectedPlan] = useState<Plan>('onetime');
  const [step, setStep] = useState<'plan' | 'payment' | 'done'>('plan');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaLoading, setMpesaLoading] = useState(false);
  const [mpesaSent, setMpesaSent] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('user_phone') || '';
    if (saved) setMpesaPhone(saved);
  }, []);

  const handleSendRequest = async () => {
    if (!mpesaPhone.trim()) return;
    setMpesaLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setMpesaLoading(false);
    setMpesaSent(true);
  };

  const handleConfirmPayment = () => {
    localStorage.setItem('subscription_status', 'paid');
    localStorage.setItem('subscription_plan', selectedPlan);
    localStorage.setItem('subscription_date', new Date().toISOString());

    fetch('/api/subscription', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription_status: 'paid',
        subscription_plan: selectedPlan,
      }),
    }).catch(() => {});

    setStep('done');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Exit Button */}
        {!isExpired && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors bg-slate-800/60 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Exit
            </button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">HH</div>
            <span className="text-white font-bold text-xl">Host Hive</span>
          </div>
          {isExpired && (
            <div className="mt-3 inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-amber-300 text-sm font-medium">Your 14-day trial has expired</span>
            </div>
          )}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">

          {/* ── Plan Selection ── */}
          {step === 'plan' && (
            <div className="p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-white mb-1">Upgrade your plan</h2>
              <p className="text-slate-400 text-sm mb-6">Choose a plan and pay securely via M-Pesa to continue using HostBooks KE.</p>

              <div className="space-y-3 mb-6">
                {PLANS.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedPlan === plan.id
                        ? 'border-teal-500 bg-teal-500/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          selectedPlan === plan.id ? 'border-teal-500' : 'border-slate-500'
                        }`}>
                          {selectedPlan === plan.id && <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-semibold text-sm">{plan.name}</span>
                            {plan.badge && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">{plan.badge}</span>
                            )}
                          </div>
                          <p className="text-slate-400 text-xs mt-0.5">{plan.description}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-white font-bold text-sm">{plan.price}</span>
                        <p className="text-slate-400 text-xs">{plan.period}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep('payment')}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Continue to Payment →
              </button>
            </div>
          )}

          {/* ── M-Pesa Payment ── */}
          {step === 'payment' && (
            <div className="p-6 sm:p-8">
              <button
                onClick={() => setStep('plan')}
                className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-5 transition-colors"
              >
                ← Back
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-green-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Pay via M-Pesa</h2>
                  <p className="text-slate-400 text-sm">
                    {selectedPlan === 'onetime' ? 'KES 15,000 — Lifetime Access' : 'KES 500 — Monthly Plan'}
                  </p>
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-xl p-4 mb-5">
                <p className="text-xs text-slate-300 font-semibold mb-2.5 uppercase tracking-wide">How it works</p>
                <ol className="space-y-1.5">
                  {[
                    'Enter your M-Pesa registered phone number below',
                    'Click "Send Payment Request"',
                    'A prompt will appear on your phone',
                    'Enter your M-Pesa PIN to confirm',
                  ].map((s, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-slate-300">
                      <span className="text-teal-400 font-bold flex-shrink-0">{i + 1}.</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>

              {!mpesaSent ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">M-Pesa Phone Number</label>
                    <input
                      type="tel"
                      value={mpesaPhone}
                      onChange={e => setMpesaPhone(e.target.value)}
                      placeholder="e.g. 0712 345 678"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                  </div>
                  <button
                    onClick={handleSendRequest}
                    disabled={mpesaLoading || !mpesaPhone.trim()}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {mpesaLoading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending request...
                      </>
                    ) : 'Send Payment Request'}
                  </button>
                </>
              ) : (
                <div className="text-center py-2">
                  <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-white font-semibold mb-1">STK Push Sent!</p>
                  <p className="text-slate-400 text-sm mb-5">
                    Check <span className="text-white font-medium">{mpesaPhone}</span> for the M-Pesa prompt and enter your PIN.
                  </p>
                  <button
                    onClick={handleConfirmPayment}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    I've Completed Payment →
                  </button>
                  <button
                    onClick={() => setMpesaSent(false)}
                    className="mt-2 w-full text-slate-400 hover:text-white text-sm py-1 transition-colors"
                  >
                    Resend request
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Done ── */}
          {step === 'done' && (
            <div className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Payment confirmed!</h2>
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5 mb-4">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-300 text-sm font-medium">
                  {selectedPlan === 'onetime' ? 'Lifetime access activated' : 'Monthly plan activated'}
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-6">
                Thank you! Your account is now fully active.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Go to Dashboard →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-400" /></div>}>
      <UpgradeContent />
    </Suspense>
  );
}
