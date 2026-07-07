import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

function missingEnv() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (missingEnv()) {
      return NextResponse.json(
        { error: { message: 'Supabase environment variables are not configured.' } },
        { status: 500 },
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: { message: 'Property ID is required.' } },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: { message: 'Not authenticated.' } },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    // Verify the property exists and belongs to this user
    const { data: property, error: fetchErr } = await supabase
      .from('properties')
      .select('id, name')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !property) {
      return NextResponse.json(
        { error: { message: 'Property not found or you do not have permission to delete it.' } },
        { status: 404 },
      );
    }

    // Safety check: block deletion if there are upcoming/active bookings
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('property_id', id)
      .in('status', ['confirmed', 'pending', 'blocked'])
      .gte('check_out', today);

    if (count && count > 0) {
      return NextResponse.json(
        { error: { message: `Cannot delete "${property.name}" — it has ${count} upcoming or active booking(s). Cancel or complete them first.` } },
        { status: 409 },
      );
    }

    // Delete related rows first, then the property
    await supabase.from('property_amenities').delete().eq('property_id', id);
    await supabase.from('property_photos').delete().eq('property_id', id);

    const { error: delErr } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (delErr) {
      console.error('[Delete Property]', delErr);
      return NextResponse.json(
        { error: { message: delErr.message || 'Failed to delete property.' } },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, message: `"${property.name}" has been deleted.` });
  } catch (err: any) {
    console.error('[Delete Property]', err);
    return NextResponse.json(
      { error: { message: 'An unexpected error occurred.' } },
      { status: 500 },
    );
  }
}
