import { MuniSysApplicationPayload } from '../interop/types';

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
}

/**
 * MuniSys: Simulated Municipal Corporation Department System
 * Handles Trade Licenses, Ward Zoning, and Official Approvals.
 */
class MunicipalSystemMock {
  private applications: Map<string, MunicipalPermitRecord> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const defaultAppNo = 'MUNI-2026-9012';
    this.applications.set(defaultAppNo, {
      permitId: 'MUNI-PRM-101',
      applicationNumber: defaultAppNo,
      applicantName: 'Vikram Joshi',
      businessTitle: 'Joshi Hardware Mart',
      premisesAddress: 'Shop 4, MG Road, Pune - 411001, MH',
      wardNo: 'WARD-02',
      tradeCategory: 'RETAIL_HARDWARE',
      revenueClearanceRef: 'REV-CLR-110291',
      officerDecision: 'APPROVED',
      issuedAt: new Date(Date.now() - 86400000).toISOString(),
      permitCertificateNumber: 'MH-PUNE-MUNI-LIC-4412',
    });
  }

  /**
   * POST /api/mock/municipal/applications
   */
  public registerApplication(payload: MuniSysApplicationPayload): MunicipalPermitRecord {
    const appNo = `MUNI-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const record: MunicipalPermitRecord = {
      permitId: `PRM-${Date.now().toString().slice(-6)}`,
      applicationNumber: appNo,
      applicantName: payload.applicant_name,
      businessTitle: payload.business_title,
      premisesAddress: payload.premises_address,
      wardNo: payload.ward_no,
      tradeCategory: payload.trade_category,
      revenueClearanceRef: payload.revenue_clearance_ref || 'PENDING_REV',
      officerDecision: 'PENDING',
      officerComments: 'Awaiting Municipal Licensing Officer review.',
    };
    this.applications.set(appNo, record);
    return record;
  }

  /**
   * GET /api/mock/municipal/applications/:appNo
   */
  public getApplication(appNo: string): MunicipalPermitRecord | null {
    return this.applications.get(appNo) || null;
  }

  /**
   * POST /api/mock/municipal/applications/:appNo/approve
   */
  public approveApplication(appNo: string, comments: string = 'All checks verified including Revenue clearance.'): MunicipalPermitRecord {
    const record = this.applications.get(appNo);
    if (!record) {
      throw new Error(`Application ${appNo} not found in MuniSys`);
    }
    record.officerDecision = 'APPROVED';
    record.officerComments = comments;
    record.issuedAt = new Date().toISOString();
    record.permitCertificateNumber = `MH-PUNE-TRADE-${Math.floor(100000 + Math.random() * 900000)}`;
    this.applications.set(appNo, record);
    return record;
  }

  /**
   * POST /api/mock/municipal/applications/:appNo/reject
   */
  public rejectApplication(appNo: string, reason: string): MunicipalPermitRecord {
    const record = this.applications.get(appNo);
    if (!record) {
      throw new Error(`Application ${appNo} not found in MuniSys`);
    }
    record.officerDecision = 'REJECTED';
    record.officerComments = reason;
    this.applications.set(appNo, record);
    return record;
  }

  public getAllApplications(): MunicipalPermitRecord[] {
    return Array.from(this.applications.values());
  }
}

export const municipalMockSystem = new MunicipalSystemMock();
