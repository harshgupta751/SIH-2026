import { prisma } from '@/lib/db/prisma';
import { createHash } from 'crypto';

export type ConsentStatus = 'PENDING' | 'GRANTED' | 'DENIED' | 'REVOKED';

function parseFields(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function serialize(row: {
  id: string;
  citizenId: string;
  applicationId: string;
  requestedByDept: string;
  sourceDept: string;
  purpose: string;
  dataFields: string;
  status: string;
  consentSignatureHash: string;
  grantedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    citizenId: row.citizenId,
    applicationId: row.applicationId,
    requestedByDept: row.requestedByDept,
    sourceDept: row.sourceDept,
    purpose: row.purpose,
    dataFields: parseFields(row.dataFields),
    status: row.status as ConsentStatus,
    consentSignatureHash: row.consentSignatureHash,
    grantedAt: row.grantedAt?.toISOString(),
    revokedAt: row.revokedAt?.toISOString(),
    expiresAt: row.expiresAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function createConsentRequest(params: {
  citizenId: string;
  applicationId: string;
  requestedByDept: string;
  sourceDept: string;
  purpose: string;
  dataFields: string[];
}) {
  const expiresAt = new Date(Date.now() + 30 * 86400000);
  const row = await prisma.consent.create({
    data: {
      citizenId: params.citizenId,
      applicationId: params.applicationId,
      requestedByDept: params.requestedByDept,
      sourceDept: params.sourceDept,
      purpose: params.purpose,
      dataFields: JSON.stringify(params.dataFields),
      status: 'PENDING',
      expiresAt,
      consentSignatureHash: createHash('sha256')
        .update(`${params.citizenId}:${params.applicationId}:${Date.now()}`)
        .digest('hex'),
    },
  });
  return serialize(row);
}

export async function grantConsent(consentId: string) {
  const existing = await prisma.consent.findUnique({ where: { id: consentId } });
  if (!existing) throw new Error(`Consent record ${consentId} not found`);
  if (existing.status === 'REVOKED' || existing.status === 'DENIED') {
    throw new Error('This consent can no longer be granted');
  }
  const row = await prisma.consent.update({
    where: { id: consentId },
    data: { status: 'GRANTED', grantedAt: new Date() },
  });
  return serialize(row);
}

export async function revokeConsent(consentId: string) {
  const existing = await prisma.consent.findUnique({ where: { id: consentId } });
  if (!existing) throw new Error(`Consent record ${consentId} not found`);
  const row = await prisma.consent.update({
    where: { id: consentId },
    data: { status: 'REVOKED', revokedAt: new Date() },
  });
  return serialize(row);
}

export async function denyConsent(consentId: string) {
  const existing = await prisma.consent.findUnique({ where: { id: consentId } });
  if (!existing) throw new Error(`Consent record ${consentId} not found`);
  const row = await prisma.consent.update({
    where: { id: consentId },
    data: { status: 'DENIED' },
  });
  return serialize(row);
}

export async function getConsent(consentId: string) {
  const row = await prisma.consent.findUnique({ where: { id: consentId } });
  return row ? serialize(row) : null;
}

export async function getConsentsForCitizen(citizenId: string) {
  const rows = await prisma.consent.findMany({
    where: { citizenId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(serialize);
}

export async function getConsentForApplication(applicationId: string) {
  const row = await prisma.consent.findFirst({
    where: { applicationId },
    orderBy: { createdAt: 'desc' },
  });
  return row ? serialize(row) : null;
}
