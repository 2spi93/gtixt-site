import type { PublicFirmRecord } from './public-firms'
import { computeFirmSignal } from './signal-engine'

// ── Early Warning ─────────────────────────────────────────────────────────────
// Detected BEFORE a firm reaches red/orange signal threshold.
// Purpose: anticipate deterioration, surface latent structural risk.

export type EarlyWarningType =
  | 'payout-stress'
  | 'volatility-spike'
  | 'consistency-drift'
  | 'rule-instability'

export type EarlyWarningSeverity = 'watch' | 'caution'

export type EarlyWarning = {
  type: EarlyWarningType
  label: string
  description: string
  severity: EarlyWarningSeverity
}

export function detectEarlyWarning(firm: PublicFirmRecord): EarlyWarning | null {
  const score       = firm.score_0_100           ?? 0
  const payout      = firm.payout_reliability    ?? 0
  const stability   = firm.operational_stability ?? 0
  const risk        = firm.risk_model_integrity  ?? 0
  const consistency = firm.historical_consistency ?? 0
  const ruleFreq    = (firm.rule_changes_frequency ?? '').toLowerCase()

  // Skip: unrated or already in red/orange alert zone
  if (score === 0) return null
  if (score < 40 || payout < 35 || (payout < 45 && stability < 45)) return null

  // Payout stress: below 55 and structural co-indicators weakening
  if (payout >= 35 && payout < 55 && (stability < 62 || consistency < 50)) {
    return {
      type: 'payout-stress',
      label: 'Payout Stress',
      description: `Payout reliability at ${payout.toFixed(0)} — approaching risk threshold with co-indicator weakness.`,
      severity: payout < 45 ? 'caution' : 'watch',
    }
  }

  // Volatility spike: extreme spread across pillars before signal triggers
  const active = [payout, stability, risk, consistency].filter((v) => v > 0)
  if (active.length >= 3) {
    const spread = Math.max(...active) - Math.min(...active)
    if (spread >= 32 && score >= 50) {
      return {
        type: 'volatility-spike',
        label: 'Volatility Spike',
        description: `${spread.toFixed(0)}-point spread across pillars — structural tension indicative of early deterioration.`,
        severity: spread >= 45 ? 'caution' : 'watch',
      }
    }
  }

  // Consistency drift: long-run track record eroding while surface looks OK
  if (consistency > 0 && consistency < 48 && payout >= 55 && stability >= 55) {
    return {
      type: 'consistency-drift',
      label: 'Consistency Drift',
      description: `Historical consistency at ${consistency.toFixed(0)} — multi-cycle reliability erosion despite current stability.`,
      severity: 'watch',
    }
  }

  // Rule instability: operational conditions may shift without notice
  if (
    ruleFreq.includes('frequent') ||
    ruleFreq.includes('high') ||
    ruleFreq.includes('unstable')
  ) {
    return {
      type: 'rule-instability',
      label: 'Rule Instability',
      description: 'Elevated rule-change frequency detected. Operational conditions may shift without notice.',
      severity: 'caution',
    }
  }

  return null
}

// ── Systemic Risk ─────────────────────────────────────────────────────────────
// Cross-firm intelligence: measures collective stress across the entire universe.

export type SystemicRiskLevel = 'nominal' | 'elevated' | 'high'

export type SystemicRisk = {
  level: SystemicRiskLevel
  deterioratingCount: number
  highRiskCount: number
  earlyWarningCount: number
  risingCount: number
  totalTracked: number
  stressRatio: number    // (deteriorating + high-risk) / total
  headline: string
  detail: string
}

export function computeSystemicRisk(firms: PublicFirmRecord[]): SystemicRisk {
  const scored = firms.filter((f) => (f.score_0_100 ?? 0) > 0)
  const total  = scored.length

  if (total === 0) {
    return {
      level: 'nominal',
      deterioratingCount: 0, highRiskCount: 0,
      earlyWarningCount: 0,  risingCount: 0,
      totalTracked: 0, stressRatio: 0,
      headline: 'Snapshot syncing',
      detail: 'No scored firms in current universe.',
    }
  }

  let deteriorating = 0
  let highRisk      = 0
  let rising        = 0
  let earlyWarnings = 0

  for (const firm of scored) {
    const signal = computeFirmSignal(firm)
    if      (signal.type === 'deteriorating') deteriorating++
    else if (signal.type === 'high-risk')     highRisk++
    else if (signal.type === 'rising')        rising++
    if (detectEarlyWarning(firm)) earlyWarnings++
  }

  const stressRatio = (deteriorating + highRisk) / total
  const level: SystemicRiskLevel =
    stressRatio >= 0.40 ? 'high' :
    stressRatio >= 0.20 ? 'elevated' :
    'nominal'

  const headline =
    level === 'high'     ? 'Industry Stress High' :
    level === 'elevated' ? 'Industry Stress Elevated' :
    'Market Conditions Nominal'

  const parts: string[] = []
  if (deteriorating > 0) parts.push(`${deteriorating} firm${deteriorating > 1 ? 's' : ''} deteriorating`)
  if (highRisk > 0)      parts.push(`${highRisk} high-risk`)
  if (earlyWarnings > 0) parts.push(`${earlyWarnings} early warning${earlyWarnings > 1 ? 's' : ''}`)
  if (rising > 0)        parts.push(`${rising} rising`)

  const detail = parts.length > 0
    ? parts.join(' · ') + ` · ${total} firms tracked`
    : `${total} firms tracked — conditions nominal`

  return {
    level, deterioratingCount: deteriorating, highRiskCount: highRisk,
    earlyWarningCount: earlyWarnings, risingCount: rising,
    totalTracked: total, stressRatio, headline, detail,
  }
}
