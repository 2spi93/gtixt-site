import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || 50);

    const executions = await prisma.adminJobs.findMany({
      orderBy: { createdAt: 'desc' },
      take: Number.isFinite(limit) ? Math.min(limit, 200) : 50,
    });

    const data = executions.map(exec => ({
      id: exec.id,
      jobName: exec.name,
      status: exec.status,
      startTime: exec.createdAt.toISOString(),
      endTime: exec.updatedAt.toISOString(),
      duration: exec.durationMs ? Math.round(exec.durationMs / 1000) : undefined,
      user: 'system',
      output: null,
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
