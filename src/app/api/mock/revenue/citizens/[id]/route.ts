export { dynamic, runtime } from '@/lib/api/route-config';

import { NextResponse } from 'next/server';
import { requireRoles } from '@/lib/auth/guards';
import { revenueMockSystem } from '@/lib/mock-departments/revenue-system';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = requireRoles(['OFFICER_REVENUE', 'ADMIN', 'OFFICER_MUNICIPAL']);
  if ('response' in auth) return auth.response;

  const citizen = await revenueMockSystem.getCitizenRecord(params.id);
  if (!citizen) {
    return NextResponse.json({ error: 'No record found in the revenue system' }, { status: 404 });
  }
  return NextResponse.json(citizen);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = requireRoles(['OFFICER_REVENUE', 'ADMIN']);
  if ('response' in auth) return auth.response;
  try {
    const body = await req.json();
    const record = await revenueMockSystem.setPropertyTaxCleared(params.id, Boolean(body.propertyTaxCleared));
    return NextResponse.json({ success: true, record });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
