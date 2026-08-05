import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: { message: 'Public registration is disabled. Ask an admin to create an account.' } },
    { status: 403 }
  );
}
