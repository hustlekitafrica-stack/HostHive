'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

type Tab = 'general' | 'brand' | 'categories' | 'account';

const COLOR_PRESETS = [
  { primary: '#1e293b', secondary: '#16a34a' },
  { primary: '#1e293b', secondary: '#f97316' },
  { primary: '#1e293b', secondary: '#7c3aed' },
  { primary: '#991b1b', secondary: '#dc2626' },
  { primary: '#1e3a5f', secondary: '#0ea5e9' },
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function SettingsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState('demo@hostbooks.ke');
  const [activeTab, setActiveTab] = useState<Tab>('general');

  // General tab state
  const [businessName, setBusinessName] = useState('');
  const [currencyCode, setCurrencyCode] = useState('KSH');
  const [fyMonth, setFyMonth] = useState('January');
  const [fyYear, setFyYear] = useState(new Date().getFullYear());

  // Brand tab state
  const [primaryColor, setPrimaryColor] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('brand_primary') || '#1e293b' : '#1e293b'
  );
  const [secondaryColor, setSecondaryColor] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('brand_secondary') || '#16a34a' : '#16a34a'
  );
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoName, setLogoName] = useState('');
  const [logoPreview, setLogoPreview] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('brand_logo') || '';
    return '';
  });

  // Categories tab state
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [catLoading, setCatLoading] = useState(false);

  useEffect(() => {
    fetch('/api/expense-categories')
      .then(r => r.json())
      .then(d => { if (d.categories) setCategories(d.categories); })
      .catch(() => {});
  }, []);  

  useEffect(() => {
    const h = (e: CustomEvent) => setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebarToggle', h as EventListener);
    return () => window.removeEventListener('sidebarToggle', h as EventListener);
  }, []);

  useEffect(() => {
    const email = localStorage.getItem('user_email') || 'demo@hostbooks.ke';
    setUserEmail(email);
  }, []);

  const handleSaveGeneral = () => toast.success('Settings saved!');
  const handleSaveColors = () => {
    localStorage.setItem('brand_primary', primaryColor);
    localStorage.setItem('brand_secondary', secondaryColor);
    window.dispatchEvent(new Event('brandUpdated'));
    toast.success('Brand colors saved!');
  };

  const handleAddCategory = async () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    setCatLoading(true);
    try {
      const res = await fetch('/api/expense-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to add category'); return; }
      setCategories(prev => [...prev, data.category]);
      setNewCategory('');
      toast.success('Category added');
    } catch {
      toast.error('Network error');
    } finally {
      setCatLoading(false);
    }
  };

  const handleRemoveCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/expense-categories/${id}`, { method: 'DELETE' });
      if (!res.ok) { toast.error('Failed to remove category'); return; }
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch {
      toast.error('Network error');
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'brand', label: 'Brand' },
    { id: 'categories', label: 'Expense Categories' },
    { id: 'account', label: 'Account' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className={`flex items-center justify-between px-4 lg:px-8 h-[80px] transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[100px]' : 'lg:pl-[300px]'}`}>
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-700"
              onClick={() => window.dispatchEvent(new CustomEvent('openMobileMenu'))}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-800">Host Hive</span>
          </div>
          <span className="text-xs text-blue-600">{userEmail}</span>
        </div>
      </div>

      {/* Page Content */}
      <div className={`p-6 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[280px] lg:pr-[200px]' : 'lg:pl-[456px] lg:pr-[200px]'}`}>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your business profile and preferences.</p>
        </div>

        {/* Tab Bar */}
        <div className="bg-gray-100 rounded-lg p-1 flex gap-0.5 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${activeTab === tab.id ? 'bg-white font-semibold text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── GENERAL TAB ── */}
        {activeTab === 'general' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-3xl">
            <h2 className="text-base font-bold text-gray-900 mb-1">Business Profile</h2>
            <p className="text-sm text-gray-500 mb-6">Basic information about your business.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency Code</label>
                <input
                  type="text"
                  value={currencyCode}
                  onChange={e => setCurrencyCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Financial Year Start Month</label>
                <select
                  value={fyMonth}
                  onChange={e => setFyMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Financial Start Year</label>
                <input
                  type="number"
                  value={fyYear}
                  onChange={e => setFyYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-gray-200">
              <button
                onClick={handleSaveGeneral}
                className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* ── BRAND TAB ── */}
        {activeTab === 'brand' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Brand Colors card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-base font-bold text-gray-900 mb-1">Brand Colors</h2>
                <p className="text-sm text-gray-500 mb-5">Personalize your dashboard with your business colors. Changes preview live and apply everywhere when you save.</p>
                <div className="grid grid-cols-2 gap-5 mb-5">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-0.5">Primary Color</p>
                    <p className="text-xs text-gray-400 mb-2">Used for sidebar, buttons, and headers.</p>
                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                      <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0" />
                      <span className="text-sm text-gray-700 font-mono">{primaryColor}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-0.5">Secondary Color</p>
                    <p className="text-xs text-gray-400 mb-2">Used for accents and highlights.</p>
                    <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                      <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0" />
                      <span className="text-sm text-gray-700 font-mono">{secondaryColor}</span>
                    </div>
                  </div>
                </div>
                {/* Presets */}
                <p className="text-sm font-medium text-gray-700 mb-2">Presets</p>
                <div className="flex items-center gap-2 mb-5">
                  {COLOR_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => { setPrimaryColor(p.primary); setSecondaryColor(p.secondary); }}
                      className="w-7 h-7 rounded-full overflow-hidden border-2 border-transparent hover:border-gray-400 transition-colors flex-shrink-0"
                      title={`${p.primary} / ${p.secondary}`}
                      style={{ background: `linear-gradient(135deg, ${p.primary} 50%, ${p.secondary} 50%)` }}
                    />
                  ))}
                  <button
                    onClick={() => { setPrimaryColor('#1e293b'); setSecondaryColor('#16a34a'); }}
                    className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
                    title="Reset to default"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                      <path d="M3 3v5h5"/>
                    </svg>
                  </button>
                </div>
                <button
                  onClick={handleSaveColors}
                  className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Save Colors
                </button>
              </div>

              {/* Business Logo card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-base font-bold text-gray-900 mb-1">Business Logo</h2>
                <p className="text-sm text-gray-500 mb-5">Appears in the sidebar and on exported PDF reports. PNG, JPG, SVG or WEBP — max 2MB.</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg,.webp"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setLogoName(file.name);
                        const reader = new FileReader();
                        reader.onload = () => {
                          const result = reader.result as string;
                          setLogoPreview(result);
                          localStorage.setItem('brand_logo', result);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Upload Logo
                    </button>
                    {logoName && <p className="text-xs text-gray-500 mt-1">{logoName}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 h-fit">
              <h2 className="text-base font-bold text-gray-900 mb-1">Live Preview</h2>
              <p className="text-sm text-gray-500 mb-5">How your brand colors look in the interface.</p>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 text-white text-sm font-bold" style={{ backgroundColor: primaryColor }}>
                  Host Hive
                </div>
                <div className="bg-gray-50 px-4 py-3 space-y-2">
                  {['Dashboard', 'My Properties', 'Expenses', 'Reports Center'].map(item => (
                    <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 bg-white border-t border-gray-200 flex gap-3">
                  <button className="px-4 py-1.5 text-white text-xs font-medium rounded-md" style={{ backgroundColor: primaryColor }}>
                    Primary Button
                  </button>
                  <button className="px-4 py-1.5 text-white text-xs font-medium rounded-md" style={{ backgroundColor: secondaryColor }}>
                    Secondary
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── EXPENSE CATEGORIES TAB ── */}
        {activeTab === 'categories' && (
          <div className="bg-white border-l-4 border-l-red-400 border border-gray-200 rounded-xl p-6 max-w-md">
            <h2 className="text-base font-bold text-gray-900 mb-1">Expense Categories</h2>
            <p className="text-sm text-gray-500 mb-5">
              Customise the expense categories used across reports and entries.<br />Max 30 categories.
            </p>
            <div className="flex gap-2 mb-5">
              <input
                type="text"
                placeholder="New category name"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
            {categories.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-3">
                No categories yet — add <span className="text-teal-600 font-medium">one</span> above.
              </p>
            ) : (
              <ul className="space-y-2">
                {categories.map(cat => (
                  <li key={cat.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-800">{cat.name}</span>
                    <button
                      onClick={() => handleRemoveCategory(cat.id)}
                      className="text-red-400 hover:text-red-600 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── ACCOUNT TAB ── */}
        {activeTab === 'account' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-3xl">
            <h2 className="text-base font-bold text-gray-900 mb-1">Account Status</h2>
            <p className="text-sm text-gray-500 mb-6">Your subscription and billing information.</p>
            <div className="space-y-0">
              <div className="flex items-center justify-between py-4 border-b border-gray-200">
                <span className="text-sm text-gray-700">Email</span>
                <span className="text-sm font-bold text-gray-900">{userEmail}</span>
              </div>
              <div className="flex items-center justify-between py-4">
                <span className="text-sm text-gray-700">Subscription Status</span>
                <span className="text-xs font-semibold text-teal-600 border border-teal-400 rounded-full px-3 py-1 tracking-wide">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
