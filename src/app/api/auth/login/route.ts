import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/lib/supabase/admin';
import { createRouteClient } from '@/lib/supabase/route';
import { pinSchema } from '@/lib/validation/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin } = pinSchema.parse(body);

    const adminClient = createAdminClient();
    const { data: members, error } = await adminClient
      .from('team_members')
      .select('*')
      .eq('is_active', true);

    if (error) {
      return NextResponse.json(
        { error: { message: 'Unable to verify PIN' } },
        { status: 500 }
      );
    }

    const member = (members || []).find((m: { pin_hash: string }) =>
      m.pin_hash ? bcrypt.compareSync(pin, m.pin_hash) : false
    );

    if (!member) {
      return NextResponse.json(
        { error: { message: 'Invalid PIN' } },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      { message: 'Login successful', redirect: '/dashboard' },
      { status: 200 }
    );
    const supabase = createRouteClient(request, response);
    // Supabase requires ≥6-char passwords. Short PINs are padded with a fixed
    // suffix that only exists server-side; users still type just their PIN.
    const authPassword = pin.length < 6 ? pin + '__ks__' : pin;
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: member.email,
      password: authPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { error: { message: signInError.message } },
        { status: 401 }
      );
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: { message: error.message } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
