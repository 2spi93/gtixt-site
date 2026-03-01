// /opt/gpti/gpti-site/app/api/admin/dashboard-stats/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get total firms count
    const totalFirms = await prisma.firms.count();

    // Get published firms count (firms with status='ranked' or status='eligible')
    const publishedFirms = await prisma.firms.count({
      where: {
        status: {
          in: ['ranked', 'eligible']
        }
      }
    });

    // Pending manual reviews
    const pendingReviews = await prisma.adminValidation.count({
      where: { status: 'pending' },
    });

    // Agent C pass rate based on approved validations
    const validationGroups = await prisma.adminValidation.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const validationCounts = validationGroups.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    const approved = validationCounts.approved || 0;
    const rejected = validationCounts.rejected || 0;
    const reviewed = approved + rejected;
    const agentCPassRate = reviewed > 0 ? Math.round((approved / reviewed) * 100) : 98;

    // Get next crawl time (example: 6 hours from now)
    const now = new Date();
    const nextCrawl = new Date(now.getTime() + (6 * 60 * 60 * 1000));

    // Check if any crawls are currently running
    const activeCrawls = await prisma.adminCrawls.count({
      where: { status: { in: ['pending', 'running'] } },
    });
    const totalCrawls = await prisma.adminCrawls.count();
    const crawlRunning = activeCrawls > 0;

    const failedJobs = await prisma.adminJobs.count({
      where: { status: 'failed' },
    });

    const alerts = await prisma.adminAlerts.count({
      where: { acknowledged: false },
    });

    const totalActiveFirms = await prisma.firms.count({
      where: { operational_status: 'active' },
    });

    const firmsWithJurisdiction = await prisma.firms.count({
      where: {
        operational_status: 'active',
        jurisdiction: { not: null },
      },
    });

    const firmsWithCertifiedJurisdiction = await prisma.firms.count({
      where: {
        operational_status: 'active',
        jurisdiction: { not: null },
        NOT: { jurisdiction: 'UN' },
      },
    });

    const unknownJurisdictionBucket = await prisma.firms.count({
      where: {
        operational_status: 'active',
        jurisdiction: 'UN',
      },
    });

    const activeFirmIds = await prisma.firms.findMany({
      where: { operational_status: 'active', firm_id: { not: null } },
      select: { firm_id: true },
    });

    const activeFirmIdSet = new Set(activeFirmIds.map((row) => row.firm_id).filter(Boolean));

    const evidenceFirmRows = await prisma.evidence_collection.findMany({
      select: { firm_id: true },
      distinct: ['firm_id'],
      where: {
        firm_id: { in: Array.from(activeFirmIdSet) as string[] },
      },
    });
    const firmsWithEvidence = evidenceFirmRows.length;

    const totalEvidenceItems = await prisma.evidence_collection.count();

    const confidenceGroups = await prisma.evidence_collection.groupBy({
      by: ['confidence_level'],
      _count: { confidence_level: true },
    });

    const evidenceBySource = await prisma.evidence_collection.groupBy({
      by: ['evidence_source'],
      _count: { evidence_source: true },
      orderBy: {
        _count: {
          evidence_source: 'desc',
        },
      },
      take: 5,
    });

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const auditEvents24h = await prisma.adminAuditTrail.count({
      where: {
        createdAt: { gte: last24h },
      },
    });

    const jurisdictionCoveragePct = totalActiveFirms > 0
      ? Math.round((firmsWithJurisdiction / totalActiveFirms) * 1000) / 10
      : 0;

    const certifiedJurisdictionCoveragePct = totalActiveFirms > 0
      ? Math.round((firmsWithCertifiedJurisdiction / totalActiveFirms) * 1000) / 10
      : 0;

    const evidenceCoveragePct = totalActiveFirms > 0
      ? Math.round((firmsWithEvidence / totalActiveFirms) * 1000) / 10
      : 0;

    const avgEvidencePerFirm = totalActiveFirms > 0
      ? Math.round((totalEvidenceItems / totalActiveFirms) * 10) / 10
      : 0;

    const confidenceBreakdown = confidenceGroups.reduce((acc, item) => {
      const key = item.confidence_level || 'unknown';
      acc[key] = item._count.confidence_level;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      totalFirms,
      publishedFirms,
      pendingReviews,
      nextCrawlIn: nextCrawl.toLocaleString('fr-FR'),
      activeCrawls,
      totalCrawls,
      crawlRunning,
      failedJobs,
      alerts,
      agentCPassRate,
      totalActiveFirms,
      firmsWithJurisdiction,
      jurisdictionCoveragePct,
      firmsWithCertifiedJurisdiction,
      certifiedJurisdictionCoveragePct,
      unknownJurisdictionBucket,
      firmsWithEvidence,
      evidenceCoveragePct,
      totalEvidenceItems,
      avgEvidencePerFirm,
      confidenceBreakdown,
      topEvidenceSources: evidenceBySource.map((row) => ({
        source: row.evidence_source,
        count: row._count.evidence_source,
      })),
      auditEvents24h,
      lastUpdate: new Date()
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:');
    console.error(error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', details: error.message },
      { status: 500 }
    );
  }
}
