import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publicSupabase } from '@/lib/supabase/public';

/** GET — public: fetch submitted reviews for home page carousel */
export async function GET() {
  const { data, error } = await publicSupabase
    .from('reviews')
    .select('id, guest_name, property_name, stay_dates, rating, comment, submitted_at, is_featured')
    .eq('submitted', true)
    .order('submitted_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data ?? [] });
}

/** POST — host creates a review request record and returns the WhatsApp link */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { booking_request_id, guest_name, guest_phone, property_name, stay_dates } = await req.json();
    if (!guest_name || !guest_phone) {
      return NextResponse.json({ error: 'guest_name and guest_phone are required' }, { status: 400 });
    }

    const { data, error } = await publicSupabase
      .from('reviews')
      .insert({
        booking_request_id: booking_request_id ?? null,
        guest_name,
        guest_phone,
        property_name: property_name ?? '',
        stay_dates: stay_dates ?? '',
        host_user_id: session.user.id,
      })
      .select('review_token')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const reviewUrl = `${baseUrl}/stay/review?token=${data.review_token}`;
    const waText = encodeURIComponent(
      `Hi ${guest_name}! 🙏 Thank you for staying with us at Kogelo.\n\nWe'd love to hear about your experience. Could you please leave us a quick review?\n👉 ${reviewUrl}\n\nIt takes less than a minute and means a lot to us!`
    );
    const waLink = `https://wa.me/${guest_phone.replace(/\D/g, '')}?text=${waText}`;

    return NextResponse.json({ review_token: data.review_token, review_url: reviewUrl, whatsapp_link: waLink });
  } catch (err) {
    console.error('[POST /api/stay/reviews]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
