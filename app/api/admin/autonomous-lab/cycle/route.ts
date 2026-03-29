import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import {
  createExperiment,
  getExperimentById,
  listExperiments,
  updateExperiment,
} from '@/lib/autonomous-lab/registry'
import {
  enqueuePriorityHypothesis,
  generateHypotheses,
  listBacklog,
  listRecentUserFeedback,
  updateBacklogItemStatus,
} from '@/lib/autonomous-lab/hypothesis-generator'
import { runShadowScoring } from '@/lib/autonomous-lab/shadow-scoring'
import { runMinimalOrchestrator } from '@/lib/autonomous-lab/orchestrator'
import { rankBacklogForExecution } from '@/lib/autonomous-lab/priority-engine'
import { getRadarCycleSignals } from '@/lib/autonomous-lab/radar-bridge'
import {
  getLatestPriorityScores,
  recordPriorityScores,
} from '@/lib/autonomous-lab/priority-history'
import {
  getDecisionPenaltyMap,
  recordDecisionOutcome,
} from '@/lib/autonomous-lab/decision-memory'
import { runDecisionEngine } from '@/lib/autonomous-lab/decision-engine'
import { recordDecisionSnapshot } from '@/lib/autonomous-lab/decision-history'
import type { LabExperiment } from '@/lib/autonomous-lab/types'

