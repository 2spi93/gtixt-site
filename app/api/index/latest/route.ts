import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Public alias endpoint expected by docs/UI.
export async function GET(request: NextRequest) {
  const upstreamUrl = new URL('/api/snapshot/latest', request.nextUrl.origin)

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
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch latest index snapshot',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 }
    )
  }
}
