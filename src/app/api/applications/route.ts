import { NextResponse } from 'next/server';
import { applicationStore } from '@/lib/db/application-store';
import { consentManager } from '@/lib/consent/consent-manager';
import { auditLogger } from '@/lib/audit/audit-logger';
import { eventBus } from '@/lib/events/event-bus';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const citizenId = searchParams.get('citizenId');

  let list = applicationStore.getAllApplications();
  if (citizenId) {
    list = list.filter((a) => a.citizenId === citizenId);
  }

  return NextResponse.json({ success: true, count: list.length, applications: list });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      serviceId = 'BUSINESS_LICENSE',
      departmentId = 'MUNICIPAL',
      citizenId = 'CIT-3210',
      businessName = 'Rahul Enterprises',
      tradeCategory = 'COMMERCIAL_RETAIL',
    } = body;

    // 1. Create Application in MahaSetu Core
    const application = applicationStore.createApplication({
      citizenId,
      serviceId,
      departmentId,
      businessName,
      tradeCategory,
    });

    // 2. Discover Cross-Department Dependencies
    // Business License requires Revenue Department address and tax clearance
    const consent = consentManager.createConsentRequest({
      citizenId,
      applicationId: application.id,
      requestedByDept: 'MUNICIPAL',
      sourceDept: 'REVENUE',
      purpose: `Statutory verification of registered business premises and property tax clearance for ${businessName}`,
      dataFields: ['name', 'address', 'property_tax_cleared', 'land_holding_sqft'],
    });

    // 3. Emit Reactive Event (Kafka Semantics)
    eventBus.publish('APPLICATION_CREATED', {
      source: 'CITIZEN_PORTAL',
      applicationId: application.id,
      citizenId,
      summary: `Application ${application.id} initiated for ${businessName} (Requires Revenue Dept Consent)`,
      metadata: { serviceId, consentId: consent.id },
    });

    // 4. Record Non-Repudiation Audit Log
    auditLogger.log({
      actorId: citizenId,
      actorRole: 'CITIZEN',
      action: 'APPLICATION_CREATED',
      entityType: 'APPLICATION',
      entityId: application.id,
      department: 'MUNICIPAL',
      purpose: 'Trade License Application Initiation',
      details: { businessName, serviceId, consentRequired: true },
    });

    return NextResponse.json({
      success: true,
      application,
      consentRequired: true,
      consentRequest: consent,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
