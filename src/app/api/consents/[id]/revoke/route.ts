import { NextResponse } from 'next/server';
import { consentManager } from '@/lib/consent/consent-manager';
import { auditLogger } from '@/lib/audit/audit-logger';
import { eventBus } from '@/lib/events/event-bus';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const consent = consentManager.revokeConsent(params.id);

    eventBus.publish('CONSENT_REVOKED', {
      source: 'CITIZEN_CONSENT_PORTAL',
      applicationId: consent.applicationId,
      citizenId: consent.citizenId,
      summary: `Citizen revoked previously granted data consent (${consent.id})`,
      metadata: { consentId: consent.id },
    });

    auditLogger.log({
      actorId: consent.citizenId,
      actorRole: 'CITIZEN',
      action: 'CONSENT_REVOKED',
      entityType: 'CONSENT',
      entityId: consent.id,
      department: consent.requestedByDept,
      purpose: 'Citizen initiated right to withdraw data consent under DPDP Act',
      details: { consentId: consent.id, revokedAt: consent.revokedAt },
    });

    return NextResponse.json({ success: true, consent });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
