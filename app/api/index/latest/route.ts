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

  const fallback = request.nextUrl.origin.replace(/\/$/, '')
  const local = 'http://127.0.0.1:3000'

  const origins = [configured, local, fallback].filter(Boolean)
  return Array.from(new Set(origins))
}

// Public alias endpoint expected by docs/UI.
export async function GET(request: NextRequest) {
  let lastError: Error | null = null

  for (const origin of getInternalOrigins(request)) {
    const upstreamUrl = new URL('/api/snapshot/latest', origin)

    try {
      const upstream = await fetch(upstreamUrl.toString(), {
        method: 'GET',
        cache: 'no-store',
        headers: {
          accept: 'application/json',
        },
      })

      const text = await upstream.text()

      return new NextResponse(text, {
        status: upstream.status,
        headers: {
          'content-type': upstream.headers.get('content-type') || 'application/json',
          'cache-control': upstream.headers.get('cache-control') || 'public, max-age=60, stale-while-revalidate=60',
        },
      })
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown fetch error')
    }
  }

  {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch latest index snapshot',
        detail: lastError?.message || 'Unknown error',
      },
      { status: 502 }
    )
  }
}
