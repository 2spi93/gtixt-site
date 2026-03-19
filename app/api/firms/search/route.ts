import { NextRequest, NextResponse } from 'next/server'
import { loadPublicFirmUniverse, normalizePublicFirmSlug } from '@/lib/public-firms'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = (searchParams.get('q') || '').trim().toLowerCase()
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10) || 10
    const offset = Number.parseInt(searchParams.get('offset') || '0', 10) || 0
    const { firms } = await loadPublicFirmUniverse()

    const filtered = firms.filter((firm) => {
      if (!query) return true

      return [firm.name, firm.website_root, firm.jurisdiction, firm.firm_id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })

    const rows = filtered.slice(offset, offset + limit).map((firm) => ({
      id: firm.firm_id || null,
      slug: normalizePublicFirmSlug(firm.firm_id || firm.name || ''),
      name: firm.name || 'Unknown',
      website_root: firm.website_root || null,
      jurisdiction: firm.jurisdiction || null,
      score: Number(firm.score_0_100 || 0),
      status: firm.status || null,
    }))

    return NextResponse.json({ data: rows, total: filtered.length, limit, offset }, { status: 200 })
  } catch (error) {
    console.error('Search firms error:', error)
    return NextResponse.json({ error: 'Failed to search firms' }, { status: 500 })
  }
}
