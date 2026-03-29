import { NextRequest, NextResponse } from 'next/server'
import { getVisitorAnalytics, getRecentVisitors } from '@/lib/visitor-tracking'
import { requireAdminUser } from '@/lib/admin-api-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminUser(request, ['admin', 'auditor', 'lead_reviewer'])
    if (auth instanceof NextResponse) {
      return auth
    }

    const searchParams = request.nextUrl.searchParams
    const days = Math.max(1, Math.min(30, parseInt(searchParams.get('days') || '7', 10)))
    const recentLimit = Math.max(1, Math.min(200, parseInt(searchParams.get('limit') || '100', 10)))
    const view = searchParams.get('view') || 'summary'

    if (view === 'recent') {
      const recentVisitors = await getRecentVisitors(recentLimit)
      return NextResponse.json({
        success: true,
        data: recentVisitors,
        timestamp: new Date().toISOString(),
      })
    }

    const analytics = await getVisitorAnalytics(days)
    if (!analytics) {
      return NextResponse.json({ error: 'Unable to fetch analytics' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      period: {
        days,
        since: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[API] Admin visitors analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
