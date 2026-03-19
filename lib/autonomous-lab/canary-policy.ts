/**
 * Autonomous Lab — Canary Policy
 * Manages progressive deployment states for approved experiments.
 * Traffic % sequence: 10 → 25 → 50 → 100 (→ completed)
 * Rollback: auto-triggered if error rate exceeds maxErrorRate,
 *           or manually by operator at any step.
 *
 * Canary routing is now executable at runtime via stable sticky assignment.
 * Call `resolveCanaryTrafficForModule()` from serving routes to branch
 * baseline/candidate traffic based on active canary state and traffic_pct.
 * No step advances automatically — human must call advanceCanary().
 */
import { prisma } from '@/lib/prisma'
import type { LabModule } from './types'

export type CanaryStatus =
  | 'canary_10'
  | 'canary_25'
  | 'canary_50'
  | 'canary_100'
  | 'rolled_back'
  | 'completed'

export interface CanaryState {
  id: string
  promotionId: string
  experimentId: string
  status: CanaryStatus
  trafficPct: number
  lastErrorRate: number
  maxErrorRate: number
  minStabilityDelta: number
  rolledBackAt: string | null
  rolledBackReason: string | null
  createdAt: string
  updatedAt: string
}

const PCT_SEQUENCE = [10, 25, 50, 100]
const STATUS_SEQUENCE: CanaryStatus[] = ['canary_10', 'canary_25', 'canary_50', 'canary_100']

export interface CanaryTrafficDecision {
  active: boolean
  module: LabModule
  variant: 'baseline' | 'candidate'
  trafficPct: number
  canaryId: string | null
  promotionId: string | null
  experimentId: string | null
  stickyKey: string
  reason: string
}

// ─── DB setup ─────────────────────────────────────────────────────────────────
async function ensureSchema(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS autonomous_canary_states (
      id TEXT PRIMARY KEY,
      promotion_id TEXT NOT NULL,
      experiment_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'canary_10',
      traffic_pct INTEGER NOT NULL DEFAULT 10,
      last_error_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
      max_error_rate DOUBLE PRECISION NOT NULL DEFAULT 0.02,
      min_stability_delta DOUBLE PRECISION NOT NULL DEFAULT 0,
      rolled_back_at TIMESTAMPTZ,
      rolled_back_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_canary_promotion_id
    ON autonomous_canary_states(promotion_id, created_at DESC)
  `)
}

function normalize(row: Record<string, unknown>): CanaryState {
  return {
    id: String(row.id),
    promotionId: String(row.promotion_id),
    experimentId: String(row.experiment_id),
    status: String(row.status) as CanaryStatus,
    trafficPct: Number(row.traffic_pct),
    lastErrorRate: Number(row.last_error_rate ?? 0),
    maxErrorRate: Number(row.max_error_rate ?? 0.02),
    minStabilityDelta: Number(row.min_stability_delta ?? 0),
    rolledBackAt: row.rolled_back_at
      ? row.rolled_back_at instanceof Date
        ? row.rolled_back_at.toISOString()
        : String(row.rolled_back_at)
      : null,
    rolledBackReason: row.rolled_back_reason ? String(row.rolled_back_reason) : null,
    createdAt:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt:
      row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function createCanaryState(input: {
  promotionId: string
  experimentId: string
  maxErrorRate?: number
  minStabilityDelta?: number
}): Promise<CanaryState> {
  await ensureSchema()
  const id = `canary_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `INSERT INTO autonomous_canary_states
     (id, promotion_id, experiment_id, status, traffic_pct, max_error_rate, min_stability_delta)
     VALUES ($1, $2, $3, 'canary_10', 10, $4, $5)
     RETURNING *`,
    id,
    input.promotionId,
    input.experimentId,
    input.maxErrorRate ?? 0.02,
    input.minStabilityDelta ?? 0
  )
  return normalize(rows[0])
}

/**
 * Advance canary to next traffic tier.
 * Auto-rollback if currentErrorRate exceeds maxErrorRate.
 */
