import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { ensureAgentLearningSchema } from './agent-performance'

export interface PolicySnapshotFilter {
  agentName?: string
  taskType?: string
  cohortKey?: string
  stage?: string
  jobName?: string
  from?: string
  to?: string
  limit?: number
}

export interface PolicyCandidateSummary {
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

export interface PolicyAuditEntry {
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

export interface ActivePolicyBoardRow {
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

export interface PolicyTimelineEntry {
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

export interface PolicyPromotionDecision {
  promoted: boolean
  rolledBack: boolean
  reason: string
  activePolicyHash: string | null
  previousPolicyHash: string | null
  candidate?: PolicyCandidateSummary
  baseline?: PolicyCandidateSummary
}

interface PromotionThresholds {
  minRuns: number
  minWindowHours: number
  minGainScore: number
  rollbackDropScore: number
  maxScoreStdDev: number
  minComparableShare: number
}

export interface CohortBanditChoice {
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

export interface DiscoveryEnrichmentBanditPlan {
  generatedAt: string
  discovery: CohortBanditChoice[]
  enrichment: CohortBanditChoice[]
}

export interface PolicyAllocationEntry {
  id: string
  agentName: string
  taskType: string
  cohortKey: string
  chosenPolicyHash: string | null
  previousPolicyHash: string | null
  strategy: string
  transition: 'initial' | 'switch' | 'stable'
  candidates: Array<{ policyHash: string; runs: number; avgScore: number; ucbScore: number }>
  createdAt: string
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number(value || 0)))
}

function toIsoDate(value?: string): string | null {
  if (!value) return null
  const t = new Date(value)
  if (!Number.isFinite(t.getTime())) return null
  return t.toISOString()
}

function parseThresholds(input?: Partial<PromotionThresholds>): PromotionThresholds {
  return {
    minRuns: Math.max(1, Number(input?.minRuns ?? process.env.ALS_POLICY_MIN_RUNS ?? 8)),
    minWindowHours: Math.max(
      1,
      Number(input?.minWindowHours ?? process.env.ALS_POLICY_MIN_WINDOW_HOURS ?? 24),
    ),
    minGainScore: Math.max(
      0,
      Number(input?.minGainScore ?? process.env.ALS_POLICY_MIN_GAIN_SCORE ?? 0.04),
    ),
    rollbackDropScore: Math.max(
      0,
      Number(input?.rollbackDropScore ?? process.env.ALS_POLICY_ROLLBACK_DROP_SCORE ?? 0.06),
    ),
    maxScoreStdDev: Math.max(
      0.01,
      Number(input?.maxScoreStdDev ?? process.env.ALS_POLICY_MAX_STDDEV ?? 0.22),
    ),
    minComparableShare: Math.max(
      0,
      Math.min(1, Number(input?.minComparableShare ?? process.env.ALS_POLICY_MIN_COMPARABLE_SHARE ?? 0.6)),
    ),
  }
}

function normalizeCohortKey(input?: string): string {
  return String(input || 'global').trim().slice(0, 80) || 'global'
}

function scopedTaskType(taskType: string, cohortKey?: string): string {
  const base = String(taskType || 'generic').trim().slice(0, 80) || 'generic'
  const cohort = normalizeCohortKey(cohortKey)
  if (cohort === 'global') return base
  const suffix = `@cohort:${cohort}`
  return `${base}${suffix}`.slice(0, 120)
}

function unscopedTaskType(scopedTask: string): { taskType: string; cohortKey: string } {
  const raw = String(scopedTask || 'generic')
  const marker = '@cohort:'
  const idx = raw.indexOf(marker)
  if (idx < 0) return { taskType: raw, cohortKey: 'global' }
  return {
    taskType: raw.slice(0, idx) || 'generic',
    cohortKey: normalizeCohortKey(raw.slice(idx + marker.length)),
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`

  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`
}

function hashPolicy(policy: Record<string, unknown>): string {
  const canonical = stableStringify(policy || {})
  return crypto.createHash('sha256').update(canonical).digest('hex').slice(0, 24)
}

async function insertPolicyAudit(params: {
  agentName: string
  taskType: string
  cohortKey?: string
  stage?: string
  action: 'promote' | 'rollback' | 'evaluate' | 'skip'
  reason: string
  candidatePolicyHash?: string | null
  baselinePolicyHash?: string | null
  metrics?: Record<string, unknown>
}): Promise<void> {
  await ensureAgentLearningSchema()

  const id = `apa_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO agent_policy_audit (
        id,
        agent_name,
        task_type,
        cohort_key,
        stage,
        action,
        reason,
        candidate_policy_hash,
        baseline_policy_hash,
        metrics,
        created_at
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10::jsonb,
        now()
      )
    `,
    id,
    String(params.agentName || 'unknown').trim().slice(0, 80) || 'unknown',
    String(params.taskType || 'generic').trim().slice(0, 80) || 'generic',
    normalizeCohortKey(params.cohortKey),
    String(params.stage || 'unknown').trim().slice(0, 80) || 'unknown',
    params.action,
    String(params.reason || '').slice(0, 280),
    params.candidatePolicyHash || null,
    params.baselinePolicyHash || null,
    JSON.stringify(params.metrics || {}),
  )
}

export async function listPolicySnapshots(
  filter?: PolicySnapshotFilter,
): Promise<Array<Record<string, unknown>>> {
  await ensureAgentLearningSchema()

  const safeLimit = Math.max(1, Math.min(500, Number(filter?.limit || 120)))
  const where: string[] = []
  const values: unknown[] = []

  if (filter?.agentName) {
    values.push(String(filter.agentName).trim())
    where.push(`agent_name = $${values.length}`)
  }
  if (filter?.taskType) {
    values.push(String(filter.taskType).trim())
    where.push(`task_type = $${values.length}`)
  }
  if (filter?.cohortKey) {
    values.push(normalizeCohortKey(filter.cohortKey))
    where.push(`cohort_key = $${values.length}`)
  }
  if (filter?.stage) {
    values.push(String(filter.stage).trim())
    where.push(`stage = $${values.length}`)
  }
  if (filter?.jobName) {
    values.push(String(filter.jobName).trim())
    where.push(`job_name = $${values.length}`)
  }

  const fromIso = toIsoDate(filter?.from)
  if (fromIso) {
    values.push(new Date(fromIso))
    where.push(`created_at >= $${values.length}`)
  }

  const toIso = toIsoDate(filter?.to)
  if (toIso) {
    values.push(new Date(toIso))
    where.push(`created_at <= $${values.length}`)
  }

  values.push(safeLimit)
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `
      SELECT *
      FROM agent_policy_snapshots
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${values.length}
    `,
    ...values,
  )

