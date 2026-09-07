export { dynamic, runtime } from '@/lib/api/route-config';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireRoles } from '@/lib/auth/guards';
import { addFieldMapping, getFieldMappings, updateFieldMapping } from '@/lib/db/application-store';
import { DataMappingEngine } from '@/lib/interop/mapping-engine';

export async function GET() {
  const auth = requireRoles(['ADMIN']);
  if ('response' in auth) return auth.response;
  const mappings = await getFieldMappings();
  return NextResponse.json({ success: true, count: mappings.length, mappings });
}

export async function PUT(req: Request) {
  const auth = requireRoles(['ADMIN']);
  if ('response' in auth) return auth.response;
  try {
    const body = await req.json();
    const { id, updates } = body;
    const updated = await updateFieldMapping(id, updates);
    return NextResponse.json({ success: true, mapping: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = requireRoles(['ADMIN']);
  if ('response' in auth) return auth.response;
  try {
    const body = await req.json();
    if (body.sourceData) {
      const activeRules = body.rules || (await getFieldMappings());
      const result = DataMappingEngine.executeMapping(body.sourceData, activeRules);
      return NextResponse.json({ success: true, transformedData: result });
    }

    const dept =
      (await prisma.department.findUnique({ where: { code: body.departmentCode || 'REVENUE' } })) ||
      (await prisma.department.findFirst());
    if (!dept) {
      return NextResponse.json({ success: false, error: 'Department not found' }, { status: 400 });
    }

    const mapping = await addFieldMapping({
      departmentId: dept.id,
      sourceSystem: body.sourceSystem,
      sourceField: body.sourceField,
      targetSystem: body.targetSystem,
      targetField: body.targetField,
      transformation: body.transformation || 'DIRECT',
    });
    return NextResponse.json({ success: true, mapping });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not save mapping';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
