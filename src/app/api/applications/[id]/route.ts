import { NextResponse } from 'next/server';
import { applicationStore } from '@/lib/db/application-store';
import { consentManager } from '@/lib/consent/consent-manager';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const application = applicationStore.getApplication(params.id);
  if (!application) {
    return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
  }

  const consent = consentManager.getConsentForApplication(params.id);

  return NextResponse.json({
    success: true,
    application,
    consent,
  });
}
