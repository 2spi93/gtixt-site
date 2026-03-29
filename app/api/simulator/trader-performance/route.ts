import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/internal-db'
import { toNumber } from '@/lib/intelligence'

export const dynamic = 'force-dynamic'

type TraderStyle = 'scalping' | 'intraday' | 'swing' | 'algo' | 'news'

type RequestPayload = {
  capitalTarget: number
  riskPerTradePct: number
  winRatePct: number
  averageRRR: number
  style: TraderStyle
  paths?: number
  mainstreamOnly?: boolean
}

type FirmRule = {
  firm_id: string
  firm_name: string
  website_root: string
  jurisdiction: string
  model_type: string
  payout_frequency: string
  daily_drawdown_pct: number
  overall_drawdown_pct: number
  payout_reliability: number
  operational_stability: number
  risk_model_integrity: number
  gri_score: number
  rule_source: 'firm_profile' | 'benchmark_mixed'
  profit_target_pct: number
  time_limit_days: number
  min_trading_days: number
}

type SimulationResult = {
  firm_id: string
  firm_name: string
  jurisdiction: string
  pass_probability: number
  expected_payout_days: number | null
  expected_payout_usd: number
  failure_risk: 'Low' | 'Medium' | 'High'
  model_confidence: 'High' | 'Medium'
  rules: {
    daily_drawdown_pct: number
    overall_drawdown_pct: number
    profit_target_pct: number
    time_limit_days: number
    min_trading_days: number
    source: 'firm_profile' | 'benchmark_mixed'
  }
}

const STYLE_TRADES_PER_DAY: Record<TraderStyle, [number, number]> = {
  scalping: [3, 8],
  intraday: [2, 5],
  swing: [1, 2],
  algo: [2, 6],
  news: [1, 3],
}

const KNOWN_PROP_BRANDS = [
  'ftmo',
  'fundingpips',
  'apex',
  'topstep',
  'the funded trader',
  'funded trader',
  'myforexfunds',
  '5ers',
  'e8',
  'blue guardian',
  'brightfunded',
  'alpha capital',
  'instant funding',
]

const POPULAR_BENCHMARK_FIRMS: Array<{
  key: string
  name: string
  jurisdiction: string
  payout_frequency: string
  daily_drawdown_pct: number
  overall_drawdown_pct: number
  payout_reliability: number
  operational_stability: number
  risk_model_integrity: number
  gri_score: number
}> = [
  {
    key: 'ftmo',
    name: 'FTMO',
    jurisdiction: 'CZ',
    payout_frequency: 'bi-weekly',
    daily_drawdown_pct: 5,
    overall_drawdown_pct: 10,
    payout_reliability: 91,
    operational_stability: 88,
    risk_model_integrity: 90,
    gri_score: 22,
  },
  {
    key: 'fundingpips',
    name: 'FundingPips',
    jurisdiction: 'AE',
    payout_frequency: 'weekly',
    daily_drawdown_pct: 5,
    overall_drawdown_pct: 10,
    payout_reliability: 70,
    operational_stability: 68,
    risk_model_integrity: 66,
    gri_score: 38,
  },
  {
    key: 'apex',
    name: 'Apex Trader',
    jurisdiction: 'US',
    payout_frequency: 'weekly',
    daily_drawdown_pct: 4.5,
    overall_drawdown_pct: 10,
    payout_reliability: 73,
    operational_stability: 72,
    risk_model_integrity: 69,
    gri_score: 35,
  },
  {
    key: 'topstep',
    name: 'TopStep',
    jurisdiction: 'US',
    payout_frequency: 'weekly',
    daily_drawdown_pct: 5,
    overall_drawdown_pct: 10,
    payout_reliability: 86,
    operational_stability: 84,
    risk_model_integrity: 83,
    gri_score: 25,
  },
  {
    key: 'funded trader',
    name: 'The Funded Trader',
    jurisdiction: 'US',
    payout_frequency: 'monthly',
    daily_drawdown_pct: 4,
    overall_drawdown_pct: 10,
    payout_reliability: 57,
    operational_stability: 60,
    risk_model_integrity: 58,
    gri_score: 48,
  },
]

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function normalizeFirmKey(value: string): string {
  return normalizeText(value).replace(/\s+/g, ' ')
}

