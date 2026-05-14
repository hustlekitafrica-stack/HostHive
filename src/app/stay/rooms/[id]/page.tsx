'use client';

import { useState, useEffect, Suspense, use } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { BedDouble, Droplets, Users, Home as HomeIcon, MapPin, Clock, Check, ShieldOff, PawPrint, VolumeX, DoorOpen, Search, type LucideIcon } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-[#FFFBF5]">
      <div className="animate-spin w-10 h-10 border-2 rounded-full border-t-transparent" style={{ borderColor: '#9B1C1C', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!property) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#FFFBF5] pt-20">
      <Search className="w-16 h-16 text-gray-300" />
      <h2 className="text-2xl font-bold text-gray-900">Room not found</h2>
      <Link href="/stay/rooms" className="text-sm font-bold text-white px-6 py-3 rounded-xl" style={{ background: '#9B1C1C' }}>Back to Rooms</Link>
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
    <div className="min-h-screen bg-[#FFFBF5] pt-16">

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
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4a1010, #9B1C1C)' }}>
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
                    <s.Icon className="w-4 h-4 flex-shrink-0" style={{ color: '#9B1C1C' }} /><span>{s.label}</span>
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
                      <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#9B1C1C' }} />
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
                      <r.Icon className="w-4 h-4" style={{ color: '#9B1C1C' }} />{r.label}
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
          </div>

          {/* Right — sticky booking widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #1A0800, #4a1010)' }}>
                <div className="text-2xl font-black text-white">KSh {rate.toLocaleString()}</div>
                <div className="text-white/60 text-sm">per night · per room</div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Check In</label>
                    <input type="date" value={checkIn} min={today}
                      onChange={e => { setCheckIn(e.target.value); if (e.target.value >= checkOut) setCheckOut(''); }}
                      className="w-full text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-red-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Check Out</label>
                    <input type="date" value={checkOut} min={checkIn || today}
                      onChange={e => setCheckOut(e.target.value)}
                      className="w-full text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-red-800" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Guests</label>
                  <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2">
                    <button onClick={() => setGuests(g => Math.max(1, g - 1))} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 hover:border-gray-600">−</button>
                    <span className="flex-1 text-center text-sm font-semibold">{guests} guest{guests !== 1 ? 's' : ''}</span>
                    <button onClick={() => setGuests(g => Math.min(property.max_guests ?? 10, g + 1))} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 hover:border-gray-600">+</button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Rooms</label>
                  <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2">
                    <button onClick={() => setRooms(r => Math.max(1, r - 1))} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 hover:border-gray-600">−</button>
                    <span className="flex-1 text-center text-sm font-semibold">{rooms} room{rooms !== 1 ? 's' : ''}</span>
                    <button onClick={() => setRooms(r => r + 1)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 hover:border-gray-600">+</button>
                  </div>
                  {rooms > 1 && <p className="text-xs text-gray-400 mt-1">Great for groups travelling together</p>}
                </div>

                {nights > 0 && (
                  <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
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
                  className="w-full py-4 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: '#9B1C1C' }}>
                  Request Reservation
                </button>
                <p className="text-xs text-center text-gray-400">No payment now — we'll confirm within 2 hours.</p>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-2 rounded-full border-t-transparent" style={{ borderColor: '#9B1C1C', borderTopColor: 'transparent' }} /></div>}>
      <RoomDetailContent id={id} />
    </Suspense>
  );
}
