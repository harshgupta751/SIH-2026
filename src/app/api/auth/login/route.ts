import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/auth/session';
import { writeAudit } from '@/lib/audit/audit-logger';
import { clientIp } from '@/lib/auth/guards';

function toSessionUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  departmentId: string | null;
  department: { code: string } | null;
  citizen: { id: string } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    departmentId: user.departmentId,
    departmentCode: user.department?.code ?? null,
    citizenId: user.citizen?.id ?? null,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { department: true, citizen: true },
    });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    const sessionUser = toSessionUser(user);
    const token = createSessionToken(sessionUser);
    await writeAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      department: user.department?.code || 'MAHASETU',
      purpose: 'Authenticated session',
      details: { email: user.email },
      ipAddress: clientIp(req),
    });

    const response = NextResponse.json({ success: true, user: sessionUser });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
