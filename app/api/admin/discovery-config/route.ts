import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { mkdirSync } from 'fs'

const CONFIG_PATH = '/opt/gpti/data/discovery/config.json'
const CONFIG_DIR = '/opt/gpti/data/discovery'

interface DiscoveryConfig {
  scan_limit: number
  max_new_firms: number
  min_confidence: number
  trust_threshold: number
  sources: string[]
  auto_run_enabled: boolean
  auto_run_schedule: string
}

const DEFAULT_CONFIG: DiscoveryConfig = {
  scan_limit: 5000,
  max_new_firms: 50,
  min_confidence: 0.75,
  trust_threshold: 0.4,
  sources: [
    'listofpropfirms.com',
    'thetrustedprop.com',
    'propfirmmatch.com',
    'propfirms.com',
    'myfxbook.com',
    'fxverify.com',
    'reddit.com/r/Daytrading',
    'reddit.com/r/proptrading',
    'reddit.com/r/Forex',
    'forexpeacearmy.com',
    'trustpilot.com',
    'quora.com',
  ],
  auto_run_enabled: true,
  auto_run_schedule: '0 3 * * *',
}

function ensureDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
}

function normalizeConfig(input: Partial<DiscoveryConfig> | null | undefined): DiscoveryConfig {
  const raw = input ?? {}

  const sources = Array.isArray(raw.sources)
    ? raw.sources.filter((source): source is string => typeof source === 'string' && source.trim().length > 0)
    : DEFAULT_CONFIG.sources

  return {
    scan_limit: typeof raw.scan_limit === 'number' ? raw.scan_limit : DEFAULT_CONFIG.scan_limit,
    max_new_firms: typeof raw.max_new_firms === 'number' ? raw.max_new_firms : DEFAULT_CONFIG.max_new_firms,
    min_confidence: typeof raw.min_confidence === 'number' ? raw.min_confidence : DEFAULT_CONFIG.min_confidence,
    trust_threshold: typeof raw.trust_threshold === 'number' ? raw.trust_threshold : DEFAULT_CONFIG.trust_threshold,
    sources,
    auto_run_enabled:
      typeof raw.auto_run_enabled === 'boolean' ? raw.auto_run_enabled : DEFAULT_CONFIG.auto_run_enabled,
    auto_run_schedule:
      typeof raw.auto_run_schedule === 'string' && raw.auto_run_schedule.trim().length > 0
        ? raw.auto_run_schedule
        : DEFAULT_CONFIG.auto_run_schedule,
  }
}

function loadConfig(): DiscoveryConfig {
  ensureDir()
  try {
    if (existsSync(CONFIG_PATH)) {
      const data = readFileSync(CONFIG_PATH, 'utf-8')
      const parsed = JSON.parse(data)
      const normalized = normalizeConfig(parsed)
      return normalized
    }
  } catch (error) {
    console.error('Error loading config:', error)
  }

  const fallback = normalizeConfig(DEFAULT_CONFIG)
  saveConfig(fallback)
  return fallback
}

function saveConfig(config: DiscoveryConfig): void {
  ensureDir()
  try {
    const normalized = normalizeConfig(config)
    writeFileSync(CONFIG_PATH, JSON.stringify(normalized, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving config:', error)
    throw error
  }
}

export async function GET() {
  try {
    const config = loadConfig()
    return NextResponse.json(config)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const config: DiscoveryConfig = await request.json()

    // Validate required numeric fields only (legacy configs are normalized)
    if (
      typeof config.scan_limit !== 'number' ||
      typeof config.max_new_firms !== 'number' ||
      typeof config.min_confidence !== 'number' ||
      typeof config.trust_threshold !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Invalid configuration format' },
        { status: 400 }
      )
    }

    const normalized = normalizeConfig(config)
    saveConfig(normalized)
    return NextResponse.json({ success: true, config: normalized })
  } catch (error) {
    console.error('Error saving config:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}
