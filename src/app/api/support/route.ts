import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = !!ADMIN_EMAIL && session.user.email === ADMIN_EMAIL;

    let query = supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('user_id', session.user.id);
    }

    const { data: tickets, error } = await query;
    if (error) throw error;

    return NextResponse.json({ tickets: tickets ?? [], isAdmin });
  } catch (err) {
    console.error('[support GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { subject, category, description, priority } = body;

    if (!subject?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 });
    }

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id:     session.user.id,
        user_email:  session.user.email,
        subject:     subject.trim(),
        category:    category || 'general',
        description: description.trim(),
        priority:    priority || 'normal',
        status:      'open',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err) {
    console.error('[support POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
