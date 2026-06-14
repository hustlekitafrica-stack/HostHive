import { notFound } from 'next/navigation';
import { MapPin, Clock, DoorOpen, ShieldOff, PawPrint, VolumeX } from 'lucide-react';
import { publicSupabase } from '@/lib/supabase/public';
import { isUUID, toRoomSlug } from '@/lib/stay/roomSlug';
import RoomDetailGallery from '@/components/stay/room-detail/RoomDetailGallery';
import RoomDetailBooking from '@/components/stay/room-detail/RoomDetailBooking';
import RoomDetailReviews from '@/components/stay/room-detail/RoomDetailReviews';

const IC = 'w-6 h-6 flex-shrink-0';

function AmenityIcon({ name }: { name: string }) {
  const lower = name.toLowerCase();
  if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('internet'))
    return <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>;
  if (lower.includes('kitchen') || lower.includes('cook') || lower.includes('fridge'))
    return <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3v7"/></svg>;
  if (lower.includes('tv') || lower.includes('television') || lower.includes('netflix'))
    return <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="13" rx="2"/><path strokeLinecap="round" d="M8 7L12 3l4 4"/></svg>;
  if (lower.includes('parking') || lower.includes('garage'))
    return <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
  if (lower.includes('pool') || lower.includes('swim'))
    return <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" d="M2 12c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0M2 18c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0"/><circle cx="7" cy="6" r="2"/><path strokeLinecap="round" d="M7 8v3"/></svg>;
  if (lower.includes('air') || lower.includes('ac') || lower.includes('climate'))
    return <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9.59 4.59A2 2 0 1011 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1019.5 12H2"/></svg>;
  if (lower.includes('workspace') || lower.includes('desk') || lower.includes('office'))
    return <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="14" rx="2"/><path strokeLinecap="round" d="M8 22h8M12 18v4"/></svg>;
  if (lower.includes('garden') || lower.includes('outdoor') || lower.includes('balcony'))
    return <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2a7 7 0 017 7c0 3.87-3.13 7-7 7s-7-3.13-7-7a7 7 0 017-7z"/><path strokeLinecap="round" d="M12 9v13M9 12l3-3 3 3"/></svg>;
  if (lower.includes('breakfast') || lower.includes('coffee'))
    return <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>;
  return <svg className={IC} fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>;
}

type PageParams   = Promise<{ id: string }>;
type SearchParams = Promise<{ checkIn?: string; checkOut?: string; guests?: string }>;

