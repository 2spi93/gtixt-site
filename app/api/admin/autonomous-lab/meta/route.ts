import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import { runMetaOptimization, getLatestMetaSnapshot } from '@/lib/autonomous-lab/meta-optimizer'

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer', 'auditor'])
  if (auth instanceof NextResponse) return auth

  const snapshot = await getLatestMetaSnapshot()
  return NextResponse.json({ success: true, data: snapshot })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const snapshot = await runMetaOptimization()
  return NextResponse.json({ success: true, data: snapshot })
}
