import { prisma } from '@/lib/prisma'
import type { ExperimentStatus, LabExperiment, LabModule, PromotionRequest, PromotionThreshold } from './types'

const DEFAULT_THRESHOLDS: Record<LabModule, Omit<PromotionThreshold, 'module' | 'updatedAt'>> = {
  scoring: {
    minCoverageDelta: 0,
    minStabilityDelta: 0,
    minAnomaliesDelta: 0,
    minRiskSeparationDelta: 0,
    minSnapshotDriftDelta: 0,
    minBucketChurnDelta: 0,
    minPerfDelta: -100,
    minQualityDelta: 0,
    minDecisionScore: 55,
  },
  webgl: {
    minCoverageDelta: -100,
    minStabilityDelta: -100,
    minAnomaliesDelta: -100,
    minRiskSeparationDelta: -100,
    minSnapshotDriftDelta: -100,
    minBucketChurnDelta: -100,
    minPerfDelta: 0,
    minQualityDelta: 0,
    minDecisionScore: 55,
  },
  pipeline: {
    minCoverageDelta: 0,
    minStabilityDelta: -5,
    minAnomaliesDelta: 0,
    minRiskSeparationDelta: 0,
    minSnapshotDriftDelta: 0,
    minBucketChurnDelta: 0,
    minPerfDelta: -50,
    minQualityDelta: 0,
    minDecisionScore: 52,
  },
  operator: {
    minCoverageDelta: -100,
    minStabilityDelta: -100,
    minAnomaliesDelta: -100,
    minRiskSeparationDelta: -100,
    minSnapshotDriftDelta: -100,
    minBucketChurnDelta: -100,
    minPerfDelta: -100,
    minQualityDelta: 0,
    minDecisionScore: 50,
  },
}

function normalizeRecord(row: any): LabExperiment {
  return {
    id: row.id,
    module: row.module,
    hypothesis: row.hypothesis,
    changes: Array.isArray(row.changes) ? row.changes : [],
    status: row.status,
    metrics: (row.metrics || {}) as Record<string, number | string | undefined>,
    candidateConfig: (row.candidate_config || undefined) as Record<string, unknown> | undefined,
    baselineSnapshotId: row.baseline_snapshot_id ?? undefined,
    candidateSnapshotId: row.candidate_snapshot_id ?? undefined,
    orchestratorReport: (row.orchestrator_report || undefined) as Record<string, unknown> | undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  }
}

