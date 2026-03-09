import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const CONFIG_FILE = '/opt/gpti/data/integrity_calibration.json'

interface CalibrationSettings {
  weights: {
    payout: number
    risk: number
    operational: number
    historical: number
  }
  thresholds: {
    stable: number
    caution: number
    high_risk: number
  }
  batch_mode: {
    enrichment_timeout: number
    max_concurrent: number
    skip_deep_signals: boolean
  }
  updated_at?: string
  updated_by?: string
}

const DEFAULT_SETTINGS: CalibrationSettings = {
  weights: {
    payout: 0.30,
    risk: 0.25,
    operational: 0.25,
    historical: 0.20
  },
  thresholds: {
    stable: 75,
    caution: 60,
    high_risk: 40
  },
  batch_mode: {
    enrichment_timeout: 5000,
    max_concurrent: 3,
    skip_deep_signals: true
  }
}

export async function GET() {
  try {
    // Try to load existing settings
    const fileExists = await fs.access(CONFIG_FILE)
      .then(() => true)
      .catch(() => false)
    
    if (fileExists) {
      const content = await fs.readFile(CONFIG_FILE, 'utf-8')
      const settings = JSON.parse(content)
      
      return NextResponse.json({
        settings,
        source: 'file'
      })
    }
    
    // Return defaults if no file exists
    return NextResponse.json({
      settings: DEFAULT_SETTINGS,
      source: 'defaults'
    })
    
  } catch (error) {
    console.error('Failed to load calibration settings:', error)
    
    return NextResponse.json({
      settings: DEFAULT_SETTINGS,
      source: 'defaults',
      error: 'Failed to load saved settings'
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate settings
    const settings = body as CalibrationSettings
    
    // Validate weights sum to 1.0
    const totalWeight = Object.values(settings.weights).reduce((sum, w) => sum + w, 0)
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      return NextResponse.json(
        { error: 'Weights must sum to 1.0' },
        { status: 400 }
      )
    }
    
    // Validate thresholds
    if (settings.thresholds.stable <= settings.thresholds.caution ||
        settings.thresholds.caution <= settings.thresholds.high_risk) {
      return NextResponse.json(
        { error: 'Thresholds must be in descending order: stable > caution > high_risk' },
        { status: 400 }
      )
    }
    
    // Add metadata
    const settingsWithMeta = {
      ...settings,
      updated_at: new Date().toISOString(),
      updated_by: 'admin' // TODO: get from auth context
    }
    
    // Ensure directory exists
    const dir = path.dirname(CONFIG_FILE)
    await fs.mkdir(dir, { recursive: true })
    
    // Write to file
    await fs.writeFile(
      CONFIG_FILE,
      JSON.stringify(settingsWithMeta, null, 2),
      'utf-8'
    )
    
    // Also write environment variable hints for Python backend
    const envHints = `# Integrity Calibration Settings (auto-generated)
# Last updated: ${settingsWithMeta.updated_at}
INTEGRITY_WEIGHT_PAYOUT=${settings.weights.payout}
INTEGRITY_WEIGHT_RISK=${settings.weights.risk}
INTEGRITY_WEIGHT_OPERATIONAL=${settings.weights.operational}
INTEGRITY_WEIGHT_HISTORICAL=${settings.weights.historical}
INTEGRITY_THRESHOLD_STABLE=${settings.thresholds.stable}
INTEGRITY_THRESHOLD_CAUTION=${settings.thresholds.caution}
INTEGRITY_THRESHOLD_HIGH_RISK=${settings.thresholds.high_risk}
INTEGRITY_BATCH_TIMEOUT_MS=${settings.batch_mode.enrichment_timeout}
INTEGRITY_BATCH_MAX_CONCURRENT=${settings.batch_mode.max_concurrent}
INTEGRITY_BATCH_SKIP_DEEP=${settings.batch_mode.skip_deep_signals ? '1' : '0'}
`
    
    await fs.writeFile(
      '/opt/gpti/data/integrity_calibration.env',
      envHints,
      'utf-8'
    )
    
    return NextResponse.json({
      success: true,
      settings: settingsWithMeta,
      message: 'Settings saved successfully. Restart backend services to apply changes.'
    })
    
  } catch (error) {
    console.error('Failed to save calibration settings:', error)
    
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}
