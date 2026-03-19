import { NextRequest, NextResponse } from 'next/server'
import { loadPublicFirmUniverse, normalizePublicFirmSlug } from '@/lib/public-firms'
import { getCached, setCached } from '@/lib/redis-cache'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  const normalizedSlug = normalizePublicFirmSlug(slug)
  const cacheKey = `firm-profile:v2:${normalizedSlug}`

  const cached = await getCached<unknown>(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  try {
    const { firms, snapshotInfo } = await loadPublicFirmUniverse()

    const record = firms.find((firm) => {
      const byFirmId = firm.firm_id ? normalizePublicFirmSlug(firm.firm_id) : ''
      const byName = firm.name ? normalizePublicFirmSlug(firm.name) : ''
      return byFirmId === normalizedSlug || byName === normalizedSlug
    })

    if (!record) {
      return NextResponse.json({ success: false, error: 'Firm not found' }, { status: 404 })
    }

    const score = Number(record.score_0_100 || 0)
    const risk = score >= 80 ? 'LOW' : score >= 65 ? 'MEDIUM' : 'HIGH'

    const payload = {
      success: true,
      data: {
        slug: normalizedSlug,
        firm_id: record.firm_id || null,
        name: record.name || 'Unknown',
        website: record.website_root || null,
        jurisdiction: record.jurisdiction || 'Global',
        jurisdiction_tier: record.jurisdiction_tier || null,
        score,
        risk,
        status: record.status || null,
        founded: record.founded_year || null,
        payoutFrequency: record.payout_frequency || null,
        maxAccountSizeUsd: record.account_size_usd || null,
        pillars: {
          payoutReliability: Number(record.payout_reliability || 0),
          riskModelIntegrity: Number(record.risk_model_integrity || 0),
          operationalStability: Number(record.operational_stability || 0),
          historicalConsistency: Number(record.historical_consistency || 0),
        },
      },
      snapshot_info: {
        object: snapshotInfo.object,
        sha256: snapshotInfo.sha256 || null,
        created_at: snapshotInfo.created_at || null,
        source: 'remote',
      },
    }

    void setCached(cacheKey, payload, 180)
    return NextResponse.json(payload)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch firm profile',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
