import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get active crawl jobs
    const activeCrawls = await prisma.adminCrawls.findMany({
      where: {
        status: { in: ['running', 'pending'] },
      },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const completedCrawls = await prisma.adminCrawls.findMany({
      where: {
        status: 'completed',
      },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 1,
    });

    return NextResponse.json(
      {
        status: activeCrawls.length > 0 ? 'crawling' : 'idle',
        activeCrawls: activeCrawls.length,
        jobs: activeCrawls,
        lastCompleted: completedCrawls[0] || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Crawls status error:', error);
    return NextResponse.json(
      { error: 'Failed to get crawls status' },
      { status: 500 }
    );
  }
}
