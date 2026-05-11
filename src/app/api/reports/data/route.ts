import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/* eslint-disable @typescript-eslint/no-explicit-any */

type Row = (string | number)[];
type Summary = { label: string; value: string };

interface ReportData {
  title: string;
  period: string;
  summary: Summary[];
  columns: string[];
  rows: Row[];
}

function fmt(n: number) {
  return `KSh ${Number(n).toLocaleString()}`;
}

// bookings table: guest info is in guests(name, phone, email) via guest_id FK
// properties info is in properties(name) via property_id FK
// guest count: num_adults + num_children
// active statuses exclude: 'cancelled', 'no_show', 'blocked'
const ACTIVE_STATUSES = 'cancelled,no_show,blocked';

async function expenseReport(sb: any, uid: string, from: string, to: string): Promise<ReportData> {
  const { data, error } = await sb
    .from('expenses')
    .select('date, category_name, vendor, gross, tax, net')
    .eq('user_id', uid)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  const rows: any[] = data ?? [];
  const totalGross = rows.reduce((s, r) => s + (Number(r.gross) || 0), 0);
  const totalTax   = rows.reduce((s, r) => s + (Number(r.tax)   || 0), 0);
  const totalNet   = rows.reduce((s, r) => s + (Number(r.net)   || 0), 0);

  const byCategory: Record<string, number> = {};
  rows.forEach(r => {
    const k = r.category_name || 'Other';
    byCategory[k] = (byCategory[k] ?? 0) + (Number(r.gross) || 0);
  });
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  return {
    title: 'Expense Report',
    period: `${from} to ${to}`,
    summary: [
      { label: 'Total Gross',    value: fmt(totalGross) },
      { label: 'Total Tax',      value: fmt(totalTax) },
      { label: 'Total Net',      value: fmt(totalNet) },
      { label: 'No. of Records', value: String(rows.length) },
      { label: 'Top Category',   value: topCategory?.[0] ?? '—' },
    ],
    columns: ['Date', 'Category', 'Vendor / Service', 'Gross (KSh)', 'Tax (KSh)', 'Net (KSh)'],
    rows: rows.map(r => [
      r.date,
      r.category_name || '—',
      r.vendor        || '—',
      Number(r.gross) || 0,
      Number(r.tax)   || 0,
      Number(r.net)   || 0,
    ]),
  };
}

async function profitLossReport(sb: any, uid: string, from: string, to: string): Promise<ReportData> {
  const [bkRes, exRes] = await Promise.all([
    sb.from('bookings')
      .select('total_amount, booking_source')
      .eq('user_id', uid)
      .not('status', 'in', `(${ACTIVE_STATUSES})`)
      .gte('check_in', from)
      .lte('check_in', to),
    sb.from('expenses')
      .select('gross, category_name')
      .eq('user_id', uid)
      .gte('date', from)
      .lte('date', to),
  ]);

  const bookings: any[] = bkRes.data ?? [];
  const expenses: any[] = exRes.data ?? [];

  const totalIncome   = bookings.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
  const totalExpenses = expenses.reduce((s, r) => s + (Number(r.gross)        || 0), 0);
  const grossProfit   = totalIncome - totalExpenses;
  const margin        = totalIncome > 0 ? ((grossProfit / totalIncome) * 100).toFixed(1) : '0';

  const incomeBySource: Record<string, number> = {};
  bookings.forEach(r => {
    const k = r.booking_source || 'Direct';
    incomeBySource[k] = (incomeBySource[k] ?? 0) + (Number(r.total_amount) || 0);
  });

  const expByCategory: Record<string, number> = {};
  expenses.forEach(r => {
    const k = r.category_name || 'Uncategorised';
    expByCategory[k] = (expByCategory[k] ?? 0) + (Number(r.gross) || 0);
  });

  const incomeRows: Row[]  = Object.entries(incomeBySource).map(([s, v]) => [s, v, 'Income']);
  const expenseRows: Row[] = Object.entries(expByCategory).map(([c, v]) => [c, v, 'Expense']);

  return {
    title: 'Profit & Loss Statement',
    period: `${from} to ${to}`,
    summary: [
      { label: 'Total Income',    value: fmt(totalIncome) },
      { label: 'Total Expenses',  value: fmt(totalExpenses) },
      { label: 'Gross Profit',    value: fmt(grossProfit) },
      { label: 'Profit Margin',   value: `${margin}%` },
      { label: 'No. of Bookings', value: String(bookings.length) },
    ],
    columns: ['Description', 'Amount (KSh)', 'Type'],
    rows: [...incomeRows, ...expenseRows],
  };
}

