import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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
    
    // Run integrity analysis for specific firm
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
import psycopg2
from dataclasses import dataclass
from gpti_bot.integrity.integrity_analysis_agent import IntegrityAnalysisAgent

@dataclass
class FirmRow:
    firm_id: int
    name: str
    website_root: str
    jurisdiction: str
    elite_tier: str

async def run():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute('SELECT id, name, website_root, jurisdiction FROM firms WHERE id = %s', (${firmIdNum},))
    row = cur.fetchone()

    if not row:
        print(json.dumps({'error': 'Firm not found'}))
        return

    firm = FirmRow(row[0], row[1], row[2], row[3] or 'Unknown', 'Standard')
    agent = IntegrityAnalysisAgent()
    score = await agent.analyze_firm(firm, deep_analysis=True)
    print(json.dumps(score.to_dict()))

    cur.close()
    conn.close()

asyncio.run(run())
"`,
      { timeout: 20000 }
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
