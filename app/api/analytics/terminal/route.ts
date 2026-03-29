import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/internal-db'
import { toNumber } from '@/lib/intelligence'
import { getCached, setCached } from '@/lib/redis-cache'

export const dynamic = 'force-dynamic'

type PanelPreset = 'score' | 'risk' | 'resilience' | 'concentration'
type TimeframeKey = '5m' | '10m' | '15m' | '20m' | '30m' | '1H' | '4H' | '1D' | '7D' | '30D' | '90D' | '1Y' | 'ALL'

type SeriesRow = {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  pointsInBucket: number
}

type QueryRow = {
  bucket: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  points_in_bucket: number
}

type QueryResult = {
  rows: SeriesRow[]
  interval: string
  originOffset: string
  minPoints: number
  autoOptimized: boolean
}

type BucketCandidate = {
  interval: string
  origins: string[]
}

const BUCKET_BY_TIMEFRAME: Record<TimeframeKey, { interval: string; minPoints: number }> = {
  '5m': { interval: '30 minutes', minPoints: 1 },
  '10m': { interval: '30 minutes', minPoints: 1 },
  '15m': { interval: '30 minutes', minPoints: 1 },
  '20m': { interval: '30 minutes', minPoints: 1 },
  '30m': { interval: '30 minutes', minPoints: 1 },
  '1H': { interval: '30 minutes', minPoints: 1 },
  '4H': { interval: '1 hour', minPoints: 1 },
  '1D': { interval: '2 hours', minPoints: 1 },
  '7D': { interval: '12 hours', minPoints: 1 },
  '30D': { interval: '1 day', minPoints: 1 },
  '90D': { interval: '3 days', minPoints: 1 },
  '1Y': { interval: '7 days', minPoints: 1 },
  'ALL': { interval: '14 days', minPoints: 1 },
}

const ADAPTIVE_BUCKET_CANDIDATES: Partial<Record<TimeframeKey, BucketCandidate[]>> = {
  '1H': [
    { interval: '15 minutes', origins: ['0 minutes'] },
    { interval: '30 minutes', origins: ['0 minutes', '15 minutes'] },
    { interval: '1 hour', origins: ['0 minutes', '30 minutes'] },
    { interval: '2 hours', origins: ['0 minutes', '1 hour'] },
  ],
  '4H': [
    { interval: '2 hours', origins: ['0 minutes', '1 hour'] },
    { interval: '4 hours', origins: ['0 minutes', '2 hours'] },
    { interval: '6 hours', origins: ['0 minutes', '3 hours'] },
  ],
  '1D': [
    { interval: '6 hours', origins: ['0 minutes', '3 hours'] },
    { interval: '12 hours', origins: ['0 hours', '6 hours'] },
    { interval: '1 day', origins: ['0 hours', '12 hours'] },
  ],
  '7D': [
    { interval: '6 hours', origins: ['0 hours', '3 hours'] },
    { interval: '12 hours', origins: ['0 hours', '6 hours'] },
    { interval: '1 day', origins: ['0 hours', '12 hours'] },
  ],
  '30D': [
    { interval: '12 hours', origins: ['0 hours', '6 hours'] },
    { interval: '1 day', origins: ['0 hours', '12 hours'] },
    { interval: '2 days', origins: ['0 hours', '1 day'] },
  ],
  'ALL': [
    { interval: '7 days', origins: ['0 days', '3 days'] },
    { interval: '10 days', origins: ['0 days', '5 days'] },
    { interval: '14 days', origins: ['0 days', '7 days'] },
    { interval: '21 days', origins: ['0 days', '7 days', '14 days'] },
    { interval: '28 days', origins: ['0 days', '7 days', '14 days'] },
    { interval: '35 days', origins: ['0 days', '7 days', '14 days'] },
  ],
}
const INSTITUTIONAL_TARGET_CANDLES = 200
const SELECTION_TARGET_BY_TIMEFRAME: Partial<Record<TimeframeKey, number>> = {
  '1H': 96,
  '4H': 96,
  '1D': 96,
  '7D': 96,
  '30D': 96,
  'ALL': 180,
}
const MIN_CANDLES_BY_TIMEFRAME: Partial<Record<TimeframeKey, number>> = {
  '1H': 36,
  '4H': 48,
  '1D': 48,
  '7D': 48,
  '30D': 48,
  'ALL': 140,
}

const MAX_EXPANSION_DAYS_BY_TIMEFRAME: Partial<Record<TimeframeKey, number>> = {
  '1H': 120,
  '4H': 120,
  '1D': 120,
  '7D': 730,
  '30D': 1825,
  '1Y': 5000,
  'ALL': 5000,
}

