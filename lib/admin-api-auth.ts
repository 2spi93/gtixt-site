import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, UserRole, AuthUser } from '@/lib/internal-auth';

export async function requireAdminUser(
  request: NextRequest,
  allowedRoles?: UserRole[]
): Promise<{ user: AuthUser } | NextResponse> {
  const tokenHeader = request.headers.get('authorization');
  const token = tokenHeader?.replace('Bearer ', '') || request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  const expected = `${request.nextUrl.protocol}//${host}`;
  if (origin !== expected) {
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
