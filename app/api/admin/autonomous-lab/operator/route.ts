import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import { runSafeOperatorAction } from '@/lib/autonomous-lab/operator'
import type { SafeOperatorAction } from '@/lib/autonomous-lab/types'

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer', 'auditor'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const body = await request.json()
  const action = body as SafeOperatorAction
  if (!action || typeof action.type !== 'string') {
    return NextResponse.json({ error: 'invalid action' }, { status: 400 })
  }

  const payload = {
    ...action,
    payload: {
      ...(action.payload || {}),
      baseUrl: action.payload?.baseUrl || (request.headers.get('origin') || 'http://127.0.0.1:3000'),
    },
  }

  const result = await runSafeOperatorAction(payload, {
    role: auth.user?.role,
    username: auth.user?.username,
  })
  return NextResponse.json({ success: true, data: result })
}