export async function ensureExperimentRegistrySchema(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS autonomous_experiments (
      id TEXT PRIMARY KEY,
      module TEXT NOT NULL,
      hypothesis TEXT NOT NULL,
      changes JSONB NOT NULL DEFAULT '[]'::jsonb,
      status TEXT NOT NULL DEFAULT 'draft',
      metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
      candidate_config JSONB,
      baseline_snapshot_id INTEGER,
      candidate_snapshot_id INTEGER,
      orchestrator_report JSONB,
      created_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_autonomous_experiments_module_status
    ON autonomous_experiments(module, status)
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_autonomous_experiments_created_at
    ON autonomous_experiments(created_at DESC)
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS autonomous_promotion_queue (
      id TEXT PRIMARY KEY,
      experiment_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      reason TEXT,
      review_note TEXT,
      requested_by TEXT,
      reviewed_by TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      reviewed_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_autonomous_promotion_status_created
    ON autonomous_promotion_queue(status, created_at DESC)
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS autonomous_promotion_thresholds (
      module TEXT PRIMARY KEY,
      min_coverage_delta DOUBLE PRECISION NOT NULL DEFAULT 0,
      min_stability_delta DOUBLE PRECISION NOT NULL DEFAULT 0,
      min_anomalies_delta DOUBLE PRECISION NOT NULL DEFAULT 0,
      min_risk_separation_delta DOUBLE PRECISION NOT NULL DEFAULT 0,
      min_snapshot_drift_delta DOUBLE PRECISION NOT NULL DEFAULT 0,
      min_bucket_churn_delta DOUBLE PRECISION NOT NULL DEFAULT 0,
      min_perf_delta DOUBLE PRECISION NOT NULL DEFAULT -100,
      min_quality_delta DOUBLE PRECISION NOT NULL DEFAULT 0,
      min_decision_score DOUBLE PRECISION NOT NULL DEFAULT 55,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  for (const moduleName of Object.keys(DEFAULT_THRESHOLDS) as LabModule[]) {
    const t = DEFAULT_THRESHOLDS[moduleName]
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO autonomous_promotion_thresholds (
          module,
          min_coverage_delta,
          min_stability_delta,
          min_anomalies_delta,
          min_risk_separation_delta,
          min_snapshot_drift_delta,
          min_bucket_churn_delta,
          min_perf_delta,
          min_quality_delta,
          min_decision_score
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (module) DO NOTHING
      `,
      moduleName,
      t.minCoverageDelta,
      t.minStabilityDelta,
      t.minAnomaliesDelta,
      t.minRiskSeparationDelta,
      t.minSnapshotDriftDelta,
      t.minBucketChurnDelta,
      t.minPerfDelta,
      t.minQualityDelta,
      t.minDecisionScore
    )
  }
}

function normalizePromotion(row: any): PromotionRequest {
  return {
    id: row.id,
    experimentId: row.experiment_id,
    status: row.status,
    requestedBy: row.requested_by ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reason: row.reason ?? undefined,
    reviewNote: row.review_note ?? undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    reviewedAt: row.reviewed_at instanceof Date ? row.reviewed_at.toISOString() : (row.reviewed_at ? String(row.reviewed_at) : undefined),
  }
}

function normalizeThreshold(row: any): PromotionThreshold {
  return {
    module: row.module,
    minCoverageDelta: Number(row.min_coverage_delta || 0),
    minStabilityDelta: Number(row.min_stability_delta || 0),
    minAnomaliesDelta: Number(row.min_anomalies_delta || 0),
    minRiskSeparationDelta: Number(row.min_risk_separation_delta || 0),
    minSnapshotDriftDelta: Number(row.min_snapshot_drift_delta || 0),
    minBucketChurnDelta: Number(row.min_bucket_churn_delta || 0),
    minPerfDelta: Number(row.min_perf_delta || 0),
    minQualityDelta: Number(row.min_quality_delta || 0),
    minDecisionScore: Number(row.min_decision_score || 0),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  }
}

export async function listExperiments(limit = 100): Promise<LabExperiment[]> {
  await ensureExperimentRegistrySchema()
  const safeLimit = Math.max(1, Math.min(limit, 300))
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM autonomous_experiments ORDER BY created_at DESC LIMIT $1`,
    safeLimit
  )
  return rows.map(normalizeRecord)
}

export async function getExperimentById(id: string): Promise<LabExperiment | null> {
  await ensureExperimentRegistrySchema()
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM autonomous_experiments WHERE id = $1 LIMIT 1`,
    id
  )
  if (!rows[0]) return null
  return normalizeRecord(rows[0])
}

export async function createExperiment(input: {
  id: string
  module: LabModule
  hypothesis: string
  changes: string[]
  status?: ExperimentStatus
  metrics?: Record<string, unknown>
  candidateConfig?: Record<string, unknown>
  createdBy?: string
}): Promise<LabExperiment> {
  await ensureExperimentRegistrySchema()

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `
      INSERT INTO autonomous_experiments
      (id, module, hypothesis, changes, status, metrics, candidate_config, created_by)
      VALUES ($1, $2, $3, $4::jsonb, $5, $6::jsonb, $7::jsonb, $8)
      RETURNING *
    `,
    input.id,
    input.module,
    input.hypothesis,
    JSON.stringify(input.changes || []),
    input.status || 'draft',
    JSON.stringify(input.metrics || {}),
    JSON.stringify(input.candidateConfig || {}),
    input.createdBy || null
  )

  return normalizeRecord(rows[0])
}

export async function updateExperiment(
  id: string,
  patch: Partial<{
    hypothesis: string
    changes: string[]
    status: ExperimentStatus
    metrics: Record<string, unknown>
    candidateConfig: Record<string, unknown>
    baselineSnapshotId: number
    candidateSnapshotId: number
    orchestratorReport: Record<string, unknown>
  }>
): Promise<LabExperiment | null> {
  await ensureExperimentRegistrySchema()
  const current = await getExperimentById(id)
  if (!current) return null

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `
      UPDATE autonomous_experiments
      SET
        hypothesis = $2,
        changes = $3::jsonb,
        status = $4,
        metrics = $5::jsonb,
        candidate_config = $6::jsonb,
        baseline_snapshot_id = $7,
        candidate_snapshot_id = $8,
        orchestrator_report = $9::jsonb,
        updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    id,
    patch.hypothesis ?? current.hypothesis,
    JSON.stringify(patch.changes ?? current.changes),
    patch.status ?? current.status,
    JSON.stringify(patch.metrics ?? current.metrics ?? {}),
    JSON.stringify(patch.candidateConfig ?? current.candidateConfig ?? {}),
    patch.baselineSnapshotId ?? current.baselineSnapshotId ?? null,
    patch.candidateSnapshotId ?? current.candidateSnapshotId ?? null,
    JSON.stringify(patch.orchestratorReport ?? current.orchestratorReport ?? {})
  )

  return rows[0] ? normalizeRecord(rows[0]) : null
}

export async function listPromotionRequests(limit = 100): Promise<PromotionRequest[]> {
  await ensureExperimentRegistrySchema()
  const safeLimit = Math.max(1, Math.min(limit, 300))
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM autonomous_promotion_queue ORDER BY created_at DESC LIMIT $1`,
    safeLimit
  )
  return rows.map(normalizePromotion)
}

export async function createPromotionRequest(input: {
  id: string
  experimentId: string
  reason?: string
  requestedBy?: string
}): Promise<PromotionRequest> {
  await ensureExperimentRegistrySchema()
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `
      INSERT INTO autonomous_promotion_queue
      (id, experiment_id, status, reason, requested_by)
      VALUES ($1, $2, 'pending', $3, $4)
      RETURNING *
    `,
    input.id,
    input.experimentId,
    input.reason || null,
    input.requestedBy || null
  )
  return normalizePromotion(rows[0])
}

export async function reviewPromotionRequest(input: {
  id: string
  status: 'approved' | 'rejected'
  reviewedBy?: string
  reviewNote?: string
}): Promise<PromotionRequest | null> {
  await ensureExperimentRegistrySchema()
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `
      UPDATE autonomous_promotion_queue
      SET
        status = $2,
        reviewed_by = $3,
        review_note = $4,
        reviewed_at = now(),
        updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    input.id,
    input.status,
    input.reviewedBy || null,
    input.reviewNote || null
  )

  return rows[0] ? normalizePromotion(rows[0]) : null
}

export async function listPromotionThresholds(): Promise<PromotionThreshold[]> {
  await ensureExperimentRegistrySchema()
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM autonomous_promotion_thresholds ORDER BY module ASC`
  )
  return rows.map(normalizeThreshold)
}

export async function getPromotionThreshold(moduleName: LabModule): Promise<PromotionThreshold> {
  await ensureExperimentRegistrySchema()
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM autonomous_promotion_thresholds WHERE module = $1 LIMIT 1`,
    moduleName
  )

  if (!rows[0]) {
    const fallback = DEFAULT_THRESHOLDS[moduleName]
    return {
      module: moduleName,
      ...fallback,
      updatedAt: new Date().toISOString(),
    }
  }

  return normalizeThreshold(rows[0])
}

export async function updatePromotionThreshold(
  moduleName: LabModule,
  patch: Partial<Omit<PromotionThreshold, 'module' | 'updatedAt'>>
): Promise<PromotionThreshold> {
  await ensureExperimentRegistrySchema()
  const current = await getPromotionThreshold(moduleName)

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `
      UPDATE autonomous_promotion_thresholds
      SET
        min_coverage_delta = $2,
        min_stability_delta = $3,
        min_anomalies_delta = $4,
        min_risk_separation_delta = $5,
        min_snapshot_drift_delta = $6,
        min_bucket_churn_delta = $7,
        min_perf_delta = $8,
        min_quality_delta = $9,
        min_decision_score = $10,
        updated_at = now()
      WHERE module = $1
      RETURNING *
    `,
    moduleName,
    patch.minCoverageDelta ?? current.minCoverageDelta,
    patch.minStabilityDelta ?? current.minStabilityDelta,
    patch.minAnomaliesDelta ?? current.minAnomaliesDelta,
    patch.minRiskSeparationDelta ?? current.minRiskSeparationDelta,
    patch.minSnapshotDriftDelta ?? current.minSnapshotDriftDelta,
    patch.minBucketChurnDelta ?? current.minBucketChurnDelta,
    patch.minPerfDelta ?? current.minPerfDelta,
    patch.minQualityDelta ?? current.minQualityDelta,
    patch.minDecisionScore ?? current.minDecisionScore
  )

  return normalizeThreshold(rows[0])
}
