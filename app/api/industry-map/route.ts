import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/internal-db'
import { normalizeSlug, toNumber } from '@/lib/intelligence'
import { getCached, setCached } from '@/lib/redis-cache'

export const dynamic = 'force-dynamic'

type MapNode = {
  id: string
  label: string
  slug: string
  websiteRoot: string | null
  headquarters: string | null
  score: number
  riskIndex: number
  riskCategory: string
  jurisdiction: string
  rviStatus: string
  payoutReliability: number
  operationalStability: number
  earlyWarning: boolean
  modelType: string
  firstSeenPeriod: string | null
  lastSeenPeriod: string | null
  firstSeenYear: number | null
  lastSeenYear: number | null
}

type MapEdge = {
  source: string
  target: string
  relation: 'jurisdiction' | 'risk-cluster' | 'warning-signal'
  weight: number
}

type IndustryMapPayload = {
  success: boolean
  count: number
  clusters: {
    highRisk: number
    stable: number
    earlyWarning: number
  }
  layers: string[]
  timeline: {
    minYear: number
    maxYear: number
    years: number[]
    minPeriod: string
    maxPeriod: string
    periods: string[]
    yearlyTotals: Array<{ year: number; nodeCount: number; earlyWarningCount: number; avgRisk: number }>
    monthlyTotals: Array<{ period: string; nodeCount: number; earlyWarningCount: number; avgRisk: number }>
    perFirm: Record<string, unknown>
  }
  nodes: MapNode[]
  edges: MapEdge[]
  degraded?: boolean
  fallbackReason?: string
}

function buildMinimalPayload(limit: number, reason: string): IndustryMapPayload {
  const now = new Date()
  const year = now.getUTCFullYear()
  const period = now.toISOString().slice(0, 7)

  return {
    success: true,
    count: 0,
    clusters: {
      highRisk: 0,
      stable: 0,
      earlyWarning: 0,
    },
    layers: ['regulatory', 'risk', 'community'],
    timeline: {
      minYear: year,
      maxYear: year,
      years: [year],
      minPeriod: period,
      maxPeriod: period,
      periods: [period],
      yearlyTotals: [{ year, nodeCount: 0, earlyWarningCount: 0, avgRisk: 0 }],
      monthlyTotals: [{ period, nodeCount: 0, earlyWarningCount: 0, avgRisk: 0 }],
      perFirm: {},
    },
    nodes: [],
    edges: [],
    degraded: true,
    fallbackReason: `${reason}:limit=${limit}`,
  }
}

function attachDegradedMeta(payload: unknown, reason: string): IndustryMapPayload {
  if (!payload || typeof payload !== 'object') {
    return buildMinimalPayload(250, reason)
  }

  const candidate = payload as IndustryMapPayload
  return {
    ...candidate,
    degraded: true,
    fallbackReason: reason,
    success: true,
  }
}

function sharedCount(a: string[], b: string[]): number {
  const setB = new Set(b)
  return a.filter((x) => setB.has(x)).length
}

