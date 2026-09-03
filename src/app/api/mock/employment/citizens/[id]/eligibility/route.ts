import { NextResponse } from 'next/server';
import { employmentMockSystem } from '@/lib/mock-departments/employment-system';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const hasTradeLicense = searchParams.get('hasTradeLicense') === 'true';
  const eligibility = employmentMockSystem.checkEligibility(params.id, hasTradeLicense);
  return NextResponse.json({ success: true, eligibility });
}
