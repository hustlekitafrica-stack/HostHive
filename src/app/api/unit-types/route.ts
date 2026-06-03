import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('unit_types')
      .select('*')
      .eq('user_id', session.user.id)
      .order('sort_order')
      .order('name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ unit_types: data ?? [] });
  } catch (err) {
    console.error('[unit-types GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, description = '', sort_order = 0 } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const { data, error } = await supabase
      .from('unit_types')
      .insert({ user_id: session.user.id, name: name.trim(), description: description.trim(), sort_order })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'A unit type with that name already exists' }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ unit_type: data }, { status: 201 });
  } catch (err) {
    console.error('[unit-types POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
