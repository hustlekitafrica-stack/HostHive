'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

// ── helpers ──────────────────────────────────────────────────────────────────
function isoDate(d: Date) { return d.toISOString().split('T')[0]; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function fmt(d: string) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDesktop(d: string) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const MONTHS_AHEAD = 12;
const DAY_NAMES   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildMonths(count: number) {
  const result = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    result.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return result;
}
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }

// ── DatePickerModal ──────────────────────────────────────────────────────────
interface DatePickerModalProps {
  checkIn: string;
  checkOut: string;
  onConfirm: (checkIn: string, checkOut: string) => void;
  onClose: () => void;
}

export function DatePickerModal({ checkIn, checkOut, onConfirm, onClose }: DatePickerModalProps) {
  const [tab, setTab]               = useState<'calendar' | 'flexible'>('calendar');
  const [start, setStart]           = useState(checkIn);
  const [end, setEnd]               = useState(checkOut);
  const [selecting, setSelecting]   = useState<'in' | 'out'>(checkIn ? 'out' : 'in');
  const [flexDuration, setFlexDuration] = useState('');
  const [flexMonths, setFlexMonths] = useState<string[]>([]);

  const today  = isoDate(new Date());
  const months = useMemo(() => buildMonths(MONTHS_AHEAD), []);
  const monthCards = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: SHORT_MONTHS[d.getMonth()], year: d.getFullYear() };
    });
  }, []);

  function handleDayClick(dateStr: string) {
    if (dateStr < today) return;
    if (selecting === 'in' || (start && end)) {
      setStart(dateStr); setEnd(''); setSelecting('out');
    } else {
      if (dateStr <= start) { setStart(dateStr); setEnd(''); setSelecting('out'); }
      else { setEnd(dateStr); setSelecting('in'); onConfirm(start, dateStr); }
    }
  }

  function isInRange(dateStr: string) {
    return !!(start && end && dateStr > start && dateStr < end);
  }

  const n = (start && end) ? Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) : 0;
  const canDone = tab === 'calendar' ? !!(start && end) : !!(flexDuration && flexMonths.length > 0);

  function handleDone() {
    if (tab === 'calendar') {
      if (start && end) onConfirm(start, end);
    } else {
      if (flexDuration && flexMonths.length > 0) {
        const [yr, mo] = flexMonths[0].split('-').map(Number);
        const s = new Date(yr, mo, 15);
        const daysMap: Record<string, number> = { weekend: 2, week: 7, month: 30, other: 14 };
        onConfirm(isoDate(s), isoDate(addDays(s, daysMap[flexDuration] ?? 7)));
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <div className="flex gap-6">
          {(['calendar', 'flexible'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-sm font-semibold pb-1 border-b-2 transition-colors capitalize ${t === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
              {t === 'flexible' ? "I'm flexible" : 'Calendar'}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-900">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'calendar' ? (
          <div className="px-4 py-4">
            {months.map(({ year, month }) => {
              const firstDay = firstDayOfMonth(year, month);
              const days     = daysInMonth(year, month);
              return (
                <div key={`${year}-${month}`} className="mb-8">
                  <p className="font-bold text-gray-900 text-base mb-3">{MONTH_NAMES[month]} {year}</p>
                  <div className="grid grid-cols-7 mb-1">
                    {DAY_NAMES.map(d => <div key={d} className="text-center text-xs text-gray-400 font-semibold py-1">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                    {Array.from({ length: days }).map((_, i) => {
                      const day     = i + 1;
                      const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                      const isStart = dateStr === start;
                      const isEnd   = dateStr === end;
                      const inRange = isInRange(dateStr);
                      const isPast  = dateStr < today;
                      return (
                        <button key={day} disabled={isPast} onClick={() => handleDayClick(dateStr)}
                          className={`h-10 w-full text-sm font-medium transition-colors
                            ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-50'}
                            ${(isStart || isEnd) ? 'bg-blue-600 text-white rounded-full font-bold' : ''}
                            ${inRange ? 'bg-blue-100 text-blue-800' : ''}
                            ${!isStart && !isEnd && !inRange && !isPast ? 'text-gray-900' : ''}
                          `}>
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-6">
            <p className="font-bold text-gray-900 text-base mb-4">How long do you want to stay?</p>
            {[
              { key: 'weekend', label: 'A weekend' },
              { key: 'week',    label: 'A week'    },
              { key: 'month',   label: 'A month'   },
              { key: 'other',   label: 'Other'     },
            ].map(opt => (
              <label key={opt.key} className="flex items-center gap-3 py-3 cursor-pointer select-none" onClick={() => setFlexDuration(opt.key)}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${flexDuration === opt.key ? 'border-blue-600' : 'border-gray-400'}`}>
                  {flexDuration === opt.key && <div className="w-2.5 h-2.5 rounded-full bg-blue-600"/>}
                </div>
                <span className="text-gray-900 text-base">{opt.label}</span>
              </label>
            ))}

            <p className="font-bold text-gray-900 text-base mt-6 mb-1">When do you want to go?</p>
            <p className="text-gray-400 text-sm mb-4">Select up to 3 months</p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {monthCards.map(mc => {
                const sel = flexMonths.includes(mc.key);
                return (
                  <button key={mc.key}
                    onClick={() => setFlexMonths(prev =>
                      sel ? prev.filter(m => m !== mc.key) : prev.length < 3 ? [...prev, mc.key] : prev
                    )}
                    className={`flex-shrink-0 w-24 rounded-xl border-2 p-3 text-center transition-colors ${sel ? 'border-blue-600 text-blue-600' : 'border-gray-200 text-gray-700'}`}>
                    <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <p className="font-bold text-sm">{mc.label}</p>
                    <p className="text-xs">{mc.year}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-200 bg-white" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        {tab === 'calendar' && (
          <p className="text-sm text-gray-500 text-center mb-3">
            {start && end ? `${fmt(start)} – ${fmt(end)} (${n} night${n !== 1 ? 's' : ''})` : 'Select check-in and check-out dates'}
          </p>
        )}
        {tab === 'flexible' && flexDuration && flexMonths.length > 0 && (
          <p className="text-sm text-gray-500 text-center mb-3">
            {({ weekend:'A weekend', week:'A week', month:'A month', other:'Other' } as any)[flexDuration]} in {monthCards.find(m => m.key === flexMonths[0])?.label}
          </p>
        )}
        <button onClick={handleDone} disabled={!canDone}
          className={`w-full py-4 rounded-xl text-base font-bold text-white transition-colors ${canDone ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
          Done
        </button>
      </div>
    </div>
  );
}

// ── GuestsModal ──────────────────────────────────────────────────────────────
interface GuestsModalProps {
  adults: number;
  children: number;
  rooms: number;
  onConfirm: (adults: number, children: number, rooms: number, pets: boolean) => void;
  onClose: () => void;
}

export function GuestsModal({ adults: ia, children: ic, rooms: ir, onConfirm, onClose }: GuestsModalProps) {
  const [adults,   setAdults]   = useState(ia);
  const [children, setChildren] = useState(ic);
  const [rooms,    setRooms]    = useState(ir);
  const [pets,     setPets]     = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <span className="font-bold text-gray-900 text-base">Guests</span>
        <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-900">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-2">
        {([
          { label: 'Adults',   val: adults,   set: setAdults,   min: 1 },
          { label: 'Children', val: children, set: setChildren, min: 0 },
          { label: 'Rooms',    val: rooms,    set: setRooms,    min: 1 },
        ] as { label: string; val: number; set: React.Dispatch<React.SetStateAction<number>>; min: number }[]).map(row => (
          <div key={row.label} className="flex items-center justify-between py-5 border-b border-gray-100">
            <span className="text-base font-semibold text-gray-900">{row.label}</span>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => row.set((v: number) => Math.max(row.min, v - 1))}
                disabled={row.val === row.min}
                className="w-12 h-12 flex items-center justify-center text-blue-600 text-xl font-bold hover:bg-gray-50 disabled:text-gray-300 border-r border-gray-200">
                −
              </button>
              <span className="w-12 text-center text-base font-bold text-gray-900">{row.val}</span>
              <button onClick={() => row.set((v: number) => Math.min(20, v + 1))}
                className="w-12 h-12 flex items-center justify-center text-blue-600 text-xl font-bold hover:bg-gray-50 border-l border-gray-200">
                +
              </button>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between py-5">
          <p className="text-base font-semibold text-gray-900">Travelling with pets?</p>
          <button onClick={() => setPets(v => !v)}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${pets ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-200 ${pets ? 'translate-x-5' : 'translate-x-0'}`}/>
          </button>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-gray-200" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <button onClick={() => onConfirm(adults, children, rooms, pets)}
          className="w-full py-4 rounded-xl text-base font-bold text-white"
          style={{ background: '#16a34a' }}>
          Done
        </button>
      </div>
    </div>
  );
}

// ── DesktopDateDropdown ───────────────────────────────────────────────────────
function DesktopDateDropdown({ checkIn, checkOut, onConfirm, onClose }: DatePickerModalProps) {
  const [tab, setTab]           = useState<'calendar' | 'flexible'>('calendar');
  const [start, setStart]       = useState(checkIn);
  const [end, setEnd]           = useState(checkOut);
  const [selecting, setSelecting] = useState<'in' | 'out'>(checkIn ? 'out' : 'in');
  const [offset, setOffset]     = useState(0);
  const [flexibility, setFlexibility] = useState('exact');
  const [flexDuration, setFlexDuration] = useState('');
  const [flexMonths, setFlexMonths]   = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const today = isoDate(new Date());
  const now   = new Date();

  const onCloseCb = useCallback(onClose, []);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onCloseCb();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onCloseCb]);

  const leftD  = new Date(now.getFullYear(), now.getMonth() + offset,     1);
  const rightD = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  const leftM  = { year: leftD.getFullYear(),  month: leftD.getMonth()  };
  const rightM = { year: rightD.getFullYear(), month: rightD.getMonth() };

  const monthCards = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: SHORT_MONTHS[d.getMonth()], year: d.getFullYear() };
  }), []);

  function handleDayClick(dateStr: string) {
    if (dateStr < today) return;
    if (selecting === 'in' || (start && end)) {
      setStart(dateStr); setEnd(''); setSelecting('out');
    } else {
      if (dateStr <= start) { setStart(dateStr); setEnd(''); setSelecting('out'); }
      else { setEnd(dateStr); setSelecting('in'); onConfirm(start, dateStr); }
    }
  }

  function renderMonth(year: number, month: number) {
    const firstDay = firstDayOfMonth(year, month);
    const days     = daysInMonth(year, month);
    return (
      <div key={`${year}-${month}`} className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm text-center mb-3">{MONTH_NAMES[month]} {year}</p>
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map(d => <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: days }).map((_, i) => {
            const day     = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const isStart = dateStr === start;
            const isEnd   = dateStr === end;
            const inRange = !!(start && end && dateStr > start && dateStr < end);
            const isPast  = dateStr < today;
            return (
              <button key={day} disabled={isPast} onClick={() => handleDayClick(dateStr)}
                className={[
                  'h-9 w-full text-xs font-medium transition-colors',
                  isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-50 cursor-pointer',
                  (isStart || isEnd) ? 'bg-blue-600 !text-white font-bold rounded-full' : '',
                  inRange ? 'bg-blue-100 text-blue-800' : '',
                  !isStart && !isEnd && !inRange && !isPast ? 'text-gray-900' : '',
                ].join(' ')}>
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const n = (start && end) ? Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) : 0;

  return (
    <div ref={ref} className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[200] p-6" style={{ width: '680px', maxWidth: '96vw' }}>
      <div className="flex gap-6 border-b border-gray-200 mb-5">
        {(['calendar', 'flexible'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors ${t === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
            {t === 'flexible' ? "I'm flexible" : 'Calendar'}
          </button>
        ))}
      </div>

      {tab === 'calendar' ? (
        <>
          <div className="flex items-start gap-2">
            <button onClick={() => setOffset(o => Math.max(0, o - 1))} disabled={offset === 0}
              className="mt-1 p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 flex-shrink-0">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div className="flex gap-8 flex-1">
              {renderMonth(leftM.year, leftM.month)}
              {renderMonth(rightM.year, rightM.month)}
            </div>
            <button onClick={() => setOffset(o => Math.min(MONTHS_AHEAD - 2, o + 1))} disabled={offset >= MONTHS_AHEAD - 2}
              className="mt-1 p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 flex-shrink-0">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
          {start && (
            <p className="text-sm text-gray-500 text-center mt-4 mb-3">
              {end ? `${fmtDesktop(start)} — ${fmtDesktop(end)} · ${n} night${n !== 1 ? 's' : ''}` : `Check-in: ${fmtDesktop(start)} · Select check-out`}
            </p>
          )}
          <div className="flex gap-2 flex-wrap">
            {[{ key:'exact', label:'Exact dates' },{ key:'1', label:'± 1 day' },{ key:'2', label:'± 2 days' },{ key:'3', label:'± 3 days' },{ key:'7', label:'± 7 days' }].map(opt => (
              <button key={opt.key} onClick={() => setFlexibility(opt.key)}
                className={`px-4 py-1.5 rounded-full border text-sm font-semibold transition-colors ${flexibility === opt.key ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-300 text-gray-500 hover:border-gray-500'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div>
          <p className="font-semibold text-gray-900 text-sm mb-3">How long do you want to stay?</p>
          {[{ key:'weekend', label:'A weekend' },{ key:'week', label:'A week' },{ key:'month', label:'A month' },{ key:'other', label:'Other' }].map(opt => (
            <label key={opt.key} className="flex items-center gap-3 py-2.5 cursor-pointer" onClick={() => setFlexDuration(opt.key)}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${flexDuration === opt.key ? 'border-blue-600' : 'border-gray-400'}`}>
                {flexDuration === opt.key && <div className="w-2.5 h-2.5 rounded-full bg-blue-600"/>}
              </div>
              <span className="text-gray-900 text-sm">{opt.label}</span>
            </label>
          ))}
          <p className="font-semibold text-gray-900 text-sm mt-4 mb-3">When do you want to go?</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {monthCards.map(mc => {
              const sel = flexMonths.includes(mc.key);
              return (
                <button key={mc.key} onClick={() => setFlexMonths(prev => sel ? prev.filter(m => m !== mc.key) : prev.length < 3 ? [...prev, mc.key] : prev)}
                  className={`flex-shrink-0 w-20 rounded-xl border-2 p-2 text-center text-xs transition-colors ${sel ? 'border-blue-600 text-blue-600' : 'border-gray-200 text-gray-600'}`}>
                  <p className="font-bold">{mc.label}</p><p className="text-gray-400">{mc.year}</p>
                </button>
              );
            })}
          </div>
          {flexDuration && flexMonths.length > 0 && (
            <button onClick={() => {
              const [yr, mo] = flexMonths[0].split('-').map(Number);
              const s = new Date(yr, mo, 15);
              const daysMap: Record<string,number> = { weekend:2, week:7, month:30, other:14 };
              onConfirm(isoDate(s), isoDate(addDays(s, daysMap[flexDuration] ?? 7)));
            }} className="w-full mt-4 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm">Done</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── DesktopGuestsDropdown ─────────────────────────────────────────────────────
function DesktopGuestsDropdown({ adults: ia, children: ic, rooms: ir, onConfirm, onClose }: GuestsModalProps) {
  const [adults,   setAdults]   = useState(ia);
  const [children, setChildren] = useState(ic);
  const [rooms,    setRooms]    = useState(ir);
  const [work,     setWork]     = useState(false);
  const [pets,     setPets]     = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const onCloseCb = useCallback(onClose, []);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onCloseCb();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onCloseCb]);

  return (
    <div ref={ref} className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[200] p-5 w-80">
      {([
        { label: 'Adults',   val: adults,   set: setAdults,   min: 1 },
        { label: 'Children', val: children, set: setChildren, min: 0 },
        { label: 'Rooms',    val: rooms,    set: setRooms,    min: 1 },
      ] as { label: string; val: number; set: React.Dispatch<React.SetStateAction<number>>; min: number }[]).map(row => (
        <div key={row.label} className="flex items-center justify-between py-3.5 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">{row.label}</span>
          <div className="flex items-center gap-3">
            <button onClick={() => row.set((v: number) => Math.max(row.min, v - 1))} disabled={row.val === row.min}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-blue-600 font-bold text-lg hover:border-blue-600 disabled:text-gray-300 disabled:border-gray-200">−</button>
            <span className="w-5 text-center text-sm font-bold text-gray-900">{row.val}</span>
            <button onClick={() => row.set((v: number) => Math.min(20, v + 1))}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-blue-600 font-bold text-lg hover:border-blue-600">+</button>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between py-3.5 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-900">Traveling for work?</p>
        <button onClick={() => setWork(v => !v)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${work ? 'bg-blue-600' : 'bg-gray-300'}`}>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${work ? 'translate-x-5' : 'translate-x-0'}`}/>
        </button>
      </div>
      <div className="flex items-center justify-between py-3.5">
        <p className="text-sm font-semibold text-gray-900">Traveling with pets?</p>
        <button onClick={() => setPets(v => !v)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${pets ? 'bg-blue-600' : 'bg-gray-300'}`}>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${pets ? 'translate-x-5' : 'translate-x-0'}`}/>
        </button>
      </div>
      <button onClick={() => onConfirm(adults, children, rooms, pets)}
        className="w-full mt-3 py-3 rounded-xl border-2 border-blue-600 text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors">
        Done
      </button>
    </div>
  );
}

// ── SearchWidget (default export) ────────────────────────────────────────────
export default function SearchWidget() {
  const router   = useRouter();
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [checkIn,          setCheckIn]          = useState('');
  const [checkOut,         setCheckOut]         = useState('');
  const [adults,           setAdults]           = useState(2);
  const [children,         setChildren]         = useState(0);
  const [rooms,            setRooms]            = useState(1);
  const [pets,             setPets]             = useState(false);
  const [showMobileDate,   setShowMobileDate]   = useState(false);
  const [showDesktopDate,  setShowDesktopDate]  = useState(false);
  const [showMobileGuests, setShowMobileGuests] = useState(false);
  const [showDesktopGuests,setShowDesktopGuests]= useState(false);

  const guestLabel = `${adults} adult${adults !== 1 ? 's' : ''} · ${children} child${children !== 1 ? 'ren' : ''} · ${rooms} room${rooms !== 1 ? 's' : ''}`;
  const dateLabel  = checkIn && checkOut ? `${fmtDesktop(checkIn)} — ${fmtDesktop(checkOut)}` : 'Select dates';

  const canSearch = !!(checkIn && checkOut);

  const handleSearch = () => {
    if (!canSearch) return;
    router.push(`/stay/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${adults + children}&rooms=${rooms}&pets=${pets}`);
  };

  return (
    <>
      <div className="relative w-full">
        <div className="flex flex-col lg:flex-row rounded-2xl overflow-visible w-full p-2 gap-2" style={{ border: '3px solid #d97706' }}>

          {/* ── Dates ── */}
          {/* Mobile: two separate buttons → full-screen modal */}
          <div className="flex flex-1 bg-white rounded-xl lg:hidden">
            <button onClick={() => { setShowMobileDate(true); setShowMobileGuests(false); }}
              className="flex-1 px-4 py-3 border-r border-gray-200 text-left">
              <p className="text-xs text-gray-400 mb-0.5">Check-in</p>
              <p className="text-sm font-semibold text-gray-900">{fmt(checkIn) || 'Add date'}</p>
            </button>
            <button onClick={() => { setShowMobileDate(true); setShowMobileGuests(false); }}
              className="flex-1 px-4 py-3 text-left">
              <p className="text-xs text-gray-400 mb-0.5">Check-out</p>
              <p className="text-sm font-semibold text-gray-900">{fmt(checkOut) || 'Add date'}</p>
            </button>
          </div>

          {/* Desktop: single combined date button → inline dropdown */}
          <div className="hidden lg:block relative flex-1 bg-white rounded-xl">
            <button onClick={() => { setShowDesktopDate(v => !v); setShowDesktopGuests(false); }}
              className="w-full h-full px-5 py-3 text-left flex items-center gap-3">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Dates</p>
                <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{dateLabel}</p>
              </div>
            </button>
            {showDesktopDate && (
              <DesktopDateDropdown
                checkIn={checkIn} checkOut={checkOut}
                onConfirm={(ci, co) => { setCheckIn(ci); setCheckOut(co); setShowDesktopDate(false); }}
                onClose={() => setShowDesktopDate(false)}
              />
            )}
          </div>

          {/* ── Guests ── */}
          {/* Mobile: opens full-screen modal */}
          <div className="flex items-center bg-white rounded-xl lg:hidden">
            <button onClick={() => { setShowMobileGuests(true); setShowMobileDate(false); }} className="flex items-center justify-between gap-2 px-4 py-3 w-full text-left">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Guests</p>
                <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{guestLabel}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
            </button>
          </div>

          {/* Desktop: opens inline dropdown */}
          <div className="hidden lg:flex items-center bg-white rounded-xl relative flex-shrink-0">
            <button onClick={() => { setShowDesktopGuests(v => !v); setShowDesktopDate(false); }} className="flex items-center gap-2 px-5 py-3 w-full text-left">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">Guests</p>
                <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">{guestLabel}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
            </button>
            {showDesktopGuests && (
              <DesktopGuestsDropdown
                adults={adults} children={children} rooms={rooms}
                onConfirm={(a, c, r) => { setAdults(a); setChildren(c); setRooms(r); setShowDesktopGuests(false); }}
                onClose={() => setShowDesktopGuests(false)}
              />
            )}
          </div>

          {/* Search */}
          <button onClick={handleSearch} disabled={!canSearch}
            className={`px-8 py-4 text-base font-bold text-white transition-all flex items-center justify-center flex-shrink-0 rounded-xl ${
              canSearch ? 'hover:opacity-90 active:scale-95 cursor-pointer' : 'opacity-40 cursor-not-allowed'
            }`}
            style={{ background: '#16a34a' }}
            title={!canSearch ? 'Please select check-in and check-out dates' : ''}>
            Search
          </button>
        </div>
      </div>

      {/* Mobile-only portals (never rendered on desktop since only mobile buttons trigger these) */}
      {showMobileDate && typeof document !== 'undefined' && createPortal(
        <DatePickerModal
          checkIn={checkIn} checkOut={checkOut}
          onConfirm={(ci, co) => { setCheckIn(ci); setCheckOut(co); setShowMobileDate(false); }}
          onClose={() => setShowMobileDate(false)}
        />,
        document.body
      )}
      {showMobileGuests && typeof document !== 'undefined' && createPortal(
        <GuestsModal
          adults={adults} children={children} rooms={rooms}
          onConfirm={(a, c, r, p) => { setAdults(a); setChildren(c); setRooms(r); setPets(p); setShowMobileGuests(false); }}
          onClose={() => setShowMobileGuests(false)}
        />,
        document.body
      )}
    </>
  );
}
