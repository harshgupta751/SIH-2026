import { BaseAdapter } from './base';
import { CommonCitizenRecord, MuniSysApplicationPayload, AdapterResponse } from '../types';
import { DataMappingEngine } from '../mapping-engine';
import { municipalMockSystem, MunicipalPermitRecord } from '../../mock-departments/municipal-system';

export class MunicipalAdapter extends BaseAdapter {
  public readonly departmentCode = 'MUNICIPAL' as const;
  public readonly systemName = 'MuniSys (Municipal Trade & Ward Licensing)';
  public readonly endpointUrl = '/api/mock/municipal';

  /**
   * Translates CDM to MuniSys payload and submits new Trade License application
   */
  public async submitTradeLicenseApplication(
    cdm: CommonCitizenRecord,
    businessTitle: string,
    tradeCategory: string = 'COMMERCIAL_RETAIL'
  ): Promise<{
    permitRecord: MunicipalPermitRecord;
    dispatchedPayload: MuniSysApplicationPayload;
    latencyMs: number;
  }> {
    const dispatchedPayload = DataMappingEngine.transformCDMToMunicipal(cdm, businessTitle, tradeCategory);

    const res = await this.execute(async () => {
      return municipalMockSystem.registerApplication(dispatchedPayload);
    });

    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to dispatch to MuniSys');
    }

    return {
      permitRecord: res.data,
      dispatchedPayload,
      latencyMs: res.executionTimeMs,
    };
  }

  /**
   * Officer approval action within MuniSys
   */
  public async approveTradeApplication(
    applicationNumber: string,
    comments?: string
  ): Promise<AdapterResponse<MunicipalPermitRecord>> {
    return this.execute(async () => {
      return municipalMockSystem.approveApplication(applicationNumber, comments);
    });
  }

  /**
   * Officer rejection action within MuniSys
   */
  public async rejectTradeApplication(
    applicationNumber: string,
    reason: string
  ): Promise<AdapterResponse<MunicipalPermitRecord>> {
    return this.execute(async () => {
      return municipalMockSystem.rejectApplication(applicationNumber, reason);
    });
  }

  public async getApplication(applicationNumber: string): Promise<MunicipalPermitRecord | null> {
    return municipalMockSystem.getApplication(applicationNumber);
  }

  public async testHealth(): Promise<{ status: 'HEALTHY' | 'DEGRADED' | 'DOWN'; latencyMs: number }> {
    const res = await this.execute(async () => {
      return municipalMockSystem.getAllApplications();
    });
    return {
      status: res.success ? 'HEALTHY' : 'DOWN',
      latencyMs: res.executionTimeMs,
    };
  }
}

export const municipalAdapter = new MunicipalAdapter();
