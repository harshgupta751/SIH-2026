import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

const appInclude = {
  citizen: true,
  service: { include: { department: true } },
  department: true,
  timelines: { orderBy: { timestamp: 'asc' as const } },
  consents: { orderBy: { createdAt: 'desc' as const } },
};

export function serializeApplication(app: {
  id: string;
  applicationNumber: string;
  citizenId: string;
  serviceId: string;
  departmentId: string;
  status: string;
  payloadJson: string;
  businessName: string;
  tradeCategory: string;
  revenueClearanceRef: string | null;
  municipalPermitRef: string | null;
  officerComments: string | null;
  createdAt: Date;
  updatedAt: Date;
  citizen?: { fullName: string; mobile: string };
  service?: { code: string; name: string; department?: { code: string; name: string } };
  department?: { code: string; name: string };
  timelines?: Array<{
    stage: string;
    status: string;
    details: string;
    actor: string;
    timestamp: Date;
  }>;
  consents?: Array<{
    id: string;
    status: string;
    requestedByDept: string;
    sourceDept: string;
    purpose: string;
    dataFields: string;
    applicationId: string;
  }>;
}) {
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(app.payloadJson || '{}');
  } catch {
    payload = {};
  }
  const latestConsent = app.consents?.[0];
  let dataFields: string[] = [];
  if (latestConsent) {
    try {
      dataFields = JSON.parse(latestConsent.dataFields);
    } catch {
      dataFields = [];
    }
  }
  return {
    id: app.id,
    applicationNumber: app.applicationNumber,
    citizenId: app.citizenId,
    citizenName: app.citizen?.fullName,
    citizenMobile: app.citizen?.mobile,
    serviceId: app.service?.code || app.serviceId,
    serviceName: app.service?.name,
    departmentId: app.department?.code || app.departmentId,
    departmentName: app.department?.name,
    status: app.status,
    businessName: app.businessName,
    tradeCategory: app.tradeCategory,
    revenueClearanceRef: app.revenueClearanceRef,
    municipalPermitRef: app.municipalPermitRef,
    officerComments: app.officerComments,
    payload,
    timeline: (app.timelines || []).map((t) => ({
      stage: t.stage,
      status: t.status,
      details: t.details,
      actor: t.actor,
      timestamp: t.timestamp.toISOString(),
    })),
    consent: latestConsent
      ? {
          id: latestConsent.id,
          status: latestConsent.status,
          requestedByDept: latestConsent.requestedByDept,
          sourceDept: latestConsent.sourceDept,
          purpose: latestConsent.purpose,
          dataFields,
          applicationId: latestConsent.applicationId,
        }
      : null,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };
}

export async function getServices() {
  const services = await prisma.service.findMany({
    include: { department: true },
    orderBy: { name: 'asc' },
  });
  return services.map((srv) => {
    let required: string[] = [];
    try {
      required = JSON.parse(srv.requiredClearances);
    } catch {
      required = [];
    }
    return {
      id: srv.id,
      code: srv.code,
      name: srv.name,
      departmentId: srv.department.code,
      departmentName: srv.department.name,
      description: srv.description,
      requiredClearance: required.join(', '),
      requiredClearances: required,
      slaDays: srv.slaDays,
      fee: srv.fee,
    };
  });
}

function yearPrefix(deptCode: string) {
  const y = new Date().getFullYear();
  const map: Record<string, string> = {
    MUNICIPAL: `MH-MUNI-${y}`,
    REVENUE: `MH-REV-${y}`,
    EMPLOYMENT: `MH-EMP-${y}`,
  };
  return map[deptCode] || `MH-${y}`;
}

export async function createApplication(params: {
  citizenId: string;
  serviceCode: string;
  businessName: string;
  tradeCategory?: string;
  payload?: Record<string, unknown>;
}) {
  const service = await prisma.service.findUnique({
    where: { code: params.serviceCode },
    include: { department: true },
  });
  if (!service) throw new Error('Service not found');

  const applicationNumber = `${yearPrefix(service.department.code)}-${Math.floor(10000 + Math.random() * 90000)}`;

  const app = await prisma.application.create({
    data: {
      applicationNumber,
      citizenId: params.citizenId,
      serviceId: service.id,
      departmentId: service.departmentId,
      status: 'CONSENT_PENDING',
      businessName: params.businessName,
      tradeCategory: params.tradeCategory || '',
      payloadJson: JSON.stringify(params.payload || {}),
      timelines: {
        create: {
          stage: 'CREATED',
          status: 'SUCCESS',
          details: `Application submitted for ${service.name}`,
          actor: 'Citizen',
        },
      },
    },
    include: appInclude,
  });

  return serializeApplication(app);
}

export async function getApplicationById(id: string) {
  const app = await prisma.application.findFirst({
    where: { OR: [{ id }, { applicationNumber: id }] },
    include: appInclude,
  });
  return app ? serializeApplication(app) : null;
}

export async function listApplications(filter?: { citizenId?: string; departmentCode?: string }) {
  const where: Prisma.ApplicationWhereInput = {};
  if (filter?.citizenId) where.citizenId = filter.citizenId;
  if (filter?.departmentCode) {
    where.department = { code: filter.departmentCode };
  }
  const apps = await prisma.application.findMany({
    where,
    include: appInclude,
    orderBy: { createdAt: 'desc' },
  });
  return apps.map(serializeApplication);
}

export async function updateApplication(
  id: string,
  data: {
    status?: string;
    revenueClearanceRef?: string;
    municipalPermitRef?: string;
    officerComments?: string;
    payloadJson?: string;
    businessName?: string;
  }
) {
  await prisma.application.update({ where: { id }, data });
  return getApplicationById(id);
}

export async function addTimelineEvent(
  applicationId: string,
  event: { stage: string; status: 'SUCCESS' | 'PENDING' | 'ERROR'; details: string; actor: string }
) {
  await prisma.applicationTimeline.create({
    data: {
      applicationId,
      ...event,
    },
  });
}

export async function getFieldMappings() {
  const rows = await prisma.fieldMapping.findMany({ orderBy: { createdAt: 'asc' } });
  return rows.map((m) => ({
    id: m.id,
    sourceSystem: m.sourceSystem,
    sourceField: m.sourceField,
    targetSystem: m.targetSystem,
    targetField: m.targetField,
    transformation: (m.transformation || 'DIRECT') as
      | 'DIRECT'
      | 'TO_UPPER'
      | 'CONCAT_ADDRESS'
      | 'BOOLEAN_FLAG'
      | 'FORMAT_MOBILE',
  }));
}

export async function addFieldMapping(rule: {
  departmentId: string;
  sourceSystem: string;
  sourceField: string;
  targetSystem: string;
  targetField: string;
  transformation?: string;
}) {
  return prisma.fieldMapping.create({ data: rule });
}

export async function updateFieldMapping(
  id: string,
  updates: Partial<{
    sourceSystem: string;
    sourceField: string;
    targetSystem: string;
    targetField: string;
    transformation: string;
  }>
) {
  return prisma.fieldMapping.update({ where: { id }, data: updates });
}

export async function notifyCitizen(citizenId: string, title: string, message: string, type = 'INFO') {
  return prisma.notification.create({
    data: { citizenId, title, message, type },
  });
}
