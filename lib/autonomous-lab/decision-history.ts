import crypto from 'crypto'
import { CreateBucketCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { prisma } from '@/lib/prisma'
import { getSecretEnv } from '@/lib/secret-env'
import type { DecisionOutput } from '@/lib/autonomous-lab/decision-engine'

export interface DecisionSnapshot {
  id: string
  source: string
  fingerprint: string
  shouldRunCycle: boolean
  cycleIntensity: string
  riskLevel: string
  runtimeMode: string
  pacingMultiplier: number
  confidence: number
  moduleFocus: string[]
  priorityOverrides: Record<string, number>
  reasoning: string[]
  signalsSnapshot: Record<string, unknown>
  computedAt: string
  createdAt: string
  metadata: Record<string, unknown>
}

export interface IntegrationExpectation {
  source: string
  required: boolean
  maxStalenessMinutes: number
}

export interface IntegrationStatus {
  source: string
  required: boolean
  maxStalenessMinutes: number
  isFresh: boolean
  seenRecently: boolean
  staleByMinutes: number | null
  lastSnapshotAt: string | null
}

const DEFAULT_EXPECTATIONS: IntegrationExpectation[] = [
  { source: 'cycle_gate', required: true, maxStalenessMinutes: 120 },
  { source: 'supervision', required: true, maxStalenessMinutes: 20 },
  { source: 'decision_api', required: false, maxStalenessMinutes: 240 },
  { source: 'copilot_action', required: false, maxStalenessMinutes: 240 },
  { source: 'copilot_context', required: false, maxStalenessMinutes: 120 },
  { source: 'simulate_baseline', required: false, maxStalenessMinutes: 240 },
  { source: 'simulate_scenario', required: false, maxStalenessMinutes: 240 },
]

type DecisionStorageStatus = {
  uploaded: boolean
  bucket: string
  objectKey?: string
  pointerKey?: string
  reason?: string
  updatedAt: string
}

function normalizeEndpoint(endpoint: string): string {
  const trimmed = endpoint.trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `http://${trimmed}`
}

function getMinioConfig(): {
  isConfigured: boolean
  bucket: string
  endpoint: string
  accessKey: string
  secretKey: string
  region: string
  prefix: string
} {
  const endpoint = normalizeEndpoint(
    getSecretEnv('MINIO_ENDPOINT') ||
    getSecretEnv('S3_ENDPOINT') ||
    getSecretEnv('AWS_ENDPOINT') ||
    ''
  )
  const accessKey =
    getSecretEnv('MINIO_ACCESS_KEY') ||
    getSecretEnv('AWS_ACCESS_KEY_ID') ||
    getSecretEnv('MINIO_ROOT_USER') ||
    ''
  const secretKey =
    getSecretEnv('MINIO_SECRET_KEY') ||
    getSecretEnv('AWS_SECRET_ACCESS_KEY') ||
    getSecretEnv('MINIO_ROOT_PASSWORD') ||
    ''
  const bucket =
    getSecretEnv('MINIO_BUCKET') ||
    getSecretEnv('MINIO_BUCKET_SNAPSHOTS') ||
    getSecretEnv('S3_BUCKET') ||
    getSecretEnv('NEXT_PUBLIC_BUCKET') ||
    'gtixt-data'
  const region = getSecretEnv('MINIO_REGION') || getSecretEnv('AWS_REGION') || 'us-east-1'
  const prefix =
    String(getSecretEnv('MINIO_DECISION_PREFIX') || 'autonomous-lab/decision-history')
      .replace(/^\/+/, '')
      .replace(/\/+$/, '')

  return {
    isConfigured: Boolean(endpoint && accessKey && secretKey && bucket),
    bucket,
    endpoint,
    accessKey,
    secretKey,
    region,
    prefix,
  }
}

function buildS3Client(config: ReturnType<typeof getMinioConfig>): S3Client {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
  })
}

