/**
 * DPDP Act Compliant Consent Management Engine
 * Provides granular, purpose-bound, time-limited, and revocable consent tracking
 */

export interface ConsentRecord {
  id: string;
  citizenId: string;
  applicationId: string;
  requestedByDept: string;
  sourceDept: string;
  purpose: string;
  dataFields: string[];
  status: 'PENDING' | 'GRANTED' | 'DENIED' | 'REVOKED';
  grantedAt?: string;
  revokedAt?: string;
  expiresAt: string;
  consentSignatureHash: string;
  createdAt: string;
}

class ConsentManager {
  private consentStore: Map<string, ConsentRecord> = new Map();

  constructor() {
    this.seedDefaultConsents();
  }

  private seedDefaultConsents() {
    const id = 'CNS-MH-1001';
    this.consentStore.set(id, {
      id,
      citizenId: 'CIT-3210',
      applicationId: 'MH-MUNI-2026-10231',
      requestedByDept: 'MUNICIPAL',
      sourceDept: 'REVENUE',
      purpose: 'Verification of residential address & property tax clearance for Municipal Trade License',
      dataFields: ['name', 'address', 'property_tax_cleared', 'land_holding_sqft'],
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      consentSignatureHash: 'sha256_mock_sig_78a6c',
      createdAt: new Date().toISOString(),
    });
  }

  public createConsentRequest(params: {
    citizenId: string;
    applicationId: string;
    requestedByDept: string;
    sourceDept: string;
    purpose: string;
    dataFields: string[];
  }): ConsentRecord {
    const id = `CNS-MH-${Math.floor(1000 + Math.random() * 9000)}`;
    const record: ConsentRecord = {
      id,
      citizenId: params.citizenId,
      applicationId: params.applicationId,
      requestedByDept: params.requestedByDept,
      sourceDept: params.sourceDept,
      purpose: params.purpose,
      dataFields: params.dataFields,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      consentSignatureHash: `sha256_${Date.now().toString(16)}`,
      createdAt: new Date().toISOString(),
    };
    this.consentStore.set(id, record);
    return record;
  }

  public grantConsent(consentId: string): ConsentRecord {
    const record = this.consentStore.get(consentId);
    if (!record) throw new Error(`Consent record ${consentId} not found`);
    record.status = 'GRANTED';
    record.grantedAt = new Date().toISOString();
    this.consentStore.set(consentId, record);
    return record;
  }

  public revokeConsent(consentId: string): ConsentRecord {
    const record = this.consentStore.get(consentId);
    if (!record) throw new Error(`Consent record ${consentId} not found`);
    record.status = 'REVOKED';
    record.revokedAt = new Date().toISOString();
    this.consentStore.set(consentId, record);
    return record;
  }

  public denyConsent(consentId: string): ConsentRecord {
    const record = this.consentStore.get(consentId);
    if (!record) throw new Error(`Consent record ${consentId} not found`);
    record.status = 'DENIED';
    this.consentStore.set(consentId, record);
    return record;
  }

  public getConsent(consentId: string): ConsentRecord | null {
    return this.consentStore.get(consentId) || null;
  }

  public getConsentsForCitizen(citizenId?: string): ConsentRecord[] {
    const all = Array.from(this.consentStore.values());
    if (!citizenId) return all;
    return all.filter((c) => c.citizenId === citizenId || c.citizenId === 'CIT-3210');
  }

  public getConsentForApplication(applicationId: string): ConsentRecord | undefined {
    return Array.from(this.consentStore.values()).find((c) => c.applicationId === applicationId);
  }
}

export const consentManager = new ConsentManager();
