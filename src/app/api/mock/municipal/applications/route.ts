import { NextResponse } from 'next/server';
import { requireRoles } from '@/lib/auth/guards';
import { municipalMockSystem } from '@/lib/mock-departments/municipal-system';

export async function GET() {
  const auth = requireRoles(['OFFICER_MUNICIPAL', 'ADMIN']);
  if ('response' in auth) return auth.response;
  const list = await municipalMockSystem.getAllApplications();
  return NextResponse.json({ success: true, count: list.length, applications: list });
}

export async function POST(req: Request) {
  const auth = requireRoles(['ADMIN', 'OFFICER_MUNICIPAL']);
  if ('response' in auth) return auth.response;
  try {
    const body = await req.json();
    const permitRecord = await municipalMockSystem.registerApplication(body);
    return NextResponse.json({ success: true, permitRecord });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
