/**
 * Prediction Engine V2
 *
 * Explicit probability forecasts for operational risk
 * - closure_risk: quantifies probability of market exit (0.00 – 1.00)
 * - fraud_risk: quantifies probability of illicit activity detection (0.00 – 1.00)
 * - stress_risk: quantifies probability of inability to meet capital requirements (0.00 – 1.00)
 *
 * Each risk is computed deterministically from current snapshot + trend signals
 * All triggers are documented and returned for operator transparency
 */

import type { PublicFirmRecord } from './public-firms'
import type { EarlyWarning } from './risk-engine'
import { computeFirmSignal, type FirmSignalType } from './signal-engine'
import { detectEarlyWarning } from './risk-engine'

export type PredictionTrigger = {
  name: string
  value: number | string
  threshold: number | string
  severity: 'watch' | 'alert' | 'critical'
}

export type RiskPrediction = {
  closure_risk: number        // [0.00, 1.00]
  fraud_risk: number          // [0.00, 1.00]
  stress_risk: number         // [0.00, 1.00]
  primary_risk: 'closure' | 'fraud' | 'stress' | 'none'  // highest probability
  closure_triggers: PredictionTrigger[]
  fraud_triggers: PredictionTrigger[]
  stress_triggers: PredictionTrigger[]
  overall_confidence: number  // [0.10, 0.90]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Closure Risk: Structural likelihood firm exits market
 *
 * Factors:
 * - Early warning signal (payout-stress, volatility-spike, consistency-drift, rule-instability)
 * - Historical consistency < 40 (operational unreliability)
 * - Payout reliability < 35 (frequent shortfalls)
 * - Rule changes > 1x per quarter (regulatory instability)
 */
export function computeClosureRisk(
  firm: PublicFirmRecord,
  earlyWarning: EarlyWarning | null,
  historicalContext?: { rule_changes_count: number; payout_falling: boolean }
): number {
  let risk = 0.1  // baseline

  // Early warning amplifies closure risk
  if (earlyWarning) {
    if (earlyWarning.type === 'payout-stress') risk += 0.25
    else if (earlyWarning.type === 'consistency-drift') risk += 0.20
    else if (earlyWarning.type === 'rule-instability') risk += 0.18
    else if (earlyWarning.type === 'volatility-spike') risk += 0.12
  }

  // Consistency < 40: operational breakdown
  const consistency = firm.historical_consistency ?? 50
  if (consistency < 30) risk += 0.35
  else if (consistency < 40) risk += 0.20
  else if (consistency < 50) risk += 0.10

  // Payout unreliability
  const payout = firm.payout_reliability ?? 50
  if (payout < 25) risk += 0.25
  else if (payout < 40) risk += 0.15
  else if (payout < 55) risk += 0.08

  // Rule instability amplifier
  if (historicalContext?.rule_changes_count && historicalContext.rule_changes_count > 2) {
    risk += 0.15
  }

  // Payout trajectory
  if (historicalContext?.payout_falling) {
    risk += 0.10
  }

  return Math.min(0.95, risk)
}

/**
 * Fraud Risk: Illicit activity detection probability
 *
 * Factors:
 * - Historical consistency < 30 (systematic evasion indicators)
 * - Risk model integrity < 25 (controls bypass)
 * - Rule changes > 1x per month (regulatory arbitrage)
 * - Operational stability < 20 (internal instability)
 */
export function computeFraudRisk(firm: PublicFirmRecord): number {
  let risk = 0.05  // very low baseline

  // Consistency ultra-low: evasion signal
  const consistency = firm.historical_consistency ?? 50
  if (consistency < 20) risk += 0.40
  else if (consistency < 30) risk += 0.25
  else if (consistency < 40) risk += 0.10

  // Risk model integrity failure
  const riskModel = firm.risk_model_integrity ?? 50
  if (riskModel < 15) risk += 0.30
  else if (riskModel < 25) risk += 0.20
  else if (riskModel < 40) risk += 0.10

  // Operational stability collapse
  const stability = firm.operational_stability ?? 50
  if (stability < 20) risk += 0.20
  else if (stability < 35) risk += 0.10

  // Rapid rule changes (monthly cadence)
  const ruleFreq = String(firm.rule_changes_frequency || '').toLowerCase()
  if (ruleFreq.includes('weekly') || ruleFreq.includes('month')) {
    risk += 0.15
  }

  return Math.min(0.85, risk)
}

/**
 * Stress Risk: Capital requirement failure probability
 *
 * Factors:
 * - Early warning (especially payout-stress or volatility-spike)
 * - Payout reliability < 45 (frequent shortfalls under stress)
 * - Operational stability < 35 (systems breakdown under load)
 * - Risk model integrity < 40 (inadequate stress routing)
 * - Signal is deteriorating or high-risk
 */
export function computeStressRisk(
  firm: PublicFirmRecord,
  earlyWarning: EarlyWarning | null,
  signalType?: FirmSignalType
): number {
  let risk = 0.08  // low baseline

  // Early warning signals amplify stress risk
  if (earlyWarning) {
    if (earlyWarning.type === 'payout-stress') risk += 0.30
    else if (earlyWarning.type === 'volatility-spike') risk += 0.25
    else if (earlyWarning.type === 'consistency-drift') risk += 0.15
    else if (earlyWarning.type === 'rule-instability') risk += 0.08
  }

  // Signal type
  if (signalType === 'deteriorating') risk += 0.25
  else if (signalType === 'high-risk') risk += 0.20

  // Payout under stress
  const payout = firm.payout_reliability ?? 50
  if (payout < 35) risk += 0.25
  else if (payout < 50) risk += 0.15
  else if (payout < 65) risk += 0.08

  // Operational stability under load
  const stability = firm.operational_stability ?? 50
  if (stability < 30) risk += 0.20
  else if (stability < 45) risk += 0.12

  // Risk model stress routing
  const riskModel = firm.risk_model_integrity ?? 50
  if (riskModel < 30) risk += 0.15
  else if (riskModel < 50) risk += 0.08

  return Math.min(0.90, risk)
}

// ── Triggers Builder ──────────────────────────────────────────────────────────

function buildClosureTriggers(
  firm: PublicFirmRecord,
  earlyWarning: EarlyWarning | null,
  historicalContext?: { rule_changes_count: number; payout_falling: boolean }
): PredictionTrigger[] {
  const triggers: PredictionTrigger[] = []

  if (earlyWarning) {
    triggers.push({
      name: `Early warning: ${earlyWarning.type}`,
      value: earlyWarning.severity,
      threshold: 'any',
      severity: earlyWarning.severity === 'caution' ? 'alert' : 'critical',
    })
  }

  const consistency = firm.historical_consistency ?? 50
  if (consistency < 40) {
    triggers.push({
      name: 'Historical consistency',
      value: consistency.toFixed(1),
      threshold: '40',
      severity: consistency < 30 ? 'critical' : 'alert',
    })
  }

  const payout = firm.payout_reliability ?? 50
  if (payout < 55) {
    triggers.push({
      name: 'Payout reliability',
      value: payout.toFixed(1),
      threshold: '55',
      severity: payout < 35 ? 'critical' : 'watch',
    })
  }

  if (historicalContext?.rule_changes_count && historicalContext.rule_changes_count > 2) {
    triggers.push({
      name: 'Rule changes (quarterly)',
      value: historicalContext.rule_changes_count,
      threshold: '2',
      severity: 'alert',
    })
  }

  if (historicalContext?.payout_falling) {
    triggers.push({
      name: 'Payout trajectory',
      value: 'declining',
      threshold: 'stable',
      severity: 'watch',
    })
  }

  return triggers
}

function buildFraudTriggers(firm: PublicFirmRecord): PredictionTrigger[] {
  const triggers: PredictionTrigger[] = []

  const consistency = firm.historical_consistency ?? 50
  if (consistency < 40) {
    triggers.push({
      name: 'Historical consistency',
      value: consistency.toFixed(1),
      threshold: '40',
      severity: consistency < 30 ? 'critical' : 'alert',
    })
  }

  const riskModel = firm.risk_model_integrity ?? 50
  if (riskModel < 40) {
    triggers.push({
      name: 'Risk model integrity',
      value: riskModel.toFixed(1),
      threshold: '40',
      severity: riskModel < 25 ? 'critical' : 'watch',
    })
  }

  const stability = firm.operational_stability ?? 50
  if (stability < 35) {
    triggers.push({
      name: 'Operational stability',
      value: stability.toFixed(1),
      threshold: '35',
      severity: 'watch',
    })
  }

  const ruleFreq = String(firm.rule_changes_frequency || '').toLowerCase()
  if (ruleFreq.includes('weekly') || ruleFreq.includes('month')) {
    triggers.push({
      name: 'Rule change frequency',
      value: ruleFreq,
      threshold: 'quarterly',
      severity: 'alert',
    })
  }

  return triggers
}

function buildStressTriggers(
  firm: PublicFirmRecord,
  earlyWarning: EarlyWarning | null,
  signalType?: FirmSignalType
): PredictionTrigger[] {
  const triggers: PredictionTrigger[] = []

  if (earlyWarning) {
    triggers.push({
      name: `Early warning: ${earlyWarning.type}`,
      value: earlyWarning.severity,
      threshold: 'none',
      severity: earlyWarning.severity === 'caution' ? 'alert' : 'critical',
    })
  }

  if (signalType === 'deteriorating' || signalType === 'high-risk') {
    triggers.push({
      name: 'Signal trajectory',
      value: signalType,
      threshold: 'rising/stable',
      severity: 'alert',
    })
  }

  const payout = firm.payout_reliability ?? 50
  if (payout < 65) {
    triggers.push({
      name: 'Payout reliability under stress',
      value: payout.toFixed(1),
      threshold: '65',
      severity: payout < 45 ? 'critical' : 'watch',
    })
  }

  const stability = firm.operational_stability ?? 50
  if (stability < 45) {
    triggers.push({
      name: 'Operational stability',
      value: stability.toFixed(1),
      threshold: '45',
      severity: stability < 30 ? 'critical' : 'watch',
    })
  }

  const riskModel = firm.risk_model_integrity ?? 50
  if (riskModel < 50) {
    triggers.push({
      name: 'Risk model integrity',
      value: riskModel.toFixed(1),
      threshold: '50',
      severity: riskModel < 30 ? 'alert' : 'watch',
    })
  }

  return triggers
}

// ── Main Prediction Builder ──────────────────────────────────────────────────

/**
 * Build full risk prediction for a single firm
 * Returns probability estimates + all triggers for operator decision-making
 */
export function buildRiskPrediction(
  firm: PublicFirmRecord,
  historicalContext?: { rule_changes_count: number; payout_falling: boolean }
): RiskPrediction {
  // Get current signals
  const earlyWarning = detectEarlyWarning(firm)
  const signal = computeFirmSignal(firm)

  // Compute risk scores
  const closure_risk = computeClosureRisk(firm, earlyWarning, historicalContext)
  const fraud_risk = computeFraudRisk(firm)
  const stress_risk = computeStressRisk(firm, earlyWarning, signal.type)

  // Identify primary risk
  const risks = [closure_risk, fraud_risk, stress_risk]
  const maxRisk = Math.max(...risks)
  let primary_risk: 'closure' | 'fraud' | 'stress' | 'none' = 'none'
  if (maxRisk >= 0.50) {
    if (closure_risk === maxRisk) primary_risk = 'closure'
    else if (fraud_risk === maxRisk) primary_risk = 'fraud'
    else if (stress_risk === maxRisk) primary_risk = 'stress'
  }

  // Build all triggers
  const closure_triggers = buildClosureTriggers(firm, earlyWarning, historicalContext)
  const fraud_triggers = buildFraudTriggers(firm)
  const stress_triggers = buildStressTriggers(firm, earlyWarning, signal.type)

  // Compute overall confidence
  const triggerCount = closure_triggers.length + fraud_triggers.length + stress_triggers.length
  const overall_confidence = Math.min(0.90, 0.30 + triggerCount * 0.15 / 3)

  return {
    closure_risk,
    fraud_risk,
    stress_risk,
    primary_risk,
    closure_triggers,
    fraud_triggers,
    stress_triggers,
    overall_confidence,
  }
}

export { computeFirmSignal }

// ── PHASE 11: Advanced Intelligence ─────────────────────────────────────────

export type PredictionTrend = {
  trend_direction: 'up' | 'down' | 'sideways'
  trend_strength: number      // [0, 1]: volatility of movement
  periods_worsening: number   // Count of consecutive periods ↓
  trend_multiplier: number    // [0.8, 1.3]: amplifier for closure_risk
}

export type ContagionRisk = {
  contagion_index: number     // [0, 1]: systemic stress spreading probability
  upstream_stress_count: number  // How many high-stress firms in ecosystem?
  vulnerability_score: number    // [0, 1]: firm's susceptibility to spillover
  contagion_triggers: PredictionTrigger[]
}

export type RuleVelocity = {
  change_frequency_score: number  // [0, 1]: how often rules change?
  change_amplitude_score: number  // [0, 1]: magnitude of changes?
  velocity_index: number          // [0, 1]: combined frequency × amplitude
  compliance_risk_premium: number // [0, 0.3]: added to fraud_risk
}

/**
 * Compute multi-period closure risk trend
 * Analyzes prediction history to detect deteriorating trajectories
 *
 * If closure_risk is trending ↓↓ → multiplier increases (e.g., 1.2x)
 * If closure_risk is stable → multiplier stays ~1.0
 */
export function computeClosureTrend(
  predictionHistory: Array<{ timestamp: Date; closure_risk: number }>
): PredictionTrend {
  if (predictionHistory.length < 2) {
    return {
      trend_direction: 'sideways',
      trend_strength: 0,
      periods_worsening: 0,
      trend_multiplier: 1.0,
    }
  }

  // Sort oldest → newest
  const sorted = predictionHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  let periods_worsening = 0
  const diffs: number[] = []

  // Calculate period-over-period deltas
  for (let i = 1; i < sorted.length; i++) {
    const delta = sorted[i].closure_risk - sorted[i - 1].closure_risk
    diffs.push(delta)
    if (delta > 0) periods_worsening++ // Worsening = increasing closure risk
  }

  // Trend direction
  const avgDelta = diffs.reduce((a, b) => a + b, 0) / diffs.length
  const trend_direction: 'up' | 'down' | 'sideways' =
    avgDelta > 0.05 ? 'up' : avgDelta < -0.05 ? 'down' : 'sideways'

  // Trend strength: standard deviation of changes
  const variance = diffs.reduce((sum, d) => sum + Math.pow(d - avgDelta, 2), 0) / diffs.length
  const trend_strength = Math.min(1, Math.sqrt(variance))

  // Trend multiplier: if consistently worsening, amplify risk
  let trend_multiplier = 1.0
  if (trend_direction === 'up' && periods_worsening >= diffs.length * 0.7) {
    trend_multiplier = 1.0 + trend_strength * 0.3 // up to 1.3x
  } else if (trend_direction === 'down') {
    trend_multiplier = Math.max(0.8, 1.0 - trend_strength * 0.2) // down to 0.8x relief
  }

  return {
    trend_direction,
    trend_strength,
    periods_worsening,
    trend_multiplier,
  }
}

/**
 * Compute cross-firm contagion risk
 * Analyzes systemic stress: if many firms in high-risk state → stress spillover
 *
 * Contagion happens when:
 * - Firm A + B have high-stress signals + operate in same jurisdiction/model
 * - If A closes → B shares regulatory/market attention risk
 */
export function computeContagionRisk(
  firm: PublicFirmRecord,
  otherFirms: PublicFirmRecord[],
  stressRatio: number
): ContagionRisk {
  const highStressFirms = otherFirms.filter((f) => {
    const score = f.score_0_100 ?? 0
    return score < 40 || (f.historical_consistency ?? 50) < 35
  })

  let upstream_stress_count = highStressFirms.length
  let contagion_index = 0.1

  // Jurisdiction proximity effect
  const sameJurisdiction = otherFirms.filter(
    (f) => f.jurisdiction === firm.jurisdiction && f.firm_id !== firm.firm_id
  )
  const sameJurisdictionStressed = sameJurisdiction.filter(
    (f) => (f.score_0_100 ?? 0) < 40
  ).length

  if (sameJurisdictionStressed > 0) {
    contagion_index += sameJurisdictionStressed * 0.20
  }

  // Payout frequency proximity effect
  const samePayoutFreq = otherFirms.filter(
    (f) => f.payout_frequency === firm.payout_frequency && f.firm_id !== firm.firm_id
  )
  const sameFreqStressed = samePayoutFreq.filter((f) => (f.score_0_100 ?? 0) < 40).length

  if (sameFreqStressed > 0) {
    contagion_index += sameFreqStressed * 0.15
  }

  // Systemic stress amplifier
  contagion_index += stressRatio * 0.3

  // Firm's vulnerability score
  const consistency = firm.historical_consistency ?? 50
  const stability = firm.operational_stability ?? 50
  const vulnerability_score = 1.0 - (consistency + stability) / 200

  const adjusted_contagion = Math.min(1.0, contagion_index * (0.5 + vulnerability_score * 0.5))

  const contagion_triggers: PredictionTrigger[] = []

  if (sameJurisdictionStressed > 0) {
    contagion_triggers.push({
      name: `Same-jurisdiction stress`,
      value: sameJurisdictionStressed,
      threshold: '0',
      severity: 'watch',
    })
  }

  if (sameFreqStressed > 0) {
    contagion_triggers.push({
      name: `Same payout-frequency stress`,
      value: sameFreqStressed,
      threshold: '0',
      severity: 'watch',
    })
  }

  if (vulnerability_score > 0.6) {
    contagion_triggers.push({
      name: 'Firm vulnerability',
      value: (vulnerability_score * 100).toFixed(0),
      threshold: '60',
      severity: 'alert',
    })
  }

  return {
    contagion_index: adjusted_contagion,
    upstream_stress_count,
    vulnerability_score,
    contagion_triggers,
  }
}

/**
 * Compute rule change velocity scoring
 * Rapid rule changes + large amplitude → compliance risk signal
 *
 * Frequency: how often rules change? (weekly/monthly/quarterly/annual)
 * Amplitude: how significant are changes? (inferred from consistency drops)
 */
export function computeRuleVelocity(firm: PublicFirmRecord): RuleVelocity {
  let change_frequency_score = 0.2 // baseline low

  const ruleFreq = String(firm.rule_changes_frequency || '').toLowerCase()

  if (ruleFreq.includes('weekly')) {
    change_frequency_score = 0.9
  } else if (ruleFreq.includes('monthly') || ruleFreq.includes('bi-weekly')) {
    change_frequency_score = 0.7
  } else if (ruleFreq.includes('quarterly') || ruleFreq.includes('6-month')) {
    change_frequency_score = 0.4
  } else if (ruleFreq.includes('bi-') || ruleFreq.includes('annual')) {
    change_frequency_score = 0.2
  }

  // Amplitude: inferred from consistency score
  // Low consistency + frequent rules → high amplitude
  const consistency = firm.historical_consistency ?? 50
  let change_amplitude_score = 0.1

  if (consistency < 30) {
    change_amplitude_score = 0.9 // radical, unexplained changes
  } else if (consistency < 40) {
    change_amplitude_score = 0.65 // significant amplitude
  } else if (consistency < 55) {
    change_amplitude_score = 0.4 // moderate changes
  } else if (consistency < 70) {
    change_amplitude_score = 0.2 // minor changes
  }

  // Velocity index: combined metric
  const velocity_index = Math.min(1.0, (change_frequency_score * 0.6 + change_amplitude_score * 0.4))

  // Compliance risk premium: added to fraud_risk for rapid/radical changes
  const compliance_risk_premium = velocity_index * 0.3 // up to +0.30

  return {
    change_frequency_score,
    change_amplitude_score,
    velocity_index,
    compliance_risk_premium,
  }
}

/**
 * Extended prediction with Phase 11 advanced intelligence
 * Incorporates trend analysis + contagion + rule velocity
 */
export function buildAdvancedRiskPrediction(
  firm: PublicFirmRecord,
  otherFirms: PublicFirmRecord[],
  stressRatio: number,
  predictionHistory?: Array<{ timestamp: Date; closure_risk: number }>
): RiskPrediction & { trend: PredictionTrend; contagion: ContagionRisk; rule_velocity: RuleVelocity } {
  // Get base prediction
  const basePrediction = buildRiskPrediction(firm)

  // Compute advanced metrics
  const trend = computeClosureTrend(predictionHistory || [])
  const contagion = computeContagionRisk(firm, otherFirms, stressRatio)
  const rule_velocity = computeRuleVelocity(firm)

  // Apply multipliers
  const closure_risk_adjusted = Math.min(
    0.95,
    basePrediction.closure_risk * trend.trend_multiplier + contagion.contagion_index * 0.2
  )

  const fraud_risk_adjusted = Math.min(
    0.85,
    basePrediction.fraud_risk + rule_velocity.compliance_risk_premium
  )

  const stress_risk_adjusted = Math.min(
    0.90,
    basePrediction.stress_risk + contagion.contagion_index * 0.15
  )

  // Rebuild primary risk
  const risks = [closure_risk_adjusted, fraud_risk_adjusted, stress_risk_adjusted]
  const maxRisk = Math.max(...risks)
  let primary_risk: 'closure' | 'fraud' | 'stress' | 'none' = 'none'
  if (maxRisk >= 0.50) {
    if (closure_risk_adjusted === maxRisk) primary_risk = 'closure'
    else if (fraud_risk_adjusted === maxRisk) primary_risk = 'fraud'
    else if (stress_risk_adjusted === maxRisk) primary_risk = 'stress'
  }

  // Combine all triggers
  const all_triggers = [
    ...basePrediction.closure_triggers,
    ...contagion.contagion_triggers,
  ]

  return {
    ...basePrediction,
    closure_risk: closure_risk_adjusted,
    fraud_risk: fraud_risk_adjusted,
    stress_risk: stress_risk_adjusted,
    primary_risk,
    closure_triggers: all_triggers,
    trend,
    contagion,
    rule_velocity,
  }
}
