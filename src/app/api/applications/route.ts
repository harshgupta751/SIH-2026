import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireRoles, requireSession, isOfficer, clientIp } from '@/lib/auth/guards';
import { createApplication, listApplications } from '@/lib/db/application-store';
import { createConsentRequest } from '@/lib/consent/consent-manager';
import { writeAudit } from '@/lib/audit/audit-logger';
import { eventBus } from '@/lib/events/event-bus';

function officerDeptCode(role: string): string | null {
  if (role === 'OFFICER_MUNICIPAL') return 'MUNICIPAL';
  if (role === 'OFFICER_REVENUE') return 'REVENUE';
  if (role === 'OFFICER_EMPLOYMENT') return 'EMPLOYMENT';
  return null;
}

export async function GET() {
  const auth = requireSession();
  if ('response' in auth) return auth.response;
  const { user } = auth;

  if (user.role === 'CITIZEN') {
    if (!user.citizenId) {
      return NextResponse.json({ success: false, error: 'Citizen profile missing' }, { status: 400 });
    }
    const applications = await listApplications({ citizenId: user.citizenId });
    return NextResponse.json({ success: true, count: applications.length, applications });
  }

  if (user.role === 'ADMIN') {
    const applications = await listApplications();
    return NextResponse.json({ success: true, count: applications.length, applications });
  }

  if (isOfficer(user.role)) {
    const code = officerDeptCode(user.role);
    const applications = await listApplications(code ? { departmentCode: code } : undefined);
    return NextResponse.json({ success: true, count: applications.length, applications });
  }

  return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
}

export async function POST(req: Request) {
  const auth = requireRoles(['CITIZEN']);
  if ('response' in auth) return auth.response;
  if (!auth.user.citizenId) {
    return NextResponse.json({ success: false, error: 'Citizen profile missing' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const serviceCode = String(body.serviceId || body.serviceCode || '').trim();
    if (!serviceCode) {
      return NextResponse.json({ success: false, error: 'serviceId is required' }, { status: 400 });
    }

    const service = await prisma.service.findUnique({
      where: { code: serviceCode },
      include: { department: true },
    });
    if (!service) {
      return NextResponse.json({ success: false, error: 'Unknown service' }, { status: 404 });
    }

    const businessName = String(body.businessName || '').trim();
    const tradeCategory = String(body.tradeCategory || '').trim();

    if (service.code === 'BUSINESS_LICENSE' && !businessName) {
      return NextResponse.json({ success: false, error: 'Business / establishment name is required' }, { status: 400 });
    }

    if (service.code === 'SKILL_SUBSIDY') {
      const license = await prisma.application.findFirst({
        where: {
          citizenId: auth.user.citizenId,
          status: 'APPROVED',
          service: { code: 'BUSINESS_LICENSE' },
        },
      });
      if (!license) {
        return NextResponse.json(
          {
            success: false,
            error: 'You need an approved municipal trade license before applying for this subsidy.',
          },
          { status: 400 }
        );
      }
    }

    const application = await createApplication({
      citizenId: auth.user.citizenId,
      serviceCode: service.code,
      businessName: businessName || service.name,
      tradeCategory,
      payload: body.payload || {},
    });

    const consentSpec = consentForService(service.code, service.name, businessName || service.name);
    const consent = await createConsentRequest({
      citizenId: auth.user.citizenId,
      applicationId: application.id,
      ...consentSpec,
    });

    await eventBus.publish('APPLICATION_CREATED', {
      source: 'CITIZEN_PORTAL',
      applicationId: application.id,
      citizenId: auth.user.citizenId,
      summary: `Application ${application.applicationNumber} created for ${service.name}`,
      metadata: { serviceId: service.code, consentId: consent.id },
    });

    await writeAudit({
      actorId: auth.user.id,
      actorRole: 'CITIZEN',
      action: 'APPLICATION_CREATED',
      entityType: 'APPLICATION',
      entityId: application.id,
      department: service.department.code,
      purpose: `${service.name} application`,
      details: { businessName, serviceCode: service.code, consentRequired: true },
      ipAddress: clientIp(req),
    });

    return NextResponse.json({
      success: true,
      application,
      consentRequired: true,
      consentRequest: consent,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not create application';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

function consentForService(code: string, serviceName: string, subject: string) {
  if (code === 'BUSINESS_LICENSE') {
    return {
      requestedByDept: 'MUNICIPAL',
      sourceDept: 'REVENUE',
      purpose: `Share registered address and property-tax status for ${subject} (${serviceName})`,
      dataFields: ['name', 'address', 'property_tax_cleared', 'land_holding_sqft'],
    };
  }
  if (code === 'ADDRESS_VERIFICATION') {
    return {
      requestedByDept: 'REVENUE',
      sourceDept: 'REVENUE',
      purpose: `Authorize retrieval of your land-record extract for ${serviceName}`,
      dataFields: ['name', 'address', 'property_tax_cleared', 'land_holding_sqft'],
    };
  }
  return {
    requestedByDept: 'EMPLOYMENT',
    sourceDept: 'MUNICIPAL',
    purpose: `Share approved trade-license and domicile records for ${serviceName}`,
    dataFields: ['name', 'address', 'trade_license', 'municipal_permit'],
  };
}
