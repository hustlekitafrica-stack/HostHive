'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, BedDouble, Calendar, Phone, User, MessageCircle, RefreshCw, Send } from 'lucide-react';

type BookingRequest = {
  id: string; created_at: string; guest_name: string; guest_phone: string; guest_email: string;
  check_in: string; check_out: string; nights: number; num_adults: number; num_children: number;
  room_details: { property_id?: string; property_name: string; qty: number; nightly_rate: number; subtotal: number }[];
  total_amount: number; special_requests: string; status: string;
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; Icon: typeof Clock }> = {
  pending:   { label: 'Pending',   bg: 'bg-amber-50',  text: 'text-amber-700',  Icon: Clock },
  confirmed: { label: 'Confirmed', bg: 'bg-green-50',  text: 'text-green-700',  Icon: CheckCircle2 },
  declined:  { label: 'Declined',  bg: 'bg-red-50',    text: 'text-red-700',    Icon: XCircle },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-100',  text: 'text-gray-500',   Icon: XCircle },
};

export default function RequestsPage() {
  const [requests,   setRequests]   = useState<BookingRequest[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');
  const [updating,   setUpdating]   = useState<string | null>(null);
  const [sendingWa,  setSendingWa]  = useState<string | null>(null);
  const [waLinks,    setWaLinks]    = useState<Record<string, string>>({});
  const [toast,      setToast]      = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = () => {
    setLoading(true);
    fetch('/api/stay/my-bookings?userId=host')
      .then(() => {})
      .catch(() => {});

    // Host fetches ALL requests via a separate host endpoint
    fetch('/api/stay/requests')
      .then(r => r.json())
      .then(d => setRequests(d.requests ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    const res  = await fetch(`/api/stay/booking/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.error) showToast(`Error: ${data.error}`);
    else {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      showToast(status === 'confirmed' ? '✓ Booking confirmed' : '✕ Booking declined');
    }
    setUpdating(null);
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
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Booking Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">Guest reservation requests from the portal</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 text-sm font-semibold border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 disabled:opacity-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />Refresh
        </button>
      </div>

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
                  {req.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => updateStatus(req.id, 'confirmed')} disabled={isUpdating}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-opacity"
                        style={{ background: '#15803d' }}>
                        <CheckCircle2 className="w-4 h-4" />{isUpdating ? '…' : 'Accept'}
                      </button>
                      <button onClick={() => updateStatus(req.id, 'declined')} disabled={isUpdating}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 bg-red-700 transition-opacity">
                        <XCircle className="w-4 h-4" />{isUpdating ? '…' : 'Decline'}
                      </button>
                    </div>
                  )}

                  {req.status === 'confirmed' && (
                    <button onClick={() => sendReviewLink(req)} disabled={isSending}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-opacity"
                      style={{ background: '#9B1C1C' }}>
                      {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {isSending ? 'Opening WhatsApp…' : 'Send Review Link'}
                    </button>
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
  );
}
