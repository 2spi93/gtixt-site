import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const firms = await prisma.firms.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { website_root: { contains: query, mode: 'insensitive' } },
          { jurisdiction: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        name: true,
        website_root: true,
        jurisdiction: true,
      },
    });

    const total = await prisma.firms.count({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { website_root: { contains: query, mode: 'insensitive' } },
          { jurisdiction: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    return NextResponse.json(
      { data: firms, total, limit, offset },
      { status: 200 }
    );
  } catch (error) {
    console.error('Search firms error:', error);
    return NextResponse.json(
      { error: 'Failed to search firms' },
      { status: 500 }
    );
  }
}
