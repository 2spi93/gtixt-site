import type { NextApiRequest, NextApiResponse } from 'next';

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

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardData>
) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }

  const now = new Date();
  const response: DashboardData = {
    lastUpdate: now.toISOString(),
    totalExecutionTime: 58000,
    agentsRunning: 7,
    evidenceCollected: 8,
    criticalIssues: 0,
    agents: [
      {
        agent: 'RVI',
        status: 'healthy',
        lastRun: new Date(now.getTime() - 60000).toISOString(),
        executionTime: 560,
        testsPass: 3,
        testsTotal: 3,
        evidence: 1,
      },
      {
        agent: 'SSS',
        status: 'healthy',
        lastRun: new Date(now.getTime() - 45000).toISOString(),
        executionTime: 10080,
        testsPass: 2,
        testsTotal: 2,
        evidence: 1,
      },
      {
        agent: 'REM',
        status: 'healthy',
        lastRun: new Date(now.getTime() - 30000).toISOString(),
        executionTime: 1060,
        testsPass: 3,
        testsTotal: 3,
        evidence: 1,
      },
      {
        agent: 'IRS',
        status: 'healthy',
        lastRun: new Date(now.getTime() - 25000).toISOString(),
        executionTime: 560,
        testsPass: 3,
        testsTotal: 3,
        evidence: 1,
      },
      {
        agent: 'FRP',
        status: 'healthy',
        lastRun: new Date(now.getTime() - 15000).toISOString(),
        executionTime: 18220,
        testsPass: 3,
        testsTotal: 3,
        evidence: 3,
      },
      {
        agent: 'MIS',
        status: 'healthy',
        lastRun: new Date(now.getTime() - 5000).toISOString(),
        executionTime: 27860,
        testsPass: 3,
        testsTotal: 3,
        evidence: 4,
      },
      {
        agent: 'IIP',
        status: 'healthy',
        lastRun: new Date(now.getTime() - 2000).toISOString(),
        executionTime: 5000,
        testsPass: 3,
        testsTotal: 3,
        evidence: 1,
      },
    ],
  };

  // Cache pour 30 secondes
  res.setHeader('Cache-Control', 'max-age=30, must-revalidate');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(response);
}
