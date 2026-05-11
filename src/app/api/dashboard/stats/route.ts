import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (!from || !to) return NextResponse.json({ error: 'Missing date range' }, { status: 400 });

    const today = new Date().toISOString().split('T')[0];

    // Properties
    const { data: properties } = await supabase
      .from('properties')
      .select('id, name, status')
      .eq('user_id', userId)
      .neq('status', 'draft');
    const totalProperties = properties?.length ?? 0;

    // Bookings in period (by check_in date)
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, status, check_in, check_out, total_amount, cleaning_fee, booking_source, created_at, nightly_rate, nights, property_id')
      .eq('user_id', userId)
      .gte('check_in', from)
      .lte('check_in', to);

    const confirmed = (bookings ?? []).filter(b => b.status !== 'cancelled');
    const cancelled = (bookings ?? []).filter(b => b.status === 'cancelled');

    // Today's check-ins / check-outs (always today, not period-filtered)
    const { data: todayCheckins } = await supabase
      .from('bookings').select('id').eq('user_id', userId)
      .eq('check_in', today).neq('status', 'cancelled');

    const { data: todayCheckouts } = await supabase
      .from('bookings').select('id').eq('user_id', userId)
      .eq('check_out', today).neq('status', 'cancelled');

    // New bookings created today
    const { data: newToday } = await supabase
      .from('bookings').select('id').eq('user_id', userId)
      .gte('created_at', today + 'T00:00:00.000Z')
      .lte('created_at', today + 'T23:59:59.999Z');

    // Tentative / pending
    const { data: tentative } = await supabase
      .from('bookings').select('id').eq('user_id', userId)
      .in('status', ['tentative', 'pending']);

    // Payment logs in period
    const { data: payments } = await supabase
      .from('payment_logs')
      .select('amount, payment_method, paid_at')
      .eq('user_id', userId)
      .gte('paid_at', from + 'T00:00:00.000Z')
      .lte('paid_at', to + 'T23:59:59.999Z');

    const totalRevenue = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
    const mpesaRevenue = (payments ?? []).filter(p => p.payment_method === 'mpesa').reduce((s, p) => s + Number(p.amount), 0);
    const cashRevenue = (payments ?? []).filter(p => p.payment_method === 'cash').reduce((s, p) => s + Number(p.amount), 0);

    const stayRevenue = confirmed.reduce((s, b) => s + Number(b.nightly_rate) * Number(b.nights), 0);
    const cleaningRevenue = confirmed.reduce((s, b) => s + Number(b.cleaning_fee ?? 0), 0);
    const extraRevenue = Math.max(0, totalRevenue - stayRevenue - cleaningRevenue);

    // Occupancy
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const periodDays = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / 86400000) + 1);
    const totalNightsAvail = totalProperties * periodDays;
    const totalNightsBooked = confirmed.reduce((s, b) => s + Number(b.nights), 0);
    const occupancyRate = totalNightsAvail > 0 ? Math.round((totalNightsBooked / totalNightsAvail) * 100) : 0;

    // Currently occupied (active booking today)
    const occupiedNow = (properties ?? []).filter(p =>
      confirmed.some(b => b.property_id === p.id && b.check_in <= today && b.check_out > today)
    ).length;
    const blockedNow = 0; // blocked_dates table can be added later

    // ADR / RevPAR
    const adr = totalNightsBooked > 0 ? Math.round(stayRevenue / totalNightsBooked) : 0;
    const revpar = totalNightsAvail > 0 ? Math.round(stayRevenue / totalNightsAvail) : 0;

    // Projected revenue: confirmed future bookings
    const { data: futureBookings } = await supabase
      .from('bookings')
      .select('total_amount')
      .eq('user_id', userId)
      .gte('check_in', today)
      .neq('status', 'cancelled');
    const projectedRevenue = (futureBookings ?? []).reduce((s, b) => s + Number(b.total_amount), 0);

    // Forecast occupancy: next 7 and 30 days
    const next7 = new Date(today); next7.setDate(next7.getDate() + 7);
    const next30 = new Date(today); next30.setDate(next30.getDate() + 30);

    const { data: f7 } = await supabase.from('bookings').select('nights')
      .eq('user_id', userId).neq('status', 'cancelled')
      .gte('check_in', today).lte('check_in', next7.toISOString().split('T')[0]);
    const { data: f30 } = await supabase.from('bookings').select('nights')
      .eq('user_id', userId).neq('status', 'cancelled')
      .gte('check_in', today).lte('check_in', next30.toISOString().split('T')[0]);

    const f7Nights = (f7 ?? []).reduce((s, b) => s + Number(b.nights), 0);
    const f30Nights = (f30 ?? []).reduce((s, b) => s + Number(b.nights), 0);
    const forecast7Pct = totalProperties > 0 ? Math.round((f7Nights / (totalProperties * 7)) * 100) : 0;
    const forecast30Pct = totalProperties > 0 ? Math.round((f30Nights / (totalProperties * 30)) * 100) : 0;

    // Booking sources
    const sourceCounts: Record<string, number> = {};
    confirmed.forEach(b => {
      const src = (b.booking_source || 'direct').toLowerCase();
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    });

    // Cancellation rate
    const totalInPeriod = (bookings ?? []).length;
    const cancellationRate = totalInPeriod > 0
      ? Math.round((cancelled.length / totalInPeriod) * 1000) / 10
      : 0;

    // Cashflow grouped by date
    const cfMap: Record<string, { mpesa: number; cash: number }> = {};
    (payments ?? []).forEach(p => {
      const day = p.paid_at.split('T')[0];
      if (!cfMap[day]) cfMap[day] = { mpesa: 0, cash: 0 };
      if (p.payment_method === 'mpesa') cfMap[day].mpesa += Number(p.amount);
      else if (p.payment_method === 'cash') cfMap[day].cash += Number(p.amount);
    });
    const cashflow = Object.entries(cfMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, mpesa: v.mpesa, cash: v.cash, total: v.mpesa + v.cash }));

    // Per-property unit performance for the selected period
    const unitPerformance = (properties ?? []).map(p => {
      const pb = confirmed.filter(b => b.property_id === p.id);
      const propRevenue = pb.reduce((s, b) => s + Number(b.total_amount), 0);
      const propNights  = pb.reduce((s, b) => s + Number(b.nights), 0);
      const propOccPct  = Math.min(100, Math.round((propNights / periodDays) * 100));
      const propAvgStay = pb.length > 0 ? Math.round((propNights / pb.length) * 10) / 10 : 0;
      const isOccupied  = pb.some(b => b.check_in <= today && b.check_out > today);
      return {
        id: p.id,
        name: p.name,
        status: isOccupied ? 'occupied' : 'available',
        occupancyPct: propOccPct,
        revenue: propRevenue,
        avgStay: propAvgStay,
        bookings: pb.length,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const maxUnitRevenue = unitPerformance.reduce((m, u) => Math.max(m, u.revenue), 0);

    return NextResponse.json({
      occupancy: { rate: occupancyRate, occupied: occupiedNow, available: totalProperties - occupiedNow, blocked: blockedNow },
      properties: properties ?? [],
      unitPerformance,
      maxUnitRevenue,
      revenue: { total: totalRevenue, stay: stayRevenue, cleaning: cleaningRevenue, extra: extraRevenue, mpesa: mpesaRevenue, cash: cashRevenue, adr, revpar, projected: projectedRevenue },
      bookings: {
        roomsSold: confirmed.length,
        newToday: newToday?.length ?? 0,
        cancellations: cancelled.length,
        cancellationRate,
        checkInsToday: todayCheckins?.length ?? 0,
        checkOutsToday: todayCheckouts?.length ?? 0,
        tentative: tentative?.length ?? 0,
        sources: sourceCounts,
        total: totalInPeriod,
      },
      forecast: { next7: forecast7Pct, next30: forecast30Pct },
      cashflow,
    });
  } catch (err) {
    console.error('[dashboard/stats]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
