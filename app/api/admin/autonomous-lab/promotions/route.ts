import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import { createPromotionRequest, listPromotionRequests, updateExperiment } from '@/lib/autonomous-lab/registry'

function makePromotionId(): string {
  return `prom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer', 'auditor'])
  if (auth instanceof NextResponse) return auth

  const limit = Number(request.nextUrl.searchParams.get('limit') || '100')
  const data = await listPromotionRequests(limit)
  return NextResponse.json({ success: true, data })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const body = await request.json()
  const experimentId = String(body?.experimentId || '').trim()
  const reason = typeof body?.reason === 'string' ? body.reason : null

  if (!experimentId) {
    return NextResponse.json({ error: 'experimentId is required' }, { status: 400 })
  }

  const promotion = await createPromotionRequest({
    id: makePromotionId(),
    experimentId,
    reason: reason || undefined,
    requestedBy: auth.user?.username || 'admin',
  })

  await updateExperiment(experimentId, { status: 'review_required' })

  return NextResponse.json({ success: true, data: promotion }, { status: 201 })
}
