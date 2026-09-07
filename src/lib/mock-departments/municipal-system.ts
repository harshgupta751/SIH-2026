import { prisma } from '@/lib/db/prisma';
import { MuniSysApplicationPayload } from '@/lib/interop/types';

export interface MunicipalPermitRecord {
  permitId: string;
  applicationNumber: string;
  applicantName: string;
  businessTitle: string;
  premisesAddress: string;
  wardNo: string;
  tradeCategory: string;
  revenueClearanceRef: string;
  officerDecision: 'PENDING' | 'APPROVED' | 'REJECTED';
  officerComments?: string;
  issuedAt?: string;
  permitCertificateNumber?: string;
  mahasetuApplicationId?: string;
}

function toRecord(row: {
  permitId: string;
  applicationNumber: string;
  applicantName: string;
  businessTitle: string;
  premisesAddress: string;
  wardNo: string;
  tradeCategory: string;
  revenueClearanceRef: string;
  officerDecision: string;
  officerComments: string | null;
  issuedAt: Date | null;
  permitCertificateNumber: string | null;
  mahasetuApplicationId: string | null;
}): MunicipalPermitRecord {
  return {
    permitId: row.permitId,
    applicationNumber: row.applicationNumber,
    applicantName: row.applicantName,
    businessTitle: row.businessTitle,
    premisesAddress: row.premisesAddress,
    wardNo: row.wardNo,
    tradeCategory: row.tradeCategory,
    revenueClearanceRef: row.revenueClearanceRef,
    officerDecision: row.officerDecision as MunicipalPermitRecord['officerDecision'],
    officerComments: row.officerComments || undefined,
    issuedAt: row.issuedAt?.toISOString(),
    permitCertificateNumber: row.permitCertificateNumber || undefined,
    mahasetuApplicationId: row.mahasetuApplicationId || undefined,
  };
}

class MunicipalSystem {
  public async registerApplication(
    payload: MuniSysApplicationPayload,
    mahasetuApplicationId?: string
  ): Promise<MunicipalPermitRecord> {
    const appNo = `MUNI-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const permitId = `PRM-${Date.now().toString().slice(-6)}`;
    const row = await prisma.municipalPermit.create({
      data: {
        applicationNumber: appNo,
        permitId,
        mahasetuApplicationId: mahasetuApplicationId || null,
        applicantName: payload.applicant_name,
        businessTitle: payload.business_title,
        premisesAddress: payload.premises_address,
        wardNo: payload.ward_no,
        tradeCategory: payload.trade_category,
        revenueClearanceRef: payload.revenue_clearance_ref || 'PENDING_REV',
        officerDecision: 'PENDING',
        officerComments: 'Awaiting licensing officer review.',
      },
    });
    return toRecord(row);
  }

  public async getApplication(appNoOrPermitId: string): Promise<MunicipalPermitRecord | null> {
    const row = await prisma.municipalPermit.findFirst({
      where: {
        OR: [
          { applicationNumber: appNoOrPermitId },
          { permitId: appNoOrPermitId },
          { mahasetuApplicationId: appNoOrPermitId },
          { permitCertificateNumber: appNoOrPermitId },
        ],
      },
    });
    return row ? toRecord(row) : null;
  }

  public async approveApplication(appNoOrPermitId: string, comments: string): Promise<MunicipalPermitRecord> {
    const existing = await this.getApplication(appNoOrPermitId);
    if (!existing) throw new Error(`Application ${appNoOrPermitId} not found in municipal system`);
    const cert = `MH-TRADE-${Math.floor(100000 + Math.random() * 900000)}`;
    const row = await prisma.municipalPermit.update({
      where: { applicationNumber: existing.applicationNumber },
      data: {
        officerDecision: 'APPROVED',
        officerComments: comments,
        issuedAt: new Date(),
        permitCertificateNumber: cert,
      },
    });
    return toRecord(row);
  }

  public async rejectApplication(appNoOrPermitId: string, reason: string): Promise<MunicipalPermitRecord> {
    const existing = await this.getApplication(appNoOrPermitId);
    if (!existing) throw new Error(`Application ${appNoOrPermitId} not found in municipal system`);
    const row = await prisma.municipalPermit.update({
      where: { applicationNumber: existing.applicationNumber },
      data: {
        officerDecision: 'REJECTED',
        officerComments: reason,
      },
    });
    return toRecord(row);
  }

  public async getAllApplications(): Promise<MunicipalPermitRecord[]> {
    const rows = await prisma.municipalPermit.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(toRecord);
  }
}

export const municipalMockSystem = new MunicipalSystem();
