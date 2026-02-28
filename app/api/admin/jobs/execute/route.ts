// /opt/gpti/gpti-site/app/api/admin/jobs/execute/route.ts
// Execute job with real Python script execution

import { NextRequest, NextResponse } from 'next/server';
import { executeJob, logJobExecution, JOB_REGISTRY } from '@/lib/jobExecutor';
import { prisma } from '@/lib/prisma';
import { requireAdminUser, requireSameOrigin } from '@/lib/admin-api-auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminUser(request, ['admin']);
    if (auth instanceof NextResponse) return auth;

    const sameOriginError = requireSameOrigin(request);
    if (sameOriginError) return sameOriginError;

    const body = await request.json();
    const { jobName } = body;

    if (!jobName) {
      return NextResponse.json(
        { error: 'jobName is required' },
        { status: 400 }
      );
    }

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

    // Create initial job record
    const jobRecord = await prisma.adminJobs.create({
      data: {
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jobType: jobName,
        status: 'running',
        executionCount: 1,
        successCount: 0,
        failureCount: 0,
        lastExecutedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Execute job asynchronously (don't wait for completion)
    executeJobInBackground(jobName, jobRecord.id);

    return NextResponse.json({
      success: true,
      message: 'Job started',
      data: {
        jobId: jobRecord.id,
        jobName,
        status: 'running',
      },
    });
  } catch (error) {
    console.error('POST /api/admin/jobs/execute failed:', error);
    return NextResponse.json(
      { error: 'Failed to execute job', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function executeJobInBackground(jobName: string, jobId: string) {
  try {
    // Execute the actual Python script
    const result = await executeJob(jobName);

    // Update job record with result
    await prisma.adminJobs.update({
      where: { id: jobId },
      data: {
        status: result.success ? 'success' : 'failed',
        lastExecutedAt: result.endTime,
        successCount: result.success ? 1 : 0,
        failureCount: result.success ? 0 : 1,
        updatedAt: new Date(),
      },
    });

    // Log to operations
    await prisma.adminOperations.create({
      data: {
        id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'admin',
        operationType: 'job',
        operation: 'job_execution',
        firmId: null,
        status: result.success ? 'success' : 'failed',
        details: {
          jobId,
          jobName,
          success: result.success,
          duration: result.duration,
          exitCode: result.exitCode,
          output: result.output.substring(0, 1000), // Store first 1KB of output
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`Job ${jobName} completed:`, result.success ? 'SUCCESS' : 'FAILED');
  } catch (error) {
    console.error(`Job ${jobName} execution failed:`, error);

    // Update job as failed
    await prisma.adminJobs.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        lastExecutedAt: new Date(),
        failureCount: 1,
        updatedAt: new Date(),
      },
    });
  }
}
