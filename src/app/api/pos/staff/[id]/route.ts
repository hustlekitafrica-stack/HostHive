import { NextRequest, NextResponse } from 'next/server';
import { getPosAuth } from '@/lib/pos/device-auth';
import bcrypt from 'bcryptjs';

const VALID_ROLES = ['manager', 'cashier', 'waiter', 'barman', 'stock_manager'] as const;
const PIN_REGEX = /^\d{4}$/;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const posAuth = await getPosAuth(request);
    if (!posAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { host_user_id, supabase } = posAuth;

    const { id } = await params;
    const body = await request.json();
    const { name, role, active, pin } = body;

    if (role !== undefined && !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `role must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }
    if (pin !== undefined && !PIN_REGEX.test(String(pin))) {
      return NextResponse.json({ error: 'pin must be exactly 4 digits' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (active !== undefined) updates.active = active;
    if (pin !== undefined) {
      updates.pin_hash = await bcrypt.hash(String(pin), 10);
    }

    const { data, error } = await supabase
      .from('pos_staff')
      .update(updates)
      .eq('id', id)
      .eq('host_user_id', host_user_id)
      .select('id, host_user_id, name, role, active, created_at, updated_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });

    return NextResponse.json({ staff: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const posAuth = await getPosAuth(request);
    if (!posAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { host_user_id, supabase } = posAuth;

    const { id } = await params;

    const { data, error } = await supabase
      .from('pos_staff')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('host_user_id', host_user_id)
      .select('id, host_user_id, name, role, active, created_at, updated_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });

    return NextResponse.json({ success: true, staff: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
