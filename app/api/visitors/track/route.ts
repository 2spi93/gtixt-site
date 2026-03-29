import { NextRequest, NextResponse } from 'next/server'
import { requireSameOrigin } from '@/lib/admin-api-auth'
import { trackVisitor } from '@/lib/visitor-tracking'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  try {
    const sameOriginError = requireSameOrigin(request)
    if (sameOriginError) {
      return sameOriginError
    }

    const body = await request.json().catch(() => ({})) as {
      path?: string
      sessionId?: string
      responseTime?: number
      statusCode?: number
    }

    const pathname = typeof body.path === 'string' && body.path.startsWith('/')
      ? body.path
      : '/'

    const sessionId = typeof body.sessionId === 'string' && UUID_PATTERN.test(body.sessionId)
      ? body.sessionId
      : undefined

    const result = await trackVisitor(pathname, {
      sessionId,
      responseTime: typeof body.responseTime === 'number' ? body.responseTime : undefined,
      statusCode: typeof body.statusCode === 'number' ? body.statusCode : undefined,
    })

    if (!result) {
      return NextResponse.json({ error: 'Failed to track visitor' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Visitor track error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}