export async function GET(request: NextRequest) {
  const limit = Math.min(Math.max(Number.parseInt(request.nextUrl.searchParams.get('limit') || '250', 10) || 250, 10), 1000)
  const cacheKey = `industry-map:v3:${limit}`

  const cached = await getCached<unknown>(cacheKey)
  const hasDbEnv = Boolean(process.env.DATABASE_URL || process.env.DATABASE_URL_FILE)
  const pool = getPool()

  if (!hasDbEnv || !pool) {
    if (cached) {
      return NextResponse.json(attachDegradedMeta(cached, !hasDbEnv ? 'database-env-missing' : 'database-pool-unavailable'))
    }
    return NextResponse.json(buildMinimalPayload(limit, !hasDbEnv ? 'database-env-missing' : 'database-pool-unavailable'))
  }

  if (cached) {
    return NextResponse.json(cached)
  }

  try {
    const query = `
      WITH latest_snapshot AS (
        SELECT id FROM snapshot_metadata ORDER BY created_at DESC LIMIT 1
      ),
      latest_rvi AS (
        SELECT DISTINCT ON (firm_id)
          firm_id,
          COALESCE(content_json::jsonb->>'rvi_status', 'unknown') AS rvi_status
        FROM evidence_collection
        WHERE collected_by = 'RVI'
        ORDER BY firm_id, collected_at DESC
      )
      SELECT
        f.firm_id,
        COALESCE(f.name, f.brand_name, f.firm_id) AS name,
        COALESCE(f.model_type, 'UNKNOWN') AS model_type,
        f.website_root,
        f.headquarters,
        f.jurisdiction,
        COALESCE(ss.score_0_100, 0) AS score_0_100,
        COALESCE(g.gri_score, 40) AS gri_score,
        COALESCE(g.risk_category, 'Moderate Risk') AS risk_category,
        COALESCE(g.early_warning, false) AS early_warning,
        COALESCE(g.warning_signals, '[]'::jsonb) AS warning_signals,
        COALESCE(rvi.rvi_status, 'unknown') AS rvi_status,
        COALESCE(f.payout_reliability, 0) AS payout_reliability,
        COALESCE(f.operational_stability, 0) AS operational_stability
      FROM real_firms_only f
      LEFT JOIN latest_snapshot ls ON true
      LEFT JOIN snapshot_scores ss
        ON ss.firm_id = f.firm_id
       AND ss.snapshot_id = ls.id
      LEFT JOIN v_firm_gri_latest g
        ON g.firm_id = f.firm_id
      LEFT JOIN latest_rvi rvi
        ON rvi.firm_id = f.firm_id
      ORDER BY g.gri_score DESC NULLS LAST, ss.score_0_100 DESC NULLS LAST
      LIMIT $1
    `

    const { rows } = await pool.query(query, [limit])

    const firmIds = rows.map((row) => String(row.firm_id)).filter(Boolean)

    const historyRows =
      firmIds.length > 0
        ? (
            await pool.query(
              `
                SELECT
                  firm_id,
                  MIN(snapshot_date) AS first_snapshot_date,
                  MAX(snapshot_date) AS last_snapshot_date
                FROM firm_gri_scores
                WHERE firm_id = ANY($1::text[])
                GROUP BY firm_id
              `,
              [firmIds]
            )
          ).rows
        : []

    const snapshotHistoryRows =
      firmIds.length > 0
        ? (
            await pool.query(
              `
                SELECT
                  firm_id,
                  MIN(timestamp::date) AS first_snapshot_date,
                  MAX(timestamp::date) AS last_snapshot_date
                FROM firm_score_snapshots
                WHERE firm_id = ANY($1::text[])
                GROUP BY firm_id
              `,
              [firmIds]
            )
          ).rows
        : []

    const scoreHistoryRows =
      firmIds.length > 0
        ? (
            await pool.query(
              `
                SELECT
                  ss.firm_id,
                  MIN(sm.created_at::date) AS first_snapshot_date,
                  MAX(sm.created_at::date) AS last_snapshot_date
                FROM snapshot_scores ss
                JOIN snapshot_metadata sm
                  ON sm.id = ss.snapshot_id
                WHERE ss.firm_id = ANY($1::text[])
                GROUP BY ss.firm_id
              `,
              [firmIds]
            )
          ).rows
        : []

    const monthlyRows =
      firmIds.length > 0
        ? (
            await pool.query(
              `
                SELECT
                  firm_id,
                  TO_CHAR(snapshot_date, 'YYYY-MM') AS period,
                  AVG(gri_score)::numeric AS avg_gri,
                  BOOL_OR(early_warning) AS has_early_warning
                FROM firm_gri_scores
                WHERE firm_id = ANY($1::text[])
                GROUP BY firm_id, TO_CHAR(snapshot_date, 'YYYY-MM')
              `,
              [firmIds]
            )
          ).rows
        : []

    const snapshotMonthlyRows =
      firmIds.length > 0
        ? (
            await pool.query(
              `
                SELECT
                  firm_id,
                  TO_CHAR(timestamp, 'YYYY-MM') AS period,
                  AVG(COALESCE(risk_index, score, 0))::numeric AS avg_risk,
                  AVG(COALESCE(score, 0))::numeric AS avg_score
                FROM firm_score_snapshots
                WHERE firm_id = ANY($1::text[])
                GROUP BY firm_id, TO_CHAR(timestamp, 'YYYY-MM')
              `,
              [firmIds]
            )
          ).rows
        : []

    const scoreMonthlyRows =
      firmIds.length > 0
        ? (
            await pool.query(
              `
                SELECT
                  ss.firm_id,
                  TO_CHAR(sm.created_at, 'YYYY-MM') AS period,
                  AVG(COALESCE(ss.score_0_100, 0))::numeric AS avg_score
                FROM snapshot_scores ss
                JOIN snapshot_metadata sm
                  ON sm.id = ss.snapshot_id
                WHERE ss.firm_id = ANY($1::text[])
                GROUP BY ss.firm_id, TO_CHAR(sm.created_at, 'YYYY-MM')
              `,
              [firmIds]
            )
          ).rows
        : []

    const timelineByFirm = new Map<
      string,
      {
        firstYear: number | null
        lastYear: number | null
        firstPeriod: string | null
        lastPeriod: string | null
        yearly: { year: number; avgRisk: number; earlyWarning: boolean }[]
        monthly: { period: string; avgRisk: number; earlyWarning: boolean }[]
      }
    >()

    historyRows.forEach((row) => {
      const firstYear = row.first_snapshot_date ? new Date(row.first_snapshot_date).getUTCFullYear() : null
      const lastYear = row.last_snapshot_date ? new Date(row.last_snapshot_date).getUTCFullYear() : null
      const firstPeriod = row.first_snapshot_date ? new Date(row.first_snapshot_date).toISOString().slice(0, 7) : null
      const lastPeriod = row.last_snapshot_date ? new Date(row.last_snapshot_date).toISOString().slice(0, 7) : null
      timelineByFirm.set(String(row.firm_id), { firstYear, lastYear, firstPeriod, lastPeriod, yearly: [], monthly: [] })
    })

    scoreHistoryRows.forEach((row) => {
      const firmId = String(row.firm_id)
      const firstYear = row.first_snapshot_date ? new Date(row.first_snapshot_date).getUTCFullYear() : null
      const lastYear = row.last_snapshot_date ? new Date(row.last_snapshot_date).getUTCFullYear() : null
      const existing = timelineByFirm.get(firmId) || { firstYear: null, lastYear: null, firstPeriod: null, lastPeriod: null, yearly: [], monthly: [] }
      if (existing.firstYear == null || (firstYear != null && firstYear < existing.firstYear)) existing.firstYear = firstYear
      if (existing.lastYear == null || (lastYear != null && lastYear > existing.lastYear)) existing.lastYear = lastYear
      const firstPeriod = row.first_snapshot_date ? new Date(row.first_snapshot_date).toISOString().slice(0, 7) : null
      const lastPeriod = row.last_snapshot_date ? new Date(row.last_snapshot_date).toISOString().slice(0, 7) : null
      if (existing.firstPeriod == null || (firstPeriod && firstPeriod < existing.firstPeriod)) existing.firstPeriod = firstPeriod
      if (existing.lastPeriod == null || (lastPeriod && lastPeriod > existing.lastPeriod)) existing.lastPeriod = lastPeriod
      timelineByFirm.set(firmId, existing)
    })

    snapshotHistoryRows.forEach((row) => {
      const firmId = String(row.firm_id)
      const firstYear = row.first_snapshot_date ? new Date(row.first_snapshot_date).getUTCFullYear() : null
      const lastYear = row.last_snapshot_date ? new Date(row.last_snapshot_date).getUTCFullYear() : null
      const existing = timelineByFirm.get(firmId) || { firstYear: null, lastYear: null, firstPeriod: null, lastPeriod: null, yearly: [], monthly: [] }
      if (existing.firstYear == null || (firstYear != null && firstYear < existing.firstYear)) existing.firstYear = firstYear
      if (existing.lastYear == null || (lastYear != null && lastYear > existing.lastYear)) existing.lastYear = lastYear
      const firstPeriod = row.first_snapshot_date ? new Date(row.first_snapshot_date).toISOString().slice(0, 7) : null
      const lastPeriod = row.last_snapshot_date ? new Date(row.last_snapshot_date).toISOString().slice(0, 7) : null
      if (existing.firstPeriod == null || (firstPeriod && firstPeriod < existing.firstPeriod)) existing.firstPeriod = firstPeriod
      if (existing.lastPeriod == null || (lastPeriod && lastPeriod > existing.lastPeriod)) existing.lastPeriod = lastPeriod
      timelineByFirm.set(firmId, existing)
    })

    const yearlyTotalsMap = new Map<number, { nodeCount: number; earlyWarningCount: number; riskSum: number; riskCount: number }>()
    const monthlyTotalsMap = new Map<string, { nodeCount: number; earlyWarningCount: number; riskSum: number; riskCount: number }>()
    const yearlyTotalsSeen = new Set<string>()
    const monthlyTotalsSeen = new Set<string>()

    monthlyRows.forEach((row) => {
      const firmId = String(row.firm_id)
      const period = String(row.period)
      const year = Number(period.slice(0, 4))
      const avgRisk = toNumber(row.avg_gri)
      const earlyWarning = Boolean(row.has_early_warning)

      const existing = timelineByFirm.get(firmId) || { firstYear: null, lastYear: null, firstPeriod: null, lastPeriod: null, yearly: [], monthly: [] }
      existing.monthly.push({ period, avgRisk, earlyWarning })
      existing.yearly.push({ year, avgRisk, earlyWarning })
      if (existing.firstYear == null || year < existing.firstYear) existing.firstYear = year
      if (existing.lastYear == null || year > existing.lastYear) existing.lastYear = year
      if (existing.firstPeriod == null || period < existing.firstPeriod) existing.firstPeriod = period
      if (existing.lastPeriod == null || period > existing.lastPeriod) existing.lastPeriod = period
      timelineByFirm.set(firmId, existing)

      const yearlySeenKey = `${firmId}:${year}`
      if (!yearlyTotalsSeen.has(yearlySeenKey)) {
        const totals = yearlyTotalsMap.get(year) || { nodeCount: 0, earlyWarningCount: 0, riskSum: 0, riskCount: 0 }
        totals.nodeCount += 1
        if (earlyWarning) totals.earlyWarningCount += 1
        totals.riskSum += avgRisk
        totals.riskCount += 1
        yearlyTotalsMap.set(year, totals)
        yearlyTotalsSeen.add(yearlySeenKey)
      }

      const monthlySeenKey = `${firmId}:${period}`
      if (!monthlyTotalsSeen.has(monthlySeenKey)) {
        const monthlyTotals = monthlyTotalsMap.get(period) || { nodeCount: 0, earlyWarningCount: 0, riskSum: 0, riskCount: 0 }
        monthlyTotals.nodeCount += 1
        if (earlyWarning) monthlyTotals.earlyWarningCount += 1
        monthlyTotals.riskSum += avgRisk
        monthlyTotals.riskCount += 1
        monthlyTotalsMap.set(period, monthlyTotals)
        monthlyTotalsSeen.add(monthlySeenKey)
      }
    })

    snapshotMonthlyRows.forEach((row) => {
      const firmId = String(row.firm_id)
      const period = String(row.period)
      const year = Number(period.slice(0, 4))
      const avgRisk = toNumber(row.avg_risk || row.avg_score)
      const existing = timelineByFirm.get(firmId) || { firstYear: null, lastYear: null, firstPeriod: null, lastPeriod: null, yearly: [], monthly: [] }

      if (!existing.monthly.some((entry) => entry.period === period)) {
        existing.monthly.push({ period, avgRisk, earlyWarning: false })
      }
      if (!existing.yearly.some((entry) => entry.year === year)) {
        existing.yearly.push({ year, avgRisk, earlyWarning: false })
      }
      if (existing.firstYear == null || year < existing.firstYear) existing.firstYear = year
      if (existing.lastYear == null || year > existing.lastYear) existing.lastYear = year
      if (existing.firstPeriod == null || period < existing.firstPeriod) existing.firstPeriod = period
      if (existing.lastPeriod == null || period > existing.lastPeriod) existing.lastPeriod = period
      timelineByFirm.set(firmId, existing)

      const yearlySeenKey = `${firmId}:${year}`
      if (!yearlyTotalsSeen.has(yearlySeenKey)) {
        const totals = yearlyTotalsMap.get(year) || { nodeCount: 0, earlyWarningCount: 0, riskSum: 0, riskCount: 0 }
        totals.nodeCount += 1
        totals.riskSum += avgRisk
        totals.riskCount += 1
        yearlyTotalsMap.set(year, totals)
        yearlyTotalsSeen.add(yearlySeenKey)
      }

      const monthlySeenKey = `${firmId}:${period}`
      if (!monthlyTotalsSeen.has(monthlySeenKey)) {
        const monthlyTotals = monthlyTotalsMap.get(period) || { nodeCount: 0, earlyWarningCount: 0, riskSum: 0, riskCount: 0 }
        monthlyTotals.nodeCount += 1
        monthlyTotals.riskSum += avgRisk
        monthlyTotals.riskCount += 1
        monthlyTotalsMap.set(period, monthlyTotals)
        monthlyTotalsSeen.add(monthlySeenKey)
      }
    })

    scoreMonthlyRows.forEach((row) => {
      const firmId = String(row.firm_id)
      const period = String(row.period)
      const year = Number(period.slice(0, 4))
      const avgRisk = toNumber(row.avg_score)
      const existing = timelineByFirm.get(firmId) || { firstYear: null, lastYear: null, firstPeriod: null, lastPeriod: null, yearly: [], monthly: [] }
      if (!existing.monthly.some((entry) => entry.period === period)) {
        existing.monthly.push({ period, avgRisk, earlyWarning: false })
      }
      if (!existing.yearly.some((entry) => entry.year === year)) {
        existing.yearly.push({ year, avgRisk, earlyWarning: false })
      }
      if (existing.firstYear == null || year < existing.firstYear) existing.firstYear = year
      if (existing.lastYear == null || year > existing.lastYear) existing.lastYear = year
      if (existing.firstPeriod == null || period < existing.firstPeriod) existing.firstPeriod = period
      if (existing.lastPeriod == null || period > existing.lastPeriod) existing.lastPeriod = period
      timelineByFirm.set(firmId, existing)

      const yearlySeenKey = `${firmId}:${year}`
      if (!yearlyTotalsSeen.has(yearlySeenKey)) {
        const totals = yearlyTotalsMap.get(year) || { nodeCount: 0, earlyWarningCount: 0, riskSum: 0, riskCount: 0 }
        totals.nodeCount += 1
        totals.riskSum += avgRisk
        totals.riskCount += 1
        yearlyTotalsMap.set(year, totals)
        yearlyTotalsSeen.add(yearlySeenKey)
      }

      const monthlySeenKey = `${firmId}:${period}`
      if (!monthlyTotalsSeen.has(monthlySeenKey)) {
        const monthlyTotals = monthlyTotalsMap.get(period) || { nodeCount: 0, earlyWarningCount: 0, riskSum: 0, riskCount: 0 }
        monthlyTotals.nodeCount += 1
        monthlyTotals.riskSum += avgRisk
        monthlyTotals.riskCount += 1
        monthlyTotalsMap.set(period, monthlyTotals)
        monthlyTotalsSeen.add(monthlySeenKey)
      }
    })

    const timelineYears = Array.from(yearlyTotalsMap.keys()).sort((a, b) => a - b)
    const minYear = timelineYears.length ? timelineYears[0] : new Date().getUTCFullYear() - 6
    const maxYear = timelineYears.length ? timelineYears[timelineYears.length - 1] : new Date().getUTCFullYear()
    const timelinePeriods = Array.from(monthlyTotalsMap.keys()).sort()
    const minPeriod = timelinePeriods.length ? timelinePeriods[0] : `${new Date().getUTCFullYear()}-01`
    const maxPeriod = timelinePeriods.length ? timelinePeriods[timelinePeriods.length - 1] : new Date().toISOString().slice(0, 7)

    const nodes: MapNode[] = rows.map((row) => ({
      id: row.firm_id,
      label: row.name,
      slug: normalizeSlug(row.firm_id || row.name || ''),
      websiteRoot: row.website_root ? String(row.website_root) : null,
      headquarters: row.headquarters ? String(row.headquarters) : null,
      score: toNumber(row.score_0_100),
      riskIndex: toNumber(row.gri_score, 40),
      riskCategory: String(row.risk_category || 'Moderate Risk'),
      jurisdiction: String(row.jurisdiction || 'Global'),
      rviStatus: String(row.rvi_status || 'unknown'),
      payoutReliability: toNumber(row.payout_reliability),
      operationalStability: toNumber(row.operational_stability),
      earlyWarning: Boolean(row.early_warning),
      modelType: String(row.model_type || 'UNKNOWN'),
      firstSeenPeriod: timelineByFirm.get(String(row.firm_id))?.firstPeriod ?? null,
      lastSeenPeriod: timelineByFirm.get(String(row.firm_id))?.lastPeriod ?? null,
      firstSeenYear: timelineByFirm.get(String(row.firm_id))?.firstYear ?? null,
      lastSeenYear: timelineByFirm.get(String(row.firm_id))?.lastYear ?? null,
    }))

    // Build lightweight relationship graph.
    const warningSignalsByFirm = new Map<string, string[]>()
    for (const row of rows) {
      const signals = Array.isArray(row.warning_signals)
        ? (row.warning_signals as unknown[]).map((s) => String(s))
        : []
      warningSignalsByFirm.set(String(row.firm_id), signals)
    }

    const edges: MapEdge[] = []
    const maxEdges = Math.min(nodes.length * 3, 2000)

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        if (edges.length >= maxEdges) break
        const a = nodes[i]
        const b = nodes[j]

        if (a.jurisdiction === b.jurisdiction && a.jurisdiction !== 'Global') {
          edges.push({ source: a.id, target: b.id, relation: 'jurisdiction', weight: 0.5 })
          continue
        }

        if (a.riskCategory === b.riskCategory && (a.riskCategory === 'High Risk' || a.riskCategory === 'Critical Risk')) {
          edges.push({ source: a.id, target: b.id, relation: 'risk-cluster', weight: 0.7 })
          continue
        }

        const sharedWarnings = sharedCount(
          warningSignalsByFirm.get(a.id) || [],
          warningSignalsByFirm.get(b.id) || []
        )
        if (sharedWarnings >= 1) {
          edges.push({
            source: a.id,
            target: b.id,
            relation: 'warning-signal',
            weight: Math.min(1, 0.4 + sharedWarnings * 0.2),
          })
        }
      }
    }

    const clusters = {
      highRisk: nodes.filter((n) => n.riskCategory === 'High Risk' || n.riskCategory === 'Critical Risk').length,
      stable: nodes.filter((n) => n.riskCategory === 'Low Risk' || n.riskCategory === 'Moderate Risk').length,
      earlyWarning: nodes.filter((n) => n.earlyWarning).length,
    }

    const payload: IndustryMapPayload = {
      success: true,
      count: nodes.length,
      clusters,
      layers: ['regulatory', 'risk', 'community'],
      timeline: {
        minYear,
        maxYear,
        years: timelineYears,
        minPeriod,
        maxPeriod,
        periods: timelinePeriods,
        yearlyTotals: timelineYears.map((year) => {
          const totals = yearlyTotalsMap.get(year) || { nodeCount: 0, earlyWarningCount: 0, riskSum: 0, riskCount: 0 }
          return {
            year,
            nodeCount: totals.nodeCount,
            earlyWarningCount: totals.earlyWarningCount,
            avgRisk: totals.riskCount ? Number((totals.riskSum / totals.riskCount).toFixed(2)) : 0,
          }
        }),
        monthlyTotals: timelinePeriods.map((period) => {
          const totals = monthlyTotalsMap.get(period) || { nodeCount: 0, earlyWarningCount: 0, riskSum: 0, riskCount: 0 }
          return {
            period,
            nodeCount: totals.nodeCount,
            earlyWarningCount: totals.earlyWarningCount,
            avgRisk: totals.riskCount ? Number((totals.riskSum / totals.riskCount).toFixed(2)) : 0,
          }
        }),
        perFirm: Object.fromEntries(
          Array.from(timelineByFirm.entries()).map(([firmId, value]) => [
            firmId,
            {
              firstPeriod: value.firstPeriod,
              lastPeriod: value.lastPeriod,
              firstYear: value.firstYear,
              lastYear: value.lastYear,
              monthly: value.monthly.sort((a, b) => a.period.localeCompare(b.period)),
              yearly: value.yearly.sort((a, b) => a.year - b.year),
            },
          ])
        ),
      },
      nodes,
      edges,
    }

    void setCached(cacheKey, payload, 90)
    return NextResponse.json(payload)
  } catch (error) {
    const stale = await getCached<unknown>(cacheKey)
    if (stale) {
      return NextResponse.json(attachDegradedMeta(stale, 'query-failure-stale-cache'))
    }

    return NextResponse.json(buildMinimalPayload(limit, `query-failure:${error instanceof Error ? error.message : 'unknown-error'}`))
  }
}
