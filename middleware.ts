import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for securing admin routes
 * 
 * This middleware:
 * - Protects all /admin/* routes except /admin/login
 * - Checks for valid admin_token in cookies or headers
 * - Redirects unauthenticated users to login page
 * - Preserves the original URL for post-login redirect
 * 
 * Security: Server-side protection prevents client-side bypass
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/admin/')) {
    const token =
      request.cookies.get('auth_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
  }

  // Skip middleware for:
  // - Login pages (public)
  // - Static files (_next/static, favicon, etc)
  // - Public API endpoints
  // - API routes (have their own auth)
  if (
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/') ||
    !pathname.startsWith('/admin')
  ) {
    return NextResponse.next();
  }

  // Check authentication token
  const token = 
    request.cookies.get('auth_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    // No token: redirect to login with return URL
    const loginUrl = new URL('/admin/login/', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    
    return NextResponse.redirect(loginUrl);
  }

  // Token exists: allow request
  // Note: Token validation happens in page components via useAdminAuth()
  // This middleware only prevents anonymous access
  return NextResponse.next();
}

/**
 * Configure which routes this middleware runs on
 * Match all /admin/* routes for protection
 */
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
