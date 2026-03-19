/**
 * Admin API: Trigger Batch Predictions
 *
 * POST /api/admin/batch/predictions
 * Manually trigger nightly prediction computation + storage
 *
 * Query params:
 * - horizon: prediction horizon (default: q2-2026)
 */

import { NextResponse } from 'next/server'
import { runBatchPredictions } from '@/lib/batch-predictions'

export async function POST(req: Request) {
  // In production: validate admin auth token
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const horizon = searchParams.get('horizon') || 'q2-2026'

    console.log(`[admin/predictions] Received manual trigger for horizon: ${horizon}`)
    const result = await runBatchPredictions(horizon)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
      message: `Predictions stored: ${result.predictions_stored}/${result.total_firms}`,
    })
  } catch (error) {
    console.error('[admin/predictions] Error:', error)
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
    endpoint: '/api/admin/batch/predictions',
    method: 'POST',
    description: 'Trigger batch prediction computation + storage',
    auth: 'Bearer token required',
    queryParams: {
      horizon: 'Prediction horizon (e.g., q2-2026, default: q2-2026)',
    },
    example: 'curl -X POST -H "Authorization: Bearer ..." "https://gtixt.com/api/admin/batch/predictions?horizon=q3-2026"',
  })
}
