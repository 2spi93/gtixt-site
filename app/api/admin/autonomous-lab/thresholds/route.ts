import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import { listPromotionThresholds, updatePromotionThreshold } from '@/lib/autonomous-lab/registry'
import type { LabModule } from '@/lib/autonomous-lab/types'

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer', 'auditor'])
  if (auth instanceof NextResponse) return auth

  const data = await listPromotionThresholds()
  return NextResponse.json({ success: true, data })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const body = await request.json()
  const moduleName = String(body?.module || '').trim() as LabModule
  if (!['scoring', 'webgl', 'pipeline', 'operator'].includes(moduleName)) {
    return NextResponse.json({ error: 'invalid module' }, { status: 400 })
  }

  const numeric = (v: unknown): number | undefined => {
    if (v === undefined || v === null || v === '') return undefined
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }

  const updated = await updatePromotionThreshold(moduleName, {
    minCoverageDelta: numeric(body?.minCoverageDelta),
    minStabilityDelta: numeric(body?.minStabilityDelta),
    minAnomaliesDelta: numeric(body?.minAnomaliesDelta),
    minRiskSeparationDelta: numeric(body?.minRiskSeparationDelta),
    minSnapshotDriftDelta: numeric(body?.minSnapshotDriftDelta),
    minBucketChurnDelta: numeric(body?.minBucketChurnDelta),
    minPerfDelta: numeric(body?.minPerfDelta),
    minQualityDelta: numeric(body?.minQualityDelta),
    minDecisionScore: numeric(body?.minDecisionScore),
  })

  return NextResponse.json({ success: true, data: updated })
}
