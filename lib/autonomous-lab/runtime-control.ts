import { prisma } from '@/lib/prisma'

export type RuntimeControlMode = 'auto' | 'fast' | 'safe'

export interface RuntimeControlState {
  mode: RuntimeControlMode
  updatedAt: string
  updatedBy?: string
}

async function ensureSchema(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS autonomous_runtime_control (
      control_key TEXT PRIMARY KEY,
      mode TEXT NOT NULL DEFAULT 'auto',
      updated_by TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  await prisma.$executeRawUnsafe(`
    INSERT INTO autonomous_runtime_control (control_key, mode)
    VALUES ('scheduler', 'auto')
    ON CONFLICT (control_key) DO NOTHING
  `)
}

function normalize(row: Record<string, unknown>): RuntimeControlState {
  const modeValue = String(row.mode || 'auto')
  const mode: RuntimeControlMode =
    modeValue === 'fast' ? 'fast' : modeValue === 'safe' ? 'safe' : 'auto'

  return {
    mode,
    updatedBy: row.updated_by ? String(row.updated_by) : undefined,
    updatedAt:
      row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  }
}

export async function getRuntimeControlState(): Promise<RuntimeControlState> {
  await ensureSchema()
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT mode, updated_by, updated_at
     FROM autonomous_runtime_control
     WHERE control_key = 'scheduler'
     LIMIT 1`
  )
  return normalize(rows[0] || { mode: 'auto', updated_at: new Date().toISOString() })
}

export async function updateRuntimeControlState(input: {
  mode: RuntimeControlMode
  updatedBy?: string
}): Promise<RuntimeControlState> {
  await ensureSchema()
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `UPDATE autonomous_runtime_control
     SET mode = $2, updated_by = $3, updated_at = now()
     WHERE control_key = 'scheduler'
     RETURNING mode, updated_by, updated_at`,
    'scheduler',
    input.mode,
    input.updatedBy || null
  )
  return normalize(rows[0])
}
