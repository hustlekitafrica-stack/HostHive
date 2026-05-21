'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, BedDouble, Calendar, Phone, User, MessageCircle, RefreshCw, Send, CreditCard, AlertCircle, Menu } from 'lucide-react';

type BookingRequest = {
  id: string; created_at: string; guest_name: string; guest_phone: string; guest_email: string;
  check_in: string; check_out: string; nights: number; num_adults: number; num_children: number;
  room_details: { property_id?: string; property_name: string; qty: number; nightly_rate: number; subtotal: number }[];
  total_amount: number; special_requests: string; status: string; decline_reason?: string;
  payment_status?: string;
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; Icon: typeof Clock }> = {
  pending:   { label: 'Pending',   bg: 'bg-amber-50',  text: 'text-amber-700',  Icon: Clock },
  confirmed: { label: 'Confirmed', bg: 'bg-green-50',  text: 'text-green-700',  Icon: CheckCircle2 },
  declined:  { label: 'Declined',  bg: 'bg-red-50',    text: 'text-red-700',    Icon: XCircle },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-100',  text: 'text-gray-500',   Icon: XCircle },
};

export default function RequestsPage() {
  const [requests,       setRequests]       = useState<BookingRequest[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [filter,         setFilter]         = useState('all');
  const [updating,       setUpdating]       = useState<string | null>(null);
  const [sendingWa,      setSendingWa]      = useState<string | null>(null);
  const [sendingPayment, setSendingPayment] = useState<string | null>(null);
  const [waLinks,        setWaLinks]        = useState<Record<string, string>>({});
  const [toast,          setToast]          = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const h = (e: CustomEvent) => setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebarToggle', h as EventListener);
    return () => window.removeEventListener('sidebarToggle', h as EventListener);
  }, []);

  // Decline modal
  const [declineTarget,  setDeclineTarget]  = useState<string | null>(null);
  const [declineReason,  setDeclineReason]  = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const load = () => {
    setLoading(true);
    fetch('/api/stay/requests')
      .then(r => r.json())
      .then(d => setRequests(d.requests ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string, extraPayload?: Record<string, string>) => {
    setUpdating(id);
    const res  = await fetch(`/api/stay/booking/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...extraPayload }),
    });
    const data = await res.json();
    if (data.error) showToast(`Error: ${data.error}`);
    else {
      setRequests(prev => prev.map(r => r.id === id
        ? { ...r, status, ...(extraPayload?.decline_reason ? { decline_reason: extraPayload.decline_reason } : {}) }
        : r));
      showToast(status === 'confirmed' ? '✓ Accepted — SMS sent to guest' : status === 'declined' ? '✕ Declined — SMS sent to guest' : '✓ Updated');
    }
    setUpdating(null);
  };

  const handleDeclineSubmit = async () => {
    if (!declineTarget) return;
    await updateStatus(declineTarget, 'declined', declineReason.trim() ? { decline_reason: declineReason.trim() } : {});
    setDeclineTarget(null);
    setDeclineReason('');
  };

  const sendPaymentLink = async (req: BookingRequest) => {
    setSendingPayment(req.id);
    try {
      const res  = await fetch('/api/stay/pesapal/order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          booking_request_id: req.id,
          amount:       req.total_amount,
          guest_name:   req.guest_name,
          guest_email:  req.guest_email,
          guest_phone:  req.guest_phone,
        }),
      });
      const data = await res.json();
      if (data.redirect_url) {
        // Also SMS the link to the guest via the booking PATCH endpoint
        await fetch(`/api/stay/booking/${req.id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ status: 'confirmed', payment_link: data.redirect_url }),
        });
        showToast('✓ Payment link SMSed to guest');
      } else {
        showToast(`Error: ${data.error ?? 'Could not generate payment link'}`);
      }
    } catch {
      showToast('Error generating payment link');
    }
    setSendingPayment(null);
  };

  const sendReviewLink = async (req: BookingRequest) => {
    setSendingWa(req.id);
    const rooms = Array.isArray(req.room_details) ? req.room_details : [];
    const res  = await fetch('/api/stay/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_request_id: req.id,
        guest_name:   req.guest_name,
        guest_phone:  req.guest_phone,
        property_id:  rooms[0]?.property_id ?? null,
        property_name: rooms[0]?.property_name ?? 'Kogelo Property',
        stay_dates:   `${req.check_in} – ${req.check_out}`,
      }),
    });
    const data = await res.json();
    if (data.whatsapp_link) {
      setWaLinks(prev => ({ ...prev, [req.id]: data.whatsapp_link }));
      window.open(data.whatsapp_link, '_blank');
      showToast('WhatsApp review link opened!');
    } else {
      showToast(`Error: ${data.error ?? 'Failed'}`);
    }
    setSendingWa(null);
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const counts   = { all: requests.length, pending: 0, confirmed: 0, declined: 0 };
  requests.forEach(r => { if (r.status in counts) (counts as any)[r.status]++; });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className={`flex items-center justify-between px-4 lg:px-8 h-[64px] transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[100px]' : 'lg:pl-[300px]'}`}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-700"
              onClick={() => window.dispatchEvent(new CustomEvent('openMobileMenu'))}>
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Booking Requests</h1>
              <p className="text-xs text-gray-400 hidden sm:block">Guest reservation requests from the portal</p>
            </div>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 text-sm font-semibold border border-gray-200 rounded-xl px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

    <div className={`px-4 py-5 sm:px-6 max-w-5xl transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[120px]' : 'lg:pl-[320px]'}`}>
      {/* Decline reason modal */}
      {declineTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setDeclineTarget(null); setDeclineReason(''); }} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-black text-gray-900 mb-1">Decline Request</h3>
            <p className="text-sm text-gray-500 mb-4">Optionally give the guest a reason — it will be sent via SMS.</p>
            <textarea
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
              rows={3}
              placeholder="e.g. Fully booked on those dates, please try other dates…"
              className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-red-800 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setDeclineTarget(null); setDeclineReason(''); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleDeclineSubmit} disabled={!!updating}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-700 disabled:opacity-50">
                {updating ? '…' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {(['all','pending','confirmed','declined'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filter === s ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            style={filter === s ? { background: '#9B1C1C' } : {}}>
            {s.charAt(0).toUpperCase() + s.slice(1)} {counts[s] > 0 && `(${counts[s]})`}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
          <BedDouble className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="font-black text-gray-900 mb-1">No {filter !== 'all' ? filter : ''} requests</p>
          <p className="text-sm text-gray-400">New booking requests from the guest portal will appear here.</p>
        </div>
      )}

      {/* Request cards */}
      {!loading && filtered.map(req => {
        const cfg   = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending;
        const StatusIcon = cfg.Icon;
        const rooms = Array.isArray(req.room_details) ? req.room_details : [];
        const isUpdating = updating === req.id;
        const isSending  = sendingWa === req.id;

        return (
          <div key={req.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            {/* Status bar */}
            <div className={`flex items-center gap-2 px-5 py-2.5 border-b text-xs font-bold ${cfg.bg} ${cfg.text}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {cfg.label}
              <span className="ml-auto font-normal opacity-60">{new Date(req.created_at).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>

            <div className="p-5 grid sm:grid-cols-2 gap-5">
              {/* Left: guest + rooms */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-bold text-gray-900 text-sm">{req.guest_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{req.guest_phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{req.check_in} → {req.check_out} · {req.nights} night{req.nights !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-1 pt-1">
                  {rooms.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <BedDouble className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {r.qty > 1 ? `${r.qty}× ` : ''}{r.property_name}
                      <span className="ml-auto font-semibold text-gray-500">KSh {Number(r.subtotal || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {req.special_requests && (
                  <p className="text-xs text-gray-400 italic border-t border-gray-50 pt-2">"{req.special_requests}"</p>
                )}
              </div>

              {/* Right: total + actions */}
              <div className="flex flex-col justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-1">Total</p>
                  <p className="text-2xl font-black text-gray-900">KSh {Number(req.total_amount).toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{req.num_adults} adult{req.num_adults !== 1 ? 's' : ''}{req.num_children > 0 ? `, ${req.num_children} child${req.num_children !== 1 ? 'ren' : ''}` : ''}</p>
                </div>

                <div className="space-y-2">
                  {/* Pending: Accept / Decline */}
                  {req.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => updateStatus(req.id, 'confirmed')} disabled={isUpdating}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-opacity"
                        style={{ background: '#15803d' }}>
                        <CheckCircle2 className="w-4 h-4" />{isUpdating ? '…' : 'Accept'}
                      </button>
                      <button onClick={() => { setDeclineTarget(req.id); setDeclineReason(''); }} disabled={isUpdating}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 bg-red-700 transition-opacity">
                        <XCircle className="w-4 h-4" />Decline
                      </button>
                    </div>
                  )}

                  {/* Confirmed: Send Payment Link + prompt SMS */}
                  {req.status === 'confirmed' && (
                    <div className="space-y-2">
                      <button
                        onClick={() => sendPaymentLink(req)}
                        disabled={sendingPayment === req.id}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-opacity"
                        style={{ background: '#15803d' }}>
                        {sendingPayment === req.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                        {sendingPayment === req.id ? 'Generating…' : 'Send Payment Link'}
                      </button>
                      <button onClick={() => sendReviewLink(req)} disabled={isSending}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-opacity"
                        style={{ background: '#9B1C1C' }}>
                        {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {isSending ? 'Opening WhatsApp…' : 'Send Review Link'}
                      </button>
                    </div>
                  )}

                  {/* Declined: show reason */}
                  {req.status === 'declined' && req.decline_reason && (
                    <div className="flex items-start gap-2 bg-red-50 rounded-xl p-3">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-700">{req.decline_reason}</p>
                    </div>
                  )}

                  <a href={`https://wa.me/${req.guest_phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                    <MessageCircle className="w-4 h-4" />WhatsApp Guest
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
    </div>
  );
}
