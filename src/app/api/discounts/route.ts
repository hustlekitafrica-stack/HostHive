import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: discounts, error } = await supabase
      .from('discounts')
      .select('*, discount_properties(property_id)')
      .eq('host_user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ discounts: discounts ?? [] });
  } catch (err) {
    console.error('[GET /api/discounts]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      name,
      description = '',
      discount_type,
      value_type,
      value,
      early_booking_days = null,
      valid_from = null,
      valid_until = null,
      is_active = true,
      property_ids = [],
    } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!discount_type) return NextResponse.json({ error: 'Discount type is required' }, { status: 400 });
    if (!value_type) return NextResponse.json({ error: 'Value type is required' }, { status: 400 });
    if (Number(value) <= 0) return NextResponse.json({ error: 'Value must be greater than 0' }, { status: 400 });

    const { data: discount, error } = await supabase
      .from('discounts')
      .insert({
        host_user_id:      session.user.id,
        name:              name.trim(),
        description:       description.trim(),
        discount_type,
        value_type,
        value:             Number(value),
        early_booking_days: discount_type === 'early_booking' ? (Number(early_booking_days) || null) : null,
        valid_from:        valid_from || null,
        valid_until:       valid_until || null,
        is_active,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Link to specific properties if provided
    if (discount && Array.isArray(property_ids) && property_ids.length > 0) {
      await supabase.from('discount_properties').insert(
        property_ids.map((pid: string) => ({ discount_id: discount.id, property_id: pid }))
      );
    }

    return NextResponse.json({ discount }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/discounts]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
