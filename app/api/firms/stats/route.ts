import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    const totalRows = await prisma.$queryRaw<Array<{ total: number }>>`
      SELECT COUNT(*)::int AS total
      FROM real_firms_only
    `;
    const totalFirms = Number(totalRows[0]?.total || 0);

    const firmsByCountry = await prisma.$queryRaw<Array<{ jurisdiction: string | null; count: number }>>`
      SELECT
        jurisdiction,
        COUNT(*)::int AS count
      FROM real_firms_only
      GROUP BY jurisdiction
      ORDER BY COUNT(*) DESC
    `;

    const completeRows = await prisma.$queryRaw<Array<{ total: number }>>`
      SELECT COUNT(*)::int AS total
      FROM real_firms_only
      WHERE name IS NOT NULL
    `;
    const completeFirms = Number(completeRows[0]?.total || 0);

    const incompleteFirms = totalFirms - completeFirms;

    return NextResponse.json(
      {
        total: totalFirms,
        complete: completeFirms,
        incomplete: incompleteFirms,
        completionRate: totalFirms > 0 ? ((completeFirms / totalFirms) * 100).toFixed(2) : 0,
        byCountry: firmsByCountry.map((f) => ({ jurisdiction: f.jurisdiction, count: Number(f.count || 0) })),
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
