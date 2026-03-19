import { NextResponse } from 'next/server'
import { loadPublicFirmUniverse } from '@/lib/public-firms'
import { buildMarketInsightsReport } from '@/lib/market-insights'
import { computeSystemicRisk } from '@/lib/risk-engine'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { firms, snapshotInfo } = await loadPublicFirmUniverse()
    const report = buildMarketInsightsReport(firms)
    const systemicRisk = computeSystemicRisk(firms)

    return NextResponse.json({
      success: true,
      generated_at: new Date().toISOString(),
      snapshot_info: {
        object: snapshotInfo.object,
        sha256: snapshotInfo.sha256 || null,
        created_at: snapshotInfo.created_at || null,
      },
      systemic_risk: systemicRisk,
      insights: report.insights,
      rising: report.rising,
      warnings: report.warnings,
      stressed: report.stressed,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to build market insights',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