async function revenueReport(sb: any, uid: string, from: string, to: string): Promise<ReportData> {
  const { data, error } = await sb
    .from('bookings')
    .select('check_in, check_out, nightly_rate, cleaning_fee, total_amount, amount_paid, balance_due, payment_status, booking_source, guests(name), properties(name)')
    .eq('user_id', uid)
    .not('status', 'in', `(${ACTIVE_STATUSES})`)
    .gte('check_in', from)
    .lte('check_in', to)
    .order('check_in', { ascending: false });

  if (error) throw new Error(error.message);
  const rows: any[] = data ?? [];
  const totalRev = rows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
  const totalPaid = rows.reduce((s, r) => s + (Number(r.amount_paid) || 0), 0);
  const avg      = rows.length > 0 ? Math.round(totalRev / rows.length) : 0;

  return {
    title: 'Revenue Report',
    period: `${from} to ${to}`,
    summary: [
      { label: 'Total Revenue',    value: fmt(totalRev) },
      { label: 'Total Collected',  value: fmt(totalPaid) },
      { label: 'No. of Bookings',  value: String(rows.length) },
      { label: 'Avg. per Booking', value: fmt(avg) },
    ],
    columns: ['Property', 'Guest', 'Check-In', 'Check-Out', 'Nightly Rate', 'Cleaning Fee', 'Total (KSh)', 'Paid (KSh)', 'Balance', 'Source'],
    rows: rows.map(r => [
      (r.properties as any)?.name    ?? '—',
      (r.guests     as any)?.name    ?? '—',
      r.check_in, r.check_out,
      Number(r.nightly_rate)  || 0,
      Number(r.cleaning_fee)  || 0,
      Number(r.total_amount)  || 0,
      Number(r.amount_paid)   || 0,
      Number(r.balance_due)   || 0,
      r.booking_source        || '—',
    ]),
  };
}

