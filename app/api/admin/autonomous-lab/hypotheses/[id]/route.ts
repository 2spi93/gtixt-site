import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth'
import { updateBacklogItemStatus } from '@/lib/autonomous-lab/hypothesis-generator'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminUser(request, ['admin', 'lead_reviewer'])
  if (auth instanceof NextResponse) return auth

  const sameOrigin = requireSameOrigin(request)
  if (sameOrigin) return sameOrigin

  const { id } = await params
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const body = await request.json()
  const status = body?.status
  if (!['pending', 'promoted', 'dismissed'].includes(status)) {
    return NextResponse.json({ error: 'status must be pending | promoted | dismissed' }, { status: 400 })
  }

  await updateBacklogItemStatus(id, status)
  return NextResponse.json({ success: true, id, status })
}
