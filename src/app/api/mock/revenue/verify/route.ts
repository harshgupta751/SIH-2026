export { dynamic, runtime } from '@/lib/api/route-config';

import { NextResponse } from 'next/server';
import { requireRoles } from '@/lib/auth/guards';
import { revenueMockSystem } from '@/lib/mock-departments/revenue-system';

export async function POST(req: Request) {
  const auth = requireRoles(['OFFICER_REVENUE', 'ADMIN']);
  if ('response' in auth) return auth.response;
  try {
    const body = await req.json();
    const mobile = String(body.mobile || '');
    const result = await revenueMockSystem.verifyAddressAndTax(mobile);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
