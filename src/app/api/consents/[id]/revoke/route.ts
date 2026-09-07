import { NextResponse } from 'next/server';
import { requireRoles, forbidden, clientIp } from '@/lib/auth/guards';
import { denyConsent, getConsent, revokeConsent } from '@/lib/consent/consent-manager';
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

    const body = await req.json().catch(() => ({}));
    const deny = Boolean(body.deny) || existing.status === 'PENDING';
    const consent = deny ? await denyConsent(params.id) : await revokeConsent(params.id);

    await eventBus.publish('CONSENT_REVOKED', {
      source: 'CITIZEN_PORTAL',
      applicationId: consent.applicationId,
      citizenId: consent.citizenId,
      summary: `Consent ${consent.status.toLowerCase()} (${consent.id})`,
      metadata: { consentId: consent.id },
    });

    await writeAudit({
      actorId: auth.user.id,
      actorRole: 'CITIZEN',
      action: consent.status === 'DENIED' ? 'CONSENT_DENIED' : 'CONSENT_REVOKED',
      entityType: 'CONSENT',
      entityId: consent.id,
      department: consent.requestedByDept,
      purpose: 'Citizen withdrew or denied data sharing',
      details: { consentId: consent.id, status: consent.status },
      ipAddress: clientIp(req),
    });

    return NextResponse.json({ success: true, consent });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not update consent';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
