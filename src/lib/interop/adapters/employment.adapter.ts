import { BaseAdapter } from './base';
import { KaushalCitizenPayload, AdapterResponse } from '../types';
import { employmentMockSystem, SchemeDetail } from '../../mock-departments/employment-system';

export class EmploymentAdapter extends BaseAdapter {
  public readonly departmentCode = 'EMPLOYMENT' as const;
  public readonly systemName = 'KaushalPortal (Employment & Skill Development)';
  public readonly endpointUrl = '/api/mock/employment';

  public async getSchemes(): Promise<SchemeDetail[]> {
    return employmentMockSystem.getAvailableSchemes();
  }

  public async checkEligibility(mobile: string, hasTradeLicense: boolean): Promise<KaushalCitizenPayload> {
    const res = await this.execute(async () => {
      return employmentMockSystem.checkEligibility(mobile, hasTradeLicense);
    });
    return res.data;
  }

  public async testHealth(): Promise<{ status: 'HEALTHY' | 'DEGRADED' | 'DOWN'; latencyMs: number }> {
    const res = await this.execute(async () => {
      return employmentMockSystem.getAvailableSchemes();
    });
    return {
      status: res.success ? 'HEALTHY' : 'DOWN',
      latencyMs: res.executionTimeMs,
    };
  }
}

export const employmentAdapter = new EmploymentAdapter();
