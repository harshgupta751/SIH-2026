import { NextResponse } from 'next/server';
import { applicationStore } from '@/lib/db/application-store';
import { municipalAdapter } from '@/lib/interop/adapters/municipal.adapter';
import { auditLogger } from '@/lib/audit/audit-logger';
import { eventBus } from '@/lib/events/event-bus';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const { reason = 'Premises address zoning does not permit commercial establishment.', officerName = 'M. Kulkarni' } = body;

    const application = applicationStore.getApplication(params.id);
    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const muniAppNo = application.municipalPermitRef || params.id;
    await municipalAdapter.rejectTradeApplication(muniAppNo, reason);

    applicationStore.updateApplication(application.id, {
      status: 'REJECTED',
      officerComments: reason,
    });

    applicationStore.addTimelineEvent(application.id, {
      stage: 'REJECTED',
      status: 'ERROR',
      details: `Application rejected by Municipal Officer. Reason: ${reason}`,
      actor: `Municipal Officer (${officerName})`,
    });

    eventBus.publish('APPLICATION_REJECTED', {
      source: 'MUNICIPAL_OFFICER',
      applicationId: application.id,
      citizenId: application.citizenId,
      summary: `Application ${application.id} REJECTED. Reason: ${reason}`,
      metadata: { reason },
    });

    auditLogger.log({
      actorId: 'OFFICER-PUNE-MUNI-04',
      actorRole: 'DEPARTMENT_OFFICER',
      action: 'APPLICATION_REJECTED',
      entityType: 'APPLICATION',
      entityId: application.id,
      department: 'MUNICIPAL',
      purpose: 'Statutory Trade License Rejection',
      details: { reason, officerName },
    });

    return NextResponse.json({
      success: true,
      message: 'Application rejected',
      application: applicationStore.getApplication(params.id),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