async function cashFlowReport(sb: any, uid: string, from: string, to: string): Promise<ReportData> {
  const [bkRes, exRes] = await Promise.all([
    sb.from('bookings')
      .select('check_in, total_amount, booking_source')
      .eq('user_id', uid)
      .not('status', 'in', `(${ACTIVE_STATUSES})`)
      .gte('check_in', from)
      .lte('check_in', to)
      .order('check_in'),
    sb.from('expenses')
      .select('date, gross, category_name')
      .eq('user_id', uid)
      .gte('date', from)
      .lte('date', to)
      .order('date'),
  ]);

  const income: any[]   = bkRes.data ?? [];
  const expenses: any[] = exRes.data ?? [];
  const totalIn  = income.reduce((s, r)   => s + (Number(r.total_amount) || 0), 0);
  const totalOut = expenses.reduce((s, r) => s + (Number(r.gross)        || 0), 0);

  const allRows = [
    ...income.map(r   => ({ date: r.check_in, desc: `Booking — ${r.booking_source || 'Direct'}`, in: Number(r.total_amount) || 0, out: 0 })),
    ...expenses.map(r => ({ date: r.date,     desc: r.category_name || 'Expense',                in: 0, out: Number(r.gross) || 0 })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  let balance = 0;
  const tableRows: Row[] = allRows.map(r => {
    balance += r.in - r.out;
    return [r.date, r.desc, r.in || '—', r.out || '—', balance];
  });

  return {
    title: 'Cash Flow Report',
    period: `${from} to ${to}`,
    summary: [
      { label: 'Money In',      value: fmt(totalIn) },
      { label: 'Money Out',     value: fmt(totalOut) },
      { label: 'Net Cash Flow', value: fmt(totalIn - totalOut) },
      { label: 'Transactions',  value: String(allRows.length) },
    ],
    columns: ['Date', 'Description', 'Money In (KSh)', 'Money Out (KSh)', 'Running Balance (KSh)'],
    rows: tableRows,
  };
}

async function bookingSummaryReport(sb: any, uid: string, from: string, to: string): Promise<ReportData> {
  const { data, error } = await sb
    .from('bookings')
    .select('check_in, check_out, nights, total_amount, amount_paid, balance_due, booking_source, status, payment_status, guests(name, phone), properties(name)')
    .eq('user_id', uid)
    .gte('check_in', from)
    .lte('check_in', to)
    .order('check_in', { ascending: false });

  if (error) throw new Error(error.message);
  const rows: any[] = data ?? [];
  const activeRows = rows.filter(r => !['cancelled', 'no_show', 'blocked'].includes(r.status));
  const totalAmt   = activeRows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);

  return {
    title: 'Booking Summary',
    period: `${from} to ${to}`,
    summary: [
      { label: 'Total Bookings', value: String(rows.length) },
      { label: 'Active Revenue', value: fmt(totalAmt) },
      { label: 'Confirmed',      value: String(rows.filter(r => r.status === 'confirmed').length) },
      { label: 'Cancelled',      value: String(rows.filter(r => r.status === 'cancelled').length) },
    ],
    columns: ['Guest', 'Phone', 'Property', 'Check-In', 'Check-Out', 'Nights', 'Total (KSh)', 'Paid (KSh)', 'Balance', 'Source', 'Status', 'Payment'],
    rows: rows.map(r => [
      (r.guests     as any)?.name  ?? '—',
      (r.guests     as any)?.phone ?? '—',
      (r.properties as any)?.name  ?? '—',
      r.check_in, r.check_out,
      r.nights         || 0,
      Number(r.total_amount) || 0,
      Number(r.amount_paid)  || 0,
      Number(r.balance_due)  || 0,
      r.booking_source || '—',
      r.status         || '—',
      r.payment_status || '—',
    ]),
  };
}

async function cancellationsReport(sb: any, uid: string, from: string, to: string): Promise<ReportData> {
  const { data, error } = await sb
    .from('bookings')
    .select('check_in, check_out, nights, total_amount, booking_source, guests(name, phone), properties(name)')
    .eq('user_id', uid)
    .eq('status', 'cancelled')
    .gte('check_in', from)
    .lte('check_in', to)
    .order('check_in', { ascending: false });

  if (error) throw new Error(error.message);
  const rows: any[] = data ?? [];
  const totalLost  = rows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);

  return {
    title: 'Cancellations Report',
    period: `${from} to ${to}`,
    summary: [
      { label: 'Cancellations', value: String(rows.length) },
      { label: 'Revenue Lost',  value: fmt(totalLost) },
    ],
    columns: ['Guest', 'Phone', 'Property', 'Check-In', 'Check-Out', 'Nights', 'Revenue Lost (KSh)', 'Source'],
    rows: rows.map(r => [
      (r.guests     as any)?.name  ?? '—',
      (r.guests     as any)?.phone ?? '—',
      (r.properties as any)?.name  ?? '—',
      r.check_in, r.check_out,
      r.nights                  || 0,
      Number(r.total_amount)    || 0,
      r.booking_source          || '—',
    ]),
  };
}