function makeExperimentId(): string {
  return `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  const forceRun = body?.forceRun === true || body?.forceRun === '1'
  const targetMin = Math.max(10, Math.min(300, Number(body?.targetMin || 100)))
  const batchSize = Math.max(1, Math.min(30, Number(body?.batchSize || 10)))
  const sampleLimit = Math.max(100, Math.min(5000, Number(body?.sampleLimit || 800)))
  const manualRadarBoostModules = Array.isArray(body?.radarBoostModules)
    ? body.radarBoostModules.map((x: unknown) => String(x).trim()).filter(Boolean)
    : []
  const baseUrl = typeof body?.baseUrl === 'string' ? body.baseUrl : request.headers.get('origin') || 'http://127.0.0.1:3000'

  const decision = await runDecisionEngine(baseUrl, {
    cycleType: 'scheduled',
  })
  await recordDecisionSnapshot({
    source: 'cycle_gate',
    decision,
    dedupeWindowSeconds: 120,
    metadata: {
      targetMin,
      batchSize,
      sampleLimit,
      forceRun,
    },
  }).catch(() => null)

  if (!forceRun && !decision.shouldRunCycle) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'Decision Engine blocked cycle execution',
      decision,
      data: {
        targetMin,
        batchSize,
        sampleLimit,
      },
    })
  }

  const effectiveBatchSize = Math.max(
    1,
    Math.min(30, Math.round(batchSize * Number(decision.pacingMultiplier || 1))),
  )

  await generateHypotheses()
  const radarSignals = await getRadarCycleSignals(baseUrl)

  for (const hypothesis of radarSignals.priorityHypotheses) {
    await enqueuePriorityHypothesis(hypothesis)
  }

  const radarBoostModules = [
    ...new Set([...manualRadarBoostModules, ...radarSignals.boostModules, ...decision.moduleFocus]),
  ]

  const existing = await listExperiments(300)
  const beforeCount = existing.length
  const needToCreate = Math.max(0, targetMin - beforeCount)
  const createNow = Math.min(effectiveBatchSize, needToCreate)

  const backlog = await listBacklog(undefined, 500)
  const backlogPool = backlog.filter((x) => x.status === 'pending')
  const feedback = await listRecentUserFeedback(500)
  const previousScores = await getLatestPriorityScores(backlogPool.map((x) => x.id))
  const decisionPenaltyByKey = await getDecisionPenaltyMap(
    backlogPool.map((x) => ({ module: x.module, hypothesis: x.hypothesis }))
  )
  const decisionPriorityOverrides = decision.priorityOverrides || {}
  const mergedPriorityOverrides = {
    ...radarSignals.priorityOverrides,
    ...decisionPriorityOverrides,
  }
  const ranked = rankBacklogForExecution(backlogPool, {
    recentFeedback: feedback,
    radarBoostModules,
    radarPriorityOverrides: mergedPriorityOverrides,
    previousScores,
    decisionPenaltyByKey,
  })

  await recordPriorityScores(
    ranked.map((entry) => ({
      backlogId: entry.item.id,
      score: entry.dynamicPriorityScore,
      scoredAt: new Date().toISOString(),
    }))
  )

  const selectedRanked = ranked.slice(0, createNow)
  const selected = selectedRanked.map((x) => x.item)

  const created: LabExperiment[] = []
  for (const item of selected) {
    const exp = await createExperiment({
      id: makeExperimentId(),
      module: item.module,
      hypothesis: item.hypothesis,
      changes: item.suggestedChanges,
      status: 'draft',
      createdBy: auth.user?.username || 'auto-cycle',
    })
    created.push(exp)
    await updateBacklogItemStatus(item.id, 'promoted')
  }

  const processed: Array<{
    experimentId: string
    module: string
    recommendation: string
    status: string
  }> = []

  for (const exp of created) {
    const shadow = await runShadowScoring({ sampleLimit })

    await updateExperiment(exp.id, {
      status: 'tested',
      metrics: {
        coverageDelta: shadow.coverageDelta,
        stabilityDelta: shadow.stabilityDelta,
        anomaliesDelta: shadow.anomaliesDelta,
        riskSeparationDelta: shadow.riskSeparationDelta,
        snapshotDriftDelta: shadow.snapshotDriftDelta,
        bucketChurnDelta: shadow.bucketChurnDelta,
      },
      orchestratorReport: {
        shadow,
        mode: 'batch-cycle-shadow',
        updatedBy: auth.user?.username || 'auto-cycle',
      },
    })

    const hydrated = await getExperimentById(exp.id)
    if (!hydrated) continue

    await updateExperiment(exp.id, { status: 'running' })
    const orchestration = await runMinimalOrchestrator({
      experiment: hydrated,
      baseUrl,
    })

    const finalStatus =
      orchestration.recommendation === 'reject'
        ? 'rejected'
        : orchestration.recommendation === 'promote_for_review'
          ? 'review_required'
          : 'tested'

    await updateExperiment(exp.id, {
      status: finalStatus,
      metrics: orchestration.mergedMetrics,
      orchestratorReport: {
        steps: orchestration.steps,
        recommendation: orchestration.recommendation,
        humanReport: orchestration.humanReport,
        reviewedAt: new Date().toISOString(),
        reviewedBy: auth.user?.username || 'auto-cycle',
        mode: 'batch-cycle-orchestrated',
      },
    })

    processed.push({
      experimentId: exp.id,
      module: exp.module,
      recommendation: orchestration.recommendation,
      status: finalStatus,
    })

    await recordDecisionOutcome({
      module: exp.module,
      hypothesis: exp.hypothesis,
      finalStatus,
    })
  }

  const after = await listExperiments(300)
  return NextResponse.json({
    success: true,
    data: {
      targetMin,
      batchSize,
      effectiveBatchSize,
      beforeCount,
      afterCount: after.length,
      createdCount: created.length,
      processedCount: processed.length,
      remainingToTarget: Math.max(0, targetMin - after.length),
      strategy: 'priority-driven',
      radar: {
        boostModules: radarBoostModules,
        priorityOverrides: mergedPriorityOverrides,
        summary: radarSignals.summary,
        injectedHypotheses: radarSignals.priorityHypotheses.map((h) => ({
          module: h.module,
          hypothesis: h.hypothesis,
        })),
      },
      decision,
      topRanked: selectedRanked.map((r) => ({
        backlogId: r.item.id,
        module: r.item.module,
        dynamicPriorityScore: r.dynamicPriorityScore,
        impact: r.impact,
        confidence: r.confidence,
        urgency: r.urgency,
        costPenalty: r.costPenalty,
        momentum: r.momentum,
        radarOverrideBoost: r.radarOverrideBoost,
        reasons: r.reasons,
      })),
      processed,
    },
  })
}
