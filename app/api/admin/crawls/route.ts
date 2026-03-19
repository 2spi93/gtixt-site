// /opt/gpti/gpti-site/app/api/admin/crawls/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth';

export async function GET(_request: NextRequest) {
  try {
    const auth = await requireAdminUser(_request, ['admin', 'lead_reviewer', 'auditor', 'reviewer']);
    if (auth instanceof NextResponse) return auth;

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
    const auth = await requireAdminUser(request, ['admin', 'lead_reviewer']);
    if (auth instanceof NextResponse) return auth;

    const sameOriginError = requireSameOrigin(request);
    if (sameOriginError) return sameOriginError;

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

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdminUser(request, ['admin', 'lead_reviewer']);
    if (auth instanceof NextResponse) return auth;

    const sameOriginError = requireSameOrigin(request);
    if (sameOriginError) return sameOriginError;

    const body = await request.json();
    const { crawlId, action } = body as { crawlId?: string; action?: 'retry' | 'stop' | 'rerun' };

    if (!crawlId || !action) {
      return NextResponse.json({ error: 'crawlId and action are required' }, { status: 400 });
    }

    const existing = await prisma.adminCrawls.findUnique({ where: { id: crawlId } });
    if (!existing) {
      return NextResponse.json({ error: 'Crawl not found' }, { status: 404 });
    }

    if (action === 'stop') {
      const updated = await prisma.adminCrawls.update({
        where: { id: crawlId },
        data: {
          status: 'failed',
          updatedAt: new Date(),
        },
      });

      await prisma.adminOperations.create({
        data: {
          id: `op_${Date.now()}`,
          operationType: 'crawl',
          operation: 'STOP',
          firmId: null,
          userId: 'system',
          status: 'success',
          details: { crawlId, action },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, message: `Crawl ${crawlId} stopped`, data: updated });
    }

    if (action === 'retry' || action === 'rerun') {
      const newId = `crawl_${Date.now()}`;
      const cloned = await prisma.adminCrawls.create({
        data: {
          id: newId,
          name: `${existing.name}_${action}`,
          status: 'pending',
          url: existing.url,
          resultsCount: 0,
          errorCount: 0,
          updatedAt: new Date(),
        },
      });

      await prisma.adminOperations.create({
        data: {
          id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          operationType: 'crawl',
          operation: action.toUpperCase(),
          firmId: null,
          userId: 'system',
          status: 'pending',
          details: { crawlId, newCrawlId: newId, action },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Crawl ${action} queued as ${newId}`,
        data: cloned,
      });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    console.error('PATCH /api/admin/crawls failed:', error);
    return NextResponse.json(
      { error: 'Failed to update crawl' },
      { status: 500 }
    );
  }
}
