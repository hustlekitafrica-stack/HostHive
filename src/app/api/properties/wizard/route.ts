import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

function missingEnv() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export async function POST(request: NextRequest) {
  try {
    if (missingEnv()) {
      return NextResponse.json({ error: { message: 'Supabase environment variables are not configured.' } }, { status: 500 });
    }

    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: { message: 'Not authenticated. Please log in and try again.' } }, { status: 401 });
    }
    const userId = session.user.id;

    const d = await request.json();

    const insertRow: Record<string, unknown> = {
      user_id: userId,
      name: d.title || 'Untitled Property',
      title: d.title || 'Untitled Property',
      type: d.propertyType || 'apartment',
      description: d.description || '',
      location: d.location?.neighbourhood || d.location?.address || 'Nairobi',
      address: d.location?.address || '',
      city: d.location?.city || 'Nairobi',
      county: d.location?.county || 'Nairobi',
      country: 'Kenya',
      building_name: d.location?.building || '',
      unit_number: d.location?.unit || '',
      floor_level: d.location?.floor || '',
      bedrooms: d.basics?.bedrooms ?? 1,
      bathrooms: d.basics?.bathrooms ?? 1,
      max_guests: d.basics?.maxGuests ?? 2,
      nightly_rate: parseFloat(d.pricing?.nightly) || 0,
      weekend_rate: parseFloat(d.pricing?.weekend) || 0,
      monthly_rate: parseFloat(d.pricing?.monthly) || 0,
      cleaning_fee: parseFloat(d.pricing?.cleaning) || 0,
      security_deposit: parseFloat(d.pricing?.deposit) || 0,
      min_stay_nights: parseInt(d.pricing?.minStay) || 1,
      max_stay_nights: parseInt(d.pricing?.maxStay) || 0,
      cover_photo: d.photos?.find((p: any) => p.isCover)?.url || d.photos?.[0]?.url || '',
      latitude: d.location?.lat || null,
      longitude: d.location?.lng || null,
      check_in_time: d.rules?.checkIn || '14:00',
      check_out_time: d.rules?.checkOut || '11:00',
      check_in_method: d.rules?.checkInMethod || '',
      check_in_instructions: d.rules?.instructions || '',
      caretaker_name: d.rules?.caretakerName || '',
      caretaker_phone: d.rules?.caretakerPhone || '',
      cancellation_policy: d.rules?.cancellation || 'moderate',
      house_rules: {
        noSmoking: d.rules?.noSmoking ?? true,
        noParties: d.rules?.noParties ?? true,
        noPets: d.rules?.noPets ?? true,
        quietHours: d.rules?.quietHours ?? true,
        childrenAllowed: d.rules?.childrenAllowed ?? false,
        couplesOnly: d.rules?.couplesOnly ?? false,
        noAlcohol: d.rules?.noAlcohol ?? false,
        adultsOnly: d.rules?.adultsOnly ?? false,
        removeShoes: d.rules?.removeShoes ?? false,
        sortRubbish: d.rules?.sortRubbish ?? false,
      },
      additional_rules: d.rules?.additionalRules || '',
      status: d.status || 'active',
    };
    if (d.setup_step != null) insertRow.setup_step = d.setup_step;

    const { data: property, error } = await supabase
      .from('properties')
      .insert(insertRow)
      .select()
      .single();

    if (error) {
      console.error('[wizard/POST] Supabase error:', error);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    const propertyId = property.id;

    if (Array.isArray(d.amenities) && d.amenities.length > 0) {
      const amenityRows = d.amenities.map((a: any) => ({
        property_id: propertyId,
        user_id: userId,
        name: typeof a === 'string' ? a : a.name,
        icon: typeof a === 'object' ? a.icon || null : null,
        category: typeof a === 'object' ? a.category || null : null,
      }));
      await supabase.from('property_amenities').insert(amenityRows);
    }

    if (Array.isArray(d.photos) && d.photos.length > 0) {
      const photoRows = d.photos.map((p: any, i: number) => ({
        property_id: propertyId,
        user_id: userId,
        url: p.url,
        thumbnail_url: p.thumbnail_url || null,
        sort_order: i,
      }));
      await supabase.from('property_photos').insert(photoRows);
    }

    return NextResponse.json({ property }, { status: 201 });
  } catch (err) {
    console.error('[wizard/POST] Unexpected error:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (missingEnv()) {
      return NextResponse.json({ error: { message: 'Supabase environment variables are not configured.' } }, { status: 500 });
    }

    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: { message: 'Not authenticated. Please log in and try again.' } }, { status: 401 });
    }
    const userId = session.user.id;

    const { id, ...d } = await request.json();
    if (!id) {
      return NextResponse.json({ error: { message: 'Property id is required for updates' } }, { status: 400 });
    }

    const { data: property, error } = await supabase
      .from('properties')
      .update({
        name: d.title || 'Untitled Property',
        title: d.title || 'Untitled Property',
        type: d.propertyType || 'apartment',
        description: d.description || '',
        location: d.location?.neighbourhood || '',
        address: d.location?.address || '',
        city: d.location?.city || 'Nairobi',
        county: d.location?.county || 'Nairobi',
        building_name: d.location?.building || '',
        unit_number: d.location?.unit || '',
        floor_level: d.location?.floor || '',
        bedrooms: d.basics?.bedrooms ?? 1,
        bathrooms: d.basics?.bathrooms ?? 1,
        max_guests: d.basics?.maxGuests ?? 2,
        nightly_rate: parseFloat(d.pricing?.nightly) || 0,
        weekend_rate: parseFloat(d.pricing?.weekend) || 0,
        monthly_rate: parseFloat(d.pricing?.monthly) || 0,
        cleaning_fee: parseFloat(d.pricing?.cleaning) || 0,
        security_deposit: parseFloat(d.pricing?.deposit) || 0,
        min_stay_nights: parseInt(d.pricing?.minStay) || 1,
        max_stay_nights: parseInt(d.pricing?.maxStay) || 0,
        cover_photo: d.photos?.find((p: any) => p.isCover)?.url || d.photos?.[0]?.url || '',
        latitude: d.location?.lat || null,
        longitude: d.location?.lng || null,
        check_in_time: d.rules?.checkIn || '14:00',
        check_out_time: d.rules?.checkOut || '11:00',
        check_in_method: d.rules?.checkInMethod || '',
        check_in_instructions: d.rules?.instructions || '',
        caretaker_name: d.rules?.caretakerName || '',
        caretaker_phone: d.rules?.caretakerPhone || '',
        cancellation_policy: d.rules?.cancellation || 'moderate',
        house_rules: {
          noSmoking: d.rules?.noSmoking ?? true,
          noParties: d.rules?.noParties ?? true,
          noPets: d.rules?.noPets ?? true,
          quietHours: d.rules?.quietHours ?? true,
          childrenAllowed: d.rules?.childrenAllowed ?? false,
          couplesOnly: d.rules?.couplesOnly ?? false,
          noAlcohol: d.rules?.noAlcohol ?? false,
          adultsOnly: d.rules?.adultsOnly ?? false,
          removeShoes: d.rules?.removeShoes ?? false,
          sortRubbish: d.rules?.sortRubbish ?? false,
        },
        additional_rules: d.rules?.additionalRules || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[wizard/PUT] Supabase error:', error);
      return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    }

    if (Array.isArray(d.amenities)) {
      await supabase.from('property_amenities').delete().eq('property_id', id).eq('user_id', userId);
      if (d.amenities.length > 0) {
        const amenityRows = d.amenities.map((a: any) => ({
          property_id: id,
          user_id: userId,
          name: typeof a === 'string' ? a : a.name,
          icon: typeof a === 'object' ? a.icon || null : null,
          category: typeof a === 'object' ? a.category || null : null,
        }));
        await supabase.from('property_amenities').insert(amenityRows);
      }
    }

    if (Array.isArray(d.photos)) {
      await supabase.from('property_photos').delete().eq('property_id', id).eq('user_id', userId);
      if (d.photos.length > 0) {
        const photoRows = d.photos.map((p: any, i: number) => ({
          property_id: id,
          user_id: userId,
          url: p.url,
          thumbnail_url: p.thumbnail_url || null,
          sort_order: i,
        }));
        await supabase.from('property_photos').insert(photoRows);
      }
    }

    return NextResponse.json({ property }, { status: 200 });
  } catch (err) {
    console.error('[wizard/PUT] Unexpected error:', err);
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 });
  }
}
