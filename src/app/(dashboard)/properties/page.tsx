'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { AirbnbPropertyWizard, WizardFormData } from '@/components/properties/AirbnbPropertyWizard';
import { createClient } from '@/lib/supabase/client';

type PropStatus = 'active' | 'inactive' | 'maintenance' | 'draft';

interface Property {
  id: string;
  name: string;
  type: string;
  category: string;
  bedrooms: string;
  bathrooms: number;
  maxGuests: number;
  location: string;
  pricePerNight: number;
  cleaningFee: number;
  deposit: number;
  minStay: string;
  description: string;
  amenities: string[];
  status: PropStatus;
  setupStep?: number;
}

function dbRowToProperty(row: any): Property {
  const beds = row.bedrooms ?? 1;
  const bedsLabel = beds === 0 ? 'Studio' : `${beds}BR`;
  return {
    id: row.id,
    name: row.name || row.title || 'Untitled',
    type: bedsLabel,
    category: row.type ? row.type.charAt(0).toUpperCase() + row.type.slice(1) : 'Apartment',
    bedrooms: bedsLabel,
    bathrooms: row.bathrooms ?? 1,
    maxGuests: row.max_guests ?? 2,
    location: [row.location, row.county].filter(Boolean).join(', '),
    pricePerNight: parseFloat(row.nightly_rate) || 0,
    cleaningFee: parseFloat(row.cleaning_fee) || 0,
    deposit: parseFloat(row.deposit) || 0,
    minStay: row.min_stay || '1 night',
    description: row.description || '',
    amenities: Array.isArray(row.amenities) ? row.amenities : (row.amenities ? [row.amenities] : []),
    status: (['active', 'inactive', 'maintenance', 'draft'].includes(row.status) ? row.status : 'active') as PropStatus,
    setupStep: row.setup_step ?? row.setupStep ?? 1,
  };
}

const STATUS_DOT: Record<PropStatus, string> = {
  active: 'bg-green-500',
  inactive: 'bg-gray-400',
  maintenance: 'bg-yellow-400',
  draft: 'bg-amber-400',
};

const STEP_LABELS = ['','Property Type','Location','Basics','Amenities','Photos','Title & Description','Pricing','Rules & Check-in','Review & Publish'];

const TYPES = ['All types', 'Studio', '1BR', '2BR', '3BR', 'Villa'];
const STATUSES = ['All statuses', 'active', 'inactive', 'maintenance'];

type ViewMode = 'grid' | 'list';

