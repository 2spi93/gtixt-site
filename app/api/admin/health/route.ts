import { NextResponse } from 'next/server';
import os from 'os';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const start = Date.now();
  let database = 'OK';

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error('Health check database failed:', error);
    database = 'ERROR';
  }

  let crawlers = 'OK';
  try {
    const running = await prisma.adminCrawls.count({
      where: { status: 'running' },
    });
    if (running > 0) {
      crawlers = 'RUNNING';
    }
  } catch (error) {
    console.error('Health check crawlers failed:', error);
    crawlers = 'WARNING';
  }

  const apiLatency = Math.max(Date.now() - start, 1);
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

  const load = os.loadavg()[0];
  const cpuCount = os.cpus().length || 1;
  const cpuUsage = Math.min(Math.round((load / cpuCount) * 100), 100);

  const status = database !== 'OK'
    ? 'critical'
    : crawlers === 'RUNNING'
    ? 'warning'
    : 'healthy';

  return NextResponse.json({
    status,
    database,
    crawlers,
    apiLatency,
    memoryUsage,
    cpuUsage,
    timestamp: new Date().toISOString(),
  });
}