  return rows
}

export async function listPolicyAudit(
  filter?: PolicySnapshotFilter,
): Promise<PolicyAuditEntry[]> {
  await ensureAgentLearningSchema()

  const safeLimit = Math.max(1, Math.min(1000, Number(filter?.limit || 80)))
  const where: string[] = []
  const values: unknown[] = []

  if (filter?.agentName) {
    values.push(String(filter.agentName).trim())
    where.push(`agent_name = $${values.length}`)
  }
  if (filter?.taskType) {
    values.push(String(filter.taskType).trim())
    where.push(`task_type = $${values.length}`)
  }
  if (filter?.cohortKey) {
    values.push(normalizeCohortKey(filter.cohortKey))
    where.push(`cohort_key = $${values.length}`)
  }
  if (filter?.stage) {
    values.push(String(filter.stage).trim())
    where.push(`stage = $${values.length}`)
  }

  const fromIso = toIsoDate(filter?.from)
  if (fromIso) {
    values.push(new Date(fromIso))
    where.push(`created_at >= $${values.length}`)
  }

  const toIso = toIsoDate(filter?.to)
  if (toIso) {
    values.push(new Date(toIso))
    where.push(`created_at <= $${values.length}`)
  }

  values.push(safeLimit)
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `
      SELECT *
      FROM agent_policy_audit
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${values.length}
    `,
    ...values,
  )

  return rows.map((row) => ({
    id: String(row.id || ''),
    agentName: String(row.agent_name || ''),
    taskType: String(row.task_type || ''),
    cohortKey: normalizeCohortKey(String(row.cohort_key || 'global')),
    stage: String(row.stage || ''),
    action: String(row.action || ''),
    reason: String(row.reason || ''),
    candidatePolicyHash: row.candidate_policy_hash ? String(row.candidate_policy_hash) : null,
    baselinePolicyHash: row.baseline_policy_hash ? String(row.baseline_policy_hash) : null,
    metrics: row.metrics && typeof row.metrics === 'object' ? (row.metrics as Record<string, unknown>) : {},
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at || new Date().toISOString()),
  }))
}

function metricNumber(metrics: Record<string, unknown>, key: string): number | null {
  const value = metrics[key]
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function toIso(value: unknown): string | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(String(value))
  return Number.isFinite(d.getTime()) ? d.toISOString() : null
}

function evaluateStatisticalGuards(params: {
  candidate: PolicyCandidateSummary
  baseline: PolicyCandidateSummary
  thresholds: PromotionThresholds
}): { passed: boolean; reason: string; gain: number; successGuard: boolean; stdGuard: boolean; comparableGuard: boolean } {
  const gain = params.candidate.avgScore - params.baseline.avgScore
  const successGuard = params.candidate.successRate >= params.baseline.successRate - 0.03
  const stdGuard = params.candidate.scoreStdDev <= params.thresholds.maxScoreStdDev
  const comparableGuard =
    params.candidate.comparableShare >= params.thresholds.minComparableShare
    && params.baseline.comparableShare >= params.thresholds.minComparableShare

  if (gain < params.thresholds.minGainScore) {
    return { passed: false, reason: 'gain_below_threshold', gain, successGuard, stdGuard, comparableGuard }
  }
  if (!successGuard) {
    return { passed: false, reason: 'success_rate_regression', gain, successGuard, stdGuard, comparableGuard }
  }
  if (!stdGuard) {
    return { passed: false, reason: 'variance_too_high', gain, successGuard, stdGuard, comparableGuard }
  }
  if (!comparableGuard) {
    return { passed: false, reason: 'dataset_not_comparable', gain, successGuard, stdGuard, comparableGuard }
  }

  return { passed: true, reason: 'ok', gain, successGuard, stdGuard, comparableGuard }
}

export async function listActivePolicyBoard(filter?: PolicySnapshotFilter): Promise<ActivePolicyBoardRow[]> {
  await ensureAgentLearningSchema()

  const thresholds = parseThresholds()
  const safeLimit = Math.max(1, Math.min(200, Number(filter?.limit || 50)))
  const where: string[] = []
  const values: unknown[] = []

  if (filter?.agentName) {
    values.push(String(filter.agentName).trim())
    where.push(`agent_name = $${values.length}`)
  }
  if (filter?.taskType) {
    const baseTaskType = String(filter.taskType).trim()
    values.push(baseTaskType)
    const eqRef = `$${values.length}`
    values.push(`${baseTaskType}@cohort:%`)
    const likeRef = `$${values.length}`
    where.push(`(task_type = ${eqRef} OR task_type LIKE ${likeRef})`)
  }
  if (filter?.stage) {
    values.push(String(filter.stage).trim())
    where.push(`stage = $${values.length}`)
  }

  values.push(safeLimit)
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const states = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `
      SELECT *
      FROM agent_policy_state
      ${whereSql}
      ORDER BY updated_at DESC
      LIMIT $${values.length}
    `,
    ...values,
  )

  if (!states.length) return []

  const audits = await listPolicyAudit({
    agentName: filter?.agentName,
    taskType: filter?.taskType,
    cohortKey: filter?.cohortKey,
    stage: filter?.stage,
    from: filter?.from,
    to: filter?.to,
    limit: Math.max(200, states.length * 20),
  })

  const groupedAudits = new Map<string, PolicyAuditEntry[]>()
  for (const entry of audits) {
    const key = `${entry.agentName}::${entry.taskType}::${entry.cohortKey}`
    const arr = groupedAudits.get(key) || []
    arr.push(entry)
    groupedAudits.set(key, arr)
  }

  const rows: ActivePolicyBoardRow[] = []
  for (const state of states) {
    const agentName = String(state.agent_name || '')
    const parsedTask = unscopedTaskType(String(state.task_type || ''))
    const taskType = parsedTask.taskType
    const cohortKey = parsedTask.cohortKey
    const stage = String(state.stage || 'unknown')
    const policyHash = String(state.policy_hash || '')
    if (filter?.cohortKey && normalizeCohortKey(filter.cohortKey) !== cohortKey) {
      continue
    }
    const key = `${agentName}::${taskType}::${cohortKey}`

    const candidates = await summarizePolicyCandidates({
      agentName,
      taskType,
      cohortKey,
      stage,
      from: filter?.from,
      to: filter?.to,
      limit: 500,
    })

    const active = candidates.find((item) => item.policyHash === policyHash)
    const baselineScore = Number(state.baseline_score || 0)
    const baselineSuccessRate = clamp01(Number(state.baseline_success_rate || 0))
    const perfDeltaScore = active ? Number((active.avgScore - baselineScore).toFixed(6)) : null
    const perfDeltaSuccessRate = active ? Number((active.successRate - baselineSuccessRate).toFixed(6)) : null

    let risk: ActivePolicyBoardRow['risk'] = 'safe'
    let drift: ActivePolicyBoardRow['drift'] = 'unknown'
    let status: ActivePolicyBoardRow['status'] = 'active'

    if (active) {
      const drop = baselineScore - active.avgScore
      if (drop >= thresholds.rollbackDropScore) {
        risk = 'high'
        drift = 'detected'
        status = 'degraded'
      } else if (drop >= thresholds.rollbackDropScore / 2) {
        risk = 'medium'
        drift = 'rising'
        status = 'watch'
      } else {
        risk = 'low'
        drift = 'stable'
        status = 'active'
      }
    }

    const entryAudits = (groupedAudits.get(key) || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    const lastPromotion = entryAudits.find((item) => item.action === 'promote')
    const lastRollback = entryAudits.find((item) => item.action === 'rollback')

    rows.push({
      agentName,
      taskType,
      cohortKey,
      stage,
      policyHash,
      promotedAt: toIso(state.promoted_at),
      updatedAt: toIso(state.updated_at),
      lastPromotionAt: lastPromotion?.createdAt || null,
      lastRollbackAt: lastRollback?.createdAt || null,
      baselineScore,
      baselineSuccessRate,
      runs: active?.runs || 0,
      avgScore: active ? active.avgScore : null,
      successRate: active ? active.successRate : null,
      perfDeltaScore,
      perfDeltaSuccessRate,
      risk,
      drift,
      status,
    })
  }

  return rows.sort(
    (a, b) =>
      new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime() ||
      b.runs - a.runs,
  )
}

