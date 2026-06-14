import { Suspense } from 'react';
import { fetchAvailableProperties } from '@/lib/stay/fetchProperties';
import RoomsListClient from '@/components/stay/rooms/RoomsListClient';

type SearchParams = Promise<{ checkIn?: string; checkOut?: string; guests?: string; rooms?: string }>;

export default async function RoomsPage({ searchParams }: { searchParams: SearchParams }) {
  const p = await searchParams;
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const checkIn  = p.checkIn  ?? today;
  const checkOut = p.checkOut ?? tomorrow;
  const guests   = Number(p.guests ?? 2);
  const rooms    = Number(p.rooms  ?? 1);

  const properties = await fetchAvailableProperties(checkIn, checkOut);

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full" /></div>}>
      <RoomsListClient
        initialProperties={properties}
        initialCheckIn={checkIn}
        initialCheckOut={checkOut}
        initialGuests={guests}
        initialRooms={rooms}
      />
    </Suspense>
  );
}
