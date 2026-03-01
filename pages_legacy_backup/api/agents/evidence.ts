/**
 * Agents API Routes for Next.js Site
 * Exposes all 7 agents data to frontend
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

interface AgentResult {
  agent: string;
  label: string;
  status: 'SUCCESS' | 'ERROR' | 'PENDING';
  evidence?: any;
  error?: string;
  timestamp: string;
}

const DEFAULT_VERIFICATION_URLS = Array.from(
  new Set(
    [
      process.env.VERIFICATION_API_URL,
      'http://localhost:3002',
      'http://localhost:3101',
      'http://localhost:3001',
    ].filter(Boolean) as string[]
  )
);

const AGENTS = ['RVI', 'SSS', 'REM', 'FRP', 'IRS', 'MIS', 'IIP'];
const AGENT_ALIASES: Record<string, string> = {
  web_crawler: 'RVI',
  crawler: 'RVI',
  registry_verifier: 'RVI',
  sanctions_screening: 'SSS',
  sanctions_agent: 'SSS',
  regulatory_monitor: 'REM',
  regulatory_agent: 'REM',
  reputation_agent: 'FRP',
  payout_agent: 'FRP',
  independent_review: 'IRS',
  manual_investigation: 'MIS',
  iosco_agent: 'IIP',
};

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firmId, agent } = req.query;

  if (!firmId) {
    return res.status(400).json({ error: 'firmId required' });
  }

  try {
    const baseUrl = getBaseUrl(req);
    const firm = await loadFirmPayload(baseUrl, firmId as string);

    const dbPool = getPool();
    if (dbPool) {
      const evidenceTable = await dbPool.query(
        "SELECT to_regclass('public.evidence_collection') AS table_name"
      );
      if (evidenceTable.rows[0]?.table_name) {
        const dbResults = await fetchAgentEvidenceFromDb(dbPool, firmId as string, agent as string | undefined);
        return res.status(200).json(dbResults);
      }
    }

    // Check if specific agent requested
    if (agent && typeof agent === 'string') {
      const result = await fetchAgentData(firm, agent);
      return res.status(200).json(result);
    }

    // Fetch all agents data
    const allResults = await fetchAllAgentsData(firm);
    return res.status(200).json(allResults);
  } catch (error: any) {
    console.error('Agents API error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch agent data',
      message: error.message 
    });
  }
}

async function fetchAgentEvidenceFromDb(
  dbPool: Pool,
  firmId: string,
  agentName?: string
): Promise<AgentResult | AgentResult[]> {
  const evidenceRows = await dbPool.query(
    `SELECT collected_by,
            COUNT(*)::int AS count,
            MAX(collected_at) AS last_collected,
            array_agg(DISTINCT evidence_type) AS evidence_types,
            array_agg(DISTINCT affects_metric) FILTER (WHERE affects_metric IS NOT NULL) AS affects_metrics
     FROM evidence_collection
     WHERE firm_id = $1
     GROUP BY collected_by`,
    [firmId]
  );

  const evidenceMap = new Map<string, any>();
  evidenceRows.rows.forEach((row) => {
    if (!row.collected_by) return;
    const normalized = normalizeCollector(String(row.collected_by));
    if (!normalized) return;

    const existing = evidenceMap.get(normalized);
    if (!existing) {
      evidenceMap.set(normalized, {
        count: row.count,
        last_collected: row.last_collected,
        evidence_types: row.evidence_types || [],
        affects_metrics: row.affects_metrics || [],
      });
      return;
    }

    existing.count += row.count || 0;
    existing.last_collected =
      !existing.last_collected || (row.last_collected && row.last_collected > existing.last_collected)
        ? row.last_collected
        : existing.last_collected;
    existing.evidence_types = Array.from(new Set([...(existing.evidence_types || []), ...(row.evidence_types || [])]));
    existing.affects_metrics = Array.from(new Set([...(existing.affects_metrics || []), ...(row.affects_metrics || [])]));
  });

  const buildResult = (agentCode: string): AgentResult => {
    const row = evidenceMap.get(agentCode);
    if (!row || !row.count) {
      return {
        agent: agentCode,
        label: getAgentLabel(agentCode),
        status: 'PENDING',
        error: 'Awaiting evidence collection',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      agent: agentCode,
      label: getAgentLabel(agentCode),
      status: 'SUCCESS',
      evidence: {
        count: row.count,
        last_collected: row.last_collected,
        evidence_types: row.evidence_types || [],
        affects_metrics: row.affects_metrics || [],
      },
      timestamp: new Date().toISOString(),
    };
  };

  if (agentName && typeof agentName === 'string') {
    return buildResult(agentName.toUpperCase());
  }

  return AGENTS.map(buildResult);
}

function normalizeCollector(collectedBy: string): string | null {
  const normalized = collectedBy.trim().toLowerCase().replace(/\s+/g, '_');
  if (AGENTS.includes(collectedBy.toUpperCase())) {
    return collectedBy.toUpperCase();
  }
  return AGENT_ALIASES[normalized] || null;
}

function getBaseUrl(req: NextApiRequest): string {
  const protoHeader = (req.headers['x-forwarded-proto'] || '').toString();
  const protocol = protoHeader ? protoHeader.split(',')[0] : 'http';
  const host = req.headers.host || 'localhost:3000';
  return `${protocol}://${host}`;
}

async function loadFirmPayload(baseUrl: string, firmId: string): Promise<any> {
  try {
    const response = await fetch(`${baseUrl}/api/firm?id=${encodeURIComponent(firmId)}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Firm API returned ${response.status}`);
    }

    const data = await response.json();
    const firm = data?.firm || data;
    if (firm?.firm_id) {
      return firm;
    }
  } catch (error) {
    console.warn('[agents/evidence] Failed to load firm payload, using minimal payload.', error);
  }

  return { firm_id: firmId, name: firmId };
}

async function fetchAgentData(firm: any, agentName: string): Promise<AgentResult> {
  
  try {
    const response = await fetchWithFallback(
      DEFAULT_VERIFICATION_URLS,
      `/api/agents/${firm.firm_id}/${agentName}`,
      {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      throw new Error(`Agent API returned ${response.status}`);
    }

    const data = await response.json();
    
    return {
      agent: agentName,
      label: getAgentLabel(agentName),
      status: data?.status || 'SUCCESS',
      evidence: data?.evidence ?? data,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      agent: agentName,
      label: getAgentLabel(agentName),
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

async function fetchAllAgentsData(firm: any): Promise<AgentResult[]> {
  const agents = AGENTS;

  try {
    const response = await fetchWithFallback(
      DEFAULT_VERIFICATION_URLS,
      `/api/agents/${firm.firm_id}`,
      {
        method: 'GET',
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      throw new Error(`Agent API returned ${response.status}`);
    }

    const data = await response.json();
    
    // If data is an array of agents, convert to per-agent results
    if (Array.isArray(data)) {
      return data.map((agentData: any) => {
        const agentCode = agentData.agent || agentData.code;
        return {
          agent: agentCode,
          label: getAgentLabel(agentCode),
          status: agentData.status || 'SUCCESS',
          evidence: agentData.evidence || agentData,
          timestamp: new Date().toISOString(),
        };
      });
    }

    // If data is a map of agents
    const agentResults: Record<string, any> = data?.agents || data || {};

    return agents.map((agentName) => {
      const evidence = agentResults[agentName];
      const isError = evidence?.error || evidence?.status === 'FAILED';
      return {
        agent: agentName,
        label: getAgentLabel(agentName),
        status: isError ? 'ERROR' : 'SUCCESS',
        evidence: isError ? undefined : evidence,
        error: isError ? evidence?.error || 'Agent verification failed' : undefined,
        timestamp: new Date().toISOString(),
      };
    });
  } catch (error: any) {
    return agents.map((agentName) => ({
      agent: agentName,
      label: getAgentLabel(agentName),
      status: 'ERROR',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    }));
  }
}

async function fetchWithFallback(
  baseUrls: string[],
  path: string,
  init: RequestInit
): Promise<Response> {
  let lastError: Error | null = null;

  for (const baseUrl of baseUrls) {
    try {
      const response = await fetch(`${baseUrl}${path}`, init);
      if (response.ok) return response;
      lastError = new Error(`Agent API returned ${response.status} (${baseUrl})`);
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError || new Error('Agent API request failed');
}

function getAgentLabel(agentName: string): string {
  const labels: Record<string, string> = {
    'RVI': 'Registry Verification',
    'SSS': 'Sanctions Screening',
    'REM': 'Regulatory Event Monitor',
    'FRP': 'Firm Reputation & Payout',
    'IRS': 'Independent Review System',
    'MIS': 'Manual Investigation',
    'IIP': 'IOSCO Compliance',
  };
  
  return labels[agentName.toUpperCase()] || agentName;
}
