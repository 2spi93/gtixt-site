import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/internal-db'
import { toNumber } from '@/lib/intelligence'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const pool = getPool()
  if (!pool) {
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
  }

  const searchParams = request.nextUrl.searchParams
  const limit = Math.min(Math.max(Number.parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 500)
  const days = Math.min(Math.max(Number.parseInt(searchParams.get('days') || '7', 10) || 7, 1), 30)
  const minScore = Math.max(Number.parseFloat(searchParams.get('minScore') || '0') || 0, 0)

  try {
    const eventsQuery = `
      WITH latest_rvi AS (
        SELECT DISTINCT ON (firm_id)
          firm_id,
          COALESCE(content_json::jsonb->>'rvi_status', 'unknown') AS rvi_status
        FROM evidence_collection
        WHERE collected_by = 'RVI'
        ORDER BY firm_id, collected_at DESC
      ),
      latest_warning AS (
        SELECT
          g.firm_id,
          g.snapshot_date,
          g.computed_at,
          g.gri_score,
          g.risk_category,
          g.operational_score,
          g.financial_score,
          g.behavioural_score,
          g.community_score,
          g.infrastructure_score,
          g.warning_signals,
          ROW_NUMBER() OVER (PARTITION BY g.firm_id ORDER BY g.computed_at DESC NULLS LAST, g.snapshot_date DESC) AS rn
        FROM firm_gri_scores g
        WHERE g.early_warning = true
          AND g.snapshot_date >= CURRENT_DATE - ($1::int || ' days')::interval
          AND g.gri_score >= $2::numeric
      )
      SELECT
        lw.firm_id,
        COALESCE(f.name, f.brand_name, lw.firm_id) AS firm_name,
        f.website_root,
        f.jurisdiction,
        lw.gri_score,
        lw.risk_category,
        lw.operational_score,
        lw.financial_score,
        lw.behavioural_score,
        lw.community_score,
        lw.infrastructure_score,
        lw.warning_signals,
        lw.snapshot_date,
        lw.computed_at,
        COALESCE(f.payout_reliability, 0) AS payout_reliability,
        COALESCE(f.operational_status, f.status, 'unknown') AS operational_status,
        COALESCE(rvi.rvi_status, 'unknown') AS rvi_status
      FROM latest_warning lw
      JOIN firms f ON f.firm_id = lw.firm_id
      LEFT JOIN latest_rvi rvi ON rvi.firm_id = lw.firm_id
      WHERE lw.rn = 1
        AND (f.status IS NULL OR f.status != 'excluded')
      ORDER BY lw.gri_score DESC, lw.computed_at DESC
      LIMIT $3
    `

    const distributionQuery = `
      WITH latest_day AS (
        SELECT MAX(snapshot_date) AS snapshot_date
        FROM firm_gri_scores
      )
      SELECT risk_category, COUNT(*)::int AS count
      FROM firm_gri_scores
      WHERE snapshot_date = (SELECT snapshot_date FROM latest_day)
      GROUP BY risk_category
    `

    const [eventsRes, distRes] = await Promise.all([
      pool.query(eventsQuery, [days, minScore, limit]),
      pool.query(distributionQuery),
    ])

    const events = eventsRes.rows.map((row) => {
      const griScore = toNumber(row.gri_score)
      const warningSignals = Array.isArray(row.warning_signals) ? row.warning_signals : []
      const computedAt = row.computed_at ? new Date(row.computed_at).toISOString() : null
      const payoutReliability = toNumber(row.payout_reliability)
      const operationalStatus = String(row.operational_status || 'unknown').toLowerCase()
      const rviStatus = String(row.rvi_status || 'unknown').toLowerCase()

      const payoutRisk = payoutReliability > 0 ? (100 - payoutReliability) * 0.22 : 8
      const opPenalty = /(suspend|cancel|inactive|revoked|failed)/.test(operationalStatus)
        ? 22
        : /(watch|review|restrict|limited)/.test(operationalStatus)
          ? 12
          : 0
      const regulatorPenalty = /(suspicious|fake|revoked|suspend|cancel)/.test(rviStatus)
        ? 18
        : rviStatus === 'unknown'
          ? 4
          : 0

      const collapseProbability = Math.max(0, Math.min(100,
        Math.round(
          (griScore * 0.55) +
          (warningSignals.length * 6) +
          payoutRisk +
          (toNumber(row.behavioural_score) * 0.1) +
          (toNumber(row.community_score) * 0.07) +
          opPenalty +
          regulatorPenalty
        )
      ))

      const status = collapseProbability >= 70 ? 'Danger' : collapseProbability >= 45 ? 'Watch' : 'Healthy'

      const stabilityScore = Math.max(0, Math.min(100, Math.round(
        (100 - griScore) * 0.5 +
        (payoutReliability > 0 ? payoutReliability : 55) * 0.35 +
        (opPenalty > 0 ? 30 : 75) * 0.15
      )))

      const snapshotIso = new Date(row.snapshot_date).toISOString()

      return {
        firm_id: row.firm_id,
        firm_name: row.firm_name,
        website: row.website_root,
        jurisdiction: row.jurisdiction,
        gri_score: griScore,
        risk_category: row.risk_category,
        warning_signals: warningSignals,
        dimensions: {
          operational: toNumber(row.operational_score),
          financial: toNumber(row.financial_score),
          behavioural: toNumber(row.behavioural_score),
          community: toNumber(row.community_score),
          infrastructure: toNumber(row.infrastructure_score),
        },
        snapshot_date: snapshotIso,
        computed_at: computedAt,
        status,
        collapse_probability: collapseProbability,
        stability_score: stabilityScore,
        signal_count: warningSignals.length,
        is_new_alert: computedAt ? (Date.now() - new Date(computedAt).getTime()) <= 24 * 60 * 60 * 1000 : false,
        share_text: `GTIXT Live Alert: ${row.firm_name} is ${status} (${collapseProbability}%). Signals: ${warningSignals.slice(0, 3).join(', ') || 'operational anomalies'}. Source: live evidence + GRI.`,
        share_url: `https://gtixt.com/risk-radar?firm=${encodeURIComponent(row.firm_id)}`,
      }
    })

    const distribution = {
      low: 0,
      moderate: 0,
      elevated: 0,
      high: 0,
      critical: 0,
    }

    for (const row of distRes.rows) {
      const category = String(row.risk_category || '').toLowerCase()
      const count = Number(row.count || 0)
      if (category.includes('low')) distribution.low = count
      if (category.includes('moderate')) distribution.moderate = count
      if (category.includes('elevated')) distribution.elevated = count
      if (category.includes('high')) distribution.high = count
      if (category.includes('critical')) distribution.critical = count
    }

    const highRiskFirms = [...events]
      .filter((event) => event.status === 'Danger' || event.status === 'Watch')
      .sort((a, b) => b.collapse_probability - a.collapse_probability)
      .slice(0, 12)

    const stabilityRanking = [...events]
      .sort((a, b) => b.stability_score - a.stability_score)
      .slice(0, 12)

    const newAlerts = events
      .filter((event) => event.is_new_alert)
      .sort((a, b) => {
        const aTs = a.computed_at ? new Date(a.computed_at).getTime() : new Date(a.snapshot_date).getTime()
        const bTs = b.computed_at ? new Date(b.computed_at).getTime() : new Date(b.snapshot_date).getTime()
        return bTs - aTs
      })

    return NextResponse.json({
      success: true,
      window_days: days,
      count: events.length,
      data_source: 'live_evidence',
      as_of: new Date().toISOString(),
      data: events,
      high_risk_firms: highRiskFirms,
      new_alerts: newAlerts,
      stability_ranking: stabilityRanking,
      distribution,
      headline: `${events.length} firm(s) showing instability signals`,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load early warning radar',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
