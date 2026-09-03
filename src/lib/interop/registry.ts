import { revenueAdapter } from './adapters/revenue.adapter';
import { municipalAdapter } from './adapters/municipal.adapter';
import { employmentAdapter } from './adapters/employment.adapter';

export interface DepartmentIntegrationStatus {
  departmentCode: 'REVENUE' | 'MUNICIPAL' | 'EMPLOYMENT';
  systemName: string;
  endpointUrl: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  latencyMs: number;
  lastChecked: string;
}

export class IntegrationRegistry {
  public static async getHealthOverview(): Promise<DepartmentIntegrationStatus[]> {
    const [revHealth, muniHealth, empHealth] = await Promise.all([
      revenueAdapter.testHealth(),
      municipalAdapter.testHealth(),
      employmentAdapter.testHealth(),
    ]);

    return [
      {
        departmentCode: 'REVENUE',
        systemName: revenueAdapter.systemName,
        endpointUrl: revenueAdapter.endpointUrl,
        status: revHealth.status,
        latencyMs: revHealth.latencyMs,
        lastChecked: new Date().toISOString(),
      },
      {
        departmentCode: 'MUNICIPAL',
        systemName: municipalAdapter.systemName,
        endpointUrl: municipalAdapter.endpointUrl,
        status: muniHealth.status,
        latencyMs: muniHealth.latencyMs,
        lastChecked: new Date().toISOString(),
      },
      {
        departmentCode: 'EMPLOYMENT',
        systemName: employmentAdapter.systemName,
        endpointUrl: employmentAdapter.endpointUrl,
        status: empHealth.status,
        latencyMs: empHealth.latencyMs,
        lastChecked: new Date().toISOString(),
      },
    ];
  }
}
