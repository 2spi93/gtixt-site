// /opt/gpti/gpti-site/app/api/admin/logs/route.ts
// Real system logs from Python scripts + database

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getRecentLogs, SystemLogEntry } from '@/lib/systemLogs';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/admin-api-auth';

type LogSeverity = 'info' | 'warning' | 'error';

const mapSeverity = (status: string): LogSeverity => {
  if (status === 'failed' || status === 'error') return 'error';
  if (status === 'pending') return 'warning';
  return 'info';
};

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminUser(request, ['admin', 'lead_reviewer', 'auditor', 'reviewer']);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const severity = (searchParams.get('severity') || 'all') as LogSeverity | 'all';
    const hours = Number(searchParams.get('hours') || 24);
    const limit = Number(searchParams.get('limit') || 200);
    const source = searchParams.get('source') || 'all'; // 'filesystem' | 'database' | 'all'

    let logs: SystemLogEntry[] = [];

    // Get logs from filesystem (Python logs)
    if (source === 'filesystem' || source === 'all') {
      try {
        const fileLogs = await getRecentLogs(hours, severity === 'all' ? undefined : severity);
        logs = [...logs, ...fileLogs];
      } catch (error) {
        console.error('Failed to read filesystem logs:', error);
      }
    }

    // Get logs from database (AdminOperations)
    if (source === 'database' || source === 'all') {
      const since = new Date(Date.now() - Math.max(hours, 1) * 60 * 60 * 1000);
      const operations = await prisma.adminOperations.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 500,
      });

      const dbLogs: SystemLogEntry[] = operations.map(op => ({
        timestamp: op.createdAt,
        level: mapSeverity(op.status),
        source: 'admin-operations',
        message: `${op.operation}${op.firmId ? ` (${op.firmId})` : ''}`,
        details: { operationType: op.operationType, firmId: op.firmId },
      }));

      logs = [...logs, ...dbLogs];

      // Include recent job lifecycle entries so logs are visible even when file logs are absent.
      const jobs = await prisma.adminJobs.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 300,
      });

      const jobLogs: SystemLogEntry[] = jobs.map(job => ({
        timestamp: job.updatedAt,
        level: mapSeverity(job.status),
        source: 'admin-jobs',
        message: `${job.name} -> ${job.status}`,
        details: { durationMs: job.durationMs },
      }));

      logs = [...logs, ...jobLogs];

      const crawls = await prisma.adminCrawls.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 300,
      });

      const crawlLogs: SystemLogEntry[] = crawls.map(crawl => ({
        timestamp: crawl.updatedAt,
        level: mapSeverity(crawl.status),
        source: 'admin-crawls',
        message: `${crawl.name} -> ${crawl.status}`,
        details: { url: crawl.url, resultsCount: crawl.resultsCount, errorCount: crawl.errorCount },
      }));

      logs = [...logs, ...crawlLogs];
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Filter by severity
    if (severity !== 'all') {
      logs = logs.filter(log => log.level === severity);
    }

    // Limit results
    logs = logs.slice(0, Math.min(limit, 1000));

    // Format for response
    let formattedLogs = logs.map(log => ({
      timestamp: log.timestamp.toISOString(),
      severity: log.level,
      component: log.source,
      message: log.message,
      details: log.details,
    }));

    if (formattedLogs.length === 0) {
      formattedLogs = [
        {
          timestamp: new Date().toISOString(),
          severity: 'info',
          component: 'system',
          message: 'No logs found for current filters. Check GTIXT_LOG_DIR or run a crawl/job to generate logs.',
          details: { source, hours, severity },
        },
      ];
    }

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      count: formattedLogs.length,
      filters: {
        hours,
        severity,
        source,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/logs failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

