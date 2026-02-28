import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const totalFirms = await prisma.firms.count();

    const firmsByCountry = await prisma.firms.groupBy({
      by: ['jurisdiction'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    const completeFirms = await prisma.firms.count({
      where: {
        name: { not: null },
      },
    });

    const incompleteFirms = totalFirms - completeFirms;

    return NextResponse.json(
      {
        total: totalFirms,
        complete: completeFirms,
        incomplete: incompleteFirms,
        completionRate: totalFirms > 0 ? ((completeFirms / totalFirms) * 100).toFixed(2) : 0,
        byCountry: firmsByCountry.map(f => ({ jurisdiction: f.jurisdiction, count: f._count.id })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Firms stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get firms stats' },
      { status: 500 }
    );
  }
}
