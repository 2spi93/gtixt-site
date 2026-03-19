import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import { reviewPromotionRequest, updateExperiment } from '@/lib/autonomous-lab/registry'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminUser(request, ['admin'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const { id } = await params
  const body = await request.json()
  const decision = String(body?.decision || '').toLowerCase()
  const note = typeof body?.note === 'string' ? body.note : ''

  if (decision !== 'approve' && decision !== 'reject') {
    return NextResponse.json({ error: 'decision must be approve or reject' }, { status: 400 })
  }

  const reviewed = await reviewPromotionRequest({
    id,
    status: decision === 'approve' ? 'approved' : 'rejected',
    reviewedBy: auth.user?.username || 'admin',
    reviewNote: note,
  })

  if (!reviewed) {
    return NextResponse.json({ error: 'promotion request not found' }, { status: 404 })
  }

  await updateExperiment(reviewed.experimentId, {
    status: decision === 'approve' ? 'approved' : 'rejected',
  })

  await prisma.adminAuditTrail.create({
    data: {
      action: 'autonomous_promotion_decision',
      userId: auth.user?.username || 'admin',
      details: JSON.stringify({ promotionId: id, experimentId: reviewed.experimentId, decision, note }),
      environment: 'production',
      success: true,
    },
  })

  return NextResponse.json({ success: true, data: reviewed })
}