async function uploadDecisionSnapshotToMinio(args: {
  id: string
  source: string
  decision: DecisionOutput
  fingerprint: string
  metadata: Record<string, unknown>
}): Promise<DecisionStorageStatus> {
  const config = getMinioConfig()
  const updatedAt = new Date().toISOString()

  if (!config.isConfigured) {
    return {
      uploaded: false,
      bucket: config.bucket,
      reason: 'missing_minio_credentials',
      updatedAt,
    }
  }

  const client = buildS3Client(config)
  const createdAt = new Date().toISOString()
  const day = createdAt.slice(0, 10)
  const objectKey = `${config.prefix}/${day}/${args.id}.json`
  const pointerKey = `${config.prefix}/latest.json`

  const objectPayload = {
    id: args.id,
    source: args.source,
    fingerprint: args.fingerprint,
    createdAt,
    decision: args.decision,
    metadata: args.metadata,
  }

  try {
    try {
      await client.send(
        new HeadBucketCommand({
          Bucket: config.bucket,
        }),
      )
    } catch {
      await client.send(
        new CreateBucketCommand({
          Bucket: config.bucket,
        }),
      )
    }

    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: objectKey,
        ContentType: 'application/json',
        Body: JSON.stringify(objectPayload),
      }),
    )

    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: pointerKey,
        ContentType: 'application/json',
        CacheControl: 'no-store',
        Body: JSON.stringify({
          latestId: args.id,
          latestKey: objectKey,
          source: args.source,
          fingerprint: args.fingerprint,
          createdAt,
          updatedAt,
        }),
      }),
    )

    return {
      uploaded: true,
      bucket: config.bucket,
      objectKey,
      pointerKey,
      updatedAt,
    }
  } catch (error) {
    return {
      uploaded: false,
      bucket: config.bucket,
      objectKey,
      pointerKey,
      reason: error instanceof Error ? error.message.slice(0, 300) : 'minio_upload_error',
      updatedAt,
    }
  }
}

async function attachStorageStatus(snapshotId: string, status: DecisionStorageStatus): Promise<void> {
  await prisma.$executeRawUnsafe(
    `
      UPDATE autonomous_decision_snapshots
      SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
      WHERE id = $1
    `,
    snapshotId,
    JSON.stringify({
      storage: {
        provider: 'minio',
        ...status,
      },
    }),
  )
}

