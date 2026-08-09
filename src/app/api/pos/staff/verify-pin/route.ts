import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// No session check — this route is called from the POS login screen
// which may not have a Supabase session. Queries bypass RLS via the admin client.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { staff_id, pin } = body;

    if (!staff_id || !pin) {
      return NextResponse.json({ ok: false, error: 'staff_id and pin are required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const { data: staff, error } = await adminSupabase
      .from('pos_staff')
      .select('id, name, role, pin_hash, host_user_id, active')
      .eq('id', staff_id)
      .eq('active', true)
      .single();

    if (error || !staff) {
      return NextResponse.json({ ok: false, error: 'Staff member not found or inactive' });
    }

    const pinValid = await bcrypt.compare(String(pin), staff.pin_hash);

    if (!pinValid) {
      return NextResponse.json({ ok: false, error: 'Invalid PIN' });
    }

    return NextResponse.json({
      ok: true,
      staff: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
