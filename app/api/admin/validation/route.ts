import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type ValidationStatus = 'pending' | 'approved' | 'rejected';

type ValidationCounts = {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
};

const emptyCounts = (): ValidationCounts => ({
  all: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
});

const getCounts = async (): Promise<ValidationCounts> => {
  const counts = emptyCounts();
  const grouped = await prisma.adminValidation.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  grouped.forEach(group => {
    const status = group.status as ValidationStatus;
    const count = group._count.status || 0;
    counts[status] = count;
    counts.all += count;
  });

  return counts;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || 'all') as ValidationStatus | 'all';
    const includeCounts = searchParams.get('includeCounts') === 'true';

    const where = status === 'all' ? undefined : { status };

    const firms = await prisma.adminValidation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const response: Record<string, unknown> = {
      success: true,
      data: firms,
    };

    if (includeCounts) {
      response.counts = await getCounts();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/admin/validation failed:', error);
    return NextResponse.json({ error: 'Failed to fetch validations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firmId, firmIds, approved, undo, includeCounts } = body as {
      firmId?: string;
      firmIds?: string[];
      approved?: boolean;
      undo?: boolean;
      includeCounts?: boolean;
    };

    if (undo && !firmId) {
      return NextResponse.json({ error: 'firmId is required for undo' }, { status: 400 });
    }

    if (!undo && typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'approved is required' }, { status: 400 });
    }

    if (!undo && !firmId && (!firmIds || firmIds.length === 0)) {
      return NextResponse.json({ error: 'firmId or firmIds is required' }, { status: 400 });
    }

    let updatedCount = 0;
    let updatedFirm = null as null | unknown;

    if (undo && firmId) {
      updatedFirm = await prisma.adminValidation.update({
        where: { id: firmId },
        data: { status: 'pending' },
      });
      updatedCount = 1;

      await prisma.adminOperations.create({
        data: {
          id: `op_${Date.now()}_${Math.random()}`, 
          operationType: 'validation',
          operation: 'UNDO',
          firmId: firmId,
          userId: 'system',
          status: 'pending',
          details: { firmId },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } else if (firmIds && firmIds.length > 0) {
      const nextStatus: ValidationStatus = approved ? 'approved' : 'rejected';
      const result = await prisma.adminValidation.updateMany({
        where: { id: { in: firmIds } },
        data: { status: nextStatus },
      });
      updatedCount = result.count;

      await prisma.adminOperations.createMany({
        data: firmIds.map((id, idx) => ({
          id: `op_${Date.now()}_${idx}`,
          operationType: 'validation',
          operation: approved ? 'APPROVE' : 'REJECT',
          firmId: id,
          userId: 'system',
          status: nextStatus,
          details: { firmId: id },
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      });
    } else if (firmId) {
      const nextStatus: ValidationStatus = approved ? 'approved' : 'rejected';
      updatedFirm = await prisma.adminValidation.update({
        where: { id: firmId },
        data: { status: nextStatus },
      });
      updatedCount = 1;

      await prisma.adminOperations.create({
        data: {
          id: `op_${Date.now()}_${Math.random()}`,
          operationType: 'validation',
          operation: approved ? 'APPROVE' : 'REJECT',
          firmId: firmId,
          userId: 'system',
          status: nextStatus,
          details: { firmId },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    const response: Record<string, unknown> = {
      success: true,
      updatedCount,
      firm: updatedFirm,
    };

    if (includeCounts) {
      response.counts = await getCounts();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('POST /api/admin/validation failed:', error);
    return NextResponse.json({ error: 'Failed to update validation' }, { status: 500 });
  }
}
