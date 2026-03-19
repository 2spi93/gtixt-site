import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import {
  validateSignificance,
  runEpsilonGreedyBandit,
  checkDriftGate,
} from '@/lib/autonomous-lab/statistical-validator'

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer', 'auditor'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const body = await request.json()
  const mode = body?.mode as string | undefined

  if (mode === 'bandit') {
    const variants = body?.variants
    if (!Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json({ error: 'variants array required for bandit mode' }, { status: 400 })
    }
    const epsilon = typeof body?.epsilon === 'number' ? body.epsilon : 0.1
    const result = runEpsilonGreedyBandit(variants, epsilon)
    return NextResponse.json({ success: true, mode: 'bandit', data: result })
  }

  if (mode === 'drift') {
    const recentMetrics = body?.recentMetrics
    if (!Array.isArray(recentMetrics) || recentMetrics.length === 0) {
      return NextResponse.json({ error: 'recentMetrics array required for drift mode' }, { status: 400 })
    }
    const threshold = typeof body?.driftThreshold === 'number' ? body.driftThreshold : 3.0
    const result = checkDriftGate(recentMetrics, threshold)
    return NextResponse.json({ success: true, mode: 'drift', data: result })
  }

  // Default: t-test
  const baseline = body?.baseline
  const candidate = body?.candidate
  if (!Array.isArray(baseline) || !Array.isArray(candidate)) {
    return NextResponse.json(
      { error: 'baseline and candidate number arrays are required (mode: ttest is default)' },
      { status: 400 }
    )
  }
  const baselineNums = (baseline as unknown[]).map(Number).filter((n) => !isNaN(n))
  const candidateNums = (candidate as unknown[]).map(Number).filter((n) => !isNaN(n))
  const confidenceLevel = typeof body?.confidenceLevel === 'number' ? body.confidenceLevel : 0.95
  const result = validateSignificance(baselineNums, candidateNums, confidenceLevel)
  return NextResponse.json({ success: true, mode: 'ttest', data: result })
}
