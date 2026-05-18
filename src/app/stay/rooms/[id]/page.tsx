'use client';

import { useState, useEffect, Suspense, use, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { BedDouble, Droplets, Users, Home as HomeIcon, MapPin, Clock, Check, ShieldOff, PawPrint, VolumeX, DoorOpen, Search, type LucideIcon } from 'lucide-react';

// ── Date helpers ──────────────────────────────────────────────────────────────
const CAL_DAY  = ['S','M','T','W','T','F','S'];
const CAL_MON  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function daysInMo(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDayMo(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function isoStr(d: Date) { return d.toISOString().split('T')[0]; }
function fmtShort(d: string) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`;
}

// ── InlinePicker ──────────────────────────────────────────────────────────────
interface InlinePickerProps {
  checkIn: string; checkOut: string;
  activeField: 'in' | 'out';
  onSelect: (field: 'in' | 'out', date: string) => void;
  onClear: () => void;
  onClose: () => void;
}
function InlinePicker({ checkIn, checkOut, activeField, onSelect, onClear, onClose }: InlinePickerProps) {
  const [offset, setOffset] = useState(0);
  const ref  = useRef<HTMLDivElement>(null);
  const today = isoStr(new Date());
  const now   = new Date();

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
        <p className="text-sm font-bold text-center mb-3">{CAL_MON[month]} {year}</p>
        <div className="grid grid-cols-7 mb-1">
          {CAL_DAY.map((d, i) => <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>)}
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
                className={['relative h-10 w-full flex items-center justify-center text-sm transition-colors',
                  isPast ? 'cursor-not-allowed' : 'cursor-pointer',
                  inRange ? 'bg-gray-100' : '',
                ].join(' ')}>
                {isPast ? (
                  <span className="line-through text-gray-300 text-xs">{day}</span>
                ) : (isCI || isCO) ? (
                  <>
                    <span className="absolute w-9 h-9 rounded-full bg-gray-900" />
                    <span className="relative text-white font-bold">{day}</span>
                  </>
                ) : (
                  <span className="relative font-semibold text-gray-900 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-200">{day}</span>
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
    <div ref={ref} className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 p-5">
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900">
          {activeField === 'in' ? 'Select check-in date' : 'Select checkout date'}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">Minimum stay: 2 nights</p>
      </div>
      <div className="flex items-start gap-2">
        <button onClick={() => setOffset(o => Math.max(0, o - 1))} disabled={offset === 0}
          className="mt-8 p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-20 flex-shrink-0">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="flex gap-6 flex-1">
          {renderMonth(leftD.getFullYear(), leftD.getMonth())}
          {renderMonth(rightD.getFullYear(), rightD.getMonth())}
        </div>
        <button onClick={() => setOffset(o => o + 1)}
          className="mt-8 p-1.5 rounded-full hover:bg-gray-100 flex-shrink-0">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 9h20M8 2v3M16 2v3"/>
        </svg>
        <button onClick={onClear} className="text-sm font-semibold underline text-gray-800 hover:text-gray-600">Clear dates</button>
      </div>
    </div>
  );
}

// ── ReviewsSection ────────────────────────────────────────────────────────────
const CAT_RATINGS = [
  { label: 'Cleanliness',    score: 4.9, icon: (<svg className="w-5 h-5 mx-auto mt-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75a.75.75 0 00-1.5 0v.75H6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 006 22.5h12a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018 4.5h-2.25V3.75a.75.75 0 00-1.5 0v.75h-4.5V3.75z"/></svg>) },
  { label: 'Accuracy',       score: 4.8, icon: (<svg className="w-5 h-5 mx-auto mt-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>) },
  { label: 'Check-in',       score: 4.9, icon: (<svg className="w-5 h-5 mx-auto mt-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>) },
  { label: 'Communication',  score: 4.8, icon: (<svg className="w-5 h-5 mx-auto mt-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>) },
  { label: 'Location',       score: 4.8, icon: (<svg className="w-5 h-5 mx-auto mt-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"/></svg>) },
  { label: 'Value',          score: 4.8, icon: (<svg className="w-5 h-5 mx-auto mt-1 text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z"/></svg>) },
];
const FILTER_TAGS = [
  { label: 'Hospitality', count: 8 },
  { label: 'Cleanliness', count: 5 },
  { label: 'Location',    count: 4 },
  { label: 'Comfort',     count: 3 },
  { label: 'Amenities',   count: 2 },
];
const STAR_DIST = [7, 3, 1, 1, 0];
const MOCK_REVIEWS = [
  { name: 'James M.',  initials: 'JM', years: '2 years',  date: 'April 2026',    stay: 'Stayed a few nights', text: "Excellent property! The room was spotlessly clean and exactly as described. The host was very responsive and friendly throughout our stay. Great location close to everything you need..." },
  { name: 'Amina W.',  initials: 'AW', years: '1 year',   date: 'March 2026',    stay: 'Stayed with family',  text: "Wonderful experience! Great for families with everything provided. Check-in was smooth and the host was incredibly helpful and welcoming. The room was spacious and comfortable..." },
  { name: 'Peter K.',  initials: 'PK', years: '3 years',  date: 'February 2026', stay: 'Stayed about a week', text: "Fantastic property in a great location. Amenities were top-notch and everything was very clean. The host goes above and beyond to make guests feel at home. Will definitely return..." },
  { name: 'Grace O.',  initials: 'GO', years: '2 years',  date: 'January 2026',  stay: 'Stayed a few nights', text: "Beautiful property with great views. The host was incredibly welcoming and made sure we had everything we needed. Room was immaculate and the bed was extremely comfortable..." },
];
const OVERALL_RATING = 4.92;
const REVIEW_COUNT   = 12;

function ReviewsSection() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [expanded,     setExpanded]     = useState<number[]>([]);
  const maxBar = Math.max(...STAR_DIST);

  return (
    <div className="pt-8 border-t border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-2 mb-0.5">
        <svg className="w-5 h-5 fill-gray-900" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        <span className="text-xl font-bold text-gray-900">{OVERALL_RATING} · {REVIEW_COUNT} reviews</span>
      </div>
      <p className="text-xs text-gray-400 underline cursor-pointer mb-6">How reviews work</p>

      {/* Rating breakdown */}
      <div className="flex flex-wrap gap-8 mb-6 pb-6 border-b border-gray-100">
        {/* Bar chart */}
        <div className="min-w-[110px]">
          <p className="text-xs font-semibold text-gray-700 mb-2">Overall rating</p>
          {STAR_DIST.map((count, i) => (
            <div key={i} className="flex items-center gap-2 mb-1.5">
              <span className="text-xs text-gray-500 w-2">{5 - i}</span>
              <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gray-900 rounded-full" style={{ width: `${maxBar > 0 ? (count / maxBar) * 100 : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
        {/* Category scores */}
        {CAT_RATINGS.map(c => (
          <div key={c.label} className="text-center min-w-[70px]">
            <p className="text-xs font-semibold text-gray-700 mb-1">{c.label}</p>
            <p className="text-xl font-bold text-gray-900">{c.score}</p>
            {c.icon}
          </div>
        ))}
      </div>

      {/* Filter tags */}
      <div className="flex flex-wrap gap-2 mb-8">
        {FILTER_TAGS.map(t => (
          <button key={t.label}
            onClick={() => setActiveFilter(f => f === t.label ? null : t.label)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${
              activeFilter === t.label
                ? 'border-gray-900 bg-gray-50 text-gray-900'
                : 'border-gray-200 text-gray-700 hover:border-gray-500'
            }`}>
            {t.label}
            <span className={activeFilter === t.label ? 'text-gray-500' : 'text-gray-400'}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Review cards — two column grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {MOCK_REVIEWS.map((r, i) => {
          const isExpanded = expanded.includes(i);
          const SHORT = 150;
          return (
            <div key={i}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: '#16a34a' }}>
                  {r.initials}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.years} staying here</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <svg key={j} className="w-3 h-3 fill-gray-900" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  ))}
                </div>
                <span className="text-xs text-gray-400">· {r.date} · {r.stay}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {isExpanded || r.text.length <= SHORT ? r.text.replace('...', '') : r.text.slice(0, SHORT) + '...'}
              </p>
              {r.text.length > SHORT && (
                <button
                  onClick={() => setExpanded(prev => isExpanded ? prev.filter(x => x !== i) : [...prev, i])}
                  className="text-sm font-bold underline text-gray-900 mt-1 hover:text-gray-600">
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoomDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [checkIn,  setCheckIn]  = useState(params.get('checkIn')  ?? today);
  const [checkOut, setCheckOut] = useState(params.get('checkOut') ?? tomorrow);
  const [guests,   setGuests]   = useState(Number(params.get('guests') ?? 1));
  const [rooms,    setRooms]    = useState(1);
  const [showPicker, setShowPicker] = useState<'in' | 'out' | null>(null);

  useEffect(() => {
    fetch(`/api/stay/properties/${id}`)
      .then(r => r.json())
      .then(d => setProperty(d.property ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  const nights = checkIn && checkOut && checkOut > checkIn
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000) : 0;
  const rate = Number(property?.nightly_rate ?? 0);
  const total = rate * nights * rooms;

  const handleBook = () => {
    router.push(`/stay/checkout?propertyId=${id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="animate-spin w-10 h-10 border-2 rounded-full border-t-transparent" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!property) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc] pt-20">
      <Search className="w-16 h-16 text-gray-300" />
      <h2 className="text-2xl font-bold text-gray-900">Room not found</h2>
      <Link href="/stay/rooms" className="text-sm font-bold text-white px-6 py-3 rounded-xl" style={{ background: '#16a34a' }}>Back to Rooms</Link>
    </div>
  );

  const photos: string[] = property.photos?.length ? property.photos : [];
  const amenities: string[] = property.amenities ?? [];

  const HOUSE_RULES = [
    { Icon: Clock,     label: `Check-in from ${property.check_in_time ?? '14:00'}` },
    { Icon: DoorOpen,  label: `Check-out by ${property.check_out_time ?? '11:00'}` },
    property.house_rules?.noSmoking  && { Icon: ShieldOff, label: 'No smoking' },
    property.house_rules?.noPets     && { Icon: PawPrint,  label: 'No pets' },
    property.house_rules?.noParties  && { Icon: VolumeX,   label: 'No parties / events' },
    property.house_rules?.quietHours && { Icon: VolumeX,   label: 'Quiet hours after 10pm' },
  ].filter(Boolean) as { Icon: LucideIcon; label: string }[];

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-16">

      {/* ── Photo Gallery ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-4">
          <Link href="/stay/rooms" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            All Rooms
          </Link>
        </div>

        {photos.length > 0 ? (
          <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-72 sm:h-96">
            <div className="col-span-2 row-span-2 relative cursor-pointer" onClick={() => { setPhotoIdx(0); setLightbox(true); }}>
              <img src={photos[0]} alt={property.name} className="w-full h-full object-cover hover:brightness-90 transition-all" />
            </div>
            {photos.slice(1, 5).map((url, i) => (
              <div key={i} className="relative cursor-pointer" onClick={() => { setPhotoIdx(i + 1); setLightbox(true); }}>
                <img src={url} alt="" className="w-full h-full object-cover hover:brightness-90 transition-all" />
                {i === 3 && photos.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">+{photos.length - 5} more</span>
                  </div>
                )}
              </div>
            ))}
            {Array.from({ length: Math.max(0, 4 - photos.length + 1) }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-gray-200" />
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a, #16a34a)' }}>
            <HomeIcon className="w-20 h-20 text-white/40" />
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={() => setLightbox(false)}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <button className="absolute left-4 text-white/80 hover:text-white" onClick={e => { e.stopPropagation(); setPhotoIdx(i => (i - 1 + photos.length) % photos.length); }}>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <img src={photos[photoIdx]} alt="" className="max-w-4xl max-h-[85vh] w-full object-contain px-16" onClick={e => e.stopPropagation()} />
          <button className="absolute right-4 text-white/80 hover:text-white" onClick={e => { e.stopPropagation(); setPhotoIdx(i => (i + 1) % photos.length); }}>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
          <div className="absolute bottom-4 text-white/60 text-sm">{photoIdx + 1} / {photos.length}</div>
        </div>
      )}

      {/* ── Content + Booking Sidebar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* Left — details */}
          <div className="lg:col-span-2 space-y-8">

            {/* Title */}
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900">{property.name}</h1>
                  <p className="text-gray-500 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {[property.location, property.city, property.county].filter(Boolean).join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-gray-900">KSh {rate.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">per night</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
                {[
                  { Icon: BedDouble, label: `${property.bedrooms ?? 1} Bedroom${(property.bedrooms ?? 1) !== 1 ? 's' : ''}` } as { Icon: LucideIcon; label: string },
                  { Icon: Droplets,  label: `${property.bathrooms ?? 1} Bathroom${(property.bathrooms ?? 1) !== 1 ? 's' : ''}` } as { Icon: LucideIcon; label: string },
                  { Icon: Users,     label: `Up to ${property.max_guests ?? 2} guests` } as { Icon: LucideIcon; label: string },
                  { Icon: HomeIcon,  label: `${(property.type || 'Room').charAt(0).toUpperCase() + (property.type || 'room').slice(1)}` } as { Icon: LucideIcon; label: string },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                    <s.Icon className="w-4 h-4 flex-shrink-0" style={{ color: '#16a34a' }} /><span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div>
                <h2 className="text-lg font-black text-gray-900 mb-3">About this room</h2>
                <p className="text-gray-600 leading-relaxed">{property.description}</p>
              </div>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div>
                <h2 className="text-lg font-black text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenities.map(a => (
                    <div key={a} className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#16a34a' }} />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* House rules */}
            {HOUSE_RULES.length > 0 && (
              <div>
                <h2 className="text-lg font-black text-gray-900 mb-4">House Rules</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {HOUSE_RULES.map(r => (
                    <div key={r.label} className="flex items-center gap-3 text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-3">
                      <r.Icon className="w-4 h-4" style={{ color: '#16a34a' }} />{r.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancellation */}
            {property.cancellation_policy && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <h2 className="text-sm font-black text-gray-900 mb-1">
                  Cancellation Policy — {(property.cancellation_policy).charAt(0).toUpperCase() + property.cancellation_policy.slice(1)}
                </h2>
                <p className="text-sm text-gray-600">
                  {property.cancellation_policy === 'flexible'  && 'Free cancellation up to 24 hours before check-in.'}
                  {property.cancellation_policy === 'moderate'  && 'Free cancellation up to 5 days before check-in.'}
                  {property.cancellation_policy === 'strict'    && 'No refund once booking is confirmed.'}
                  {property.cancellation_policy === 'non-refundable' && 'This rate is non-refundable.'}
                </p>
              </div>
            )}

            {/* Reviews */}
            <ReviewsSection />
          </div>

          {/* Right — Airbnb-style booking widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 relative">

                {/* Header */}
                {nights > 0 ? (
                  <div className="mb-5">
                    <span className="text-2xl font-black text-gray-900">KSh {rate.toLocaleString()}</span>
                    <span className="text-gray-500 text-sm"> / night</span>
                  </div>
                ) : (
                  <h3 className="text-xl font-bold text-gray-900 mb-5">Add dates for prices</h3>
                )}

                {/* Date + Guests fields */}
                <div className="rounded-xl border-2 border-gray-300 overflow-visible mb-4">
                  {/* Check-in / Checkout row */}
                  <div className="grid grid-cols-2">
                    <button
                      onClick={() => setShowPicker(v => v === 'in' ? null : 'in')}
                      className={`px-3 py-3 text-left border-r border-gray-200 transition-colors ${
                        showPicker === 'in' ? 'outline outline-2 -outline-offset-2 outline-gray-900 rounded-tl-xl' : ''
                      }`}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">Check-in</p>
                      <p className={`text-sm font-semibold ${checkIn ? 'text-gray-900' : 'text-gray-400'}`}>
                        {checkIn ? fmtShort(checkIn) : 'Add date'}
                      </p>
                    </button>
                    <button
                      onClick={() => setShowPicker(v => v === 'out' ? null : 'out')}
                      className={`px-3 py-3 text-left transition-colors ${
                        showPicker === 'out' ? 'outline outline-2 -outline-offset-2 outline-gray-900 rounded-tr-xl' : ''
                      }`}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">Checkout</p>
                      <p className={`text-sm font-semibold ${checkOut ? 'text-gray-900' : 'text-gray-400'}`}>
                        {checkOut ? fmtShort(checkOut) : 'Add date'}
                      </p>
                    </button>
                  </div>

                  {/* Guests row */}
                  <div className="border-t border-gray-200 px-3 py-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">Guests</p>
                      <select
                        value={guests}
                        onChange={e => setGuests(Number(e.target.value))}
                        className="text-sm font-semibold text-gray-900 bg-transparent outline-none w-full cursor-pointer">
                        {Array.from({ length: property.max_guests ?? 10 }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>{n} guest{n !== 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                    <svg className="w-4 h-4 text-gray-500 flex-shrink-0 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </div>

                {/* Inline date picker */}
                {showPicker && (
                  <InlinePicker
                    checkIn={checkIn} checkOut={checkOut}
                    activeField={showPicker}
                    onSelect={(field, date) => {
                      if (field === 'in') {
                        setCheckIn(date);
                        if (date >= checkOut) setCheckOut('');
                        setShowPicker('out');
                      } else {
                        setCheckOut(date);
                        setShowPicker(null);
                      }
                    }}
                    onClear={() => { setCheckIn(''); setCheckOut(''); setShowPicker(null); }}
                    onClose={() => setShowPicker(null)}
                  />
                )}

                {/* Price breakdown */}
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

                {/* CTA */}
                <button onClick={handleBook}
                  className="w-full py-3.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: '#e11d48' }}>
                  {nights > 0 ? 'Reserve' : 'Check availability'}
                </button>
                <p className="text-xs text-center text-gray-400 mt-3">No payment now — we'll confirm within 2 hours.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-2 rounded-full border-t-transparent" style={{ borderColor: '#16a34a', borderTopColor: 'transparent' }} /></div>}>
      <RoomDetailContent id={id} />
    </Suspense>
  );
}
