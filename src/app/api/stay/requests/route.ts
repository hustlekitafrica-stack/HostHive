import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publicSupabase } from '@/lib/supabase/public';

/** GET — host fetches all booking requests for their properties */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await publicSupabase
      .from('booking_requests')
      .select('*')
      .eq('host_user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ requests: data ?? [] });
  } catch (err) {
    console.error('[GET /api/stay/requests]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
