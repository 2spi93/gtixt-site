import { prisma } from '@/lib/prisma'
import { ensureAgentLearningSchema } from './agent-performance'

export interface CreatePolicySnapshotInput {
  jobName: string
  agentName: string
  taskType: string
  cohortKey?: string
  stage: string
  runtimeEnv: Record<string, string>
  policy: Record<string, unknown>
  runStartedAt?: string
}

export interface PolicySnapshotOutcome {
  success: boolean
  score: number
  exitCode: number
  durationSec: number
  outputPreview?: string
  error?: string | null
}

export interface AgentPolicySnapshot {
  id: string
  jobName: string
  agentName: string
  taskType: string
  cohortKey: string
  stage: string
  policy: Record<string, unknown>
  runtimeEnv: Record<string, string>
  createdAt: string
  runStartedAt: string
  runFinishedAt: string | null
  success: boolean | null
  score: number | null
  exitCode: number | null
  durationSec: number | null
  outputPreview: string | null
  error: string | null
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Number(n || 0)))
}

function parsePolicyFromEnv(runtimeEnv: Record<string, string>): Record<string, unknown> {
  const tryParse = (key: string) => {
    const raw = runtimeEnv[key]
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return {
    discoveryQueries: tryParse('ALS_DISCOVERY_QUERY_WEIGHTS'),
    enrichmentPatterns: tryParse('ALS_ENRICHMENT_PATTERN_SCORES'),
    crawlStrategies: tryParse('ALS_CRAWL_DOMAIN_STRATEGIES'),
  }
}

export async function createAgentPolicySnapshot(
  input: CreatePolicySnapshotInput,
): Promise<AgentPolicySnapshot> {
  await ensureAgentLearningSchema()

  const id = `aps_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  const createdAt = new Date().toISOString()
  const cohortKey = String(input.cohortKey || 'global').trim().slice(0, 80) || 'global'

  const policy =
    input.policy && Object.keys(input.policy).length > 0
      ? input.policy
      : parsePolicyFromEnv(input.runtimeEnv || {})

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO agent_policy_snapshots (
        id,
        job_name,
        agent_name,
        task_type,
        cohort_key,
        stage,
        policy,
        runtime_env,
        created_at,
        run_started_at
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7::jsonb,
        $8::jsonb,
        $9,
        $10
      )
    `,
    id,
    String(input.jobName || 'unknown').trim().slice(0, 120) || 'unknown',
    String(input.agentName || 'unknown').trim().slice(0, 80) || 'unknown',
    String(input.taskType || 'generic').trim().slice(0, 80) || 'generic',
    cohortKey,
    String(input.stage || 'unknown').trim().slice(0, 80) || 'unknown',
    JSON.stringify(policy || {}),
    JSON.stringify(input.runtimeEnv || {}),
    new Date(createdAt),
    new Date(input.runStartedAt || createdAt),
  )

  return {
    id,
    jobName: String(input.jobName || 'unknown'),
    agentName: String(input.agentName || 'unknown'),
    taskType: String(input.taskType || 'generic'),
    cohortKey,
    stage: String(input.stage || 'unknown'),
    policy,
    runtimeEnv: input.runtimeEnv || {},
    createdAt,
    runStartedAt: input.runStartedAt || createdAt,
    runFinishedAt: null,
    success: null,
    score: null,
    exitCode: null,
    durationSec: null,
    outputPreview: null,
    error: null,
  }
}

export async function finalizeAgentPolicySnapshot(
  snapshotId: string,
  outcome: PolicySnapshotOutcome,
): Promise<void> {
  await ensureAgentLearningSchema()

  await prisma.$executeRawUnsafe(
    `
      UPDATE agent_policy_snapshots
      SET
        run_finished_at = now(),
        success = $2,
        score = $3,
        exit_code = $4,
        duration_sec = $5,
        output_preview = $6,
        error = $7
      WHERE id = $1
    `,
    snapshotId,
    outcome.success,
    clamp01(outcome.score),
    Number(outcome.exitCode || 0),
    Math.max(0, Number(outcome.durationSec || 0)),
    String(outcome.outputPreview || '').slice(0, 5000) || null,
    outcome.error ? String(outcome.error).slice(0, 300) : null,
  )
}

export async function listAgentPolicySnapshots(limit = 50): Promise<AgentPolicySnapshot[]> {
  await ensureAgentLearningSchema()

  const safeLimit = Math.max(1, Math.min(300, Number(limit || 50)))
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `
      SELECT *
      FROM agent_policy_snapshots
      ORDER BY created_at DESC
      LIMIT $1
    `,
    safeLimit,
  )

  return rows.map((row) => ({
    id: String(row.id || ''),
    jobName: String(row.job_name || ''),
    agentName: String(row.agent_name || ''),
    taskType: String(row.task_type || ''),
    cohortKey: String(row.cohort_key || 'global'),
    stage: String(row.stage || ''),
    policy: row.policy && typeof row.policy === 'object' ? (row.policy as Record<string, unknown>) : {},
    runtimeEnv:
      row.runtime_env && typeof row.runtime_env === 'object'
        ? (row.runtime_env as Record<string, string>)
        : {},
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at || new Date().toISOString()),
    runStartedAt:
      row.run_started_at instanceof Date
        ? row.run_started_at.toISOString()
        : String(row.run_started_at || new Date().toISOString()),
    runFinishedAt:
      row.run_finished_at instanceof Date
        ? row.run_finished_at.toISOString()
        : row.run_finished_at
          ? String(row.run_finished_at)
          : null,
    success: typeof row.success === 'boolean' ? row.success : null,
    score: row.score == null ? null : Number(row.score),
    exitCode: row.exit_code == null ? null : Number(row.exit_code),
    durationSec: row.duration_sec == null ? null : Number(row.duration_sec),
    outputPreview: row.output_preview ? String(row.output_preview) : null,
    error: row.error ? String(row.error) : null,
  }))
}