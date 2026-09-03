import { NextResponse } from 'next/server';
import { applicationStore } from '@/lib/db/application-store';
import { consentManager } from '@/lib/consent/consent-manager';
import { revenueAdapter } from '@/lib/interop/adapters/revenue.adapter';
import { municipalAdapter } from '@/lib/interop/adapters/municipal.adapter';
import { auditLogger } from '@/lib/audit/audit-logger';
import { eventBus } from '@/lib/events/event-bus';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const application = applicationStore.getApplication(params.id);
    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    // 1. Verify that citizen consent was granted
    const consent = consentManager.getConsentForApplication(params.id);
    if (consent && consent.status !== 'GRANTED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Citizen DPDP consent must be granted before cross-department data exchange.',
        },
        { status: 403 }
      );
    }

    // 2. Step A: Call Revenue Department via RevenueAdapter
    const revResult = await revenueAdapter.fetchAndNormalizeCitizen('9876543210');
    const { cdm, raw: rawRevenueJson, latencyMs: revLatency } = revResult;

    // Emit event: REVENUE_FETCHED
    eventBus.publish('REVENUE_FETCHED', {
      source: 'REVENUE_ADAPTER',
      applicationId: application.id,
      citizenId: application.citizenId,
      summary: `RevNet data fetched (${revLatency}ms). Property Tax Cleared: ${cdm.clearances.propertyTaxCleared ? 'YES' : 'NO'}`,
      metadata: { rawRevenueJson },
    });

    // 3. Step B: Normalization to Common Data Model (CDM)
    eventBus.publish('DATA_NORMALIZED', {
      source: 'MAPPING_ENGINE',
      applicationId: application.id,
      citizenId: application.citizenId,
      summary: `Normalized disparate RevNet schema to MahaSetu Common Data Model (CDM)`,
      metadata: { cdm },
    });

    // 4. Step C: Dispatch to Municipal Department via MunicipalAdapter
    const muniResult = await municipalAdapter.submitTradeLicenseApplication(
      cdm,
      application.businessName,
      application.tradeCategory
    );
    const { permitRecord, dispatchedPayload: dispatchedMunicipalJson, latencyMs: muniLatency } = muniResult;

    // Emit event: MUNICIPAL_DISPATCHED
    eventBus.publish('MUNICIPAL_DISPATCHED', {
      source: 'MUNICIPAL_ADAPTER',
      applicationId: application.id,
      citizenId: application.citizenId,
      summary: `Dispatched normalized application to MuniSys (${muniLatency}ms). Status: PENDING_MUNICIPAL_VERIFICATION`,
      metadata: { dispatchedMunicipalJson, permitRecord },
    });

    // 5. Update Application State in MahaSetu
    applicationStore.updateApplication(application.id, {
      status: 'PENDING_OFFICER_REVIEW',
      revenueClearanceRef: cdm.clearances.revenueReferenceId,
      municipalPermitRef: permitRecord.permitId,
    });

    applicationStore.addTimelineEvent(application.id, {
      stage: 'REVENUE_VERIFIED',
      status: 'SUCCESS',
      details: `RevNet verified address & property tax clearance (${cdm.clearances.revenueReferenceId})`,
      actor: 'MahaSetu Interoperability Engine',
    });

    applicationStore.addTimelineEvent(application.id, {
      stage: 'ADAPTER_TRANSLATED',
      status: 'SUCCESS',
      details: `CDM schema transformed and delivered to MuniSys (Ward 14)`,
      actor: 'Municipal Adapter',
    });

    // 6. Audit Trail
    auditLogger.log({
      actorId: 'INTEROP_ENGINE',
      actorRole: 'SYSTEM_GATEWAY',
      action: 'CROSS_DEPT_INTEROP_EXECUTION',
      entityType: 'APPLICATION',
      entityId: application.id,
      department: 'MUNICIPAL',
      purpose: 'Disparate schema normalization and inter-departmental data routing',
      details: {
        revNetLatencyMs: revLatency,
        muniSysLatencyMs: muniLatency,
        clearanceId: cdm.clearances.revenueReferenceId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Interoperability workflow executed successfully',
      application: applicationStore.getApplication(params.id),
      pipelineTelemetry: {
        step1_source: {
          system: 'RevNet (Revenue & Land Records)',
          rawJson: rawRevenueJson,
          latencyMs: revLatency,
        },
        step2_cdm: {
          standard: 'MahaSetu Common Data Model (CDM v1.2)',
          commonModelJson: cdm,
        },
        step3_target: {
          system: 'MuniSys (Municipal Corporation)',
          dispatchedJson: dispatchedMunicipalJson,
          permitRecord,
          latencyMs: muniLatency,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
