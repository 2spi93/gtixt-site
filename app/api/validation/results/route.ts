import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const results = await prisma.evidence_validation_results.findMany({
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        firm_id: true,
        evidence_id: true,
        validation: true,
        created_at: true,
      },
    });

    const total = await prisma.evidence_validation_results.count();

    return NextResponse.json(
      {
        data: results.map(r => ({
          id: r.id,
          firmId: r.firm_id,
          evidenceId: r.evidence_id,
          validation: r.validation,
          createdAt: r.created_at,
        })),
        total,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Validation results error:', error);
    return NextResponse.json(
      { error: 'Failed to get validation results' },
      { status: 500 }
    );
  }
}
