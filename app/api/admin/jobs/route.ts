// /opt/gpti/gpti-site/app/api/admin/jobs/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAvailableJobs, JOB_REGISTRY } from '@/lib/jobExecutor';

export async function GET(request: NextRequest) {
  try {
    const availableJobs = getAvailableJobs();
    
    const jobs = availableJobs.map(job => ({
      name: job.name,
      category: job.category,
      description: job.description,
      enabled: job.enabled,
      status: job.enabled ? 'idle' : 'disabled',
    }));

    const grouped = await prisma.adminJobs.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const executionCounts = grouped.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status || 0;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      success: true,
      data: jobs,
      counts: {
        totalJobs: jobs.length,
        executionsByStatus: executionCounts,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/jobs failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobName } = body;

    // Validate job exists
    const job = JOB_REGISTRY[jobName];
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (!job.enabled) {
      return NextResponse.json(
        { error: 'Job is disabled' },
        { status: 403 }
      );
    }

    // Create initial execution record
    const execution = await prisma.adminJobs.create({
      data: {
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: jobName,
        status: 'queued',
        durationMs: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Job queued for execution',
      data: execution,
    });
  } catch (error) {
    console.error('POST /api/admin/jobs failed:', error);
    return NextResponse.json(
      { error: 'Failed to queue job' },
      { status: 500 }
    );
  }
}
