import { listAgentFeedback } from './agent-feedback'
import { listAgentMemory, upsertAgentMemory, type AgentMemoryEntry } from './agent-memory'
import { buildDiscoveryEnrichmentBanditPlan, getActivePolicyPayload } from './policy-governance'

export interface WeightedItem {
  key: string
  score: number
  weight: number
  successRate: number
  confidence: number
  recency: number
}

export interface AgentRuntimeTuning {
  discoveryQueries: WeightedItem[]
  enrichmentPatterns: WeightedItem[]
  crawlStrategies: Array<WeightedItem & { strategy: string }>
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number(value || 0)))
}

function normalizeWeights(items: Array<Omit<WeightedItem, 'weight'>>): WeightedItem[] {
  const total = items.reduce((sum, item) => sum + Math.max(0, item.score), 0)
  if (total <= 0) {
    const uniform = items.length > 0 ? 1 / items.length : 0
    return items.map((item) => ({ ...item, weight: Number(uniform.toFixed(6)) }))
  }
  return items.map((item) => ({
    ...item,
    weight: Number((Math.max(0, item.score) / total).toFixed(6)),
  }))
}

function recencyFromDate(isoDate: string): number {
  const t = new Date(isoDate).getTime()
  if (!Number.isFinite(t)) return 0
  const ageDays = Math.max(0, (Date.now() - t) / 86_400_000)
  return clamp01(Math.exp(-ageDays / 14))
}

// queryScore = successRate * confidence * recency
function computeQueryScore(successRate: number, confidence: number, recency: number): number {
  return Number((clamp01(successRate) * clamp01(confidence) * clamp01(recency)).toFixed(6))
}

export async function tuneDiscoveryQueries(agentName = 'discovery_agent', limit = 60): Promise<WeightedItem[]> {
  const feedback = await listAgentFeedback({ agentName, taskType: 'discovery_query', limit })

  const acc = new Map<string, { success: number; total: number; confidence: number; latest: string }>()
  for (const item of feedback) {
    const query = typeof item.metadata?.query === 'string' ? String(item.metadata.query).trim() : ''
    if (!query) continue
    const prev = acc.get(query) || { success: 0, total: 0, confidence: 0, latest: item.createdAt }
    prev.total += 1
    prev.success += item.success ? 1 : 0
    prev.confidence += Number(item.confidence || item.score || 0)
    if (new Date(item.createdAt).getTime() > new Date(prev.latest).getTime()) prev.latest = item.createdAt
    acc.set(query, prev)
  }

  const rawItems: Array<Omit<WeightedItem, 'weight'>> = []
  for (const [query, stats] of acc.entries()) {
    const successRate = stats.total > 0 ? stats.success / stats.total : 0
    const confidence = stats.total > 0 ? stats.confidence / stats.total : 0
    const recency = recencyFromDate(stats.latest)
    const score = computeQueryScore(successRate, confidence, recency)

    rawItems.push({
      key: query,
      score,
      successRate: Number(successRate.toFixed(6)),
      confidence: Number(confidence.toFixed(6)),
      recency: Number(recency.toFixed(6)),
    })

    await upsertAgentMemory({
      agentName,
      keyType: 'query_score',
      key: query,
      value: {
        totalRuns: stats.total,
        latestFeedbackAt: stats.latest,
      },
      score,
      successRate,
      confidence,
      recency,
      lastUsedAt: stats.latest,
    })
  }

  return normalizeWeights(rawItems).sort((a, b) => b.weight - a.weight)
}

export async function tuneEnrichmentPatterns(agentName = 'enrichment_agent', limit = 80): Promise<WeightedItem[]> {
  const memory = await listAgentMemory({ agentName, keyType: 'pattern_accuracy', limit })
  const rawItems: Array<Omit<WeightedItem, 'weight'>> = memory.map((entry) => ({
    key: entry.key,
    score: computeQueryScore(entry.successRate, entry.confidence, entry.recency),
    successRate: entry.successRate,
    confidence: entry.confidence,
    recency: entry.recency,
  }))

  return normalizeWeights(rawItems).sort((a, b) => b.weight - a.weight)
}

