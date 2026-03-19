import { prisma } from '@/lib/prisma'

export interface PriorityHistoryPoint {
  backlogId: string
  score: number
  scoredAt: string
}

async function ensureSchema(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS autonomous_priority_history (
      id TEXT PRIMARY KEY,
      backlog_id TEXT NOT NULL,
      score DOUBLE PRECISION NOT NULL,
      scored_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_autonomous_priority_history_backlog
    ON autonomous_priority_history(backlog_id, scored_at DESC)
  `)
}

export async function getLatestPriorityScores(
  backlogIds: string[]
): Promise<Record<string, number>> {
  await ensureSchema()
  if (backlogIds.length === 0) return {}

  const rows = await prisma.$queryRawUnsafe<
    Array<{ backlog_id: string; score: number }>
  >(
    `
      SELECT DISTINCT ON (backlog_id) backlog_id, score
      FROM autonomous_priority_history
      WHERE backlog_id = ANY($1)
      ORDER BY backlog_id, scored_at DESC
    `,
    backlogIds
  )

  const result: Record<string, number> = {}
  for (const row of rows) {
    result[row.backlog_id] = Number(row.score || 0)
  }
  return result
}

export async function recordPriorityScores(
  points: PriorityHistoryPoint[]
): Promise<void> {
  await ensureSchema()
  for (const point of points) {
    const id = `prio_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    await prisma.$executeRawUnsafe(
      `INSERT INTO autonomous_priority_history (id, backlog_id, score, scored_at)
       VALUES ($1, $2, $3, $4::timestamptz)`,
      id,
      point.backlogId,
      Number(point.score || 0),
      point.scoredAt
    )
  }
}
