import { prisma } from '@/lib/db/prisma';
import { revenueAdapter } from '@/lib/interop/adapters/revenue.adapter';
import { municipalAdapter } from '@/lib/interop/adapters/municipal.adapter';
import { employmentAdapter } from '@/lib/interop/adapters/employment.adapter';
import { getConsentForApplication } from '@/lib/consent/consent-manager';
import { addTimelineEvent, getApplicationById, notifyCitizen, updateApplication } from '@/lib/db/application-store';
import { writeAudit } from '@/lib/audit/audit-logger';
import { eventBus } from '@/lib/events/event-bus';

export async function assertConsentGranted(applicationId: string) {
  const consent = await getConsentForApplication(applicationId);
  if (!consent) throw new Error('Consent record is required before data exchange');
  if (consent.status !== 'GRANTED') {
    const err = new Error('Citizen consent must be granted before cross-department data exchange');
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  if (consent.expiresAt && new Date(consent.expiresAt) < new Date()) {
    const err = new Error('Consent has expired. Request a new authorization.');
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  return consent;
}

export async function runInteropPipeline(applicationId: string) {
  const application = await getApplicationById(applicationId);
  if (!application) {
    const err = new Error('Application not found');
    (err as Error & { status: number }).status = 404;
    throw err;
  }

  await assertConsentGranted(applicationId);

  const citizen = await prisma.citizen.findUnique({ where: { id: application.citizenId } });
  if (!citizen) throw new Error('Citizen profile not found');

  const serviceCode = application.serviceId;

  if (serviceCode === 'BUSINESS_LICENSE') {
    return runBusinessLicensePipeline(application.id, citizen);
  }
  if (serviceCode === 'ADDRESS_VERIFICATION') {
    return runAddressVerificationPipeline(application.id, citizen);
  }
  if (serviceCode === 'SKILL_SUBSIDY') {
    return runSkillSubsidyPipeline(application.id, citizen);
  }
  throw new Error(`No interoperability pipeline configured for ${serviceCode}`);
}

async function runBusinessLicensePipeline(
  applicationId: string,
  citizen: { id: string; fullName: string; mobile: string }
) {
  const revResult = await revenueAdapter.fetchAndNormalizeCitizen(citizen.mobile);
  const { cdm, raw: rawRevenueJson, latencyMs: revLatency } = revResult;

  await eventBus.publish('REVENUE_FETCHED', {
    source: 'REVENUE_ADAPTER',
    applicationId,
    citizenId: citizen.id,
    summary: `Revenue records fetched for ${citizen.fullName}. Property tax cleared: ${cdm.clearances.propertyTaxCleared ? 'yes' : 'no'}`,
    metadata: { rawRevenueJson },
  });

  await eventBus.publish('DATA_NORMALIZED', {
    source: 'MAPPING_ENGINE',
    applicationId,
    citizenId: citizen.id,
    summary: 'Revenue payload normalized to the Common Data Model',
    metadata: { cdm },
  });

  const application = await getApplicationById(applicationId);
  const muniResult = await municipalAdapter.submitTradeLicenseApplication(
    cdm,
    application?.businessName || 'Establishment',
    application?.tradeCategory || 'COMMERCIAL_RETAIL',
    applicationId
  );

  await eventBus.publish('MUNICIPAL_DISPATCHED', {
    source: 'MUNICIPAL_ADAPTER',
    applicationId,
    citizenId: citizen.id,
    summary: `Application dispatched to municipal licensing (${muniResult.latencyMs}ms)`,
    metadata: { dispatchedMunicipalJson: muniResult.dispatchedPayload, permitRecord: muniResult.permitRecord },
  });

  await updateApplication(applicationId, {
    status: 'PENDING_OFFICER_REVIEW',
    revenueClearanceRef: cdm.clearances.revenueReferenceId,
    municipalPermitRef: muniResult.permitRecord.permitId,
  });

  await addTimelineEvent(applicationId, {
    stage: 'REVENUE_VERIFIED',
    status: 'SUCCESS',
    details: `Address and property-tax records retrieved from Revenue (${cdm.clearances.revenueReferenceId})`,
    actor: 'Interoperability engine',
  });
  await addTimelineEvent(applicationId, {
    stage: 'ADAPTER_TRANSLATED',
    status: 'SUCCESS',
    details: 'Normalized record delivered to the municipal licensing system',
    actor: 'Municipal adapter',
  });

  await writeAudit({
    actorId: 'INTEROP_ENGINE',
    actorRole: 'SYSTEM_GATEWAY',
    action: 'CROSS_DEPT_INTEROP_EXECUTION',
    entityType: 'APPLICATION',
    entityId: applicationId,
    department: 'MUNICIPAL',
    purpose: 'Schema normalization and municipal dispatch',
    details: {
      revNetLatencyMs: revLatency,
      muniSysLatencyMs: muniResult.latencyMs,
      clearanceId: cdm.clearances.revenueReferenceId,
    },
  });

  await notifyCitizen(
    citizen.id,
    'Application sent for officer review',
    'Revenue verification is complete. Your trade license application is with the municipal officer.',
    'INFO'
  );

  return {
    application: await getApplicationById(applicationId),
    pipelineTelemetry: {
      step1_source: { system: 'Revenue land records', rawJson: rawRevenueJson, latencyMs: revLatency },
      step2_cdm: { standard: 'Common Data Model', commonModelJson: cdm },
      step3_target: {
        system: 'Municipal licensing',
        dispatchedJson: muniResult.dispatchedPayload,
        permitRecord: muniResult.permitRecord,
        latencyMs: muniResult.latencyMs,
      },
    },
  };
}

async function runAddressVerificationPipeline(
  applicationId: string,
  citizen: { id: string; fullName: string; mobile: string }
) {
  const revResult = await revenueAdapter.fetchAndNormalizeCitizen(citizen.mobile);
  const { cdm, raw, latencyMs } = revResult;

  await eventBus.publish('REVENUE_FETCHED', {
    source: 'REVENUE_ADAPTER',
    applicationId,
    citizenId: citizen.id,
    summary: `Land record retrieved for ${citizen.fullName}`,
    metadata: { raw },
  });

  await updateApplication(applicationId, {
    status: 'PENDING_OFFICER_REVIEW',
    revenueClearanceRef: cdm.clearances.revenueReferenceId,
  });
  await addTimelineEvent(applicationId, {
    stage: 'REVENUE_VERIFIED',
    status: 'SUCCESS',
    details: `Revenue extract prepared (${cdm.clearances.revenueReferenceId}). Awaiting revenue officer sign-off.`,
    actor: 'Revenue adapter',
  });

  await notifyCitizen(
    citizen.id,
    'Address verification in review',
    'Your land-record extract has been prepared for revenue officer confirmation.',
    'INFO'
  );

  return {
    application: await getApplicationById(applicationId),
    pipelineTelemetry: {
      step1_source: { system: 'Revenue land records', rawJson: raw, latencyMs },
      step2_cdm: { standard: 'Common Data Model', commonModelJson: cdm },
    },
  };
}

async function runSkillSubsidyPipeline(
  applicationId: string,
  citizen: { id: string; fullName: string; mobile: string }
) {
  const license = await prisma.application.findFirst({
    where: {
      citizenId: citizen.id,
      status: 'APPROVED',
      service: { code: 'BUSINESS_LICENSE' },
    },
  });
  if (!license?.municipalPermitRef) {
    const err = new Error('An approved municipal trade license is required before applying for this subsidy.');
    (err as Error & { status: number }).status = 400;
    throw err;
  }

  const eligibility = await employmentAdapter.checkEligibility(citizen.mobile, true);

  await eventBus.publish('DATA_NORMALIZED', {
    source: 'EMPLOYMENT_ADAPTER',
    applicationId,
    citizenId: citizen.id,
    summary: `Scheme eligibility checked: ${eligibility?.scheme_eligibility?.scheme_code}`,
    metadata: { eligibility },
  });

  await updateApplication(applicationId, {
    status: 'PENDING_OFFICER_REVIEW',
    municipalPermitRef: license.municipalPermitRef,
    revenueClearanceRef: license.revenueClearanceRef || undefined,
    payloadJson: JSON.stringify({ eligibility, linkedLicense: license.applicationNumber }),
  });

  await addTimelineEvent(applicationId, {
    stage: 'ADAPTER_TRANSLATED',
    status: 'SUCCESS',
    details: `Employment scheme engine returned ${eligibility?.scheme_eligibility?.scheme_code || 'eligibility'} using trade license ${license.municipalPermitRef}`,
    actor: 'Employment adapter',
  });

  await notifyCitizen(
    citizen.id,
    'Subsidy application in review',
    'Your eligibility has been verified against the approved trade license and sent to the employment officer.',
    'INFO'
  );

  return {
    application: await getApplicationById(applicationId),
    pipelineTelemetry: {
      eligibility,
      linkedLicense: license.applicationNumber,
    },
  };
}
