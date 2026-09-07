import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, database: 'up', service: 'mahasetu' });
  } catch {
    return NextResponse.json({ ok: false, database: 'down', service: 'mahasetu' }, { status: 503 });
  }
}
