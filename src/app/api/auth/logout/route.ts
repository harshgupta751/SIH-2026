export { dynamic, runtime } from '@/lib/api/route-config';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/lib/auth/session';

function expireCookie(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  };
}

export async function POST() {
  cookies().delete(SESSION_COOKIE);
  const response = NextResponse.json({ success: true });
  // Clear both Secure and non-Secure variants so a leftover dev cookie cannot keep a guest signed in.
  response.cookies.set(SESSION_COOKIE, '', expireCookie(true));
  response.cookies.set(SESSION_COOKIE, '', expireCookie(false));
  return response;
}
