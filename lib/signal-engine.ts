import type { PublicFirmRecord } from './public-firms'

export type FirmSignalType = 'deteriorating' | 'high-risk' | 'rising' | 'stable' | 'unrated'
export type SignalTrend = 'up' | 'down' | 'sideways' | 'volatile'
export type SignalVolatility = 'low' | 'moderate' | 'high'

export type FirmSignal = {
  type: FirmSignalType
  label: string
  action: string          // operator recommendation: "Avoid new capital allocation"
  reason: string          // trigger summary: "2 pillars below minimum threshold"
  evidence: string[]      // pillar breakdown: ["Payout: 28 ↓", "Stability: 32 ↓"]
  trend: SignalTrend      // derived from signal + pillar spread
  volatility: SignalVolatility  // computed from pillar spread
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

// ── Signal Classifier ────────────────────────────────────────────────────────

export function computeFirmSignal(firm: PublicFirmRecord): FirmSignal {
  const score       = firm.score_0_100           ?? 0
  const payout      = firm.payout_reliability    ?? 0
  const stability   = firm.operational_stability ?? 0
  const risk        = firm.risk_model_integrity  ?? 0
  const consistency = firm.historical_consistency ?? 0

  const volatility = getPillarVolatility([payout, stability, risk, consistency])
  const evidence   = buildEvidence(firm)

  // Unrated: no data
  if (score === 0) {
    return {
      type: 'unrated',
      label: 'Unrated',
      action: 'Insufficient data — research required before allocation',
      reason: 'Insufficient data for signal classification',
      evidence,
      trend: 'sideways',
      volatility: 'low',
      priority: 4,
    }
  }

  // Deteriorating: composite collapse or payout + stability double failure
  if (score < 40 || (payout < 35 && stability < 40)) {
    return {
      type: 'deteriorating',
      label: 'Deteriorating',
      action: 'Monitor closely — pause new capital allocation',
      reason:
        score < 40
          ? 'Composite score below minimum threshold'
          : 'Low payout reliability combined with operational instability',
      evidence,
      trend: 'down',
      volatility,
      priority: 0,
    }
  }

  // High Risk: critical risk model OR 2+ pillars below 45
  const checkedPillars = [payout, stability, risk, consistency].filter((v) => v > 0)
  const lowPillarCount = checkedPillars.filter((v) => v < 45).length
  if ((risk > 0 && risk < 30) || lowPillarCount >= 2) {
    return {
      type: 'high-risk',
      label: 'High Risk',
      action: 'Avoid new capital allocation until signal improves',
      reason:
        risk > 0 && risk < 30
          ? 'Critical risk model integrity failure'
          : `${lowPillarCount} pillars below minimum reliability threshold`,
      evidence,
      trend: volatility === 'high' ? 'volatile' : 'down',
      volatility,
      priority: 1,
    }
  }

  // Rising: all major pillars consistently strong
  if (score >= 72 && payout >= 70 && stability >= 70) {
    return {
      type: 'rising',
      label: 'Rising Firm',
      action: 'Opportunity emerging — validate before committing capital',
      reason: 'Consistent strength across all tracked institutional pillars',
      evidence,
      trend: 'up',
      volatility,
      priority: 2,
    }
  }

  // Stable: all pillars above operational threshold
  if (score >= 62 && payout >= 58 && stability >= 58) {
    return {
      type: 'stable',
      label: 'Stable',
      action: 'Suitable for continued allocation',
      reason: 'Meets reliability criteria across all pillars',
      evidence,
      trend: 'sideways',
      volatility,
      priority: 3,
    }
  }

  // Borderline fallback
  return {
    type: 'high-risk',
    label: 'High Risk',
    action: 'Avoid new capital allocation until signal improves',
    reason: 'Borderline performance across multiple pillars',
    evidence,
    trend: volatility === 'high' ? 'volatile' : 'down',
    volatility,
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
