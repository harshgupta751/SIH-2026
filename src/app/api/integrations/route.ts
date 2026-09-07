export { dynamic, runtime } from '@/lib/api/route-config';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireRoles } from '@/lib/auth/guards';
import { IntegrationRegistry } from '@/lib/interop/registry';

export async function GET() {
  const auth = requireRoles(['ADMIN', 'OFFICER_MUNICIPAL', 'OFFICER_REVENUE', 'OFFICER_EMPLOYMENT']);
  if ('response' in auth) return auth.response;

  const healthList = await IntegrationRegistry.getHealthOverview();
  const rows = await prisma.integration.findMany({ include: { department: true } });

  const integrations = healthList.map((h) => {
    const row = rows.find((r) => r.department.code === h.departmentCode);
    return {
      id: row?.id,
      departmentCode: h.departmentCode,
      systemName: h.systemName,
      endpointUrl: h.endpointUrl,
      status: h.status,
      latencyMs: h.latencyMs,
      authType: row?.authType,
      lastChecked: h.lastChecked,
    };
  });

  return NextResponse.json({ success: true, integrations });
}
