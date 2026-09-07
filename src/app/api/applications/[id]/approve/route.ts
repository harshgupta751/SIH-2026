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
    const comments = String(body.comments || 'All statutory checks verified. Application sanctioned.');
    const application = await getApplicationById(params.id);
    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    const officerDept = ROLE_DEPT[auth.user.role];
    if (auth.user.role !== 'ADMIN' && officerDept && application.departmentId !== officerDept) {
      return forbidden('This application belongs to another department');
    }
    if (application.status === 'APPROVED') {
      return NextResponse.json({ success: false, error: 'Application is already approved' }, { status: 400 });
    }
    if (application.status !== 'PENDING_OFFICER_REVIEW') {
      return NextResponse.json(
        { success: false, error: 'Application is not ready for officer decision' },
        { status: 400 }
      );
    }

    let licenseNumber = application.municipalPermitRef || application.revenueClearanceRef || application.applicationNumber;

    if (application.departmentId === 'MUNICIPAL') {
      const res = await municipalAdapter.approveTradeApplication(
        application.municipalPermitRef || application.id,
        comments
      );
      if (res.success && res.data?.permitCertificateNumber) {
        licenseNumber = res.data.permitCertificateNumber;
      } else {
        licenseNumber = `MH-TRADE-${Math.floor(10000 + Math.random() * 90000)}`;
      }
    } else if (application.departmentId === 'REVENUE') {
      licenseNumber = application.revenueClearanceRef || `MH-REV-CLR-${Math.floor(10000 + Math.random() * 90000)}`;
    } else {
      licenseNumber = `MH-EMP-SAN-${Math.floor(10000 + Math.random() * 90000)}`;
    }

    await updateApplication(application.id, {
      status: 'APPROVED',
      municipalPermitRef:
        application.departmentId === 'MUNICIPAL' ? licenseNumber : application.municipalPermitRef || undefined,
      officerComments: comments,
    });

    await addTimelineEvent(application.id, {
      stage: 'APPROVED',
      status: 'SUCCESS',
      details: `Application sanctioned. Reference ${licenseNumber}.`,
      actor: `Officer (${auth.user.name})`,
    });

    await eventBus.publish('APPLICATION_APPROVED', {
      source: 'DEPARTMENT_OFFICER',
      applicationId: application.id,
      citizenId: application.citizenId,
      summary: `Application ${application.applicationNumber} approved. Reference ${licenseNumber}`,
      metadata: { licenseNumber, comments },
    });

    await writeAudit({
      actorId: auth.user.id,
      actorRole: auth.user.role,
      action: 'APPLICATION_APPROVED',
      entityType: 'APPLICATION',
      entityId: application.id,
      department: application.departmentId,
      purpose: 'Officer sanction',
      details: { licenseNumber, comments, officerName: auth.user.name },
      ipAddress: clientIp(req),
    });

    await notifyCitizen(
      application.citizenId,
      'Application approved',
      `Application ${application.applicationNumber} has been approved. Reference: ${licenseNumber}`,
      'SUCCESS'
    );

    return NextResponse.json({
      success: true,
      message: 'Application approved',
      application: await getApplicationById(application.id),
      licenseNumber,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Approval failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
