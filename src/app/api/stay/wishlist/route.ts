import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/stay/wishlist  →  { property_ids: string[] }
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ property_ids: [] });
    }

    const { data, error } = await supabase
      .from('guest_wishlists')
      .select('property_id')
      .eq('user_id', session.user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ property_ids: (data ?? []).map((r: any) => r.property_id) });
  } catch (err) {
    console.error('[wishlist/GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/stay/wishlist  body: { property_id }
// Toggles: adds if not present, removes if present
// Returns: { wishlisted: boolean }
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { property_id } = await request.json();
    if (!property_id) return NextResponse.json({ error: 'property_id required' }, { status: 400 });

    const userId = session.user.id;

    // Check if already wishlisted
    const { data: existing, error: selectError } = await supabase
      .from('guest_wishlists')
      .select('id')
      .eq('user_id', userId)
      .eq('property_id', property_id)
      .maybeSingle();

    if (selectError) {
      console.error('[wishlist/POST] select error:', selectError.message);
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    if (existing) {
      // Remove
      const { error: deleteError } = await supabase
        .from('guest_wishlists')
        .delete()
        .eq('user_id', userId)
        .eq('property_id', property_id);
      if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
      return NextResponse.json({ wishlisted: false });
    } else {
      // Add
      const { error: insertError } = await supabase
        .from('guest_wishlists')
        .insert({ user_id: userId, property_id });
      if (insertError) {
        console.error('[wishlist/POST] insert error:', insertError.message);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      return NextResponse.json({ wishlisted: true });
    }
  } catch (err) {
    console.error('[wishlist/POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/stay/wishlist/properties  →  full property objects for wishlisted IDs
// (used by the wishlist page to render cards)
export async function PUT() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ properties: [] });
    }

    const { data: wishlistRows } = await supabase
      .from('guest_wishlists')
      .select('property_id')
      .eq('user_id', session.user.id);

    if (!wishlistRows?.length) return NextResponse.json({ properties: [] });

    const ids = wishlistRows.map((r: any) => r.property_id);

    const { data: properties, error } = await supabase
      .from('properties')
      .select('id, name, type, city, county, nightly_rate, max_guests, bedrooms, bathrooms, photos, amenities')
      .in('id', ids);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ properties: properties ?? [] });
  } catch (err) {
    console.error('[wishlist/PUT]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
