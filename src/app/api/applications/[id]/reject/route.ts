export { dynamic, runtime } from '@/lib/api/route-config';

import { NextResponse } from 'next/server';
import { requireRoles, forbidden, clientIp } from '@/lib/auth/guards';
import { addTimelineEvent, getApplicationById, notifyCitizen, updateApplication } from '@/lib/db/application-store';
import { municipalAdapter } from '@/lib/interop/adapters/municipal.adapter';
import { writeAudit } from '@/lib/audit/audit-logger';
import { eventBus } from '@/lib/events/event-bus';

const ROLE_DEPT: Record<string, string> = {
  OFFICER_MUNICIPAL: 'MUNICIPAL',
  OFFICER_REVENUE: 'REVENUE',
  OFFICER_EMPLOYMENT: 'EMPLOYMENT',
};

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = requireRoles(['OFFICER_MUNICIPAL', 'OFFICER_REVENUE', 'OFFICER_EMPLOYMENT', 'ADMIN']);
  if ('response' in auth) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const reason = String(body.reason || 'Application does not meet statutory requirements.');
    const application = await getApplicationById(params.id);
    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const officerDept = ROLE_DEPT[auth.user.role];
    if (auth.user.role !== 'ADMIN' && officerDept && application.departmentId !== officerDept) {
      return forbidden('This application belongs to another department');
    }

    if (application.departmentId === 'MUNICIPAL' && application.municipalPermitRef) {
      await municipalAdapter.rejectTradeApplication(application.municipalPermitRef, reason);
    }

    await updateApplication(application.id, {
      status: 'REJECTED',
      officerComments: reason,
    });

    await addTimelineEvent(application.id, {
      stage: 'REJECTED',
      status: 'ERROR',
      details: `Application rejected. ${reason}`,
      actor: `Officer (${auth.user.name})`,
    });

    await eventBus.publish('APPLICATION_REJECTED', {
      source: 'DEPARTMENT_OFFICER',
      applicationId: application.id,
      citizenId: application.citizenId,
      summary: `Application ${application.applicationNumber} rejected`,
      metadata: { reason },
    });

    await writeAudit({
      actorId: auth.user.id,
      actorRole: auth.user.role,
      action: 'APPLICATION_REJECTED',
      entityType: 'APPLICATION',
      entityId: application.id,
      department: application.departmentId,
      purpose: 'Officer rejection',
      details: { reason, officerName: auth.user.name },
      ipAddress: clientIp(req),
    });

    await notifyCitizen(
      application.citizenId,
      'Application rejected',
      `Application ${application.applicationNumber} was rejected. ${reason}`,
      'WARNING'
    );

    return NextResponse.json({
      success: true,
      message: 'Application rejected',
      application: await getApplicationById(application.id),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Rejection failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
