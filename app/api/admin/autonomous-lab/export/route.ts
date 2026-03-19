import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-api-auth'
import { listExperiments, listPromotionRequests } from '@/lib/autonomous-lab/registry'

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const keys = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k))
      return set
    }, new Set<string>())
  )

  const escape = (value: unknown): string => {
    if (value == null) return ''
    const str = typeof value === 'string' ? value : JSON.stringify(value)
    return `"${str.replace(/"/g, '""')}"`
  }

  const header = keys.join(',')
  const lines = rows.map((row) => keys.map((k) => escape(row[k])).join(','))
  return [header, ...lines].join('\n')
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer', 'auditor'])
  if (auth instanceof NextResponse) return auth

  const format = (request.nextUrl.searchParams.get('format') || 'json').toLowerCase()
  const dataType = (request.nextUrl.searchParams.get('type') || 'all').toLowerCase()

  const experiments = dataType === 'promotions' ? [] : await listExperiments(500)
  const promotions = dataType === 'registry' ? [] : await listPromotionRequests(500)

  const payload = { exportedAt: new Date().toISOString(), experiments, promotions }

  if (format === 'csv') {
    const registryCsv = toCsv(experiments as unknown as Record<string, unknown>[])
    const promotionsCsv = toCsv(promotions as unknown as Record<string, unknown>[])
    const content = [
      '# registry',
      registryCsv,
      '',
      '# promotions',
      promotionsCsv,
    ].join('\n')

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=autonomous-lab-${dataType}.csv`,
      },
    })
  }

  return NextResponse.json(payload, {
    headers: {
      'Content-Disposition': `attachment; filename=autonomous-lab-${dataType}.json`,
    },
  })
}
