import { createClient } from '@/lib/supabase/server';
import { registerSchema } from '@/lib/validation/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    const supabase = await createClient();

    // Sign up user
    const { data, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          full_name: validatedData.fullName,
          business_name: validatedData.businessName,
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: { message: error.message } },
        { status: 400 }
      );
    }

    // Create profile (non-fatal — user is still registered even if this fails)
    if (data.user?.id) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: validatedData.email,
          full_name: validatedData.fullName,
          business_name: validatedData.businessName,
        });
      if (profileError) {
        console.error('[register] Profile insert failed (non-fatal):', profileError.message);
      }
    }

    return NextResponse.json(
      {
        message: 'Registration successful. Please check your email to confirm.',
        user: data.user,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: { message: error.message } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