export async function listPolicyTimeline(filter?: PolicySnapshotFilter): Promise<PolicyTimelineEntry[]> {
  const safeLimit = Math.max(1, Math.min(500, Number(filter?.limit || 120)))
  const audits = await listPolicyAudit({
    agentName: filter?.agentName,
    taskType: filter?.taskType,
    cohortKey: filter?.cohortKey,
    stage: filter?.stage,
    from: filter?.from,
    to: filter?.to,
    limit: Math.max(200, safeLimit * 8),
  })

  if (!audits.length) return []

  const groups = new Map<string, PolicyAuditEntry[]>()
  for (const entry of audits) {
    const key = `${entry.agentName}::${entry.taskType}::${entry.cohortKey}`
    const arr = groups.get(key) || []
    arr.push(entry)
    groups.set(key, arr)
  }

  const timeline: PolicyTimelineEntry[] = []

  for (const [key, entries] of groups.entries()) {
    const [agentName, taskType, cohortKey] = key.split('::')
    const ordered = [...entries].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )

    const firstSeenByPolicy = new Map<string, string>()
    for (const item of ordered) {
      const candidate = item.candidatePolicyHash || null
      const baseline = item.baselinePolicyHash || null
      if (candidate && !firstSeenByPolicy.has(candidate)) firstSeenByPolicy.set(candidate, item.createdAt)
      if (baseline && !firstSeenByPolicy.has(baseline)) firstSeenByPolicy.set(baseline, item.createdAt)
    }

    for (let i = 0; i < ordered.length; i += 1) {
      const event = ordered[i]
      if (event.action !== 'promote' || !event.candidatePolicyHash) continue

      const policyHash = event.candidatePolicyHash
      const promotedAtMs = new Date(event.createdAt).getTime()
      if (!Number.isFinite(promotedAtMs)) continue

      let lifecycle: PolicyTimelineEntry['lifecycle'] = 'active'
      let rollbackAt: string | null = null
      let reason = 'active_policy'
      let driftDetected = false
      let endAtMs = Date.now()

      for (let j = i + 1; j < ordered.length; j += 1) {
        const next = ordered[j]

        if (next.action === 'rollback' && next.baselinePolicyHash === policyHash) {
          lifecycle = 'rolled_back'
          rollbackAt = next.createdAt
          reason = next.reason || 'rollback'
          driftDetected = true
          endAtMs = new Date(next.createdAt).getTime()
          break
        }

        if (next.action === 'promote' && next.candidatePolicyHash && next.candidatePolicyHash !== policyHash) {
          lifecycle = 'superseded'
          reason = 'superseded_by_new_promotion'
          endAtMs = new Date(next.createdAt).getTime()
          break
        }
      }

      const gainScore = metricNumber(event.metrics, 'gain')
      const successRate =
        metricNumber(event.metrics, 'candidateSuccessRate')
        ?? metricNumber(event.metrics, 'challengerSuccessRate')
        ?? metricNumber(event.metrics, 'baselineSuccessRate')

      timeline.push({
        agentName,
        taskType,
        cohortKey: normalizeCohortKey(cohortKey),
        stage: event.stage || 'unknown',
        policyHash,
        createdAt: firstSeenByPolicy.get(policyHash) || event.createdAt,
        promotedAt: event.createdAt,
        rollbackAt,
        activeDurationSec: Math.max(0, Math.floor((endAtMs - promotedAtMs) / 1000)),
        reason,
        gainScore,
        successRate,
        driftDetected,
        lifecycle,
      })
    }
  }

  return timeline
    .sort((a, b) => new Date(b.promotedAt).getTime() - new Date(a.promotedAt).getTime())
    .slice(0, safeLimit)
}