export async function tuneCrawlStrategies(agentName = 'crawl_agent', limit = 80): Promise<Array<WeightedItem & { strategy: string }>> {
  const memory = await listAgentMemory({ agentName, keyType: 'domain_strategy', limit })
  const raw = memory.map((entry) => {
    const strategy = typeof entry.value.strategy === 'string' ? String(entry.value.strategy) : 'fetch'
    return {
      key: entry.key,
      strategy,
      score: computeQueryScore(entry.successRate, entry.confidence, entry.recency),
      successRate: entry.successRate,
      confidence: entry.confidence,
      recency: entry.recency,
    }
  })

  const normalized = normalizeWeights(raw.map(({ strategy: _strategy, ...rest }) => rest))
  const byKey = new Map<string, AgentMemoryEntry>(memory.map((m) => [m.key, m]))

  return normalized
    .map((item) => ({
      ...item,
      strategy:
        typeof byKey.get(item.key)?.value?.strategy === 'string'
          ? String(byKey.get(item.key)?.value?.strategy)
          : 'fetch',
    }))
    .sort((a, b) => b.weight - a.weight)
}

export async function buildAgentRuntimeTuning(): Promise<AgentRuntimeTuning> {
  const [discoveryQueries, enrichmentPatterns, crawlStrategies] = await Promise.all([
    tuneDiscoveryQueries('discovery_agent', 120),
    tuneEnrichmentPatterns('enrichment_agent', 120),
    tuneCrawlStrategies('crawl_agent', 120),
  ])

  const [activeDiscovery, activeEnrichment, activeCrawl] = await Promise.all([
    getActivePolicyPayload('discovery_agent', 'discovery_query').catch(() => null),
    getActivePolicyPayload('enrichment_agent', 'enrichment_pattern').catch(() => null),
    getActivePolicyPayload('crawl_agent', 'crawl_strategy').catch(() => null),
  ])

  const policyDiscovery = Array.isArray(activeDiscovery?.discoveryQueries)
    ? (activeDiscovery?.discoveryQueries as WeightedItem[])
    : []
  const policyEnrichment = Array.isArray(activeEnrichment?.enrichmentPatterns)
    ? (activeEnrichment?.enrichmentPatterns as WeightedItem[])
    : []
  const policyCrawl = Array.isArray(activeCrawl?.crawlStrategies)
    ? (activeCrawl?.crawlStrategies as Array<WeightedItem & { strategy: string }>)
    : []

  return {
    discoveryQueries: (policyDiscovery.length > 0 ? policyDiscovery : discoveryQueries).slice(0, 25),
    enrichmentPatterns: (policyEnrichment.length > 0 ? policyEnrichment : enrichmentPatterns).slice(0, 25),
    crawlStrategies: (policyCrawl.length > 0 ? policyCrawl : crawlStrategies).slice(0, 50),
  }
}

export async function buildAgentRuntimeEnv(): Promise<Record<string, string>> {
  const tuning = await buildAgentRuntimeTuning()
  const [scoringPolicy, gatePolicy, auditorPolicy, banditPlan] = await Promise.all([
    getActivePolicyPayload('scoring_agent', 'score_validation').catch(() => null),
    getActivePolicyPayload('gate_agent_c', 'quality_gate').catch(() => null),
    getActivePolicyPayload('score_auditor', 'snapshot_audit').catch(() => null),
    buildDiscoveryEnrichmentBanditPlan().catch(() => null),
  ])

  const discoveryBandit = banditPlan?.discovery || []
  const enrichmentBandit = banditPlan?.enrichment || []

  return {
    ALS_DISCOVERY_QUERY_WEIGHTS: JSON.stringify(tuning.discoveryQueries),
    ALS_ENRICHMENT_PATTERN_SCORES: JSON.stringify(tuning.enrichmentPatterns),
    ALS_CRAWL_DOMAIN_STRATEGIES: JSON.stringify(tuning.crawlStrategies),
    ALS_MULTI_ARM_ENABLED: '1',
    ALS_DISCOVERY_COHORT_BANDIT: JSON.stringify(discoveryBandit),
    ALS_ENRICHMENT_COHORT_BANDIT: JSON.stringify(enrichmentBandit),
    ALS_SCORING_POLICY: JSON.stringify(scoringPolicy || {}),
    ALS_GATE_POLICY: JSON.stringify(gatePolicy || {}),
    ALS_SCORE_AUDITOR_POLICY: JSON.stringify(auditorPolicy || {}),
  }
}