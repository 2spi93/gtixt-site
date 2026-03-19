import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import {
  getDecisionIntegrationStatus,
  listDecisionSnapshots,
} from '@/lib/autonomous-lab/decision-history'

function toInt(value: string | null, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(value || String(fallback), 10)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer', 'reviewer', 'auditor'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  try {
    const limit = toInt(request.nextUrl.searchParams.get('limit'), 40, 1, 200)
    const source = String(request.nextUrl.searchParams.get('source') || '').trim() || undefined
    const lookbackHours = toInt(request.nextUrl.searchParams.get('lookbackHours'), 24, 1, 168)

    const [snapshots, integration] = await Promise.all([
      listDecisionSnapshots({ limit, source }),
      getDecisionIntegrationStatus({ lookbackHours }),
    ])

    return NextResponse.json(
      {
        success: true,
        data: {
          snapshots,
          integration,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('[autonomous-lab/decision-history] error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
