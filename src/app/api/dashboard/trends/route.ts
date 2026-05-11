import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

type Period = { from: string; to: string; label: string; days: number };

function buildPeriods(fromParam: string | null, toParam: string | null): Period[] {
  const now = new Date();

  if (!fromParam || !toParam) {
    // Default: last 12 calendar months
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const year  = d.getFullYear();
      const month = d.getMonth() + 1;
      const from  = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const to    = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-KE', { month: 'short', year: 'numeric' });
      return { from, to, label, days: lastDay };
    });
  }

  const fromDate  = new Date(fromParam + 'T00:00:00');
  const toDate    = new Date(toParam   + 'T00:00:00');
  const rangeDays = Math.round((toDate.getTime() - fromDate.getTime()) / 86400000) + 1;

  if (rangeDays <= 60) {
    // Daily grouping
    return Array.from({ length: rangeDays }, (_, i) => {
      const d = new Date(fromDate);
      d.setDate(fromDate.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const label = rangeDays === 1
        ? d.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
        : d.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' });
      return { from: iso, to: iso, label, days: 1 };
    });
  }

  if (rangeDays <= 365) {
    // Weekly grouping
    const periods: Period[] = [];
    let cur = new Date(fromDate);
    while (cur <= toDate) {
      const wFrom = cur.toISOString().split('T')[0];
      const wEnd  = new Date(cur);
      wEnd.setDate(cur.getDate() + 6);
      if (wEnd > toDate) wEnd.setTime(toDate.getTime());
      const wTo   = wEnd.toISOString().split('T')[0];
      const wDays = Math.round((wEnd.getTime() - cur.getTime()) / 86400000) + 1;
      const label = cur.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
      periods.push({ from: wFrom, to: wTo, label, days: wDays });
      cur.setDate(cur.getDate() + 7);
    }
    return periods;
  }

  // Monthly grouping (> 365 days)
  const periods: Period[] = [];
  let d = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  const lastMonth = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
  while (d <= lastMonth) {
    const year  = d.getFullYear();
    const month = d.getMonth() + 1;
    const from  = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to    = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-KE', { month: 'short', year: 'numeric' });
    periods.push({ from, to, label, days: lastDay });
    d = new Date(year, month, 1);
  }
  return periods;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from');
    const toParam   = searchParams.get('to');

    const periods   = buildPeriods(fromParam, toParam);
    const rangeFrom = periods[0].from;
    const rangeTo   = periods[periods.length - 1].to;

    const [bkRes, exRes, prRes] = await Promise.all([
      supabase.from('bookings')
        .select('check_in, total_amount, nights, status')
        .eq('user_id', userId)
        .not('status', 'in', '(cancelled,no_show,blocked)')
        .gte('check_in', rangeFrom)
        .lte('check_in', rangeTo),
      supabase.from('expenses')
        .select('date, gross')
        .eq('user_id', userId)
        .gte('date', rangeFrom)
        .lte('date', rangeTo),
      supabase.from('properties')
        .select('id')
        .eq('user_id', userId)
        .neq('status', 'draft'),
    ]);

    const bookings: any[] = bkRes.data ?? [];
    const expenses: any[] = exRes.data ?? [];
    const numProps = prRes.data?.length ?? 0;

    const monthly = periods.map(p => {
      const mb = bookings.filter(b => b.check_in >= p.from && b.check_in <= p.to);
      const me = expenses.filter(e => e.date    >= p.from && e.date    <= p.to);
      const revenue    = mb.reduce((s, b) => s + (Number(b.total_amount) || 0), 0);
      const gross      = me.reduce((s, e) => s + (Number(e.gross)        || 0), 0);
      const profit     = revenue - gross;
      const nights     = mb.reduce((s, b) => s + (Number(b.nights)       || 0), 0);
      const totalAvail = numProps * p.days;
      const occupancy  = totalAvail > 0 ? Math.min(100, Math.round((nights / totalAvail) * 100)) : 0;
      return { label: p.label, from: p.from, to: p.to, revenue, expenses: gross, profit, occupancy };
    });

    const withRevenue  = monthly.filter(m => m.revenue > 0);
    const bestMonth    = withRevenue.length > 0 ? withRevenue.reduce((a, b) => b.revenue > a.revenue ? b : a) : null;
    const slowestMonth = withRevenue.length > 0 ? withRevenue.reduce((a, b) => b.revenue < a.revenue ? b : a) : null;
    const avgMonthly   = withRevenue.length > 0 ? Math.round(withRevenue.reduce((s, m) => s + m.revenue, 0) / withRevenue.length) : 0;

    return NextResponse.json({ monthly, bestMonth, slowestMonth, avgMonthly });
  } catch (err: any) {
    console.error('[dashboard/trends]', err?.message ?? err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
