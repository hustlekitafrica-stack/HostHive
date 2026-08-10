'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Settings, Loader2, Save, Printer, DollarSign, Receipt } from 'lucide-react';
import { POSNav } from '@/components/pos/POSNav';

interface POSSettings {
  kitchen_printer_ip: string;
  bar_printer_ip:     string;
  printer_port:       number;
  receipt_header:     string;
  receipt_footer:     string;
  tax_label:          string;
  tax_rate:           number;
  currency:           string;
}

const DEFAULT: POSSettings = {
  kitchen_printer_ip: '',
  bar_printer_ip:     '',
  printer_port:       9100,
  receipt_header:     'BAR & RESTAURANT',
  receipt_footer:     'Thank you, see you again!',
  tax_label:          'VAT',
  tax_rate:           0,
  currency:           'KSh',
};

const CURRENCIES = ['KSh', 'USD', 'EUR', 'GBP', 'UGX', 'TZS'];

export default function POSSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<POSSettings>(DEFAULT);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  // Auth guard
  useEffect(() => {
    if (!sessionStorage.getItem('pos_session')) { router.replace('/pos'); return; }
  }, [router]);

  useEffect(() => {
    fetch('/api/pos/settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings) setSettings({ ...DEFAULT, ...d.settings });
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res  = await fetch('/api/pos/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to save'); return; }
      setSettings({ ...DEFAULT, ...data.settings });
      toast.success('Settings saved');
    } catch { toast.error('Network error'); } finally { setSaving(false); }
  };

  const field = (
    label: string,
    key: keyof POSSettings,
    type = 'text',
    extra?: React.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      <input type={type} value={String(settings[key])}
        onChange={e => setSettings(s => ({ ...s, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
        {...extra} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <POSNav />

      <div className="p-6 max-w-2xl mx-auto w-full space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-500/20 rounded-xl"><Settings className="w-5 h-5 text-slate-400" /></div>
          <div>
            <h1 className="text-xl font-bold">POS Settings</h1>
            <p className="text-xs text-slate-400">Printer IPs, currency, tax, receipt layout</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {/* Currency & Tax */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-400" />
                <h2 className="font-semibold text-slate-200 text-sm">Currency &amp; Tax</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Currency</label>
                  <select value={settings.currency}
                    onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {field('Tax Label', 'tax_label', 'text', { placeholder: 'e.g. VAT' })}
              </div>
              {field('Tax Rate (%)', 'tax_rate', 'number', { min: '0', max: '100', step: '0.1', placeholder: '0' })}
              <p className="text-xs text-slate-500">Set to 0 to disable tax on receipts.</p>
            </div>

            {/* Receipt */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Receipt className="w-4 h-4 text-blue-400" />
                <h2 className="font-semibold text-slate-200 text-sm">Receipt Layout</h2>
              </div>
              {field('Receipt Header', 'receipt_header', 'text', { placeholder: 'e.g. Kogelo Bar & Restaurant' })}
              {field('Receipt Footer', 'receipt_footer', 'text', { placeholder: 'e.g. Thank you, see you again!' })}
            </div>

            {/* Printers */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Printer className="w-4 h-4 text-amber-400" />
                <h2 className="font-semibold text-slate-200 text-sm">Thermal Printers (ESC/POS over TCP)</h2>
              </div>
              {field('Kitchen Printer IP', 'kitchen_printer_ip', 'text', { placeholder: 'e.g. 192.168.1.100' })}
              {field('Bar Printer IP',     'bar_printer_ip',     'text', { placeholder: 'e.g. 192.168.1.101' })}
              {field('Printer Port',       'printer_port',       'number', { min: '1', max: '65535', placeholder: '9100' })}
              <p className="text-xs text-slate-500">Leave blank to disable printing to that station.</p>
            </div>

            {/* Save */}
            <button onClick={handleSave} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
