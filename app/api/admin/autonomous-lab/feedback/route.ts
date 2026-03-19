import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-api-auth'
import { listRecentUserFeedback } from '@/lib/autonomous-lab/hypothesis-generator'

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer', 'auditor'])
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(request.url)
  const limit = Math.max(1, Math.min(500, Number(searchParams.get('limit') || '100')))

  const data = await listRecentUserFeedback(limit)
  return NextResponse.json({ success: true, count: data.length, data })
}
