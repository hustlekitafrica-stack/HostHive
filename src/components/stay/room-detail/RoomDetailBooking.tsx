'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';

const CAL_DAY = ['S','M','T','W','T','F','S'];
const CAL_MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function daysInMo(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDayMo(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function isoStr(d: Date) { return d.toISOString().split('T')[0]; }
function fmtShort(d: string) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
}
const SHORT_MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDateRange(ci: string, co: string) {
  if (!ci || !co) return '';
  const a = new Date(ci + 'T00:00:00');
  const b = new Date(co + 'T00:00:00');
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${SHORT_MON[a.getMonth()]} ${a.getDate()}–${b.getDate()}`;
  }
  return `${SHORT_MON[a.getMonth()]} ${a.getDate()} – ${SHORT_MON[b.getMonth()]} ${b.getDate()}`;
}
function fmtLong(d: string) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

interface InlinePickerProps {
  checkIn: string; checkOut: string;
  activeField: 'in' | 'out';
  city?: string;
  onSelect: (field: 'in' | 'out', date: string) => void;
  onClear: () => void;
  onClose: () => void;
}
function InlinePicker({ checkIn, checkOut, activeField, city, onSelect, onClear, onClose }: InlinePickerProps) {
  const [offset, setOffset] = useState(0);
  const ref   = useRef<HTMLDivElement>(null);
  const today = isoStr(new Date());
  const now   = new Date();
  const nights = checkIn && checkOut && checkOut > checkIn
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) : 0;
  const headerTitle = nights > 0
    ? `${nights} night${nights !== 1 ? 's' : ''}${city ? ` in ${city}` : ''}`
    : activeField === 'in' ? 'Select check-in date' : 'Select checkout date';

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  function renderMonth(year: number, month: number) {
    const fd   = firstDayMo(year, month);
    const days = daysInMo(year, month);
    return (
      <div key={`${year}-${month}`} className="flex-1 min-w-0">
        <div className="grid grid-cols-7 mb-3">
          {CAL_DAY.map((d, i) => (
            <div key={i} className="text-center text-xs font-semibold text-gray-400 py-1 tracking-wide">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: fd }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: days }).map((_, i) => {
            const day = i + 1;
            const ds  = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const isPast  = ds < today;
            const isCI    = ds === checkIn;
            const isCO    = ds === checkOut;
            const inRange = !!(checkIn && checkOut && ds > checkIn && ds < checkOut);
            return (
              <button key={day} disabled={isPast} onClick={() => !isPast && onSelect(activeField, ds)}
                className={['relative h-11 w-full flex items-center justify-center transition-colors',
                  isPast ? 'cursor-not-allowed' : 'cursor-pointer',
                  inRange ? 'bg-green-50' : '',
                ].join(' ')}>
                {isPast ? (
                  <span className="line-through text-gray-300 text-sm select-none">{day}</span>
                ) : (isCI || isCO) ? (
                  <>
                    <span className="absolute w-10 h-10 rounded-full" style={{ background: '#16a34a' }} />
                    <span className="relative text-white font-bold text-sm">{day}</span>
                  </>
                ) : (
                  <span className="relative font-medium text-gray-900 text-sm w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">{day}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const leftD  = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const rightD = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 p-7 w-[700px]">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-gray-900 leading-tight">{headerTitle}</h3>
        {checkIn && checkOut && nights > 0 && (
          <p className="text-sm mt-1 font-medium" style={{ color: '#0d9488' }}>{fmtLong(checkIn)} – {fmtLong(checkOut)}</p>
        )}
      </div>
      <div className="flex items-start gap-2">
        <button onClick={() => setOffset(o => Math.max(0, o - 1))} disabled={offset === 0}
          className="mt-5 p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-20 flex-shrink-0">
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="flex gap-8 flex-1">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-center mb-3 text-gray-900">{CAL_MON[leftD.getMonth()]} {leftD.getFullYear()}</p>
            {renderMonth(leftD.getFullYear(), leftD.getMonth())}
          </div>
          <div className="w-px bg-gray-100 self-stretch" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-center mb-3 text-gray-900">{CAL_MON[rightD.getMonth()]} {rightD.getFullYear()}</p>
            {renderMonth(rightD.getFullYear(), rightD.getMonth())}
          </div>
        </div>
        <button onClick={() => setOffset(o => o + 1)}
          className="mt-5 p-1.5 rounded-full hover:bg-gray-100 flex-shrink-0">
          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 9h20M8 2v3M16 2v3"/>
        </svg>
        <button onClick={onClear} className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">Clear dates</button>
      </div>
    </div>
  );
}

function MobileCalendar({
  checkIn, checkOut, setCheckIn, setCheckOut, city,
}: {
  checkIn: string; checkOut: string;
  setCheckIn: (d: string) => void; setCheckOut: (d: string) => void;
  city?: string;
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const initD = checkIn && checkIn >= todayStr ? new Date(checkIn + 'T00:00:00') : new Date();
  const [month,     setMonth]     = useState({ year: initD.getFullYear(), month: initD.getMonth() });
  const [selecting, setSelecting] = useState<'in'|'out'>(checkOut ? 'in' : 'out');
  const nights = checkIn && checkOut && checkOut > checkIn
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) : 0;

  function fmtDisplay(d: string) {
    if (!d) return '';
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function handleDayClick(ds: string) {
    if (ds < todayStr) return;
    if (selecting === 'in' || (checkIn && checkOut)) {
      setCheckIn(ds); setCheckOut(''); setSelecting('out');
    } else {
      if (ds <= checkIn) { setCheckIn(ds); setCheckOut(''); }
      else { setCheckOut(ds); setSelecting('in'); }
    }
  }

  const firstDay  = new Date(month.year, month.month, 1).getDay();
  const daysCount = new Date(month.year, month.month + 1, 0).getDate();
  const now = new Date();
  const isPrevDisabled = month.year === now.getFullYear() && month.month === now.getMonth();

  function isInRange(ds: string) { return !!(checkIn && checkOut && ds > checkIn && ds < checkOut); }

  return (
    <div className="lg:hidden bg-white rounded-2xl border border-gray-100 p-5">
      <div className="mb-6 pb-5 border-b border-gray-100">
        {nights > 0 ? (
          <>
            <h3 className="text-2xl font-bold text-gray-900">{nights} night{nights !== 1 ? 's' : ''}{city ? ` in ${city}` : ''}</h3>
            <p className="text-sm text-gray-500 mt-1">{fmtDisplay(checkIn)} – {fmtDisplay(checkOut)}</p>
          </>
        ) : checkIn && !checkOut ? (
          <>
            <h3 className="text-2xl font-bold text-gray-900">Select check-out date</h3>
            <p className="text-sm text-gray-500 mt-1">{fmtDisplay(checkIn)} –</p>
          </>
        ) : (
          <h3 className="text-2xl font-bold text-gray-900">Select check-in date</h3>
        )}
      </div>
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => setMonth(m => { const d = new Date(m.year, m.month - 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
          disabled={isPrevDisabled} aria-label="Previous month"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-30 transition-colors">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span className="text-base font-bold text-gray-900">{CAL_MON[month.month]} {month.year}</span>
        <button onClick={() => setMonth(m => { const d = new Date(m.year, m.month + 1, 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
          aria-label="Next month"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {CAL_DAY.map((d, i) => (
          <div key={i} className="text-center text-xs font-semibold text-gray-400 py-1 tracking-wide">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysCount }).map((_, i) => {
          const day = i + 1;
          const ds  = `${month.year}-${String(month.month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const isStart = ds === checkIn;
          const isEnd   = ds === checkOut;
          const inRange = isInRange(ds);
          const isPast  = ds < todayStr;
          const rangeHL = inRange || (isStart && !!checkOut) || (isEnd && !!checkIn);
          return (
            <div key={day} className={['aspect-square flex items-center justify-center',
              rangeHL ? 'bg-[#16a34a]/10' : '',
              isStart && checkOut ? 'rounded-l-full' : '',
              isEnd ? 'rounded-r-full' : '',
            ].join(' ')}>
              <button disabled={isPast} onClick={() => handleDayClick(ds)}
                style={(isStart || isEnd) ? { background: '#16a34a' } : {}}
                className={['w-full h-full flex items-center justify-center text-sm rounded-full transition-colors',
                  isPast ? 'text-gray-300 line-through cursor-not-allowed' : '',
                  isStart || isEnd ? 'text-white font-bold' : '',
                  !isStart && !isEnd && !isPast ? 'text-gray-900 font-medium hover:bg-gray-100' : '',
                ].join(' ')}>
                {day}
              </button>
            </div>
          );
        })}
      </div>
      {(checkIn || checkOut) && (
        <div className="mt-5 pt-4 border-t border-gray-100 text-center">
          <button onClick={() => { setCheckIn(''); setCheckOut(''); setSelecting('in'); }}
            className="text-sm font-semibold text-gray-700 underline hover:text-gray-900 transition-colors">
            Clear dates
          </button>
        </div>
      )}
    </div>
  );
}