function buildMetricQuery(metricExpr: string, metricPredicate: string) {
  return `
    WITH snapshot_points AS (
      SELECT
        fss.timestamp AS snapshot_ts,
        AVG(${metricExpr}) AS point_value,
        COUNT(*)::int AS sample_size
      FROM firm_score_snapshots fss
      WHERE fss.timestamp >= NOW() - ($1::int || ' days')::interval
        AND ${metricPredicate}
      GROUP BY 1
    ), candle_rollup AS (
      SELECT
        date_bin($2::interval, snapshot_ts, TIMESTAMPTZ '2001-01-01' + $4::interval) AS bucket,
        (array_agg(point_value ORDER BY snapshot_ts ASC))[1] AS open,
        MAX(point_value) AS high,
        MIN(point_value) AS low,
        (array_agg(point_value ORDER BY snapshot_ts DESC))[1] AS close,
        SUM(sample_size)::int AS volume,
        COUNT(*)::int AS points_in_bucket
      FROM snapshot_points
      GROUP BY 1
    )
    SELECT bucket, open, high, low, close, volume, points_in_bucket
    FROM candle_rollup
    WHERE points_in_bucket >= $3::int
    ORDER BY bucket ASC
  `
}

const PRESET_QUERIES: Record<PanelPreset, string> = {
  score: buildMetricQuery('fss.score', 'fss.score IS NOT NULL AND fss.score > 0'),
  risk: buildMetricQuery('fss.risk_index', 'fss.risk_index IS NOT NULL AND fss.risk_index > 0'),
  resilience: buildMetricQuery(
    '((fss.score + COALESCE(NULLIF(fss.payout_score, 0), fss.score) + COALESCE(NULLIF(fss.rvi, 0), fss.score)) / 3.0)',
    'fss.score IS NOT NULL AND fss.score > 0'
  ),
  concentration: `
    WITH jurisdiction_snapshot_points AS (
      SELECT
        fss.timestamp AS snapshot_ts,
        COALESCE(NULLIF(f.jurisdiction, ''), 'Global') AS jurisdiction,
        COUNT(*)::numeric AS jurisdiction_firms
      FROM firm_score_snapshots fss
      JOIN real_firms_only f ON f.firm_id = fss.firm_id
      WHERE fss.timestamp >= NOW() - ($1::int || ' days')::interval
        AND fss.score IS NOT NULL
        AND fss.score > 0
      GROUP BY 1, 2
    ), snapshot_totals AS (
      SELECT
        snapshot_ts,
        SUM(jurisdiction_firms) AS total_firms
      FROM jurisdiction_snapshot_points
      GROUP BY 1
    ), snapshot_points AS (
      SELECT
        jsp.snapshot_ts,
        LEAST(
          100,
          SUM(
            POWER(
              jsp.jurisdiction_firms / NULLIF(st.total_firms, 0),
              2
            )
          ) * 100
        ) AS point_value,
        SUM(jsp.jurisdiction_firms)::int AS sample_size
      FROM jurisdiction_snapshot_points jsp
      JOIN snapshot_totals st ON st.snapshot_ts = jsp.snapshot_ts
      GROUP BY jsp.snapshot_ts
    ), candle_rollup AS (
      SELECT
        date_bin($2::interval, snapshot_ts, TIMESTAMPTZ '2001-01-01' + $4::interval) AS bucket,
        (array_agg(point_value ORDER BY snapshot_ts ASC))[1] AS open,
        MAX(point_value) AS high,
        MIN(point_value) AS low,
        (array_agg(point_value ORDER BY snapshot_ts DESC))[1] AS close,
        SUM(sample_size)::int AS volume,
        COUNT(*)::int AS points_in_bucket
      FROM snapshot_points
      GROUP BY 1
    )
    SELECT bucket, open, high, low, close, volume, points_in_bucket
    FROM candle_rollup
    WHERE points_in_bucket >= $3::int
    ORDER BY bucket ASC
  `,
}

function resolveBucket(timeframe: string | null, days: number) {
  if (timeframe && timeframe in BUCKET_BY_TIMEFRAME) {
    return BUCKET_BY_TIMEFRAME[timeframe as TimeframeKey]
  }

  if (days <= 30) return { interval: '2 hours', minPoints: 1 }
  if (days <= 90) return { interval: '12 hours', minPoints: 1 }
  if (days <= 365) return { interval: '1 day', minPoints: 1 }
  if (days <= 1825) return { interval: '7 days', minPoints: 1 }
  if (days <= 5000) return { interval: '14 days', minPoints: 1 }
  return { interval: '7 days', minPoints: 1 }
}

