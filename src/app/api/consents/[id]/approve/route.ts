import { NextResponse } from 'next/server';
import { consentManager } from '@/lib/consent/consent-manager';
import { applicationStore } from '@/lib/db/application-store';
import { auditLogger } from '@/lib/audit/audit-logger';
import { eventBus } from '@/lib/events/event-bus';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const consent = consentManager.grantConsent(params.id);

    // Update application timeline if linked
    if (consent.applicationId) {
      applicationStore.addTimelineEvent(consent.applicationId, {
        stage: 'CONSENT_GRANTED',
        status: 'SUCCESS',
        details: `Citizen authorized data access to ${consent.requestedByDept} from ${consent.sourceDept}`,
        actor: `Citizen (${consent.citizenId})`,
      });
    }

    // Publish event
    eventBus.publish('CONSENT_GRANTED', {
      source: 'CITIZEN_CONSENT_PORTAL',
      applicationId: consent.applicationId,
      citizenId: consent.citizenId,
      summary: `Citizen granted data-sharing consent (${consent.dataFields.join(', ')})`,
      metadata: { consentId: consent.id, purpose: consent.purpose },
    });

    // Immutable Audit Log
    auditLogger.log({
      actorId: consent.citizenId,
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
    });

    return NextResponse.json({ success: true, consent });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
