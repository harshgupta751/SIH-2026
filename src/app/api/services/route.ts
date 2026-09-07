export { dynamic, runtime } from '@/lib/api/route-config';

import { NextResponse } from 'next/server';
import { getServices } from '@/lib/db/application-store';
import { requireSession } from '@/lib/auth/guards';

export async function GET() {
  const auth = requireSession();
  if ('response' in auth) return auth.response;
  const services = await getServices();
  return NextResponse.json({ success: true, services });
}
