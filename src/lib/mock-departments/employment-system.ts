import { KaushalCitizenPayload } from '../interop/types';

export interface SchemeDetail {
  code: string;
  name: string;
  maxGrantInr: number;
  description: string;
  eligibilityConditions: string[];
}

/**
 * KaushalPortal: Simulated Employment & Skill Development Department System
 * Handles vocational training schemes, youth subsidies, and eligibility verification.
 */
class EmploymentSystemMock {
  private schemes: SchemeDetail[] = [];

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    this.schemes = [
      {
        code: 'PMEGP_2026',
        name: 'Prime Minister Employment Generation Programme',
        maxGrantInr: 250000,
        description: 'Credit-linked subsidy programme for setting up micro-enterprises in manufacturing and services.',
        eligibilityConditions: ['Verified residential domicile', 'Age 18+', 'Educational qualification 8th standard or higher'],
      },
      {
        code: 'MUDRA_TARUN',
        name: 'Mudra Micro-Enterprise Scheme',
        maxGrantInr: 500000,
        description: 'Working capital and asset acquisition subsidy for registered business establishments.',
        eligibilityConditions: ['Valid Trade/Business license', 'Verified property/commercial premises', 'Clear tax record'],
      },
    ];
  }

  public getAvailableSchemes(): SchemeDetail[] {
    return this.schemes;
  }

  public checkEligibility(mobile: string, hasTradeLicense: boolean): KaushalCitizenPayload {
    return {
      candidate_profile: {
        legal_name: mobile === '9876543210' ? 'Rahul Sharma' : 'Applicant',
        contact_digits: mobile,
        highest_qualification: 'Bachelor of Technology',
        sector: 'INFORMATION_TECHNOLOGY_SERVICES',
      },
      scheme_eligibility: {
        scheme_code: hasTradeLicense ? 'MUDRA_TARUN' : 'PMEGP_2026',
        requires_address_clearance: true,
        eligible_for_subsidy: true,
        max_grant_inr: hasTradeLicense ? 500000 : 250000,
      },
    };
  }
}

export const employmentMockSystem = new EmploymentSystemMock();
