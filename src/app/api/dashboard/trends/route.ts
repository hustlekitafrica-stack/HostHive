import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    // Build last 12 calendar months (oldest → newest)
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const year  = d.getFullYear();
      const month = d.getMonth() + 1;
      const from  = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const to    = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-KE', { month: 'short', year: 'numeric' });
      return { year, month, from, to, label, days: lastDay };
    });

    const rangeFrom = months[0].from;
    const rangeTo   = months[11].to;

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

    const monthly = months.map(m => {
      const mb = bookings.filter(b => b.check_in >= m.from && b.check_in <= m.to);
      const me = expenses.filter(e => e.date    >= m.from && e.date    <= m.to);
      const revenue    = mb.reduce((s, b) => s + (Number(b.total_amount) || 0), 0);
      const gross      = me.reduce((s, e) => s + (Number(e.gross)        || 0), 0);
      const profit     = revenue - gross;
      const nights     = mb.reduce((s, b) => s + (Number(b.nights)       || 0), 0);
      const totalAvail = numProps * m.days;
      const occupancy  = totalAvail > 0 ? Math.round((nights / totalAvail) * 100) : 0;
      return { label: m.label, revenue, expenses: gross, profit, occupancy };
    });

    const withRevenue = monthly.filter(m => m.revenue > 0);
    const bestMonth    = withRevenue.length > 0 ? withRevenue.reduce((a, b) => b.revenue > a.revenue ? b : a) : null;
    const slowestMonth = withRevenue.length > 0 ? withRevenue.reduce((a, b) => b.revenue < a.revenue ? b : a) : null;
    const avgMonthly   = withRevenue.length > 0 ? Math.round(withRevenue.reduce((s, m) => s + m.revenue, 0) / withRevenue.length) : 0;

    return NextResponse.json({ monthly, bestMonth, slowestMonth, avgMonthly });
  } catch (err: any) {
    console.error('[dashboard/trends]', err?.message ?? err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
