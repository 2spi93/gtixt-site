import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import { runShadowScoring } from '@/lib/autonomous-lab/shadow-scoring'
import { updateExperiment } from '@/lib/autonomous-lab/registry'

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const body = await request.json()
  const experimentId = typeof body?.experimentId === 'string' ? body.experimentId : null

  const shadow = await runShadowScoring({
    sampleLimit: Number(body?.sampleLimit || 800),
    candidateBias: typeof body?.candidateBias === 'number' ? body.candidateBias : undefined,
    naPenaltyWeight: typeof body?.naPenaltyWeight === 'number' ? body.naPenaltyWeight : undefined,
  })

  if (experimentId) {
    await updateExperiment(experimentId, {
      status: 'tested',
      metrics: {
        coverageDelta: shadow.coverageDelta,
        stabilityDelta: shadow.stabilityDelta,
        anomaliesDelta: shadow.anomaliesDelta,
        riskSeparationDelta: shadow.riskSeparationDelta,
        snapshotDriftDelta: shadow.snapshotDriftDelta,
        bucketChurnDelta: shadow.bucketChurnDelta,
      },
      orchestratorReport: {
        shadow,
        updatedBy: auth.user?.username || 'admin',
        mode: 'shadow-only',
      },
    })
  }

  return NextResponse.json({ success: true, data: shadow })
}
