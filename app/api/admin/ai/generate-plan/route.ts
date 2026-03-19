import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth';

const buildPlan = (context: {
  pendingValidations: number;
  failedJobs: number;
  runningCrawls: number;
}) => {
  const tasks: string[] = [];

  if (context.runningCrawls > 0) {
    tasks.push('Monitor running crawls and verify completion logs');
  } else {
    tasks.push('Launch priority crawl for high-NA firms');
  }

  if (context.pendingValidations > 0) {
    tasks.push(`Review ${context.pendingValidations} pending validation(s)`);
  }

  if (context.failedJobs > 0) {
    tasks.push('Retry failed jobs and document root cause');
  } else {
    tasks.push('Run daily enrichment job');
  }

  tasks.push('Export audit log and update operations notes');

  return {
    title: 'Daily GTIXT Operations Plan',
    recommendation: 'Focus on validation backlog and system stability before new batch runs.',
    tasks,
  };
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminUser(request, ['admin', 'lead_reviewer']);
    if (auth instanceof NextResponse) return auth;

    const sameOriginError = requireSameOrigin(request);
    if (sameOriginError) return sameOriginError;

    const pendingValidations = await prisma.adminValidation.count({
      where: { status: 'pending' },
    });

    const failedJobs = await prisma.adminJobs.count({
      where: { status: 'failed' },
    });

    const runningCrawls = await prisma.adminCrawls.count({
      where: { status: 'running' },
    });

    const plan = buildPlan({ pendingValidations, failedJobs, runningCrawls });

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error('POST /api/admin/ai/generate-plan failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    );
  }
}
