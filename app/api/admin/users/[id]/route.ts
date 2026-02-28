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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const originCheck = requireSameOrigin(request);
  if (originCheck) return originCheck;

  const auth = await requireAdminUser(request, ['admin']);
  if (auth instanceof NextResponse) return auth;

  const dbPool = getPool();
  if (!dbPool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const { role, active } = body || {};

  if (role && !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const updates: string[] = [];
  const values: Array<string | number | boolean> = [];

  if (role) {
    values.push(role);
    updates.push(`role = $${values.length}`);
  }
  if (typeof active === 'boolean') {
    values.push(active);
    updates.push(`active = $${values.length}`);
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  }

  values.push(id);

  await dbPool.query(
    `UPDATE internal_users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${values.length}`,
    values
  );

  await logAccess(
    auth.user.id,
    'update_user',
    null,
    { target_user_id: id, role, active },
    getClientIpFromRequest(request)
  );

  return NextResponse.json({ success: true });
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return PATCH(request, context);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const originCheck = requireSameOrigin(request);
  if (originCheck) return originCheck;

  const auth = await requireAdminUser(request, ['admin']);
  if (auth instanceof NextResponse) return auth;

  const dbPool = getPool();
  if (!dbPool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const { new_password } = body || {};

  if (!new_password) {
    return NextResponse.json({ error: 'New password required' }, { status: 400 });
  }

  const policyErrors = validatePasswordPolicy(new_password);
  if (policyErrors.length > 0) {
    return NextResponse.json({ error: 'Password policy failed', details: policyErrors }, { status: 400 });
  }

  const newHash = hashPassword(new_password);

  await dbPool.query(
    `UPDATE internal_users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [newHash, id]
  );

  await dbPool.query(`DELETE FROM internal_sessions WHERE user_id = $1`, [id]);

  await logAccess(auth.user.id, 'reset_password', null, { target_user_id: id }, getClientIpFromRequest(request));

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const originCheck = requireSameOrigin(request);
  if (originCheck) return originCheck;

  const auth = await requireAdminUser(request, ['admin']);
  if (auth instanceof NextResponse) return auth;

  const dbPool = getPool();
  if (!dbPool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  await dbPool.query(
    `UPDATE internal_users SET active = FALSE, updated_at = NOW() WHERE id = $1`,
    [id]
  );
  await dbPool.query(`DELETE FROM internal_sessions WHERE user_id = $1`, [id]);

  await logAccess(auth.user.id, 'deactivate_user', null, { target_user_id: id }, getClientIpFromRequest(request));

  return NextResponse.json({ success: true });
}
