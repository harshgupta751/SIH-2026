import { AdapterResponse } from '../types';

export abstract class BaseAdapter {
  public abstract readonly departmentCode: 'REVENUE' | 'MUNICIPAL' | 'EMPLOYMENT';
  public abstract readonly systemName: string;
  public abstract readonly endpointUrl: string;

  /**
   * Safe wrapper that times and catches errors
   */
  protected async execute<T>(operation: () => Promise<T>): Promise<AdapterResponse<T>> {
    const startTime = performance.now();
    try {
      const data = await operation();
      const executionTimeMs = Math.round(performance.now() - startTime);
      return {
        success: true,
        departmentCode: this.departmentCode,
        systemName: this.systemName,
        data,
        rawPayload: data,
        executionTimeMs,
      };
    } catch (err: any) {
      const executionTimeMs = Math.round(performance.now() - startTime);
      return {
        success: false,
        departmentCode: this.departmentCode,
        systemName: this.systemName,
        data: null as any,
        rawPayload: null,
        executionTimeMs,
        error: err.message || 'Department integration adapter error',
      };
    }
  }

  public abstract testHealth(): Promise<{ status: 'HEALTHY' | 'DEGRADED' | 'DOWN'; latencyMs: number }>;
}
