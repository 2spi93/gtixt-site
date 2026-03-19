import { NextRequest, NextResponse } from 'next/server'
import { recordUserFeedback } from '@/lib/autonomous-lab/hypothesis-generator'
import type { LabModule } from '@/lib/autonomous-lab/types'

const VALID_MODULES = ['scoring', 'webgl', 'pipeline', 'operator'] as const
const VALID_TYPES = [
  'ranking_good',
  'ranking_bad',
  'suspicious_firm',
  'firm_undervalued',
  'firm_overvalued',
  'other',
] as const

type NormalizedFeedbackType = (typeof VALID_TYPES)[number]

function normalizeFeedbackType(raw: string): NormalizedFeedbackType {
  const v = raw.trim().toLowerCase()

  if (v === '👍' || v === '+1' || v === 'good' || v === 'ranking_good') return 'ranking_good'
  if (v === '👎' || v === '-1' || v === 'bad' || v === 'ranking_bad') return 'ranking_bad'
  if (v === '⚠' || v === 'suspicious' || v === 'suspicious_firm') return 'suspicious_firm'

  if ((VALID_TYPES as readonly string[]).includes(v)) {
    return v as NormalizedFeedbackType
  }

  return 'other'
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json body' }, { status: 400 })
  }

  const moduleNameRaw = typeof body.module === 'string' ? body.module : 'scoring'
  const feedbackTypeRaw = typeof body.feedbackType === 'string' ? body.feedbackType : 'other'
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const firmId = typeof body.firmId === 'string' ? body.firmId.trim() : undefined
  const confidence = typeof body.confidence === 'number' ? body.confidence : 0.6
  const userTrustScore = typeof body.userTrustScore === 'number'
    ? Math.max(0.25, Math.min(3, body.userTrustScore))
    : 1

  if (!VALID_MODULES.includes(moduleNameRaw as (typeof VALID_MODULES)[number])) {
    return NextResponse.json({ error: 'module must be scoring|webgl|pipeline|operator' }, { status: 400 })
  }
  const feedbackType = normalizeFeedbackType(feedbackTypeRaw)
  if (!message || message.length < 6 || message.length > 500) {
    return NextResponse.json({ error: 'message must be between 6 and 500 chars' }, { status: 400 })
  }

  const moduleName = moduleNameRaw as LabModule

  // Weight is derived from explicit confidence and bounded to a safe range.
  const weight = Math.max(0.4, Math.min(5, Number((confidence * 2).toFixed(2))))

  const saved = await recordUserFeedback({
    module: moduleName,
    feedbackType,
    message,
    firmId,
    weight,
    context: {
      userTrustScore,
      path: request.headers.get('referer') || null,
      ua: request.headers.get('user-agent') || null,
      ip: request.headers.get('x-forwarded-for') || null,
    },
  })

  return NextResponse.json({ success: true, data: saved })
}
