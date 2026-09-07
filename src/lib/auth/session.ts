import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'mahasetu_session';
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  departmentId: string | null;
  departmentCode: string | null;
  citizenId: string | null;
};

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error('SESSION_SECRET must be set to a string of at least 16 characters');
  }
  return s;
}

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString('base64url');
}

function sign(payloadB64: string): string {
  return createHmac('sha256', secret()).update(payloadB64).digest('base64url');
}

export function createSessionToken(user: SessionUser): string {
  const payload = b64url(
    JSON.stringify({
      ...user,
      exp: Date.now() + MAX_AGE_SEC * 1000,
    })
  );
  return `${payload}.${sign(payload)}`;
}

export function parseSessionToken(token: string): SessionUser | null {
  try {
    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig) return null;
    const expected = sign(payloadB64);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!data?.id || !data?.exp || data.exp < Date.now()) return null;
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      departmentId: data.departmentId ?? null,
      departmentCode: data.departmentCode ?? null,
      citizenId: data.citizenId ?? null,
    };
  } catch {
    return null;
  }
}

export function getSessionFromCookieHeader(cookieHeader: string | null): SessionUser | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').map((p) => p.trim()).find((p) => p.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  const token = decodeURIComponent(match.slice(SESSION_COOKIE.length + 1));
  return parseSessionToken(token);
}

export function getSession(): SessionUser | null {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return parseSessionToken(token);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE_SEC,
  };
}