async function ensureSchema(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS autonomous_decision_snapshots (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      fingerprint TEXT NOT NULL,
      should_run_cycle BOOLEAN NOT NULL,
      cycle_intensity TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      runtime_mode TEXT NOT NULL,
      pacing_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1,
      confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
      module_focus JSONB NOT NULL DEFAULT '[]'::jsonb,
      priority_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
      reasoning JSONB NOT NULL DEFAULT '[]'::jsonb,
      signals_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
      computed_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb
    )
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_autonomous_decision_snapshots_source_created
      ON autonomous_decision_snapshots (source, created_at DESC)
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_autonomous_decision_snapshots_fingerprint
      ON autonomous_decision_snapshots (fingerprint)
  `)
}

function normalizeRow(row: Record<string, unknown>): DecisionSnapshot {
  return {
    id: String(row.id || ''),
    source: String(row.source || ''),
    fingerprint: String(row.fingerprint || ''),
    shouldRunCycle: Boolean(row.should_run_cycle),
    cycleIntensity: String(row.cycle_intensity || 'normal'),
    riskLevel: String(row.risk_level || 'watch'),
    runtimeMode: String(row.runtime_mode || 'auto'),
    pacingMultiplier: Number(row.pacing_multiplier || 1),
    confidence: Number(row.confidence || 0),
    moduleFocus: Array.isArray(row.module_focus) ? row.module_focus.map((x) => String(x)) : [],
    priorityOverrides:
      row.priority_overrides && typeof row.priority_overrides === 'object'
        ? (row.priority_overrides as Record<string, number>)
        : {},
    reasoning: Array.isArray(row.reasoning) ? row.reasoning.map((x) => String(x)) : [],
    signalsSnapshot:
      row.signals_snapshot && typeof row.signals_snapshot === 'object'
        ? (row.signals_snapshot as Record<string, unknown>)
        : {},
    computedAt:
      row.computed_at instanceof Date
        ? row.computed_at.toISOString()
        : String(row.computed_at || new Date().toISOString()),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at || new Date().toISOString()),
    metadata:
      row.metadata && typeof row.metadata === 'object'
        ? (row.metadata as Record<string, unknown>)
        : {},
  }
}

function toFingerprint(source: string, decision: DecisionOutput): string {
  const stablePayload = {
    source,
    shouldRunCycle: decision.shouldRunCycle,
    cycleIntensity: decision.cycleIntensity,
    riskLevel: decision.riskLevel,
    runtimeMode: decision.runtimeMode,
    pacingMultiplier: Number(Number(decision.pacingMultiplier || 1).toFixed(4)),
    confidence: Number(Number(decision.confidence || 0).toFixed(4)),
    moduleFocus: [...(decision.moduleFocus || [])].sort(),
    priorityOverrides: Object.fromEntries(
      Object.entries(decision.priorityOverrides || {}).sort(([a], [b]) => a.localeCompare(b))
    ),
  }

  return crypto.createHash('sha256').update(JSON.stringify(stablePayload)).digest('hex')
}

export async function recordDecisionSnapshot(input: {
  source: string
  decision: DecisionOutput
  metadata?: Record<string, unknown>
  dedupeWindowSeconds?: number
}): Promise<{ saved: boolean; id: string; duplicateOf?: string }> {
  await ensureSchema()

  const source = String(input.source || 'unknown').trim().slice(0, 80) || 'unknown'
  const decision = input.decision
  const metadata = input.metadata || {}
  const dedupeWindowSeconds = Math.max(10, Math.min(1800, Number(input.dedupeWindowSeconds || 60)))

  const fingerprint = toFingerprint(source, decision)
  const cutoff = new Date(Date.now() - dedupeWindowSeconds * 1000)

  const duplicateRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `
      SELECT id
      FROM autonomous_decision_snapshots
      WHERE source = $1
        AND fingerprint = $2
        AND created_at >= $3
      ORDER BY created_at DESC
      LIMIT 1
    `,
    source,
    fingerprint,
    cutoff,
  )

  if (duplicateRows[0]?.id) {
    return { saved: false, id: duplicateRows[0].id, duplicateOf: duplicateRows[0].id }
  }

  const id = `ds_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO autonomous_decision_snapshots (
        id,
        source,
        fingerprint,
        should_run_cycle,
        cycle_intensity,
        risk_level,
        runtime_mode,
        pacing_multiplier,
        confidence,
        module_focus,
        priority_overrides,
        reasoning,
        signals_snapshot,
        computed_at,
        created_at,
        metadata
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
        $11::jsonb,
        $12::jsonb,
        $13::jsonb,
        $14,
        now(),
        $15::jsonb
      )
    `,
    id,
    source,
    fingerprint,
    decision.shouldRunCycle,
    decision.cycleIntensity,
    decision.riskLevel,
    decision.runtimeMode,
    Number(decision.pacingMultiplier || 1),
    Number(decision.confidence || 0),
    JSON.stringify(decision.moduleFocus || []),
    JSON.stringify(decision.priorityOverrides || {}),
    JSON.stringify(decision.reasoning || []),
    JSON.stringify(decision.signalsSnapshot || {}),
    new Date(decision.computedAt || new Date().toISOString()),
    JSON.stringify(metadata),
  )

  const storageStatus = await uploadDecisionSnapshotToMinio({
    id,
    source,
    decision,
    fingerprint,
    metadata,
  })
  await attachStorageStatus(id, storageStatus).catch(() => null)

  return { saved: true, id }
}

export async function listDecisionSnapshots(options?: {
  limit?: number
  source?: string
}): Promise<DecisionSnapshot[]> {
  await ensureSchema()

  const limit = Math.max(1, Math.min(200, Number(options?.limit || 40)))
  const source = options?.source ? String(options.source).trim() : ''

  const rows = source
    ? await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `
          SELECT *
          FROM autonomous_decision_snapshots
          WHERE source = $1
          ORDER BY created_at DESC
          LIMIT $2
        `,
        source,
        limit,
      )
    : await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `
          SELECT *
          FROM autonomous_decision_snapshots
          ORDER BY created_at DESC
          LIMIT $1
        `,
        limit,
      )

  return rows.map(normalizeRow)
}

export async function getDecisionIntegrationStatus(options?: {
  expectations?: IntegrationExpectation[]
  lookbackHours?: number
}): Promise<{
  statuses: IntegrationStatus[]
  missingRequiredSources: string[]
  staleRequiredSources: string[]
}> {
  await ensureSchema()

  const expectations = options?.expectations || DEFAULT_EXPECTATIONS
  const lookbackHours = Math.max(1, Math.min(168, Number(options?.lookbackHours || 24)))
  const cutoff = new Date(Date.now() - lookbackHours * 60 * 60 * 1000)

  const latestRows = await prisma.$queryRawUnsafe<Array<{ source: string; created_at: Date }>>(
    `
      SELECT DISTINCT ON (source)
        source,
        created_at
      FROM autonomous_decision_snapshots
      WHERE created_at >= $1
      ORDER BY source, created_at DESC
    `,
    cutoff,
  )

  const latestBySource = new Map<string, Date>()
  for (const row of latestRows) {
    latestBySource.set(String(row.source), new Date(row.created_at))
  }

  const now = Date.now()
  const statuses: IntegrationStatus[] = expectations.map((expected) => {
    const ts = latestBySource.get(expected.source)
    const staleByMinutes = ts ? Math.max(0, Math.round((now - ts.getTime()) / 60000)) : null
    const seenRecently = Boolean(ts)
    const isFresh = seenRecently && staleByMinutes !== null && staleByMinutes <= expected.maxStalenessMinutes

    return {
      source: expected.source,
      required: expected.required,
      maxStalenessMinutes: expected.maxStalenessMinutes,
      isFresh,
      seenRecently,
      staleByMinutes,
      lastSnapshotAt: ts ? ts.toISOString() : null,
    }
  })

  return {
    statuses,
    missingRequiredSources: statuses.filter((s) => s.required && !s.seenRecently).map((s) => s.source),
    staleRequiredSources: statuses.filter((s) => s.required && s.seenRecently && !s.isFresh).map((s) => s.source),
  }
}
