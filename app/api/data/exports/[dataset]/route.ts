import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getInternalOrigins(request: NextRequest): string[] {
  const configured = (
    process.env.INTERNAL_BASE_URL ||
    process.env.SITE_BASE_URL ||
    process.env.APP_BASE_URL ||
    ''
  )
    .trim()
    .replace(/\/$/, '')

  const local = 'http://127.0.0.1:3000'
  const fallback = request.nextUrl.origin.replace(/\/$/, '')

  return Array.from(new Set([configured, local, fallback].filter(Boolean)))
}

type RankingRow = {
  rank: number
  slug: string
  name: string
  score: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  payoutReliability: number
  jurisdiction: string
  status?: string | null
  rule_changes_frequency?: string | null
  externalCoverage?: {
    activeSources?: number
    lastCollectedAt?: string | null
  }
}

function escapeCsv(value: unknown): string {
  const normalized = value === null || value === undefined ? '' : String(value)
  return `"${normalized.replace(/"/g, '""')}"`
}

async function fetchJson<T>(request: NextRequest, path: string): Promise<T> {
  let lastError: Error | null = null

  for (const origin of getInternalOrigins(request)) {
    const url = new URL(path, origin)

    try {
      const response = await fetch(url.toString(), {
        cache: 'no-store',
        headers: {
          accept: 'application/json',
        },
      })

      if (!response.ok) {
        lastError = new Error(`${path} returned ${response.status} via ${origin}`)
        continue
      }

      return response.json() as Promise<T>
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown fetch error')
    }
  }

  throw lastError || new Error(`Failed to fetch ${path}`)
}

function jsonAttachment(body: unknown, fileName: string) {
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
    },
  })
}

function csvAttachment(csv: string, fileName: string) {
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=60',
    },
  })
}

export async function GET(request: NextRequest, context: { params: Promise<{ dataset: string }> }) {
  const { dataset } = await context.params
  const format = (request.nextUrl.searchParams.get('format') || 'json').toLowerCase()
  const today = new Date().toISOString().slice(0, 10)

  try {
    if (dataset === 'full-index-snapshot') {
      const snapshot = await fetchJson<Record<string, unknown>>(request, '/api/index/latest')
      return jsonAttachment(snapshot, `gtixt-full-index-snapshot-${today}.json`)
    }

    if (dataset === 'rankings-feed') {
      const rankings = await fetchJson<{ data?: RankingRow[]; freshness?: Record<string, unknown>; snapshot_info?: Record<string, unknown> }>(request, '/api/rankings?limit=500&offset=0')
      const rows = Array.isArray(rankings.data) ? rankings.data : []

      if (format === 'csv') {
        const header = ['rank', 'name', 'slug', 'score', 'risk', 'payout_reliability', 'jurisdiction', 'status', 'rule_changes_frequency', 'active_sources', 'last_collected_at']
        const body = rows.map((row) => [
          row.rank,
          row.name,
          row.slug,
          row.score,
          row.risk,
          row.payoutReliability,
          row.jurisdiction,
          row.status || '',
          row.rule_changes_frequency || '',
          row.externalCoverage?.activeSources || 0,
          row.externalCoverage?.lastCollectedAt || '',
        ])
        const csv = [header, ...body].map((line) => line.map(escapeCsv).join(',')).join('\n')
        return csvAttachment(csv, `gtixt-rankings-feed-${today}.csv`)
      }

      return jsonAttachment(rankings, `gtixt-rankings-feed-${today}.json`)
    }

    if (dataset === 'risk-distribution') {
      const rankings = await fetchJson<{ data?: RankingRow[]; freshness?: Record<string, unknown> }>(request, '/api/rankings?limit=500&offset=0')
      const rows = Array.isArray(rankings.data) ? rankings.data : []
      const total = rows.length || 1
      const distribution = {
        generated_at: new Date().toISOString(),
        total_firms: rows.length,
        buckets: [
          { label: 'LOW', count: rows.filter((row) => row.risk === 'LOW').length },
          { label: 'MEDIUM', count: rows.filter((row) => row.risk === 'MEDIUM').length },
          { label: 'HIGH', count: rows.filter((row) => row.risk === 'HIGH').length },
        ].map((bucket) => ({
          ...bucket,
          percentage: Number(((bucket.count / total) * 100).toFixed(1)),
        })),
        score_bands: [
          { label: 'Premium 85+', count: rows.filter((row) => row.score >= 85).length },
          { label: 'Established 75-84', count: rows.filter((row) => row.score >= 75 && row.score < 85).length },
          { label: 'Monitored 65-74', count: rows.filter((row) => row.score >= 65 && row.score < 75).length },
          { label: 'Fragile <65', count: rows.filter((row) => row.score < 65).length },
        ].map((bucket) => ({
          ...bucket,
          percentage: Number(((bucket.count / total) * 100).toFixed(1)),
        })),
        freshness: rankings.freshness || null,
      }

      if (format === 'csv') {
        const header = ['group', 'label', 'count', 'percentage']
        const body = [
          ...distribution.buckets.map((bucket) => ['risk', bucket.label, bucket.count, bucket.percentage]),
          ...distribution.score_bands.map((bucket) => ['score_band', bucket.label, bucket.count, bucket.percentage]),
        ]
        const csv = [header, ...body].map((line) => line.map(escapeCsv).join(',')).join('\n')
        return csvAttachment(csv, `gtixt-risk-distribution-${today}.csv`)
      }

      return jsonAttachment(distribution, `gtixt-risk-distribution-${today}.json`)
    }

    if (dataset === 'integrity-metadata') {
      const [snapshot, rankings] = await Promise.all([
        fetchJson<Record<string, unknown>>(request, '/api/snapshot/latest'),
        fetchJson<{ total?: number; freshness?: Record<string, unknown>; snapshot_info?: Record<string, unknown> }>(request, '/api/rankings?limit=1&offset=0'),
      ])

      const metadata = {
        generated_at: new Date().toISOString(),
        snapshot_created_at: (rankings.snapshot_info?.created_at as string | null) || (snapshot.created_at as string | null) || null,
        published_snapshot_object: (rankings.snapshot_info?.object as string | null) || null,
        sha256: (rankings.snapshot_info?.sha256 as string | null) || (snapshot.sha256 as string | null) || null,
        total_firms: Number(rankings.total || snapshot.count || 0),
        freshness: rankings.freshness || null,
      }

      if (format === 'csv') {
        const header = ['field', 'value']
        const body = Object.entries(metadata).map(([key, value]) => [key, typeof value === 'object' && value !== null ? JSON.stringify(value) : value ?? ''])
        const csv = [header, ...body].map((line) => line.map(escapeCsv).join(',')).join('\n')
        return csvAttachment(csv, `gtixt-integrity-metadata-${today}.csv`)
      }

      return jsonAttachment(metadata, `gtixt-integrity-metadata-${today}.json`)
    }

    return NextResponse.json({ success: false, error: 'Unknown export dataset' }, { status: 404 })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to build export',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}