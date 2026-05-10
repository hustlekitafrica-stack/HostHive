'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const COLOR_PRESETS = [
  { primary: '#1e293b', secondary: '#16a34a', label: 'Default' },
  { primary: '#1e293b', secondary: '#f97316', label: 'Sunset' },
  { primary: '#1e293b', secondary: '#7c3aed', label: 'Purple' },
  { primary: '#991b1b', secondary: '#dc2626', label: 'Ruby' },
  { primary: '#1e3a5f', secondary: '#0ea5e9', label: 'Ocean' },
];

const STEPS = ['Welcome', 'Brand Setup', 'All Done'];

export default function OnboardingPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1e293b');
  const [secondaryColor, setSecondaryColor] = useState('#16a34a');
  const [logoPreview, setLogoPreview] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const totalSteps = STEPS.length;
  const screenName = STEPS[stepIndex];

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFinish = () => {
    const trialStart = new Date().toISOString();
    localStorage.setItem('brand_primary', primaryColor);
    localStorage.setItem('brand_secondary', secondaryColor);
    if (logoPreview) localStorage.setItem('brand_logo', logoPreview);
    localStorage.setItem('trial_start', trialStart);
    localStorage.setItem('subscription_status', 'trial');
    if (whatsappPhone.trim()) localStorage.setItem('user_phone', whatsappPhone.trim());
    window.dispatchEvent(new Event('brandUpdated'));

    fetch('/api/subscription', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trial_start: trialStart,
        subscription_status: 'trial',
        whatsapp_phone: whatsappPhone.trim() || null,
      }),
    }).catch(() => {});

    router.push('/dashboard');
  };

  const next = () => setStepIndex(i => Math.min(i + 1, totalSteps - 1));
  const back = () => setStepIndex(i => Math.max(i - 1, 0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">HH</div>
            <span className="text-white font-bold text-xl">Host Hive</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i <= stepIndex ? 'bg-teal-400 w-8' : 'bg-slate-600 w-4'}`}
              />
            ))}
          </div>
          <p className="text-slate-400 text-xs mt-2">{screenName} · Step {stepIndex + 1} of {totalSteps}</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">

          {/* ── Welcome ── */}
          {screenName === 'Welcome' && (
            <div className="p-6 sm:p-8">
              <div className="w-14 h-14 bg-teal-500/20 rounded-full flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Welcome to Host Hive</h2>
              <p className="text-slate-400 text-sm mb-5">Your 14-day free trial starts now. No payment needed to get started.</p>

              <div className="bg-slate-700/40 rounded-xl p-4 mb-6 space-y-2">
                {['Manage unlimited properties', 'Full booking calendar', 'Expense tracking & reports', 'Guest CRM'].map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-slate-300">
                    <svg className="w-4 h-4 text-teal-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </div>
                ))}
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  WhatsApp Number <span className="text-slate-500 font-normal">(optional — for trial reminders)</span>
                </label>
                <input
                  type="tel"
                  value={whatsappPhone}
                  onChange={e => setWhatsappPhone(e.target.value)}
                  placeholder="e.g. 0712 345 678"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
                <p className="text-xs text-slate-500 mt-1.5">We'll send you a reminder before your trial expires.</p>
              </div>

              <button
                onClick={next}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Start Free Trial →
              </button>
            </div>
          )}

          {/* ── Brand Setup ── */}
          {screenName === 'Brand Setup' && (
            <div className="p-6 sm:p-8">
              <button onClick={back} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-5 transition-colors">
                ← Back
              </button>
              <h2 className="text-2xl font-bold text-white mb-1">Set up your brand</h2>
              <p className="text-slate-400 text-sm mb-6">
                Personalise the app with your logo and colors. You can always update these in <span className="text-teal-400">Settings → Brand</span>.
              </p>

              {/* Logo Upload */}
              <div className="mb-6">
                <p className="text-sm font-medium text-slate-300 mb-2">Business Logo</p>
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-600 hover:border-teal-500 rounded-xl p-5 flex items-center gap-4 cursor-pointer transition-colors group"
                >
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,.webp"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-14 h-14 object-contain rounded-lg bg-white/5 flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 bg-slate-700 group-hover:bg-slate-600 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-300 font-medium">
                      {logoPreview ? 'Click to change logo' : 'Upload your logo'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">PNG, JPG, SVG or WEBP · max 2MB</p>
                  </div>
                </div>
              </div>

              {/* Color Pickers */}
              <div className="mb-6">
                <p className="text-sm font-medium text-slate-300 mb-3">Brand Colors</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-slate-700/50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-2">Primary Color</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span className="text-slate-300 text-xs font-mono">{primaryColor}</span>
                    </div>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-2">Accent Color</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={e => setSecondaryColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span className="text-slate-300 text-xs font-mono">{secondaryColor}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => { setPrimaryColor(p.primary); setSecondaryColor(p.secondary); }}
                      title={p.label}
                      className="w-7 h-7 rounded-full border-2 border-transparent hover:border-white transition-colors flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${p.primary} 50%, ${p.secondary} 50%)` }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={next}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Continue →
              </button>
              <button
                onClick={next}
                className="mt-2 w-full text-slate-400 hover:text-white text-sm py-1 transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}

          {/* ── All Done ── */}
          {screenName === 'All Done' && (
            <div className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
              <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-1.5 mb-4">
                <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
                <span className="text-teal-300 text-sm font-medium">14-day free trial active</span>
              </div>
              <p className="text-slate-400 text-sm mb-6">Your account is ready. Let's start managing your properties.</p>
              <div className="space-y-2.5 text-left bg-slate-700/40 rounded-xl p-4 mb-6">
                {[
                  'Add your first property',
                  'Set up your booking calendar',
                  'Track expenses & income',
                  'Generate financial reports',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-teal-400 text-xs font-bold">{i + 1}</span>
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              <button
                onClick={handleFinish}
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
