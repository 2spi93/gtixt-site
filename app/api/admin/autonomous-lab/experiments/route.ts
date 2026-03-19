import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import { createExperiment, listExperiments } from '@/lib/autonomous-lab/registry'
import type { LabModule } from '@/lib/autonomous-lab/types'

function makeExperimentId(): string {
  return `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer', 'auditor'])
  if (auth instanceof NextResponse) return auth

  const limit = Number(request.nextUrl.searchParams.get('limit') || '100')
  const data = await listExperiments(limit)
  return NextResponse.json({ success: true, data })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const body = await request.json()
  const moduleName = String(body?.module || 'scoring') as LabModule
  const hypothesis = String(body?.hypothesis || '').trim()
  const changes = Array.isArray(body?.changes) ? body.changes.map((x: unknown) => String(x)).filter(Boolean) : []

  if (!hypothesis) {
    return NextResponse.json({ error: 'hypothesis is required' }, { status: 400 })
  }

  if (!['scoring', 'webgl', 'pipeline', 'operator'].includes(moduleName)) {
    return NextResponse.json({ error: 'invalid module' }, { status: 400 })
  }

  const experiment = await createExperiment({
    id: makeExperimentId(),
    module: moduleName,
    hypothesis,
    changes,
    status: 'draft',
    createdBy: auth.user?.username || 'admin',
  })

  return NextResponse.json({ success: true, data: experiment }, { status: 201 })
}
