import { NextRequest, NextResponse } from 'next/server';
import { publicSupabase } from '@/lib/supabase/public';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const checkIn    = searchParams.get('checkIn');
    const userId     = searchParams.get('userId');

    if (!propertyId || !checkIn) {
      return NextResponse.json({ discounts: [] });
    }

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let resolvedPropertyId = propertyId;
    if (!UUID_RE.test(propertyId)) {
      const { data: prop } = await publicSupabase.from('properties').select('id').eq('slug', propertyId).single();
      if (prop) resolvedPropertyId = prop.id;
    }

    const hostId = process.env.STAY_HOST_USER_ID ?? '';
    const today  = new Date();
    const checkInDate = new Date(checkIn);
    const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - today.getTime()) / 86400000);

    // Fetch all active discounts for this host
    const { data: allDiscounts, error } = await publicSupabase
      .from('discounts')
      .select('*, discount_properties(property_id)')
      .eq('host_user_id', hostId)
      .eq('is_active', true);

    if (error || !allDiscounts) return NextResponse.json({ discounts: [] });

    // Filter by date validity
    const todayStr = today.toISOString().slice(0, 10);
    const dateValid = allDiscounts.filter(d => {
      if (d.valid_from && todayStr < d.valid_from) return false;
      if (d.valid_until && todayStr > d.valid_until) return false;
      return true;
    });

    // Filter by property applicability
    const propertyValid = dateValid.filter(d => {
      const linked = (d.discount_properties ?? []) as { property_id: string }[];
      if (linked.length === 0) return true; // applies to all
      return linked.some(lp => lp.property_id === resolvedPropertyId);
    });

    // Determine which trigger conditions are met
    let isFirstTimer = false;
    let isLoggedIn   = false;

    if (userId) {
      isLoggedIn = true;

      // Check first-timer: does this user have any prior booking_requests?
      const { count } = await publicSupabase
        .from('booking_requests')
        .select('id', { count: 'exact', head: true })
        .eq('guest_user_id', userId);

      isFirstTimer = (count ?? 0) === 0;
    }

    // Check server-side session as a fallback for logged-in status
    if (!isLoggedIn) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) isLoggedIn = true;
      } catch { /* ignore */ }
    }

    // Evaluate each discount
    const applicable = propertyValid.filter(d => {
      switch (d.discount_type) {
        case 'first_timer':
          return isFirstTimer;
        case 'early_booking':
          return daysUntilCheckIn >= (d.early_booking_days ?? 1);
        case 'online_booking':
          return isLoggedIn;
        case 'manual':
          return false; // manual discounts never auto-apply
        default:
          return false;
      }
    });

    return NextResponse.json({ discounts: applicable });
  } catch (err) {
    console.error('[applicable-discounts]', err);
    return NextResponse.json({ discounts: [] });
  }
}
