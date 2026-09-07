import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';

const GENESIS = '0000000000000000000000000000000000000000000000000000000000000000';

export async function writeAudit(params: {
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  department: string;
  purpose: string;
  details: Record<string, unknown>;
  ipAddress?: string;
}) {
  const last = await prisma.auditLog.findFirst({ orderBy: { timestamp: 'desc' } });
  const prevHash = last?.hash || GENESIS;
  const timestamp = new Date();
  const id = `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const ip = params.ipAddress || '127.0.0.1';
  const hashPayload = `${id}|${params.actorId}|${params.action}|${params.entityId}|${timestamp.toISOString()}|${prevHash}`;
  const hash = crypto.createHash('sha256').update(hashPayload).digest('hex');

  return prisma.auditLog.create({
    data: {
      id,
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      department: params.department,
      purpose: params.purpose,
      detailsJson: JSON.stringify(params.details),
      ipAddress: ip,
      prevHash,
      hash,
      timestamp,
    },
  });
}

export async function getRecentLogs(limit = 50) {
  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
  });
  return logs.map((log) => ({
    ...log,
    details: safeJson(log.detailsJson),
  }));
}

export async function getLogsForApplication(applicationId: string) {
  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [{ entityId: applicationId }, { detailsJson: { contains: applicationId } }],
    },
    orderBy: { timestamp: 'desc' },
  });
  return logs.map((log) => ({
    ...log,
    details: safeJson(log.detailsJson),
  }));
}

function safeJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