export async function advanceCanary(
  id: string,
  currentErrorRate: number
): Promise<{ state: CanaryState; autoRolledBack: boolean }> {
  await ensureSchema()
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT * FROM autonomous_canary_states WHERE id = $1 LIMIT 1`,
    id
  )
  if (!rows[0]) throw new Error(`Canary state not found: ${id}`)
  const state = normalize(rows[0])

  if (state.status === 'completed' || state.status === 'rolled_back') {
    return { state, autoRolledBack: false }
  }

  // Auto-rollback if error rate too high
  if (currentErrorRate > state.maxErrorRate) {
    const reason = `Taux d'erreur ${(currentErrorRate * 100).toFixed(2)}% dépasse le seuil de ${(state.maxErrorRate * 100).toFixed(2)}%`
    const updated = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE autonomous_canary_states
       SET status = 'rolled_back', traffic_pct = 0, last_error_rate = $2,
           rolled_back_at = now(), rolled_back_reason = $3, updated_at = now()
       WHERE id = $1 RETURNING *`,
      id,
      currentErrorRate,
      reason
    )
    return { state: normalize(updated[0]), autoRolledBack: true }
  }

  const currentIdx = STATUS_SEQUENCE.indexOf(state.status)
  const isLast = currentIdx >= STATUS_SEQUENCE.length - 1

  if (isLast) {
    const updated = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `UPDATE autonomous_canary_states
       SET status = 'completed', traffic_pct = 100,
           last_error_rate = $2, updated_at = now()
       WHERE id = $1 RETURNING *`,
      id,
      currentErrorRate
    )
    return { state: normalize(updated[0]), autoRolledBack: false }
  }

  const nextStatus = STATUS_SEQUENCE[currentIdx + 1]
  const nextPct = PCT_SEQUENCE[currentIdx + 1]
  const updated = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `UPDATE autonomous_canary_states
     SET status = $2, traffic_pct = $3, last_error_rate = $4, updated_at = now()
     WHERE id = $1 RETURNING *`,
    id,
    nextStatus,
    nextPct,
    currentErrorRate
  )
  return { state: normalize(updated[0]), autoRolledBack: false }
}

export async function rollbackCanary(id: string, reason: string): Promise<CanaryState> {
  await ensureSchema()
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `UPDATE autonomous_canary_states
     SET status = 'rolled_back', traffic_pct = 0,
         rolled_back_at = now(), rolled_back_reason = $2, updated_at = now()
     WHERE id = $1 RETURNING *`,
    id,
    reason
  )
  if (!rows[0]) throw new Error(`Canary state not found: ${id}`)
  return normalize(rows[0])
}

export async function getCanaryByPromotion(promotionId: string): Promise<CanaryState | null> {
  await ensureSchema()
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT * FROM autonomous_canary_states
     WHERE promotion_id = $1 ORDER BY created_at DESC LIMIT 1`,
    promotionId
  )
  return rows[0] ? normalize(rows[0]) : null
}

export async function listCanaryStates(limit = 20): Promise<CanaryState[]> {
  await ensureSchema()
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT * FROM autonomous_canary_states ORDER BY created_at DESC LIMIT $1`,
    limit
  )
  return rows.map(normalize)
}

function stableHashToPct(seed: string): number {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0) % 100
}

function randomStickyKey(): string {
  return `canary_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function ensureCanaryStickyKey(input?: string | null): string {
  const candidate = String(input || '').trim()
  return candidate.length >= 8 ? candidate : randomStickyKey()
}

export async function getActiveCanaryForModule(module: LabModule): Promise<CanaryState | null> {
  await ensureSchema()
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT c.*
     FROM autonomous_canary_states c
     INNER JOIN autonomous_experiments e ON e.id = c.experiment_id
     WHERE e.module = $1
       AND c.status IN ('canary_10', 'canary_25', 'canary_50', 'canary_100')
     ORDER BY c.updated_at DESC
     LIMIT 1`,
    module
  )

  return rows[0] ? normalize(rows[0]) : null
}

export async function resolveCanaryTrafficForModule(input: {
  module: LabModule
  stickyKey?: string | null
}): Promise<CanaryTrafficDecision> {
  const stickyKey = ensureCanaryStickyKey(input.stickyKey)
  const state = await getActiveCanaryForModule(input.module)

  if (!state) {
    return {
      active: false,
      module: input.module,
      variant: 'baseline',
      trafficPct: 0,
      canaryId: null,
      promotionId: null,
      experimentId: null,
      stickyKey,
      reason: 'no active canary for module',
    }
  }

  const bucket = stableHashToPct(`${input.module}:${stickyKey}`)
  const inCandidate = bucket < state.trafficPct

  return {
    active: true,
    module: input.module,
    variant: inCandidate ? 'candidate' : 'baseline',
    trafficPct: state.trafficPct,
    canaryId: state.id,
    promotionId: state.promotionId,
    experimentId: state.experimentId,
    stickyKey,
    reason: inCandidate
      ? `bucket ${bucket} < traffic ${state.trafficPct}`
      : `bucket ${bucket} >= traffic ${state.trafficPct}`,
  }
}