export async function summarizePolicyCandidates(
  filter?: PolicySnapshotFilter,
): Promise<PolicyCandidateSummary[]> {
  const rows = await listPolicySnapshots(filter)
  const acc = new Map<
    string,
    {
      policy: Record<string, unknown>
      runs: number
      success: number
      scoreSum: number
      scoreSumSq: number
      durationSum: number
      jobCounts: Map<string, number>
      latestAt: string
    }
  >()

  for (const row of rows) {
    const policy = row.policy && typeof row.policy === 'object' ? (row.policy as Record<string, unknown>) : {}
    const policyHash = hashPolicy(policy)
    const score = row.score == null ? null : Number(row.score)
    const success = row.success === true
    const duration = row.duration_sec == null ? 0 : Number(row.duration_sec)
    const jobName = String(row.job_name || '').trim() || 'unknown'
    const finishedAt = row.run_finished_at
    const createdAt = row.created_at

    if (!Number.isFinite(score ?? NaN)) continue
    if (!finishedAt && !createdAt) continue

    const iso =
      finishedAt instanceof Date
        ? finishedAt.toISOString()
        : createdAt instanceof Date
          ? createdAt.toISOString()
          : String(finishedAt || createdAt || new Date().toISOString())

    const prev = acc.get(policyHash) || {
      policy,
      runs: 0,
      success: 0,
      scoreSum: 0,
      scoreSumSq: 0,
      durationSum: 0,
      jobCounts: new Map<string, number>(),
      latestAt: iso,
    }

    prev.runs += 1
    prev.success += success ? 1 : 0
    prev.scoreSum += Number(score || 0)
    prev.scoreSumSq += Number((score || 0) ** 2)
    prev.durationSum += Number(duration || 0)
    prev.jobCounts.set(jobName, Number(prev.jobCounts.get(jobName) || 0) + 1)
    if (new Date(iso).getTime() > new Date(prev.latestAt).getTime()) prev.latestAt = iso
    acc.set(policyHash, prev)
  }

  return [...acc.entries()]
    .map(([policyHash, item]) => {
      const constRuns = Math.max(1, item.runs)
      const avgScoreRaw = item.scoreSum / constRuns
      const varianceRaw = (item.scoreSumSq / constRuns) - (avgScoreRaw ** 2)
      const sortedJobs = [...item.jobCounts.entries()].sort((a, b) => b[1] - a[1])

      return {
        policyHash,
        policy: item.policy,
        runs: item.runs,
        successRate: item.runs > 0 ? Number((item.success / item.runs).toFixed(6)) : 0,
        avgScore: item.runs > 0 ? Number(avgScoreRaw.toFixed(6)) : 0,
        scoreStdDev: item.runs > 1 ? Number(Math.sqrt(Math.max(0, varianceRaw)).toFixed(6)) : 0,
        comparableShare: item.runs > 0 ? Number(((sortedJobs[0]?.[1] || 0) / constRuns).toFixed(6)) : 0,
        dominantJobName: sortedJobs[0]?.[0] || null,
        avgDurationSec: item.runs > 0 ? Number((item.durationSum / item.runs).toFixed(6)) : 0,
        latestAt: item.latestAt,
      }
    })
    .sort((a, b) => b.avgScore - a.avgScore || a.scoreStdDev - b.scoreStdDev || b.successRate - a.successRate || b.runs - a.runs)
}

export async function getActivePolicyState(
  agentName: string,
  taskType: string,
  cohortKey = 'global',
): Promise<Record<string, unknown> | null> {
  await ensureAgentLearningSchema()
  const scopedTask = scopedTaskType(taskType, cohortKey)

  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `
      SELECT *
      FROM agent_policy_state
      WHERE agent_name = $1
        AND task_type = $2
      LIMIT 1
    `,
    String(agentName || 'unknown').trim(),
    scopedTask,
  )

  return rows[0] || null
}

