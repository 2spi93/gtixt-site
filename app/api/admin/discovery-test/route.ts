import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { existsSync, mkdirSync, createWriteStream } from 'fs'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'

interface TestRequest {
  scan_limit: number
  max_new_firms: number
  min_confidence: number
  trust_threshold?: number
  sources?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminUser(request, ['admin', 'lead_reviewer'])
    if (auth instanceof NextResponse) return auth

    const sameOriginError = requireSameOrigin(request)
    if (sameOriginError) return sameOriginError

    const body: TestRequest = await request.json()

    // Validate input
    if (
      !body.scan_limit ||
      !body.max_new_firms ||
      body.min_confidence === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Limit test parameters to avoid long runs
    const scanLimit = Math.min(body.scan_limit, 200)
    const maxNewFirms = Math.min(body.max_new_firms, 5)
    const minConfidence = body.min_confidence
    const trustThreshold = body.trust_threshold
    const sources = Array.isArray(body.sources)
      ? body.sources.filter((source) => typeof source === 'string' && source.trim().length > 0)
      : []

    // Run discovery in background
    // This spawns a child process so the request doesn't timeout
    const logDir = '/opt/gpti/logs'
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true })
    }

    // Build command to run discovery
    const pythonPath = process.env.PYTHONPATH || '/opt/gpti/gpti-data-bot/src:/opt/gpti/gpti-site/src'
    const discoveryCmd = [
      'python3',
      '-m',
      'gpti_bot.agents.autonomous_discovery_agent',
      '--scan-limit',
      String(scanLimit),
      '--max-new-firms',
      String(maxNewFirms),
      '--min-confidence',
      String(minConfidence),
    ]

    if (typeof trustThreshold === 'number') {
      discoveryCmd.push('--trust-threshold', String(trustThreshold))
    }

    if (sources.length > 0) {
      discoveryCmd.push('--sources', sources.join(','))
    }

    const logFile = `/opt/gpti/logs/discovery-test-${Date.now()}.log`
    const logStream = createWriteStream(logFile, { flags: 'a' })

    // Spawn child process (non-blocking) without shell interpolation
    const child = spawn('python3', discoveryCmd.slice(2), {
      cwd: '/opt/gpti/gpti-data-bot',
      env: {
        ...process.env,
        PYTHONPATH: `${pythonPath}:${process.env.PYTHONPATH || ''}`,
      },
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    child.stdout?.pipe(logStream)
    child.stderr?.pipe(logStream)

    // Don't wait for process to finish
    child.unref()

    return NextResponse.json({
      success: true,
      message: 'Discovery test started',
      parameters: {
        scan_limit: scanLimit,
        max_new_firms: maxNewFirms,
        min_confidence: minConfidence,
        trust_threshold: trustThreshold,
        sources,
      },
    })
  } catch (error) {
    console.error('Error starting discovery test:', error)
    return NextResponse.json(
      { error: 'Failed to start discovery test' },
      { status: 500 }
    )
  }
}
