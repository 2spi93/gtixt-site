import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

/**
 * 🔍 Individual Firm Integrity Analysis API
 * 
 * Returns detailed integrity assessment for a specific firm
 * 
 * Usage:
 * GET /api/integrity/firm/[firmId]
 * 
 * Response:
 * {
 *   "firm_id": "...",
 *   "firm_name": "Example Firm",
 *   "overall_score": 72.5,
 *   "risk_level": "stable",
 *   "confidence": 0.85,
 *   "components": {
 *     "payout_transparency": 80,
 *     "founder_transparency": 65,
 *     "rule_stability": 90,
 *     "network_risk": 70,
 *     "trader_sentiment": 60,
 *     "operational_signals": 75
 *   },
 *   "signals": [...]
 * }
 */

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ firmId: string }> }
) {
  const startedAt = Date.now()
  try {
    const resolvedParams = await context.params
    let firmId = resolvedParams?.firmId || ''

    if (!firmId) {
      const segments = request.nextUrl.pathname.split('/').filter(Boolean)
      firmId = segments[segments.length - 1] || ''
    }
    
    if (!firmId) {
      return NextResponse.json(
        { error: 'Firm ID required' },
        { status: 400 }
      )
    }

    const firmIdNum = Number.parseInt(firmId, 10)
    if (!Number.isFinite(firmIdNum) || firmIdNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid firm ID' },
        { status: 400 }
      )
    }
    
    // Run integrity analysis script via execFile (no shell interpolation)
    const pythonPath = process.env.PYTHONPATH || '/opt/gpti/gpti-data-bot/src:/opt/gpti/gpti-site/src'
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      return NextResponse.json(
        { error: 'DATABASE_URL not configured' },
        { status: 500 }
      )
    }
    const pythonBin = '/opt/gpti/gpti-data-bot/.venv/bin/python3'

    const { stdout, stderr } = await execFileAsync(
      pythonBin,
      ['/opt/gpti/gpti-data-bot/scripts/firm_integrity_report.py', '--firm-id', String(firmIdNum)],
      {
        cwd: '/opt/gpti/gpti-data-bot',
        env: {
          ...process.env,
          PYTHONPATH: `${pythonPath}:${process.env.PYTHONPATH || ''}`,
          DATABASE_URL: dbUrl,
        },
        timeout: 20000,
      }
    )
    
    if (stderr && !stderr.includes('WARNING')) {
      console.error('Integrity analysis stderr:', stderr)
    }
    
    // Parse score from stdout
    const lines = stdout.trim().split('\n')
    const jsonLine = lines[lines.length - 1]
    const score = JSON.parse(jsonLine)
    
    if (score.error) {
      return NextResponse.json(score, { status: 404 })
    }
    
    return NextResponse.json({
      ...score,
      duration_ms: Date.now() - startedAt,
      execution_mode: 'deep_single_firm'
    })
    
  } catch (error) {
    console.error('Failed to analyze firm integrity:', error)
    
    return NextResponse.json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: Date.now() - startedAt,
      execution_mode: 'deep_single_firm'
    }, { status: 500 })
  }
}
