export { dynamic, runtime } from '@/lib/api/route-config';

import { NextResponse } from 'next/server';
import { requireRoles, forbidden, clientIp } from '@/lib/auth/guards';
import { grantConsent, getConsent } from '@/lib/consent/consent-manager';
import { addTimelineEvent } from '@/lib/db/application-store';
import { writeAudit } from '@/lib/audit/audit-logger';
import { eventBus } from '@/lib/events/event-bus';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = requireRoles(['CITIZEN']);
  if ('response' in auth) return auth.response;

  try {
    const existing = await getConsent(params.id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Consent not found' }, { status: 404 });
    }
    if (existing.citizenId !== auth.user.citizenId) return forbidden();

    const consent = await grantConsent(params.id);

    await addTimelineEvent(consent.applicationId, {
      stage: 'CONSENT_GRANTED',
      status: 'SUCCESS',
      details: `Citizen authorized ${consent.requestedByDept} to use ${consent.sourceDept} records`,
      actor: auth.user.name,
    });

    await eventBus.publish('CONSENT_GRANTED', {
      source: 'CITIZEN_PORTAL',
      applicationId: consent.applicationId,
      citizenId: consent.citizenId,
      summary: `Consent granted for fields: ${consent.dataFields.join(', ')}`,
      metadata: { consentId: consent.id, purpose: consent.purpose },
    });

    await writeAudit({
      actorId: auth.user.id,
      actorRole: 'CITIZEN',
      action: 'CONSENT_GRANTED',
      entityType: 'CONSENT',
      entityId: consent.id,
      department: consent.requestedByDept,
      purpose: consent.purpose,
      details: {
        sourceDept: consent.sourceDept,
        dataFields: consent.dataFields,
        expiresAt: consent.expiresAt,
      },
      ipAddress: clientIp(req),
    });

    return NextResponse.json({ success: true, consent });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not grant consent';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
