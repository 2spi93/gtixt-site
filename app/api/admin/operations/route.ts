// /opt/gpti/gpti-site/app/api/admin/operations/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get('user');
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: any = {};

    if (user) where.userId = user;
    if (type) where.operationType = type;

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = new Date(dateFrom);
      if (dateTo) where.timestamp.lte = new Date(dateTo);
    }

    const operations = await prisma.adminOperations.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const grouped = await prisma.adminOperations.groupBy({
      by: ['operationType'],
      _count: { operationType: true },
    });

    const counts = grouped.reduce(
      (acc, item) => {
        acc.total += item._count.operationType || 0;
        acc.byType[item.operationType] = item._count.operationType || 0;
        return acc;
      },
      { total: 0, byType: {} as Record<string, number> }
    );

    return NextResponse.json({
      success: true,
      data: operations,
      counts,
    });
  } catch (error) {
    console.error('GET /api/admin/operations failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch operations' },
      { status: 500 }
    );
  }
}
