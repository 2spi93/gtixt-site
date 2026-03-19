import { prisma } from '@/lib/prisma'
import { ensureAgentLearningSchema, recomputeAgentPerformance, type AgentPerformanceRow } from './agent-performance'
import { updateAgentMemoryFromFeedback } from './agent-memory'

export interface AgentFeedbackInput {
  agentName: string
  taskType: string
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  success: boolean
  score: number
  confidence?: number
  latencyMs?: number
  error?: string | null
  metadata?: Record<string, unknown>
  occurredAt?: string
}

export interface AgentFeedbackEvent {
  id: string
  agentName: string
  taskType: string
  input: Record<string, unknown>
  output: Record<string, unknown>
  success: boolean
  score: number
  confidence: number
  latencyMs: number
  error: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

export interface LearningLoopResult {
  event: AgentFeedbackEvent
  performance: AgentPerformanceRow
}

function normalizeFeedback(input: AgentFeedbackInput): AgentFeedbackInput {
  return {
    ...input,
    agentName: String(input.agentName || 'unknown').trim().slice(0, 80) || 'unknown',
    taskType: String(input.taskType || 'generic').trim().slice(0, 80) || 'generic',
    input: input.input || {},
    output: input.output || {},
    score: Math.max(0, Math.min(1, Number(input.score || 0))),
    confidence: Math.max(0, Math.min(1, Number(input.confidence ?? input.score ?? 0))),
    latencyMs: Math.max(0, Math.round(Number(input.latencyMs || 0))),
    metadata: input.metadata || {},
    occurredAt: input.occurredAt || new Date().toISOString(),
    error: input.error || null,
  }
}

export function scoreRunQuality(params: {
  success: boolean
  exitCode: number
  durationSec: number
  output: string
}): number {
  const output = String(params.output || '')
  const success = params.success === true && Number(params.exitCode || 0) === 0

  let score = success ? 0.6 : 0.1
  if (success && params.durationSec <= 120) score += 0.2
  else if (success && params.durationSec <= 600) score += 0.1

  if (/error|traceback|exception|failed/i.test(output)) score -= 0.2
  if (/complete|success|done|finished/i.test(output)) score += 0.1

  return Math.max(0, Math.min(1, Number(score.toFixed(4))))
}

export async function recordAgentFeedback(input: AgentFeedbackInput): Promise<AgentFeedbackEvent> {
  await ensureAgentLearningSchema()

  const normalized = normalizeFeedback(input)
  const id = `af_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO agent_feedback (
        id,
        agent_name,
        task_type,
        input,
        output,
        success,
        score,
        confidence,
        latency_ms,
        error,
        metadata,
        created_at
      ) VALUES (
        $1,
        $2,
        $3,
        $4::jsonb,
        $5::jsonb,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11::jsonb,
        $12
      )
    `,
    id,
    normalized.agentName,
    normalized.taskType,
    JSON.stringify(normalized.input || {}),
    JSON.stringify(normalized.output || {}),
    normalized.success,
    Number(normalized.score || 0),
    Number(normalized.confidence || 0),
    Number(normalized.latencyMs || 0),
    normalized.error,
    JSON.stringify(normalized.metadata || {}),
    new Date(normalized.occurredAt || new Date().toISOString()),
  )

  return {
    id,
    agentName: normalized.agentName,
    taskType: normalized.taskType,
    input: normalized.input || {},
    output: normalized.output || {},
    success: normalized.success,
    score: Number(normalized.score || 0),
    confidence: Number(normalized.confidence || 0),
    latencyMs: Number(normalized.latencyMs || 0),
    error: normalized.error || null,
    metadata: normalized.metadata || {},
    createdAt: normalized.occurredAt || new Date().toISOString(),
  }
}

export async function listAgentFeedback(params?: {
  agentName?: string
  taskType?: string
  limit?: number
}): Promise<AgentFeedbackEvent[]> {
  await ensureAgentLearningSchema()

  const limit = Math.max(1, Math.min(500, Number(params?.limit || 100)))
  const filters: string[] = []
  const values: unknown[] = []

  if (params?.agentName) {
    values.push(String(params.agentName).trim())
    filters.push(`agent_name = $${values.length}`)
  }

  if (params?.taskType) {
    values.push(String(params.taskType).trim())
    filters.push(`task_type = $${values.length}`)
  }

  values.push(limit)
  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `
      SELECT *
      FROM agent_feedback
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${values.length}
    `,
    ...values,
  )

  return rows.map((row) => ({
    id: String(row.id || ''),
    agentName: String(row.agent_name || ''),
    taskType: String(row.task_type || ''),
    input: row.input && typeof row.input === 'object' ? (row.input as Record<string, unknown>) : {},
    output:
      row.output && typeof row.output === 'object' ? (row.output as Record<string, unknown>) : {},
    success: Boolean(row.success),
    score: Number(row.score || 0),
    confidence: Number(row.confidence || 0),
    latencyMs: Number(row.latency_ms || 0),
    error: row.error ? String(row.error) : null,
    metadata:
      row.metadata && typeof row.metadata === 'object'
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at || new Date().toISOString()),
  }))
}

export async function runAgentLearningLoop(input: AgentFeedbackInput): Promise<LearningLoopResult> {
  const event = await recordAgentFeedback(input)
  const [performance] = await Promise.all([
    recomputeAgentPerformance(event.agentName, event.taskType),
    updateAgentMemoryFromFeedback(event),
  ])

  return { event, performance }
}