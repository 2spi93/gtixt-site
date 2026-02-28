import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/internal-db';
import { logAccess } from '@/lib/internal-auth';
import { requireAdminUser, getClientIpFromRequest } from '@/lib/admin-api-auth';

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin']);
  if (auth instanceof NextResponse) return auth;

  const dbPool = getPool();
  if (!dbPool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

  const result = await dbPool.query(
    `SELECT
       s.id,
       s.user_id,
       u.username,
       u.email,
       u.role,
       s.expires_at,
       s.ip_address,
       s.user_agent,
       s.created_at
     FROM internal_sessions s
     JOIN internal_users u ON u.id = s.user_id
     ORDER BY s.created_at DESC
     LIMIT $1`,
    [limit]
  );

  await logAccess(auth.user.id, 'list_sessions', null, { limit }, getClientIpFromRequest(request));

  return NextResponse.json({ success: true, data: result.rows });
}
