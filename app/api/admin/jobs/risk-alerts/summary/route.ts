import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminUser } from '@/lib/admin-api-auth'

export const dynamic = 'force-dynamic'

type DispatchRow = {
  firm_id: string
  snapshot_date: string
  alert_type: string
  reason: string | null
  sent_slack: boolean
  sent_email: boolean
  created_at: string
  payload: any
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer', 'auditor'])
  if (auth instanceof NextResponse) return auth

  try {
    const rows = await prisma.$queryRawUnsafe<DispatchRow[]>(`
      SELECT firm_id, snapshot_date::text, alert_type, reason, sent_slack, sent_email, created_at::text, payload
      FROM risk_alert_dispatch
      ORDER BY created_at DESC
      LIMIT 20
    `)

    const last24hRows = await prisma.$queryRawUnsafe<Array<{ total: bigint; slack_sent: bigint; email_sent: bigint }>>(`
      SELECT
        COUNT(*)::bigint AS total,
        SUM(CASE WHEN sent_slack THEN 1 ELSE 0 END)::bigint AS slack_sent,
        SUM(CASE WHEN sent_email THEN 1 ELSE 0 END)::bigint AS email_sent
      FROM risk_alert_dispatch
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `)

    const totalRows = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(`
      SELECT COUNT(*)::bigint AS total FROM risk_alert_dispatch
    `)

    const latest = rows.map((row) => {
      const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload || {}
      return {
        firm_id: row.firm_id,
        firm_name: payload.firm_name || row.firm_id,
        snapshot_date: row.snapshot_date,
        alert_type: row.alert_type,
        reason: row.reason,
        sent_slack: Boolean(row.sent_slack),
        sent_email: Boolean(row.sent_email),
        current_category: payload.current_category || null,
        current_score: Number(payload.current_score || 0),
        delta: Number(payload.delta || 0),
        created_at: row.created_at,
      }
    })

    const byType = latest.reduce<Record<string, number>>((acc, item) => {
      acc[item.alert_type] = (acc[item.alert_type] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        total_dispatches: Number(totalRows[0]?.total || 0),
        dispatches_24h: Number(last24hRows[0]?.total || 0),
        slack_sent_24h: Number(last24hRows[0]?.slack_sent || 0),
        email_sent_24h: Number(last24hRows[0]?.email_sent || 0),
        by_type: byType,
        latest,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    // Table may not exist yet before first risk_alerts run.
    if (message.includes('risk_alert_dispatch') || message.includes('does not exist')) {
      return NextResponse.json({
        success: true,
        data: {
          total_dispatches: 0,
          dispatches_24h: 0,
          slack_sent_24h: 0,
          email_sent_24h: 0,
          by_type: {},
          latest: [],
          note: 'No dispatch table yet. Run risk_alerts once to initialize.',
        },
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load risk alert summary',
        detail: message,
      },
      { status: 500 }
    )
  }
}
