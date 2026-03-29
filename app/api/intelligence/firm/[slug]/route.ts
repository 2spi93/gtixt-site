import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/internal-db'
import { normalizeSlug, toNumber } from '@/lib/intelligence'
import { getCached, setCached } from '@/lib/redis-cache'

export const dynamic = 'force-dynamic'

function regulatorLabelToStatus(label: string): 'Verified' | 'Unknown' | 'Suspicious' {
  const normalized = label.toLowerCase()
  if (normalized.includes('verified')) return 'Verified'
  if (normalized.includes('suspicious') || normalized.includes('fake')) return 'Suspicious'
  return 'Unknown'
}

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const pool = getPool()
  if (!pool) {
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
  }

  const { slug } = await context.params
  const normalizedSlug = normalizeSlug(slug)
  const cacheKey = `intelligence-firm:v1:${normalizedSlug}`

  const cached = await getCached<unknown>(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  try {
    const query = `
      WITH target_firm AS (
        SELECT
          f.firm_id,
          f.name,
          f.brand_name,
          f.website_root,
          f.jurisdiction,
          f.payout_reliability,
          f.operational_stability,
          f.status,
          f.founded_year,
          regexp_replace(lower(COALESCE(f.firm_id, '')), '[^a-z0-9]+', '-', 'g') AS slug_firm_id,
          regexp_replace(lower(COALESCE(f.name, '')), '[^a-z0-9]+', '-', 'g') AS slug_name
        FROM real_firms_only f
      ),
      latest_snapshot AS (
        SELECT id, snapshot_key, created_at
        FROM snapshot_metadata
        ORDER BY created_at DESC
        LIMIT 1
      ),
      latest_rvi AS (
        SELECT
          ec.firm_id,
          COALESCE(ec.content_json::jsonb->>'rvi_status', 'unknown') AS rvi_status,
          COALESCE((ec.content_json::jsonb->>'rvi_score')::numeric, 40) AS rvi_score
        FROM evidence_collection ec
        WHERE ec.collected_by = 'RVI'
        ORDER BY ec.collected_at DESC
      )
      SELECT
        tf.firm_id,
        COALESCE(tf.name, tf.brand_name, tf.firm_id) AS firm_name,
        tf.website_root,
        tf.jurisdiction,
        tf.status,
        tf.founded_year,
        COALESCE(tf.payout_reliability, 0) AS payout_reliability,
        COALESCE(tf.operational_stability, 0) AS operational_stability,
        COALESCE(ss.score_0_100, 0) AS gtixt_score,
        COALESCE(g.gri_score, 40) AS risk_index,
        COALESCE(g.risk_category, 'Moderate Risk') AS risk_category,
        COALESCE(g.early_warning, false) AS early_warning,
        COALESCE(rvi.rvi_status, 'unknown') AS rvi_status,
        COALESCE(rvi.rvi_score, 40) AS rvi_score,
        ls.snapshot_key,
        ls.created_at AS snapshot_created_at
      FROM target_firm tf
      LEFT JOIN latest_snapshot ls ON true
      LEFT JOIN snapshot_scores ss
        ON ss.firm_id = tf.firm_id
       AND ss.snapshot_id = ls.id
      LEFT JOIN v_firm_gri_latest g
        ON g.firm_id = tf.firm_id
      LEFT JOIN LATERAL (
        SELECT lr.rvi_status, lr.rvi_score
        FROM latest_rvi lr
        WHERE lr.firm_id = tf.firm_id
        LIMIT 1
      ) rvi ON true
      WHERE tf.slug_firm_id = $1 OR tf.slug_name = $1
      LIMIT 1
    `

    const { rows } = await pool.query(query, [normalizedSlug])
    if (!rows.length) {
      return NextResponse.json({ success: false, error: 'Firm not found' }, { status: 404 })
    }

    const row = rows[0]
    const gtixtScore = toNumber(row.gtixt_score)
    const riskIndex = toNumber(row.risk_index, 40)
    const payoutReliability = toNumber(row.payout_reliability)
    const operationalStability = toNumber(row.operational_stability)

    const payload = {
      success: true,
      data: {
        firm_id: row.firm_id,
        name: row.firm_name,
        website: row.website_root,
        jurisdiction: row.jurisdiction,
        status: row.status,
        founded_year: row.founded_year,
        gtixt_score: gtixtScore,
        risk_index: riskIndex,
        risk_category: row.risk_category,
        early_warning: Boolean(row.early_warning),
        regulatory_status: regulatorLabelToStatus(String(row.rvi_status || 'unknown')),
        rvi_status: row.rvi_status,
        rvi_score: toNumber(row.rvi_score, 40),
        payout_reliability: payoutReliability,
        operational_stability: operationalStability,
      },
      snapshot_info: {
        snapshot_key: row.snapshot_key,
        created_at: row.snapshot_created_at,
      },
      summary: {
        gtixt_score: gtixtScore,
        risk_index: riskIndex,
        regulatory_status: regulatorLabelToStatus(String(row.rvi_status || 'unknown')),
        payout_reliability: payoutReliability,
        operational_stability: operationalStability,
      },
    }

    void setCached(cacheKey, payload, 120)
    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to build intelligence profile',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
