import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminUser } from '@/lib/admin-api-auth';

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser(request, ['admin', 'auditor']);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const limit = Math.min(parseInt(searchParams.get('limit') || '500', 10), 2000);

  const where: any = {};
  if (action) where.action = action;
  if (userId) where.userId = userId;
  if (status) where.success = status === 'success';
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const logs = await prisma.adminAuditTrail.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const header = [
    'id',
    'action',
    'userId',
    'ipAddress',
    'filePath',
    'success',
    'errorMsg',
    'createdAt',
  ];

  const rows = logs.map((log) => [
    log.id,
    log.action,
    log.userId,
    log.ipAddress,
    log.filePath,
    log.success,
    log.errorMsg,
    log.createdAt.toISOString(),
  ]);

  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="admin_audit_trail.csv"',
    },
  });
}
