import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

interface AgentHealth {
  agent: string;
  status: 'healthy' | 'warning' | 'critical';
  lastRun: string;
  executionTime: number;
  testsPass: number;
  testsTotal: number;
  evidence: number;
}

interface DashboardData {
  lastUpdate: string;
  totalExecutionTime: number;
  agentsRunning: number;
  evidenceCollected: number;
  criticalIssues: number;
  agents: AgentHealth[];
}

const AGENTS = ['RVI', 'SSS', 'REM', 'IRS', 'FRP', 'MIS', 'IIP', 'AGENT_C'];

let pool: Pool | null = null;
const getDatabaseUrl = (): string | null => {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.password) return null;
  } catch {
    return null;
  }
  return url;
};

const getPool = (): Pool | null => {
  const url = getDatabaseUrl();
  if (!url) return null;
  if (!pool) {
    pool = new Pool({ connectionString: url });
  }
  return pool;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardData | { error: string }>
) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }

  const dbPool = getPool();
  if (!dbPool) {
    res.status(503).json({ error: 'Database not configured for agents health' });
    return;
  }

  const now = new Date();

  const evidenceRows = await dbPool.query(
    `SELECT collected_by,
            COUNT(*)::int AS count,
            MAX(collected_at) AS last_collected
     FROM evidence_collection
     GROUP BY collected_by`
  );

  const validationRows = await dbPool.query(
    `SELECT COUNT(*)::int AS count,
            MAX(timestamp) AS last_run
     FROM validation_metrics`
  );

  const evidenceMap = new Map<string, { count: number; lastRun: string | null }>();
  evidenceRows.rows.forEach((row) => {
    if (row.collected_by) {
      evidenceMap.set(String(row.collected_by), {
        count: Number(row.count) || 0,
        lastRun: row.last_collected ? new Date(row.last_collected).toISOString() : null,
      });
    }
  });

  const validationCount = Number(validationRows.rows[0]?.count || 0);
  const validationLastRun = validationRows.rows[0]?.last_run
    ? new Date(validationRows.rows[0].last_run).toISOString()
    : null;

  const agents: AgentHealth[] = AGENTS.map((agent) => {
    if (agent === 'AGENT_C') {
      const status = validationCount > 0 ? 'healthy' : 'warning';
      return {
        agent,
        status,
        lastRun: validationLastRun || now.toISOString(),
        executionTime: 0,
        testsPass: validationCount > 0 ? 1 : 0,
        testsTotal: 1,
        evidence: validationCount,
      };
    }

    const evidence = evidenceMap.get(agent);
    const count = evidence?.count || 0;
    const status = count > 0 ? 'healthy' : 'warning';
    return {
      agent,
      status,
      lastRun: evidence?.lastRun || now.toISOString(),
      executionTime: 0,
      testsPass: count > 0 ? 1 : 0,
      testsTotal: 1,
      evidence: count,
    };
  });

  const evidenceCollected = agents.reduce((sum, agent) => sum + (agent.evidence || 0), 0);

  const response: DashboardData = {
    lastUpdate: now.toISOString(),
    totalExecutionTime: 0,
    agentsRunning: agents.filter((agent) => agent.status === 'healthy').length,
    evidenceCollected,
    criticalIssues: agents.filter((agent) => agent.status === 'critical').length,
    agents,
  };

  res.setHeader('Cache-Control', 'max-age=30, must-revalidate');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(response);
}
