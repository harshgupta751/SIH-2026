export { dynamic, runtime } from '@/lib/api/route-config';

import { NextResponse } from 'next/server';
import { requireRoles } from '@/lib/auth/guards';
import { getLogsForApplication, getRecentLogs } from '@/lib/audit/audit-logger';

export async function GET(req: Request) {
  const auth = requireRoles(['ADMIN']);
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(req.url);
  const applicationId = searchParams.get('applicationId');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  if (applicationId) {
    const logs = await getLogsForApplication(applicationId);
    return NextResponse.json({ success: true, count: logs.length, logs });
  }

  const logs = await getRecentLogs(limit);
  return NextResponse.json({ success: true, count: logs.length, logs });
}
