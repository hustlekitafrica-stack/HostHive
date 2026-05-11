import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = !!ADMIN_EMAIL && session.user.email === ADMIN_EMAIL;
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { status, admin_notes } = body;

    const updates: Record<string, string> = {};
    if (status)      updates.status      = status;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ticket });
  } catch (err) {
    console.error('[support PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
