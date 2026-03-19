'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GlassButton, GlassCard, GlassGrid, GlassStat, GradientText } from '@/components/design-system/GlassComponents'
import { RealIcon } from '@/components/design-system/RealIcon'

type FiltersState = {
  agentName: string
  taskType: string
  cohortKey: string
  stage: string
  jobName: string
  from: string
  to: string
  limit: string
}

type ThresholdState = {
  minRuns: string
  minWindowHours: string
  minGainScore: string
  rollbackDropScore: string
  maxScoreStdDev: string
  minComparableShare: string
}

type PolicyCandidate = {
  policyHash: string
  policy: Record<string, unknown>
  runs: number
  successRate: number
  avgScore: number
  scoreStdDev: number
  comparableShare: number
  dominantJobName: string | null
  avgDurationSec: number
  latestAt: string
}

type ActivePolicyState = {
  agent_name?: string
  task_type?: string
  stage?: string
  policy_hash?: string
  previous_policy_hash?: string | null
  baseline_score?: number | null
  baseline_success_rate?: number | null
  baseline_runs?: number | null
  promoted_at?: string | null
  updated_at?: string | null
}

type PolicyComparison = {
  comparable: boolean
  left?: {
    policyHash: string
    runs: number
    successRate: number
    avgScore: number
    scoreStdDev: number
    comparableShare: number
    avgDurationSec: number
  }
  right?: {
    policyHash: string
    runs: number
    successRate: number
    avgScore: number
    scoreStdDev: number
    comparableShare: number
    avgDurationSec: number
  }
  delta?: {
    score: number
    successRate: number
    stdDev: number
    comparableShare: number
    durationSec: number
    runs: number
  }
}

type PolicySnapshot = {
  id?: string
  job_name?: string | null
  stage?: string | null
  success?: boolean | null
  score?: number | null
  duration_sec?: number | null
  created_at?: string | null
  run_finished_at?: string | null
}

type PolicyAuditEntry = {
  id: string
  agentName: string
  taskType: string
  cohortKey: string
  stage: string
  action: string
  reason: string
  candidatePolicyHash: string | null
  baselinePolicyHash: string | null
  metrics: Record<string, unknown>
  createdAt: string
}

type ActivePolicyBoardRow = {
  agentName: string
  taskType: string
  cohortKey: string
  stage: string
  policyHash: string
  promotedAt: string | null
  updatedAt: string | null
  lastPromotionAt: string | null
  lastRollbackAt: string | null
  baselineScore: number
  baselineSuccessRate: number
  runs: number
  avgScore: number | null
  successRate: number | null
  perfDeltaScore: number | null
  perfDeltaSuccessRate: number | null
  risk: 'safe' | 'low' | 'medium' | 'high'
  drift: 'stable' | 'rising' | 'detected' | 'unknown'
  status: 'active' | 'watch' | 'degraded'
}

type PolicyTimelineEntry = {
  agentName: string
  taskType: string
  cohortKey: string
  stage: string
  policyHash: string
  createdAt: string
  promotedAt: string
  rollbackAt: string | null
  activeDurationSec: number
  reason: string
  gainScore: number | null
  successRate: number | null
  driftDetected: boolean
  lifecycle: 'active' | 'rolled_back' | 'superseded'
}

type CohortBanditChoice = {
  cohortKey: string
  chosenPolicyHash: string | null
  strategy: 'ucb1' | 'fallback'
  candidates: Array<{
    policyHash: string
    runs: number
    avgScore: number
    ucbScore: number
  }>
}

type BanditPlan = {
  generatedAt: string
  discovery: CohortBanditChoice[]
  enrichment: CohortBanditChoice[]
}

type PolicyAllocationEntry = {
  id: string
  agentName: string
  taskType: string
  cohortKey: string
  chosenPolicyHash: string | null
  previousPolicyHash: string | null
  strategy: string
  transition: 'initial' | 'switch' | 'stable'
  candidates: Array<{
    policyHash: string
    runs: number
    avgScore: number
    ucbScore: number
  }>
  createdAt: string
}

type PoliciesResponse = {
  success: boolean
  activeState: ActivePolicyState | null
  candidates: PolicyCandidate[]
  comparison: PolicyComparison
  snapshots: PolicySnapshot[]
  audit: PolicyAuditEntry[]
  board: ActivePolicyBoardRow[]
  timeline: PolicyTimelineEntry[]
  banditPlan?: BanditPlan
  allocationTimeline?: PolicyAllocationEntry[]
}

type ActionNotice = {
  tone: 'success' | 'error' | 'neutral'
  text: string
}

const DEFAULT_FILTERS: FiltersState = {
  agentName: '',
  taskType: '',
  cohortKey: 'global',
  stage: '',
  jobName: '',
  from: '',
  to: '',
  limit: '80',
}

const DEFAULT_THRESHOLDS: ThresholdState = {
  minRuns: '8',
  minWindowHours: '24',
  minGainScore: '0.04',
  rollbackDropScore: '0.06',
  maxScoreStdDev: '0.22',
  minComparableShare: '0.60',
}

const PRESETS = [
  {
    label: 'Scoring P1',
    description: 'Promotion du scoring et rollback rapide',
    filters: { agentName: 'scoring_agent', taskType: 'score_validation', stage: 'scoring' },
  },
  {
    label: 'Gate P1',
    description: 'Quality gate C sur les runs scoring',
    filters: { agentName: 'gate_agent_c', taskType: 'quality_gate', stage: 'scoring' },
  },
  {
    label: 'Score Auditor',
    description: 'Audit des verdicts et dérive',
    filters: { agentName: 'score_auditor', taskType: 'audit_verdict', stage: 'scoring' },
  },
  {
    label: 'Discovery Queries',
    description: 'A/B des policies de requêtes discovery',
    filters: { agentName: 'market_discovery', taskType: 'query_discovery', stage: 'discovery' },
  },
  {
    label: 'Enrichment',
    description: 'Pilotage enrichissement firm-level',
    filters: { agentName: 'adaptive_enrichment', taskType: 'firm_enrichment', stage: 'crawl' },
  },
  {
    label: 'Crawl Strategy',
    description: 'Policies de crawl par domaine',
    filters: { agentName: 'crawl_extractor', taskType: 'domain_crawl', stage: 'crawl' },
  },
] as const

