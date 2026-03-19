import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import { advanceCanary, rollbackCanary, getCanaryByPromotion } from '@/lib/autonomous-lab/canary-policy'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer', 'auditor'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // id can be a canary id or a promotion id — try by promotion first
  const state = await getCanaryByPromotion(id)
  if (!state) return NextResponse.json({ error: 'canary state not found' }, { status: 404 })

  return NextResponse.json({ success: true, data: state })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body = await request.json()
  const action = body?.action as string | undefined

  if (action === 'rollback') {
    const reason =
      typeof body?.reason === 'string' && body.reason.trim()
        ? body.reason.trim()
        : 'Rollback manuel déclenché par opérateur'
    const state = await rollbackCanary(id, reason)
    return NextResponse.json({ success: true, data: state })
  }

  if (action === 'advance') {
    const currentErrorRate =
      typeof body?.currentErrorRate === 'number'
        ? Math.max(0, Math.min(1, body.currentErrorRate))
        : 0
    const { state, autoRolledBack } = await advanceCanary(id, currentErrorRate)
    return NextResponse.json({ success: true, data: state, autoRolledBack })
  }

  return NextResponse.json({ error: "action must be 'advance' or 'rollback'" }, { status: 400 })
}
