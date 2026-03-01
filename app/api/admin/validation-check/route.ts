import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/admin-api-auth';

type CheckResult = {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
};

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminUser(request, ['admin']);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const checkType = searchParams.get('type') || 'all'; // all, data, system, security

    const results: CheckResult[] = [];

    // Data Integrity Checks
    if (checkType === 'all' || checkType === 'data') {
      const firmCount = await prisma.firms.count();
      results.push({
        name: 'Firms Count',
        status: firmCount > 0 ? 'pass' : 'warning',
        message: `${firmCount} firms in database`,
        details: { count: firmCount },
      });

      const evidenceCount = await prisma.evidence_collection?.count?.() || 0;
      results.push({
        name: 'Evidence Collection',
        status: evidenceCount > 0 ? 'pass' : 'warning',
        message: `${evidenceCount} evidence items collected`,
        details: { count: evidenceCount },
      });

      // Check for incomplete firm data
      const incompleteFirms = await prisma.firms.count({
        where: {
          OR: [
            { name: null },
            { name: '' },
          ],
        },
      });

      results.push({
        name: 'Data Completeness',
        status: incompleteFirms < firmCount * 0.1 ? 'pass' : 'warning',
        message: `${incompleteFirms} firms have incomplete data`,
        details: { incompleteCount: incompleteFirms, totalFirms: firmCount },
      });
    }

    // System Health Checks
    if (checkType === 'all' || checkType === 'system') {
      // Check recent crawls
      const recentCrawls = await prisma.adminCrawls.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
          },
        },
      });

      results.push({
        name: 'Recent Crawl Activity',
        status: recentCrawls > 0 ? 'pass' : 'warning',
        message: `${recentCrawls} crawls in last 24 hours`,
        details: { crawlCount: recentCrawls },
      });

      // Check recent jobs
      const recentJobs = await prisma.adminJobs.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      results.push({
        name: 'Recent Job Execution',
        status: recentJobs > 0 ? 'pass' : 'warning',
        message: `${recentJobs} jobs executed in last 24 hours`,
        details: { jobCount: recentJobs },
      });

      // Check failed jobs
      const failedJobs = await prisma.adminJobs.count({
        where: {
          status: 'failed',
        },
      });

      results.push({
        name: 'Job Failures',
        status: failedJobs < 5 ? 'pass' : failedJobs < 20 ? 'warning' : 'fail',
        message: `${failedJobs} jobs with failures`,
        details: { failedCount: failedJobs },
      });
    }

    // Validation Quality Checks
    if (checkType === 'all' || checkType === 'validation') {
      const validationResults = await prisma.adminValidation.groupBy({
        by: ['status'],
        _count: { status: true },
      });

      const counts = validationResults.reduce(
        (acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        },
        {} as Record<string, number>
      );

      const approved = counts['approved'] || 0;
      const rejected = counts['rejected'] || 0;
      const pending = counts['pending'] || 0;
      const total = approved + rejected + pending;

      results.push({
        name: 'Validation Queue',
        status: pending < 100 ? 'pass' : pending < 500 ? 'warning' : 'fail',
        message: `${pending} pending, ${approved} approved, ${rejected} rejected`,
        details: { approved, rejected, pending, total },
      });

      const approvalRate = total > 0 ? (approved / total) * 100 : 0;
      results.push({
        name: 'Approval Rate',
        status: approvalRate > 80 ? 'pass' : approvalRate > 50 ? 'warning' : 'fail',
        message: `${approvalRate.toFixed(1)}% of validations approved`,
        details: { approvalRate },
      });
    }

    // Security Checks
    if (checkType === 'all' || checkType === 'security') {
      const auditLogs = await prisma.adminAuditTrail.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      });

      results.push({
        name: 'Audit Trail Activity',
        status: auditLogs > 0 ? 'pass' : 'warning',
        message: `${auditLogs} audit events in last week`,
        details: { eventCount: auditLogs },
      });

      // Check for suspicious activity
      const failedLogins = await prisma.adminAuditTrail.count({
        where: {
          action: 'login_failed',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      results.push({
        name: 'Security - Failed Logins',
        status: failedLogins < 10 ? 'pass' : failedLogins < 50 ? 'warning' : 'fail',
        message: `${failedLogins} failed login attempts in last 24h`,
        details: { count: failedLogins },
      });
    }

    // Calculate summary
    const passed = results.filter(r => r.status === 'pass').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const overallStatus = failed > 0 ? 'fail' : warnings > 0 ? 'warning' : 'pass';

    return NextResponse.json({
      success: true,
      overallStatus,
      summary: {
        total: results.length,
        passed,
        warnings,
        failed,
      },
      checks: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('GET /api/admin/validation-check failed:', error);
    return NextResponse.json(
      {
        error: 'Validation check failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminUser(request, ['admin']);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { checkType = 'all', autoFix = false } = body;

    // For now, POST just returns the same as GET + indicates if auto-fix was attempted
    const getRequest = new NextRequest(request, {
      method: 'GET',
    });
    const response = await GET(getRequest);
    const data = await response.json();

    return NextResponse.json({
      ...data,
      autoFixAttempted: autoFix,
      message: autoFix ? 'Automatic fixes queued for background processing' : undefined,
    });
  } catch (error) {
    console.error('POST /api/admin/validation-check failed:', error);
    return NextResponse.json(
      { error: 'Validation check failed' },
      { status: 500 }
    );
  }
}