function formatPercent(value: number | null | undefined): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${(n * 100).toFixed(1)}%`
}

function formatScore(value: number | null | undefined): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(3)
}

function formatDuration(value: number | null | undefined): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  if (n < 1) return `${Math.round(n * 1000)} ms`
  return `${n.toFixed(1)} s`
}

function formatDurationLong(seconds: number | null | undefined): string {
  const s = Number(seconds)
  if (!Number.isFinite(s)) return '—'
  if (s < 60) return `${Math.round(s)} s`
  const m = Math.floor(s / 60)
  const remS = Math.floor(s % 60)
  if (m < 60) return `${m}m ${remS}s`
  const h = Math.floor(m / 60)
  const remM = m % 60
  if (h < 24) return `${h}h ${remM}m`
  const d = Math.floor(h / 24)
  const remH = h % 24
  return `${d}j ${remH}h`
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (!Number.isFinite(d.getTime())) return '—'
  return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

function shortHash(value: string | null | undefined): string {
  if (!value) return '—'
  return value.length > 12 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value
}

function summarizePolicy(policy: Record<string, unknown>): string {
  const entries = Object.entries(policy || {})
  if (!entries.length) return 'Policy vide'
  return entries
    .slice(0, 3)
    .map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
    .join(' • ')
}

function summarizeAuditMetrics(metrics: Record<string, unknown>): string {
  const entries = Object.entries(metrics || {})
  if (!entries.length) return '—'
  return entries
    .slice(0, 3)
    .map(([key, value]) => `${key}=${typeof value === 'number' ? Number(value).toFixed(3).replace(/\.000$/, '') : String(value)}`)
    .join(' • ')
}

function labelAction(action: string): string {
  const labels: Record<string, string> = {
    promote: 'Promote',
    rollback: 'Rollback',
    evaluate: 'Evaluate',
    skip: 'Skip',
  }
  return labels[action] || action
}

function boardRiskTone(risk: ActivePolicyBoardRow['risk']): 'emerald' | 'cyan' | 'amber' | 'slate' | 'rose' {
  if (risk === 'high') return 'rose'
  if (risk === 'medium') return 'amber'
  if (risk === 'low') return 'emerald'
  return 'slate'
}

function driftTone(drift: ActivePolicyBoardRow['drift']): 'emerald' | 'cyan' | 'amber' | 'slate' | 'rose' {
  if (drift === 'detected') return 'rose'
  if (drift === 'rising') return 'amber'
  if (drift === 'stable') return 'emerald'
  return 'slate'
}

function buildQuery(filters: FiltersState, compareA: string, compareB: string): string {
  const params = new URLSearchParams()

  if (filters.agentName.trim()) params.set('agentName', filters.agentName.trim())
  if (filters.taskType.trim()) params.set('taskType', filters.taskType.trim())
  if (filters.cohortKey.trim()) params.set('cohortKey', filters.cohortKey.trim())
  if (filters.stage.trim()) params.set('stage', filters.stage.trim())
  if (filters.jobName.trim()) params.set('jobName', filters.jobName.trim())
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.limit.trim()) params.set('limit', filters.limit.trim())
  if (compareA) params.set('compareA', compareA)
  if (compareB) params.set('compareB', compareB)

  return params.toString()
}

function buildAllocationExportQuery(filters: FiltersState, format: 'json' | 'csv', includeCandidates = false): string {
  const params = new URLSearchParams()
  if (filters.agentName.trim()) params.set('agentName', filters.agentName.trim())
  if (filters.taskType.trim()) params.set('taskType', filters.taskType.trim())
  if (filters.cohortKey.trim()) params.set('cohortKey', filters.cohortKey.trim())
  if (filters.stage.trim()) params.set('stage', filters.stage.trim())
  if (filters.jobName.trim()) params.set('jobName', filters.jobName.trim())
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.limit.trim()) params.set('timelineLimit', filters.limit.trim())
  params.set('allocationExport', format)
  if (includeCandidates) params.set('includeCandidates', 'true')
  return params.toString()
}

function badgeTone(tone: 'emerald' | 'cyan' | 'amber' | 'slate' | 'rose'): string {
  const map = {
    emerald: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
    cyan: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100',
    amber: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
    slate: 'border-white/10 bg-white/5 text-slate-200',
    rose: 'border-rose-400/30 bg-rose-500/10 text-rose-100',
  }
  return map[tone]
}

export default function AgentPoliciesPage() {
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS)
  const [thresholds, setThresholds] = useState<ThresholdState>(DEFAULT_THRESHOLDS)
  const [data, setData] = useState<PoliciesResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<'evaluate' | 'promote' | 'rollback' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<ActionNotice | null>(null)
  const [compareA, setCompareA] = useState('')
  const [compareB, setCompareB] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)
  const [selectedCandidateHash, setSelectedCandidateHash] = useState('')
  const [actionPolicyHash, setActionPolicyHash] = useState<string | null>(null)

  const scopeReady = Boolean(filters.agentName.trim() && filters.taskType.trim())

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const query = buildQuery(filters, compareA, compareB)
        const res = await fetch(`/api/admin/agent-learning/policies?${query}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        const payload = (await res.json()) as PoliciesResponse & { error?: string }
        if (!res.ok || !payload.success) {
          throw new Error(payload.error || 'Impossible de charger les policies')
        }
        setData(payload)
      } catch (err) {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'Impossible de charger les policies')
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [filters, compareA, compareB, refreshToken])

  function updateFilter(name: keyof FiltersState, value: string) {
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function updateThreshold(name: keyof ThresholdState, value: string) {
    setThresholds((current) => ({ ...current, [name]: value }))
  }

  function applyPreset(preset: (typeof PRESETS)[number]) {
    setFilters((current) => ({
      ...current,
      agentName: preset.filters.agentName,
      taskType: preset.filters.taskType,
      cohortKey: 'global',
      stage: preset.filters.stage,
      jobName: '',
    }))
    setSelectedCandidateHash('')
    setCompareA('')
    setCompareB('')
    setNotice({ tone: 'neutral', text: `Preset chargé: ${preset.label}` })
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
    setCompareA('')
    setCompareB('')
    setSelectedCandidateHash('')
    setData(null)
    setNotice(null)
    setError(null)
  }

  async function runAction(action: 'evaluate' | 'promote' | 'rollback', candidatePolicyHash?: string) {
    if (!scopeReady) return

    setActionLoading(action)
    setActionPolicyHash(candidatePolicyHash || null)
    setError(null)

    try {
      const res = await fetch('/api/admin/agent-learning/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          agentName: filters.agentName.trim(),
          taskType: filters.taskType.trim(),
          cohortKey: filters.cohortKey.trim() || 'global',
          stage: filters.stage.trim() || undefined,
          candidatePolicyHash,
          minRuns: Number(thresholds.minRuns),
          minWindowHours: Number(thresholds.minWindowHours),
          minGainScore: Number(thresholds.minGainScore),
          rollbackDropScore: Number(thresholds.rollbackDropScore),
          maxScoreStdDev: Number(thresholds.maxScoreStdDev),
          minComparableShare: Number(thresholds.minComparableShare),
        }),
      })
      const payload = (await res.json()) as {
        success?: boolean
        error?: string
        promotion?: { promoted?: boolean; reason?: string; activePolicyHash?: string | null }
        rollback?: { rolledBack?: boolean; reason?: string; activePolicyHash?: string | null }
        decision?: { rolledBack?: boolean; reason?: string; activePolicyHash?: string | null }
      }
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || `Action ${action} impossible`)
      }

      let text = 'Action exécutée'
      if (action === 'rollback' && payload.decision) {
        text = payload.decision.rolledBack
          ? `Rollback exécuté vers ${shortHash(payload.decision.activePolicyHash)}`
          : `Rollback non déclenché: ${payload.decision.reason || 'aucune dérive détectée'}`
      }
      if ((action === 'promote' || action === 'evaluate') && payload.promotion) {
        text = payload.promotion.promoted
          ? `Promotion appliquée: ${shortHash(payload.promotion.activePolicyHash)}`
          : `Pas de promotion: ${payload.promotion.reason || 'seuils non atteints'}`
      }

      if (candidatePolicyHash && action === 'promote' && !payload.promotion?.promoted) {
        text = `Promotion explicite refusée pour ${shortHash(candidatePolicyHash)}: ${payload.promotion?.reason || 'garde-fou actif'}`
      }

      if (candidatePolicyHash && action === 'promote' && payload.promotion?.promoted) {
        text = `Promotion explicite appliquée: ${shortHash(candidatePolicyHash)}`
      }

      setNotice({ tone: 'success', text })
      setRefreshToken((value) => value + 1)
    } catch (err) {
      const message = err instanceof Error ? err.message : `Action ${action} impossible`
      setError(message)
      setNotice({ tone: 'error', text: message })
    } finally {
      setActionLoading(null)
      setActionPolicyHash(null)
    }
  }

  const candidates = data?.candidates || []
  const snapshots = data?.snapshots || []
  const audit = data?.audit || []
  const board = data?.board || []
  const timeline = data?.timeline || []
  const banditPlan = data?.banditPlan || { generatedAt: '', discovery: [], enrichment: [] }
  const allocationTimeline = data?.allocationTimeline || []
  const activeState = data?.activeState || null
  const comparison = data?.comparison || { comparable: false }
  const eligibleCount = candidates.filter((candidate) => candidate.runs >= Number(thresholds.minRuns || '0')).length
  const bestCandidate = candidates[0]
  const latestSnapshot = snapshots[0]

  function downloadAllocationExport(format: 'json' | 'csv', includeCandidates = false) {
    const query = buildAllocationExportQuery(filters, format, includeCandidates)
    window.open(`/api/admin/agent-learning/policies?${query}`, '_blank', 'noopener,noreferrer')
  }

  function getAllocationExportUrl(format: 'json' | 'csv', includeCandidates = false): string {
    const query = buildAllocationExportQuery(filters, format, includeCandidates)
    const relative = `/api/admin/agent-learning/policies?${query}`
    if (typeof window === 'undefined') return relative
    return `${window.location.origin}${relative}`
  }

  async function copyAllocationExportUrl(format: 'json' | 'csv', includeCandidates = false) {
    const url = getAllocationExportUrl(format, includeCandidates)
    const label = format.toUpperCase() + (includeCandidates ? ' Candidats' : '')
    try {
      await navigator.clipboard.writeText(url)
      setNotice({ tone: 'success', text: `URL export ${label} copiée` })
    } catch {
      setNotice({ tone: 'error', text: `Impossible de copier l'URL export ${label}` })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <GlassCard variant="dark" className="mb-8" hover={false}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                <RealIcon name="agents" size={14} alt="Policies" />
                Policy Lab Admin
              </div>
              <h1 className="flex items-center gap-3 text-4xl font-bold text-white">
                <RealIcon name="operations" size={26} alt="Policies" />
                <GradientText variant="h1">Pilotage ALS Policies</GradientText>
              </h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                Filtre un scope agent, compare les challengers, puis déclenche promotion ou rollback en un clic.
                L’UI reste alignée sur la gouvernance réelle: les actions opèrent sur le couple agent/task sélectionné.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <GlassButton variant="secondary" size="sm" onClick={() => setRefreshToken((value) => value + 1)}>
                Rafraîchir
              </GlassButton>
              <GlassButton variant="ghost" size="sm" onClick={() => downloadAllocationExport('json')}>
                Export UCB JSON
              </GlassButton>
              <GlassButton variant="ghost" size="sm" onClick={() => downloadAllocationExport('csv')}>
                Export UCB CSV
              </GlassButton>
              <GlassButton variant="ghost" size="sm" onClick={() => downloadAllocationExport('csv', true)}>
                CSV Candidats
              </GlassButton>
              <Link
                href="/admin/autonomous-lab"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10"
              >
                <RealIcon name="copilot" size={16} alt="Autonomous Lab" />
                Autonomous Lab
              </Link>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-xs text-cyan-100">
            <div className="mb-2 font-semibold uppercase tracking-wide">URL d'export audit (filtres courants)</div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={getAllocationExportUrl('json')}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-cyan-100 hover:bg-cyan-500/20"
              >
                JSON
              </a>
              <GlassButton variant="ghost" size="sm" onClick={() => copyAllocationExportUrl('json')}>
                Copier JSON
              </GlassButton>
              <a
                href={getAllocationExportUrl('csv')}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-cyan-100 hover:bg-cyan-500/20"
              >
                CSV
              </a>
              <GlassButton variant="ghost" size="sm" onClick={() => copyAllocationExportUrl('csv')}>
                Copier CSV
              </GlassButton>
              <a
                href={getAllocationExportUrl('csv', true)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-cyan-100 hover:bg-cyan-500/20"
              >
                CSV Candidats
              </a>
              <GlassButton variant="ghost" size="sm" onClick={() => copyAllocationExportUrl('csv', true)}>
                Copier CSV Candidats
              </GlassButton>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="medium" className="mb-8" hover={false}>
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-cyan-200">
            <RealIcon name="dashboard" size={16} alt="Presets" />
            Presets rapides
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/10"
              >
                <div className="text-sm font-semibold text-white">{preset.label}</div>
                <div className="mt-1 text-xs text-slate-400">{preset.description}</div>
                <div className="mt-2 text-[11px] uppercase tracking-wide text-cyan-200">
                  {preset.filters.agentName} / {preset.filters.taskType}
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard variant="dark" className="mb-8" hover={false}>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Allocation timeline (UCB)</h2>
              <p className="mt-1 text-sm text-slate-400">Historique des allocations par cohorte avec transitions stable/switch.</p>
            </div>
            <div className="text-xs uppercase tracking-wide text-slate-400">{allocationTimeline.length} événements</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-3">Agent</th>
                  <th className="px-3 py-3">Task</th>
                  <th className="px-3 py-3">Cohorte</th>
                  <th className="px-3 py-3">Transition</th>
                  <th className="px-3 py-3">From</th>
                  <th className="px-3 py-3">To</th>
                  <th className="px-3 py-3">Stratégie</th>
                  <th className="px-3 py-3">Top candidat</th>
                  <th className="px-3 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {allocationTimeline.map((item) => {
                  const topCandidate = item.candidates?.[0]
                  const transitionTone =
                    item.transition === 'switch' ? 'amber' : item.transition === 'initial' ? 'cyan' : 'emerald'
                  return (
                    <tr key={item.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.035]">
                      <td className="px-3 py-3 text-xs text-slate-200">{item.agentName}</td>
                      <td className="px-3 py-3 text-xs text-slate-300">{item.taskType}</td>
                      <td className="px-3 py-3 text-xs text-slate-300">{item.cohortKey}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeTone(transitionTone)}`}>
                          {item.transition}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400">{shortHash(item.previousPolicyHash)}</td>
                      <td className="px-3 py-3 text-xs text-white">{shortHash(item.chosenPolicyHash)}</td>
                      <td className="px-3 py-3 text-xs text-slate-300">{item.strategy}</td>
                      <td className="px-3 py-3 text-xs text-slate-200">
                        {topCandidate
                          ? `${shortHash(topCandidate.policyHash)} • ucb ${formatScore(topCandidate.ucbScore)}`
                          : '—'}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-300">{formatDate(item.createdAt)}</td>
                    </tr>
                  )
                })}
                {!allocationTimeline.length && !loading && (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-slate-400">
                      Aucun événement d’allocation disponible.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard variant="dark" className="mb-8" hover={false}>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Scope & seuils de gouvernance</h2>
              <p className="mt-1 text-sm text-slate-400">Le chargement est déclenché automatiquement avec un debounce court dès que le scope est complet.</p>
            </div>
            <GlassButton variant="ghost" size="sm" onClick={resetFilters}>
              Réinitialiser
            </GlassButton>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm text-slate-300">
              <span>Agent</span>
              <input value={filters.agentName} onChange={(event) => updateFilter('agentName', event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none transition focus:border-cyan-400/50" placeholder="scoring_agent" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Task type</span>
              <input value={filters.taskType} onChange={(event) => updateFilter('taskType', event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none transition focus:border-cyan-400/50" placeholder="score_validation" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Cohorte</span>
              <input value={filters.cohortKey} onChange={(event) => updateFilter('cohortKey', event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none transition focus:border-cyan-400/50" placeholder="global | known_source | js_heavy" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Stage</span>
              <input value={filters.stage} onChange={(event) => updateFilter('stage', event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none transition focus:border-cyan-400/50" placeholder="scoring" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Job name</span>
              <input value={filters.jobName} onChange={(event) => updateFilter('jobName', event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none transition focus:border-cyan-400/50" placeholder="optionnel" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Depuis</span>
              <input type="datetime-local" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none transition focus:border-cyan-400/50" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Jusqu’à</span>
              <input type="datetime-local" value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none transition focus:border-cyan-400/50" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Limite</span>
              <input value={filters.limit} onChange={(event) => updateFilter('limit', event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none transition focus:border-cyan-400/50" placeholder="80" />
            </label>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
              <div className="font-semibold text-white">Scope actif</div>
              <div className="mt-2 text-slate-400">
                {scopeReady ? `${filters.agentName} / ${filters.taskType}` : 'Sélectionne au minimum agentName et taskType'}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-cyan-200">Cohorte: {filters.cohortKey || 'global'}</div>
              {filters.stage && <div className="mt-1 text-xs uppercase tracking-wide text-cyan-200">Stage: {filters.stage}</div>}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <label className="space-y-2 text-sm text-slate-300">
              <span>Min runs</span>
              <input value={thresholds.minRuns} onChange={(event) => updateThreshold('minRuns', event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none transition focus:border-cyan-400/50" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Fenêtre minimale (h)</span>
              <input value={thresholds.minWindowHours} onChange={(event) => updateThreshold('minWindowHours', event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none transition focus:border-cyan-400/50" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Gain minimum score</span>
              <input value={thresholds.minGainScore} onChange={(event) => updateThreshold('minGainScore', event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none transition focus:border-cyan-400/50" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Seuil rollback</span>
              <input value={thresholds.rollbackDropScore} onChange={(event) => updateThreshold('rollbackDropScore', event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none transition focus:border-cyan-400/50" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Max std dev score</span>
              <input value={thresholds.maxScoreStdDev} onChange={(event) => updateThreshold('maxScoreStdDev', event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none transition focus:border-cyan-400/50" />
            </label>
            <label className="space-y-2 text-sm text-slate-300">
              <span>Min comparable share</span>
              <input value={thresholds.minComparableShare} onChange={(event) => updateThreshold('minComparableShare', event.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-white outline-none transition focus:border-cyan-400/50" />
            </label>
          </div>
        </GlassCard>

        {notice && (
          <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${notice.tone === 'success' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' : notice.tone === 'error' ? 'border-rose-400/30 bg-rose-500/10 text-rose-100' : 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100'}`}>
            {notice.text}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <GlassCard variant="medium" className="mb-8" hover={false}>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">Multi-bras discovery/enrichment</h2>
              <p className="mt-1 text-sm text-slate-400">Plan UCB généré côté backend, limité aux agents discovery/enrichment.</p>
            </div>
            <div className="text-xs uppercase tracking-wide text-slate-400">{banditPlan.generatedAt ? `update ${formatDate(banditPlan.generatedAt)}` : 'plan indisponible'}</div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 text-sm font-semibold text-cyan-200">Discovery cohorts</div>
              <div className="space-y-2">
                {banditPlan.discovery.map((item) => (
                  <div key={`d-${item.cohortKey}`} className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-white">{item.cohortKey}</span>
                      <span className="text-xs text-slate-400">{item.strategy}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-300">chosen: {shortHash(item.chosenPolicyHash)}</div>
                  </div>
                ))}
                {!banditPlan.discovery.length && <div className="text-xs text-slate-400">Aucune cohorte discovery disponible.</div>}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 text-sm font-semibold text-cyan-200">Enrichment cohorts</div>
              <div className="space-y-2">
                {banditPlan.enrichment.map((item) => (
                  <div key={`e-${item.cohortKey}`} className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-white">{item.cohortKey}</span>
                      <span className="text-xs text-slate-400">{item.strategy}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-300">chosen: {shortHash(item.chosenPolicyHash)}</div>
                  </div>
                ))}
                {!banditPlan.enrichment.length && <div className="text-xs text-slate-400">Aucune cohorte enrichment disponible.</div>}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard variant="dark" className="mb-8" hover={false}>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Policies actives par agent</h2>
              <p className="mt-1 text-sm text-slate-400">Statut live, baseline, dernière promotion et dernière dérive en lecture immédiate.</p>
            </div>
            <div className="text-xs uppercase tracking-wide text-slate-400">{board.length} lignes</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-3">Agent</th>
                  <th className="px-3 py-3">Cohorte</th>
                  <th className="px-3 py-3">Policy active</th>
                  <th className="px-3 py-3">Since</th>
                  <th className="px-3 py-3">Perf</th>
                  <th className="px-3 py-3">Risk</th>
                  <th className="px-3 py-3">Drift</th>
                  <th className="px-3 py-3">Dernière promotion</th>
                  <th className="px-3 py-3">Dernière dérive</th>
                </tr>
              </thead>
              <tbody>
                {board.map((row) => (
                  <tr key={`${row.agentName}-${row.taskType}`} className="border-b border-white/5 transition-colors hover:bg-white/[0.035]">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-white">{row.agentName}</div>
                      <div className="text-xs text-slate-400">{row.taskType}</div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-300">{row.cohortKey}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-white">{shortHash(row.policyHash)}</div>
                      <div className="text-xs text-slate-400">{row.stage}</div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-300">{formatDate(row.promotedAt)}</td>
                    <td className="px-3 py-3">
                      <div className="text-white">Δscore {row.perfDeltaScore == null ? '—' : `${row.perfDeltaScore >= 0 ? '+' : ''}${formatScore(row.perfDeltaScore)}`}</div>
                      <div className="text-xs text-slate-400">runs {row.runs} • success {formatPercent(row.successRate)}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeTone(boardRiskTone(row.risk))}`}>
                        {row.risk}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeTone(driftTone(row.drift))}`}>
                        {row.drift}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-300">{formatDate(row.lastPromotionAt)}</td>
                    <td className="px-3 py-3 text-xs text-slate-300">{formatDate(row.lastRollbackAt)}</td>
                  </tr>
                ))}
                {!board.length && !loading && (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-slate-400">
                      Aucune policy active trouvée pour les filtres courants.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard variant="medium" className="mb-8" hover={false}>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">Policy timeline</h2>
              <p className="mt-1 text-sm text-slate-400">Durée de vie réelle, raisons de rollback et gains observés par policy.</p>
            </div>
            <div className="text-xs uppercase tracking-wide text-slate-400">{timeline.length} événements</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-3">Agent</th>
                  <th className="px-3 py-3">Cohorte</th>
                  <th className="px-3 py-3">Policy</th>
                  <th className="px-3 py-3">Created</th>
                  <th className="px-3 py-3">Promoted</th>
                  <th className="px-3 py-3">Rollback</th>
                  <th className="px-3 py-3">Durée de vie</th>
                  <th className="px-3 py-3">Gain</th>
                  <th className="px-3 py-3">Success</th>
                  <th className="px-3 py-3">Drift</th>
                  <th className="px-3 py-3">Reason</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((item, index) => (
                  <tr key={`${item.agentName}-${item.taskType}-${item.policyHash}-${item.promotedAt}-${index}`} className="border-b border-white/5 transition-colors hover:bg-white/[0.035]">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-white">{item.agentName}</div>
                      <div className="text-xs text-slate-400">{item.taskType}</div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-300">{item.cohortKey}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-white">{shortHash(item.policyHash)}</div>
                      <div className="text-xs text-slate-400">{item.stage}</div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-300">{formatDate(item.createdAt)}</td>
                    <td className="px-3 py-3 text-xs text-slate-300">{formatDate(item.promotedAt)}</td>
                    <td className="px-3 py-3 text-xs text-slate-300">{formatDate(item.rollbackAt)}</td>
                    <td className="px-3 py-3 text-xs text-slate-200">{formatDurationLong(item.activeDurationSec)}</td>
                    <td className="px-3 py-3 text-xs">
                      <span className={item.gainScore != null && item.gainScore >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                        {item.gainScore == null ? '—' : `${item.gainScore >= 0 ? '+' : ''}${formatScore(item.gainScore)}`}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-200">{formatPercent(item.successRate)}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeTone(item.driftDetected ? 'rose' : 'emerald')}`}>
                        {item.driftDetected ? 'detected' : 'stable'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-300">{item.reason}</td>
                  </tr>
                ))}
                {!timeline.length && !loading && (
                  <tr>
                    <td colSpan={11} className="px-3 py-8 text-center text-slate-400">
                      Aucun événement timeline disponible avec les filtres actuels.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {!scopeReady && (
          <GlassCard variant="medium" className="mb-8" hover={false}>
            <div className="flex items-start gap-3">
              <RealIcon name="review" size={18} alt="Scope requis" />
              <div>
                <div className="text-lg font-semibold text-white">Scope requis avant chargement</div>
                <p className="mt-1 text-sm text-slate-400">
                  Pour éviter un agrégat ambigu entre plusieurs agents, la page charge les candidats seulement quand `agentName` et `taskType` sont définis.
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        {scopeReady && (
          <>
            <GlassGrid cols={4} className="mb-8">
              <GlassCard variant="light" hover={false}>
                <GlassStat label="Policies candidates" value={candidates.length} icon={<RealIcon name="agents" size={16} alt="Candidates" />} />
              </GlassCard>
              <GlassCard variant="light" hover={false}>
                <GlassStat label="Eligibles" value={eligibleCount} icon={<RealIcon name="review" size={16} alt="Eligibles" />} />
              </GlassCard>
              <GlassCard variant="light" hover={false}>
                <GlassStat label="Top avg score" value={formatScore(bestCandidate?.avgScore)} icon={<RealIcon name="dashboard" size={16} alt="Best" />} />
              </GlassCard>
              <GlassCard variant="light" hover={false}>
                <GlassStat label="Dernier run" value={formatDate(latestSnapshot?.run_finished_at || latestSnapshot?.created_at)} icon={<RealIcon name="logs" size={16} alt="Last run" />} />
              </GlassCard>
            </GlassGrid>

            <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr,0.95fr]">
              <GlassCard variant="dark" hover={false}>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white">Actions de gouvernance</h2>
                    <p className="mt-1 text-sm text-slate-400">Les actions s’appliquent au scope actuellement filtré.</p>
                  </div>
                  {loading && <div className="text-sm text-cyan-200">Chargement…</div>}
                </div>

                <div className="mb-5 flex flex-wrap gap-2">
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeTone('cyan')}`}>
                    Active: {shortHash(activeState?.policy_hash)}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeTone('slate')}`}>
                    Previous: {shortHash(activeState?.previous_policy_hash)}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeTone('amber')}`}>
                    Baseline score: {formatScore(activeState?.baseline_score)}
                  </span>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeTone('emerald')}`}>
                    Baseline success: {formatPercent(activeState?.baseline_success_rate)}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <GlassButton variant="secondary" loading={actionLoading === 'evaluate'} onClick={() => runAction('evaluate')}>
                    Evaluer challenger
                  </GlassButton>
                  <GlassButton variant="primary" loading={actionLoading === 'promote'} onClick={() => runAction('promote')}>
                    Promote
                  </GlassButton>
                  <GlassButton variant="danger" loading={actionLoading === 'rollback'} onClick={() => runAction('rollback')}>
                    Rollback
                  </GlassButton>
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                  <div className="font-semibold text-white">Rappel opératoire</div>
                  <p className="mt-2 text-slate-400">
                    Tu peux maintenant promouvoir une candidate précise depuis le tableau. Le backend conserve malgré tout les garde-fous de runs, de fenêtre et de gain minimum.
                  </p>
                  {selectedCandidateHash && (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeTone('cyan')}`}>
                        Candidate sélectionnée: {shortHash(selectedCandidateHash)}
                      </span>
                      <GlassButton
                        variant="primary"
                        size="sm"
                        loading={actionLoading === 'promote' && actionPolicyHash === selectedCandidateHash}
                        onClick={() => runAction('promote', selectedCandidateHash)}
                      >
                        Promote candidate sélectionnée
                      </GlassButton>
                    </div>
                  )}
                </div>
              </GlassCard>

              <GlassCard variant="medium" hover={false}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white">Comparaison A/B</h2>
                    <p className="mt-1 text-sm text-slate-400">Choisis deux candidates dans le tableau pour voir les deltas.</p>
                  </div>
                  <GlassButton variant="ghost" size="sm" onClick={() => {
                    setCompareA('')
                    setCompareB('')
                  }}>
                    Vider
                  </GlassButton>
                </div>

                {!comparison.comparable && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                    Sélectionne deux candidates distinctes avec les boutons A et B.
                  </div>
                )}

                {comparison.comparable && comparison.left && comparison.right && comparison.delta && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-4">
                        <div className="text-xs uppercase tracking-wide text-cyan-100">A</div>
                        <div className="mt-1 text-lg font-semibold text-white">{shortHash(comparison.left.policyHash)}</div>
                        <div className="mt-3 space-y-1 text-sm text-slate-200">
                          <div>Runs: {comparison.left.runs}</div>
                          <div>Score: {formatScore(comparison.left.avgScore)}</div>
                          <div>Std dev: {formatScore(comparison.left.scoreStdDev)}</div>
                          <div>Comparable: {formatPercent(comparison.left.comparableShare)}</div>
                          <div>Success: {formatPercent(comparison.left.successRate)}</div>
                          <div>Durée: {formatDuration(comparison.left.avgDurationSec)}</div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-xs uppercase tracking-wide text-slate-300">B</div>
                        <div className="mt-1 text-lg font-semibold text-white">{shortHash(comparison.right.policyHash)}</div>
                        <div className="mt-3 space-y-1 text-sm text-slate-200">
                          <div>Runs: {comparison.right.runs}</div>
                          <div>Score: {formatScore(comparison.right.avgScore)}</div>
                          <div>Std dev: {formatScore(comparison.right.scoreStdDev)}</div>
                          <div>Comparable: {formatPercent(comparison.right.comparableShare)}</div>
                          <div>Success: {formatPercent(comparison.right.successRate)}</div>
                          <div>Durée: {formatDuration(comparison.right.avgDurationSec)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                        <div className="text-xs uppercase tracking-wide text-slate-400">Delta score</div>
                        <div className={`mt-1 text-xl font-bold ${comparison.delta.score >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{comparison.delta.score >= 0 ? '+' : ''}{formatScore(comparison.delta.score)}</div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                        <div className="text-xs uppercase tracking-wide text-slate-400">Delta success</div>
                        <div className={`mt-1 text-xl font-bold ${comparison.delta.successRate >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{comparison.delta.successRate >= 0 ? '+' : ''}{formatPercent(comparison.delta.successRate)}</div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                        <div className="text-xs uppercase tracking-wide text-slate-400">Delta std dev</div>
                        <div className={`mt-1 text-xl font-bold ${comparison.delta.stdDev <= 0 ? 'text-emerald-300' : 'text-amber-200'}`}>{comparison.delta.stdDev >= 0 ? '+' : ''}{formatScore(comparison.delta.stdDev)}</div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                        <div className="text-xs uppercase tracking-wide text-slate-400">Delta comparable</div>
                        <div className={`mt-1 text-xl font-bold ${comparison.delta.comparableShare >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{comparison.delta.comparableShare >= 0 ? '+' : ''}{formatPercent(comparison.delta.comparableShare)}</div>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                        <div className="text-xs uppercase tracking-wide text-slate-400">Delta durée</div>
                        <div className={`mt-1 text-xl font-bold ${comparison.delta.durationSec <= 0 ? 'text-emerald-300' : 'text-amber-200'}`}>{comparison.delta.durationSec >= 0 ? '+' : ''}{formatDuration(comparison.delta.durationSec)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </GlassCard>
            </div>

            <GlassCard variant="dark" className="mb-8" hover={false}>
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Tableau des candidates</h2>
                  <p className="mt-1 text-sm text-slate-400">Affecte A/B, visualise la policy et repère immédiatement l’active et la précédente.</p>
                </div>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  {loading ? 'Synchronisation…' : `${candidates.length} candidate${candidates.length > 1 ? 's' : ''}`}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-200">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-3 py-3">Policy</th>
                      <th className="px-3 py-3">Résumé</th>
                      <th className="px-3 py-3">Runs</th>
                      <th className="px-3 py-3">Success</th>
                      <th className="px-3 py-3">Avg score</th>
                      <th className="px-3 py-3">Std dev</th>
                      <th className="px-3 py-3">Comparable</th>
                      <th className="px-3 py-3">Avg durée</th>
                      <th className="px-3 py-3">Dernier run</th>
                      <th className="px-3 py-3">Compare</th>
                      <th className="px-3 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((candidate) => {
                      const isActive = candidate.policyHash === activeState?.policy_hash
                      const isPrevious = candidate.policyHash === activeState?.previous_policy_hash
                      const isEligible = candidate.runs >= Number(thresholds.minRuns || '0')
                      return (
                        <tr key={candidate.policyHash} className="border-b border-white/5 align-top transition-colors hover:bg-white/[0.035]">
                          <td className="px-3 py-4">
                            <div className="font-semibold text-white">{shortHash(candidate.policyHash)}</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {isActive && <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badgeTone('cyan')}`}>Active</span>}
                              {isPrevious && <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badgeTone('amber')}`}>Previous</span>}
                              {isEligible ? <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badgeTone('emerald')}`}>Eligible</span> : <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badgeTone('rose')}`}>Sous seuil</span>}
                            </div>
                          </td>
                          <td className="max-w-md px-3 py-4 text-xs text-slate-300">
                            <div className="line-clamp-3">{summarizePolicy(candidate.policy)}</div>
                          </td>
                          <td className="px-3 py-4 font-medium text-white">{candidate.runs}</td>
                          <td className="px-3 py-4">{formatPercent(candidate.successRate)}</td>
                          <td className="px-3 py-4">{formatScore(candidate.avgScore)}</td>
                          <td className="px-3 py-4">{formatScore(candidate.scoreStdDev)}</td>
                          <td className="px-3 py-4">{formatPercent(candidate.comparableShare)}</td>
                          <td className="px-3 py-4">{formatDuration(candidate.avgDurationSec)}</td>
                          <td className="px-3 py-4 text-xs text-slate-400">{formatDate(candidate.latestAt)}</td>
                          <td className="px-3 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button type="button" onClick={() => setCompareA(candidate.policyHash)} className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${compareA === candidate.policyHash ? 'border-cyan-300 bg-cyan-500/20 text-cyan-100' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-cyan-400/40 hover:text-cyan-100'}`}>
                                A
                              </button>
                              <button type="button" onClick={() => setCompareB(candidate.policyHash)} className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${compareB === candidate.policyHash ? 'border-white/40 bg-white/10 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white'}`}>
                                B
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedCandidateHash(candidate.policyHash)}
                                className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${selectedCandidateHash === candidate.policyHash ? 'border-cyan-300 bg-cyan-500/20 text-cyan-100' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-cyan-400/40 hover:text-cyan-100'}`}
                              >
                                Sélectionner
                              </button>
                              <GlassButton
                                variant={isActive ? 'ghost' : 'secondary'}
                                size="sm"
                                disabled={isActive}
                                loading={actionLoading === 'promote' && actionPolicyHash === candidate.policyHash}
                                onClick={() => runAction('promote', candidate.policyHash)}
                                className="!px-3 !py-1.5"
                              >
                                {isActive ? 'Active' : 'Promote'}
                              </GlassButton>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {!candidates.length && !loading && (
                      <tr>
                        <td colSpan={11} className="px-3 py-8 text-center text-slate-400">
                          Aucune candidate remontée pour ce scope et cette fenêtre.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            <GlassCard variant="dark" className="mb-8" hover={false}>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Audit promotion / rollback</h2>
                  <p className="mt-1 text-sm text-slate-400">Timeline des décisions, refus et rollbacks pour le scope actif.</p>
                </div>
                <div className="text-xs uppercase tracking-wide text-slate-400">{audit.length} événements</div>
              </div>

              <div className="space-y-3">
                {audit.map((entry) => {
                  const tone = entry.action === 'promote'
                    ? 'emerald'
                    : entry.action === 'rollback'
                      ? 'rose'
                      : entry.action === 'evaluate'
                        ? 'cyan'
                        : 'slate'

                  return (
                    <div key={entry.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${badgeTone(tone)}`}>
                              {labelAction(entry.action)}
                            </span>
                            <span className="text-sm font-semibold text-white">{entry.reason}</span>
                            <span className="text-xs text-slate-500">{formatDate(entry.createdAt)}</span>
                          </div>
                          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3 text-sm">
                            <div>
                              <div className="text-xs uppercase tracking-wide text-slate-500">Candidate</div>
                              <div className="mt-1 text-slate-200">{shortHash(entry.candidatePolicyHash)}</div>
                            </div>
                            <div>
                              <div className="text-xs uppercase tracking-wide text-slate-500">Baseline</div>
                              <div className="mt-1 text-slate-200">{shortHash(entry.baselinePolicyHash)}</div>
                            </div>
                            <div>
                              <div className="text-xs uppercase tracking-wide text-slate-500">Stage</div>
                              <div className="mt-1 text-slate-200">{entry.stage || '—'}</div>
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-slate-400">{summarizeAuditMetrics(entry.metrics)}</div>
                        </div>
                        {entry.candidatePolicyHash && entry.action !== 'rollback' && (
                          <GlassButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCandidateHash(entry.candidatePolicyHash || '')
                              if (entry.candidatePolicyHash) {
                                setCompareA(entry.candidatePolicyHash)
                              }
                            }}
                          >
                            Recharger candidate
                          </GlassButton>
                        )}
                      </div>
                    </div>
                  )
                })}

                {!audit.length && !loading && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-400">
                    Aucun événement d’audit disponible pour ce scope.
                  </div>
                )}
              </div>
            </GlassCard>

            <GlassCard variant="medium" hover={false}>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Runs récents</h2>
                  <p className="mt-1 text-sm text-slate-400">Derniers snapshots utilisés pour la gouvernance du scope sélectionné.</p>
                </div>
                <div className="text-xs uppercase tracking-wide text-slate-400">{snapshots.length} snapshots</div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-200">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-3 py-3">Job</th>
                      <th className="px-3 py-3">Stage</th>
                      <th className="px-3 py-3">Score</th>
                      <th className="px-3 py-3">Success</th>
                      <th className="px-3 py-3">Durée</th>
                      <th className="px-3 py-3">Fin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.slice(0, 10).map((snapshot, index) => (
                      <tr key={snapshot.id || `${snapshot.job_name || 'job'}-${index}`} className="border-b border-white/5 transition-colors hover:bg-white/[0.035]">
                        <td className="px-3 py-3 text-white">{snapshot.job_name || '—'}</td>
                        <td className="px-3 py-3 text-slate-300">{snapshot.stage || '—'}</td>
                        <td className="px-3 py-3">{formatScore(snapshot.score)}</td>
                        <td className="px-3 py-3">{snapshot.success == null ? '—' : snapshot.success ? 'OK' : 'KO'}</td>
                        <td className="px-3 py-3">{formatDuration(snapshot.duration_sec)}</td>
                        <td className="px-3 py-3 text-xs text-slate-400">{formatDate(snapshot.run_finished_at || snapshot.created_at)}</td>
                      </tr>
                    ))}
                    {!snapshots.length && !loading && (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                          Aucun snapshot disponible pour ce scope.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </div>
  )
}