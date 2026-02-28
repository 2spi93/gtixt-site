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

    // Get next crawl time (example: 6 hours from now)
    const now = new Date();
    const nextCrawl = new Date(now.getTime() + (6 * 60 * 60 * 1000));

    // Check if any crawls are currently running
    const crawlRunning = false;

    // Mock Agent C pass rate (you can calculate this from your validation records)
    const agentCPassRate = 98;

    return NextResponse.json({
      totalFirms,
      publishedFirms,
      nextCrawlIn: nextCrawl.toLocaleString('fr-FR'),
      crawlRunning,
      agentCPassRate,
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
