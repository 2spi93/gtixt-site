import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 24);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = Math.min(Number(searchParams.get('limit') || 100), 500);
    const offset = Number(searchParams.get('offset') || 0);

    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { firm_id: { contains: search, mode: 'insensitive' } },
        { website_root: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.firms.count({ where });

    // Get paginated firms
    const firms = await prisma.firms.findMany({
      where,
      select: {
        id: true,
        firm_id: true,
        name: true,
        status: true,
        jurisdiction: true,
        website_root: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { updated_at: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get status counts
    const statusCounts = await prisma.firms.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const counts = statusCounts.reduce(
      (acc, item) => {
        const status = item.status || 'unknown';
        acc[status] = item._count.status;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      success: true,
      data: firms,
      counts: {
        total,
        ...counts,
      },
      pagination: {
        limit,
        offset,
        total,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/firms failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch firms' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, country, abn, email, phone, website, description } = body as {
      name?: string;
      country?: string;
      abn?: string;
      email?: string;
      phone?: string;
      website?: string;
      description?: string;
    };

    if (!name || !country) {
      return NextResponse.json(
        { error: 'name and country are required' },
        { status: 400 }
      );
    }

    const base = slugify(name) || 'firm';
    const suffix = Date.now().toString(36).slice(-6);
    const firmId = `${base}-${suffix}`;

    const createdAt = new Date();

    const result = await prisma.$transaction(async tx => {
      const firm = await tx.firms.create({
        data: {
          firm_id: firmId,
          name: name.trim(),
          website_root: website?.trim() || null,
          jurisdiction: country.trim(),
          status: 'candidate',
          operational_status: 'active',
          created_at: createdAt,
          updated_at: createdAt,
        },
      });

      await tx.firm_profiles.create({
        data: {
          firm_id: firmId,
          executive_summary: null,
          status_gtixt: 'pending',
          data_sources: Prisma.JsonNull,
          verification_hash: null,
          last_updated: createdAt,
          audit_verdict: null,
          oversight_gate_verdict: null,
          extra: {
            email: email?.trim() || null,
            phone: phone?.trim() || null,
            description: description?.trim() || null,
            abn: abn?.trim() || null,
          },
          created_at: createdAt,
          updated_at: createdAt,
        },
      });

      await tx.adminValidation.create({
        data: {
          id: firmId,
          name: name.trim(),
          country: country.trim(),
          abn: abn?.trim() || null,
          status: 'pending',
          enrichmentLevel: 0,
          notes: 'Manual add via admin panel',
          createdAt,
          updatedAt: createdAt,
        },
      });

      await tx.adminOperations.create({
        data: {
          id: `op_${Date.now()}`,
          operationType: 'firm',
          operation: 'CREATE',
          firmId: firmId,
          userId: 'system',
          status: 'success',
          details: { source: 'admin', name: name.trim() },
          createdAt: createdAt,
          updatedAt: createdAt,
        },
      });

      return firm;
    });

    return NextResponse.json({
      success: true,
      firm: {
        id: firmId,
        name: result.name,
        status: 'pending',
        createdAt: createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('POST /api/admin/firms failed:', error);
    return NextResponse.json(
      { error: 'Failed to add firm' },
      { status: 500 }
    );
  }
}
