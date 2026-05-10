import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('expense_categories')
      .select('id, name, sort_order')
      .eq('user_id', session.user.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ categories: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    // Check limit (max 30)
    const { count } = await supabase
      .from('expense_categories')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.user.id);
    if ((count ?? 0) >= 30) return NextResponse.json({ error: 'Max 30 categories reached' }, { status: 400 });

    // Check duplicate
    const { data: existing } = await supabase
      .from('expense_categories')
      .select('id')
      .eq('user_id', session.user.id)
      .ilike('name', name.trim())
      .maybeSingle();
    if (existing) return NextResponse.json({ error: 'Category already exists' }, { status: 409 });

    const { data, error } = await supabase
      .from('expense_categories')
      .insert({ user_id: session.user.id, name: name.trim() })
      .select('id, name')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ category: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
