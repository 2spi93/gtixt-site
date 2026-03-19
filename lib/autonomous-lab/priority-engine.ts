import type {
  HypothesisBacklogItem,
  UserFeedbackSignal,
} from './hypothesis-generator'
import { decisionMemoryKey } from './decision-memory'

export interface PriorityEngineContext {
  recentFeedback: UserFeedbackSignal[]
  radarBoostModules?: string[]
  previousScores?: Record<string, number>
  radarPriorityOverrides?: Record<string, number>
  decisionPenaltyByKey?: Record<string, number>
}

export interface RankedBacklogItem {
  item: HypothesisBacklogItem
  impact: number
  confidence: number
  urgency: number
  costPenalty: number
  momentum: number
  radarOverrideBoost: number
  dynamicPriorityScore: number
  reasons: string[]
}

function clamp(value: number, min = 0, max = 10): number {
  return Math.max(min, Math.min(max, value))
}

function moduleFeedbackStats(module: string, feedback: UserFeedbackSignal[]) {
  const relevant = feedback.filter((f) => f.module === module)
  const suspicious = relevant.filter((f) => f.feedbackType === 'suspicious_firm')
  const negative = relevant.filter(
    (f) =>
      f.feedbackType === 'ranking_bad' ||
      f.feedbackType === 'firm_undervalued' ||
      f.feedbackType === 'firm_overvalued'
  )
  const positive = relevant.filter((f) => f.feedbackType === 'ranking_good')

  const sumWeight = (rows: UserFeedbackSignal[]) =>
    rows.reduce((acc, row) => acc + Number(row.weightedScore || row.weight || 0), 0)

  return {
    suspiciousWeight: sumWeight(suspicious),
    negativeWeight: sumWeight(negative),
    positiveWeight: sumWeight(positive),
    total: relevant.length,
  }
}

/**
 * Priority formula (Level 3 self-prioritizing):
 * impact * 0.4 + confidence * 0.3 + urgency * 0.2 - costPenalty * 0.1
 */
export function rankBacklogForExecution(
  items: HypothesisBacklogItem[],
  context: PriorityEngineContext
): RankedBacklogItem[] {
  const radarBoostSet = new Set((context.radarBoostModules || []).map((x) => x.toLowerCase()))
  const previousScores = context.previousScores || {}
  const decisionPenaltyByKey = context.decisionPenaltyByKey || {}
  const rawRadarOverrides = context.radarPriorityOverrides || {}
  const radarOverrides: Record<string, number> = Object.entries(rawRadarOverrides).reduce(
    (acc, [key, value]) => {
      acc[key.toLowerCase()] = Number(value || 0)
      return acc
    },
    {} as Record<string, number>
  )

  const ranked = items.map((item) => {
    const impact = clamp(Number(item.impactScore || 1))
    const confidence = clamp(Number(item.confidenceScore || 1))
    const costPenalty = clamp(Number(item.costScore || 1))

    const stats = moduleFeedbackStats(item.module, context.recentFeedback)
    const reasons: string[] = []

    // Urgency starts from backlog signal + explicit module pressure.
    const baseUrgency = clamp(
      Number((item.signalSummary?.feedbackWeight as number) || 0) * 0.8 +
        Number((item.signalSummary?.weaknessFrequency as number) || 0) * 4
    )

    let urgency = baseUrgency

    if (stats.suspiciousWeight > 0) {
      urgency += Math.min(3, stats.suspiciousWeight * 0.4)
      reasons.push('suspicious feedback pressure')
    }

    if (stats.negativeWeight > stats.positiveWeight) {
      urgency += Math.min(2, (stats.negativeWeight - stats.positiveWeight) * 0.25)
      reasons.push('negative user feedback dominates')
    }

    if (stats.positiveWeight > stats.negativeWeight) {
      urgency -= Math.min(1.5, (stats.positiveWeight - stats.negativeWeight) * 0.2)
      reasons.push('positive user feedback dampens urgency')
    }

    if (radarBoostSet.has(item.module.toLowerCase())) {
      urgency += 2.5
      reasons.push('radar boost')
    }

    const memoryPenalty = Number(
      decisionPenaltyByKey[decisionMemoryKey(item.module, item.hypothesis)] || 0
    )
    if (memoryPenalty > 0) {
      urgency -= Math.min(3, memoryPenalty)
      reasons.push(`decision memory penalty -${memoryPenalty.toFixed(2)}`)
    }

    const radarOverrideBoost = Number(radarOverrides[item.module.toLowerCase()] || 0)
    if (radarOverrideBoost > 0) {
      urgency += Math.min(4, radarOverrideBoost)
      reasons.push(`radar priority override +${radarOverrideBoost.toFixed(2)}`)
    }

    urgency = clamp(urgency)

    const previous = Number(previousScores[item.id] || 0)
    const rawDelta = previous > 0 ? urgency - previous : 0
    const momentum = Math.max(-2, Math.min(2, Number((rawDelta * 0.8).toFixed(4))))
    if (momentum > 0.25) reasons.push(`positive momentum +${momentum.toFixed(2)}`)
    if (momentum < -0.25) reasons.push(`negative momentum ${momentum.toFixed(2)}`)

    const dynamicPriorityScore = Number(
      (
        impact * 0.4 +
        confidence * 0.3 +
        urgency * 0.2 -
        costPenalty * 0.1 +
        momentum * 0.15 +
        radarOverrideBoost * 0.25
      ).toFixed(4)
    )

    return {
      item,
      impact,
      confidence,
      urgency,
      costPenalty,
      momentum,
      radarOverrideBoost,
      dynamicPriorityScore,
      reasons,
    }
  })

  ranked.sort((a, b) => {
    if (b.dynamicPriorityScore !== a.dynamicPriorityScore) {
      return b.dynamicPriorityScore - a.dynamicPriorityScore
    }
    return Number(b.item.priorityScore || 0) - Number(a.item.priorityScore || 0)
  })

  return ranked
}
