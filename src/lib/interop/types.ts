/**
 * MahaSetu Core Interoperability Types
 * Common Data Model (CDM) and Cross-Department Specifications
 */

// 1. The Standard Common Data Model (CDM)
export interface CommonCitizenRecord {
  citizenId: string;
  name: string;
  mobile: string;
  email?: string;
  identityHash: string; // Tokenized / privacy-preserved identifier
  address: {
    line1: string;
    locality: string;
    city: string;
    district: string;
    state: string;
    postalCode: string;
    fullFormattedAddress: string;
  };
  clearances: {
    revenueVerified: boolean;
    revenueReferenceId?: string;
    propertyTaxCleared?: boolean;
    landHoldingSqft?: number;
    municipalVerified?: boolean;
    municipalPermitNumber?: string;
    employmentEligible?: boolean;
    schemeCode?: string;
  };
}

// 2. Department A: Revenue Department (RevNet) Raw Idiosyncratic Payload
export interface RevNetCitizenResponse {
  citizen: {
    fullName: string;
    mobile: string;
    aadhaarHash: string;
  };
  address_record: {
    house_no: string;
    locality: string;
    city_name: string;
    pin: string;
    district_name: string;
    state_code: string;
    land_holding_sqft: number;
    property_tax_cleared: boolean;
  };
  verification_status: 'VERIFIED_ACTIVE' | 'FLAGGED' | 'NOT_FOUND';
  issued_at: string;
}

// 3. Department B: Municipal Corporation (MuniSys) Raw Idiosyncratic Payload
export interface MuniSysApplicationPayload {
  applicant_name: string;
  phone_number: string;
  business_title: string;
  premises_address: string;
  ward_no: string;
  trade_category: string;
  revenue_clearance_ref: string | null;
  property_tax_cleared_flag: boolean;
  approval_state: 'PENDING_REVENUE_VERIFICATION' | 'PENDING_MUNICIPAL_VERIFICATION' | 'APPROVED' | 'REJECTED';
}

// 4. Department C: Employment & Skill Department (KaushalPortal) Raw Payload
export interface KaushalCitizenPayload {
  candidate_profile: {
    legal_name: string;
    contact_digits: string;
    highest_qualification: string;
    sector: string;
  };
  scheme_eligibility: {
    scheme_code: string;
    requires_address_clearance: boolean;
    eligible_for_subsidy: boolean;
    max_grant_inr: number;
  };
}

// 5. Dynamic Field Mapping Configuration
export interface FieldMappingRule {
  id: string;
  sourceSystem: string;
  sourceField: string;
  targetSystem: string;
  targetField: string;
  transformation?: 'DIRECT' | 'TO_UPPER' | 'CONCAT_ADDRESS' | 'BOOLEAN_FLAG' | 'FORMAT_MOBILE';
}

// 6. Adapter Result Envelope
export interface AdapterResponse<T> {
  success: boolean;
  departmentCode: 'REVENUE' | 'MUNICIPAL' | 'EMPLOYMENT';
  systemName: string;
  data: T;
  rawPayload: any;
  executionTimeMs: number;
  error?: string;
}

// 7. Event Payloads
export type MahaSetuEventType =
  | 'APPLICATION_CREATED'
  | 'CONSENT_REQUESTED'
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED'
  | 'REVENUE_FETCHED'
  | 'DATA_NORMALIZED'
  | 'MUNICIPAL_DISPATCHED'
  | 'OFFICER_REVIEW_STARTED'
  | 'APPLICATION_APPROVED'
  | 'APPLICATION_REJECTED';

export interface MahaSetuEvent {
  id: string;
  eventType: MahaSetuEventType;
  source: string;
  applicationId: string;
  citizenId: string;
  summary: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
