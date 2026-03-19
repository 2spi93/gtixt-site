import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/admin-api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminUser(request, ['admin', 'lead_reviewer', 'auditor', 'reviewer']);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || 50);

    const executions = await prisma.adminJobs.findMany({
      orderBy: { createdAt: 'desc' },
      take: Number.isFinite(limit) ? Math.min(limit, 200) : 50,
    });

    // Pull recent operation logs to enrich execution rows with captured output snippets.
    const operations = await prisma.adminOperations.findMany({
      where: {
        operationType: 'job',
        operation: 'job_execution',
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const outputByJobId = new Map<string, string>();
    const errorByJobId = new Map<string, string>();
    for (const op of operations) {
      const details = (op.details || {}) as Record<string, unknown>;
      const jobId = typeof details.jobId === 'string' ? details.jobId : null;
      if (!jobId) continue;

      if (!outputByJobId.has(jobId) && typeof details.output === 'string' && details.output.trim().length > 0) {
        outputByJobId.set(jobId, details.output);
      }

      if (!errorByJobId.has(jobId) && typeof details.error === 'string' && details.error.trim().length > 0) {
        errorByJobId.set(jobId, details.error);
      }
    }

    const data = executions.map(exec => ({
      id: exec.id,
      jobName: exec.name,
      status: exec.status,
      startTime: exec.createdAt.toISOString(),
      endTime: exec.updatedAt.toISOString(),
      duration: exec.durationMs ? Math.round(exec.durationMs / 1000) : undefined,
      user: 'system',
      output: outputByJobId.get(exec.id) || undefined,
      error: errorByJobId.get(exec.id) || undefined,
    }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('GET /api/admin/jobs/executions failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job executions' },
      { status: 500 }
    );
  }
}