function normalizeRows(rows: QueryRow[]): SeriesRow[] {
  return rows
    .map((row) => {
      const open = toNumber(row.open)
      const high = toNumber(row.high)
      const low = toNumber(row.low)
      const close = toNumber(row.close)
      const values = [open, high, low, close]

      if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
        return null
      }

      return {
        date: new Date(row.bucket).toISOString(),
        open: Number(open.toFixed(2)),
        high: Number(Math.max(...values).toFixed(2)),
        low: Number(Math.min(...values).toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.max(0, Math.round(toNumber(row.volume))),
        pointsInBucket: Math.max(0, Math.round(toNumber(row.points_in_bucket))),
      }
    })
    .filter((row): row is SeriesRow => row !== null)
}

async function queryRowsForBucket(
  pool: NonNullable<ReturnType<typeof getPool>>,
  preset: PanelPreset,
  days: number,
  interval: string,
  minPoints: number,
  originOffset: string
) {
  const result = await pool.query<QueryRow>(PRESET_QUERIES[preset], [days, interval, minPoints, originOffset])
  return normalizeRows(result.rows)
}

async function queryRows(
  pool: NonNullable<ReturnType<typeof getPool>>,
  preset: PanelPreset,
  days: number,
  timeframe: string | null
): Promise<QueryResult> {
  const bucket = resolveBucket(timeframe, days)
  const timeframeKey = timeframe && timeframe in BUCKET_BY_TIMEFRAME ? timeframe as TimeframeKey : null
  const candidates = timeframeKey ? ADAPTIVE_BUCKET_CANDIDATES[timeframeKey] : null

  if (!candidates?.length) {
    return {
      rows: await queryRowsForBucket(pool, preset, days, bucket.interval, bucket.minPoints, '0 days'),
      interval: bucket.interval,
      originOffset: '0 days',
      minPoints: bucket.minPoints,
      autoOptimized: false,
    }
  }

  let best: QueryResult | null = null
  const selectionTarget = timeframeKey ? (SELECTION_TARGET_BY_TIMEFRAME[timeframeKey] || INSTITUTIONAL_TARGET_CANDLES) : INSTITUTIONAL_TARGET_CANDLES
  const minCandles = timeframeKey ? (MIN_CANDLES_BY_TIMEFRAME[timeframeKey] || 40) : 40
  const maxCandles = Math.round(selectionTarget * 1.25)
  const isAll = timeframeKey === 'ALL'

  for (const candidate of candidates) {
    for (const originOffset of candidate.origins) {
      const rows = await queryRowsForBucket(pool, preset, days, candidate.interval, bucket.minPoints, originOffset)
      const quality = buildQualityMetrics(rows)
      const proximityPenalty = Math.abs(rows.length - selectionTarget) * (isAll ? 1.05 : 0.75)
      const shortagePenalty = rows.length < minCandles ? (minCandles - rows.length) * (isAll ? 5.5 : 4) : 0
      const overflowPenalty = rows.length > maxCandles ? (rows.length - maxCandles) * (isAll ? 1.4 : 1.8) : 0
      const integrityBonus = quality.ohlcIntegrityScore * (isAll ? 1.15 : 1.6) + quality.avgPointsPerCandle * (isAll ? 5.5 : 9)
      const score = proximityPenalty + shortagePenalty + overflowPenalty - integrityBonus

      if (!best) {
        best = {
          rows,
          interval: candidate.interval,
          originOffset,
          minPoints: bucket.minPoints,
          autoOptimized: candidate.interval !== bucket.interval || originOffset !== '0 days',
        }
        continue
      }

      const bestQuality = buildQualityMetrics(best.rows)
      const bestProximityPenalty = Math.abs(best.rows.length - selectionTarget) * (isAll ? 1.05 : 0.75)
      const bestShortagePenalty = best.rows.length < minCandles ? (minCandles - best.rows.length) * (isAll ? 5.5 : 4) : 0
      const bestOverflowPenalty = best.rows.length > maxCandles ? (best.rows.length - maxCandles) * (isAll ? 1.4 : 1.8) : 0
      const bestIntegrityBonus = bestQuality.ohlcIntegrityScore * (isAll ? 1.15 : 1.6) + bestQuality.avgPointsPerCandle * (isAll ? 5.5 : 9)
      const bestScore = bestProximityPenalty + bestShortagePenalty + bestOverflowPenalty - bestIntegrityBonus

      if (score < bestScore) {
        best = {
          rows,
          interval: candidate.interval,
          originOffset,
          minPoints: bucket.minPoints,
          autoOptimized: candidate.interval !== bucket.interval || originOffset !== '0 days',
        }
      }
    }
  }

  return best || {
    rows: await queryRowsForBucket(pool, preset, days, bucket.interval, bucket.minPoints, '0 days'),
    interval: bucket.interval,
    originOffset: '0 days',
    minPoints: bucket.minPoints,
    autoOptimized: false,
  }
}

