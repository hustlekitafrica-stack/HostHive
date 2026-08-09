import { NextRequest, NextResponse } from 'next/server';
import { getPosAuth } from '@/lib/pos/device-auth';

const DEFAULT_SETTINGS = {
  kitchen_printer_ip: '',
  bar_printer_ip:     '',
  printer_port:       9100,
  receipt_header:     'BAR & RESTAURANT',
  receipt_footer:     'Thank you, see you again!',
  tax_label:          'VAT',
  tax_rate:           0,
  currency:           'KSh',
};

// GET /api/pos/settings
export async function GET(request: NextRequest) {
  try {
    const posAuth = await getPosAuth(request);
    if (!posAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { host_user_id, supabase } = posAuth;

    const { data, error } = await supabase
      .from('pos_settings')
      .select('*')
      .eq('host_user_id', host_user_id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Return row if found, otherwise return defaults (without persisting them)
    return NextResponse.json({ settings: data ?? { ...DEFAULT_SETTINGS, host_user_id: host_user_id } });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/pos/settings
// Body: any subset of settings fields — upserted on host_user_id.
export async function PATCH(request: NextRequest) {
  try {
    const posAuth = await getPosAuth(request);
    if (!posAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { host_user_id, supabase } = posAuth;

    const body = await request.json();

    const { data, error } = await supabase
      .from('pos_settings')
      .upsert(
        {
          ...body,
          host_user_id: host_user_id,
          updated_at:   new Date().toISOString(),
        },
        { onConflict: 'host_user_id' }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ settings: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
