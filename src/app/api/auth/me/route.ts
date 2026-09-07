import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { unauthorized } from '@/lib/auth/guards';

export async function GET() {
  const user = getSession();
  if (!user) return unauthorized();
  return NextResponse.json({ success: true, user });
}
