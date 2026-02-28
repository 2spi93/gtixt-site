import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get current enrichment jobs status
    const activeJobs = await prisma.adminJobs.findMany({
      where: {
        jobType: 'enrichment',
        status: { in: ['running', 'pending'] },
      },
      select: {
        id: true,
        jobType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const completedJobs = await prisma.adminJobs.findMany({
      where: {
        jobType: 'enrichment',
        status: 'completed',
      },
      select: {
        id: true,
        jobType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 1,
    });

    return NextResponse.json(
      {
        status: activeJobs.length > 0 ? 'enriching' : 'idle',
        activeJobs: activeJobs.length,
        jobs: activeJobs,
        lastCompleted: completedJobs[0] || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Enrichment status error:', error);
    return NextResponse.json(
      { error: 'Failed to get enrichment status' },
      { status: 500 }
    );
  }
}