function buildQualityMetrics(rows: SeriesRow[]) {
  if (!rows.length) {
    return {
      multiPointCandlePct: 0,
      rangedCandlePct: 0,
      avgPointsPerCandle: 0,
      ohlcIntegrityScore: 0,
    }
  }

  const multiPointCount = rows.filter((row) => row.pointsInBucket >= 2).length
  const rangedCount = rows.filter((row) => (row.high - row.low) > 0.05 || Math.abs(row.close - row.open) > 0.05).length
  const totalPoints = rows.reduce((sum, row) => sum + row.pointsInBucket, 0)
  const multiPointCandlePct = Number(((multiPointCount / rows.length) * 100).toFixed(1))
  const rangedCandlePct = Number(((rangedCount / rows.length) * 100).toFixed(1))
  const avgPointsPerCandle = Number((totalPoints / rows.length).toFixed(2))
  const ohlcIntegrityScore = Number(Math.min(100, (multiPointCandlePct * 0.65) + (rangedCandlePct * 0.35)).toFixed(1))

  return {
    multiPointCandlePct,
    rangedCandlePct,
    avgPointsPerCandle,
    ohlcIntegrityScore,
  }
}

export async function GET(request: NextRequest) {
  const pool = getPool()
  if (!pool) {
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
  }

  const preset = (request.nextUrl.searchParams.get('preset') || 'score') as PanelPreset
  const days = Math.min(Math.max(Number.parseInt(request.nextUrl.searchParams.get('days') || '90', 10) || 90, 7), 5000)
  const timeframe = request.nextUrl.searchParams.get('timeframe')
  const timeframeKey = timeframe && timeframe in BUCKET_BY_TIMEFRAME ? (timeframe as TimeframeKey) : null
  const cacheKey = `analytics-terminal:v2:${preset}:${days}:${timeframe || 'none'}`

  const cached = await getCached<unknown>(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  if (!(preset in PRESET_QUERIES)) {
    return NextResponse.json({ success: false, error: 'Invalid preset' }, { status: 400 })
  }

  try {
    let queryResult = await queryRows(pool, preset, days, timeframe)
    let rows = queryResult.rows
    let effectiveDays = days
    const maxExpansionDays = timeframeKey ? (MAX_EXPANSION_DAYS_BY_TIMEFRAME[timeframeKey] || 5000) : 5000

    if (rows.length < 12 && days < Math.min(365, maxExpansionDays)) {
      effectiveDays = Math.min(365, maxExpansionDays)
      queryResult = await queryRows(pool, preset, effectiveDays, timeframe)
      rows = queryResult.rows
    }

    if (rows.length < 20 && effectiveDays < Math.min(730, maxExpansionDays)) {
      effectiveDays = Math.min(730, maxExpansionDays)
      queryResult = await queryRows(pool, preset, effectiveDays, timeframe)
      rows = queryResult.rows
    }

    if (rows.length < 40 && effectiveDays < Math.min(1825, maxExpansionDays)) {
      effectiveDays = Math.min(1825, maxExpansionDays)
      queryResult = await queryRows(pool, preset, effectiveDays, timeframe)
      rows = queryResult.rows
    }

    if (rows.length < 60 && effectiveDays < maxExpansionDays) {
      effectiveDays = maxExpansionDays
      queryResult = await queryRows(pool, preset, effectiveDays, timeframe)
      rows = queryResult.rows
    }

    const quality = buildQualityMetrics(rows)

    const payload = {
      success: true,
      preset,
      days: effectiveDays,
      timeframe,
      bucketInterval: queryResult.interval,
      bucketOriginOffset: queryResult.originOffset,
      autoBucketOptimized: queryResult.autoOptimized,
      count: rows.length,
      institutionalTargetCandles: INSTITUTIONAL_TARGET_CANDLES,
      densityCoveragePct: Number(Math.min(100, (rows.length / INSTITUTIONAL_TARGET_CANDLES) * 100).toFixed(1)),
      surplusCandles: Math.max(0, rows.length - INSTITUTIONAL_TARGET_CANDLES),
      multiPointCandlePct: quality.multiPointCandlePct,
      rangedCandlePct: quality.rangedCandlePct,
      avgPointsPerCandle: quality.avgPointsPerCandle,
      ohlcIntegrityScore: quality.ohlcIntegrityScore,
      source: 'database',
      rows,
      updatedAt: new Date().toISOString(),
    }

    void setCached(cacheKey, payload, 90)
    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to build analytics terminal series',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}