// /opt/gpti/gpti-site/app/api/admin/crawls/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const crawls = await prisma.adminCrawls.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const grouped = await prisma.adminCrawls.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const counts = grouped.reduce(
      (acc, item) => {
        acc.total += item._count.status || 0;
        acc.byStatus[item.status] = item._count.status || 0;
        return acc;
      },
      { total: 0, byStatus: {} as Record<string, number> }
    );

    return NextResponse.json({
      success: true,
      data: crawls,
      counts,
    });
  } catch (error) {
    console.error('GET /api/admin/crawls failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crawls' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, maxFirms, priority } = body;

    // Generate a unique ID
    const crawlId = `crawl_${Date.now()}`;
    const crawlName = `${type || 'general'}_crawl_${maxFirms || 100}_firms`;

    const crawl = await prisma.adminCrawls.create({
      data: {
        id: crawlId,
        name: crawlName,
        status: 'pending',
        url: type || 'batch_crawl',
        resultsCount: 0,
        errorCount: 0,
        updatedAt: new Date(),
      },
    });

    // Audit log
    await prisma.adminOperations.create({
      data: {
        id: `op_${Date.now()}`,
        operationType: 'crawl',
        operation: 'CREATE',
        firmId: null,
        userId: 'system',
        status: 'pending',
        details: { type, maxFirms, priority, crawlId },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: crawl,
    });
  } catch (error) {
    console.error('POST /api/admin/crawls failed:', error);
    return NextResponse.json(
      { error: 'Failed to create crawl' },
      { status: 500 }
    );
  }
}
