import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createTeamMemberSchema } from '@/lib/validation/auth';

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

export async function GET() {
  const { user, error } = await getCurrentUser();
  if (!user || error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: members, error: dbError } = await admin
    .from('team_members')
    .select('*')
    .order('created_at', { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ members });
}

export async function POST(request: NextRequest) {
  const { user, error } = await getCurrentUser();
  if (!user || error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createTeamMemberSchema.parse(body);

    const admin = createAdminClient();
    const { data: authData, error: createError } = await admin.auth.admin.createUser({
      email: data.email,
      password: data.pin,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    const authUser = authData.user;
    if (!authUser?.id) {
      return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 });
    }

    const pinHash = bcrypt.hashSync(data.pin, 10);
    const { error: insertError } = await admin.from('team_members').insert({
      user_id: authUser.id,
      email: data.email,
      full_name: data.fullName,
      role: data.role,
      access_level: data.accessLevel,
      pin_hash: pinHash,
      invitation_accepted: true,
      is_active: true,
    });

    if (insertError) {
      await admin.auth.admin.deleteUser(authUser.id);
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ member: { user_id: authUser.id, email: data.email, full_name: data.fullName } }, { status: 201 });
  } catch (err) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { user, error } = await getCurrentUser();
  if (!user || error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, fullName, email, role, accessLevel, pin, isActive } = body;
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: member, error: findError } = await admin
      .from('team_members')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (findError || !member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (fullName !== undefined) updates.full_name = fullName;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (accessLevel !== undefined) updates.access_level = accessLevel;
    if (isActive !== undefined) updates.is_active = isActive;

    if (pin) {
      updates.pin_hash = bcrypt.hashSync(pin, 10);
      const { error: updateAuthError } = await admin.auth.admin.updateUserById(member.user_id, {
        password: pin,
      });
      if (updateAuthError) {
        return NextResponse.json({ error: updateAuthError.message }, { status: 400 });
      }
    }

    const { error: updateError } = await admin
      .from('team_members')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error } = await getCurrentUser();
  if (!user || error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: member, error: findError } = await admin
      .from('team_members')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();

    if (findError || !member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    if (member.user_id) {
      await admin.auth.admin.deleteUser(member.user_id);
    }

    const { error: deleteError } = await admin.from('team_members').delete().eq('id', id);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
