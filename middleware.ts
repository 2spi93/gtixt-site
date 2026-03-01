import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Enterprise-style edge guard:
 * - Public site stays fully accessible
 * - Admin UI and admin APIs require authenticated session cookie
 * - Role enforcement remains in server APIs/components (RBAC)
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

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
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
