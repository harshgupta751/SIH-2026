import { BaseAdapter } from './base';
import { CommonCitizenRecord, RevNetCitizenResponse, AdapterResponse } from '../types';
import { DataMappingEngine } from '../mapping-engine';
import { revenueMockSystem } from '../../mock-departments/revenue-system';

export class RevenueAdapter extends BaseAdapter {
  public readonly departmentCode = 'REVENUE' as const;
  public readonly systemName = 'RevNet (Revenue & Land Records System)';
  public readonly endpointUrl = '/api/mock/revenue';

  /**
   * Fetches citizen property & address record from RevNet and normalizes to Common Data Model (CDM)
   */
  public async fetchAndNormalizeCitizen(
    identifier: string
  ): Promise<{ cdm: CommonCitizenRecord; raw: RevNetCitizenResponse; latencyMs: number }> {
    const res = await this.execute(async () => {
      // In local monolithic execution, call the mock service directly for zero latency variance
      const rawData = revenueMockSystem.getCitizenRecord(identifier);
      if (!rawData) {
        throw new Error(`Citizen not found in Revenue Department (RevNet) for: ${identifier}`);
      }
      return rawData;
    });

    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to communicate with RevNet');
    }

    // Transform using the Data Mapping Engine into CommonCitizenRecord
    const cdm = DataMappingEngine.transformRevenueToCDM(res.data);

    return {
      cdm,
      raw: res.data,
      latencyMs: res.executionTimeMs,
    };
  }

  /**
   * Request direct address & tax verification clearance
   */
  public async verifyTaxClearance(mobile: string): Promise<AdapterResponse<any>> {
    return this.execute(async () => {
      return revenueMockSystem.verifyAddressAndTax(mobile);
    });
  }

  public async testHealth(): Promise<{ status: 'HEALTHY' | 'DEGRADED' | 'DOWN'; latencyMs: number }> {
    const res = await this.execute(async () => {
      return revenueMockSystem.getCitizenRecord('9876543210');
    });
    return {
      status: res.success ? 'HEALTHY' : 'DOWN',
      latencyMs: res.executionTimeMs,
    };
  }
}

export const revenueAdapter = new RevenueAdapter();
