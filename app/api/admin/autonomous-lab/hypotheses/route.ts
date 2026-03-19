import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import { listBacklog, generateHypotheses } from '@/lib/autonomous-lab/hypothesis-generator'
import type { LabModule } from '@/lib/autonomous-lab/types'

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer', 'auditor'])
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(request.url)
  const module = searchParams.get('module') as LabModule | null
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50))

  const items = await listBacklog(module ?? undefined, limit)
  return NextResponse.json({ success: true, data: items, count: items.length })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const generated = await generateHypotheses()
  return NextResponse.json({ success: true, data: generated, count: generated.length })
}
