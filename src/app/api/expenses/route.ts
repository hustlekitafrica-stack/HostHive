import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('expenses')
      .select('id, date, category_name, vendor, gross, tax, net, receipt_url')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ expenses: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { date, category_name, vendor, gross, tax } = body;

    if (!date || !category_name || !vendor || gross === undefined) {
      return NextResponse.json({ error: 'date, category_name, vendor, and gross are required' }, { status: 400 });
    }

    const grossNum = parseFloat(gross) || 0;
    const taxNum = parseFloat(tax) || 0;
    const netNum = grossNum - taxNum;

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: session.user.id,
        date,
        category_name,
        vendor,
        gross: grossNum,
        tax: taxNum,
        net: netNum,
        amount: grossNum,
      })
      .select('id, date, category_name, vendor, gross, tax, net, receipt_url')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ expense: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
