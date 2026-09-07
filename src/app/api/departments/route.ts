import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireSession } from '@/lib/auth/guards';

export async function GET() {
  const auth = requireSession();
  if ('response' in auth) return auth.response;

  const departments = await prisma.department.findMany({
    include: { integrations: true },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({
    success: true,
    departments: departments.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      systemName: d.integrations[0]?.name || d.name,
      description: d.description,
      status: d.status,
      apiBaseUrl: d.apiBaseUrl,
      latencyMs: d.integrations[0]?.responseTimeMs ?? null,
    })),
  });
}
