import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    // Default to current month if no params
    const now = new Date();
    const monthStart = fromParam ? new Date(fromParam) : new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = toParam ? new Date(toParam) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthStartStr = monthStart.toISOString().split('T')[0];
    const monthEndStr = monthEnd.toISOString().split('T')[0];
    const today = now.toISOString().split('T')[0];
    // Don't query future dates beyond today
    const effectiveEnd = monthEndStr > today ? today : monthEndStr;

    // Get all properties
    const { data: properties } = await supabase
      .from('properties')
      .select('id, name')
      .eq('user_id', userId)
      .neq('status', 'draft');

    if (!properties || properties.length === 0) {
      return NextResponse.json({ units: [] });
    }

    // Get bookings for the selected period
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, property_id, check_in, check_out, total_amount, nightly_rate, nights, status')
      .eq('user_id', userId)
      .gte('check_in', monthStartStr)
      .lte('check_in', effectiveEnd);

    // Get payment logs for the selected period
    const { data: payments } = await supabase
      .from('payment_logs')
      .select('amount, booking_id')
      .eq('user_id', userId)
      .gte('paid_at', monthStartStr + 'T00:00:00.000Z')
      .lte('paid_at', effectiveEnd + 'T23:59:59.999Z');

    // Calculate metrics per property
    const units = properties.map((prop) => {
      const propBookings = (bookings ?? []).filter(b => b.property_id === prop.id && b.status !== 'cancelled');
      const propPayments = (payments ?? []).filter(p => {
        const booking = (bookings ?? []).find(b => b.id === p.booking_id && b.property_id === prop.id);
        return !!booking;
      });

      const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
      const occupiedNights = propBookings.reduce((sum, b) => sum + Number(b.nights), 0);
      const adr = propBookings.length > 0
        ? Math.round(propBookings.reduce((s, b) => s + Number(b.nightly_rate), 0) / propBookings.length)
        : 0;
      const occupancy = daysInMonth > 0 ? Math.round((occupiedNights / daysInMonth) * 100) : 0;
      const revenue = propPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const bookingCount = propBookings.length;

      // Score: weighted calculation (occupancy 50%, revenue 30%, bookings 20%)
      const occupancyScore = Math.min(100, occupancy);
      const revenueScore = Math.min(100, (revenue / 50000) * 100); // Normalize to 50K
      const bookingScore = Math.min(100, bookingCount * 20);
      const score = Math.round(
        (occupancyScore * 0.5) + (revenueScore * 0.3) + (bookingScore * 0.2)
      );

      return {
        id: prop.id,
        name: prop.name,
        occupancy,
        revenue,
        bookings: bookingCount,
        score,
        adr,
      };
    });

    return NextResponse.json({ units });
  } catch (err) {
    console.error('[units/performance]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