async function upcomingBookingsReport(sb: any, uid: string): Promise<ReportData> {
  const today = new Date().toISOString().split('T')[0];
  const in30  = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const { data, error } = await sb
    .from('bookings')
    .select('check_in, check_out, nights, total_amount, balance_due, booking_source, guests(name, phone, email), properties(name)')
    .eq('user_id', uid)
    .eq('status', 'confirmed')
    .gte('check_in', today)
    .lte('check_in', in30)
    .order('check_in', { ascending: true });

  if (error) throw new Error(error.message);
  const rows: any[] = data ?? [];
  const totalRev   = rows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
  const totalBal   = rows.reduce((s, r) => s + (Number(r.balance_due)  || 0), 0);

  return {
    title: 'Upcoming Bookings',
    period: `Next 30 days (${today} → ${in30})`,
    summary: [
      { label: 'Upcoming',         value: String(rows.length) },
      { label: 'Expected Revenue', value: fmt(totalRev) },
      { label: 'Outstanding',      value: fmt(totalBal) },
    ],
    columns: ['Guest', 'Phone', 'Email', 'Property', 'Check-In', 'Check-Out', 'Nights', 'Total (KSh)', 'Balance (KSh)', 'Source'],
    rows: rows.map(r => [
      (r.guests     as any)?.name  ?? '—',
      (r.guests     as any)?.phone ?? '—',
      (r.guests     as any)?.email ?? '—',
      (r.properties as any)?.name  ?? '—',
      r.check_in, r.check_out,
      r.nights                 || 0,
      Number(r.total_amount)   || 0,
      Number(r.balance_due)    || 0,
      r.booking_source         || '—',
    ]),
  };
}

async function guestDirectoryReport(sb: any, uid: string): Promise<ReportData> {
  // Pull directly from guests table — source of truth for guest records
  const { data: guestData, error: gErr } = await sb
    .from('guests')
    .select('id, name, phone, email, created_at')
    .eq('user_id', uid)
    .order('name', { ascending: true });

  if (gErr) throw new Error(gErr.message);
  const guests: any[] = guestData ?? [];

  // For each guest, count their bookings and total spend
  const { data: bkData } = await sb
    .from('bookings')
    .select('guest_id, total_amount, check_in, status')
    .eq('user_id', uid)
    .not('status', 'in', `(${ACTIVE_STATUSES})`);

  const bookings: any[] = bkData ?? [];

  const rows: Row[] = guests.map(g => {
    const gb     = bookings.filter(b => b.guest_id === g.id);
    const stays  = gb.length;
    const spent  = gb.reduce((s: number, b: any) => s + (Number(b.total_amount) || 0), 0);
    const last   = gb.sort((a: any, b: any) => b.check_in.localeCompare(a.check_in))[0]?.check_in ?? '—';
    return [g.name, g.phone ?? '—', g.email ?? '—', stays, fmt(spent), last];
  });

  return {
    title: 'Guest Directory',
    period: 'All time',
    summary: [{ label: 'Total Guests', value: String(guests.length) }],
    columns: ['Name', 'Phone', 'Email', 'Total Stays', 'Lifetime Spend', 'Last Stay'],
    rows,
  };
}

async function occupancyReport(sb: any, uid: string, from: string, to: string): Promise<ReportData> {
  const [prRes, bkRes] = await Promise.all([
    sb.from('properties').select('id, name').eq('user_id', uid).neq('status', 'draft').order('name'),
    sb.from('bookings')
      .select('property_id, check_in, check_out, nights')
      .eq('user_id', uid)
      .not('status', 'in', `(${ACTIVE_STATUSES})`)
      .or(`and(check_in.lte.${to},check_out.gte.${from})`),
  ]);

  const properties: any[] = prRes.data ?? [];
  const bookings: any[]   = bkRes.data ?? [];
  const fromMs = new Date(from).getTime();
  const toMs   = new Date(to).getTime();
  const totalDays = Math.max(1, Math.round((toMs - fromMs) / 86400000));

  const tableRows: Row[] = properties.map(p => {
    const pb = bookings.filter(b => b.property_id === p.id);
    const bookedNights = pb.reduce((s: number, b: any) => {
      const ci = Math.max(new Date(b.check_in).getTime(),  fromMs);
      const co = Math.min(new Date(b.check_out).getTime(), toMs);
      return s + Math.max(0, Math.round((co - ci) / 86400000));
    }, 0);
    const occ = Math.min(100, Math.round((bookedNights / totalDays) * 100));
    return [p.name, bookedNights, totalDays, `${occ}%`, pb.length];
  });

  const totalBooked = tableRows.reduce((s, r) => s + (Number(r[1]) || 0), 0);
  const totalAvail  = properties.length * totalDays;
  const portfolioOcc = totalAvail > 0 ? Math.round((totalBooked / totalAvail) * 100) : 0;

  return {
    title: 'Occupancy Report',
    period: `${from} to ${to}`,
    summary: [
      { label: 'Properties',      value: String(properties.length) },
      { label: 'Period (days)',    value: String(totalDays) },
      { label: 'Portfolio Occ.',  value: `${portfolioOcc}%` },
    ],
    columns: ['Property', 'Booked Nights', 'Period Days', 'Occupancy Rate', 'No. of Bookings'],
    rows: tableRows,
  };
}

