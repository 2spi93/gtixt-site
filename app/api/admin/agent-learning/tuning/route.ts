import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import { buildAgentRuntimeEnv, buildAgentRuntimeTuning } from '@/lib/agent-learning/agent-tuner'
import { listAgentPerformance } from '@/lib/agent-learning/agent-performance'
import { listAgentMemory } from '@/lib/agent-learning/agent-memory'
import { listAgentPolicySnapshots } from '@/lib/agent-learning/agent-policy-snapshot'
import { getSecretEnv } from '@/lib/secret-env'

function hasAlsServiceAccess(request: NextRequest): boolean {
  const expected = getSecretEnv('ALS_API_TOKEN') || getSecretEnv('ALS_SERVICE_TOKEN')
  const provided = (
    request.headers.get('x-als-service-token') ||
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    ''
  ).trim()

  return Boolean(expected && provided && expected === provided)
}

export async function GET(request: NextRequest) {
  const serviceAccess = hasAlsServiceAccess(request)
  if (!serviceAccess) {
    const auth = await requireAdminUser(request, ['admin', 'lead_reviewer'])
    if (auth instanceof NextResponse) return auth
  }

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const url = new URL(request.url)
  const includeEnv = url.searchParams.get('includeEnv') === '1'
  const includeMemory = url.searchParams.get('includeMemory') === '1'
  const includeSnapshots = url.searchParams.get('includeSnapshots') === '1'

  const [tuning, performance, env, memory, snapshots] = await Promise.all([
    buildAgentRuntimeTuning(),
    listAgentPerformance(100),
    includeEnv ? buildAgentRuntimeEnv() : Promise.resolve(undefined),
    includeMemory ? listAgentMemory({ limit: 120 }) : Promise.resolve(undefined),
    includeSnapshots ? listAgentPolicySnapshots(120) : Promise.resolve(undefined),
  ])

  return NextResponse.json({
    success: true,
    tuning,
    performance,
    env,
    memory,
    snapshots,
  })
}