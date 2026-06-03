'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface TaxLine {
  label: string;
  rate: number;
  amount: number;
}

interface RoomDetail {
  property_name: string;
  qty: number;
  nightly_rate: number;
  subtotal: number;
}

interface Receipt {
  id: string;
  receipt_number: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  property_name: string;
  room_details: RoomDetail[];
  check_in: string;
  check_out: string;
  nights: number;
  subtotal: number;
  tax_lines: TaxLine[];
  tax_total: number;
  grand_total: number;
  amount_paid: number;
  balance_due: number;
  payment_method: string;
  payment_reference: string;
  is_partial: boolean;
  notes: string;
  issued_at: string;
}

function fmt(n: number) {
  return 'KSh ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-KE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const METHOD_LABELS: Record<string, string> = {
  cash:    'Cash',
  mpesa:   'M-Pesa',
  bank:    'Bank Transfer',
  card:    'Card',
  pesapal: 'Pesapal (Online)',
};

export default function ReceiptPage() {
  const { token } = useParams<{ token: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [kraPin, setKraPin]   = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`/api/stay/receipt?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setReceipt(d.receipt);
        setKraPin(d.kra_pin ?? '');
      })
      .catch(() => setError('Could not load receipt.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading receipt…</p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm px-4">
          <div className="text-4xl mb-4">🧾</div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Receipt Not Found</h1>
          <p className="text-sm text-gray-500">{error || 'This receipt link may be invalid or expired.'}</p>
        </div>
      </div>
    );
  }

  const rooms = Array.isArray(receipt.room_details) ? receipt.room_details : [];
  const taxes = Array.isArray(receipt.tax_lines) ? receipt.tax_lines : [];

  return (
    <>
      {/* Print-only CSS */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
          .receipt-paper {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
          }
        }
        @page {
          size: A4;
          margin: 15mm;
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 py-8 px-4 print:bg-white print:p-0">

        {/* Print / action bar */}
        <div className="no-print flex justify-center mb-6 gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition-colors"
          >
            🖨️ Print Receipt
          </button>
          <button
            onClick={() => window.close()}
            className="px-5 py-2.5 text-sm font-bold border-2 border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Receipt paper */}
        <div className="receipt-paper bg-white rounded-2xl shadow-lg max-w-xl mx-auto p-8 print:rounded-none">

          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">KOGELO SUITES</h1>
              <p className="text-xs text-gray-500 mt-0.5">Kogelo, Siaya County, Kenya</p>
              {kraPin && (
                <p className="text-xs text-gray-500 mt-0.5 font-medium">KRA PIN: <span className="font-bold text-gray-700">{kraPin}</span></p>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Receipt</div>
              <div className="text-lg font-black text-gray-900">{receipt.receipt_number}</div>
              <div className="text-xs text-gray-500 mt-1">{fmtDateTime(receipt.issued_at)}</div>
            </div>
          </div>

          {/* Status badge */}
          <div className="mb-6">
            {receipt.is_partial ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                ⚠️ PARTIAL PAYMENT
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                ✅ PAID IN FULL
              </span>
            )}
          </div>

          <hr className="border-gray-200 mb-5" />

          {/* Guest & booking info */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">Billed To</p>
              <p className="font-bold text-gray-900">{receipt.guest_name}</p>
              <p className="text-gray-600">{receipt.guest_phone}</p>
              {receipt.guest_email && <p className="text-gray-600 text-xs">{receipt.guest_email}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">Stay Details</p>
              {receipt.property_name && <p className="font-bold text-gray-900">{receipt.property_name}</p>}
              {receipt.check_in && (
                <p className="text-gray-600 text-xs">
                  {fmtDate(receipt.check_in)} → {fmtDate(receipt.check_out)}
                </p>
              )}
              {receipt.nights && (
                <p className="text-gray-500 text-xs">{receipt.nights} night{receipt.nights !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>

          <hr className="border-gray-200 mb-4" />

          {/* Line items */}
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs text-gray-400 font-bold uppercase tracking-wide py-2">Description</th>
                <th className="text-right text-xs text-gray-400 font-bold uppercase tracking-wide py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rooms.length > 0 ? rooms.map((room, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2.5 text-gray-800">
                    {room.qty > 1 ? `${room.qty}× ` : ''}{room.property_name}
                    {room.nightly_rate > 0 && receipt.nights && (
                      <span className="text-xs text-gray-400 ml-1">
                        @ KSh {Number(room.nightly_rate).toLocaleString()} × {receipt.nights} night{receipt.nights !== 1 ? 's' : ''}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-medium text-gray-900">{fmt(room.subtotal)}</td>
                </tr>
              )) : (
                <tr className="border-b border-gray-50">
                  <td className="py-2.5 text-gray-800">Accommodation</td>
                  <td className="py-2.5 text-right font-medium text-gray-900">{fmt(receipt.subtotal)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals section */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium">{fmt(receipt.subtotal)}</span>
            </div>

            {taxes.map((tl, i) => (
              <div key={i} className="flex justify-between text-gray-600">
                <span>{tl.label} ({Number(tl.rate)}%)</span>
                <span className="font-medium">{fmt(tl.amount)}</span>
              </div>
            ))}

            {taxes.length > 1 && (
              <div className="flex justify-between text-gray-500 text-xs">
                <span>Total Tax</span>
                <span>{fmt(receipt.tax_total)}</span>
              </div>
            )}

            <hr className="border-gray-200 my-2" />

            <div className="flex justify-between text-base font-black text-gray-900">
              <span>Grand Total</span>
              <span>{fmt(receipt.grand_total)}</span>
            </div>

            <div className="flex justify-between text-sm font-bold text-green-700">
              <span>Amount Paid <span className="font-normal text-xs text-gray-500">({METHOD_LABELS[receipt.payment_method] ?? receipt.payment_method})</span></span>
              <span>{fmt(receipt.amount_paid)}</span>
            </div>

            {receipt.payment_reference && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>Reference / Code</span>
                <span className="font-mono font-bold text-gray-700">{receipt.payment_reference}</span>
              </div>
            )}

            {receipt.is_partial && (
              <div className="flex justify-between text-sm font-bold text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                <span>Balance Due</span>
                <span>{fmt(receipt.balance_due)}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {receipt.notes && (
            <>
              <hr className="border-gray-200 mt-5 mb-3" />
              <p className="text-xs text-gray-500 italic">Note: {receipt.notes}</p>
            </>
          )}

          {/* Footer */}
          <hr className="border-gray-200 mt-6 mb-4" />
          <div className="text-center text-xs text-gray-400 space-y-0.5">
            <p className="font-semibold text-gray-600">Thank you for choosing Kogelo Suites!</p>
            <p>This receipt was generated electronically and is valid without a signature.</p>
            <p className="font-mono text-gray-300 text-[10px] mt-1">Ref: {receipt.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
      </div>
    </>
  );
}
