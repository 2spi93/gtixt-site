import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/internal-db';
import {
  hashPassword,
  validatePasswordPolicy,
  logAccess,
} from '@/lib/internal-auth';
import {
  requireAdminUser,
  requireSameOrigin,
  getClientIpFromRequest,
} from '@/lib/admin-api-auth';

const ALLOWED_ROLES = ['reviewer', 'lead_reviewer', 'auditor', 'admin'];

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin']);
  if (auth instanceof NextResponse) return auth;

  const dbPool = getPool();
  if (!dbPool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const result = await dbPool.query(
    `SELECT
       u.id,
       u.username,
       u.email,
       u.role,
       u.active,
       u.created_at,
       u.updated_at,
       (
         SELECT MAX(occurred_at)
         FROM internal_access_log al
         WHERE al.user_id = u.id AND al.action = 'password_change'
       ) AS last_password_change
     FROM internal_users u
     WHERE u.active = TRUE
     ORDER BY u.created_at DESC`
  );

  await logAccess(auth.user.id, 'list_users', null, null, getClientIpFromRequest(request));

  return NextResponse.json({ success: true, data: result.rows });
}

export async function POST(request: NextRequest) {
  const originCheck = requireSameOrigin(request);
  if (originCheck) return originCheck;

  const auth = await requireAdminUser(request, ['admin']);
  if (auth instanceof NextResponse) return auth;

  const dbPool = getPool();
  if (!dbPool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const { username, email, role, password } = body || {};

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
  }

  if (role && !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const policyErrors = validatePasswordPolicy(password);
  if (policyErrors.length > 0) {
    return NextResponse.json({ error: 'Password policy failed', details: policyErrors }, { status: 400 });
  }

  const passwordHash = hashPassword(password);

  try {
    const insert = await dbPool.query(
      `INSERT INTO internal_users (username, email, password_hash, role, active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, username, email, role, active, created_at, updated_at`,
      [username, email || null, passwordHash, role || 'reviewer']
    );

    await logAccess(auth.user.id, 'create_user', null, { username }, getClientIpFromRequest(request));

    return NextResponse.json({ success: true, data: insert.rows[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create user' }, { status: 400 });
  }
}
