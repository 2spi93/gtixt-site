// API Route: /api/events
// Purpose: Ground-truth events management for validation framework
// Created: 2026-02-01
// Phase: 1 (Validation Framework)

import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

interface GroundTruthEvent {
  event_id: number;
  firm_id: string;
  event_date: string;
  event_type: string;
  event_severity: string;
  event_description: string;
  source_type: string;
  source_url: string | null;
  source_reliability: string;
  expected_score_impact: number | null;
  expected_direction: string | null;
  validated_by: string | null;
  validated_at: string;
  validation_notes: string | null;
  is_verified: boolean;
  verification_count: number;
  created_at: string;
  updated_at: string;
}

interface EventsResponse {
  events: GroundTruthEvent[];
  total: number;
  page: number;
  per_page: number;
}

interface EventCreateRequest {
  firm_id: string;
  event_date: string;
  event_type: string;
  event_severity: string;
  event_description: string;
  source_type: string;
  source_url?: string;
  source_reliability: string;
  expected_score_impact?: number;
  expected_direction?: string;
  validated_by?: string;
  validation_notes?: string;
  is_verified?: boolean;
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
  res: NextApiResponse<EventsResponse | GroundTruthEvent | { error: string; message?: string }>
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
      return handleGetEvents(req, res);
    } else if (req.method === 'POST') {
      return handleCreateEvent(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Events API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGetEvents(
  req: NextApiRequest,
  res: NextApiResponse<EventsResponse | { error: string }>
) {
  const {
    firm_id,
    event_type,
    event_severity,
    is_verified,
    page = '1',
    per_page = '50',
  } = req.query;
  const dbPool = getPool();
  if (!dbPool) {
    return res.status(503).json({ error: 'Database not configured for events queries' });
  }

  const filters: string[] = [];
  const values: Array<string | number | boolean> = [];
  let paramIndex = 1;

  if (firm_id) {
    filters.push(`firm_id = $${paramIndex++}`);
    values.push(firm_id as string);
  }
  if (event_type) {
    filters.push(`event_type = $${paramIndex++}`);
    values.push(event_type as string);
  }
  if (event_severity) {
    filters.push(`event_severity = $${paramIndex++}`);
    values.push(event_severity as string);
  }
  if (is_verified !== undefined) {
    filters.push(`is_verified = $${paramIndex++}`);
    values.push(is_verified === 'true');
  }

  const pageNum = parseInt(page as string, 10);
  const perPageNum = parseInt(per_page as string, 10);
  const offset = (pageNum - 1) * perPageNum;

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const countQuery = `SELECT COUNT(*) FROM ground_truth_events ${whereClause}`;
  const countResult = await dbPool.query(countQuery, values);
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  const dataQuery = `
    SELECT
      event_id,
      firm_id,
      event_date,
      event_type,
      event_severity,
      event_description,
      source_type,
      source_url,
      source_reliability,
      expected_score_impact,
      expected_direction,
      validated_by,
      validated_at,
      validation_notes,
      is_verified,
      verification_count,
      created_at,
      updated_at
    FROM ground_truth_events
    ${whereClause}
    ORDER BY event_date DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  const dataResult = await dbPool.query(dataQuery, [...values, perPageNum, offset]);

  return res.status(200).json({
    events: dataResult.rows,
    total,
    page: pageNum,
    per_page: perPageNum,
  });
}

async function handleCreateEvent(
  req: NextApiRequest,
  res: NextApiResponse<GroundTruthEvent | { error: string }>
) {
  return res.status(501).json({
    error: 'Event creation is not enabled via API',
  });
}

// TODO: PostgreSQL implementation example (uncomment when ready)
/*
async function handleGetEventsFromDB(req: NextApiRequest, res: NextApiResponse) {
  const { firm_id, event_type, page = '1', per_page = '50' } = req.query;
  
  let query = 'SELECT * FROM ground_truth_events WHERE 1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (firm_id) {
    query += ` AND firm_id = $${paramIndex}`;
    params.push(firm_id);
    paramIndex++;
  }

  if (event_type) {
    query += ` AND event_type = $${paramIndex}`;
    params.push(event_type);
    paramIndex++;
  }

  query += ' ORDER BY event_date DESC';
  
  const pageNum = parseInt(page as string, 10);
  const perPageNum = parseInt(per_page as string, 10);
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(perPageNum, (pageNum - 1) * perPageNum);

  const result = await pool.query(query, params);
  const countResult = await pool.query('SELECT COUNT(*) FROM ground_truth_events WHERE 1=1');

  return res.status(200).json({
    events: result.rows,
    total: parseInt(countResult.rows[0].count, 10),
    page: pageNum,
    per_page: perPageNum,
  });
}
*/
