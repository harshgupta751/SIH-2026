export { dynamic, runtime } from '@/lib/api/route-config';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword, hashIdentifier } from '@/lib/auth/password';
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth/session';
import { upsertRevenueRecord } from '@/lib/mock-departments/revenue-system';
import { writeAudit } from '@/lib/audit/audit-logger';
import { clientIp } from '@/lib/auth/guards';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const fullName = String(body.fullName || '').trim();
    const mobile = String(body.mobile || '').replace(/\D/g, '').slice(-10);
    const addressLine = String(body.addressLine || '').trim();
    const locality = String(body.locality || '').trim();
    const city = String(body.city || '').trim();
    const district = String(body.district || city).trim();
    const state = String(body.state || 'Maharashtra').trim();
    const postalCode = String(body.postalCode || '').replace(/\D/g, '').slice(0, 6);
    const aadhaar = String(body.aadhaar || '').replace(/\D/g, '');

    if (!email || !password || !fullName || mobile.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'Name, email, password, and a 10-digit mobile number are required' },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (!addressLine || !locality || !city || postalCode.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'Complete residential address and 6-digit PIN code are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 409 });
    }
    const mobileTaken = await prisma.citizen.findUnique({ where: { mobile } });
    if (mobileTaken) {
      return NextResponse.json({ success: false, error: 'This mobile number is already registered' }, { status: 409 });
    }

    const aadhaarHash = hashIdentifier(aadhaar || `${email}:${mobile}`);
    const aadhaarTaken = await prisma.citizen.findUnique({ where: { aadhaarHash } });
    if (aadhaar && aadhaarTaken) {
      return NextResponse.json({ success: false, error: 'This identity number is already registered' }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: fullName,
        passwordHash: hashPassword(password),
        role: 'CITIZEN',
        citizen: {
          create: {
            fullName,
            mobile,
            aadhaarHash,
            addressLine,
            locality,
            city,
            district,
            state,
            postalCode,
          },
        },
      },
      include: { citizen: true, department: true },
    });

    await upsertRevenueRecord({
      fullName,
      mobile,
      aadhaarHash,
      addressLine,
      locality,
      city,
      district,
      state,
      postalCode,
      landHoldingSqft: Number(body.landHoldingSqft) || 0,
      propertyTaxCleared: true,
    });

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: null,
      departmentCode: null,
      citizenId: user.citizen?.id ?? null,
    };

    await writeAudit({
      actorId: user.id,
      actorRole: 'CITIZEN',
      action: 'CITIZEN_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      department: 'MAHASETU',
      purpose: 'Citizen self-registration and revenue master-data enrolment',
      details: { email, mobile },
      ipAddress: clientIp(req),
    });

    const response = NextResponse.json({ success: true, user: sessionUser });
    response.cookies.set(SESSION_COOKIE, createSessionToken(sessionUser), sessionCookieOptions());
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
