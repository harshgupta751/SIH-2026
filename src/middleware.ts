import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookieHeaderEdge } from '@/lib/auth/session-edge';

const PUBLIC_PATHS = ['/', '/login', '/register'];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/_next')) return true;
  if (pathname.startsWith('/api/auth/login')) return true;
  if (pathname.startsWith('/api/auth/register')) return true;
  if (pathname.startsWith('/api/health')) return true;
  if (pathname.includes('.')) return true;
  return false;
}

function homeForRole(role: string) {
  if (role === 'CITIZEN') return '/citizen';
  if (role.startsWith('OFFICER_')) return '/department';
  if (role === 'ADMIN') return '/admin';
  return '/';
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();
  if (pathname.startsWith('/api/')) return NextResponse.next();

  const user = await getSessionFromCookieHeaderEdge(req.headers.get('cookie'));

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/citizen') && user.role !== 'CITIZEN') {
    return NextResponse.redirect(new URL(homeForRole(user.role), req.url));
  }
  if (pathname.startsWith('/department') && !user.role.startsWith('OFFICER_') && user.role !== 'ADMIN') {
    return NextResponse.redirect(new URL(homeForRole(user.role), req.url));
  }
  if (pathname.startsWith('/admin') && user.role !== 'ADMIN') {
    return NextResponse.redirect(new URL(homeForRole(user.role), req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
