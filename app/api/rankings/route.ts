import { NextRequest, NextResponse } from 'next/server'
import { loadPublicFirmUniverse, normalizePublicFirmSlug } from '@/lib/public-firms'
import { getPool } from '@/lib/internal-db'
import { getCached, setCached } from '@/lib/redis-cache'

export const dynamic = 'force-dynamic'

function toRisk(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score >= 80) return 'LOW'
  if (score >= 65) return 'MEDIUM'
  return 'HIGH'
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = Math.min(Number.parseInt(searchParams.get('limit') || '50', 10) || 50, 500)
  const offset = Math.max(Number.parseInt(searchParams.get('offset') || '0', 10) || 0, 0)
  const q = (searchParams.get('q') || '').trim().toLowerCase()
  const jurisdiction = (searchParams.get('jurisdiction') || 'all').trim().toLowerCase()
  const risk = (searchParams.get('risk') || 'all').trim().toUpperCase()
  const cacheKey = `rankings:v3:${limit}:${offset}:${q}:${jurisdiction}:${risk}`

  const cached = await getCached<unknown>(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  try {
    const { firms, snapshotInfo } = await loadPublicFirmUniverse()
    const pool = getPool()

    let coverageByFirm = new Map<string, { activeSources: number; sourceNames: string[]; lastCollectedAt: string | null }>()
    let latestCollectedAt: string | null = null
    if (pool) {
      const firmIds = firms.map((firm) => firm.firm_id).filter((value): value is string => Boolean(value))
      if (firmIds.length > 0) {
        const coverageResult = await pool.query(
          `
            SELECT
              firm_id,
              COUNT(DISTINCT source) AS active_sources,
              ARRAY_AGG(DISTINCT source ORDER BY source) AS source_names,
              MAX(captured_at) AS last_collected_at
            FROM firm_external_history_signals
            WHERE firm_id = ANY($1::text[])
            GROUP BY firm_id
          `,
          [firmIds]
        )

        coverageByFirm = new Map(
          coverageResult.rows.map((row) => [
            String(row.firm_id),
            {
              activeSources: Number(row.active_sources || 0),
              sourceNames: Array.isArray(row.source_names) ? row.source_names.map((value: unknown) => String(value)) : [],
              lastCollectedAt: row.last_collected_at ? new Date(row.last_collected_at).toISOString() : null,
            },
          ])
        )

        latestCollectedAt = coverageResult.rows.reduce<string | null>((latest, row) => {
          if (!row.last_collected_at) return latest
          const candidate = new Date(row.last_collected_at).toISOString()
          if (!latest || candidate > latest) return candidate
          return latest
        }, null)
      }
    }

    const rows = firms
      .map((firm, idx) => {
        const score = Number(firm.score_0_100 || 0)
        const firmName = (firm.name || `Firm ${idx + 1}`).trim()
        const coverage = firm.firm_id ? coverageByFirm.get(firm.firm_id) : undefined
        return {
          rank: idx + 1,
          slug: normalizePublicFirmSlug(firm.firm_id || firmName),
          firm_id: firm.firm_id || null,
          name: firmName,
          jurisdiction: firm.jurisdiction || 'Global',
          score,
          payoutReliability: Number(firm.payout_reliability || 0),
          risk: toRisk(score),
          status: firm.status || null,
          rule_changes_frequency: firm.rule_changes_frequency || null,
          externalCoverage: {
            activeSources: coverage?.activeSources || 0,
            sourceNames: coverage?.sourceNames || [],
            lastCollectedAt: coverage?.lastCollectedAt || null,
          },
        }
      })
      .filter((row) => {
        const matchesQ = !q || row.name.toLowerCase().includes(q) || row.jurisdiction.toLowerCase().includes(q)
        const matchesJ = jurisdiction === 'all' || row.jurisdiction.toLowerCase() === jurisdiction
        const matchesR = risk === 'ALL' || row.risk === risk
        return matchesQ && matchesJ && matchesR
      })

    const sliced = rows.slice(offset, offset + limit)

    const payload = {
      success: true,
      count: sliced.length,
      total: rows.length,
      limit,
      offset,
      data: sliced,
      snapshot_info: {
        object: snapshotInfo.object,
        sha256: snapshotInfo.sha256 || null,
        created_at: snapshotInfo.created_at || null,
        source: 'remote',
      },
      freshness: {
        generated_at: new Date().toISOString(),
        snapshot_created_at: snapshotInfo.created_at || null,
        fallback_collected_at: latestCollectedAt,
      },
    }

    void setCached(cacheKey, payload, 120)
    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to build rankings data',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
