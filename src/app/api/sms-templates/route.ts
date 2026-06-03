import { NextRequest, NextResponse } from 'next/server';
import { publicSupabase } from '@/lib/supabase/public';

const DEFAULT_TEMPLATES = [
  {
    key: 'booking_request_guest',
    label: 'Booking Request (to Guest)',
    body: 'Hi {{first_name}}! Your booking request for {{property_name}} ({{check_in}} - {{check_out}}, {{nights}} night{{nights_s}}) has been received. Ref: {{ref}}. Our team will confirm within 2 hours. - Kogelo Suites',
    variables: ['first_name','property_name','check_in','check_out','nights','nights_s','ref'],
  },
  {
    key: 'booking_request_admin',
    label: 'Booking Request (to Admin)',
    body: 'New booking request! Guest: {{guest_name}} ({{guest_phone}}) Room: {{property_name}} Dates: {{check_in}} - {{check_out}} ({{nights}} night{{nights_s}}) Total: KSh {{total}}. Log in to accept or decline.',
    variables: ['guest_name','guest_phone','property_name','check_in','check_out','nights','nights_s','total'],
  },
  {
    key: 'booking_accepted',
    label: 'Booking Accepted (to Guest)',
    body: 'Great news {{first_name}}! Your booking for {{property_name}} ({{check_in}} - {{check_out}}) has been ACCEPTED. Total: KSh {{total}}.{{payment_line}} - Kogelo Suites',
    variables: ['first_name','property_name','check_in','check_out','total','payment_line'],
  },
  {
    key: 'booking_declined',
    label: 'Booking Declined (to Guest)',
    body: 'Hi {{first_name}}, we regret your booking for {{property_name}} ({{check_in}} - {{check_out}}) could not be accommodated.{{reason_line}}{{call_line}} - Kogelo Suites',
    variables: ['first_name','property_name','check_in','check_out','reason_line','call_line'],
  },
  {
    key: 'review_request',
    label: 'Review Request (to Guest)',
    body: "Hi {{first_name}}! Thank you for staying with us. We'd love your feedback - please leave a quick review: {{review_url}} - Kogelo Suites",
    variables: ['first_name','review_url'],
  },
];

export async function GET() {
  const { data, error } = await publicSupabase
    .from('sms_templates')
    .select('key, label, body, variables')
    .order('key');

  // If table missing or empty, auto-seed defaults
  if (error || !data || data.length === 0) {
    if (!error) {
      // Table exists but empty — seed it
      await publicSupabase.from('sms_templates').upsert(
        DEFAULT_TEMPLATES.map(t => ({ ...t, updated_at: new Date().toISOString() })),
        { onConflict: 'key' }
      );
    }
    // Return the hardcoded defaults so the UI always shows something
    return NextResponse.json({ templates: DEFAULT_TEMPLATES });
  }

  return NextResponse.json({ templates: data });
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
