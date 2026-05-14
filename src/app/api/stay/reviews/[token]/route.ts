import { NextRequest, NextResponse } from 'next/server';
import { publicSupabase } from '@/lib/supabase/public';

/** GET — fetch review record by token (to pre-fill guest name etc.) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { data, error } = await publicSupabase
    .from('reviews')
    .select('id, guest_name, property_name, stay_dates, submitted, rating, comment')
    .eq('review_token', token)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  return NextResponse.json({ review: data });
}

/** PATCH — guest submits their review */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { rating, comment } = await req.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating 1–5 is required' }, { status: 400 });
  }

  const { data: existing } = await publicSupabase
    .from('reviews')
    .select('id, submitted')
    .eq('review_token', token)
    .single();

  if (!existing) return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  if (existing.submitted) return NextResponse.json({ error: 'Review already submitted' }, { status: 409 });

  const { error } = await publicSupabase
    .from('reviews')
    .update({ rating, comment: comment?.trim() ?? '', submitted: true, submitted_at: new Date().toISOString() })
    .eq('review_token', token);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