export default async function RoomDetailPage({
  params, searchParams,
}: {
  params: PageParams; searchParams: SearchParams;
}) {
  const { id: slug } = await params;
  const sp = await searchParams;
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const initialCheckIn  = sp.checkIn  ?? today;
  const initialCheckOut = sp.checkOut ?? tomorrow;
  const initialGuests   = Number(sp.guests ?? 1);

  const propCol = isUUID(slug) ? 'id' : 'slug';
  const { data: property } = await publicSupabase
    .from('properties')
    .select('id, name, type, description, location, city, county, bedrooms, bathrooms, max_guests, nightly_rate, check_in_time, check_out_time, cancellation_policy, house_rules, cover_photo, slug, status')
    .eq(propCol, slug)
    .eq('status', 'active')
    .single();

  if (!property) notFound();
  const id = property.id;

  const [photosResult, amenitiesResult] = await Promise.all([
    publicSupabase
      .from('property_photos')
      .select('url, sort_order')
      .eq('property_id', id)
      .order('sort_order'),
    publicSupabase
      .from('property_amenities')
      .select('name')
      .eq('property_id', id),
  ]);

  const photos    = photosResult.data?.map((p: any) => p.url) ?? (property.cover_photo ? [property.cover_photo] : []);
  const amenities = amenitiesResult.data?.map((a: any) => a.name) ?? [];

  const typeLabel = property.type && !isUUID(property.type)
    ? property.type.charAt(0).toUpperCase() + property.type.slice(1) : 'Room';

  const HOUSE_RULES = [
    { Icon: Clock,     label: 'Check-in from ' + (property.check_in_time  ?? '14:00') },
    { Icon: DoorOpen,  label: 'Check-out by '  + (property.check_out_time ?? '11:00') },
    property.house_rules?.noSmoking  && { Icon: ShieldOff, label: 'No smoking' },
    property.house_rules?.noPets     && { Icon: PawPrint,  label: 'No pets' },
    property.house_rules?.noParties  && { Icon: VolumeX,   label: 'No parties / events' },
    property.house_rules?.quietHours && { Icon: VolumeX,   label: 'Quiet hours after 10pm' },
  ].filter(Boolean) as { Icon: any; label: string }[];

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ overflowX: 'clip' }}>

      {/* Photo gallery + wishlist — client interactive */}
      <RoomDetailGallery photos={photos} propertyName={property.name} propertyId={id} propertySlug={toRoomSlug(property.slug, property.name, id)} />

      {/* Mobile hero info — server rendered */}
      <div className="block sm:hidden bg-white px-4 pt-5 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{property.name}</h1>
        <p className="text-sm text-gray-600 mb-0.5">{typeLabel} in {[property.city, 'Kenya'].filter(Boolean).join(', ')}</p>
        <p className="text-sm text-gray-500 mb-4">
          {property.max_guests ?? 2} guests &middot;&nbsp;
          {property.bedrooms  ?? 1} bedroom{(property.bedrooms  ?? 1) !== 1 ? 's' : ''} &middot;&nbsp;
          {property.bathrooms ?? 1} bath{(property.bathrooms ?? 1) !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2 rounded-full px-4 py-2 w-fit" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <span className="text-sm font-semibold" style={{ color: '#16a34a' }}>Prices include all fees</span>
        </div>
      </div>

      {/* Desktop info bar — server rendered */}
      <div className="hidden sm:flex max-w-7xl mx-auto px-4 sm:px-6 py-4 flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-gray-900">
            {typeLabel} in {[property.city, property.county, 'Kenya'].filter(Boolean).join(', ')}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {property.max_guests ?? 2} guests &middot;&nbsp;
            {property.bedrooms  ?? 1} bedroom{(property.bedrooms  ?? 1) !== 1 ? 's' : ''} &middot;&nbsp;
            {property.bathrooms ?? 1} bath{(property.bathrooms ?? 1) !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full px-4 py-2 flex-shrink-0" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <span className="text-sm font-semibold" style={{ color: '#16a34a' }}>Prices include all fees</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-32 lg:pb-12">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* Left column — static SEO content, server rendered */}
          <div className="lg:col-span-2 space-y-8">

            {/* Location */}
            <div className="pb-4 border-b border-gray-100">
              <p className="text-gray-500 flex items-center gap-1.5 text-sm">
                <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#16a34a' }} />
                {[property.location, property.city, property.county].filter(Boolean).join(', ')}
              </p>
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
              <div className="pt-6 border-t border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6">What this place offers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
                  {amenities.slice(0, 10).map((a: string) => (
                    <div key={a} className="flex items-center gap-4 text-gray-800">
                      <span className="text-gray-600"><AmenityIcon name={a} /></span>
                      <span className="text-sm">{a}</span>
                    </div>
                  ))}
                </div>
                {amenities.length > 10 && (
                  <p className="mt-6 text-sm font-semibold text-gray-500">+ {amenities.length - 10} more amenities</p>
                )}
              </div>
            )}

            {/* House Rules */}
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

            {/* Cancellation Policy */}
            {property.cancellation_policy && (
              <div className="w-full bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <h2 className="text-sm font-black text-gray-900 mb-1">
                  Cancellation Policy &mdash; {property.cancellation_policy.charAt(0).toUpperCase() + property.cancellation_policy.slice(1)}
                </h2>
                <p className="text-sm text-gray-600">
                  {property.cancellation_policy === 'flexible'       && 'Free cancellation up to 24 hours before check-in.'}
                  {property.cancellation_policy === 'moderate'       && 'Free cancellation up to 5 days before check-in.'}
                  {property.cancellation_policy === 'strict'         && 'No refund once booking is confirmed.'}
                  {property.cancellation_policy === 'non-refundable' && 'This rate is non-refundable.'}
                </p>
              </div>
            )}

            {/* Reviews — client component, fetches its own data */}
            <RoomDetailReviews propertyId={id} propertyName={property.name} />

          </div>

          {/* Right column — booking widget (client) + mobile calendar (client) */}
          <RoomDetailBooking
            property={{
              id:              property.id,
              nightly_rate:    Number(property.nightly_rate    ?? 0),
              max_guests:      Number(property.max_guests      ?? 2),
              city:            property.city,
              county:          property.county,
              check_in_time:   property.check_in_time,
              check_out_time:  property.check_out_time,
            }}
            initialCheckIn={initialCheckIn}
            initialCheckOut={initialCheckOut}
            initialGuests={initialGuests}
          />

        </div>
      </div>

    </div>
  );
}
