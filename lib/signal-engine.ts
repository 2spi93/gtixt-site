import type { PublicFirmRecord } from './public-firms'

export type FirmSignalType = 'deteriorating' | 'high-risk' | 'rising' | 'stable' | 'unrated'

export type FirmSignal = {
  type: FirmSignalType
  label: string
  reason: string
  priority: number // 0 = critical, 1 = high, 2 = medium, 3 = low, 4 = unrated
}

export type BestForTag = 'conservative' | 'fast-payouts' | 'high-capital' | 'new-traders'

export type FirmWithSignal = PublicFirmRecord & {
  signal: FirmSignal
  bestFor: BestForTag[]
}

export function computeFirmSignal(firm: PublicFirmRecord): FirmSignal {
  const score       = firm.score_0_100          ?? 0
  const payout      = firm.payout_reliability   ?? 0
  const stability   = firm.operational_stability ?? 0
  const risk        = firm.risk_model_integrity  ?? 0
  const consistency = firm.historical_consistency ?? 0

  // Unrated: no data
  if (score === 0) {
    return {
      type: 'unrated',
      label: 'Unrated',
      reason: 'Insufficient data for signal classification',
      priority: 4,
    }
  }

  // Deteriorating: composite collapse or payout + stability double failure
  if (score < 40 || (payout < 35 && stability < 40)) {
    return {
      type: 'deteriorating',
      label: 'Deteriorating',
      reason:
        score < 40
          ? 'Composite score below minimum threshold'
          : 'Low payout reliability combined with operational instability',
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
      reason:
        risk > 0 && risk < 30
          ? 'Critical risk model integrity failure'
          : `${lowPillarCount} pillars below minimum reliability threshold`,
      priority: 1,
    }
  }

  // Rising: all major pillars consistently strong
  if (score >= 72 && payout >= 70 && stability >= 70) {
    return {
      type: 'rising',
      label: 'Rising Firm',
      reason: 'Consistent strength across all tracked institutional pillars',
      priority: 2,
    }
  }

  // Stable: all pillars above operational threshold
  if (score >= 62 && payout >= 58 && stability >= 58) {
    return {
      type: 'stable',
      label: 'Stable',
      reason: 'Meets reliability criteria across all pillars',
      priority: 3,
    }
  }

  // Borderline fallback
  return {
    type: 'high-risk',
    label: 'High Risk',
    reason: 'Borderline performance across multiple pillars',
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
