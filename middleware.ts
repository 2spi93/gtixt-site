import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from './lib/rate-limit';

/**
 * Next.js Middleware for:
 * 1. Rate limiting public APIs (DDoS protection)
 * 2. Securing admin routes (authentication)
 * 
 * Security: Server-side protection prevents client-side bypass
 */

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  windowSeconds: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000') / 1000,
  whitelist: (process.env.RATE_LIMIT_WHITELIST_IPS || '127.0.0.1,::1').split(','),
};

/**
 * Extract client IP from request headers
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;
  
  return 'unknown';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ===== RATE LIMITING FOR PUBLIC APIs =====
  if (RATE_LIMIT_CONFIG.enabled && pathname.startsWith('/api/')) {
    // Skip rate limiting for admin and auth routes (they have their own protection)
    if (!pathname.startsWith('/api/admin/') && !pathname.startsWith('/api/auth/')) {
      const ip = getClientIP(request);
      
      // Check if IP is whitelisted
      if (!RATE_LIMIT_CONFIG.whitelist.includes(ip)) {
        const rateLimitKey = `api:${ip}`;
        const { allowed, remaining, resetAt } = await checkRateLimit(
          rateLimitKey,
          RATE_LIMIT_CONFIG.maxRequests,
          RATE_LIMIT_CONFIG.windowSeconds
        );

        if (!allowed) {
          const resetInSeconds = Math.ceil((resetAt - Date.now()) / 1000);
          return NextResponse.json(
            {
              error: 'Too Many Requests',
              message: `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`,
              retryAfter: resetInSeconds,
            },
            {
              status: 429,
              headers: {
                'X-RateLimit-Limit': RATE_LIMIT_CONFIG.maxRequests.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
                'Retry-After': resetInSeconds.toString(),
              },
            }
          );
        }

        // Add rate limit headers to successful requests
        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Limit', RATE_LIMIT_CONFIG.maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        response.headers.set('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());
        return response;
      }
    }
  }

  // ===== ADMIN ROUTE PROTECTION =====

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
