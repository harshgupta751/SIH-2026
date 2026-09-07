import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireRoles } from '@/lib/auth/guards';

export async function GET() {
  const auth = requireRoles(['CITIZEN']);
  if ('response' in auth) return auth.response;
  if (!auth.user.citizenId) {
    return NextResponse.json({ success: false, error: 'Citizen profile not found' }, { status: 404 });
  }

  const citizen = await prisma.citizen.findUnique({
    where: { id: auth.user.citizenId },
    include: { notifications: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });
  if (!citizen) {
    return NextResponse.json({ success: false, error: 'Citizen profile not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    profile: {
      citizenId: citizen.id,
      fullName: citizen.fullName,
      email: auth.user.email,
      mobile: citizen.mobile,
      address: {
        line1: citizen.addressLine,
        locality: citizen.locality,
        city: citizen.city,
        district: citizen.district,
        state: citizen.state,
        postalCode: citizen.postalCode,
      },
      verifiedStatus: 'VERIFIED_CITIZEN',
      notifications: citizen.notifications,
    },
  });
}
