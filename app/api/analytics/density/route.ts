import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/internal-db'

export const dynamic = 'force-dynamic'

type DensityRow = {
  buckets_total: number | string | null
  buckets_7d: number | string | null
  buckets_multi_point: number | string | null
  avg_points_per_bucket: number | string | null
  first_ts: string | null
  last_ts: string | null
}

type DensityWindow = {
  timeframe: string
  interval: string
  bucketCount: number
  target: number
  coveragePct: number
  surplusBuckets: number
  multiPointBucketPct: number
  avgPointsPerBucket: number
  integrityScore: number
  bucketRatePerDay: number
  etaDaysToTarget: number | null
  expectedBucketRatePerDay: number
  etaDaysAtExpectedRate: number | null
  firstTimestamp: string | null
  lastTimestamp: string | null
}

const WINDOWS: Array<{ timeframe: string; interval: string; target: number }> = [
  { timeframe: '1D', interval: '2 hours', target: 200 },
  { timeframe: '7D', interval: '12 hours', target: 200 },
  { timeframe: '30D', interval: '1 day', target: 200 },
  { timeframe: '1Y', interval: '7 days', target: 200 },
]

const EXPECTED_BUCKET_RATE_PER_DAY: Record<string, number> = {
  '1D': 12,
  '7D': 2,
  '30D': 1,
  '1Y': 1 / 7,
}

const BASE_SQL = `
  WITH snapshot_points AS (
    SELECT
      fss.timestamp AS snapshot_ts
    FROM firm_score_snapshots fss
    WHERE fss.timestamp >= NOW() - ($2::int || ' days')::interval
      AND fss.score IS NOT NULL
      AND fss.score > 0
    GROUP BY 1
  ), bucketed AS (
    SELECT
      date_bin($1::interval, snapshot_ts, TIMESTAMPTZ '2001-01-01') AS bucket,
      COUNT(*)::int AS points_in_bucket
    FROM snapshot_points
    GROUP BY 1
  )
  SELECT
    COUNT(*)::int AS buckets_total,
    COUNT(*) FILTER (WHERE bucket >= NOW() - INTERVAL '7 days')::int AS buckets_7d,
    COUNT(*) FILTER (WHERE points_in_bucket >= 2)::int AS buckets_multi_point,
    COALESCE(AVG(points_in_bucket), 0)::numeric AS avg_points_per_bucket,
    MIN(bucket)::text AS first_ts,
    MAX(bucket)::text AS last_ts
  FROM bucketed
`

function toNum(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function normalizeWindow(window: { timeframe: string; interval: string; target: number }, row: DensityRow): DensityWindow {
  const bucketCount = toNum(row.buckets_total)
  const buckets7d = toNum(row.buckets_7d)
  const rawCoveragePct = (bucketCount / Math.max(window.target, 1)) * 100
  const coveragePct = Number(Math.min(100, rawCoveragePct).toFixed(1))
  const surplusBuckets = Math.max(0, bucketCount - window.target)
  const multiPointBucketPct = bucketCount > 0
    ? Number(((toNum(row.buckets_multi_point) / bucketCount) * 100).toFixed(1))
    : 0
  const avgPointsPerBucket = Number(toNum(row.avg_points_per_bucket).toFixed(2))
  const integrityScore = Number(Math.min(100, (coveragePct * 0.55) + (multiPointBucketPct * 0.45)).toFixed(1))
  const bucketRatePerDay = Number((buckets7d / 7).toFixed(2))
  const remaining = Math.max(0, window.target - bucketCount)
  const etaDaysToTarget = bucketRatePerDay > 0 ? Number((remaining / bucketRatePerDay).toFixed(1)) : null
  const expectedBucketRatePerDay = EXPECTED_BUCKET_RATE_PER_DAY[window.timeframe] || 0
  const etaDaysAtExpectedRate = expectedBucketRatePerDay > 0
    ? Number((remaining / expectedBucketRatePerDay).toFixed(1))
    : null

  return {
    timeframe: window.timeframe,
    interval: window.interval,
    bucketCount,
    target: window.target,
    coveragePct,
    surplusBuckets,
    multiPointBucketPct,
    avgPointsPerBucket,
    integrityScore,
    bucketRatePerDay,
    etaDaysToTarget,
    expectedBucketRatePerDay,
    etaDaysAtExpectedRate,
    firstTimestamp: row.first_ts,
    lastTimestamp: row.last_ts,
  }
}

export async function GET(request: NextRequest) {
  const pool = getPool()
  if (!pool) {
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
  }

  try {
    const requestedDaysRaw = Number.parseInt(request.nextUrl.searchParams.get('days') || '', 10)
    const historyDays = Number.isFinite(requestedDaysRaw)
      ? Math.min(Math.max(requestedDaysRaw, 30), 5000)
      : 5000
    const windows: DensityWindow[] = []

    for (const window of WINDOWS) {
      const result = await pool.query<DensityRow>(BASE_SQL, [window.interval, historyDays])
      const row = result.rows[0] || {
        buckets_total: 0,
        buckets_7d: 0,
        buckets_multi_point: 0,
        avg_points_per_bucket: 0,
        first_ts: null,
        last_ts: null,
      }
      windows.push(normalizeWindow(window, row))
    }

    const overallCoveragePct = windows.length
      ? Number((windows.reduce((sum, item) => sum + item.coveragePct, 0) / windows.length).toFixed(1))
      : 0
    const overallIntegrityScore = windows.length
      ? Number((windows.reduce((sum, item) => sum + item.integrityScore, 0) / windows.length).toFixed(1))
      : 0

    return NextResponse.json({
      success: true,
      windows,
      historyDays,
      overallCoveragePct,
      overallIntegrityScore,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to compute density windows',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
