import { NextResponse } from 'next/server';
import { requireSession, isOfficer, forbidden } from '@/lib/auth/guards';
import { getApplicationById } from '@/lib/db/application-store';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = requireSession();
  if ('response' in auth) return auth.response;

  const application = await getApplicationById(params.id);
  if (!application) {
    return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
  }

  if (auth.user.role === 'CITIZEN' && application.citizenId !== auth.user.citizenId) {
    return forbidden();
  }
  if (isOfficer(auth.user.role) && auth.user.departmentCode && application.departmentId !== auth.user.departmentCode) {
    return forbidden();
  }

  return NextResponse.json({
    success: true,
    application,
    consent: application.consent,
  });
}
