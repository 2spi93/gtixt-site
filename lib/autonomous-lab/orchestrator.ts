import { runShadowScoring } from './shadow-scoring'
import { analyzeWebglTelemetry } from './webgl-optimizer'
import type { ExperimentMetrics, LabExperiment } from './types'
import { getPromotionThreshold } from './registry'
import { buildHumanReport, type HumanReport } from './explainer'

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

export async function runMinimalOrchestrator(input: {
  experiment: LabExperiment
  baseUrl: string
}): Promise<{
  steps: Array<{ name: string; status: 'ok' | 'warning'; details: Record<string, unknown> }>
  recommendation: 'promote_for_review' | 'keep_in_shadow' | 'reject'
  mergedMetrics: ExperimentMetrics
  humanReport: HumanReport
}> {
  const steps: Array<{ name: string; status: 'ok' | 'warning'; details: Record<string, unknown> }> = []
  const threshold = await getPromotionThreshold(input.experiment.module)

  const architectProposal = {
    hypothesis: input.experiment.hypothesis,
    candidateBias: 0.8,
    naPenaltyWeight: 8,
  }
  steps.push({ name: 'architect', status: 'ok', details: architectProposal })

  // In MVP mode code-agent is constrained to config-only candidate changes.
  steps.push({
    name: 'code-agent',
    status: 'ok',
    details: {
      mode: 'config-only-shadow',
      appliedChanges: input.experiment.changes,
      safeGuard: 'no direct production patch',
    },
  })

  const shadow = await runShadowScoring({
    sampleLimit: 800,
    candidateBias: architectProposal.candidateBias,
    naPenaltyWeight: architectProposal.naPenaltyWeight,
  })
  steps.push({ name: 'runner-shadow', status: 'ok', details: shadow as unknown as Record<string, unknown> })

  const webgl = await analyzeWebglTelemetry(input.baseUrl)
  steps.push({
    name: 'runner-webgl',
    status: webgl.summary.criticalCount && Number(webgl.summary.criticalCount) > 0 ? 'warning' : 'ok',
    details: {
      summary: webgl.summary,
      hints: webgl.optimizationHints,
    },
  })

  const mergedMetrics: ExperimentMetrics = {
    ...input.experiment.metrics,
    coverageDelta: shadow.coverageDelta,
    stabilityDelta: shadow.stabilityDelta,
    anomaliesDelta: shadow.anomaliesDelta,
    riskSeparationDelta: shadow.riskSeparationDelta,
    snapshotDriftDelta: shadow.snapshotDriftDelta,
    bucketChurnDelta: shadow.bucketChurnDelta,
    perfDelta: Number(webgl.metrics.perfDelta || 0),
    qualityDelta: Number(webgl.metrics.qualityDelta || 0),
  }

  const decisionScore = clamp(
    50 +
      (Number(mergedMetrics.coverageDelta || 0) * 2) +
      (Number(mergedMetrics.stabilityDelta || 0) * 4) +
      (Number(mergedMetrics.anomaliesDelta || 0) * 3) +
      (Number(mergedMetrics.riskSeparationDelta || 0) * 1.5) +
      (Number(mergedMetrics.snapshotDriftDelta || 0) * 2) +
      (Number(mergedMetrics.bucketChurnDelta || 0) * 1.5) +
      (Number(mergedMetrics.perfDelta || 0) * 0.2) +
      (Number(mergedMetrics.qualityDelta || 0) * 5)
  )

  mergedMetrics.decisionScore = Number(decisionScore.toFixed(2))

  const passThresholds =
    Number(mergedMetrics.coverageDelta || 0) >= threshold.minCoverageDelta &&
    Number(mergedMetrics.stabilityDelta || 0) >= threshold.minStabilityDelta &&
    Number(mergedMetrics.anomaliesDelta || 0) >= threshold.minAnomaliesDelta &&
    Number(mergedMetrics.riskSeparationDelta || 0) >= threshold.minRiskSeparationDelta &&
    Number(mergedMetrics.snapshotDriftDelta || 0) >= threshold.minSnapshotDriftDelta &&
    Number(mergedMetrics.bucketChurnDelta || 0) >= threshold.minBucketChurnDelta &&
    Number(mergedMetrics.perfDelta || 0) >= threshold.minPerfDelta &&
    Number(mergedMetrics.qualityDelta || 0) >= threshold.minQualityDelta &&
    Number(mergedMetrics.decisionScore || 0) >= threshold.minDecisionScore

  let recommendation: 'promote_for_review' | 'keep_in_shadow' | 'reject' = 'keep_in_shadow'
  if (passThresholds && Number(webgl.summary.criticalCount || 0) === 0) {
    recommendation = 'promote_for_review'
  }
  if (shadow.anomaliesDelta < -3 || shadow.stabilityDelta < -2) {
    recommendation = 'reject'
  }

  steps.push({
    name: 'analyst',
    status: recommendation === 'reject' ? 'warning' : 'ok',
    details: { recommendation, mergedMetrics, threshold, passThresholds },
  })

  steps.push({
    name: 'reviewer',
    status: 'ok',
    details: {
      policy: 'human-promotion-required',
      promotionGuard: 'never auto-deploy scoring changes',
    },
  })

  const humanReport = buildHumanReport(
    mergedMetrics as unknown as Record<string, unknown>,
    steps,
    recommendation
  )

  return { steps, recommendation, mergedMetrics, humanReport }
}
