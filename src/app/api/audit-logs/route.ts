import { NextResponse } from 'next/server';
import { auditLogger } from '@/lib/audit/audit-logger';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const applicationId = searchParams.get('applicationId');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  if (applicationId) {
    const logs = auditLogger.getLogsForApplication(applicationId);
    return NextResponse.json({ success: true, count: logs.length, logs });
  }

  const logs = auditLogger.getRecentLogs(limit);
  return NextResponse.json({ success: true, count: logs.length, logs });
}
