import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

interface AgentStatus {
  agent: string;
  name: string;
  description: string;
  status: 'complete' | 'testing' | 'pending';
  evidenceTypes: string[];
  performanceMs: number;
}

interface AgentStatusResponse {
  agents: AgentStatus[];
  totalAgents: number;
  completeAgents: number;
  evidenceTypes: number;
  testsPassing: number;
  criticalIssues: number;
  productionReady: boolean;
  lastUpdated: string;
}

let pool: Pool | null = null;
const getDatabaseUrl = (): string | null => {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.password) return null;
  } catch (error) {
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

const agentConfig = [
  {
    agent: 'CRAWLER',
    name: 'Web Crawler',
    description: 'Collecte des pages publiques (rules, pricing, legal, FAQ)',
    evidenceTypes: ['RAW_HTML', 'HOME_HTML', 'RULES_HTML', 'PRICING_HTML'],
    collectedBy: 'web_crawler',
  },
  {
    agent: 'RVI',
    name: 'Registry Verification',
    description: 'Verification des licences et registres reglementaires (FCA, FINRA, etc.)',
    evidenceTypes: ['LICENSE_VERIFICATION'],
    collectedBy: 'RVI',
  },
  {
    agent: 'SSS',
    name: 'Sanctions Screening',
    description: 'Depistage des listes de sanctions (OFAC, ONU, EU, etc.)',
    evidenceTypes: ['WATCHLIST_MATCH'],
    collectedBy: 'SSS',
  },
  {
    agent: 'REM',
    name: 'Regulatory Events Monitor',
    description: 'Suivi des actions reglementaires et violations de conformite',
    evidenceTypes: ['REGULATORY_EVENT'],
    collectedBy: 'REM',
  },
  {
    agent: 'IRS',
    name: 'Independent Review System',
    description: 'Validation des soumissions et documents reglementaires',
    evidenceTypes: ['SUBMISSION_VERIFICATION'],
    collectedBy: 'IRS',
  },
  {
    agent: 'FRP',
    name: 'Firm Reputation & Payout',
    description: 'Analyse de la reputation, des paiements et des sentiments',
    evidenceTypes: ['REPUTATION_RISK', 'PAYOUT_RISK', 'SENTIMENT_RISK'],
    collectedBy: 'FRP',
  },
  {
    agent: 'MIS',
    name: 'Manual Investigation System',
    description: 'Recherche approfondie et detection d\'anomalies',
    evidenceTypes: ['DOMAIN_ANOMALY', 'COMPANY_ISSUE', 'NEWS_RISK', 'SUSPICIOUS_PATTERN'],
    collectedBy: 'MIS',
  },
  {
    agent: 'IIP',
    name: 'IOSCO Implementation & Publication',
    description: 'Generation de rapports de conformite IOSCO et certification reglementaire',
    evidenceTypes: ['COMPLIANCE_REPORT'],
    collectedBy: 'IIP',
  },
  {
    agent: 'AGENT_C',
    name: 'Oversight Gate',
    description: 'Controle qualite, validation finale, publication snapshots',
    evidenceTypes: ['VALIDATION_EVENT', 'SNAPSHOT_APPROVAL'],
    collectedBy: null as string | null,
  },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AgentStatusResponse>
) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }

  const dbPool = getPool();
  if (!dbPool) {
    res.status(503).json({
      agents: [],
      totalAgents: 0,
      completeAgents: 0,
      evidenceTypes: 0,
      testsPassing: 0,
      criticalIssues: 0,
      productionReady: false,
      lastUpdated: new Date().toISOString(),
    });
    return;
  }

  const agentStatusTable = await dbPool.query(
    "SELECT to_regclass('public.agent_status') AS table_name"
  );
  const hasAgentStatus = Boolean(agentStatusTable.rows[0]?.table_name);

  let agents: AgentStatus[] = [];
  let evidenceTypeCount = 0;
  let validationCount = 0;
  let criticalIssues = 0;

  if (hasAgentStatus) {
    const agentStatusRows = await dbPool.query(
      `SELECT agent, name, description, status, evidence_types, performance_ms
       FROM agent_status
       ORDER BY agent`
    );
    agents = agentStatusRows.rows.map((row) => ({
      agent: row.agent,
      name: row.name,
      description: row.description,
      status: row.status,
      evidenceTypes: Array.isArray(row.evidence_types) ? row.evidence_types : [],
      performanceMs: Number(row.performance_ms) || 0,
    }));
  } else {
    const evidenceCountsResult = await dbPool.query(
      `SELECT collected_by, COUNT(*)::int AS count
       FROM evidence_collection
       GROUP BY collected_by`
    );
    const evidenceTypeCountResult = await dbPool.query(
      `SELECT COUNT(DISTINCT evidence_type)::int AS count
       FROM evidence_collection`
    );
    const validationCountResult = await dbPool.query(
      `SELECT COUNT(*)::int AS count
       FROM validation_metrics`
    );
    const criticalIssuesResult = await dbPool.query(
      `SELECT COUNT(*)::int AS count
       FROM validation_alerts
       WHERE severity = 'critical' AND resolved_at IS NULL`
    );

    const evidenceCounts = new Map<string, number>();
    evidenceCountsResult.rows.forEach((row) => {
      if (row.collected_by) {
        evidenceCounts.set(String(row.collected_by), Number(row.count) || 0);
      }
    });

    validationCount = Number(validationCountResult.rows[0]?.count || 0);
    evidenceTypeCount = Number(evidenceTypeCountResult.rows[0]?.count || 0);
    criticalIssues = Number(criticalIssuesResult.rows[0]?.count || 0);

    agents = agentConfig.map((config) => {
      const evidenceCount = config.collectedBy
        ? evidenceCounts.get(config.collectedBy) || 0
        : validationCount;
      const status: AgentStatus['status'] = evidenceCount > 0 ? 'complete' : 'testing';
      return {
        agent: config.agent,
        name: config.name,
        description: config.description,
        status,
        evidenceTypes: config.evidenceTypes,
        performanceMs: 0,
      };
    });
  }

  if (evidenceTypeCount === 0) {
    const evidenceTypeCountResult = await dbPool.query(
      `SELECT COUNT(DISTINCT evidence_type)::int AS count
       FROM evidence_collection`
    );
    evidenceTypeCount = Number(evidenceTypeCountResult.rows[0]?.count || 0);
  }

  if (validationCount === 0) {
    const validationCountResult = await dbPool.query(
      `SELECT COUNT(*)::int AS count
       FROM validation_metrics`
    );
    validationCount = Number(validationCountResult.rows[0]?.count || 0);
  }

  if (criticalIssues === 0) {
    const criticalIssuesResult = await dbPool.query(
      `SELECT COUNT(*)::int AS count
       FROM validation_alerts
       WHERE severity = 'critical' AND resolved_at IS NULL`
    );
    criticalIssues = Number(criticalIssuesResult.rows[0]?.count || 0);
  }

  const completeAgents = agents.filter((agent) => agent.status === 'complete').length;
  const totalAgents = agents.length;
  const testsPassing = validationCount > 0 ? 1 : 0;
  const productionReady = completeAgents === totalAgents && criticalIssues === 0 && testsPassing > 0;

  const response: AgentStatusResponse = {
    agents,
    totalAgents,
    completeAgents,
    evidenceTypes: evidenceTypeCount,
    testsPassing,
    criticalIssues,
    productionReady,
    lastUpdated: new Date().toISOString(),
  };

  // Cache pour 1 minute
  res.setHeader('Cache-Control', 'max-age=60, must-revalidate');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(response);
}
