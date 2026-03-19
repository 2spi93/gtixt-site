import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-api-auth'
import { analyzeWebglTelemetry } from '@/lib/autonomous-lab/webgl-optimizer'

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer', 'auditor'])
  if (auth instanceof NextResponse) return auth

  const origin = request.headers.get('origin') || 'http://127.0.0.1:3000'
  const result = await analyzeWebglTelemetry(origin)
  return NextResponse.json({ success: true, data: result })
}
