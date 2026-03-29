import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/internal-db'

export const dynamic = 'force-dynamic'

function normalize(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

type SignalRow = {
  source: string
  metric_key: string
  bucket_start: string
  bucket_granularity: string
  value_numeric: string | number | null
  value_text: string | null
  metadata: unknown
  source_url: string | null
}

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const pool = getPool()
  if (!pool) {
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
  }

  const { slug } = await context.params
  const normalizedSlug = normalize(slug)

  try {
    const firmResult = await pool.query(
      `
        SELECT firm_id, name, website_root
          FROM real_firms_only
        WHERE lower(regexp_replace(firm_id, '[^a-z0-9]+', '-', 'g')) = $1
           OR lower(regexp_replace(name, '[^a-z0-9]+', '-', 'g')) = $1
        LIMIT 1
      `,
      [normalizedSlug]
    )

    const firm = firmResult.rows[0]
    if (!firm) {
      return NextResponse.json({ success: false, error: 'Firm not found' }, { status: 404 })
    }

    const signalsResult = await pool.query(
      `
        SELECT source, metric_key, bucket_start, bucket_granularity, value_numeric, value_text, metadata, source_url
        FROM firm_external_history_signals
        WHERE firm_id = $1
        ORDER BY bucket_start ASC, source ASC, metric_key ASC
      `,
      [firm.firm_id]
    )

    const grouped = signalsResult.rows.reduce<Record<string, Record<string, Array<Record<string, unknown>>>>>((acc, row: SignalRow) => {
      const sourceGroup = acc[row.source] || {}
      const metricGroup = sourceGroup[row.metric_key] || []
      metricGroup.push({
        date: new Date(row.bucket_start).toISOString(),
        granularity: row.bucket_granularity,
        value: row.value_numeric !== null ? Number(row.value_numeric) : row.value_text,
        metadata: row.metadata,
        sourceUrl: row.source_url,
      })
      sourceGroup[row.metric_key] = metricGroup
      acc[row.source] = sourceGroup
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      firm: {
        firm_id: firm.firm_id,
        name: firm.name,
        website: firm.website_root,
      },
      sources: grouped,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch historical intelligence layer',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}