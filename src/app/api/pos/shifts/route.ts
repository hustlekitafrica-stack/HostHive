import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/pos/shifts?status=open|closed
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('pos_shifts')
      .select('*')
      .eq('host_user_id', session.user.id)
      .order('opened_at', { ascending: false })
      .limit(50);

    if (status === 'open' || status === 'closed') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ shifts: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/pos/shifts
// Body: { staff_id, staff_name, opening_float? }
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { staff_id, staff_name, opening_float } = body;

    if (!staff_id)   return NextResponse.json({ error: 'staff_id is required' }, { status: 400 });
    if (!staff_name) return NextResponse.json({ error: 'staff_name is required' }, { status: 400 });

    // Check for an already-open shift for this staff member
    const { data: existing, error: checkError } = await supabase
      .from('pos_shifts')
      .select('*')
      .eq('host_user_id', session.user.id)
      .eq('staff_id', staff_id)
      .eq('status', 'open')
      .maybeSingle();

    if (checkError) return NextResponse.json({ error: checkError.message }, { status: 400 });

    if (existing) {
      return NextResponse.json({ shift: existing, resumed: true });
    }

    // Open a new shift
    const { data, error } = await supabase
      .from('pos_shifts')
      .insert({
        host_user_id:  session.user.id,
        staff_id,
        staff_name,
        opening_float: opening_float ?? 0,
        status:        'open',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ shift: data, resumed: false }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
