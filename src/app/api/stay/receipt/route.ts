import { NextRequest, NextResponse } from 'next/server';
import { publicSupabase } from '@/lib/supabase/public';

/** GET /api/stay/receipt?token=... — public, no auth required */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 });

    const { data, error } = await publicSupabase
      .from('receipts')
      .select('*')
      .eq('receipt_token', token)
      .single();

    if (error || !data) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });

    // Also fetch KRA PIN from host profile
    let kraPin = '';
    if (data.host_user_id) {
      const { data: profile } = await publicSupabase
        .from('profiles')
        .select('kra_pin, business_name')
        .eq('id', data.host_user_id)
        .maybeSingle();
      kraPin = profile?.kra_pin ?? '';
    }

    return NextResponse.json({ receipt: data, kra_pin: kraPin });
  } catch (err) {
    console.error('[GET /api/stay/receipt]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