export interface RoomDetailBookingProperty {
  id: string;
  nightly_rate: number;
  max_guests: number;
  city?: string;
  county?: string;
  check_in_time?: string;
  check_out_time?: string;
}

export default function RoomDetailBooking({
  property,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
}: {
  property: RoomDetailBookingProperty;
  initialCheckIn: string;
  initialCheckOut: string;
  initialGuests: number;
}) {
  const router = useRouter();
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [checkIn,        setCheckIn]        = useState(initialCheckIn  || today);
  const [checkOut,       setCheckOut]       = useState(initialCheckOut || tomorrow);
  const [adults,         setAdults]         = useState(initialGuests || 1);
  const [children,       setChildren]       = useState(0);
  const [infants,        setInfants]        = useState(0);
  const [pets,           setPets]           = useState(0);
  const [rooms,          setRooms]          = useState(1);
  const [showPicker,     setShowPicker]     = useState<'in' | 'out' | null>(null);
  const [showGuestPanel, setShowGuestPanel] = useState(false);

  const nights = checkIn && checkOut && checkOut > checkIn
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) : 0;
  const rate  = Number(property.nightly_rate ?? 0);
  const total = rate * nights * rooms;

  const handleBook = () => {
    router.push(`/stay/checkout?propertyId=${property.id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${adults + children}&rooms=${rooms}`);
  };

  const guests = adults + children;

  return (
    <>
      {/* Desktop Booking Sidebar */}
      <div className="hidden lg:block lg:col-span-1">
        <div className="sticky top-24">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 relative">
            {nights > 0 ? (
              <div className="mb-5">
                <span className="text-2xl font-black text-gray-900">KSh {rate.toLocaleString()}</span>
                <span className="text-gray-500 text-sm"> / night</span>
              </div>
            ) : (
              <h3 className="text-xl font-bold text-gray-900 mb-5">Add dates for prices</h3>
            )}
            <div className="rounded-xl border-2 border-gray-300 overflow-visible mb-4">
              <div className="relative">
                <div className="grid grid-cols-2">
                  <button onClick={() => setShowPicker(v => v === 'in' ? null : 'in')}
                    className={`px-3 py-3 text-left border-r border-gray-200 transition-colors ${showPicker === 'in' ? 'outline outline-2 -outline-offset-2 rounded-tl-xl' : ''}`}
                    style={showPicker === 'in' ? { outlineColor: '#16a34a' } : {}}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">Check-in</p>
                    <p className={`text-sm font-semibold ${checkIn ? 'text-gray-900' : 'text-gray-400'}`}>
                      {checkIn ? fmtShort(checkIn) : 'Add date'}
                    </p>
                  </button>
                  <button onClick={() => setShowPicker(v => v === 'out' ? null : 'out')}
                    className={`px-3 py-3 text-left transition-colors ${showPicker === 'out' ? 'outline outline-2 -outline-offset-2 rounded-tr-xl' : ''}`}
                    style={showPicker === 'out' ? { outlineColor: '#16a34a' } : {}}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">Checkout</p>
                    <p className={`text-sm font-semibold ${checkOut ? 'text-gray-900' : 'text-gray-400'}`}>
                      {checkOut ? fmtShort(checkOut) : 'Add date'}
                    </p>
                  </button>
                </div>
                {showPicker && (
                  <InlinePicker checkIn={checkIn} checkOut={checkOut} activeField={showPicker}
                    city={property.city ?? property.county ?? ''}
                    onSelect={(field, date) => {
                      if (field === 'in') { setCheckIn(date); if (date >= checkOut) setCheckOut(''); setShowPicker('out'); }
                      else { setCheckOut(date); setShowPicker(null); }
                    }}
                    onClear={() => { setCheckIn(''); setCheckOut(''); setShowPicker(null); }}
                    onClose={() => setShowPicker(null)}
                  />
                )}
              </div>
              <div className="relative">
                <button onClick={() => setShowGuestPanel(v => !v)}
                  className={`w-full border-t border-gray-200 px-3 py-3 flex items-center justify-between text-left transition-colors ${showGuestPanel ? 'outline outline-2 -outline-offset-2 rounded-b-xl' : ''}`}
                  style={showGuestPanel ? { outlineColor: '#16a34a' } : {}}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">Guests</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {guests} guest{guests !== 1 ? 's' : ''}
                      {infants > 0 ? `, ${infants} infant${infants !== 1 ? 's' : ''}` : ''}
                      {pets > 0 ? `, ${pets} pet${pets !== 1 ? 's' : ''}` : ''}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-gray-500 flex-shrink-0 transition-transform" style={{ transform: showGuestPanel ? 'rotate(180deg)' : 'none' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
                </button>
                {showGuestPanel && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 p-5">
                    {([
                      { label: 'Adults',   sub: 'Age 13+',     val: adults,   set: setAdults,   min: 1, max: property.max_guests ?? 10 },
                      { label: 'Children', sub: 'Ages 2–12',   val: children, set: setChildren, min: 0, max: property.max_guests ?? 10 },
                      { label: 'Infants',  sub: 'Under 2',     val: infants,  set: setInfants,  min: 0, max: 5 },
                      { label: 'Pets',     sub: 'Bringing a service animal?', val: pets, set: setPets, min: 0, max: 5 },
                    ] as const).map(row => (
                      <div key={row.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{row.label}</p>
                          <p className="text-xs font-medium" style={{ color: '#16a34a' }}>{row.sub}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => (row.set as React.Dispatch<React.SetStateAction<number>>)(v => Math.max(row.min, v - 1))}
                            disabled={row.val <= row.min}
                            className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-lg font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ borderColor: '#16a34a', color: '#16a34a' }}>−</button>
                          <span className="w-5 text-center text-sm font-semibold text-gray-900">{row.val}</span>
                          <button onClick={() => (row.set as React.Dispatch<React.SetStateAction<number>>)(v => Math.min(row.max, v + 1))}
                            disabled={row.val >= row.max || (row.label !== 'Infants' && row.label !== 'Pets' && adults + children >= (property.max_guests ?? 10))}
                            className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-lg font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ borderColor: '#16a34a', color: '#16a34a' }}>+</button>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs mt-3 mb-3" style={{ color: '#16a34a' }}>
                      This place has a maximum of {property.max_guests ?? 10} guests, not including infants.
                    </p>
                    <div className="flex justify-end">
                      <button onClick={() => setShowGuestPanel(false)} className="text-sm font-bold text-gray-900 underline hover:text-gray-600">Close</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {nights > 0 && (
              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>KSh {rate.toLocaleString()} × {nights} night{nights !== 1 ? 's' : ''}{rooms > 1 ? ` × ${rooms} rooms` : ''}</span>
                  <span>KSh {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-gray-900 pt-2 border-t border-gray-100 text-base">
                  <span>Total</span>
                  <span>KSh {total.toLocaleString()}</span>
                </div>
              </div>
            )}
            <button onClick={handleBook}
              className="w-full py-3.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: '#16a34a' }}>
              {nights > 0 ? 'Reserve' : 'Check availability'}
            </button>
            <p className="text-xs text-center text-gray-400 mt-3">No payment now — we'll confirm within 2 hours.</p>
          </div>
        </div>
      </div>

      {/* Mobile Calendar (inside content column) */}
      <MobileCalendar
        checkIn={checkIn}
        checkOut={checkOut}
        setCheckIn={setCheckIn}
        setCheckOut={setCheckOut}
        city={property.city}
      />

      {/* Mobile Sticky Booking Bar */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white"
        style={{ boxShadow: '0 -2px 16px rgba(0,0,0,0.10)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            {nights > 0 ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-gray-900">KSh {total.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  For {nights} night{nights !== 1 ? 's' : ''} · {fmtDateRange(checkIn, checkOut)}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-black text-gray-900">KSh {rate.toLocaleString()}</span>
                  <span className="text-sm text-gray-500">/ night</span>
                </div>
                <p className="text-xs text-gray-400">Add dates for total price</p>
              </>
            )}
          </div>
          <button onClick={handleBook}
            className="flex-shrink-0 px-6 py-3 rounded-full text-sm font-bold text-white transition-all active:scale-95"
            style={{ background: '#16a34a' }}>
            {nights > 0 ? 'Reserve' : 'Check availability'}
          </button>
        </div>
      </div>
    </>
  );
}
