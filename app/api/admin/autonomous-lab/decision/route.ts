import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-api-auth'
import { runDecisionEngine } from '@/lib/autonomous-lab/decision-engine'
import { recordDecisionSnapshot } from '@/lib/autonomous-lab/decision-history'

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer', 'reviewer'])
  if (auth instanceof NextResponse) return auth

  const baseUrl =
    request.headers.get('origin') ||
    process.env.NEXTAUTH_URL ||
    'http://127.0.0.1:3000'

  try {
    const decision = await runDecisionEngine(baseUrl)
    await recordDecisionSnapshot({
      source: 'decision_api',
      decision,
      dedupeWindowSeconds: 180,
      metadata: { route: '/api/admin/autonomous-lab/decision' },
    }).catch(() => null)
    return NextResponse.json({ success: true, decision })
  } catch (error) {
    console.error('[decision/route] error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    )
  }
}
