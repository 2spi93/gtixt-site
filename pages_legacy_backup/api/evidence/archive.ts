// API Route: /api/evidence/archive
// Purpose: Store evidence artifacts in archive storage

import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import { archiveEvidence } from '../../../lib/evidence-archive';

interface EvidenceRow {
  evidence_id: number;
  firm_id: string;
  content_text: string | null;
  content_json: any;
  content_url: string | null;
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { evidence_id } = req.body || {};
  if (!evidence_id) {
    return res.status(400).json({ error: 'evidence_id required' });
  }

  const dbPool = getPool();
  if (!dbPool) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const row = await fetchEvidence(dbPool, String(evidence_id));
    if (!row) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    const contentText = row.content_text ? Buffer.from(row.content_text, 'utf-8') : null;
    const contentJson = row.content_json ? Buffer.from(JSON.stringify(row.content_json, null, 2), 'utf-8') : null;

    if (!contentText && !contentJson) {
      return res.status(400).json({ error: 'Evidence content missing (content_text/content_json)' });
    }

    const buffer = contentText || contentJson as Buffer;
    const contentType = contentText ? 'text/plain' : 'application/json';
    const extension = contentText ? 'txt' : 'json';

    const result = await archiveEvidence({
      evidence_id: String(row.evidence_id),
      firm_id: row.firm_id,
      source_url: row.content_url || undefined,
      content: buffer,
      content_type: contentType,
      file_extension: extension,
    });

    if (!result.stored) {
      return res.status(500).json({ error: 'Archive storage not available' });
    }

    await dbPool.query(
      `UPDATE evidence_collection
       SET content_snapshot_path = $1,
           updated_at = NOW()
       WHERE evidence_id = $2`,
      [result.archive_url, row.evidence_id]
    );

    return res.status(200).json({
      success: true,
      evidence_id: row.evidence_id,
      archive_url: result.archive_url,
      raw_data_hash: result.raw_data_hash,
      bytes: result.bytes,
    });
  } catch (error: any) {
    console.error('Evidence archive error:', error);
    return res.status(500).json({ error: 'Archive failed', message: error.message });
  }
}

async function fetchEvidence(dbPool: Pool, evidenceId: string): Promise<EvidenceRow | null> {
  const result = await dbPool.query(
    `SELECT evidence_id, firm_id, content_text, content_json, content_url
     FROM evidence_collection
     WHERE evidence_id = $1
     LIMIT 1`,
    [evidenceId]
  );

  return result.rows?.[0] || null;
}
