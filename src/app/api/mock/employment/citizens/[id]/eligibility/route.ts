import { NextResponse } from 'next/server';
import { requireRoles } from '@/lib/auth/guards';
import { employmentAdapter } from '@/lib/interop/adapters/employment.adapter';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = requireRoles(['OFFICER_EMPLOYMENT', 'ADMIN', 'OFFICER_MUNICIPAL']);
  if ('response' in auth) return auth.response;
  const { searchParams } = new URL(req.url);
  const hasTradeLicense = searchParams.get('hasTradeLicense') === 'true';
  const eligibility = await employmentAdapter.checkEligibility(params.id, hasTradeLicense);
  return NextResponse.json({ success: true, eligibility });
}
