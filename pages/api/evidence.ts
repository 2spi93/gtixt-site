// API Route: /api/evidence
// Purpose: Evidence collection management for audit trail
// Created: 2026-02-01
// Phase: 1 (Validation Framework)

import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

interface Evidence {
  evidence_id: number;
  firm_id: string;
  evidence_type: string;
  evidence_source: string;
  evidence_hash: string;
  content_text: string | null;
  content_json: any;
  content_url: string | null;
  content_snapshot_path: string | null;
  collected_by: string;
  collection_method: string | null;
  relevance_score: number | null;
  relevance_reason: string | null;
  affects_metric: string | null;
  affects_score_version: string | null;
  impact_weight: number | null;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  verification_notes: string | null;
  is_stale: boolean;
  is_ambiguous: boolean;
  confidence_level: string | null;
  collected_at: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

interface EvidenceResponse {
  evidence: Evidence[];
  total: number;
  page: number;
  per_page: number;
}

interface EvidenceCreateRequest {
  firm_id: string;
  evidence_type: string;
  evidence_source: string;
  evidence_hash: string;
  content_text?: string;
  content_json?: any;
  content_url?: string;
  content_snapshot_path?: string;
  collected_by: string;
  collection_method?: string;
  relevance_score?: number;
  relevance_reason?: string;
  affects_metric?: string;
  affects_score_version?: string;
  impact_weight?: number;
  confidence_level?: string;
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EvidenceResponse | Evidence | { error: string; message?: string }>
) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return handleGetEvidence(req, res);
    } else if (req.method === 'POST') {
      return handleCreateEvidence(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Evidence API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleGetEvidence(
  req: NextApiRequest,
  res: NextApiResponse<EvidenceResponse | { error: string }>
) {
  const {
    firm_id,
    evidence_type,
    collected_by,
    affects_metric,
    is_verified,
    is_stale,
    confidence_level,
    page = '1',
    per_page = '50',
  } = req.query;
  const dbPool = getPool();
  if (!dbPool) {
    return res.status(503).json({ error: 'Database not configured for evidence queries' });
  }

  const filters: string[] = [];
  const values: Array<string | number | boolean> = [];
  let paramIndex = 1;

  if (firm_id) {
    filters.push(`firm_id = $${paramIndex++}`);
    values.push(firm_id as string);
  }
  if (evidence_type) {
    filters.push(`evidence_type = $${paramIndex++}`);
    values.push(evidence_type as string);
  }
  if (collected_by) {
    filters.push(`collected_by = $${paramIndex++}`);
    values.push(collected_by as string);
  }
  if (affects_metric) {
    filters.push(`affects_metric = $${paramIndex++}`);
    values.push(affects_metric as string);
  }
  if (is_verified !== undefined) {
    filters.push(`is_verified = $${paramIndex++}`);
    values.push(is_verified === 'true');
  }
  if (is_stale !== undefined) {
    filters.push(`is_stale = $${paramIndex++}`);
    values.push(is_stale === 'true');
  }
  if (confidence_level) {
    filters.push(`confidence_level = $${paramIndex++}`);
    values.push(confidence_level as string);
  }

  const pageNum = parseInt(page as string, 10);
  const perPageNum = parseInt(per_page as string, 10);
  const offset = (pageNum - 1) * perPageNum;

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const countQuery = `SELECT COUNT(*) FROM evidence_collection ${whereClause}`;
  const countResult = await dbPool.query(countQuery, values);
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  const dataQuery = `
    SELECT
      evidence_id,
      firm_id,
      evidence_type,
      evidence_source,
      evidence_hash,
      content_text,
      content_json,
      content_url,
      content_snapshot_path,
      collected_by,
      collection_method,
      relevance_score,
      relevance_reason,
      affects_metric,
      affects_score_version,
      impact_weight,
      is_verified,
      verified_by,
      verified_at,
      verification_notes,
      is_stale,
      is_ambiguous,
      confidence_level,
      collected_at,
      created_at,
      updated_at,
      expires_at
    FROM evidence_collection
    ${whereClause}
    ORDER BY collected_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const dataResult = await dbPool.query(dataQuery, [...values, perPageNum, offset]);

  return res.status(200).json({
    evidence: dataResult.rows,
    total,
    page: pageNum,
    per_page: perPageNum,
  });
}

async function handleCreateEvidence(
  req: NextApiRequest,
  res: NextApiResponse<Evidence | { error: string }>
) {
  return res.status(501).json({
    error: 'Evidence creation is not enabled via API',
  });
}

// TODO: PostgreSQL implementation example (uncomment when ready)
/*
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function handleGetEvidenceFromDB(req: NextApiRequest, res: NextApiResponse) {
  const { firm_id, evidence_type, page = '1', per_page = '50' } = req.query;

  let query = 'SELECT * FROM evidence_collection WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (firm_id) {
    query += ` AND firm_id = $${paramIndex}`;
    params.push(firm_id);
    paramIndex++;
  }

  if (evidence_type) {
    query += ` AND evidence_type = $${paramIndex}`;
    params.push(evidence_type);
    paramIndex++;
  }

  query += ' ORDER BY collected_at DESC';

  const pageNum = parseInt(page as string, 10);
  const perPageNum = parseInt(per_page as string, 10);
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(perPageNum, (pageNum - 1) * perPageNum);

  const result = await pool.query(query, params);
  const countResult = await pool.query('SELECT COUNT(*) FROM evidence_collection WHERE 1=1');

  return res.status(200).json({
    evidence: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
    page: pageNum,
    per_page: perPageNum,
  });
}
*/
