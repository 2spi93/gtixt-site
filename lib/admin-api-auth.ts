import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getUserFromToken, UserRole, AuthUser } from '@/lib/internal-auth';
import { getSecretEnv } from '@/lib/secret-env';

function matchesServiceScope(request: NextRequest): boolean {
  const expectedScope = getSecretEnv('ALS_SERVICE_SCOPE').trim()
  if (!expectedScope) return true

  const providedScope = request.headers.get('x-als-service-scope')?.trim() || ''
  return Boolean(providedScope && providedScope === expectedScope)
}

function matchesServiceToken(token: string): boolean {
  const expected = getSecretEnv('ALS_API_TOKEN') || getSecretEnv('ALS_SERVICE_TOKEN')
  const provided = String(token || '').trim()
  if (!expected || !provided) return false

  const expectedBuf = Buffer.from(expected)
  const providedBuf = Buffer.from(provided)
  if (expectedBuf.length !== providedBuf.length) return false

  return crypto.timingSafeEqual(expectedBuf, providedBuf)
}

function getServiceAuthUser(): AuthUser {
  return {
    id: 0,
    username: 'als-service',
    email: null,
    role: 'admin',
    active: true,
  }
}

export async function requireAdminUser(
  request: NextRequest,
  allowedRoles?: UserRole[]
): Promise<{ user: AuthUser } | NextResponse> {
  const tokenHeader = request.headers.get('authorization');
  const token = tokenHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (matchesServiceToken(token)) {
    if (!matchesServiceScope(request)) {
      return NextResponse.json({ error: 'Forbidden: invalid service scope' }, { status: 403 })
    }
    const user = getServiceAuthUser()
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 })
    }
    return { user }
  }

  const user = await getUserFromToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 });
  }

  return { user };
}

export function requireSameOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  if (!origin) return null;

  const host = request.headers.get('host');
  if (!host) return null;

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const protocol = forwardedProto || request.nextUrl.protocol.replace(':', '') || 'http';

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return NextResponse.json({ error: 'Invalid origin header' }, { status: 403 });
  }

  const originHost = originUrl.host;
  const originProtocol = originUrl.protocol.replace(':', '');
  const hostMatch = originHost === host;
  const protocolMatch = originProtocol === protocol;

  if (!hostMatch || !protocolMatch) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  return null;
}

export function getClientIpFromRequest(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  return null;
}