function propertyToWizardData(p: Property): Partial<WizardFormData> {
  return {
    propertyType: p.category.toLowerCase() === 'villa' ? 'villa' : p.category.toLowerCase() === 'studio' ? 'studio' : 'apartment',
    title: p.name,
    location: {
      building: '', unit: '', floor: '',
      neighbourhood: p.location.split(',')[0]?.trim() || '',
      city: p.location.split(',').slice(-2, -1)[0]?.trim() || 'Nairobi',
      county: p.location.split(',').pop()?.trim() || 'Nairobi',
      address: p.location, lat: null, lng: null,
    },
    basics: {
      bedrooms: parseInt(p.bedrooms) || 1,
      bathrooms: 1, maxGuests: 2,
      size: '', sizeUnit: 'sq m',
      beds: [{ type: 'Double Bed', count: parseInt(p.bedrooms) || 1 }],
    },
    pricing: {
      nightly: p.pricePerNight.toString(),
      weekend: '', monthly: '', cleaning: '', deposit: '', extraGuest: '',
      baseGuests: 2, minStay: '1 night', maxStay: 'No maximum', seasonal: [],
    },
  };
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [continuingProperty, setContinuingProperty] = useState<Property | null>(null);
  const [view, setView] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All types');
  const [filterStatus, setFilterStatus] = useState('All statuses');
  const [dismissedDraftIds, setDismissedDraftIds] = useState<Set<string>>(new Set());
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const loadProperties = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setProperties(data.map(dbRowToProperty));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadProperties(); }, [loadProperties]);

  useEffect(() => {
    const h = (e: CustomEvent) => setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebarToggle', h as EventListener);
    return () => window.removeEventListener('sidebarToggle', h as EventListener);
  }, []);

  useEffect(() => {
    const email = localStorage.getItem('user_email') || 'demo@hostbooks.ke';
    setUserEmail(email);
  }, []);

  const filtered = useMemo(() => properties.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.location.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== 'All types' && p.type !== filterType) return false;
    if (filterStatus !== 'All statuses' && p.status !== filterStatus) return false;
    return true;
  }), [properties, search, filterType, filterStatus]);

  const activeCount = properties.filter(p => p.status === 'active').length;
  const draftProperties = properties.filter(p => p.status === 'draft' && !dismissedDraftIds.has(p.id));

  const STATUS_LABEL: Record<PropStatus, string> = { active: 'Active', inactive: 'Inactive', maintenance: 'Maintenance', draft: 'Incomplete' };
  const STATUS_BG: Record<PropStatus, string> = { active: 'bg-green-100 text-green-700', inactive: 'bg-gray-100 text-gray-600', maintenance: 'bg-yellow-100 text-yellow-700', draft: 'bg-amber-100 text-amber-700' };

  return (
    <>
      {/* ── Property Details Slide-over ── */}
      {viewingProperty && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={() => setViewingProperty(null)} />
          {/* Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[viewingProperty.status]}`} />
                <h2 className="text-lg font-bold text-gray-900 leading-tight">{viewingProperty.name}</h2>
              </div>
              <button onClick={() => setViewingProperty(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-6">
              {/* Status + Type */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BG[viewingProperty.status]}`}>{STATUS_LABEL[viewingProperty.status]}</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{viewingProperty.category}</span>
              </div>

              {/* Quick stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Bedrooms', value: viewingProperty.bedrooms, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                  { label: 'Bathrooms', value: viewingProperty.bathrooms, icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z' },
                  { label: 'Max Guests', value: viewingProperty.maxGuests, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                  { label: 'Min Stay', value: viewingProperty.minStay, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={icon} /></svg>
                      <span className="text-xs text-gray-500">{label}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>

              {/* Location */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Location</p>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>{viewingProperty.location || 'Location not set'}</span>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pricing</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Nightly rate</span>
                    <span className="text-sm font-bold text-gray-900">Ksh {viewingProperty.pricePerNight.toLocaleString()}</span>
                  </div>
                  {viewingProperty.cleaningFee > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cleaning fee</span>
                      <span className="text-sm font-semibold text-gray-700">Ksh {viewingProperty.cleaningFee.toLocaleString()}</span>
                    </div>
                  )}
                  {viewingProperty.deposit > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Security deposit</span>
                      <span className="text-sm font-semibold text-gray-700">Ksh {viewingProperty.deposit.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities */}
              {viewingProperty.amenities.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingProperty.amenities.map((a: string) => (
                      <span key={a} className="text-xs px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-100 font-medium">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {viewingProperty.description && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{viewingProperty.description}</p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
              {viewingProperty.status === 'draft' ? (
                <button
                  onClick={() => { setContinuingProperty(viewingProperty); setViewingProperty(null); }}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors">
                  Continue Setup
                </button>
              ) : (
                <button
                  onClick={() => { setEditingProperty(viewingProperty); setViewingProperty(null); }}
                  className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors">
                  Edit Property
                </button>
              )}
              <button
                onClick={() => setViewingProperty(null)}
                className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showWizard && <AirbnbPropertyWizard onClose={() => { setShowWizard(false); loadProperties(); }} />}
      {editingProperty && (
        <AirbnbPropertyWizard
          mode="edit"
          initialData={propertyToWizardData(editingProperty)}
          propertyId={editingProperty.id}
          onClose={() => { setEditingProperty(null); loadProperties(); }}
        />
      )}
      {continuingProperty && (
        <AirbnbPropertyWizard
          mode="continue"
          initialData={propertyToWizardData(continuingProperty)}
          propertyId={continuingProperty.id}
          initialStep={continuingProperty.setupStep ?? 1}
          onClose={() => { setContinuingProperty(null); loadProperties(); }}
        />
      )}

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
            </div>
          </div>
        </div>

        <div className={`px-4 py-8 sm:px-6 space-y-5 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[280px] lg:pr-[200px]' : 'lg:pl-[456px] lg:pr-[200px]'}`}>

          {/* ── Header ── */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
              <p className="text-sm text-gray-500 mt-0.5">{activeCount} active units</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Import CSV
              </button>
              <button
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Property
              </button>
            </div>
          </div>

          {/* ── Incomplete setup banners ── */}
          {draftProperties.length > 0 && (
            <div className="space-y-2">
              {draftProperties.map(draft => (
                <div key={draft.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l4-4h10l4 4v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M9 21V12h6v9"/></svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-700">{draft.name} — setup incomplete</p>
                      <p className="text-xs text-amber-600 mt-0.5">Step {draft.setupStep ?? 1} of 9 completed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setContinuingProperty(draft)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-400 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      Continue
                    </button>
                    <button
                      onClick={() => setDismissedDraftIds(prev => new Set([...prev, draft.id]))}
                      className="w-8 h-8 flex items-center justify-center border border-red-200 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Filter bar ── */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search units..."
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent w-44"
              />
            </div>

            {/* Type filter */}
            <div className="relative">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
              >
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
            </div>

            {/* Status filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
              >
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* View toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white">
              <button
                onClick={() => setView('grid')}
                className={`p-2 transition-colors ${view === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 transition-colors ${view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
            </div>
          </div>

          {/* ── Loading state ── */}
          {loading && (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              <span className="text-sm">Loading properties…</span>
            </div>
          )}

          {/* ── Grid View ── */}
          {!loading && view === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(p => (
                <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  {/* Title row */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[p.status]}`} />
                    <span className="font-semibold text-gray-900 text-sm">{p.name}</span>
                    {p.status === 'draft' ? (
                      <span className="ml-auto text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Setup Incomplete</span>
                    ) : (
                      <span className="ml-auto text-xs text-green-600 font-medium">{p.status}</span>
                    )}
                  </div>

                  {/* Details row */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3 ml-4">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 010 4H2"/><path d="M2 16h14a2 2 0 010 4H2"/></svg>
                    <span className="font-medium text-gray-700">{p.bedrooms}</span>
                    <span>{p.category}</span>
                    <span className="truncate max-w-[120px]">{p.location}</span>
                  </div>

                  {/* Price */}
                  {p.status === 'draft' ? (
                    <p className="text-sm text-amber-600 ml-4 mb-2 font-medium">
                      Left off at: <strong>{STEP_LABELS[p.setupStep ?? 1]}</strong>
                    </p>
                  ) : (
                    <p className="text-base font-bold text-gray-900 ml-4 mb-4">
                      Ksh {p.pricePerNight.toLocaleString()}<span className="text-xs font-normal text-gray-500">/night</span>
                    </p>
                  )}

                  {/* Continue banner for draft */}
                  {p.status === 'draft' && (
                    <button
                      onClick={() => setContinuingProperty(p)}
                      className="w-full mb-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                      Continue Setup
                    </button>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                    <button onClick={() => setViewingProperty(p)} className="flex items-center gap-1.5 flex-1 justify-center py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      Details
                    </button>
                    <button onClick={() => setEditingProperty(p)} className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </button>
                    <button className="p-1.5 border border-red-100 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── List View ── */}
          {!loading && view === 'list' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Price/night</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[p.status]}`} />
                          <span className="font-semibold text-gray-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{p.bedrooms} · {p.category}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell truncate max-w-[180px]">{p.location}</td>
                      <td className="px-4 py-3">
                        {p.status === 'draft' ? (
                          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Incomplete</span>
                        ) : (
                          <span className={`text-xs font-medium ${p.status === 'active' ? 'text-green-600' : p.status === 'maintenance' ? 'text-yellow-600' : 'text-gray-500'}`}>
                            {p.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 hidden sm:table-cell">Ksh {p.pricePerNight.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setViewingProperty(p)} className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-50 font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            Details
                          </button>
                          {p.status === 'draft' ? (
                            <button onClick={() => setContinuingProperty(p)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors">
                              Continue
                            </button>
                          ) : (
                            <button onClick={() => setEditingProperty(p)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                            </button>
                          )}
                          <button className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <p className="font-medium text-gray-500">No properties match your filters</p>
              <button onClick={() => { setSearch(''); setFilterType('All types'); setFilterStatus('All statuses'); }}
                className="mt-2 text-sm text-gray-900 hover:underline">Clear filters</button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
