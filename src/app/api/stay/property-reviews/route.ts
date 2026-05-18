import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const propertyId = req.nextUrl.searchParams.get('property_id');
  if (!propertyId) return NextResponse.json({ error: 'property_id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('property_reviews')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data ?? [], count: data?.length ?? 0 });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { property_id, rating, cleanliness, accuracy, checkin, communication, location_score, value_score, comment } = body;

  if (!property_id || !rating || !comment?.trim()) {
    return NextResponse.json({ error: 'property_id, rating and comment are required' }, { status: 400 });
  }

  const reviewer_name =
    session.user.user_metadata?.full_name ||
    session.user.email?.split('@')[0] ||
    'Guest';

  const { data, error } = await supabase
    .from('property_reviews')
    .upsert(
      { property_id, user_id: session.user.id, reviewer_name, rating, cleanliness, accuracy, checkin, communication, location_score, value_score, comment: comment.trim() },
      { onConflict: 'property_id,user_id' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review: data });
}
