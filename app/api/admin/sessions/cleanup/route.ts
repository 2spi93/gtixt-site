/**
 * API endpoint to cleanup expired sessions
 * Deletes all sessions where expires_at < NOW()
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/internal-db';
import { logAccess } from '@/lib/internal-auth';
import { requireAdminUser, getClientIpFromRequest } from '@/lib/admin-api-auth';

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin']);
  if (auth instanceof NextResponse) return auth;

  const dbPool = getPool();
  if (!dbPool) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    // Delete expired sessions
    const result = await dbPool.query(
      `DELETE FROM internal_sessions 
       WHERE expires_at < NOW()
       RETURNING id`,
    );

    const deletedCount = result.rowCount || 0;

    await logAccess(
      auth.user.id,
      'cleanup_sessions',
      null,
      { deletedCount },
      getClientIpFromRequest(request)
    );

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `${deletedCount} session(s) expirée(s) supprimée(s)`,
    });
  } catch (error) {
    console.error('Failed to cleanup expired sessions:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup sessions' },
      { status: 500 }
    );
  }
}

// GET - Get count of expired sessions without deleting
export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin']);
  if (auth instanceof NextResponse) return auth;

  const dbPool = getPool();
  if (!dbPool) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const result = await dbPool.query(
      `SELECT COUNT(*) as count 
       FROM internal_sessions 
       WHERE expires_at < NOW()`,
    );

    const expiredCount = parseInt(result.rows[0]?.count || '0', 10);

    return NextResponse.json({
      success: true,
      expiredCount,
    });
  } catch (error) {
    console.error('Failed to get expired sessions count:', error);
    return NextResponse.json(
      { error: 'Failed to get expired sessions count' },
      { status: 500 }
    );
  }
}