async function dailyOperationsReport(sb: any, uid: string): Promise<ReportData> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await sb
    .from('bookings')
    .select('check_in, check_out, num_adults, num_children, booking_source, guests(name, phone), properties(name)')
    .eq('user_id', uid)
    .not('status', 'in', `(${ACTIVE_STATUSES})`)
    .or(`check_in.eq.${today},check_out.eq.${today},and(check_in.lt.${today},check_out.gt.${today})`);

  if (error) throw new Error(error.message);
  const rows: any[] = data ?? [];

  const checkIns  = rows.filter(r => r.check_in === today);
  const checkOuts = rows.filter(r => r.check_out === today && r.check_in !== today);
  const staying   = rows.filter(r => r.check_in < today && r.check_out > today);

  const guestCount = (r: any) => (r.num_adults || 1) + (r.num_children || 0);
  const totalGuests = rows.reduce((s, r) => s + guestCount(r), 0);

  const tag = (r: any, status: string): Row => [
    (r.guests     as any)?.name  ?? '—',
    (r.properties as any)?.name  ?? '—',
    status,
    r.check_in, r.check_out,
    guestCount(r),
    (r.guests     as any)?.phone ?? '—',
    r.booking_source || 'Direct',
  ];

  return {
    title: 'Daily Operations Sheet',
    period: `Today — ${today}`,
    summary: [
      { label: 'Check-Ins Today',   value: String(checkIns.length) },
      { label: 'Check-Outs Today',  value: String(checkOuts.length) },
      { label: 'Currently Staying', value: String(staying.length) },
      { label: 'Total Guests',      value: String(totalGuests) },
    ],
    columns: ['Guest Name', 'Property', 'Status', 'Check-In', 'Check-Out', 'Guests', 'Phone', 'Source'],
    rows: [
      ...checkIns.map(r  => tag(r, '✅ Check-In')),
      ...staying.map(r   => tag(r, '🏠 Staying')),
      ...checkOuts.map(r => tag(r, '🚪 Check-Out')),
    ],
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const uid = session.user.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? '';
    const year = new Date().getFullYear();
    const from = searchParams.get('from') ?? `${year}-01-01`;
    const to   = searchParams.get('to')   ?? new Date().toISOString().split('T')[0];

    let report: ReportData;

    switch (type) {
      case 'Expense Report':           report = await expenseReport(supabase, uid, from, to);           break;
      case 'Profit & Loss Statement':  report = await profitLossReport(supabase, uid, from, to);        break;
      case 'Revenue Report':           report = await revenueReport(supabase, uid, from, to);           break;
      case 'Cash Flow Report':         report = await cashFlowReport(supabase, uid, from, to);          break;
      case 'Booking Summary':          report = await bookingSummaryReport(supabase, uid, from, to);    break;
      case 'Cancellations Report':     report = await cancellationsReport(supabase, uid, from, to);     break;
      case 'Upcoming Bookings':        report = await upcomingBookingsReport(supabase, uid);            break;
      case 'Guest Directory':          report = await guestDirectoryReport(supabase, uid);              break;
      case 'Occupancy Report':         report = await occupancyReport(supabase, uid, from, to);         break;
      case 'Daily Operations Sheet':   report = await dailyOperationsReport(supabase, uid);             break;
      default: return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
    }

    return NextResponse.json(report);
  } catch (err: any) {
    console.error('[reports/data]', err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 });
  }
}
