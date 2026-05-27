import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { property_ids, ...fields } = body;

    const updatePayload: Record<string, unknown> = {};
    const allowed = ['name','description','discount_type','value_type','value','early_booking_days','valid_from','valid_until','is_active'];
    for (const key of allowed) {
      if (key in fields) updatePayload[key] = fields[key] === '' ? null : fields[key];
    }
    if ('value' in updatePayload) updatePayload['value'] = Number(updatePayload['value']);

    const { data: discount, error } = await supabase
      .from('discounts')
      .update(updatePayload)
      .eq('id', id)
      .eq('host_user_id', session.user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Replace property assignments if provided
    if (discount && Array.isArray(property_ids)) {
      await supabase.from('discount_properties').delete().eq('discount_id', id);
      if (property_ids.length > 0) {
        await supabase.from('discount_properties').insert(
          property_ids.map((pid: string) => ({ discount_id: id, property_id: pid }))
        );
      }
    }

    return NextResponse.json({ discount });
  } catch (err) {
    console.error('[PATCH /api/discounts/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { error } = await supabase
      .from('discounts')
      .delete()
      .eq('id', id)
      .eq('host_user_id', session.user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/discounts/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
