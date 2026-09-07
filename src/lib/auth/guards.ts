import { NextResponse } from 'next/server';
import { getSession, SessionUser } from './session';

export function unauthorized(message = 'Authentication required') {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function forbidden(message = 'You do not have permission to perform this action') {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

export function requireSession(): { user: SessionUser } | { response: NextResponse } {
  const user = getSession();
  if (!user) return { response: unauthorized() };
  return { user };
}

export function requireRoles(roles: string[]): { user: SessionUser } | { response: NextResponse } {
  const result = requireSession();
  if ('response' in result) return result;
  if (!roles.includes(result.user.role)) return { response: forbidden() };
  return result;
}

export function isOfficer(role: string) {
  return role.startsWith('OFFICER_');
}

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
}
