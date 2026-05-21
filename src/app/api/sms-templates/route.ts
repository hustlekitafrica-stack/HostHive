import { NextRequest, NextResponse } from 'next/server';
import { publicSupabase } from '@/lib/supabase/public';

export async function GET() {
  const { data, error } = await publicSupabase
    .from('sms_templates')
    .select('key, label, body, variables')
    .order('key');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ templates: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const { key, body } = await req.json();
  if (!key || !body) return NextResponse.json({ error: 'key and body required' }, { status: 400 });
  const { error } = await publicSupabase
    .from('sms_templates')
    .update({ body, updated_at: new Date().toISOString() })
    .eq('key', key);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
