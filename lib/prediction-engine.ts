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
