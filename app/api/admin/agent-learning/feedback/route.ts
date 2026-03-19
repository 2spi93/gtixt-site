import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import { listAgentFeedback, runAgentLearningLoop } from '@/lib/agent-learning/agent-feedback'
import { getSecretEnv } from '@/lib/secret-env'

function hasAlsServiceAccess(request: NextRequest): boolean {
  const expected = getSecretEnv('ALS_API_TOKEN') || getSecretEnv('ALS_SERVICE_TOKEN')
  const provided = (
    request.headers.get('x-als-service-token') ||
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    ''
  ).trim()

  return Boolean(expected && provided && expected === provided)
}

export async function GET(request: NextRequest) {
  const serviceAccess = hasAlsServiceAccess(request)
  if (!serviceAccess) {
    const auth = await requireAdminUser(request, ['admin', 'lead_reviewer'])
    if (auth instanceof NextResponse) return auth
  }

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const url = new URL(request.url)
  const agentName = url.searchParams.get('agentName') || undefined
  const taskType = url.searchParams.get('taskType') || undefined
  const limit = Number(url.searchParams.get('limit') || 100)

  const events = await listAgentFeedback({ agentName, taskType, limit })
  return NextResponse.json({ success: true, events })
}

export async function POST(request: NextRequest) {
  const serviceAccess = hasAlsServiceAccess(request)
  if (!serviceAccess) {
    const auth = await requireAdminUser(request, ['admin', 'lead_reviewer'])
    if (auth instanceof NextResponse) return auth
  }

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  const agentName = String(body.agentName || '').trim()
  const taskType = String(body.taskType || '').trim()
  const success = body.success === true

  if (!agentName || !taskType) {
    return NextResponse.json(
      { success: false, error: 'agentName and taskType are required' },
      { status: 400 },
    )
  }

  const learning = await runAgentLearningLoop({
    agentName,
    taskType,
    input: body.input && typeof body.input === 'object' ? (body.input as Record<string, unknown>) : {},
    output:
      body.output && typeof body.output === 'object' ? (body.output as Record<string, unknown>) : {},
    success,
    score: Number(body.score || 0),
    confidence: Number(body.confidence || body.score || 0),
    latencyMs: Number(body.latencyMs || 0),
    error: body.error ? String(body.error) : null,
    metadata:
      body.metadata && typeof body.metadata === 'object'
        ? (body.metadata as Record<string, unknown>)
        : {},
    occurredAt: body.occurredAt ? String(body.occurredAt) : undefined,
  })

  return NextResponse.json({ success: true, learning })
}