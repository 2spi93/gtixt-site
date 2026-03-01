import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where = {
      name: { startsWith: 'enrichment' },
      ...(status && { status }),
    };

    const jobs = await prisma.adminJobs.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.adminJobs.count({ where });

    return NextResponse.json(
      { data: jobs, total, limit, offset },
      { status: 200 }
    );
  } catch (error) {
    console.error('Enrichment jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to get enrichment jobs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type = 'full_enrichment' } = body;

    // Create a new enrichment job
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const job = await prisma.adminJobs.create({
      data: {
        id,
        name: type || 'enrichment',
        status: 'pending',
        durationMs: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      { success: true, job },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create enrichment job error:', error);
    return NextResponse.json(
      { error: 'Failed to create enrichment job' },
      { status: 500 }
    );
  }
}
