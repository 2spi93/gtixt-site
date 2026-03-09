import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Enterprise-style edge guard:
 * - Public site stays fully accessible
 * - Admin UI and admin APIs require authenticated session cookie
 * - Role enforcement remains in server APIs/components (RBAC)
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const nextActionHeader = request.headers.get('next-action');

  if (pathname === '/api/rsc' && request.method === 'POST') {
    if (nextActionHeader === 'x') {
      return NextResponse.json({ error: 'Invalid Server Action id' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Unsupported endpoint' }, { status: 404 });
  }

  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');

  const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/';

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  if (isLoginPage) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;

  if (token) {
    return NextResponse.next();
  }

  if (isAdminApi) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = new URL('/admin/login', request.url);
  const returnTo = `${pathname}${search || ''}`;
  loginUrl.searchParams.set('returnTo', returnTo);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/rsc'],
};
