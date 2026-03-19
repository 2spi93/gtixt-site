import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import { createCanaryState, listCanaryStates } from '@/lib/autonomous-lab/canary-policy'

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer', 'auditor'])
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(request.url)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))

  const states = await listCanaryStates(limit)
  return NextResponse.json({ success: true, data: states, count: states.length })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const body = await request.json()
  const promotionId = typeof body?.promotionId === 'string' ? body.promotionId.trim() : ''
  const experimentId = typeof body?.experimentId === 'string' ? body.experimentId.trim() : ''

  if (!promotionId || !experimentId) {
    return NextResponse.json({ error: 'promotionId and experimentId are required' }, { status: 400 })
  }

  const maxErrorRate =
    typeof body?.maxErrorRate === 'number' ? Math.max(0.001, Math.min(0.5, body.maxErrorRate)) : 0.02
  const minStabilityDelta =
    typeof body?.minStabilityDelta === 'number' ? body.minStabilityDelta : 0

  const state = await createCanaryState({ promotionId, experimentId, maxErrorRate, minStabilityDelta })
  return NextResponse.json({ success: true, data: state })
}
