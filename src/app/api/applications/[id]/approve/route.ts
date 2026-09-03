import { NextResponse } from 'next/server';
import { applicationStore } from '@/lib/db/application-store';
import { municipalAdapter } from '@/lib/interop/adapters/municipal.adapter';
import { auditLogger } from '@/lib/audit/audit-logger';
import { eventBus } from '@/lib/events/event-bus';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const { comments = 'All statutory clearances verified. Trade License sanctioned.', officerName = 'M. Kulkarni' } = body;

    const application = applicationStore.getApplication(params.id);
    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    // 1. Trigger Municipal System Approval
    const muniAppNo = application.municipalPermitRef || params.id;
    await municipalAdapter.approveTradeApplication(muniAppNo, comments);

    // 2. Update MahaSetu Central Application Record
    const licenseNumber = `MH-PUNE-MUNI-LIC-${Math.floor(10000 + Math.random() * 90000)}`;
    applicationStore.updateApplication(application.id, {
      status: 'APPROVED',
      municipalPermitRef: licenseNumber,
      officerComments: comments,
    });

    applicationStore.addTimelineEvent(application.id, {
      stage: 'APPROVED',
      status: 'SUCCESS',
      details: `Municipal Trade License Sanctioned (#${licenseNumber}). Revenue & Municipal interop verified.`,
      actor: `Municipal Officer (${officerName})`,
    });

    // 3. Publish Event (Kafka Semantics) - triggers instant SSE push
    eventBus.publish('APPLICATION_APPROVED', {
      source: 'MUNICIPAL_OFFICER',
      applicationId: application.id,
      citizenId: application.citizenId,
      summary: `🎉 Application ${application.id} APPROVED by ${officerName}. License: ${licenseNumber}`,
      metadata: { licenseNumber, comments },
    });

    // 4. Audit Log
    auditLogger.log({
      actorId: 'OFFICER-PUNE-MUNI-04',
      actorRole: 'DEPARTMENT_OFFICER',
      action: 'APPLICATION_APPROVED',
      entityType: 'APPLICATION',
      entityId: application.id,
      department: 'MUNICIPAL',
      purpose: 'Statutory Trade License Sanctioning',
      details: { licenseNumber, comments, officerName },
    });

    return NextResponse.json({
      success: true,
      message: 'Application approved successfully',
      application: applicationStore.getApplication(params.id),
      licenseNumber,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
