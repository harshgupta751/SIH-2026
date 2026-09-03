import crypto from 'crypto';

export interface AuditRecord {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  department: string;
  purpose: string;
  details: Record<string, any>;
  ipAddress: string;
  prevHash: string;
  hash: string;
  timestamp: string;
}

class AuditLogger {
  private logs: AuditRecord[] = [];
  private lastHash: string = '0000000000000000000000000000000000000000000000000000000000000000';

  constructor() {
    this.seedDefaultLogs();
  }

  private seedDefaultLogs() {
    this.log({
      actorId: 'SYSTEM',
      actorRole: 'CORE_GATEWAY',
      action: 'SYSTEM_INITIALIZED',
      entityType: 'GATEWAY',
      entityId: 'MAHASETU-CORE',
      department: 'MAHASETU',
      purpose: 'Interoperability Gateway Startup and Health Check',
      details: { version: '1.0.0', protocol: 'JSON-REST-CDM' },
    });
  }

  public log(params: {
    actorId: string;
    actorRole: string;
    action: string;
    entityType: string;
    entityId: string;
    department: string;
    purpose: string;
    details: Record<string, any>;
    ipAddress?: string;
  }): AuditRecord {
    const timestamp = new Date().toISOString();
    const id = `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const ip = params.ipAddress || '127.0.0.1';

    // Compute cryptographic integrity hash chained from previous entry
    const hashPayload = `${id}|${params.actorId}|${params.action}|${params.entityId}|${timestamp}|${this.lastHash}`;
    const hash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    const record: AuditRecord = {
      id,
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      department: params.department,
      purpose: params.purpose,
      details: params.details,
      ipAddress: ip,
      prevHash: this.lastHash,
      hash,
      timestamp,
    };

    this.lastHash = hash;
    this.logs.unshift(record); // Prepend so newest is first
    return record;
  }

  public getRecentLogs(limit: number = 50): AuditRecord[] {
    return this.logs.slice(0, limit);
  }

  public getLogsForApplication(applicationId: string): AuditRecord[] {
    return this.logs.filter((l) => l.entityId === applicationId || l.details?.applicationId === applicationId);
  }
}

export const auditLogger = new AuditLogger();
