import { FieldMappingRule } from '../interop/types';

export interface ApplicationRecord {
  id: string;
  applicationNumber: string;
  citizenId: string;
  serviceId: string;
  departmentId: string;
  status:
    | 'DRAFT'
    | 'CONSENT_PENDING'
    | 'REVENUE_VERIFIED'
    | 'PENDING_OFFICER_REVIEW'
    | 'APPROVED'
    | 'REJECTED';
  businessName: string;
  tradeCategory: string;
  revenueClearanceRef?: string;
  municipalPermitRef?: string;
  officerComments?: string;
  timeline: Array<{
    stage: string;
    status: 'SUCCESS' | 'PENDING' | 'ERROR';
    details: string;
    actor: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceDetail {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  departmentName: string;
  description: string;
  requiredClearance: string;
  slaDays: number;
  fee: number;
  icon: string;
}

class ApplicationStore {
  private applications: Map<string, ApplicationRecord> = new Map();
  private fieldMappings: FieldMappingRule[] = [];
  private services: ServiceDetail[] = [];

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    this.services = [
      {
        id: 'SRV-01',
        code: 'BUSINESS_LICENSE',
        name: 'Municipal Trade & Business License',
        departmentId: 'MUNICIPAL',
        departmentName: 'Municipal Corporation (MuniSys)',
        description: 'Statutory trade and establishment license for commercial operations within municipal limits.',
        requiredClearance: 'Revenue Department Address & Property Tax Clearance',
        slaDays: 3,
        fee: 1200,
        icon: 'Store',
      },
      {
        id: 'SRV-02',
        code: 'ADDRESS_VERIFICATION',
        name: 'Official Residential & Land Record Verification',
        departmentId: 'REVENUE',
        departmentName: 'Revenue Department (RevNet)',
        description: 'Official digital land holding and residential address clearance certificate.',
        requiredClearance: 'Revenue Inspector Digital Sign-off',
        slaDays: 2,
        fee: 0,
        icon: 'Home',
      },
      {
        id: 'SRV-03',
        code: 'SKILL_SUBSIDY',
        name: 'MSME Youth Enterprise & Skill Subsidy',
        departmentId: 'EMPLOYMENT',
        departmentName: 'Employment & Skill Dept (KaushalPortal)',
        description: 'Direct capital subsidy scheme for certified technicians and entrepreneurs under PMEGP.',
        requiredClearance: 'Verified Trade License + Domicile',
        slaDays: 5,
        fee: 0,
        icon: 'Briefcase',
      },
    ];

    this.fieldMappings = [
      {
        id: 'FMP-01',
        sourceSystem: 'RevNet',
        sourceField: 'citizen.fullName',
        targetSystem: 'MahaSetu_CDM',
        targetField: 'name',
        transformation: 'DIRECT',
      },
      {
        id: 'FMP-02',
        sourceSystem: 'RevNet',
        sourceField: 'citizen.mobile',
        targetSystem: 'MahaSetu_CDM',
        targetField: 'mobile',
        transformation: 'FORMAT_MOBILE',
      },
      {
        id: 'FMP-03',
        sourceSystem: 'RevNet',
        sourceField: 'address_record.city_name',
        targetSystem: 'MahaSetu_CDM',
        targetField: 'address.city',
        transformation: 'DIRECT',
      },
      {
        id: 'FMP-04',
        sourceSystem: 'RevNet',
        sourceField: 'address_record.pin',
        targetSystem: 'MahaSetu_CDM',
        targetField: 'address.postalCode',
        transformation: 'DIRECT',
      },
      {
        id: 'FMP-05',
        sourceSystem: 'RevNet',
        sourceField: 'address_record.property_tax_cleared',
        targetSystem: 'MahaSetu_CDM',
        targetField: 'clearances.propertyTaxCleared',
        transformation: 'BOOLEAN_FLAG',
      },
      {
        id: 'FMP-06',
        sourceSystem: 'MahaSetu_CDM',
        sourceField: 'name',
        targetSystem: 'MuniSys',
        targetField: 'applicant_name',
        transformation: 'DIRECT',
      },
      {
        id: 'FMP-07',
        sourceSystem: 'MahaSetu_CDM',
        sourceField: 'mobile',
        targetSystem: 'MuniSys',
        targetField: 'phone_number',
        transformation: 'DIRECT',
      },
      {
        id: 'FMP-08',
        sourceSystem: 'MahaSetu_CDM',
        sourceField: 'address.fullFormattedAddress',
        targetSystem: 'MuniSys',
        targetField: 'premises_address',
        transformation: 'DIRECT',
      },
      {
        id: 'FMP-09',
        sourceSystem: 'MahaSetu_CDM',
        sourceField: 'clearances.revenueReferenceId',
        targetSystem: 'MuniSys',
        targetField: 'revenue_clearance_ref',
        transformation: 'DIRECT',
      },
    ];

    // Seed one completed historical application to show past records
    const histAppId = 'MH-MUNI-2026-9012';
    this.applications.set(histAppId, {
      id: histAppId,
      applicationNumber: histAppId,
      citizenId: 'CIT-3210',
      serviceId: 'BUSINESS_LICENSE',
      departmentId: 'MUNICIPAL',
      status: 'APPROVED',
      businessName: 'Sharma Digital Services',
      tradeCategory: 'IT_AND_COMMUNICATIONS',
      revenueClearanceRef: 'REV-CLR-990142',
      municipalPermitRef: 'MH-PUNE-MUNI-LIC-4412',
      officerComments: 'All records cross-verified successfully via RevNet interop.',
      timeline: [
        {
          stage: 'CREATED',
          status: 'SUCCESS',
          details: 'Application submitted by Rahul Sharma',
          actor: 'Citizen (Rahul Sharma)',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          stage: 'CONSENT_GRANTED',
          status: 'SUCCESS',
          details: 'Citizen authorized Revenue Department data share',
          actor: 'Citizen (Rahul Sharma)',
          timestamp: new Date(Date.now() - 170000000).toISOString(),
        },
        {
          stage: 'REVENUE_VERIFIED',
          status: 'SUCCESS',
          details: 'RevNet verified residential address and tax clearance (Ref: REV-CLR-990142)',
          actor: 'MahaSetu RevenueAdapter',
          timestamp: new Date(Date.now() - 165000000).toISOString(),
        },
        {
          stage: 'APPROVED',
          status: 'SUCCESS',
          details: 'Municipal Officer signed and issued Trade Permit',
          actor: 'Officer M. Kulkarni (Municipal Dept)',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    });
  }

  public getServices(): ServiceDetail[] {
    return this.services;
  }

  public getService(code: string): ServiceDetail | undefined {
    return this.services.find((s) => s.code === code || s.id === code);
  }

  public getFieldMappings(): FieldMappingRule[] {
    return [...this.fieldMappings];
  }

  public updateFieldMapping(id: string, updates: Partial<FieldMappingRule>): FieldMappingRule {
    const idx = this.fieldMappings.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error(`Mapping ${id} not found`);
    this.fieldMappings[idx] = { ...this.fieldMappings[idx], ...updates };
    return this.fieldMappings[idx];
  }

  public addFieldMapping(rule: Omit<FieldMappingRule, 'id'>): FieldMappingRule {
    const newRule = { ...rule, id: `FMP-0${this.fieldMappings.length + 1}` };
    this.fieldMappings.push(newRule);
    return newRule;
  }

  public createApplication(params: {
    citizenId: string;
    serviceId: string;
    departmentId: string;
    businessName: string;
    tradeCategory?: string;
  }): ApplicationRecord {
    const appNum = `MH-MUNI-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const record: ApplicationRecord = {
      id: appNum,
      applicationNumber: appNum,
      citizenId: params.citizenId,
      serviceId: params.serviceId,
      departmentId: params.departmentId,
      status: 'CONSENT_PENDING',
      businessName: params.businessName,
      tradeCategory: params.tradeCategory || 'COMMERCIAL_RETAIL',
      timeline: [
        {
          stage: 'CREATED',
          status: 'SUCCESS',
          details: `Application initiated for ${params.businessName}`,
          actor: 'Citizen Portal',
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.applications.set(appNum, record);
    return record;
  }

  public getApplication(id: string): ApplicationRecord | null {
    return this.applications.get(id) || null;
  }

  public getAllApplications(): ApplicationRecord[] {
    return Array.from(this.applications.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public updateApplication(id: string, updates: Partial<ApplicationRecord>): ApplicationRecord {
    const app = this.applications.get(id);
    if (!app) throw new Error(`Application ${id} not found`);
    const updated = {
      ...app,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.applications.set(id, updated);
    return updated;
  }

  public addTimelineEvent(
    appId: string,
    event: { stage: string; status: 'SUCCESS' | 'PENDING' | 'ERROR'; details: string; actor: string }
  ) {
    const app = this.applications.get(appId);
    if (app) {
      app.timeline.push({
        ...event,
        timestamp: new Date().toISOString(),
      });
      app.updatedAt = new Date().toISOString();
      this.applications.set(appId, app);
    }
  }
}

declare global {
  var __mahasetu_app_store: ApplicationStore | undefined;
}

export const applicationStore: ApplicationStore =
  global.__mahasetu_app_store || (global.__mahasetu_app_store = new ApplicationStore());
