import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSecretEnv } from '@/lib/secret-env';

function matchesServiceScope(request: NextRequest): boolean {
  const expectedScope = getSecretEnv('ALS_SERVICE_SCOPE').trim();
  if (!expectedScope) return true;

  const providedScope = request.headers.get('x-als-service-scope')?.trim() || '';
  return Boolean(providedScope && providedScope === expectedScope);
}

function hasAlsServiceAccess(request: NextRequest): boolean {
  const expected = getSecretEnv('ALS_API_TOKEN') || getSecretEnv('ALS_SERVICE_TOKEN');
  const provided = (
    request.headers.get('x-als-service-token') ||
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    ''
  ).trim();

  return Boolean(expected && provided && expected === provided && matchesServiceScope(request));
}

/**
 * Enterprise-style edge guard:
 * - Public site stays fully accessible
 * - Admin UI and admin APIs require authenticated session cookie
 * - Role enforcement remains in server APIs/components (RBAC)
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const nextActionHeader = request.headers.get('next-action');
  const alsServiceAllowedPaths = new Set([
    '/api/admin/agent-learning/feedback',
    '/api/admin/agent-learning/tuning',
    '/api/admin/autonomous-lab/supervision',
    '/api/admin/autonomous-lab/decision-history',
  ]);

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

  if (isAdminApi && hasAlsServiceAccess(request) && alsServiceAllowedPaths.has(pathname)) {
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
