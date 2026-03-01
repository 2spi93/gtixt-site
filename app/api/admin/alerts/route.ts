import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type AlertSeverity = 'error' | 'warning' | 'info';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = (searchParams.get('severity') || 'all') as AlertSeverity | 'all';
    const limit = Number(searchParams.get('limit') || 50);

    const where = severity === 'all' ? undefined : { severity };

    // Fetch alerts
    const alerts = await prisma.adminAlerts.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number.isFinite(limit) ? Math.min(limit, 200) : 50,
    });

    // Get counts by severity
    const counts = await prisma.adminAlerts.groupBy({
      by: ['severity'],
      _count: { severity: true },
    });

    const severityCounts = counts.reduce(
      (acc, item) => {
        acc[item.severity] = item._count.severity;
        return acc;
      },
      { error: 0, warning: 0, info: 0 } as Record<string, number>
    );

    const data = alerts.map(alert => ({
      id: alert.id,
      severity: alert.severity as AlertSeverity,
      title: alert.title,
      description: alert.description,
      timestamp: alert.createdAt,
      acknowledged: alert.acknowledged,
    }));

    return NextResponse.json({
      success: true,
      data,
      counts: {
        total: alerts.length,
        ...severityCounts,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/alerts failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
