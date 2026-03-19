'use client'

import { useEffect, useMemo, useState } from 'react'
import InfoTooltip from '@/components/ui/InfoTooltip'

type MetricRating = {
  key: string
  label: string
  value: number
  rating: string
  emoji: string
  interpretation: string
  advice: string
}

type Experiment = {
  id: string
  module: 'scoring' | 'webgl' | 'pipeline' | 'operator'
  hypothesis: string
  changes: string[]
  status: string
  metrics: Record<string, number | string>
  orchestratorReport?: {
    recommendation?: string
    humanReport?: {
      headline: string
      summary: string
      metrics: MetricRating[]
      steps: Array<{ name: string; humanLabel: string; status: string; explanation: string }>
      recommendation: { value: string; label: string; color: string; explanation: string; nextAction: string; warning?: string }
      decisionScoreExplanation?: string
    }
  }
  createdAt: string
}

type Threshold = {
  module: 'scoring' | 'webgl' | 'pipeline' | 'operator'
  minCoverageDelta: number
  minStabilityDelta: number
  minAnomaliesDelta: number
  minRiskSeparationDelta: number
  minSnapshotDriftDelta: number
  minBucketChurnDelta: number
  minPerfDelta: number
  minQualityDelta: number
  minDecisionScore: number
  updatedAt: string
}

type PromotionRequest = {
  id: string
  experimentId: string
  status: 'pending' | 'approved' | 'rejected'
  requestedBy?: string
  reviewedBy?: string
  reason?: string
  reviewNote?: string
  createdAt: string
  reviewedAt?: string
}

type HypothesisItem = {
  id: string
  module: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  hypothesis: string
  suggestedChanges: string[]
  rationale: string
  status: 'pending' | 'promoted' | 'dismissed'
  impactScore?: number
  confidenceScore?: number
  costScore?: number
  priorityScore?: number
}

type MetaSnapshot = {
  id: string
  computedAt: string
  totalApproved: number
  totalRejected: number
  approvalRate: number
  avgMetrics: Record<string, number>
  insights: string[]
  suggestedBiasAdjustment: number
  suggestedPenaltyAdjustment: number
  suggestedThresholdAdjustments: Record<string, Record<string, number>>
  learningRate?: number
  improvementOverTime?: number
  approvalTrend?: 'uptrend' | 'stable' | 'downtrend'
  crossModuleCorrelations?: Record<string, number | null>
  crossModuleInsights?: string[]
}

type ValidationResult =
  | { mode: 'ttest'; testName: string; sampleSizeA: number; sampleSizeB: number; meanA: number; meanB: number; tStatistic: number; pValue: number; cohenD: number; significant: boolean; effectSize: string; interpretation: string; recommendation: string }
  | { mode: 'drift'; driftDetected: boolean; maxDriftScore: number; driftThreshold: number; affectedMetrics: Array<{ key: string; zScore: number }>; interpretation: string }

type CanaryState = {
  id: string
  promotionId: string
  experimentId: string
  status: string
  trafficPct: number
  lastErrorRate: number
  maxErrorRate: number
  rolledBackAt: string | null
  rolledBackReason: string | null
  createdAt: string
}

type SupervisionSnapshot = {
  systemLoad: number
  threatLevel: number
  cycleType: 'exploration' | 'exploitation' | 'recovery'
  dynamicThreshold: number
  qualityStop: {
    active: boolean
    approvalRatePct: number
    decidedSamples: number
    minApprovalRatePct: number
    minSamples: number
    reason: string
  }
  telemetry?: {
    systemLoadComponents?: {
      cpuUsage: number
      apiLatency: number
      queueDepth: number
    }
    queueDepth?: number
    apiLatencyMs?: number
    cpuUsagePct?: number
    priorityPressure?: number
    topPriorityScore?: number
    recentSuccessRate?: number
  }
  runtimeControl?: {
    mode: 'auto' | 'fast' | 'safe'
    updatedAt: string
    updatedBy?: string
    auditTrail?: Array<{
      id: string
      action: string
      userId?: string | null
      details?: string | null
      createdAt: string
      success: boolean
    }>
  }
  decisionEngine?: {
    shouldRunCycle: boolean
    cycleIntensity: 'low' | 'normal' | 'burst'
    moduleFocus: string[]
    pacingMultiplier: number
    riskLevel: 'safe' | 'watch' | 'critical'
    reasoning: string[]
    confidence: number
    computedAt: string
    runtimeMode: string
  } | null
  measuredAt: string
  computeLatencyMs: number
}

type DecisionHistoryItem = {
  id: string
  source: string
  shouldRunCycle: boolean
  cycleIntensity: string
  riskLevel: string
  runtimeMode: string
  pacingMultiplier: number
  confidence: number
  moduleFocus: string[]
  reasoning: string[]
  computedAt: string
  createdAt: string
}

type DecisionIntegrationStatus = {
  source: string
  required: boolean
  isFresh: boolean
  seenRecently: boolean
  staleByMinutes: number | null
  maxStalenessMinutes: number
  lastSnapshotAt: string | null
}

