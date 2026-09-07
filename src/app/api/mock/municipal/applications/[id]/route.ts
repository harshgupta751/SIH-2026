import { NextResponse } from 'next/server';
import { requireRoles } from '@/lib/auth/guards';
import { municipalMockSystem } from '@/lib/mock-departments/municipal-system';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = requireRoles(['OFFICER_MUNICIPAL', 'ADMIN']);
  if ('response' in auth) return auth.response;
  const app = await municipalMockSystem.getApplication(params.id);
  if (!app) {
    return NextResponse.json({ error: 'Application not found in municipal system' }, { status: 404 });
  }
  return NextResponse.json(app);
}
