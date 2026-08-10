'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { ArrowLeft, Briefcase, Loader2, Download, X, Tablet, ExternalLink } from 'lucide-react';
import { NumpadInput } from '@/components/pos/NumpadInput';
import { getDefaultRoute } from '@/lib/pos/session';

/* --- Types ----------------------------------------------------------------- */
interface StaffMember {
  id: string;
  name: string;
  role: string;
  active: boolean;
}

type Screen = 'select' | 'pin' | 'shift';

/* --- Helpers --------------------------------------------------------------- */
const ROLE_LABELS: Record<string, string> = {
  manager:       'Manager',
  cashier:       'Cashier',
  waiter:        'Waiter',
  barman:        'Barman',
  stock_manager: 'Stock Manager',
};

const ROLE_COLORS: Record<string, string> = {
  manager:       'bg-purple-500/20 text-purple-300',
  cashier:       'bg-blue-500/20   text-blue-300',
  waiter:        'bg-green-500/20  text-green-300',
  barman:        'bg-amber-500/20  text-amber-300',
  stock_manager: 'bg-red-500/20    text-red-300',
};

/* --- Component ------------------------------------------------------------- */
export default function POSLoginPage() {
  const router = useRouter();

  /* staff list + device setup state */
  const [staff, setStaff]         = useState<StaffMember[]>([]);
  const [loading, setLoading]     = useState(true);
  const [deviceReady, setDeviceReady] = useState(true);   // false = needs setup
  const [settingUp, setSettingUp] = useState(false);

  /* screen state machine */
  const [screen, setScreen]               = useState<Screen>('select');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  /* PIN entry */
  const [pin, setPin]         = useState('');
  const [pinError, setPinError] = useState('');
  const [pinShake, setPinShake] = useState(false);
  const [verifying, setVerifying] = useState(false);

  /* PWA install prompt */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const installPromptRef = useRef<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      installPromptRef.current = e;
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPromptRef.current) return;
    installPromptRef.current.prompt();
    const { outcome } = await installPromptRef.current.userChoice;
    if (outcome === 'accepted') setShowInstallBanner(false);
    installPromptRef.current = null;
  };

  /* shift / float */
  const [shiftLoading, setShiftLoading]   = useState(false);
  const [tempShiftId, setTempShiftId]     = useState<string | null>(null);
  const [showFloat, setShowFloat]         = useState(false);
  const [openingFloat, setOpeningFloat]   = useState('');
  const [confirmingFloat, setConfirmingFloat] = useState(false);

  /* -- Load staff list (handles device-not-set-up 401) --------------------- */
  useEffect(() => {
    fetch('/api/pos/staff')
      .then(async (r) => {
        if (r.status === 401) {
          setDeviceReady(false);
          return;
        }
        const d = await r.json();
        setStaff((d.staff ?? []).filter((s: StaffMember) => s.active));
      })
      .catch(() => toast.error('Failed to load staff'))
      .finally(() => setLoading(false));
  }, []);

  /* -- One-click device setup (admin must be logged in) --------------------- */
  const handleSetupDevice = async () => {
    setSettingUp(true);
    try {
      const res = await fetch('/api/pos/setup-device', { method: 'POST' });
      if (res.ok) {
        toast.success('Device registered! Reloading…');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        const { error } = await res.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(error ?? 'Setup failed. Make sure you are logged into the dashboard first.');
      }
    } finally {
      setSettingUp(false);
    }
  };

  /* -- Auto-submit PIN when 4 digits are entered ---------------------------- */
  useEffect(() => {
    if (pin.length === 4 && !verifying) {
      handleVerifyPin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  /* -- Handlers ------------------------------------------------------------- */
  const handleSelectStaff = (member: StaffMember) => {
    setSelectedStaff(member);
    setPin('');
    setPinError('');
    setScreen('pin');
  };

  const handleVerifyPin = async () => {
    if (!selectedStaff) return;
    setVerifying(true);
    try {
      const res  = await fetch('/api/pos/staff/verify-pin', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ staff_id: selectedStaff.id, pin }),
      });
      const data = await res.json();

      if (data.ok) {
        setScreen('shift');
        checkOrOpenShift(selectedStaff.id, selectedStaff.name);
      } else {
        setPinShake(true);
        setPinError(data.error ?? 'Invalid PIN');
        setPin('');
        setTimeout(() => setPinShake(false), 600);
      }
    } catch {
      setPinError('Network error — try again');
      setPin('');
    } finally {
      setVerifying(false);
    }
  };

  /** Check for an existing open shift, or create a new one (float=0 initially). */
  const checkOrOpenShift = async (staffId: string, staffName: string) => {
    setShiftLoading(true);
    try {
      const res  = await fetch('/api/pos/shifts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ staff_id: staffId, staff_name: staffName }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to open shift');
        setScreen('pin');
        return;
      }

      if (data.resumed) {
        /* Existing open shift — go straight to terminal */
        saveSessionAndRedirect(staffId, staffName, selectedStaff!.role, data.shift.id);
        toast.success(`Welcome back, ${staffName}!`);
      } else {
        /* New shift — collect opening float before redirecting */
        setTempShiftId(data.shift.id);
        setShowFloat(true);
      }
    } catch {
      toast.error('Network error');
      setScreen('pin');
    } finally {
      setShiftLoading(false);
    }
  };

  /** Store session in sessionStorage and navigate by role. */
  const saveSessionAndRedirect = useCallback(
    (staffId: string, staffName: string, role: string, shiftId: string) => {
      sessionStorage.setItem(
        'pos_session',
        JSON.stringify({ staffId, staffName, role, shiftId }),
      );
      router.push(getDefaultRoute(role));
    },
    [router],
  );

  const handleConfirmFloat = async () => {
    if (!selectedStaff || !tempShiftId) return;
    setConfirmingFloat(true);
    try {
      /* The shift was already created in checkOrOpenShift; we just save the
         session with the float stored locally (no separate API update needed). */
      toast.success(`Shift opened! Welcome, ${selectedStaff.name} 🎉`);
      saveSessionAndRedirect(
        selectedStaff.id,
        selectedStaff.name,
        selectedStaff.role,
        tempShiftId,
      );
    } finally {
      setConfirmingFloat(false);
    }
  };

  /* -- Render --------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">

      {/* -- Header -- */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight">Kogelo Suites POS</h1>
        <Link
          href="/dashboard"
          className="text-slate-500 text-sm hover:text-slate-300 transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </header>

      {/* -- Body -- */}
      <div className="flex-1 flex items-center justify-center p-6">

        {/* ════ SELECT SCREEN ════ */}
        {screen === 'select' && (
          <div className="w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-center text-white mb-1">Who are you?</h2>
            <p className="text-slate-400 text-center mb-8 text-sm">Select your name to sign in</p>

            {loading ? (
              <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading staff…</span>
              </div>
            ) : !deviceReady ? (
              /* ── Device not configured ── */
              <div className="flex flex-col items-center gap-5 py-16 max-w-sm mx-auto text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <Tablet className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">This device is not set up</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    The POS needs to be linked to your hotel account before staff can sign in.
                    Log in to the dashboard first, then click the button below.
                  </p>
                </div>
                <button
                  onClick={handleSetupDevice}
                  disabled={settingUp}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors"
                >
                  {settingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tablet className="w-4 h-4" />}
                  {settingUp ? 'Setting up…' : 'Set Up This Device'}
                </button>
                <a
                  href="https://app.kogelosuites.com/auth/login"
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs transition-colors"
                  target="_blank" rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open dashboard login
                </a>
              </div>
            ) : staff.length === 0 ? (
              <p className="text-center text-slate-500 py-16">
                No active staff found.{' '}
                <Link href="/pos-staff" className="text-blue-400 hover:underline">
                  Add staff from the POS admin panel.
                </Link>
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {staff.map(member => (
                  <button
                    key={member.id}
                    onClick={() => handleSelectStaff(member)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded-xl p-6 text-center transition-all active:scale-95 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-600/30 transition-colors">
                      <span className="text-blue-400 font-bold text-xl">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-white font-semibold text-base mb-2 truncate">{member.name}</p>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        ROLE_COLORS[member.role] ?? 'bg-slate-600 text-slate-300'
                      }`}
                    >
                      {ROLE_LABELS[member.role] ?? member.role}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════ PIN SCREEN ════ */}
        {screen === 'pin' && selectedStaff && (
          <div className="w-full max-w-xs flex flex-col items-center">
            <button
              onClick={() => { setScreen('select'); setPin(''); setPinError(''); }}
              className="self-start mb-6 flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center mb-4">
              <span className="text-blue-400 font-bold text-2xl">
                {selectedStaff.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{selectedStaff.name}</h2>
            <p className="text-slate-400 text-sm mb-8">Enter your 4-digit PIN</p>

            <div
              className={pinShake ? 'animate-shake' : ''}
              onAnimationEnd={() => setPinShake(false)}
            >
              <NumpadInput
                value={pin}
                onChange={setPin}
                maxLength={4}
                masked
                label={verifying ? 'Verifying…' : undefined}
              />
            </div>

            {pinError && (
              <p className="mt-5 text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                {pinError}
              </p>
            )}
          </div>
        )}

        {/* ════ SHIFT SCREEN (loading only) ════ */}
        {screen === 'shift' && !showFloat && (
          <div className="flex flex-col items-center gap-4 text-slate-400">
            {shiftLoading && (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                <p>Opening shift…</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* ════ OPENING FLOAT MODAL ════ */}
      {showFloat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-bold text-white">Opening Float</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              Enter the cash float amount for this shift.
            </p>

            <div className="relative mb-6">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium select-none">
                KSh
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={openingFloat}
                onChange={e => setOpeningFloat(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-14 pr-4 py-3 text-white text-right text-xl font-semibold focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>

            <div className="flex gap-2">
              {[500, 1000, 2000, 5000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setOpeningFloat(String(amt))}
                  className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-xs font-medium transition-all"
                >
                  {amt.toLocaleString()}
                </button>
              ))}
            </div>

            <button
              onClick={handleConfirmFloat}
              disabled={confirmingFloat}
              className="mt-5 w-full py-3.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold text-base transition-all"
            >
              {confirmingFloat ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Opening Shift…
                </span>
              ) : (
                'Open Shift & Start →'
              )}
            </button>
          </div>
        </div>
      )}

      {/* -- PWA Install Banner -- */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-800 border border-slate-600 rounded-2xl px-4 py-3 shadow-2xl shadow-black/50 max-w-sm w-full mx-4">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Download className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">Install Kogelo POS</p>
            <p className="text-slate-400 text-xs">Add to desktop for quick access</p>
          </div>
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
          >
            Install
          </button>
          <button
            onClick={() => setShowInstallBanner(false)}
            className="p-1 text-slate-500 hover:text-slate-300 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* -- Shake animation -- */}
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15%,45%,75% { transform: translateX(-8px); }
          30%,60%,90% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.55s ease-in-out; }
      `}</style>
    </div>
  );
}