async function setActivePolicyState(params: {
  agentName: string
  taskType: string
  cohortKey?: string
  stage?: string
  candidate: PolicyCandidateSummary
  baseline?: PolicyCandidateSummary | null
}): Promise<void> {
  await ensureAgentLearningSchema()
  const cohortKey = normalizeCohortKey(params.cohortKey)
  const scopedTask = scopedTaskType(params.taskType, cohortKey)

  const row = await getActivePolicyState(params.agentName, params.taskType, cohortKey)
  const previousHash = row ? String(row.policy_hash || '') : null
  const previousPolicy = row && row.policy && typeof row.policy === 'object' ? (row.policy as Record<string, unknown>) : null
  const previousBaselineScore = row?.baseline_score == null ? null : Number(row.baseline_score)
  const previousBaselineSuccessRate =
    row?.baseline_success_rate == null ? null : Number(row.baseline_success_rate)
  const previousBaselineRuns = row?.baseline_runs == null ? null : Number(row.baseline_runs)

  const baseline = params.baseline || null

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO agent_policy_state (
        agent_name,
        task_type,
        stage,
        policy_hash,
        policy,
        baseline_score,
        baseline_success_rate,
        baseline_runs,
        promoted_at,
        previous_policy_hash,
        previous_policy,
        previous_baseline_score,
        previous_baseline_success_rate,
        previous_baseline_runs,
        updated_at
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5::jsonb,
        $6,
        $7,
        $8,
        now(),
        $9,
        $10::jsonb,
        $11,
        $12,
        $13,
        now()
      )
      ON CONFLICT (agent_name, task_type)
      DO UPDATE SET
        stage = EXCLUDED.stage,
        policy_hash = EXCLUDED.policy_hash,
        policy = EXCLUDED.policy,
        baseline_score = EXCLUDED.baseline_score,
        baseline_success_rate = EXCLUDED.baseline_success_rate,
        baseline_runs = EXCLUDED.baseline_runs,
        promoted_at = EXCLUDED.promoted_at,
        previous_policy_hash = EXCLUDED.previous_policy_hash,
        previous_policy = EXCLUDED.previous_policy,
        previous_baseline_score = EXCLUDED.previous_baseline_score,
        previous_baseline_success_rate = EXCLUDED.previous_baseline_success_rate,
        previous_baseline_runs = EXCLUDED.previous_baseline_runs,
        updated_at = now()
    `,
    String(params.agentName || 'unknown').trim().slice(0, 80),
    scopedTask,
    String(params.stage || 'unknown').trim().slice(0, 80),
    params.candidate.policyHash,
    JSON.stringify(params.candidate.policy || {}),
    baseline ? baseline.avgScore : params.candidate.avgScore,
    baseline ? baseline.successRate : params.candidate.successRate,
    baseline ? baseline.runs : params.candidate.runs,
    previousHash,
    JSON.stringify(previousPolicy || {}),
    previousBaselineScore,
    previousBaselineSuccessRate,
    previousBaselineRuns,
  )
}

export async function runPolicyPromotionDecision(params: {
  agentName: string
  taskType: string
  cohortKey?: string
  stage?: string
  thresholds?: Partial<PromotionThresholds>
}): Promise<PolicyPromotionDecision> {
  const agentName = String(params.agentName || 'unknown').trim().slice(0, 80) || 'unknown'
  const taskType = String(params.taskType || 'generic').trim().slice(0, 80) || 'generic'
  const cohortKey = normalizeCohortKey(params.cohortKey)
  const stage = String(params.stage || 'unknown').trim().slice(0, 80) || 'unknown'
  const thresholds = parseThresholds(params.thresholds)

  const from = new Date(Date.now() - thresholds.minWindowHours * 3600_000).toISOString()
  const candidates = await summarizePolicyCandidates({ agentName, taskType, cohortKey, stage, from, limit: 600 })
  const eligible = candidates.filter((c) => c.runs >= thresholds.minRuns)

  if (eligible.length === 0) {
    await insertPolicyAudit({
      agentName,
      taskType,
      stage,
      cohortKey,
      action: 'skip',
      reason: 'insufficient_runs',
      metrics: { minRuns: thresholds.minRuns, observedCandidates: candidates.length },
    })

    return {
      promoted: false,
      rolledBack: false,
      reason: 'insufficient_runs',
      activePolicyHash: null,
      previousPolicyHash: null,
    }
  }

  const state = await getActivePolicyState(agentName, taskType, cohortKey)
  const activeHash = state ? String(state.policy_hash || '') : ''
  const baseline = eligible.find((c) => c.policyHash === activeHash) || (activeHash ? undefined : eligible[0])
  const challenger = eligible.find((c) => c.policyHash !== activeHash)

  if (!state && eligible[0]) {
    await setActivePolicyState({ agentName, taskType, cohortKey, stage, candidate: eligible[0], baseline: eligible[0] })
    await insertPolicyAudit({
      agentName,
      taskType,
      cohortKey,
      stage,
      action: 'promote',
      reason: 'initial_policy_selection',
      candidatePolicyHash: eligible[0].policyHash,
      baselinePolicyHash: null,
      metrics: { avgScore: eligible[0].avgScore, successRate: eligible[0].successRate, runs: eligible[0].runs },
    })

    return {
      promoted: true,
      rolledBack: false,
      reason: 'initial_policy_selection',
      activePolicyHash: eligible[0].policyHash,
      previousPolicyHash: null,
      candidate: eligible[0],
      baseline: eligible[0],
    }
  }

  if (!baseline || !challenger) {
    await insertPolicyAudit({
      agentName,
      taskType,
      stage,
      cohortKey,
      action: 'skip',
      reason: 'no_challenger_or_baseline',
      candidatePolicyHash: challenger?.policyHash || null,
      baselinePolicyHash: baseline?.policyHash || activeHash || null,
    })

    return {
      promoted: false,
      rolledBack: false,
      reason: 'no_challenger_or_baseline',
      activePolicyHash: activeHash || null,
      previousPolicyHash: state?.previous_policy_hash ? String(state.previous_policy_hash) : null,
      candidate: challenger,
      baseline,
    }
  }

  const guard = evaluateStatisticalGuards({ candidate: challenger, baseline, thresholds })

  if (!guard.passed) {
    await insertPolicyAudit({
      agentName,
      taskType,
      cohortKey,
      stage,
      action: 'skip',
      reason: guard.reason,
      candidatePolicyHash: challenger.policyHash,
      baselinePolicyHash: baseline.policyHash,
      metrics: {
        gain: guard.gain,
        minGainScore: thresholds.minGainScore,
        successGuard: guard.successGuard,
        stdGuard: guard.stdGuard,
        comparableGuard: guard.comparableGuard,
        maxScoreStdDev: thresholds.maxScoreStdDev,
        minComparableShare: thresholds.minComparableShare,
        challengerSuccessRate: challenger.successRate,
        challengerScoreStdDev: challenger.scoreStdDev,
        challengerComparableShare: challenger.comparableShare,
        baselineSuccessRate: baseline.successRate,
        baselineScoreStdDev: baseline.scoreStdDev,
        baselineComparableShare: baseline.comparableShare,
      },
    })

    return {
      promoted: false,
      rolledBack: false,
      reason: guard.reason,
      activePolicyHash: activeHash || baseline.policyHash,
      previousPolicyHash: state?.previous_policy_hash ? String(state.previous_policy_hash) : null,
      candidate: challenger,
      baseline,
    }
  }

  await setActivePolicyState({ agentName, taskType, cohortKey, stage, candidate: challenger, baseline })
  await insertPolicyAudit({
    agentName,
    taskType,
    cohortKey,
    stage,
    action: 'promote',
    reason: 'challenger_outperformed',
    candidatePolicyHash: challenger.policyHash,
    baselinePolicyHash: baseline.policyHash,
    metrics: {
      gain: guard.gain,
      minGainScore: thresholds.minGainScore,
      maxScoreStdDev: thresholds.maxScoreStdDev,
      minComparableShare: thresholds.minComparableShare,
      challengerAvgScore: challenger.avgScore,
      challengerScoreStdDev: challenger.scoreStdDev,
      challengerComparableShare: challenger.comparableShare,
      baselineAvgScore: baseline.avgScore,
      baselineScoreStdDev: baseline.scoreStdDev,
      baselineComparableShare: baseline.comparableShare,
      challengerRuns: challenger.runs,
      baselineRuns: baseline.runs,
    },
  })

  return {
    promoted: true,
    rolledBack: false,
    reason: 'challenger_outperformed',
    activePolicyHash: challenger.policyHash,
    previousPolicyHash: baseline.policyHash,
    candidate: challenger,
    baseline,
  }
}

export async function runPolicyRollbackCheck(params: {
  agentName: string
  taskType: string
  cohortKey?: string
  stage?: string
  thresholds?: Partial<PromotionThresholds>
}): Promise<PolicyPromotionDecision> {
  const agentName = String(params.agentName || 'unknown').trim().slice(0, 80) || 'unknown'
  const taskType = String(params.taskType || 'generic').trim().slice(0, 80) || 'generic'
  const cohortKey = normalizeCohortKey(params.cohortKey)
  const stage = String(params.stage || 'unknown').trim().slice(0, 80) || 'unknown'
  const thresholds = parseThresholds(params.thresholds)

  const state = await getActivePolicyState(agentName, taskType, cohortKey)
  if (!state || !state.policy_hash) {
    return {
      promoted: false,
      rolledBack: false,
      reason: 'no_active_policy',
      activePolicyHash: null,
      previousPolicyHash: null,
    }
  }

  const from = new Date(Date.now() - thresholds.minWindowHours * 3600_000).toISOString()
  const candidates = await summarizePolicyCandidates({ agentName, taskType, cohortKey, stage, from, limit: 500 })
  const activeHash = String(state.policy_hash)
  const active = candidates.find((c) => c.policyHash === activeHash)
  const baselineScore = Number(state.baseline_score || 0)
  const previousHash = state.previous_policy_hash ? String(state.previous_policy_hash) : null
  const previousPolicy =
    state.previous_policy && typeof state.previous_policy === 'object'
      ? (state.previous_policy as Record<string, unknown>)
      : null

  if (!active || active.runs < thresholds.minRuns || !previousHash || !previousPolicy) {
    return {
      promoted: false,
      rolledBack: false,
      reason: 'rollback_guard_not_met',
      activePolicyHash: activeHash,
      previousPolicyHash: previousHash,
      baseline: active,
    }
  }

  const drop = baselineScore - active.avgScore
  if (drop < thresholds.rollbackDropScore) {
    return {
      promoted: false,
      rolledBack: false,
      reason: 'no_drift_detected',
      activePolicyHash: activeHash,
      previousPolicyHash: previousHash,
      baseline: active,
    }
  }

  const previousCandidate: PolicyCandidateSummary = {
    policyHash: previousHash,
    policy: previousPolicy,
    runs: Number(state.previous_baseline_runs || 0),
    successRate: Number(state.previous_baseline_success_rate || 0),
    avgScore: Number(state.previous_baseline_score || 0),
    scoreStdDev: 0,
    comparableShare: 1,
    dominantJobName: null,
    avgDurationSec: 0,
    latestAt: new Date().toISOString(),
  }

  await setActivePolicyState({
    agentName,
    taskType,
    cohortKey,
    stage,
    candidate: previousCandidate,
    baseline: previousCandidate,
  })

  await insertPolicyAudit({
    agentName,
    taskType,
    cohortKey,
    stage,
    action: 'rollback',
    reason: 'drift_detected',
    candidatePolicyHash: previousHash,
    baselinePolicyHash: activeHash,
    metrics: {
      drop,
      rollbackDropScore: thresholds.rollbackDropScore,
      activeAvgScore: active.avgScore,
      baselineScore,
      activeRuns: active.runs,
    },
  })

  return {
    promoted: false,
    rolledBack: true,
    reason: 'drift_detected',
    activePolicyHash: previousHash,
    previousPolicyHash: activeHash,
    candidate: previousCandidate,
    baseline: active,
  }
}

export async function promotePolicyCandidate(params: {
  agentName: string
  taskType: string
  cohortKey?: string
  policyHash: string
  stage?: string
  thresholds?: Partial<PromotionThresholds>
}): Promise<PolicyPromotionDecision> {
  const agentName = String(params.agentName || 'unknown').trim().slice(0, 80) || 'unknown'
  const taskType = String(params.taskType || 'generic').trim().slice(0, 80) || 'generic'
  const cohortKey = normalizeCohortKey(params.cohortKey)
  const stage = String(params.stage || 'unknown').trim().slice(0, 80) || 'unknown'
  const policyHash = String(params.policyHash || '').trim()
  const thresholds = parseThresholds(params.thresholds)

  if (!policyHash) {
    return {
      promoted: false,
      rolledBack: false,
      reason: 'policy_hash_required',
      activePolicyHash: null,
      previousPolicyHash: null,
    }
  }

  const from = new Date(Date.now() - thresholds.minWindowHours * 3600_000).toISOString()
  const candidates = await summarizePolicyCandidates({ agentName, taskType, cohortKey, stage, from, limit: 600 })
  const candidate = candidates.find((item) => item.policyHash === policyHash)
  const state = await getActivePolicyState(agentName, taskType, cohortKey)
  const activeHash = state?.policy_hash ? String(state.policy_hash) : null

  if (!candidate) {
    await insertPolicyAudit({
      agentName,
      taskType,
      cohortKey,
      stage,
      action: 'skip',
      reason: 'candidate_not_found',
      candidatePolicyHash: policyHash,
      baselinePolicyHash: activeHash,
      metrics: { mode: 'explicit', minWindowHours: thresholds.minWindowHours },
    })

    return {
      promoted: false,
      rolledBack: false,
      reason: 'candidate_not_found',
      activePolicyHash: activeHash,
      previousPolicyHash: state?.previous_policy_hash ? String(state.previous_policy_hash) : null,
    }
  }

  if (candidate.runs < thresholds.minRuns) {
    await insertPolicyAudit({
      agentName,
      taskType,
      cohortKey,
      stage,
      action: 'skip',
      reason: 'candidate_below_min_runs',
      candidatePolicyHash: candidate.policyHash,
      baselinePolicyHash: activeHash,
      metrics: { mode: 'explicit', runs: candidate.runs, minRuns: thresholds.minRuns },
    })

    return {
      promoted: false,
      rolledBack: false,
      reason: 'candidate_below_min_runs',
      activePolicyHash: activeHash,
      previousPolicyHash: state?.previous_policy_hash ? String(state.previous_policy_hash) : null,
      candidate,
    }
  }

  if (activeHash && candidate.policyHash === activeHash) {
    await insertPolicyAudit({
      agentName,
      taskType,
      cohortKey,
      stage,
      action: 'evaluate',
      reason: 'candidate_already_active',
      candidatePolicyHash: candidate.policyHash,
      baselinePolicyHash: activeHash,
      metrics: { mode: 'explicit' },
    })

    return {
      promoted: false,
      rolledBack: false,
      reason: 'candidate_already_active',
      activePolicyHash: activeHash,
      previousPolicyHash: state?.previous_policy_hash ? String(state.previous_policy_hash) : null,
      candidate,
      baseline: candidate,
    }
  }

  const baseline = activeHash
    ? candidates.find((item) => item.policyHash === activeHash)
    : undefined

  if (!state) {
    await setActivePolicyState({ agentName, taskType, cohortKey, stage, candidate, baseline: candidate })
    await insertPolicyAudit({
      agentName,
      taskType,
      cohortKey,
      stage,
      action: 'promote',
      reason: 'explicit_initial_selection',
      candidatePolicyHash: candidate.policyHash,
      baselinePolicyHash: null,
      metrics: { mode: 'explicit', runs: candidate.runs, avgScore: candidate.avgScore },
    })

    return {
      promoted: true,
      rolledBack: false,
      reason: 'explicit_initial_selection',
      activePolicyHash: candidate.policyHash,
      previousPolicyHash: null,
      candidate,
      baseline: candidate,
    }
  }

  if (!baseline) {
    await insertPolicyAudit({
      agentName,
      taskType,
      cohortKey,
      stage,
      action: 'skip',
      reason: 'active_baseline_missing',
      candidatePolicyHash: candidate.policyHash,
      baselinePolicyHash: activeHash,
      metrics: { mode: 'explicit' },
    })

    return {
      promoted: false,
      rolledBack: false,
      reason: 'active_baseline_missing',
      activePolicyHash: activeHash,
      previousPolicyHash: state.previous_policy_hash ? String(state.previous_policy_hash) : null,
      candidate,
    }
  }

  const guard = evaluateStatisticalGuards({ candidate, baseline, thresholds })

  if (!guard.passed) {
    await insertPolicyAudit({
      agentName,
      taskType,
      cohortKey,
      stage,
      action: 'skip',
      reason: `explicit_${guard.reason}`,
      candidatePolicyHash: candidate.policyHash,
      baselinePolicyHash: baseline.policyHash,
      metrics: {
        mode: 'explicit',
        gain: guard.gain,
        minGainScore: thresholds.minGainScore,
        successGuard: guard.successGuard,
        stdGuard: guard.stdGuard,
        comparableGuard: guard.comparableGuard,
        maxScoreStdDev: thresholds.maxScoreStdDev,
        minComparableShare: thresholds.minComparableShare,
        candidateSuccessRate: candidate.successRate,
        candidateScoreStdDev: candidate.scoreStdDev,
        candidateComparableShare: candidate.comparableShare,
        baselineSuccessRate: baseline.successRate,
        baselineScoreStdDev: baseline.scoreStdDev,
        baselineComparableShare: baseline.comparableShare,
      },
    })

    return {
      promoted: false,
      rolledBack: false,
      reason: `explicit_${guard.reason}`,
      activePolicyHash: activeHash,
      previousPolicyHash: state.previous_policy_hash ? String(state.previous_policy_hash) : null,
      candidate,
      baseline,
    }
  }

  await setActivePolicyState({ agentName, taskType, cohortKey, stage, candidate, baseline })
  await insertPolicyAudit({
    agentName,
    taskType,
    cohortKey,
    stage,
    action: 'promote',
    reason: 'explicit_candidate_selection',
    candidatePolicyHash: candidate.policyHash,
    baselinePolicyHash: baseline.policyHash,
    metrics: {
      mode: 'explicit',
      gain: guard.gain,
      minGainScore: thresholds.minGainScore,
      maxScoreStdDev: thresholds.maxScoreStdDev,
      minComparableShare: thresholds.minComparableShare,
      candidateAvgScore: candidate.avgScore,
      candidateScoreStdDev: candidate.scoreStdDev,
      candidateComparableShare: candidate.comparableShare,
      baselineAvgScore: baseline.avgScore,
      baselineScoreStdDev: baseline.scoreStdDev,
      baselineComparableShare: baseline.comparableShare,
      candidateRuns: candidate.runs,
      baselineRuns: baseline.runs,
    },
  })

  return {
    promoted: true,
    rolledBack: false,
    reason: 'explicit_candidate_selection',
    activePolicyHash: candidate.policyHash,
    previousPolicyHash: baseline.policyHash,
    candidate,
    baseline,
  }
}

export async function getActivePolicyPayload(
  agentName: string,
  taskType: string,
  cohortKey = 'global',
): Promise<Record<string, unknown> | null> {
  const row = await getActivePolicyState(agentName, taskType, cohortKey)
  if (!row && cohortKey !== 'global') {
    const fallback = await getActivePolicyState(agentName, taskType, 'global')
    if (!fallback || !fallback.policy || typeof fallback.policy !== 'object') return null
    return fallback.policy as Record<string, unknown>
  }
  if (!row || !row.policy || typeof row.policy !== 'object') return null
  return row.policy as Record<string, unknown>
}

async function listCohortKeys(agentName: string, taskType: string): Promise<string[]> {
  const rows = await prisma.$queryRawUnsafe<Array<{ cohort_key: string }>>(
    `
      SELECT DISTINCT cohort_key
      FROM agent_policy_snapshots
      WHERE agent_name = $1
        AND task_type = $2
      ORDER BY cohort_key ASC
      LIMIT 24
    `,
    String(agentName || 'unknown').trim(),
    String(taskType || 'generic').trim(),
  )

  const values = rows.map((row) => normalizeCohortKey(row.cohort_key || 'global')).filter(Boolean)
  return values.length > 0 ? values : ['global']
}

function buildUcbChoice(cohortKey: string, candidates: PolicyCandidateSummary[]): CohortBanditChoice {
  const eligible = candidates.filter((item) => item.runs >= 3)
  if (!eligible.length) {
    return {
      cohortKey,
      chosenPolicyHash: candidates[0]?.policyHash || null,
      strategy: 'fallback',
      candidates: candidates.slice(0, 5).map((item) => ({
        policyHash: item.policyHash,
        runs: item.runs,
        avgScore: item.avgScore,
        ucbScore: item.avgScore,
      })),
    }
  }

  const totalRuns = Math.max(1, eligible.reduce((sum, item) => sum + item.runs, 0))
  const scored = eligible.map((item) => {
    const exploration = Math.sqrt((2 * Math.log(totalRuns + 1)) / Math.max(1, item.runs))
    const stabilityPenalty = Math.min(0.2, item.scoreStdDev * 0.4)
    const comparableBonus = Math.max(0, item.comparableShare - 0.5) * 0.08
    const ucb = item.avgScore + exploration - stabilityPenalty + comparableBonus
    return {
      policyHash: item.policyHash,
      runs: item.runs,
      avgScore: item.avgScore,
      ucbScore: Number(ucb.toFixed(6)),
    }
  })

  scored.sort((a, b) => b.ucbScore - a.ucbScore)

  return {
    cohortKey,
    chosenPolicyHash: scored[0]?.policyHash || null,
    strategy: 'ucb1',
    candidates: scored.slice(0, 5),
  }
}

export async function buildDiscoveryEnrichmentBanditPlan(): Promise<DiscoveryEnrichmentBanditPlan> {
  await ensureAgentLearningSchema()

  const targets = [
    { key: 'discovery', agentName: 'discovery_agent', taskType: 'discovery_query' },
    { key: 'enrichment', agentName: 'enrichment_agent', taskType: 'enrichment_pattern' },
  ] as const

  const result: DiscoveryEnrichmentBanditPlan = {
    generatedAt: new Date().toISOString(),
    discovery: [],
    enrichment: [],
  }

  for (const target of targets) {
    const cohorts = await listCohortKeys(target.agentName, target.taskType)
    const choices: CohortBanditChoice[] = []
    for (const cohortKey of cohorts) {
      const candidates = await summarizePolicyCandidates({
        agentName: target.agentName,
        taskType: target.taskType,
        cohortKey,
        limit: 300,
      })
      if (!candidates.length) continue
      choices.push(buildUcbChoice(cohortKey, candidates))
    }

    if (target.key === 'discovery') result.discovery = choices
    if (target.key === 'enrichment') result.enrichment = choices
  }

  return result
}

async function latestAllocation(
  agentName: string,
  taskType: string,
  cohortKey: string,
): Promise<PolicyAllocationEntry | null> {
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `
      SELECT *
      FROM agent_policy_allocations
      WHERE agent_name = $1
        AND task_type = $2
        AND cohort_key = $3
      ORDER BY created_at DESC
      LIMIT 1
    `,
    String(agentName || '').trim(),
    String(taskType || '').trim(),
    normalizeCohortKey(cohortKey),
  )
  const row = rows[0]
  if (!row) return null
  return {
    id: String(row.id || ''),
    agentName: String(row.agent_name || ''),
    taskType: String(row.task_type || ''),
    cohortKey: normalizeCohortKey(String(row.cohort_key || 'global')),
    chosenPolicyHash: row.chosen_policy_hash ? String(row.chosen_policy_hash) : null,
    previousPolicyHash: row.previous_policy_hash ? String(row.previous_policy_hash) : null,
    strategy: String(row.strategy || 'ucb1'),
    transition: String(row.transition || 'stable') as PolicyAllocationEntry['transition'],
    candidates: Array.isArray(row.candidates)
      ? (row.candidates as Array<{ policyHash: string; runs: number; avgScore: number; ucbScore: number }>)
      : [],
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at || new Date().toISOString()),
  }
}

export async function recordBanditAllocationPlan(plan: DiscoveryEnrichmentBanditPlan): Promise<void> {
  await ensureAgentLearningSchema()

  const entries: Array<{ agentName: string; taskType: string; choice: CohortBanditChoice }> = []
  for (const choice of plan.discovery || []) {
    entries.push({ agentName: 'discovery_agent', taskType: 'discovery_query', choice })
  }
  for (const choice of plan.enrichment || []) {
    entries.push({ agentName: 'enrichment_agent', taskType: 'enrichment_pattern', choice })
  }

  for (const item of entries) {
    const cohortKey = normalizeCohortKey(item.choice.cohortKey)
    const prev = await latestAllocation(item.agentName, item.taskType, cohortKey)
    const previousHash = prev?.chosenPolicyHash || null
    const chosenHash = item.choice.chosenPolicyHash || null
    const changed = previousHash !== chosenHash

    let transition: PolicyAllocationEntry['transition'] = 'stable'
    if (!prev) transition = 'initial'
    else if (changed) transition = 'switch'

    // Avoid noisy stable inserts on every job run.
    if (!changed && prev) {
      const ageMs = Date.now() - new Date(prev.createdAt).getTime()
      if (Number.isFinite(ageMs) && ageMs < 6 * 3600_000) continue
    }

    const id = `apal_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO agent_policy_allocations (
          id,
          agent_name,
          task_type,
          cohort_key,
          chosen_policy_hash,
          previous_policy_hash,
          strategy,
          transition,
          candidates,
          metadata,
          created_at
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9::jsonb,
          $10::jsonb,
          now()
        )
      `,
      id,
      item.agentName,
      item.taskType,
      cohortKey,
      chosenHash,
      previousHash,
      item.choice.strategy,
      transition,
      JSON.stringify(item.choice.candidates || []),
      JSON.stringify({ generatedAt: plan.generatedAt }),
    )
  }
}

export async function listPolicyAllocationTimeline(
  filter?: PolicySnapshotFilter,
): Promise<PolicyAllocationEntry[]> {
  await ensureAgentLearningSchema()

  const safeLimit = Math.max(1, Math.min(500, Number(filter?.limit || 200)))
  const where: string[] = []
  const values: unknown[] = []

  if (filter?.agentName) {
    values.push(String(filter.agentName).trim())
    where.push(`agent_name = $${values.length}`)
  }
  if (filter?.taskType) {
    values.push(String(filter.taskType).trim())
    where.push(`task_type = $${values.length}`)
  }
  if (filter?.cohortKey) {
    values.push(normalizeCohortKey(filter.cohortKey))
    where.push(`cohort_key = $${values.length}`)
  }

  const fromIso = toIsoDate(filter?.from)
  if (fromIso) {
    values.push(new Date(fromIso))
    where.push(`created_at >= $${values.length}`)
  }
  const toIso = toIsoDate(filter?.to)
  if (toIso) {
    values.push(new Date(toIso))
    where.push(`created_at <= $${values.length}`)
  }

  values.push(safeLimit)
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `
      SELECT *
      FROM agent_policy_allocations
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${values.length}
    `,
    ...values,
  )

  return rows.map((row) => ({
    id: String(row.id || ''),
    agentName: String(row.agent_name || ''),
    taskType: String(row.task_type || ''),
    cohortKey: normalizeCohortKey(String(row.cohort_key || 'global')),
    chosenPolicyHash: row.chosen_policy_hash ? String(row.chosen_policy_hash) : null,
    previousPolicyHash: row.previous_policy_hash ? String(row.previous_policy_hash) : null,
    strategy: String(row.strategy || 'ucb1'),
    transition: String(row.transition || 'stable') as PolicyAllocationEntry['transition'],
    candidates: Array.isArray(row.candidates)
      ? (row.candidates as Array<{ policyHash: string; runs: number; avgScore: number; ucbScore: number }>)
      : [],
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at || new Date().toISOString()),
  }))
}

export function comparePolicyCandidates(
  left: PolicyCandidateSummary | undefined,
  right: PolicyCandidateSummary | undefined,
): Record<string, unknown> {
  if (!left || !right) {
    return { comparable: false }
  }

  return {
    comparable: true,
    left: {
      policyHash: left.policyHash,
      runs: left.runs,
      successRate: left.successRate,
      avgScore: left.avgScore,
      scoreStdDev: left.scoreStdDev,
      comparableShare: left.comparableShare,
      avgDurationSec: left.avgDurationSec,
    },
    right: {
      policyHash: right.policyHash,
      runs: right.runs,
      successRate: right.successRate,
      avgScore: right.avgScore,
      scoreStdDev: right.scoreStdDev,
      comparableShare: right.comparableShare,
      avgDurationSec: right.avgDurationSec,
    },
    delta: {
      score: Number((left.avgScore - right.avgScore).toFixed(6)),
      successRate: Number((left.successRate - right.successRate).toFixed(6)),
      stdDev: Number((left.scoreStdDev - right.scoreStdDev).toFixed(6)),
      comparableShare: Number((left.comparableShare - right.comparableShare).toFixed(6)),
      durationSec: Number((left.avgDurationSec - right.avgDurationSec).toFixed(6)),
      runs: left.runs - right.runs,
    },
  }
}