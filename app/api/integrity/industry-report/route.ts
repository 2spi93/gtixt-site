import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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

export async function GET(request: NextRequest) {
  const startedAt = Date.now()
  try {
    // Run integrity analysis agent
    const pythonPath = process.env.PYTHONPATH || '/opt/gpti/gpti-data-bot/src:/opt/gpti/gpti-site/src'
    const dbUrl = process.env.DATABASE_URL || 'postgresql://gpti:pNbl724vRljgeirj9IMe9LaOFRppfuQFmNPKjgj0@localhost:5434/gpti'
    
    const { stdout, stderr } = await execAsync(
      `export PYTHONPATH="${pythonPath}:$PYTHONPATH" && ` +
      `export DATABASE_URL="${dbUrl}" && ` +
      `cd /opt/gpti/gpti-data-bot && ` +
      `python3 -c "
import asyncio
import json
import sys
import os
sys.path.insert(0, 'src')
from gpti_bot.integrity.integrity_analysis_agent import IntegrityAnalysisAgent
from gpti_bot.db import connect

async def run():
    conn = connect()
    agent = IntegrityAnalysisAgent(conn)
    report = await agent.generate_industry_report()
    print(json.dumps(report))
    conn.close()

asyncio.run(run())
"`,
      { timeout: 30000 }
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
