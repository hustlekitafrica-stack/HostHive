import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const VALID_ROLES = ['manager', 'cashier', 'waiter', 'barman', 'stock_manager'] as const;
const PIN_REGEX = /^\d{4}$/;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('pos_staff')
      .select('id, host_user_id, name, role, active, created_at, updated_at')
      .eq('host_user_id', session.user.id)
      .order('name', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ staff: data });
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
    const { name, role, pin } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `role must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }
    if (!pin || !PIN_REGEX.test(String(pin))) {
      return NextResponse.json({ error: 'pin must be exactly 4 digits' }, { status: 400 });
    }

    const pin_hash = await bcrypt.hash(String(pin), 10);

    const { data, error } = await supabase
      .from('pos_staff')
      .insert({
        host_user_id: session.user.id,
        name,
        role,
        pin_hash,
        active: true,
      })
      .select('id, host_user_id, name, role, active, created_at, updated_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ staff: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
