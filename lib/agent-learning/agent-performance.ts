import { prisma } from '@/lib/prisma'

export interface AgentPerformanceRow {
  agentName: string
  taskType: string
  runs: number
  successRate: number
  avgLatency: number
  errorRate: number
  avgScore: number
  lastUpdated: string
}

let schemaEnsured = false

export async function ensureAgentLearningSchema(): Promise<void> {
  if (schemaEnsured) return

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS agent_performance (
      agent_name TEXT NOT NULL,
      task_type TEXT NOT NULL,
      runs INTEGER NOT NULL DEFAULT 0,
      success_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
      avg_latency DOUBLE PRECISION NOT NULL DEFAULT 0,
      error_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
      avg_score DOUBLE PRECISION NOT NULL DEFAULT 0,
      last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (agent_name, task_type)
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS agent_feedback (
      id TEXT PRIMARY KEY,
      agent_name TEXT NOT NULL,
      task_type TEXT NOT NULL,
      input JSONB NOT NULL DEFAULT '{}'::jsonb,
      output JSONB NOT NULL DEFAULT '{}'::jsonb,
      success BOOLEAN NOT NULL,
      score DOUBLE PRECISION NOT NULL DEFAULT 0,
      confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
      latency_ms INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS agent_memory (
      id TEXT PRIMARY KEY,
      agent_name TEXT NOT NULL,
      key_type TEXT NOT NULL,
      key TEXT NOT NULL,
      value JSONB NOT NULL DEFAULT '{}'::jsonb,
      score DOUBLE PRECISION NOT NULL DEFAULT 0,
      success_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
      confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
      recency DOUBLE PRECISION NOT NULL DEFAULT 0,
      last_used_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (agent_name, key_type, key)
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS agent_policy_snapshots (
      id TEXT PRIMARY KEY,
      job_name TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      task_type TEXT NOT NULL,
      cohort_key TEXT NOT NULL DEFAULT 'global',
      stage TEXT NOT NULL,
      policy JSONB NOT NULL DEFAULT '{}'::jsonb,
      runtime_env JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      run_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      run_finished_at TIMESTAMPTZ,
      success BOOLEAN,
      score DOUBLE PRECISION,
      exit_code INTEGER,
      duration_sec DOUBLE PRECISION,
      output_preview TEXT,
      error TEXT
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS agent_policy_state (
      agent_name TEXT NOT NULL,
      task_type TEXT NOT NULL,
      stage TEXT NOT NULL DEFAULT 'unknown',
      policy_hash TEXT NOT NULL,
      policy JSONB NOT NULL DEFAULT '{}'::jsonb,
      baseline_score DOUBLE PRECISION NOT NULL DEFAULT 0,
      baseline_success_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
      baseline_runs INTEGER NOT NULL DEFAULT 0,
      promoted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      previous_policy_hash TEXT,
      previous_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
      previous_baseline_score DOUBLE PRECISION,
      previous_baseline_success_rate DOUBLE PRECISION,
      previous_baseline_runs INTEGER,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (agent_name, task_type)
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS agent_policy_audit (
      id TEXT PRIMARY KEY,
      agent_name TEXT NOT NULL,
      task_type TEXT NOT NULL,
      cohort_key TEXT NOT NULL DEFAULT 'global',
      stage TEXT NOT NULL,
      action TEXT NOT NULL,
      reason TEXT NOT NULL,
      candidate_policy_hash TEXT,
      baseline_policy_hash TEXT,
      metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS agent_policy_allocations (
      id TEXT PRIMARY KEY,
      agent_name TEXT NOT NULL,
      task_type TEXT NOT NULL,
      cohort_key TEXT NOT NULL DEFAULT 'global',
      chosen_policy_hash TEXT,
      previous_policy_hash TEXT,
      strategy TEXT NOT NULL DEFAULT 'ucb1',
      transition TEXT NOT NULL DEFAULT 'stable',
      candidates JSONB NOT NULL DEFAULT '[]'::jsonb,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  await prisma.$executeRawUnsafe(`
    ALTER TABLE agent_policy_snapshots
    ADD COLUMN IF NOT EXISTS cohort_key TEXT NOT NULL DEFAULT 'global'
  `)

  await prisma.$executeRawUnsafe(`
    ALTER TABLE agent_policy_audit
    ADD COLUMN IF NOT EXISTS cohort_key TEXT NOT NULL DEFAULT 'global'
  `)

  await prisma.$executeRawUnsafe(`
    ALTER TABLE agent_policy_allocations
    ADD COLUMN IF NOT EXISTS cohort_key TEXT NOT NULL DEFAULT 'global'
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_agent_feedback_lookup
      ON agent_feedback (agent_name, task_type, created_at DESC)
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_agent_memory_lookup
      ON agent_memory (agent_name, key_type, updated_at DESC)
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_agent_policy_snapshots_lookup
      ON agent_policy_snapshots (agent_name, task_type, cohort_key, created_at DESC)
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_agent_policy_snapshots_job
      ON agent_policy_snapshots (job_name, created_at DESC)
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_agent_policy_state_stage
      ON agent_policy_state (stage, promoted_at DESC)
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_agent_policy_audit_lookup
      ON agent_policy_audit (agent_name, task_type, cohort_key, created_at DESC)
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_agent_policy_allocations_lookup
      ON agent_policy_allocations (agent_name, task_type, cohort_key, created_at DESC)
  `)

  schemaEnsured = true
}

export async function recomputeAgentPerformance(agentName: string, taskType: string): Promise<AgentPerformanceRow> {
  await ensureAgentLearningSchema()

  const normalizedAgent = String(agentName || 'unknown').trim().slice(0, 80) || 'unknown'
  const normalizedTask = String(taskType || 'generic').trim().slice(0, 80) || 'generic'

  const rows = await prisma.$queryRawUnsafe<Array<{
    runs: number
    success_rate: number
    avg_latency: number
    error_rate: number
    avg_score: number
  }>>(
    `
      SELECT
        COUNT(*)::int AS runs,
        COALESCE(AVG(CASE WHEN success THEN 1 ELSE 0 END), 0)::float8 AS success_rate,
        COALESCE(AVG(latency_ms), 0)::float8 AS avg_latency,
        COALESCE(AVG(CASE WHEN error IS NULL OR error = '' THEN 0 ELSE 1 END), 0)::float8 AS error_rate,
        COALESCE(AVG(score), 0)::float8 AS avg_score
      FROM agent_feedback
      WHERE agent_name = $1
        AND task_type = $2
    `,
    normalizedAgent,
    normalizedTask,
  )

  const agg = rows[0] || { runs: 0, success_rate: 0, avg_latency: 0, error_rate: 0, avg_score: 0 }
  const now = new Date().toISOString()

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO agent_performance (
        agent_name,
        task_type,
        runs,
        success_rate,
        avg_latency,
        error_rate,
        avg_score,
        last_updated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (agent_name, task_type)
      DO UPDATE SET
        runs = EXCLUDED.runs,
        success_rate = EXCLUDED.success_rate,
        avg_latency = EXCLUDED.avg_latency,
        error_rate = EXCLUDED.error_rate,
        avg_score = EXCLUDED.avg_score,
        last_updated = EXCLUDED.last_updated
    `,
    normalizedAgent,
    normalizedTask,
    Number(agg.runs || 0),
    Number(agg.success_rate || 0),
    Number(agg.avg_latency || 0),
    Number(agg.error_rate || 0),
    Number(agg.avg_score || 0),
    new Date(now),
  )

  return {
    agentName: normalizedAgent,
    taskType: normalizedTask,
    runs: Number(agg.runs || 0),
    successRate: Number(agg.success_rate || 0),
    avgLatency: Number(agg.avg_latency || 0),
    errorRate: Number(agg.error_rate || 0),
    avgScore: Number(agg.avg_score || 0),
    lastUpdated: now,
  }
}

export async function listAgentPerformance(limit = 50): Promise<AgentPerformanceRow[]> {
  await ensureAgentLearningSchema()

  const safeLimit = Math.max(1, Math.min(200, Number(limit || 50)))
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `
      SELECT *
      FROM agent_performance
      ORDER BY last_updated DESC
      LIMIT $1
    `,
    safeLimit,
  )

  return rows.map((row) => ({
    agentName: String(row.agent_name || ''),
    taskType: String(row.task_type || ''),
    runs: Number(row.runs || 0),
    successRate: Number(row.success_rate || 0),
    avgLatency: Number(row.avg_latency || 0),
    errorRate: Number(row.error_rate || 0),
    avgScore: Number(row.avg_score || 0),
    lastUpdated:
      row.last_updated instanceof Date
        ? row.last_updated.toISOString()
        : String(row.last_updated || new Date().toISOString()),
  }))
}