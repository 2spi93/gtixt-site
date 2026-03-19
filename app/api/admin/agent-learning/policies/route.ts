import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import {
  buildDiscoveryEnrichmentBanditPlan,
  comparePolicyCandidates,
  getActivePolicyState,
  listActivePolicyBoard,
  listPolicyAllocationTimeline,
  listPolicyAudit,
  listPolicySnapshots,
  listPolicyTimeline,
  promotePolicyCandidate,
  recordBanditAllocationPlan,
  runPolicyPromotionDecision,
  runPolicyRollbackCheck,
  summarizePolicyCandidates,
} from '@/lib/agent-learning/policy-governance'

function toNum(value: string | null, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function parseAllocationExport(value: string | null): 'json' | 'csv' | null {
  const raw = String(value || '').trim().toLowerCase()
  if (raw === 'json' || raw === 'csv') return raw
  return null
}

function csvCell(value: unknown): string {
  const text = String(value == null ? '' : value)
  if (!text.includes(',') && !text.includes('"') && !text.includes('\n')) return text
  return `"${text.replace(/"/g, '""')}"`
}

type AllocationRow = {
  createdAt: string
  agentName: string
  taskType: string
  cohortKey: string
  transition: string
  strategy: string
  previousPolicyHash: string | null
  chosenPolicyHash: string | null
  candidates: Array<{ policyHash: string; ucbScore: number }>
}

function buildAllocationTimelineCsv(rows: AllocationRow[], includeCandidates = false): string {
  if (includeCandidates) {
    // One row per candidate — tableur-friendly for pivot analysis
    const header = [
      'createdAt',
      'agentName',
      'taskType',
      'cohortKey',
      'transition',
      'strategy',
      'previousPolicyHash',
      'chosenPolicyHash',
      'candidateRank',
      'candidatePolicyHash',
      'candidateUcbScore',
      'isChosen',
    ]
    const lines = [header.join(',')]
    for (const row of rows) {
      const candidates = row.candidates || []
      if (candidates.length === 0) {
        // Emit a placeholder row so the allocation event is not silently dropped
        const values = [
          row.createdAt,
          row.agentName,
          row.taskType,
          row.cohortKey,
          row.transition,
          row.strategy,
          row.previousPolicyHash || '',
          row.chosenPolicyHash || '',
          '',
          '',
          '',
          '',
        ]
        lines.push(values.map(csvCell).join(','))
      } else {
        for (let i = 0; i < candidates.length; i++) {
          const c = candidates[i]
          const isChosen = c.policyHash === row.chosenPolicyHash ? '1' : '0'
          const values = [
            row.createdAt,
            row.agentName,
            row.taskType,
            row.cohortKey,
            row.transition,
            row.strategy,
            row.previousPolicyHash || '',
            row.chosenPolicyHash || '',
            i + 1,
            c.policyHash,
            Number(c.ucbScore).toFixed(6),
            isChosen,
          ]
          lines.push(values.map(csvCell).join(','))
        }
      }
    }
    return `${lines.join('\n')}\n`
  }

  // Default: one row per allocation event with aggregated candidate JSON
  const header = [
    'createdAt',
    'agentName',
    'taskType',
    'cohortKey',
    'transition',
    'strategy',
    'previousPolicyHash',
    'chosenPolicyHash',
    'topCandidatePolicyHash',
    'topCandidateUcbScore',
    'candidatesCount',
    'candidatesJson',
  ]
  const lines = [header.join(',')]
  for (const row of rows) {
    const topCandidate = row.candidates?.[0]
    const values = [
      row.createdAt,
      row.agentName,
      row.taskType,
      row.cohortKey,
      row.transition,
      row.strategy,
      row.previousPolicyHash || '',
      row.chosenPolicyHash || '',
      topCandidate?.policyHash || '',
      topCandidate?.ucbScore == null ? '' : Number(topCandidate.ucbScore).toFixed(6),
      row.candidates?.length || 0,
      JSON.stringify(row.candidates || []),
    ]
    lines.push(values.map(csvCell).join(','))
  }
  return `${lines.join('\n')}\n`
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const url = new URL(request.url)
  const agentName = url.searchParams.get('agentName') || undefined
  const taskType = url.searchParams.get('taskType') || undefined
  const cohortKey = url.searchParams.get('cohortKey') || undefined
  const stage = url.searchParams.get('stage') || undefined
  const jobName = url.searchParams.get('jobName') || undefined
  const from = url.searchParams.get('from') || undefined
  const to = url.searchParams.get('to') || undefined
  const limit = toNum(url.searchParams.get('limit'), 120)
  const boardLimit = toNum(url.searchParams.get('boardLimit'), 50)
  const timelineLimit = toNum(url.searchParams.get('timelineLimit'), 120)
  const compareA = url.searchParams.get('compareA') || undefined
  const compareB = url.searchParams.get('compareB') || undefined
  const allocationExport = parseAllocationExport(url.searchParams.get('allocationExport') || url.searchParams.get('export'))
  const includeCandidates = url.searchParams.get('includeCandidates') === 'true'
  const hasScope = Boolean(agentName && taskType)

  if (allocationExport) {
    const banditPlan = await buildDiscoveryEnrichmentBanditPlan()
    await recordBanditAllocationPlan(banditPlan)
    const allocationTimeline = await listPolicyAllocationTimeline({
      agentName,
      taskType,
      cohortKey,
      stage,
      from,
      to,
      limit: timelineLimit,
    })

    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    if (allocationExport === 'json') {
      return new NextResponse(JSON.stringify(allocationTimeline, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="allocation-timeline-${stamp}.json"`,
          'Cache-Control': 'no-store',
        },
      })
    }

    const csvRows = allocationTimeline.map((item) => ({
      createdAt: item.createdAt,
      agentName: item.agentName,
      taskType: item.taskType,
      cohortKey: item.cohortKey,
      transition: item.transition,
      strategy: item.strategy,
      previousPolicyHash: item.previousPolicyHash,
      chosenPolicyHash: item.chosenPolicyHash,
      candidates: (item.candidates || []).map((candidate) => ({
        policyHash: candidate.policyHash,
        ucbScore: candidate.ucbScore,
      })),
    }))
    const csv = buildAllocationTimelineCsv(csvRows, includeCandidates)
    const csvSuffix = includeCandidates ? '-by-candidate' : ''

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="allocation-timeline${csvSuffix}-${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  }

  const [snapshots, candidates, activeState, audit, board, timeline, banditPlan] = await Promise.all([
    hasScope ? listPolicySnapshots({ agentName, taskType, cohortKey, stage, jobName, from, to, limit }) : Promise.resolve([]),
    hasScope ? summarizePolicyCandidates({ agentName, taskType, cohortKey, stage, jobName, from, to, limit: 500 }) : Promise.resolve([]),
    hasScope ? getActivePolicyState(agentName as string, taskType as string, cohortKey || 'global') : Promise.resolve(null),
    hasScope ? listPolicyAudit({ agentName, taskType, cohortKey, stage, from, to, limit: 80 }) : Promise.resolve([]),
    listActivePolicyBoard({ agentName, taskType, cohortKey, stage, from, to, limit: boardLimit }),
    listPolicyTimeline({ agentName, taskType, cohortKey, stage, from, to, limit: timelineLimit }),
    buildDiscoveryEnrichmentBanditPlan(),
  ])

  await recordBanditAllocationPlan(banditPlan)
  const allocationTimeline = await listPolicyAllocationTimeline({
    agentName,
    taskType,
    cohortKey,
    stage,
    from,
    to,
    limit: timelineLimit,
  })

  const byHash = new Map(candidates.map((c) => [c.policyHash, c]))
  const comparison = comparePolicyCandidates(
    compareA ? byHash.get(compareA) : undefined,
    compareB ? byHash.get(compareB) : undefined,
  )

  return NextResponse.json({
    success: true,
    filters: { agentName, taskType, cohortKey, stage, jobName, from, to, limit },
    activeState,
    candidates,
    comparison,
    snapshots,
    audit,
    board,
    timeline,
    banditPlan,
    allocationTimeline,
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const body = await request.json().catch(() => ({} as Record<string, unknown>))
  const action = String(body.action || 'evaluate').trim()
  const agentName = String(body.agentName || '').trim()
  const taskType = String(body.taskType || '').trim()
  const cohortKey = body.cohortKey ? String(body.cohortKey).trim() : 'global'
  const stage = body.stage ? String(body.stage).trim() : undefined
  const candidatePolicyHash = body.candidatePolicyHash ? String(body.candidatePolicyHash).trim() : undefined

  if (!agentName || !taskType) {
    return NextResponse.json(
      { success: false, error: 'agentName and taskType are required' },
      { status: 400 },
    )
  }

  const thresholds = {
    minRuns: toNum(body.minRuns == null ? null : String(body.minRuns), 8),
    minWindowHours: toNum(body.minWindowHours == null ? null : String(body.minWindowHours), 24),
    minGainScore: toNum(body.minGainScore == null ? null : String(body.minGainScore), 0.04),
    rollbackDropScore: toNum(body.rollbackDropScore == null ? null : String(body.rollbackDropScore), 0.06),
    maxScoreStdDev: toNum(body.maxScoreStdDev == null ? null : String(body.maxScoreStdDev), 0.22),
    minComparableShare: toNum(body.minComparableShare == null ? null : String(body.minComparableShare), 0.6),
  }

  if (action === 'rollback') {
    const decision = await runPolicyRollbackCheck({ agentName, taskType, cohortKey, stage, thresholds })
    return NextResponse.json({ success: true, action, decision })
  }

  if (action === 'promote' || action === 'evaluate') {
    const promotion = candidatePolicyHash
      ? await promotePolicyCandidate({ agentName, taskType, cohortKey, stage, policyHash: candidatePolicyHash, thresholds })
      : await runPolicyPromotionDecision({ agentName, taskType, cohortKey, stage, thresholds })
    const rollback = await runPolicyRollbackCheck({ agentName, taskType, cohortKey, stage, thresholds })
    return NextResponse.json({ success: true, action, cohortKey, candidatePolicyHash: candidatePolicyHash || null, promotion, rollback })
  }

  return NextResponse.json(
    { success: false, error: `Unsupported action: ${action}` },
    { status: 400 },
  )
}
