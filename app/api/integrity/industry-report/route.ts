import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

/**
 * 🛡️ GTIXT Industry Integrity Report API
 * 
 * Returns industry-wide integrity analysis:
 * - Total firms by risk level
 * - High-risk firms list
 * - Integrity trends
 * 
 * Usage:
 * GET /api/integrity/industry-report
 * 
 * Response:
 * {
 *   "timestamp": "2026-03-07T12:00:00Z",
 *   "total_firms": 450,
 *   "high_integrity": 320,
 *   "stable": 85,
 *   "caution": 30,
 *   "elevated_risk": 10,
 *   "structural_risk": 5,
 *   "high_risk_firms": [...]
 * }
 */

export async function GET(_request: NextRequest) {
  const startedAt = Date.now()
  try {
    // Run integrity analysis script via execFile (no shell interpolation)
    const pythonPath = process.env.PYTHONPATH || '/opt/gpti/gpti-data-bot/src:/opt/gpti/gpti-site/src'
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      return NextResponse.json(
        {
          error: 'DATABASE_URL not configured',
          duration_ms: Date.now() - startedAt,
          execution_mode: 'batch_fast',
        },
        { status: 500 }
      )
    }
    const pythonBin = '/opt/gpti/gpti-data-bot/.venv/bin/python3'

    const { stdout, stderr } = await execFileAsync(
      pythonBin,
      ['/opt/gpti/gpti-data-bot/scripts/industry_integrity_report.py'],
      {
        cwd: '/opt/gpti/gpti-data-bot',
        env: {
          ...process.env,
          PYTHONPATH: `${pythonPath}:${process.env.PYTHONPATH || ''}`,
          DATABASE_URL: dbUrl,
        },
        timeout: 30000,
      }
    )
    
    if (stderr && !stderr.includes('WARNING')) {
      console.error('Integrity analysis stderr:', stderr)
    }
    
    // Parse report from stdout
    const lines = stdout.trim().split('\n')
    const jsonLine = lines[lines.length - 1]
    const report = JSON.parse(jsonLine)
    
    return NextResponse.json({
      ...report,
      duration_ms: Date.now() - startedAt,
      execution_mode: 'batch_fast'
    })
    
  } catch (error) {
    console.error('Failed to generate integrity report:', error)
    
    // Return safe fallback
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      total_firms: 0,
      high_integrity: 0,
      stable: 0,
      caution: 0,
      elevated_risk: 0,
      structural_risk: 0,
      high_risk_firms: [],
      error: 'Analysis temporarily unavailable',
      duration_ms: Date.now() - startedAt,
      execution_mode: 'batch_fast'
    }, { status: 500 })
  }
}
