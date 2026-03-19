import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import { getExperimentById, updateExperiment } from '@/lib/autonomous-lab/registry'
import type { ExperimentStatus } from '@/lib/autonomous-lab/types'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer', 'auditor'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const experiment = await getExperimentById(id)
  if (!experiment) {
    return NextResponse.json({ error: 'experiment not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: experiment })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const { id } = await params
  const body = await request.json()
  const patch = {
    hypothesis: typeof body?.hypothesis === 'string' ? body.hypothesis : undefined,
    changes: Array.isArray(body?.changes) ? body.changes.map((x: unknown) => String(x)).filter(Boolean) : undefined,
    status: typeof body?.status === 'string' ? (body.status as ExperimentStatus) : undefined,
    metrics: typeof body?.metrics === 'object' && body.metrics != null ? body.metrics : undefined,
    candidateConfig: typeof body?.candidateConfig === 'object' && body.candidateConfig != null ? body.candidateConfig : undefined,
    orchestratorReport: typeof body?.orchestratorReport === 'object' && body.orchestratorReport != null ? body.orchestratorReport : undefined,
  }

  const updated = await updateExperiment(id, patch)
  if (!updated) {
    return NextResponse.json({ error: 'experiment not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: updated })
}
