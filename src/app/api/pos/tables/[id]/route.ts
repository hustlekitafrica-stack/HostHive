import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { name, section, capacity, status, current_order_id } = body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (section !== undefined) updates.section = section;
    if (capacity !== undefined) updates.capacity = capacity;
    if (status !== undefined) updates.status = status;
    if (current_order_id !== undefined) updates.current_order_id = current_order_id;

    const { data, error } = await supabase
      .from('pos_tables')
      .update(updates)
      .eq('id', id)
      .eq('host_user_id', session.user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: 'Table not found' }, { status: 404 });

    return NextResponse.json({ table: data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Fetch the table first to check status and ownership
    const { data: table, error: fetchError } = await supabase
      .from('pos_tables')
      .select('id, status')
      .eq('id', id)
      .eq('host_user_id', session.user.id)
      .single();

    if (fetchError || !table) return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    if (table.status !== 'available') {
      return NextResponse.json({ error: 'Only tables with status "available" can be deleted' }, { status: 400 });
    }

    const { error } = await supabase
      .from('pos_tables')
      .delete()
      .eq('id', id)
      .eq('host_user_id', session.user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
