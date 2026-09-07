import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/guards';
import { employmentMockSystem } from '@/lib/mock-departments/employment-system';

export async function GET() {
  const auth = requireSession();
  if ('response' in auth) return auth.response;
  const schemes = employmentMockSystem.getAvailableSchemes();
  return NextResponse.json({ success: true, schemes });
}
