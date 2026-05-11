'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

type Status   = 'open' | 'in_progress' | 'resolved' | 'closed';
type Priority = 'low' | 'normal' | 'high' | 'urgent';
type Tab      = 'submit' | 'my_tickets' | 'admin';

interface Ticket {
  id: string;
  user_id: string;
  user_email: string;
  subject: string;
  category: string;
  description: string;
  status: Status;
  priority: Priority;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_META: Record<Status, { label: string; bg: string; text: string }> = {
  open:        { label: 'Open',        bg: 'bg-blue-50',   text: 'text-blue-700'  },
  in_progress: { label: 'In Progress', bg: 'bg-yellow-50', text: 'text-yellow-700'},
  resolved:    { label: 'Resolved',    bg: 'bg-green-50',  text: 'text-green-700' },
  closed:      { label: 'Closed',      bg: 'bg-gray-100',  text: 'text-gray-500'  },
};

const PRIORITY_META: Record<Priority, { label: string; dot: string }> = {
  low:    { label: 'Low',    dot: 'bg-gray-400'   },
  normal: { label: 'Normal', dot: 'bg-blue-500'   },
  high:   { label: 'High',   dot: 'bg-orange-500' },
  urgent: { label: 'Urgent', dot: 'bg-red-500'    },
};

const CATEGORIES = ['general', 'bug', 'billing', 'feature_request', 'account', 'other'];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-KE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function HelpCenterPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab]   = useState<Tab>('submit');
  const [tickets, setTickets]       = useState<Ticket[]>([]);
  const [isAdmin, setIsAdmin]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Submit form state
  const [subject,     setSubject]     = useState('');
  const [category,    setCategory]    = useState('general');
  const [description, setDescription] = useState('');
  const [priority,    setPriority]    = useState<Priority>('normal');

  // Admin expand state
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [adminNotes,  setAdminNotes]  = useState<Record<string, string>>({});
  const [saving,      setSaving]      = useState<string | null>(null);

  useEffect(() => {
    const h = (e: CustomEvent) => setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebarToggle', h as EventListener);
    return () => window.removeEventListener('sidebarToggle', h as EventListener);
  }, []);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/support');
      const data = await res.json();
      if (!data.error) {
        setTickets(data.tickets ?? []);
        setIsAdmin(data.isAdmin ?? false);
        const notes: Record<string, string> = {};
        (data.tickets ?? []).forEach((t: Ticket) => { notes[t.id] = t.admin_notes ?? ''; });
        setAdminNotes(notes);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error('Subject and description are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, category, description, priority }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to submit'); return; }
      toast.success("Ticket submitted! We'll respond within 24 hours.");
      setSubject(''); setDescription(''); setCategory('general'); setPriority('normal');
      await loadTickets();
      setActiveTab('my_tickets');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminUpdate = async (id: string, status: Status) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/support/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_notes: adminNotes[id] ?? '' }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to update'); return; }
      toast.success('Ticket updated');
      setTickets(prev => prev.map(t => t.id === id ? data.ticket : t));
    } finally {
      setSaving(null);
    }
  };

  const myTickets    = isAdmin ? [] : tickets;
  const adminTickets = isAdmin ? tickets : [];

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'submit',     label: 'Submit a Ticket' },
    { id: 'my_tickets', label: 'My Tickets', count: myTickets.filter(t => t.status !== 'closed').length },
    ...(isAdmin ? [{ id: 'admin' as Tab, label: 'Admin — All Tickets', count: adminTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="hidden sm:block sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className={`flex items-center gap-3 px-4 lg:px-8 h-[80px] transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[100px]' : 'lg:pl-[300px]'}`}>
          <button className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-700"
            onClick={() => window.dispatchEvent(new CustomEvent('openMobileMenu'))}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <h1 className="text-lg font-bold text-gray-900">Help Center</h1>
          </div>
        </div>
      </div>

      <div className={`px-2 py-4 sm:p-6 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[100px]' : 'lg:pl-[280px]'} max-w-5xl`}>

        {/* Hero banner */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 mb-6 text-white">
          <h2 className="text-xl font-bold mb-1">How can we help?</h2>
          <p className="text-slate-300 text-sm">Submit a support ticket and our team will review and respond within <strong className="text-white">24 hours</strong>.</p>
        </div>

        {/* Tab bar */}
        <div className="bg-gray-100 rounded-lg p-1 flex gap-0.5 mb-6 w-fit">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${activeTab === tab.id ? 'bg-white font-semibold text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── SUBMIT TAB ── */}
        {activeTab === 'submit' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-base font-bold text-gray-900 mb-1">New Support Ticket</h3>
                <p className="text-sm text-gray-500 mb-5">Describe your issue in detail so we can help you quickly.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject <span className="text-red-500">*</span></label>
                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select value={category} onChange={e => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 capitalize">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select value={priority} onChange={e => setPriority(e.target.value as Priority)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
                        {(Object.entries(PRIORITY_META) as [Priority, { label: string; dot: string }][]).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)}
                      rows={6} placeholder="Please provide as much detail as possible — steps to reproduce, screenshots you can describe, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none" />
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={submitting}
                      className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2">
                      {submitting ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting…</>
                      ) : (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Submit Ticket</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* FAQ sidebar */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <p className="text-sm font-semibold text-blue-800 mb-1">⏱ Response time</p>
                <p className="text-sm text-blue-700">All tickets are reviewed and addressed within <strong>24 hours</strong> during business days.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── MY TICKETS TAB ── */}
        {activeTab === 'my_tickets' && (
          <div>
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-7 h-7 border-4 border-slate-800 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : myTickets.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <p className="text-gray-500 font-medium">No tickets yet</p>
                <p className="text-sm text-gray-400 mt-1">Submit a ticket if you need help with anything.</p>
                <button onClick={() => setActiveTab('submit')}
                  className="mt-4 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors">
                  Submit a Ticket
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myTickets.map(ticket => {
                  const sm = STATUS_META[ticket.status];
                  const pm = PRIORITY_META[ticket.priority];
                  return (
                    <div key={ticket.id} className="bg-white border border-gray-200 rounded-xl p-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sm.bg} ${sm.text}`}>{sm.label}</span>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <span className={`w-2 h-2 rounded-full ${pm.dot}`} />{pm.label}
                            </span>
                            <span className="text-xs text-gray-400 capitalize">{ticket.category.replace('_', ' ')}</span>
                          </div>
                          <h4 className="font-semibold text-gray-900 truncate">{ticket.subject}</h4>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{ticket.description}</p>
                        </div>
                        <p className="text-xs text-gray-400 whitespace-nowrap">{fmtDate(ticket.created_at)}</p>
                      </div>
                      {ticket.admin_notes && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-xs font-semibold text-green-700 mb-0.5">Admin Response</p>
                          <p className="text-sm text-green-800">{ticket.admin_notes}</p>
                          <p className="text-xs text-green-600 mt-1">Updated {fmtDate(ticket.updated_at)}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ADMIN TAB ── */}
        {activeTab === 'admin' && isAdmin && (
          <div>
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {(['open', 'in_progress', 'resolved', 'closed'] as Status[]).map(s => {
                const meta = STATUS_META[s];
                const count = adminTickets.filter(t => t.status === s).length;
                return (
                  <div key={s} className={`rounded-xl p-4 border ${meta.bg} border-current/10`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${meta.text}`}>{meta.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${meta.text}`}>{count}</p>
                  </div>
                );
              })}
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-7 h-7 border-4 border-slate-800 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : adminTickets.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                <p className="text-gray-400 font-medium">No tickets submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {adminTickets.map(ticket => {
                  const sm   = STATUS_META[ticket.status];
                  const pm   = PRIORITY_META[ticket.priority];
                  const open = expandedId === ticket.id;
                  return (
                    <div key={ticket.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      {/* Row header */}
                      <button className="w-full text-left px-5 py-4 flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedId(open ? null : ticket.id)}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sm.bg} ${sm.text}`}>{sm.label}</span>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <span className={`w-2 h-2 rounded-full ${pm.dot}`} />{pm.label}
                            </span>
                            <span className="text-xs text-gray-400">{ticket.user_email}</span>
                          </div>
                          <p className="font-semibold text-gray-900 truncate">{ticket.subject}</p>
                          <p className="text-xs text-gray-400 mt-0.5 capitalize">{ticket.category.replace('_', ' ')} · {fmtDate(ticket.created_at)}</p>
                        </div>
                        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-1 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>

                      {/* Expanded panel */}
                      {open && (
                        <div className="px-5 pb-5 border-t border-gray-100 space-y-4">
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">User Description</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{ticket.description}</p>
                          </div>

                          {/* Status update */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Update Status</label>
                              <select defaultValue={ticket.status}
                                onChange={e => handleAdminUpdate(ticket.id, e.target.value as Status)}
                                disabled={saving === ticket.id}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
                                {(Object.entries(STATUS_META) as [Status, { label: string }][]).map(([k, v]) => (
                                  <option key={k} value={k}>{v.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Admin notes */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Admin Notes (visible to user)</label>
                            <textarea
                              value={adminNotes[ticket.id] ?? ''}
                              onChange={e => setAdminNotes(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                              rows={3}
                              placeholder="Explain what was done, or provide guidance to the user…"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
                            />
                            <button
                              onClick={() => handleAdminUpdate(ticket.id, ticket.status)}
                              disabled={saving === ticket.id}
                              className="mt-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                              {saving === ticket.id ? (
                                <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
                              ) : 'Save Notes'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
