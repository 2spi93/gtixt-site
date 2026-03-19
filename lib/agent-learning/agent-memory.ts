import { prisma } from '@/lib/prisma'
import { ensureAgentLearningSchema } from './agent-performance'
import type { AgentFeedbackEvent } from './agent-feedback'

export type AgentMemoryKeyType = 'domain_strategy' | 'query_score' | 'pattern_accuracy'

export interface AgentMemoryEntry {
  id: string
  agentName: string
  keyType: AgentMemoryKeyType
  key: string
  value: Record<string, unknown>
  score: number
  successRate: number
  confidence: number
  recency: number
  lastUsedAt: string | null
  updatedAt: string
}

export interface UpsertMemoryInput {
  agentName: string
  keyType: AgentMemoryKeyType
  key: string
  value?: Record<string, unknown>
  score: number
  successRate: number
  confidence: number
  recency: number
  lastUsedAt?: string
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Number(n || 0)))
}

function normalizeMemoryInput(input: UpsertMemoryInput): UpsertMemoryInput {
  return {
    ...input,
    agentName: String(input.agentName || 'unknown').trim().slice(0, 80) || 'unknown',
    key: String(input.key || '').trim().slice(0, 300),
    value: input.value || {},
    score: clamp01(input.score),
    successRate: clamp01(input.successRate),
    confidence: clamp01(input.confidence),
    recency: clamp01(input.recency),
    lastUsedAt: input.lastUsedAt || new Date().toISOString(),
  }
}

export async function upsertAgentMemory(input: UpsertMemoryInput): Promise<AgentMemoryEntry | null> {
  await ensureAgentLearningSchema()

  const normalized = normalizeMemoryInput(input)
  if (!normalized.key) return null

  const id = `am_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO agent_memory (
        id,
        agent_name,
        key_type,
        key,
        value,
        score,
        success_rate,
        confidence,
        recency,
        last_used_at,
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
        $9,
        $10,
        now()
      )
      ON CONFLICT (agent_name, key_type, key)
      DO UPDATE SET
        value = EXCLUDED.value,
        score = EXCLUDED.score,
        success_rate = EXCLUDED.success_rate,
        confidence = EXCLUDED.confidence,
        recency = EXCLUDED.recency,
        last_used_at = EXCLUDED.last_used_at,
        updated_at = now()
    `,
    id,
    normalized.agentName,
    normalized.keyType,
    normalized.key,
    JSON.stringify(normalized.value || {}),
    normalized.score,
    normalized.successRate,
    normalized.confidence,
    normalized.recency,
    new Date(normalized.lastUsedAt || new Date().toISOString()),
  )

  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `
      SELECT *
      FROM agent_memory
      WHERE agent_name = $1
        AND key_type = $2
        AND key = $3
      LIMIT 1
    `,
    normalized.agentName,
    normalized.keyType,
    normalized.key,
  )

  const row = rows[0]
  if (!row) return null

  return {
    id: String(row.id || ''),
    agentName: String(row.agent_name || ''),
    keyType: String(row.key_type || 'query_score') as AgentMemoryKeyType,
    key: String(row.key || ''),
    value: row.value && typeof row.value === 'object' ? (row.value as Record<string, unknown>) : {},
    score: Number(row.score || 0),
    successRate: Number(row.success_rate || 0),
    confidence: Number(row.confidence || 0),
    recency: Number(row.recency || 0),
    lastUsedAt:
      row.last_used_at instanceof Date
        ? row.last_used_at.toISOString()
        : row.last_used_at
          ? String(row.last_used_at)
          : null,
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at || new Date().toISOString()),
  }
}

export async function listAgentMemory(params?: {
  agentName?: string
  keyType?: AgentMemoryKeyType
  limit?: number
}): Promise<AgentMemoryEntry[]> {
  await ensureAgentLearningSchema()

  const limit = Math.max(1, Math.min(500, Number(params?.limit || 100)))
  const filters: string[] = []
  const values: unknown[] = []

  if (params?.agentName) {
    values.push(String(params.agentName).trim())
    filters.push(`agent_name = $${values.length}`)
  }

  if (params?.keyType) {
    values.push(String(params.keyType).trim())
    filters.push(`key_type = $${values.length}`)
  }

  values.push(limit)
  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `
      SELECT *
      FROM agent_memory
      ${whereClause}
      ORDER BY score DESC, updated_at DESC
      LIMIT $${values.length}
    `,
    ...values,
  )

  return rows.map((row) => ({
    id: String(row.id || ''),
    agentName: String(row.agent_name || ''),
    keyType: String(row.key_type || 'query_score') as AgentMemoryKeyType,
    key: String(row.key || ''),
    value: row.value && typeof row.value === 'object' ? (row.value as Record<string, unknown>) : {},
    score: Number(row.score || 0),
    successRate: Number(row.success_rate || 0),
    confidence: Number(row.confidence || 0),
    recency: Number(row.recency || 0),
    lastUsedAt:
      row.last_used_at instanceof Date
        ? row.last_used_at.toISOString()
        : row.last_used_at
          ? String(row.last_used_at)
          : null,
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : String(row.updated_at || new Date().toISOString()),
  }))
}

export async function updateAgentMemoryFromFeedback(event: AgentFeedbackEvent): Promise<void> {
  const metadata = event.metadata || {}
  const ageDays = Math.max(0, (Date.now() - new Date(event.createdAt).getTime()) / 86_400_000)
  const recency = clamp01(Math.exp(-ageDays / 14))

  const query = typeof metadata.query === 'string' ? metadata.query.trim() : ''
  if (query) {
    await upsertAgentMemory({
      agentName: event.agentName,
      keyType: 'query_score',
      key: query,
      value: {
        taskType: event.taskType,
        lastSuccess: event.success,
        lastScore: event.score,
      },
      score: event.score,
      successRate: event.success ? 1 : 0,
      confidence: event.confidence,
      recency,
      lastUsedAt: event.createdAt,
    })
  }

  const pattern = typeof metadata.pattern === 'string' ? metadata.pattern.trim() : ''
  if (pattern) {
    await upsertAgentMemory({
      agentName: event.agentName,
      keyType: 'pattern_accuracy',
      key: pattern,
      value: {
        taskType: event.taskType,
        extractedFields: Number(metadata.extractedFields || 0),
        attemptedFields: Number(metadata.attemptedFields || 0),
      },
      score: event.score,
      successRate: event.success ? 1 : 0,
      confidence: event.confidence,
      recency,
      lastUsedAt: event.createdAt,
    })
  }

  const domain = typeof metadata.domain === 'string' ? metadata.domain.trim().toLowerCase() : ''
  const strategy = typeof metadata.strategy === 'string' ? metadata.strategy.trim() : ''
  if (domain && strategy) {
    await upsertAgentMemory({
      agentName: event.agentName,
      keyType: 'domain_strategy',
      key: domain,
      value: {
        strategy,
        taskType: event.taskType,
      },
      score: event.score,
      successRate: event.success ? 1 : 0,
      confidence: event.confidence,
      recency,
      lastUsedAt: event.createdAt,
    })
  }
}