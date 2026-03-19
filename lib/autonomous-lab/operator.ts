import { getRedisClient } from '@/lib/redis-client'
import { executeJob } from '@/lib/jobExecutor'
import type { SafeOperatorAction } from './types'

type OperatorRole = 'admin' | 'lead_reviewer' | 'auditor' | 'reviewer'

const ROLE_JOB_ALLOWLIST: Record<OperatorRole, Set<string>> = {
  admin: new Set([
    'risk_alerts',
    'snapshot_export',
    'discovery_scan',
    'enrichment_daily',
    'scoring_update',
    'asic_sync',
    'sentiment_analysis',
    'full_pipeline',
  ]),
  lead_reviewer: new Set([
    'risk_alerts',
    'snapshot_export',
    'discovery_scan',
    'enrichment_daily',
    'scoring_update',
  ]),
  auditor: new Set([]),
  reviewer: new Set([]),
}

const ROLE_ACTION_QUOTAS: Record<OperatorRole, Record<string, number>> = {
  admin: {
    queue_job: 20,
    warm_cache: 30,
    snapshot_cache_invalidate: 20,
    redis_health: 60,
  },
  lead_reviewer: {
    queue_job: 10,
    warm_cache: 20,
    snapshot_cache_invalidate: 10,
    redis_health: 60,
  },
  auditor: {
    queue_job: 0,
    warm_cache: 5,
    snapshot_cache_invalidate: 0,
    redis_health: 30,
  },
  reviewer: {
    queue_job: 0,
    warm_cache: 0,
    snapshot_cache_invalidate: 0,
    redis_health: 20,
  },
}

async function enforceQuota(role: OperatorRole, username: string, actionType: string): Promise<{ ok: boolean; remaining?: number; error?: string }> {
  const redis = getRedisClient()
  const maxAllowed = ROLE_ACTION_QUOTAS[role]?.[actionType] ?? 0
  if (maxAllowed <= 0) {
    return { ok: false, error: `Action not allowed for role: ${role}` }
  }

  if (!redis) {
    // If Redis is unavailable, fail-open only for admin to keep operability.
    if (role === 'admin') return { ok: true, remaining: -1 }
    return { ok: false, error: 'Operator quota backend unavailable' }
  }

  const hourBucket = new Date().toISOString().slice(0, 13)
  const key = `autolab:quota:${role}:${username}:${actionType}:${hourBucket}`
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, 3600)
  }

  if (count > maxAllowed) {
    return { ok: false, error: `Quota exceeded for ${actionType} (${count}/${maxAllowed} per hour)` }
  }

  return { ok: true, remaining: Math.max(0, maxAllowed - count) }
}

export async function runSafeOperatorAction(
  action: SafeOperatorAction,
  actor?: { role?: string; username?: string }
): Promise<Record<string, unknown>> {
  const role = (actor?.role || 'reviewer') as OperatorRole
  const username = actor?.username || 'unknown'

  const quota = await enforceQuota(role, username, action.type)
  if (!quota.ok) {
    return { ok: false, error: quota.error }
  }

  if (action.type === 'redis_health') {
    const redis = getRedisClient()
    if (!redis) {
      return { ok: false, error: 'Redis not configured' }
    }
    const pong = await redis.ping()
    return { ok: true, pong, timestamp: new Date().toISOString(), quotaRemaining: quota.remaining }
  }

  if (action.type === 'snapshot_cache_invalidate') {
    const redis = getRedisClient()
    if (!redis) {
      return { ok: false, error: 'Redis not configured' }
    }
    const removed = await redis.del('snapshot:latest')
    return { ok: true, removed, quotaRemaining: quota.remaining }
  }

  if (action.type === 'warm_cache') {
    const baseUrl = String(action.payload?.baseUrl || 'http://127.0.0.1:3000')
    const routes = [
      '/api/rankings?limit=120',
      '/api/industry-map?limit=120',
      '/api/analytics/terminal?preset=score&period=7D',
      '/api/snapshot/latest',
    ]

    const results = [] as Array<{ route: string; ok: boolean; status: number }>

    for (const route of routes) {
      const res = await fetch(`${baseUrl}${route}`, { cache: 'no-store' })
      results.push({ route, ok: res.ok, status: res.status })
    }

    return { ok: true, warmed: results, quotaRemaining: quota.remaining }
  }

  if (action.type === 'queue_job') {
    const jobName = String(action.payload?.jobName || '')
    const allowlist = ROLE_JOB_ALLOWLIST[role] || new Set<string>()
    if (!allowlist.has(jobName)) {
      return { ok: false, error: `Job not allowed for role ${role}: ${jobName}` }
    }

    const result = await executeJob(jobName, 'autonomous-operator')
    return {
      ok: result.success,
      jobName,
      duration: result.duration,
      exitCode: result.exitCode,
      stage: result.stage,
      model: result.model,
      outputPreview: result.output.slice(0, 1200),
      quotaRemaining: quota.remaining,
      actor: { role, username },
    }
  }

  return { ok: false, error: `Unsupported action: ${action.type}` }
}
