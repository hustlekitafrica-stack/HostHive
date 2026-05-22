import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publicSupabase } from '@/lib/supabase/public';
import { sendSms } from '@/lib/sms';

/** GET — public: fetch submitted reviews; optional ?property_id=X for property-specific */
export async function GET(req: NextRequest) {
  const propertyId = req.nextUrl.searchParams.get('property_id');

  let query = publicSupabase
    .from('reviews')
    .select('id, guest_name, property_name, property_id, stay_dates, rating, comment, submitted_at, is_featured')
    .eq('submitted', true)
    .order('submitted_at', { ascending: false });

  if (propertyId) query = query.eq('property_id', propertyId);
  else query = query.limit(20);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data ?? [] });
}

/** POST — host creates a review request record and sends it via SMS */
export async function POST(req: NextRequest) {
  try {
    // Single-tenant: use STAY_HOST_USER_ID, fall back to session
    let hostId = process.env.STAY_HOST_USER_ID ?? '';
    if (!hostId) {
      const supabase = await createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      hostId = session.user.id;
    }

    const { booking_request_id, guest_name, guest_phone, property_id, property_name, stay_dates } = await req.json();
    if (!guest_name || !guest_phone) {
      return NextResponse.json({ error: 'guest_name and guest_phone are required' }, { status: 400 });
    }

    const { data, error } = await publicSupabase
      .from('reviews')
      .insert({
        booking_request_id: booking_request_id ?? null,
        guest_name,
        guest_phone,
        property_id: property_id ?? null,
        property_name: property_name ?? '',
        stay_dates: stay_dates ?? '',
        host_user_id: hostId,
      })
      .select('review_token')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const reviewUrl = `${baseUrl}/stay/review?token=${data.review_token}`;
    const firstName = guest_name.split(' ')[0];

    // Send SMS with review link
    const smsMessage = `Hi ${firstName}! Thank you for staying with us. We'd love your feedback - please leave a quick review here: ${reviewUrl} - Kogelo Suites`;
    const smsResult = await sendSms(guest_phone, smsMessage);

    // Also build WhatsApp link as fallback
    const waText = encodeURIComponent(`Hi ${guest_name}! 🙏 Thank you for staying with us at Kogelo.\n\nWe'd love to hear about your experience. Could you please leave us a quick review?\n👉 ${reviewUrl}\n\nIt takes less than a minute and means a lot to us!`);
    const waLink = `https://wa.me/${guest_phone.replace(/\D/g, '')}?text=${waText}`;

    if (!smsResult.ok) console.error('[SMS review] AT error:', smsResult.error);
    return NextResponse.json({ review_token: data.review_token, review_url: reviewUrl, whatsapp_link: waLink, sms_sent: smsResult.ok, sms_error: smsResult.error ?? null });
  } catch (err) {
    console.error('[POST /api/stay/reviews]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
