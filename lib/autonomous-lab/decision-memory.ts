import { prisma } from '@/lib/prisma'
import type { LabModule } from './types'

export interface DecisionMemoryItem {
  decisionKey: string
  module: LabModule
  hypothesis: string
  rejectionCount: number
  permanentPenalty: number
  lastStatus: string
  lastUpdated: string
}

function normalizeHypothesis(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function decisionMemoryKey(moduleName: string, hypothesis: string): string {
  return `${moduleName.toLowerCase()}::${normalizeHypothesis(hypothesis)}`
}

async function ensureSchema(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS autonomous_decision_memory (
      decision_key TEXT PRIMARY KEY,
      module TEXT NOT NULL,
      hypothesis TEXT NOT NULL,
      rejection_count INTEGER NOT NULL DEFAULT 0,
      permanent_penalty DOUBLE PRECISION NOT NULL DEFAULT 0,
      last_status TEXT NOT NULL DEFAULT 'unknown',
      last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_autonomous_decision_memory_module
    ON autonomous_decision_memory(module, last_updated DESC)
  `)
}

export async function recordDecisionOutcome(input: {
  module: LabModule
  hypothesis: string
  finalStatus: string
}): Promise<void> {
  await ensureSchema()

  const key = decisionMemoryKey(input.module, input.hypothesis)
  const rows = await prisma.$queryRawUnsafe<
    Array<{ rejection_count: number; permanent_penalty: number }>
  >(
    `SELECT rejection_count, permanent_penalty
     FROM autonomous_decision_memory
     WHERE decision_key = $1 LIMIT 1`,
    key
  )

  const currentRejections = Number(rows[0]?.rejection_count || 0)
  const currentPenalty = Number(rows[0]?.permanent_penalty || 0)
  const rejected = input.finalStatus === 'rejected'

  const nextRejections = rejected ? currentRejections + 1 : currentRejections
  const nextPenalty =
    nextRejections >= 3 ? Math.max(currentPenalty, 2.5) : currentPenalty

  await prisma.$executeRawUnsafe(
    `INSERT INTO autonomous_decision_memory
      (decision_key, module, hypothesis, rejection_count, permanent_penalty, last_status, last_updated)
     VALUES ($1, $2, $3, $4, $5, $6, now())
     ON CONFLICT (decision_key)
     DO UPDATE SET
       rejection_count = $4,
       permanent_penalty = $5,
       last_status = $6,
       last_updated = now()`,
    key,
    input.module,
    input.hypothesis,
    nextRejections,
    nextPenalty,
    input.finalStatus
  )
}

export async function getDecisionPenaltyMap(input: Array<{
  module: LabModule | string
  hypothesis: string
}>): Promise<Record<string, number>> {
  await ensureSchema()
  if (input.length === 0) return {}

  const keys = [...new Set(input.map((x) => decisionMemoryKey(x.module, x.hypothesis)))]
  const rows = await prisma.$queryRawUnsafe<
    Array<{ decision_key: string; permanent_penalty: number }>
  >(
    `SELECT decision_key, permanent_penalty
     FROM autonomous_decision_memory
     WHERE decision_key = ANY($1)`,
    keys
  )

  const result: Record<string, number> = {}
  for (const row of rows) {
    result[String(row.decision_key)] = Number(row.permanent_penalty || 0)
  }
  return result
}
