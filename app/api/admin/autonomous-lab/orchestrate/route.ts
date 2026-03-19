import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import { getExperimentById, updateExperiment } from '@/lib/autonomous-lab/registry'
import { runMinimalOrchestrator } from '@/lib/autonomous-lab/orchestrator'

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const body = await request.json()
  const experimentId = typeof body?.experimentId === 'string' ? body.experimentId : ''
  if (!experimentId) {
    return NextResponse.json({ error: 'experimentId is required' }, { status: 400 })
  }

  const experiment = await getExperimentById(experimentId)
  if (!experiment) {
    return NextResponse.json({ error: 'experiment not found' }, { status: 404 })
  }

  await updateExperiment(experimentId, { status: 'running' })

  const origin = request.headers.get('origin') || 'http://127.0.0.1:3000'
  const orchestration = await runMinimalOrchestrator({ experiment, baseUrl: origin })

  const updated = await updateExperiment(experimentId, {
    status: orchestration.recommendation === 'reject' ? 'rejected' : orchestration.recommendation === 'promote_for_review' ? 'review_required' : 'tested',
    metrics: orchestration.mergedMetrics,
    orchestratorReport: {
      steps: orchestration.steps,
      recommendation: orchestration.recommendation,
      humanReport: orchestration.humanReport,
      reviewedAt: new Date().toISOString(),
      reviewedBy: auth.user?.username || 'admin',
    },
  })

  return NextResponse.json({ success: true, data: updated, orchestration })
}