export default function AutonomousLabPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [promotions, setPromotions] = useState<PromotionRequest[]>([])
  const [thresholds, setThresholds] = useState<Threshold[]>([])

  const [hypotheses, setHypotheses] = useState<HypothesisItem[]>([])
  const [metaSnapshot, setMetaSnapshot] = useState<MetaSnapshot | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [canaryStates, setCanaryStates] = useState<CanaryState[]>([])
  const [expandedExpId, setExpandedExpId] = useState<string | null>(null)
  const [validationBaseline, setValidationBaseline] = useState('45,52,38,61,44,55,48,50,42,58')
  const [validationCandidate, setValidationCandidate] = useState('50,57,43,65,49,60,53,55,47,62')
  const [metaLoading, setMetaLoading] = useState(false)
  const [hypLoading, setHypLoading] = useState(false)
  const [canaryLoading, setCanaryLoading] = useState(false)
  const [supervision, setSupervision] = useState<SupervisionSnapshot | null>(null)
  const [supervisionLoading, setSupervisionLoading] = useState(false)
  const [decisionHistory, setDecisionHistory] = useState<DecisionHistoryItem[]>([])
  const [decisionIntegration, setDecisionIntegration] = useState<DecisionIntegrationStatus[]>([])
  const [decisionHistoryLoading, setDecisionHistoryLoading] = useState(false)
  const [runtimeModePending, setRuntimeModePending] = useState<null | 'auto' | 'fast' | 'safe'>(null)

  const [moduleName, setModuleName] = useState<'scoring' | 'webgl' | 'pipeline' | 'operator'>('scoring')
  const [hypothesis, setHypothesis] = useState('Improve risk separation in shadow mode')
  const [changes, setChanges] = useState('risk_weight_v2,na_penalty_tuning')

  const selected = useMemo(() => experiments[0] || null, [experiments])
  const recommendationCounts = useMemo(() => {
    const counts = { safe: 0, review: 0, reject: 0 }
    for (const exp of experiments) {
      const rec = exp.orchestratorReport?.recommendation
      if (rec === 'promote_for_review') counts.safe++
      else if (rec === 'reject') counts.reject++
      else if (rec) counts.review++
    }
    return counts
  }, [experiments])

  const metaKpis = useMemo(() => {
    if (!metaSnapshot) return null
    const approvalRate = Number(metaSnapshot.approvalRate || 0)
    const decisionScore = Number(metaSnapshot.avgMetrics?.decisionScore || 0)
    const stability = Number(metaSnapshot.avgMetrics?.stabilityDelta || 0)
    const learningRate =
      typeof metaSnapshot.learningRate === 'number'
        ? metaSnapshot.learningRate
        : Math.max(0, Math.min(100, Number(((approvalRate * 0.6) + (decisionScore * 0.4)).toFixed(1))))
    const improvementOverTime =
      typeof metaSnapshot.improvementOverTime === 'number'
        ? metaSnapshot.improvementOverTime
        : Number(((decisionScore - 50) + (stability * 10)).toFixed(2))
    const approvalTrend =
      metaSnapshot.approvalTrend ||
      (approvalRate >= 70 ? 'uptrend'
        : approvalRate >= 45 ? 'stable'
          : 'downtrend')
    return { learningRate, improvementOverTime, approvalTrend }
  }, [metaSnapshot])

  const moduleOptions: Array<'scoring' | 'webgl' | 'pipeline' | 'operator'> = ['scoring', 'webgl', 'pipeline', 'operator']

  function recommendationBadge(rec?: string) {
    if (rec === 'promote_for_review') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">🟢 Safe to promote</span>
    }
    if (rec === 'reject') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">🔴 Reject</span>
    }
    if (rec) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">🟡 Needs review</span>
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">N/A</span>
  }

  function supervisionTone(value: number, warnAt: number, dangerAt: number) {
    if (value >= dangerAt) return 'bg-red-100 text-red-700 border-red-200'
    if (value >= warnAt) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-green-100 text-green-700 border-green-200'
  }

  function cycleTypeBadge(type?: string) {
    if (type === 'recovery') {
      return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 border-red-200">Recovery</span>
    }
    if (type === 'exploitation') {
      return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 border-blue-200">Exploitation</span>
    }
    return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 border-slate-200">Exploration</span>
  }

  function runtimeModeBadge(mode?: string) {
    if (mode === 'fast') {
      return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 border-blue-200">Fast mode</span>
    }
    if (mode === 'safe') {
      return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 border-emerald-200">Safe mode</span>
    }
    return <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 border-slate-200">Auto mode</span>
  }

  function parseRuntimeAuditDetails(details?: string | null) {
    if (!details) return null
    try {
      return JSON.parse(details) as {
        control?: string
        changed?: boolean
        fromMode?: string
        toMode?: string
      }
    } catch {
      return null
    }
  }

  function formatDecisionSource(source: string): string {
    const labels: Record<string, string> = {
      cycle_gate: 'Cycle gate',
      supervision: 'Supervision',
      decision_api: 'Decision API',
      copilot_action: 'Copilot action',
      copilot_context: 'Copilot context',
      simulate_baseline: 'Simulation baseline',
      simulate_scenario: 'Simulation scenario',
    }
    return labels[source] || source
  }

  async function loadExperiments() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/autonomous-lab/experiments?limit=50', { cache: 'no-store' })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || 'Failed to load experiments')
      setExperiments(Array.isArray(payload?.data) ? payload.data : [])

      const promotionsRes = await fetch('/api/admin/autonomous-lab/promotions?limit=50', { cache: 'no-store' })
      const promotionsPayload = await promotionsRes.json()
      if (promotionsRes.ok) {
        setPromotions(Array.isArray(promotionsPayload?.data) ? promotionsPayload.data : [])
      }

      const thresholdsRes = await fetch('/api/admin/autonomous-lab/thresholds', { cache: 'no-store' })
      const thresholdsPayload = await thresholdsRes.json()
      if (thresholdsRes.ok) {
        setThresholds(Array.isArray(thresholdsPayload?.data) ? thresholdsPayload.data : [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load experiments')
    } finally {
      setLoading(false)
    }
  }

  async function requestPromotion(experimentId: string) {
    setError(null)
    const res = await fetch('/api/admin/autonomous-lab/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experimentId, reason: 'Shadow and orchestrator results look acceptable' }),
    })
    const payload = await res.json()
    if (!res.ok) {
      setError(payload?.error || 'Failed to request promotion')
      return
    }
    await loadExperiments()
  }

  async function reviewPromotion(id: string, decision: 'approve' | 'reject') {
    setError(null)
    const res = await fetch(`/api/admin/autonomous-lab/promotions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, note: `Decision from admin UI: ${decision}` }),
    })
    const payload = await res.json()
    if (!res.ok) {
      setError(payload?.error || 'Failed to review promotion')
      return
    }
    await loadExperiments()
  }

  useEffect(() => {
    void loadExperiments()
  }, [])

  async function loadSupervision(showSpinner = false) {
    if (showSpinner) setSupervisionLoading(true)
    try {
      const res = await fetch('/api/admin/autonomous-lab/supervision', { cache: 'no-store' })
      const payload = await res.json()
      if (res.ok) {
        setSupervision(payload?.data ?? null)
      }
    } finally {
      if (showSpinner) setSupervisionLoading(false)
    }
  }

  async function loadDecisionHistory(showSpinner = false) {
    if (showSpinner) setDecisionHistoryLoading(true)
    try {
      const res = await fetch('/api/admin/autonomous-lab/decision-history?limit=25&lookbackHours=24', { cache: 'no-store' })
      const payload = await res.json()
      if (res.ok) {
        const snapshots = Array.isArray(payload?.data?.snapshots) ? payload.data.snapshots : []
        const integration = Array.isArray(payload?.data?.integration?.statuses)
          ? payload.data.integration.statuses
          : []
        setDecisionHistory(snapshots)
        setDecisionIntegration(integration)
      }
    } finally {
      if (showSpinner) setDecisionHistoryLoading(false)
    }
  }

  async function updateRuntimeMode(mode: 'auto' | 'fast' | 'safe') {
    setError(null)
    setRuntimeModePending(mode)
    try {
      const res = await fetch('/api/admin/autonomous-lab/runtime-control', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      const payload = await res.json()
      if (!res.ok) {
        setError(payload?.error || 'Failed to update runtime mode')
        return
      }
      await loadSupervision(true)
    } finally {
      setRuntimeModePending(null)
    }
  }

  const activeRuntimeMode = runtimeModePending || supervision?.runtimeControl?.mode || 'auto'

  useEffect(() => {
    void loadSupervision(true)
    const interval = window.setInterval(() => {
      void loadSupervision(false)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    void loadDecisionHistory(true)
    const interval = window.setInterval(() => {
      void loadDecisionHistory(false)
    }, 15000)

    return () => window.clearInterval(interval)
  }, [])

  async function createExperiment() {
    setError(null)
    const body = {
      module: moduleName,
      hypothesis,
      changes: changes.split(',').map((x) => x.trim()).filter(Boolean),
    }

    const res = await fetch('/api/admin/autonomous-lab/experiments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = await res.json()
    if (!res.ok) {
      setError(payload?.error || 'Failed to create experiment')
      return
    }
    await loadExperiments()
  }

  async function runShadow(experimentId: string) {
    setError(null)
    const res = await fetch('/api/admin/autonomous-lab/shadow-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experimentId, sampleLimit: 800 }),
    })
    const payload = await res.json()
    if (!res.ok) {
      setError(payload?.error || 'Shadow scoring failed')
      return
    }
    await loadExperiments()
  }

  async function runOrchestrator(experimentId: string) {
    setError(null)
    const res = await fetch('/api/admin/autonomous-lab/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experimentId }),
    })
    const payload = await res.json()
    if (!res.ok) {
      setError(payload?.error || 'Orchestration failed')
      return
    }
    await loadExperiments()
  }

  async function runOperator(actionType: 'redis_health' | 'warm_cache' | 'snapshot_cache_invalidate') {
    setError(null)
    const res = await fetch('/api/admin/autonomous-lab/operator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: actionType }),
    })
    const payload = await res.json()
    if (!res.ok || !payload?.success) {
      setError(payload?.error || 'Operator action failed')
      return
    }
    await loadExperiments()
  }

  async function runWebglOptimizer() {
    setError(null)
    const res = await fetch('/api/admin/autonomous-lab/webgl-optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const payload = await res.json()
    if (!res.ok) {
      setError(payload?.error || 'WebGL optimizer failed')
      return
    }
    alert(`WebGL summary: ${JSON.stringify(payload.data.summary)}`)
  }

  async function updateThreshold(moduleNameToUpdate: Threshold['module'], patch: Partial<Threshold>) {
    setError(null)
    const res = await fetch('/api/admin/autonomous-lab/thresholds', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module: moduleNameToUpdate, ...patch }),
    })
    const payload = await res.json()
    if (!res.ok) {
      setError(payload?.error || 'Failed to update threshold')
      return
    }
    await loadExperiments()
  }

  function updateThresholdLocally(moduleNameToUpdate: Threshold['module'], key: keyof Threshold, value: number) {
    setThresholds((prev) => prev.map((t) => (t.module === moduleNameToUpdate ? { ...t, [key]: value } : t)))
  }

  function exportAudit(type: 'all' | 'registry' | 'promotions', format: 'json' | 'csv') {
    const url = `/api/admin/autonomous-lab/export?type=${type}&format=${format}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function loadHypotheses() {
    setHypLoading(true)
    try {
      const res = await fetch('/api/admin/autonomous-lab/hypotheses?limit=30', { cache: 'no-store' })
      const d = await res.json()
      if (res.ok) setHypotheses(Array.isArray(d?.data) ? d.data : [])
    } finally { setHypLoading(false) }
  }

  async function generateHypotheses() {
    setHypLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/autonomous-lab/hypotheses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
      })
      const d = await res.json()
      if (!res.ok) { setError(d?.error || 'Generate failed'); return }
      await loadHypotheses()
    } finally { setHypLoading(false) }
  }

  async function updateHypStatus(id: string, status: 'promoted' | 'dismissed') {
    const res = await fetch(`/api/admin/autonomous-lab/hypotheses/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    })
    if (res.ok) setHypotheses((prev) => prev.filter((h) => h.id !== id))
  }

  async function loadMeta() {
    setMetaLoading(true)
    try {
      const res = await fetch('/api/admin/autonomous-lab/meta', { cache: 'no-store' })
      const d = await res.json()
      if (res.ok) setMetaSnapshot(d?.data ?? null)
    } finally { setMetaLoading(false) }
  }

  async function runMeta() {
    setMetaLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/autonomous-lab/meta', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
      })
      const d = await res.json()
      if (!res.ok) { setError(d?.error || 'Meta failed'); return }
      setMetaSnapshot(d?.data ?? null)
    } finally { setMetaLoading(false) }
  }

  async function runValidation() {
    setError(null)
    const baseline = validationBaseline.split(',').map((x) => parseFloat(x.trim())).filter((n) => !isNaN(n))
    const candidate = validationCandidate.split(',').map((x) => parseFloat(x.trim())).filter((n) => !isNaN(n))
    if (baseline.length < 2 || candidate.length < 2) {
      setError('Au moins 2 valeurs par groupe (séparées par des virgules)')
      return
    }
    const res = await fetch('/api/admin/autonomous-lab/validate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'ttest', baseline, candidate }),
    })
    const d = await res.json()
    if (!res.ok) { setError(d?.error || 'Validation failed'); return }
    setValidationResult(d?.data ? { mode: 'ttest', ...d.data } : null)
  }

  async function loadCanaries() {
    setCanaryLoading(true)
    try {
      const res = await fetch('/api/admin/autonomous-lab/canary?limit=20', { cache: 'no-store' })
      const d = await res.json()
      if (res.ok) setCanaryStates(Array.isArray(d?.data) ? d.data : [])
    } finally { setCanaryLoading(false) }
  }

  async function doCanaryAction(id: string, action: 'advance' | 'rollback') {
    setError(null)
    const body = action === 'rollback'
      ? { action: 'rollback', reason: 'Rollback manuel via admin UI' }
      : { action: 'advance', currentErrorRate: 0 }
    const res = await fetch(`/api/admin/autonomous-lab/canary/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const d = await res.json()
    if (!res.ok) { setError(d?.error || 'Canary action failed'); return }
    await loadCanaries()
  }

  async function createCanaryForPromotion(promotionId: string, experimentId: string) {
    setError(null)
    const res = await fetch('/api/admin/autonomous-lab/canary', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promotionId, experimentId }),
    })
    const d = await res.json()
    if (!res.ok) { setError(d?.error || 'Create canary failed'); return }
    await loadCanaries()
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          Autonomous Lab
          <InfoTooltip
            content="Controlled experimentation area where candidate scoring policies run in shadow mode before any promotion."
            example="No direct production auto-deploy: human review remains mandatory."
            label="Autonomous Lab explanation"
          />
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Production remains stable. All scoring improvements run in shadow mode with controlled promotion.
        </p>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-5 grid gap-4 md:grid-cols-4">
        <select className="border rounded px-3 py-2" value={moduleName} onChange={(e) => setModuleName(e.target.value as 'scoring' | 'webgl' | 'pipeline' | 'operator')}>
          {moduleOptions.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input className="border rounded px-3 py-2 md:col-span-2" value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} placeholder="Hypothesis" />
        <button onClick={createExperiment} className="bg-slate-900 text-white rounded px-4 py-2">Create Experiment</button>
        <input className="border rounded px-3 py-2 md:col-span-4" value={changes} onChange={(e) => setChanges(e.target.value)} placeholder="comma-separated changes" />
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => runOperator('redis_health')} className="px-3 py-1.5 rounded border border-slate-300">Operator: Redis Health</button>
          <button onClick={() => runOperator('warm_cache')} className="px-3 py-1.5 rounded border border-slate-300">Operator: Warm Cache</button>
          <button onClick={() => runOperator('snapshot_cache_invalidate')} className="px-3 py-1.5 rounded border border-slate-300">Operator: Invalidate Snapshot Cache</button>
          <button onClick={runWebglOptimizer} className="px-3 py-1.5 rounded border border-slate-300">Run WebGL Optimizer</button>
          <button onClick={() => exportAudit('all', 'json')} className="px-3 py-1.5 rounded border border-slate-300">Export All JSON</button>
          <button onClick={() => exportAudit('all', 'csv')} className="px-3 py-1.5 rounded border border-slate-300">Export All CSV</button>
          <button onClick={() => exportAudit('registry', 'csv')} className="px-3 py-1.5 rounded border border-slate-300">Export Registry CSV</button>
          <button onClick={() => exportAudit('promotions', 'csv')} className="px-3 py-1.5 rounded border border-slate-300">Export Promotions CSV</button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading && <p className="text-sm text-slate-600">Loading experiments...</p>}

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="border rounded-lg px-3 py-2 bg-green-50 border-green-200">
            <p className="text-xs text-green-700 font-semibold">🟢 Safe to promote</p>
            <p className="text-2xl font-bold text-green-700">{recommendationCounts.safe}</p>
          </div>
          <div className="border rounded-lg px-3 py-2 bg-yellow-50 border-yellow-200">
            <p className="text-xs text-yellow-700 font-semibold">🟡 Needs review</p>
            <p className="text-2xl font-bold text-yellow-700">{recommendationCounts.review}</p>
          </div>
          <div className="border rounded-lg px-3 py-2 bg-red-50 border-red-200">
            <p className="text-xs text-red-700 font-semibold">🔴 Reject</p>
            <p className="text-2xl font-bold text-red-700">{recommendationCounts.reject}</p>
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Supervision Live
              <InfoTooltip
                content="Live scheduler telemetry showing runtime mode, risk posture, and execution readiness."
                label="Supervision live explanation"
              />
            </h2>
            <p className="text-xs text-slate-500 mt-1">Refresh auto toutes les 5 secondes pour pilotage direct du scheduler.</p>
          </div>
          <div className="flex items-center gap-2">
            {runtimeModeBadge(activeRuntimeMode)}
            <button onClick={() => loadSupervision(true)} disabled={runtimeModePending !== null} className="px-3 py-1.5 rounded border border-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {supervisionLoading ? 'Chargement...' : 'Refresh'}
            </button>
          </div>
        </div>

        {!supervision ? (
          <p className="text-sm text-slate-500">Aucune donnée de supervision chargée.</p>
        ) : (
          <div className="space-y-4">
            <div className={`rounded-xl border p-4 transition-all ${runtimeModePending ? 'border-amber-300 bg-amber-50 shadow-[0_0_0_4px_rgba(251,191,36,0.18)]' : activeRuntimeMode === 'fast' ? 'border-blue-300 bg-blue-50 shadow-[0_0_0_4px_rgba(59,130,246,0.14)]' : activeRuntimeMode === 'safe' ? 'border-emerald-300 bg-emerald-50 shadow-[0_0_0_4px_rgba(16,185,129,0.14)]' : 'border-slate-300 bg-slate-50 shadow-[0_0_0_4px_rgba(100,116,139,0.10)]'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Mode runtime actif</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-flex h-3 w-3 rounded-full ${runtimeModePending ? 'animate-pulse bg-amber-500' : activeRuntimeMode === 'fast' ? 'bg-blue-500' : activeRuntimeMode === 'safe' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                    <span className="text-lg font-semibold text-slate-900">
                      {activeRuntimeMode === 'fast' ? 'Fast mode' : activeRuntimeMode === 'safe' ? 'Safe mode' : 'Auto mode'}
                    </span>
                    {runtimeModePending ? <span className="text-xs font-semibold text-amber-700">PATCH en cours, commandes verrouillées</span> : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {runtimeModePending
                      ? 'Le scheduler bascule de profil. Les contrôles restent gelés jusqu’à confirmation serveur.'
                      : `Dernière mise à jour par ${supervision.runtimeControl?.updatedBy || 'system'} à ${supervision.runtimeControl?.updatedAt ? new Date(supervision.runtimeControl.updatedAt).toLocaleTimeString() : 'n/a'}`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => updateRuntimeMode('fast')}
                    disabled={runtimeModePending !== null || activeRuntimeMode === 'fast'}
                    className={`px-3 py-1.5 rounded border text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${activeRuntimeMode === 'fast' ? 'border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-200' : 'border-slate-300 text-slate-700 hover:border-blue-300 hover:bg-blue-50'}`}
                  >
                    Fast mode
                  </button>
                  <button
                    onClick={() => updateRuntimeMode('safe')}
                    disabled={runtimeModePending !== null || activeRuntimeMode === 'safe'}
                    className={`px-3 py-1.5 rounded border text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${activeRuntimeMode === 'safe' ? 'border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'border-slate-300 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'}`}
                  >
                    Safe mode
                  </button>
                  <button
                    onClick={() => updateRuntimeMode('auto')}
                    disabled={runtimeModePending !== null || activeRuntimeMode === 'auto'}
                    className={`px-3 py-1.5 rounded border text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${activeRuntimeMode === 'auto' ? 'border-slate-700 bg-slate-800 text-white shadow-lg shadow-slate-200' : 'border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-100'}`}
                  >
                    Auto mode
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="px-2.5 py-1 rounded-full border border-slate-200 bg-white text-[11px] font-semibold text-slate-600"
              >
                Profil scheduler synchronisé
              </button>
              <span className="text-xs text-slate-500">
                Dernière mise à jour: {supervision.runtimeControl?.updatedAt ? new Date(supervision.runtimeControl.updatedAt).toLocaleTimeString() : 'n/a'}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-5">
              <div className="rounded-lg border p-3 bg-slate-50 border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-2">System Load</p>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${supervisionTone(supervision.systemLoad, 0.55, 0.8)}`}>
                  {(supervision.systemLoad * 100).toFixed(1)}%
                </span>
              </div>

              <div className="rounded-lg border p-3 bg-slate-50 border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-2">Threat Level</p>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${supervisionTone(supervision.threatLevel, 0.45, 0.7)}`}>
                  {(supervision.threatLevel * 100).toFixed(1)}%
                </span>
              </div>

              <div className="rounded-lg border p-3 bg-slate-50 border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-2">Cycle Type</p>
                {cycleTypeBadge(supervision.cycleType)}
              </div>

              <div className="rounded-lg border p-3 bg-slate-50 border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-2">Dynamic Threshold</p>
                <span className="inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700 border-indigo-200">
                  {supervision.dynamicThreshold.toFixed(2)}
                </span>
              </div>

              <div className="rounded-lg border p-3 bg-slate-50 border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-2">Quality Stop</p>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${supervision.qualityStop.active ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                  {supervision.qualityStop.active ? 'ACTIF' : 'OK'}
                </span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Infra</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">CPU usage</p>
                    <p className="font-semibold text-slate-800">{Number(supervision.telemetry?.cpuUsagePct || 0).toFixed(0)}%</p>
                  </div>
                  <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">API latency</p>
                    <p className="font-semibold text-slate-800">{Number(supervision.telemetry?.apiLatencyMs || 0).toFixed(0)} ms</p>
                  </div>
                  <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">Queue depth</p>
                    <p className="font-semibold text-slate-800">{Number(supervision.telemetry?.queueDepth || 0)}</p>
                  </div>
                  <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">Compute latency</p>
                    <p className="font-semibold text-slate-800">{Number(supervision.computeLatencyMs || 0).toFixed(0)} ms</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Pilotage</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">Priority pressure</p>
                    <p className="font-semibold text-slate-800">{(Number(supervision.telemetry?.priorityPressure || 0) * 100).toFixed(1)}%</p>
                  </div>
                  <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">Top priority score</p>
                    <p className="font-semibold text-slate-800">{Number(supervision.telemetry?.topPriorityScore || 0).toFixed(2)}</p>
                  </div>
                  <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">Approval rate</p>
                    <p className="font-semibold text-slate-800">{supervision.qualityStop.approvalRatePct.toFixed(1)}%</p>
                  </div>
                  <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-slate-500">Samples</p>
                    <p className="font-semibold text-slate-800">{supervision.qualityStop.decidedSamples}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Decision Engine live</h3>
                {!supervision.decisionEngine ? (
                  <p className="text-xs text-slate-500">État décisionnel indisponible.</p>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Run cycle</p>
                      <p className="font-semibold text-slate-800">{supervision.decisionEngine.shouldRunCycle ? 'YES' : 'NO'}</p>
                    </div>
                    <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Risk / intensity</p>
                      <p className="font-semibold text-slate-800">{supervision.decisionEngine.riskLevel} / {supervision.decisionEngine.cycleIntensity}</p>
                    </div>
                    <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Focus modules</p>
                      <p className="font-semibold text-slate-800">{(supervision.decisionEngine.moduleFocus || []).join(', ') || 'none'}</p>
                    </div>
                    <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-slate-500">Runtime / confidence</p>
                      <p className="font-semibold text-slate-800">{supervision.decisionEngine.runtimeMode} / {(Number(supervision.decisionEngine.confidence || 0) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={`rounded-lg border px-4 py-3 text-xs ${supervision.qualityStop.active ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <p className="font-semibold mb-1">État qualité</p>
              <p>{supervision.qualityStop.reason}</p>
              <p className="mt-1 text-[11px] opacity-80">Mesuré à {new Date(supervision.measuredAt).toLocaleTimeString()}</p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-sm font-semibold text-slate-800">Audit des changements de mode</h3>
                <span className="text-[11px] text-slate-500">Traçabilité explicite du pilotage admin</span>
              </div>

              {!supervision.runtimeControl?.auditTrail?.length ? (
                <p className="text-xs text-slate-500">Aucun changement de mode consigné pour le moment.</p>
              ) : (
                <div className="space-y-2">
                  {supervision.runtimeControl.auditTrail.map((entry) => {
                    const details = parseRuntimeAuditDetails(entry.details)
                    return (
                      <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-700">
                          <span className={`inline-flex h-2.5 w-2.5 rounded-full ${entry.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <span className="font-semibold">{details?.fromMode || 'unknown'} → {details?.toMode || 'unknown'}</span>
                          <span className="text-slate-500">par {entry.userId || 'system'}</span>
                          {details?.changed === false ? <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">sans changement effectif</span> : null}
                        </div>
                        <span className="text-slate-500">{new Date(entry.createdAt).toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Decision History & Branch Coverage
              <InfoTooltip
                content="Traceability panel for decision snapshots and freshness of required intelligence sources."
                label="Decision history explanation"
              />
            </h2>
            <p className="text-xs text-slate-500 mt-1">Vérifie en continu les sources branchées au Decision Intelligence System.</p>
          </div>
          <button
            onClick={() => loadDecisionHistory(true)}
            className="px-3 py-1.5 rounded border border-slate-300 text-sm"
          >
            {decisionHistoryLoading ? 'Chargement...' : 'Refresh history'}
          </button>
        </div>

        <div className="grid gap-2 md:grid-cols-3 mb-4">
          {decisionIntegration.map((item) => (
            <div
              key={item.source}
              className={`rounded-lg border px-3 py-2 text-xs ${item.isFresh ? 'bg-green-50 border-green-200' : item.required ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}
            >
              <p className="font-semibold text-slate-800">{formatDecisionSource(item.source)}</p>
              <p className="text-slate-600 mt-1">
                {item.isFresh
                  ? 'Connected and fresh'
                  : item.seenRecently
                    ? `Stale (${item.staleByMinutes}m)`
                    : 'No snapshot in lookback window'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {item.required ? 'required' : 'optional'} • SLA {item.maxStalenessMinutes}m
              </p>
            </div>
          ))}
        </div>

        {decisionHistory.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun snapshot décisionnel enregistré.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4">Run</th>
                  <th className="py-2 pr-4">Risk</th>
                  <th className="py-2 pr-4">Intensity</th>
                  <th className="py-2 pr-4">Modules</th>
                  <th className="py-2 pr-4">Confidence</th>
                  <th className="py-2 pr-4">At</th>
                </tr>
              </thead>
              <tbody>
                {decisionHistory.map((snap) => (
                  <tr key={snap.id} className="border-b align-top">
                    <td className="py-2 pr-4 font-semibold">{formatDecisionSource(snap.source)}</td>
                    <td className="py-2 pr-4">{snap.shouldRunCycle ? 'YES' : 'NO'}</td>
                    <td className="py-2 pr-4">{snap.riskLevel}</td>
                    <td className="py-2 pr-4">{snap.cycleIntensity}</td>
                    <td className="py-2 pr-4">{(snap.moduleFocus || []).join(', ') || 'none'}</td>
                    <td className="py-2 pr-4">{(Number(snap.confidence || 0) * 100).toFixed(1)}%</td>
                    <td className="py-2 pr-4">{new Date(snap.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Promotion Thresholds By Module</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {thresholds.map((t) => (
            <div key={t.module} className="border border-slate-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{t.module}</h3>
                <button onClick={() => updateThreshold(t.module, t)} className="px-2 py-1 rounded border border-slate-300 text-xs">Save</button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex flex-col gap-1">coverage
                  <input type="number" step="0.1" className="border rounded px-2 py-1" value={t.minCoverageDelta} onChange={(e) => updateThresholdLocally(t.module, 'minCoverageDelta', Number(e.target.value))} />
                </label>
                <label className="flex flex-col gap-1">stability
                  <input type="number" step="0.1" className="border rounded px-2 py-1" value={t.minStabilityDelta} onChange={(e) => updateThresholdLocally(t.module, 'minStabilityDelta', Number(e.target.value))} />
                </label>
                <label className="flex flex-col gap-1">anomalies
                  <input type="number" step="0.1" className="border rounded px-2 py-1" value={t.minAnomaliesDelta} onChange={(e) => updateThresholdLocally(t.module, 'minAnomaliesDelta', Number(e.target.value))} />
                </label>
                <label className="flex flex-col gap-1">risk separation
                  <input type="number" step="0.1" className="border rounded px-2 py-1" value={t.minRiskSeparationDelta} onChange={(e) => updateThresholdLocally(t.module, 'minRiskSeparationDelta', Number(e.target.value))} />
                </label>
                <label className="flex flex-col gap-1">snapshot drift
                  <input type="number" step="0.1" className="border rounded px-2 py-1" value={t.minSnapshotDriftDelta} onChange={(e) => updateThresholdLocally(t.module, 'minSnapshotDriftDelta', Number(e.target.value))} />
                </label>
                <label className="flex flex-col gap-1">bucket churn
                  <input type="number" step="0.1" className="border rounded px-2 py-1" value={t.minBucketChurnDelta} onChange={(e) => updateThresholdLocally(t.module, 'minBucketChurnDelta', Number(e.target.value))} />
                </label>
                <label className="flex flex-col gap-1">perf
                  <input type="number" step="0.1" className="border rounded px-2 py-1" value={t.minPerfDelta} onChange={(e) => updateThresholdLocally(t.module, 'minPerfDelta', Number(e.target.value))} />
                </label>
                <label className="flex flex-col gap-1">quality
                  <input type="number" step="0.1" className="border rounded px-2 py-1" value={t.minQualityDelta} onChange={(e) => updateThresholdLocally(t.module, 'minQualityDelta', Number(e.target.value))} />
                </label>
                <label className="flex flex-col gap-1 col-span-2">decision score
                  <input type="number" step="0.1" className="border rounded px-2 py-1" value={t.minDecisionScore} onChange={(e) => updateThresholdLocally(t.module, 'minDecisionScore', Number(e.target.value))} />
                </label>
              </div>
              <p className="text-[11px] text-slate-500">Updated: {new Date(t.updatedAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="text-xs text-slate-500 mb-4">
          Metric guide: coverageDelta (candidate coverage gain), stabilityDelta (lower dispersion than baseline),
          anomaliesDelta (invalid score reduction), riskSeparationDelta (better bucket separation),
          snapshotDriftDelta (lower inter-snapshot drift), bucketChurnDelta (lower bucket instability),
          perfDelta/qualityDelta (WebGL telemetry quality).
        </div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            Experiment Registry
            <InfoTooltip
              content="Catalog of active and historical experiments, with status, metrics, and promotion controls."
              label="Experiment registry explanation"
            />
          </h2>
          <button onClick={loadExperiments} className="px-3 py-1.5 rounded border border-slate-300">Refresh</button>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Module</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Decision</th>
                <th className="py-2 pr-4">Decision Score</th>
                <th className="py-2 pr-4">Hypothesis</th>
                <th className="py-2 pr-4">Metrics</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {experiments.map((exp) => (
                <tr key={exp.id} className="border-b align-top">
                  <td className="py-2 pr-4 font-mono">{exp.id}</td>
                  <td className="py-2 pr-4">{exp.module}</td>
                  <td className="py-2 pr-4">{exp.status}</td>
                  <td className="py-2 pr-4">{recommendationBadge(exp.orchestratorReport?.recommendation)}</td>
                  <td className="py-2 pr-4 font-semibold">{String(exp.metrics?.decisionScore ?? '-')}</td>
                  <td className="py-2 pr-4 max-w-md">{exp.hypothesis}</td>
                  <td className="py-2 pr-4">
                    <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(exp.metrics || {}, null, 2)}</pre>
                  </td>
                  <td className="py-2 pr-4 space-y-1">
                    <button onClick={() => runShadow(exp.id)} className="block px-2 py-1 rounded border border-slate-300">Run Shadow</button>
                    <button onClick={() => runOrchestrator(exp.id)} className="block px-2 py-1 rounded border border-slate-300">Run Orchestrator</button>
                    <button onClick={() => requestPromotion(exp.id)} className="block px-2 py-1 rounded border border-slate-300">Request Promotion</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-xl font-semibold mb-3">Promotion Guard</h2>
          <p className="text-sm text-slate-700">
            Recommendation: {recommendationBadge(selected.orchestratorReport?.recommendation)}.
            No automatic production deployment is enabled. Human promotion remains mandatory.
          </p>
        </section>
      )}

      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            Promotion Queue
            <InfoTooltip
              content="Human approval workflow before candidate policies can be canary-tested or deployed."
              label="Promotion queue explanation"
            />
          </h2>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Promotion ID</th>
                <th className="py-2 pr-4">Experiment</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Requested By</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((p) => (
                <tr key={p.id} className="border-b align-top">
                  <td className="py-2 pr-4 font-mono">{p.id}</td>
                  <td className="py-2 pr-4 font-mono">{p.experimentId}</td>
                  <td className="py-2 pr-4">{p.status}</td>
                  <td className="py-2 pr-4">{p.requestedBy || 'unknown'}</td>
                  <td className="py-2 pr-4 space-y-1">
                    {p.status === 'pending' ? (
                      <>
                        <button onClick={() => reviewPromotion(p.id, 'approve')} className="block px-2 py-1 rounded border border-green-300 text-green-700">Approve</button>
                        <button onClick={() => reviewPromotion(p.id, 'reject')} className="block px-2 py-1 rounded border border-red-300 text-red-700">Reject</button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-slate-500">Reviewed by {p.reviewedBy || 'n/a'}</span>
                        {p.status === 'approved' && (
                          <button onClick={() => createCanaryForPromotion(p.id, p.experimentId)} className="block px-2 py-1 rounded border border-blue-300 text-blue-700 text-xs">Start Canary</button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Human Report ─────────────────────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Rapport explicatif (novice-friendly)</h2>
          <p className="text-xs text-slate-500">Cliquer sur une expérience pour voir le rapport détaillé</p>
        </div>
        <div className="space-y-2">
          {experiments.filter((e) => e.orchestratorReport?.humanReport).map((exp) => {
            const hr = exp.orchestratorReport!.humanReport!
            const isExpanded = expandedExpId === exp.id
            return (
              <div key={exp.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50"
                  onClick={() => setExpandedExpId(isExpanded ? null : exp.id)}
                >
                  <div>
                    <span className="font-mono text-xs text-slate-500 mr-3">{exp.id}</span>
                    <span className="font-semibold">{hr.headline}</span>
                  </div>
                  <span className="text-slate-400">{isExpanded ? '▲' : '▼'}</span>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 bg-slate-50">
                    <p className="text-sm text-slate-700 pt-2">{hr.summary}</p>
                    {hr.decisionScoreExplanation && (
                      <p className="text-xs text-slate-600 bg-white border rounded px-3 py-2">{hr.decisionScoreExplanation}</p>
                    )}
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Métriques</h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {hr.metrics.map((m) => (
                          <div key={m.key} className="bg-white border rounded p-3 text-xs space-y-1">
                            <div className="flex items-center gap-2 font-semibold">
                              <span>{m.emoji}</span>
                              <span>{m.label}</span>
                              <span className="ml-auto font-mono">{m.value}</span>
                            </div>
                            <p className="text-slate-600">{m.interpretation}</p>
                            {m.advice && <p className="text-slate-500 italic">{m.advice}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Étapes d&apos;orchestration</h4>
                      <div className="space-y-1">
                        {hr.steps.map((s) => (
                          <div key={s.name} className={`text-xs rounded px-3 py-2 ${s.status === 'warning' ? 'bg-yellow-50 border border-yellow-200' : 'bg-white border'}`}>
                            <span className="font-semibold">{s.humanLabel}</span>
                            {s.explanation && <p className="text-slate-600 mt-0.5">{s.explanation}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={`rounded p-3 text-xs border ${hr.recommendation.color === 'green' ? 'bg-green-50 border-green-200' : hr.recommendation.color === 'red' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                      <p className="font-semibold mb-1">{hr.recommendation.label}</p>
                      <p className="text-slate-700 mb-1">{hr.recommendation.explanation}</p>
                      <p className="text-slate-600 whitespace-pre-line">{hr.recommendation.nextAction}</p>
                      {hr.recommendation.warning && <p className="text-red-600 font-semibold mt-1">{hr.recommendation.warning}</p>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {experiments.filter((e) => e.orchestratorReport?.humanReport).length === 0 && (
            <p className="text-sm text-slate-500">Aucun rapport disponible. Lancez l&apos;orchestrateur sur une expérience pour voir le rapport explicatif.</p>
          )}
        </div>
      </section>

      {/* ── Hypothesis Backlog ───────────────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            Backlog d&apos;hypothèses
            <InfoTooltip
              content="Prioritized list of suggested experiments generated from recent outcomes and signals."
              label="Backlog hypotheses explanation"
            />
          </h2>
          <div className="flex gap-2">
            <button onClick={loadHypotheses} className="px-3 py-1.5 rounded border border-slate-300 text-sm">Charger</button>
            <button onClick={generateHypotheses} disabled={hypLoading} className="px-3 py-1.5 rounded bg-slate-900 text-white text-sm disabled:opacity-50">
              {hypLoading ? 'Génération...' : 'Générer automatiquement'}
            </button>
          </div>
        </div>
        {hypotheses.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune hypothèse. Cliquer &quot;Générer&quot; pour analyser les expériences récentes et proposer de nouvelles pistes.</p>
        ) : (
          <div className="space-y-3">
            {hypotheses.map((h) => (
              <div key={h.id} className={`border rounded-lg p-3 text-sm ${h.priority === 'critical' ? 'border-red-300 bg-red-50' : h.priority === 'high' ? 'border-orange-300 bg-orange-50' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded mr-2 ${h.priority === 'critical' ? 'bg-red-200 text-red-800' : h.priority === 'high' ? 'bg-orange-200 text-orange-800' : h.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' : 'bg-slate-200 text-slate-700'}`}>{h.priority.toUpperCase()}</span>
                    <span className="font-mono text-xs text-slate-500">{h.module}</span>
                    {typeof h.priorityScore === 'number' && (
                      <span className="ml-2 text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                        score {h.priorityScore.toFixed(1)}
                      </span>
                    )}
                    <p className="font-semibold mt-1">{h.hypothesis}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{h.rationale}</p>
                    {(typeof h.impactScore === 'number' && typeof h.confidenceScore === 'number' && typeof h.costScore === 'number') && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        impact {h.impactScore.toFixed(1)} x confidence {h.confidenceScore.toFixed(1)} / cost {h.costScore.toFixed(1)}
                      </p>
                    )}
                    {h.suggestedChanges.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {h.suggestedChanges.map((c) => (
                          <span key={c} className="text-xs bg-slate-100 border rounded px-1.5 py-0.5 font-mono">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => updateHypStatus(h.id, 'promoted')} className="px-2 py-1 rounded border border-green-300 text-green-700 text-xs">Promouvoir</button>
                    <button onClick={() => updateHypStatus(h.id, 'dismissed')} className="px-2 py-1 rounded border border-slate-300 text-slate-600 text-xs">Ignorer</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Meta Optimizer ──────────────────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            Meta-optimizer (apprentissage)
            <InfoTooltip
              content="Learning layer that aggregates approved/rejected experiments to suggest threshold and policy tuning."
              label="Meta optimizer explanation"
            />
          </h2>
          <div className="flex gap-2">
            <button onClick={loadMeta} className="px-3 py-1.5 rounded border border-slate-300 text-sm">Dernier snapshot</button>
            <button onClick={runMeta} disabled={metaLoading} className="px-3 py-1.5 rounded bg-slate-900 text-white text-sm disabled:opacity-50">
              {metaLoading ? 'Analyse...' : 'Lancer l&apos;analyse'}
            </button>
          </div>
        </div>
        {!metaSnapshot ? (
          <p className="text-sm text-slate-500">Aucun snapshot. Cliquer &quot;Lancer&quot; pour analyser les expériences approuvées et dériver des insights.</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div className="border rounded p-3">
                <div className="text-2xl font-bold text-green-600">{metaSnapshot.totalApproved}</div>
                <div className="text-slate-500">Approuvées</div>
              </div>
              <div className="border rounded p-3">
                <div className="text-2xl font-bold text-red-500">{metaSnapshot.totalRejected}</div>
                <div className="text-slate-500">Rejetées</div>
              </div>
              <div className="border rounded p-3">
                <div className="text-2xl font-bold text-blue-600">{metaSnapshot.approvalRate}%</div>
                <div className="text-slate-500">Taux d&apos;approbation</div>
              </div>
            </div>
            {metaKpis && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="border rounded p-3 bg-blue-50 border-blue-200">
                  <p className="text-xs text-blue-700 font-semibold">System learning rate</p>
                  <p className="text-xl font-bold text-blue-700">{metaKpis.learningRate}%</p>
                </div>
                <div className={`border rounded p-3 ${metaKpis.improvementOverTime >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <p className={`text-xs font-semibold ${metaKpis.improvementOverTime >= 0 ? 'text-green-700' : 'text-red-700'}`}>Improvement over time</p>
                  <p className={`text-xl font-bold ${metaKpis.improvementOverTime >= 0 ? 'text-green-700' : 'text-red-700'}`}>{metaKpis.improvementOverTime >= 0 ? '+' : ''}{metaKpis.improvementOverTime}</p>
                </div>
                <div className="border rounded p-3 bg-slate-50 border-slate-200">
                  <p className="text-xs text-slate-700 font-semibold">Approval trend</p>
                  <p className="text-xl font-bold text-slate-800">{metaKpis.approvalTrend}</p>
                </div>
              </div>
            )}
            <div className="space-y-1">
              {metaSnapshot.insights.map((ins, i) => (
                <p key={i} className="text-sm bg-slate-50 border rounded px-3 py-2">{ins}</p>
              ))}
            </div>
            {metaSnapshot.crossModuleCorrelations && Object.keys(metaSnapshot.crossModuleCorrelations).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Cross-module correlations</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {Object.entries(metaSnapshot.crossModuleCorrelations).map(([key, value]) => (
                    <div key={key} className="text-xs border rounded px-3 py-2 bg-slate-50">
                      <p className="font-semibold text-slate-700">{key}</p>
                      <p className="text-slate-600">r = {value == null ? 'n/a' : value.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {Array.isArray(metaSnapshot.crossModuleInsights) && metaSnapshot.crossModuleInsights.length > 0 && (
              <div className="space-y-1">
                {metaSnapshot.crossModuleInsights.map((ins, i) => (
                  <p key={`cross-${i}`} className="text-sm bg-indigo-50 border border-indigo-200 rounded px-3 py-2">{ins}</p>
                ))}
              </div>
            )}
            {Object.keys(metaSnapshot.suggestedThresholdAdjustments).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Ajustements suggérés</h4>
                <pre className="text-xs bg-slate-50 border rounded p-3 overflow-auto">{JSON.stringify(metaSnapshot.suggestedThresholdAdjustments, null, 2)}</pre>
              </div>
            )}
            <p className="text-xs text-slate-400">Calculé: {new Date(metaSnapshot.computedAt).toLocaleString()}</p>
          </div>
        )}
      </section>

      {/* ── Statistical Validator ───────────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            Validateur statistique (t-test de Welch)
            <InfoTooltip
              content="Statistical significance check between baseline and candidate score samples."
              example="Use p-value and effect size together before approving a promotion."
              label="Statistical validator explanation"
            />
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-3">Entrer les scores baseline et candidat séparés par des virgules. Minimum 5 valeurs par groupe pour un résultat fiable.</p>
        <div className="grid grid-cols-1 gap-3 mb-3">
          <label className="text-sm">
            <span className="font-semibold">Baseline</span>
            <input
              className="w-full border rounded px-3 py-2 mt-1 text-sm"
              value={validationBaseline}
              onChange={(e) => setValidationBaseline(e.target.value)}
              placeholder="45,52,38,61,44,55,48,50,42,58"
            />
          </label>
          <label className="text-sm">
            <span className="font-semibold">Candidat</span>
            <input
              className="w-full border rounded px-3 py-2 mt-1 text-sm"
              value={validationCandidate}
              onChange={(e) => setValidationCandidate(e.target.value)}
              placeholder="50,57,43,65,49,60,53,55,47,62"
            />
          </label>
        </div>
        <button onClick={runValidation} className="px-4 py-2 rounded bg-slate-900 text-white text-sm mb-3">Analyser</button>
        {validationResult && 'tStatistic' in validationResult && (
          <div className={`border rounded p-4 text-sm space-y-2 ${validationResult.significant ? (validationResult.recommendation === 'accept' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200') : 'bg-slate-50'}`}>
            <p className="font-semibold">{validationResult.interpretation}</p>
            <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
              <span>p-value: <strong>{validationResult.pValue}</strong></span>
              <span>t: <strong>{validationResult.tStatistic}</strong></span>
              <span>Cohen&apos;s d: <strong>{validationResult.cohenD}</strong></span>
              <span>Baseline μ: <strong>{validationResult.meanA}</strong></span>
              <span>Candidat μ: <strong>{validationResult.meanB}</strong></span>
              <span>Effet: <strong>{validationResult.effectSize}</strong></span>
            </div>
          </div>
        )}
      </section>

      {/* ── Canary Management ───────────────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            Déploiement Canary
            <InfoTooltip
              content="Progressive rollout control (10%, 25%, 50%, 100%) with rollback guardrails."
              label="Canary deployment explanation"
            />
          </h2>
          <button onClick={loadCanaries} disabled={canaryLoading} className="px-3 py-1.5 rounded border border-slate-300 text-sm">
            {canaryLoading ? '...' : 'Charger'}
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Séquence de trafic: 10% → 25% → 50% → 100% → complété. Chaque avancement est manuel. Rollback auto si taux d&apos;erreur &gt; seuil.
        </p>
        {canaryStates.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun déploiement canary. Approuver une promotion puis cliquer &quot;Start Canary&quot; dans la file de promotion.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Experiment</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Trafic</th>
                  <th className="py-2 pr-4">Dernier taux d&apos;erreur</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {canaryStates.map((c) => (
                  <tr key={c.id} className="border-b align-top">
                    <td className="py-2 pr-4 font-mono text-xs">{c.experimentId}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${c.status === 'completed' ? 'bg-green-100 text-green-700' : c.status === 'rolled_back' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{c.status}</span>
                    </td>
                    <td className="py-2 pr-4 font-semibold">{c.trafficPct}%</td>
                    <td className="py-2 pr-4">{(c.lastErrorRate * 100).toFixed(2)}%</td>
                    <td className="py-2 pr-4 space-x-1">
                      {!['completed', 'rolled_back'].includes(c.status) && (
                        <>
                          <button onClick={() => doCanaryAction(c.id, 'advance')} className="px-2 py-1 rounded border border-blue-300 text-blue-700 text-xs">Avancer</button>
                          <button onClick={() => doCanaryAction(c.id, 'rollback')} className="px-2 py-1 rounded border border-red-300 text-red-700 text-xs">Rollback</button>
                        </>
                      )}
                      {c.rolledBackReason && <span className="text-xs text-red-600 block mt-1">{c.rolledBackReason}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