function isKnownBrand(name: string, website: string): boolean {
  const n = normalizeText(name)
  const w = normalizeText(website)
  return KNOWN_PROP_BRANDS.some((brand) => n.includes(brand) || w.includes(brand))
}

function displayFirmName(rawName: string, website: string): string {
  const name = String(rawName || '').replace(/\s+/g, ' ').trim()
  if (!name) return 'Unknown Firm'

  if (isKnownBrand(name, website)) {
    const lower = normalizeText(name)
    const fromWebsite = normalizeText(website)
    if (lower.includes('ftmo') || fromWebsite.includes('ftmo')) return 'FTMO'
    if (lower.includes('fundingpips') || fromWebsite.includes('fundingpips')) return 'FundingPips'
    if (lower.includes('apex') || fromWebsite.includes('apex')) return 'Apex Trader'
    if (lower.includes('topstep') || fromWebsite.includes('topstep')) return 'TopStep'
    if (lower.includes('funded trader') || fromWebsite.includes('thefundedtrader')) return 'The Funded Trader'
    if (lower.includes('myforexfunds') || fromWebsite.includes('myforexfunds')) return 'MyForexFunds'
  }

  const sanitized = name
    .replace(/https?:\/\//gi, '')
    .replace(/www\./gi, '')
    .replace(/\.(com|io|co|net|org|ai|fund|trade|finance)\b/gi, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (sanitized.length >= 4) {
    return sanitized
      .split(' ')
      .filter(Boolean)
      .slice(0, 4)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
      .join(' ')
  }

  return name
}

function publicNameScore(name: string, website: string): number {
  const cleanName = normalizeText(name)
  let score = 0
  if (isKnownBrand(name, website)) score += 8
  if (cleanName.length >= 6 && cleanName.length <= 28) score += 2
  if (!cleanName.includes('com') && !cleanName.includes('http')) score += 1
  if (cleanName.includes(' ')) score += 1
  return score
}

function benchmarkToFirmRule(item: (typeof POPULAR_BENCHMARK_FIRMS)[number]): FirmRule {
  return {
    firm_id: `benchmark_${item.key.replace(/\s+/g, '_')}`,
    firm_name: item.name,
    website_root: '',
    jurisdiction: item.jurisdiction,
    model_type: 'challenge',
    payout_frequency: item.payout_frequency,
    daily_drawdown_pct: item.daily_drawdown_pct,
    overall_drawdown_pct: item.overall_drawdown_pct,
    payout_reliability: item.payout_reliability,
    operational_stability: item.operational_stability,
    risk_model_integrity: item.risk_model_integrity,
    gri_score: item.gri_score,
    rule_source: 'benchmark_mixed',
    profit_target_pct: 8,
    time_limit_days: 30,
    min_trading_days: 5,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function deriveProfitTargetPct(firm: FirmRule): number {
  const reliabilityBoost = firm.payout_reliability >= 75 ? -0.4 : 0
  const modelBase = firm.model_type.includes('challenge') ? 8 : 7.5
  return clamp(Number((modelBase + reliabilityBoost).toFixed(2)), 6, 10)
}

function deriveTimeLimitDays(firm: FirmRule): number {
  const freq = firm.payout_frequency.toLowerCase()
  if (freq.includes('daily')) return 20
  if (freq.includes('weekly')) return 28
  return 35
}

function deriveMinTradingDays(firm: FirmRule): number {
  const freq = firm.payout_frequency.toLowerCase()
  if (freq.includes('daily')) return 4
  if (freq.includes('weekly')) return 5
  return 5
}

function styleEdge(style: TraderStyle, payoutFrequency: string): number {
  const freq = payoutFrequency.toLowerCase()
  if (style === 'scalping' && freq.includes('monthly')) return -0.015
  if (style === 'swing' && freq.includes('monthly')) return 0.01
  if ((style === 'news' || style === 'scalping') && freq.includes('daily')) return 0.01
  return 0
}

function riskBandFromFailure(failProbability: number): 'Low' | 'Medium' | 'High' {
  if (failProbability < 0.45) return 'Low'
  if (failProbability < 0.72) return 'Medium'
  return 'High'
}

function simulateFirm(
  firm: FirmRule,
  profile: { capital: number; riskPct: number; winRatePct: number; rrr: number; style: TraderStyle },
  paths: number
): SimulationResult {
  const initialBalance = profile.capital
  const targetBalance = initialBalance * (1 + firm.profit_target_pct / 100)
  const hardStopBalance = initialBalance * (1 - firm.overall_drawdown_pct / 100)
  const dailyLossLimit = initialBalance * (firm.daily_drawdown_pct / 100)

  const [minTrades, maxTrades] = STYLE_TRADES_PER_DAY[profile.style]
  const styleAdjustment = styleEdge(profile.style, firm.payout_frequency)
  const integrityAdjustment = ((firm.risk_model_integrity - 50) / 1000) + ((firm.operational_stability - 50) / 1200)

  const baseWinRate = profile.winRatePct / 100
  const effectiveWinRate = clamp((baseWinRate * 0.8) + styleAdjustment + integrityAdjustment, 0.08, 0.85)
  const effectiveRrr = clamp(profile.rrr * (0.82 + firm.payout_reliability / 1400), 0.5, 3.5)

  let passed = 0
  let failed = 0
  let payoutDaysSum = 0

  for (let i = 0; i < paths; i += 1) {
    let equity = initialBalance
    let didPass = false
    let didFail = false
    const executionConsistency = randomBetween(0.72, 0.98)

    for (let day = 1; day <= firm.time_limit_days; day += 1) {
      let dayLoss = 0
      const trades = Math.max(1, Math.round(randomBetween(minTrades, maxTrades)))

      for (let t = 0; t < trades; t += 1) {
        const riskAmount = Math.max(1, equity * (profile.riskPct / 100))
        const win = Math.random() < (effectiveWinRate * executionConsistency)
        const pnl = win ? riskAmount * effectiveRrr * executionConsistency : -riskAmount

        equity += pnl
        if (pnl < 0) dayLoss += -pnl

        if (dayLoss >= dailyLossLimit || equity <= hardStopBalance) {
          didFail = true
          break
        }

        if (equity >= targetBalance && day >= firm.min_trading_days) {
          didPass = true
          payoutDaysSum += day
          break
        }
      }

      if (didPass || didFail) break
    }

    if (didPass) passed += 1
    else if (didFail) failed += 1
    else failed += 1
  }

  const passProbability = Number(((passed / paths) * 100).toFixed(2))
  const failProbability = failed / paths
  const avgPayoutDays = passed > 0 ? Number((payoutDaysSum / passed).toFixed(1)) : null

  // Expected first payout estimate after challenge success.
  const expectedPayoutUsd = Number((initialBalance * 0.02 * (firm.payout_reliability > 0 ? firm.payout_reliability / 100 : 0.8) * (passProbability / 100)).toFixed(2))

  return {
    firm_id: firm.firm_id,
    firm_name: firm.firm_name,
    jurisdiction: firm.jurisdiction,
    pass_probability: passProbability,
    expected_payout_days: avgPayoutDays,
    expected_payout_usd: expectedPayoutUsd,
    failure_risk: riskBandFromFailure(failProbability),
    model_confidence: firm.rule_source === 'firm_profile' ? 'High' : 'Medium',
    rules: {
      daily_drawdown_pct: firm.daily_drawdown_pct,
      overall_drawdown_pct: firm.overall_drawdown_pct,
      profit_target_pct: firm.profit_target_pct,
      time_limit_days: firm.time_limit_days,
      min_trading_days: firm.min_trading_days,
      source: firm.rule_source,
    },
  }
}

function dedupeSimulationResults(results: SimulationResult[]): SimulationResult[] {
  const seen = new Set<string>()
  const unique: SimulationResult[] = []
  for (const row of results) {
    const key = `${normalizeFirmKey(row.firm_name)}::${row.firm_id}`
    const nameKey = normalizeFirmKey(row.firm_name)
    if (seen.has(key) || seen.has(nameKey)) continue
    seen.add(key)
    seen.add(nameKey)
    unique.push(row)
  }
  return unique
}

export async function POST(request: NextRequest) {
  const pool = getPool()
  if (!pool) {
    return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 })
  }

  let payload: RequestPayload
  try {
    payload = (await request.json()) as RequestPayload
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const capitalTarget = clamp(toNumber(payload.capitalTarget, 100000), 10000, 500000)
  const riskPerTradePct = clamp(toNumber(payload.riskPerTradePct, 0.5), 0.1, 5)
  const winRatePct = clamp(toNumber(payload.winRatePct, 45), 10, 90)
  const averageRRR = clamp(toNumber(payload.averageRRR, 1.8), 0.5, 6)
  const style = (payload.style || 'intraday') as TraderStyle
  const paths = clamp(Math.round(toNumber(payload.paths, 1000)), 200, 5000)
  const mainstreamOnly = payload.mainstreamOnly !== false

  if (!['scalping', 'intraday', 'swing', 'algo', 'news'].includes(style)) {
    return NextResponse.json({ success: false, error: 'Invalid style' }, { status: 400 })
  }

  try {
    const rulesQuery = `
      SELECT
        f.firm_id,
        COALESCE(f.name, f.brand_name, f.firm_id) AS firm_name,
        COALESCE(f.website_root, '') AS website_root,
        COALESCE(f.jurisdiction, 'Global') AS jurisdiction,
        COALESCE(f.model_type, 'challenge') AS model_type,
        COALESCE(f.payout_frequency, 'monthly') AS payout_frequency,
        COALESCE(f.daily_drawdown_rule::numeric, 4.5) AS daily_drawdown_pct,
        COALESCE(f.max_drawdown_rule::numeric, 10.0) AS overall_drawdown_pct,
        COALESCE(f.payout_reliability::numeric, 70) AS payout_reliability,
        COALESCE(f.operational_stability::numeric, 65) AS operational_stability,
        COALESCE(f.risk_model_integrity::numeric, 65) AS risk_model_integrity,
        COALESCE(g.gri_score::numeric, 40) AS gri_score,
        CASE
          WHEN f.daily_drawdown_rule IS NOT NULL AND f.max_drawdown_rule IS NOT NULL THEN 'firm_profile'
          ELSE 'benchmark_mixed'
        END AS rule_source
      FROM real_firms_only f
      LEFT JOIN v_firm_gri_latest g ON g.firm_id = f.firm_id
      WHERE f.firm_id IS NOT NULL
      ORDER BY COALESCE(f.payout_reliability::numeric, 70) DESC, COALESCE(f.operational_stability::numeric, 65) DESC
      LIMIT 80
    `

    const { rows } = await pool.query(rulesQuery)

    const candidateFirms: FirmRule[] = rows.map((row) => {
      const firm: FirmRule = {
        firm_id: String(row.firm_id),
        firm_name: displayFirmName(String(row.firm_name), String(row.website_root || '')),
        website_root: String(row.website_root || ''),
        jurisdiction: String(row.jurisdiction || 'Global'),
        model_type: String(row.model_type || 'challenge'),
        payout_frequency: String(row.payout_frequency || 'monthly'),
        daily_drawdown_pct: clamp(toNumber(row.daily_drawdown_pct, 4.5), 1.5, 8),
        overall_drawdown_pct: clamp(toNumber(row.overall_drawdown_pct, 10), 4, 20),
        payout_reliability: clamp(toNumber(row.payout_reliability, 70), 1, 99),
        operational_stability: clamp(toNumber(row.operational_stability, 65), 1, 99),
        risk_model_integrity: clamp(toNumber(row.risk_model_integrity, 65), 1, 99),
        gri_score: clamp(toNumber(row.gri_score, 40), 1, 99),
        rule_source: row.rule_source === 'firm_profile' ? 'firm_profile' : 'benchmark_mixed',
        profit_target_pct: 8,
        time_limit_days: 30,
        min_trading_days: 5,
      }

      firm.profit_target_pct = deriveProfitTargetPct(firm)
      firm.time_limit_days = deriveTimeLimitDays(firm)
      firm.min_trading_days = deriveMinTradingDays(firm)
      return firm
    })

    const prioritized = [...candidateFirms]
      .sort((a, b) => publicNameScore(b.firm_name, b.website_root) - publicNameScore(a.firm_name, a.website_root))
      .slice(0, 80)

    const mainstreamAnchors: FirmRule[] = POPULAR_BENCHMARK_FIRMS.map((benchmark) => {
      const liveMatch = candidateFirms.find((firm) => isKnownBrand(firm.firm_name, `${firm.website_root} ${firm.firm_id}`) && normalizeText(firm.firm_name).includes(benchmark.key))
      if (liveMatch) {
        return {
          ...liveMatch,
          firm_name: benchmark.name,
        }
      }

      const synthetic = benchmarkToFirmRule(benchmark)
      synthetic.profit_target_pct = deriveProfitTargetPct(synthetic)
      synthetic.time_limit_days = deriveTimeLimitDays(synthetic)
      synthetic.min_trading_days = deriveMinTradingDays(synthetic)
      return synthetic
    })

    const merged = [...mainstreamAnchors]
    for (const firm of prioritized) {
      if (merged.some((item) => item.firm_id === firm.firm_id || item.firm_name === firm.firm_name)) continue
      merged.push(firm)
      if (merged.length >= 40) break
    }

    const simulationUniverse = mainstreamOnly
      ? merged
      : [...candidateFirms]
          .sort((a, b) => publicNameScore(b.firm_name, b.website_root) - publicNameScore(a.firm_name, a.website_root))
          .slice(0, 40)

    // Guarantee a sufficiently large universe even if live dataset is sparse.
    if (simulationUniverse.length < 20) {
      for (const benchmark of mainstreamAnchors) {
        if (simulationUniverse.some((firm) => normalizeFirmKey(firm.firm_name) === normalizeFirmKey(benchmark.firm_name))) continue
        simulationUniverse.push(benchmark)
        if (simulationUniverse.length >= 20) break
      }
    }

    const profile = {
      capital: capitalTarget,
      riskPct: riskPerTradePct,
      winRatePct,
      rrr: averageRRR,
      style,
    }

    const rawResults = simulationUniverse
      .map((firm) => simulateFirm(firm, profile, paths))
      .sort((a, b) => b.pass_probability - a.pass_probability)

    const results = dedupeSimulationResults(rawResults)

    const best = results[0] || null

    return NextResponse.json({
      success: true,
      data_source: 'live_firm_rules_with_benchmarks',
      simulation: {
        paths,
        audience_mode: mainstreamOnly ? 'mainstream_only' : 'all_live_firms',
        assumptions: {
          capital_target: capitalTarget,
          risk_per_trade_pct: riskPerTradePct,
          win_rate_pct: winRatePct,
          average_rrr: averageRRR,
          style,
        },
      },
      best_firm: best,
      ranking: results.slice(0, 20),
      ranking_count: Math.min(results.length, 20),
      universe_count: simulationUniverse.length,
      headline: best
        ? `Best fit currently: ${best.firm_name} (${best.pass_probability}% pass probability)`
        : 'No firm data available for simulation',
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run trader performance simulation',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
