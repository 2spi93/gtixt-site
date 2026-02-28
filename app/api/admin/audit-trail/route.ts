// /opt/gpti/gpti-site/app/api/admin/audit-trail/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminUser(request, ['admin', 'auditor']);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (status) where.success = status === 'success';
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const logs = await prisma.adminAuditTrail.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const stats = await prisma.adminAuditTrail.groupBy({
      by: ['action'],
      _count: { action: true },
    });

    const counts = stats.reduce((acc, item) => {
      acc[item.action] = item._count.action;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: logs,
      counts,
      total: logs.length,
    });
  } catch (error) {
    console.error('GET /api/admin/audit-trail failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit trail', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const originCheck = requireSameOrigin(request);
    if (originCheck) return originCheck;

    const auth = await requireAdminUser(request, ['admin', 'auditor']);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { 
      action, 
      userId = 'system', 
      ipAddress,
      filePath, 
      details, 
      beforeState, 
      afterState,
      environment = 'production',
      success = true,
      errorMsg,
    } = body;

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    const log = await prisma.adminAuditTrail.create({
      data: {
        action,
        userId,
        ipAddress,
        filePath,
        details,
        beforeState,
        afterState,
        environment,
        success,
        errorMsg,
      },
    });

    return NextResponse.json({
      success: true,
      log,
    });
  } catch (error) {
    console.error('POST /api/admin/audit-trail failed:', error);
    return NextResponse.json(
      { error: 'Failed to create audit log', details: String(error) },
      { status: 500 }
    );
  }
}
