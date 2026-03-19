import type { PublicFirmRecord } from './public-firms'

export type FirmSignalType = 'deteriorating' | 'high-risk' | 'rising' | 'stable' | 'unrated'
export type SignalTrend = 'up' | 'down' | 'sideways' | 'volatile'
export type SignalVolatility = 'low' | 'moderate' | 'high'

export type SignalBreakdown = {
  payout: number
  stability: number
  riskModel: number
  consistency: number
}

export type FirmSignal = {
  type: FirmSignalType
  label: string
  action: string          // operator recommendation: "Avoid new capital allocation"
  reason: string          // trigger summary: "2 pillars below minimum threshold"
  evidence: string[]      // pillar breakdown: ["Payout: 28 ↓", "Stability: 32 ↓"]
  breakdown: SignalBreakdown // normalized impact weights across pillars
  trend: SignalTrend      // derived from signal + pillar spread
  volatility: SignalVolatility  // computed from pillar spread
  confidence: number      // 0.10 – 0.97: data completeness × signal strength
  priority: number        // 0 = critical → 4 = unrated
}

export type BestForTag = 'conservative' | 'fast-payouts' | 'high-capital' | 'new-traders'

export type FirmWithSignal = PublicFirmRecord & {
  signal: FirmSignal
  bestFor: BestForTag[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getPillarVolatility(pillars: number[]): SignalVolatility {
  const active = pillars.filter((v) => v > 0)
  if (active.length < 2) return 'low'
  const spread = Math.max(...active) - Math.min(...active)
  if (spread >= 45) return 'high'
  if (spread >= 25) return 'moderate'
  return 'low'
}

function buildEvidence(firm: PublicFirmRecord): string[] {
  const fields: [string, number | undefined][] = [
    ['Payout reliability', firm.payout_reliability],
    ['Operational stability', firm.operational_stability],
    ['Risk model integrity', firm.risk_model_integrity],
    ['Historical consistency', firm.historical_consistency],
  ]
  return fields
    .filter(([, val]) => val !== undefined && (val as number) > 0)
    .map(([label, val]) => {
      const v = val as number
      const indicator = v < 40 ? ' ↓' : v >= 72 ? ' ↑' : ''
      return `${label}: ${v.toFixed(0)}${indicator}`
    })
}

function normalizeBreakdown(values: SignalBreakdown): SignalBreakdown {
  const total = values.payout + values.stability + values.riskModel + values.consistency
  if (total <= 0) {
    return { payout: 25, stability: 25, riskModel: 25, consistency: 25 }
  }

  const payout = Math.round((values.payout / total) * 100)
  const stability = Math.round((values.stability / total) * 100)
  const riskModel = Math.round((values.riskModel / total) * 100)
  const consistency = Math.max(0, 100 - payout - stability - riskModel)

  return { payout, stability, riskModel, consistency }
}

function buildSignalBreakdown(firm: PublicFirmRecord, type: FirmSignalType): SignalBreakdown {
  const payout = firm.payout_reliability ?? 0
  const stability = firm.operational_stability ?? 0
  const risk = firm.risk_model_integrity ?? 0
  const consistency = firm.historical_consistency ?? 0

  if (type === 'rising' || type === 'stable') {
    return normalizeBreakdown({
      payout: Math.max(1, payout - 50),
      stability: Math.max(1, stability - 50),
      riskModel: Math.max(1, risk - 50),
      consistency: Math.max(1, consistency - 50),
    })
  }

  if (type === 'unrated') {
    return { payout: 25, stability: 25, riskModel: 25, consistency: 25 }
  }

  return normalizeBreakdown({
    payout: Math.max(1, 60 - payout),
    stability: Math.max(1, 60 - stability),
    riskModel: Math.max(1, 60 - risk),
    consistency: Math.max(1, 60 - consistency),
  })
}

// ── Confidence Scorer ────────────────────────────────────────────────────────
// confidence = (data completeness × 0.35) + (signal strength × 0.65)
// Higher = signal is backed by complete data AND far from decision thresholds.

function computeConfidence(
  type: FirmSignalType,
  score: number,
  payout: number,
  stability: number,
  risk: number,
  lowPillarCount: number,
): number {
  if (type === 'unrated') return 0
  const active = [score, payout, stability, risk].filter((v) => v > 0).length
  const dataBasis = active / 4

  let strength = 0.5
  if (type === 'deteriorating') {
    strength = score > 0 && score < 40
      ? Math.min(1, (40 - score) / 30)
      : Math.min(1, ((35 - Math.max(0, payout)) + (40 - Math.max(0, stability))) / 45)
  } else if (type === 'high-risk') {
    strength = risk > 0 && risk < 30
      ? Math.min(1, (30 - risk) / 25)
      : Math.min(1, 0.2 + lowPillarCount * 0.3)
  } else if (type === 'rising') {
    strength = Math.min(1, (score - 72) / 18 + (payout >= 80 ? 0.15 : 0))
  } else if (type === 'stable') {
    strength = Math.min(1, (score - 62) / 22)
  }

  return Math.max(0.10, Math.min(0.97, dataBasis * 0.35 + Math.max(0, strength) * 0.65))
}

// ── Signal Classifier ────────────────────────────────────────────────────────

export function computeFirmSignal(firm: PublicFirmRecord): FirmSignal {
  const score       = firm.score_0_100           ?? 0
  const payout      = firm.payout_reliability    ?? 0
  const stability   = firm.operational_stability ?? 0
  const risk        = firm.risk_model_integrity  ?? 0
  const consistency = firm.historical_consistency ?? 0

  const volatility     = getPillarVolatility([payout, stability, risk, consistency])
  const evidence       = buildEvidence(firm)
  const checkedPillars = [payout, stability, risk, consistency].filter((v) => v > 0)
  const lowPillarCount = checkedPillars.filter((v) => v < 45).length

  // Unrated: no data
  if (score === 0) {
    return {
      type: 'unrated', label: 'Unrated',
      action: 'Insufficient data — research required before allocation',
      reason: 'Insufficient data for signal classification',
      evidence,
      breakdown: buildSignalBreakdown(firm, 'unrated'),
      trend: 'sideways', volatility,
      confidence: 0,
      priority: 4,
    }
  }

  // Deteriorating: composite collapse or payout + stability double failure
  if (score < 40 || (payout < 35 && stability < 40)) {
    const type: FirmSignalType = 'deteriorating'
    return {
      type, label: 'Deteriorating',
      action: 'Monitor closely — pause new capital allocation',
      reason: score < 40
        ? 'Composite score below minimum threshold'
        : 'Low payout reliability combined with operational instability',
      evidence,
      breakdown: buildSignalBreakdown(firm, type),
      trend: 'down', volatility,
      confidence: computeConfidence(type, score, payout, stability, risk, lowPillarCount),
      priority: 0,
    }
  }

  // High Risk: critical risk model OR 2+ pillars below 45
  if ((risk > 0 && risk < 30) || lowPillarCount >= 2) {
    const type: FirmSignalType = 'high-risk'
    return {
      type, label: 'High Risk',
      action: 'Avoid new capital allocation until signal improves',
      reason: risk > 0 && risk < 30
        ? 'Critical risk model integrity failure'
        : `${lowPillarCount} pillars below minimum reliability threshold`,
      evidence,
      breakdown: buildSignalBreakdown(firm, type),
      trend: volatility === 'high' ? 'volatile' : 'down', volatility,
      confidence: computeConfidence(type, score, payout, stability, risk, lowPillarCount),
      priority: 1,
    }
  }

  // Rising: all major pillars consistently strong
  if (score >= 72 && payout >= 70 && stability >= 70) {
    const type: FirmSignalType = 'rising'
    return {
      type, label: 'Rising Firm',
      action: 'Opportunity emerging — validate before committing capital',
      reason: 'Consistent strength across all tracked institutional pillars',
      evidence,
      breakdown: buildSignalBreakdown(firm, type),
      trend: 'up', volatility,
      confidence: computeConfidence(type, score, payout, stability, risk, lowPillarCount),
      priority: 2,
    }
  }

  // Stable: all pillars above operational threshold
  if (score >= 62 && payout >= 58 && stability >= 58) {
    const type: FirmSignalType = 'stable'
    return {
      type, label: 'Stable',
      action: 'Suitable for continued allocation',
      reason: 'Meets reliability criteria across all pillars',
      evidence,
      breakdown: buildSignalBreakdown(firm, type),
      trend: 'sideways', volatility,
      confidence: computeConfidence(type, score, payout, stability, risk, lowPillarCount),
      priority: 3,
    }
  }

  // Borderline fallback → High Risk
  const type: FirmSignalType = 'high-risk'
  return {
    type, label: 'High Risk',
    action: 'Avoid new capital allocation until signal improves',
    reason: 'Borderline performance across multiple pillars',
    evidence,
    breakdown: buildSignalBreakdown(firm, type),
    trend: volatility === 'high' ? 'volatile' : 'down', volatility,
    confidence: computeConfidence(type, score, payout, stability, risk, lowPillarCount),
    priority: 1,
  }
}

export function computeBestFor(firm: PublicFirmRecord): BestForTag[] {
  const tags: BestForTag[] = []
  const score       = firm.score_0_100          ?? 0
  const payout      = firm.payout_reliability   ?? 0
  const stability   = firm.operational_stability ?? 0
  const consistency = firm.historical_consistency ?? 0
  const freq        = (firm.payout_frequency    ?? '').toLowerCase()
  const account     = firm.account_size_usd     ?? 0

  // Conservative: high stability, high consistency, reliable payouts
  if (stability >= 70 && consistency >= 65 && payout >= 60) {
    tags.push('conservative')
  }

  // Fast Payouts: weekly/bi-weekly cadence with strong payout score
  if ((freq.includes('week') || freq.includes('bi')) && payout >= 70) {
    tags.push('fast-payouts')
  }

  // High Capital: large funded accounts and strong composite
  if (account >= 200000 && score >= 65) {
    tags.push('high-capital')
  }

  // New Traders: accessible score range with stable operation
  if (score >= 55 && score < 80 && stability >= 60) {
    tags.push('new-traders')
  }

  return tags
}

export function enrichWithSignals(firms: PublicFirmRecord[]): FirmWithSignal[] {
  return firms.map((f) => ({
    ...f,
    signal: computeFirmSignal(f),
    bestFor: computeBestFor(f),
  }))
}
