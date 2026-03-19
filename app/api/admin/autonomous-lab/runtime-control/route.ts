import { NextRequest, NextResponse } from 'next/server'
import { getClientIpFromRequest, requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import { prisma } from '@/lib/prisma'
import {
  getRuntimeControlState,
  updateRuntimeControlState,
  type RuntimeControlMode,
} from '@/lib/autonomous-lab/runtime-control'

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer', 'auditor'])
  if (auth instanceof NextResponse) return auth

  const data = await getRuntimeControlState()
  return NextResponse.json({ success: true, data })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  const mode = String(body?.mode || 'auto').trim().toLowerCase() as RuntimeControlMode

  if (!['auto', 'fast', 'safe'].includes(mode)) {
    return NextResponse.json({ error: 'invalid mode' }, { status: 400 })
  }

  const previous = await getRuntimeControlState()

  const data = await updateRuntimeControlState({
    mode,
    updatedBy: auth.user?.username || 'admin',
  })

  await prisma.adminAuditTrail.create({
    data: {
      action: 'autonomous_runtime_control_mode_change',
      userId: auth.user?.username || 'admin',
      ipAddress: getClientIpFromRequest(request),
      details: JSON.stringify({
        control: 'scheduler',
        changed: previous.mode !== data.mode,
        fromMode: previous.mode,
        toMode: data.mode,
      }),
      beforeState: JSON.stringify(previous),
      afterState: JSON.stringify(data),
      environment: 'production',
      success: true,
    },
  })

  return NextResponse.json({ success: true, data })
}
