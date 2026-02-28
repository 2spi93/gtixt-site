import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/internal-db';
import { logAccess } from '@/lib/internal-auth';
import { requireAdminUser, requireSameOrigin, getClientIpFromRequest } from '@/lib/admin-api-auth';

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
    return NextResponse.json({ error: 'Invalid session id' }, { status: 400 });
  }

  await dbPool.query('DELETE FROM internal_sessions WHERE id = $1', [id]);

  await logAccess(auth.user.id, 'revoke_session', null, { session_id: id }, getClientIpFromRequest(request));

  return NextResponse.json({ success: true });
}
