export { dynamic, runtime } from '@/lib/api/route-config';

import { NextResponse } from 'next/server';
import { requireRoles, requireSession, forbidden } from '@/lib/auth/guards';
import { createConsentRequest, getConsentsForCitizen } from '@/lib/consent/consent-manager';

export async function GET() {
  const auth = requireSession();
  if ('response' in auth) return auth.response;

  if (auth.user.role === 'CITIZEN') {
    if (!auth.user.citizenId) {
      return NextResponse.json({ success: false, error: 'Citizen profile missing' }, { status: 400 });
    }
    const consents = await getConsentsForCitizen(auth.user.citizenId);
    return NextResponse.json({ success: true, count: consents.length, consents });
  }

  if (auth.user.role === 'ADMIN' || auth.user.role.startsWith('OFFICER_')) {
    const { prisma } = await import('@/lib/db/prisma');
    const rows = await prisma.consent.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
    return NextResponse.json({
      success: true,
      count: rows.length,
      consents: rows.map((c) => ({
        ...c,
        dataFields: JSON.parse(c.dataFields || '[]'),
      })),
    });
  }

  return forbidden();
}

export async function POST(req: Request) {
  const auth = requireRoles(['CITIZEN', 'ADMIN']);
  if ('response' in auth) return auth.response;
  try {
    const body = await req.json();
    const citizenId =
      auth.user.role === 'CITIZEN' ? auth.user.citizenId : String(body.citizenId || auth.user.citizenId || '');
    if (!citizenId) {
      return NextResponse.json({ success: false, error: 'Citizen profile missing' }, { status: 400 });
    }
    const consent = await createConsentRequest({
      citizenId,
      applicationId: body.applicationId,
      requestedByDept: body.requestedByDept,
      sourceDept: body.sourceDept,
      purpose: body.purpose,
      dataFields: body.dataFields || [],
    });
    return NextResponse.json({ success: true, consent });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not create consent';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
