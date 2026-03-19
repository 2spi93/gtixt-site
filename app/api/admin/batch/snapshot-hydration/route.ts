/**
 * Admin API: Trigger Snapshot Hydration
 *
 * POST /api/admin/batch/snapshot-hydration
 * Manually trigger enrichment of current snapshot
 *
 * Returns: HydrationResult
 */

import { NextResponse } from 'next/server'
import { hydrateSnapshotEnriched } from '@/lib/snapshot-hydration'

export async function POST(req: Request) {
  // In production: validate admin auth token
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[admin/hydration] Received manual trigger')
    const result = await hydrateSnapshotEnriched()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
      message: `Hydration complete: ${result.total_stored} stored, ${result.total_failed} failed`,
    })
  } catch (error) {
    console.error('[admin/hydration] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  return NextResponse.json({
    endpoint: '/api/admin/batch/snapshot-hydration',
    method: 'POST',
    description: 'Trigger enrichment of current snapshot from archive',
    auth: 'Bearer token required',
    example: 'curl -X POST -H "Authorization: Bearer ..." https://gtixt.com/api/admin/batch/snapshot-hydration',
  })
}
