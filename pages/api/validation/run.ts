// API Route: /api/validation/run
// Purpose: Scheduled validation job for recent evidence

import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import crypto from 'crypto';
import type { InstitutionalEvidenceItem } from '../../../lib/institutional-data-models';
import { validateEvidence } from '../../../lib/validation/agent-validation-layer';

interface EvidenceRow {
  evidence_id: number;
  firm_id: string;
  evidence_type: string;
  evidence_source: string;
  evidence_hash: string | null;
  content_text: string | null;
  content_json: any;
  content_url: string | null;
  content_snapshot_path: string | null;
  collected_by: string | null;
  collection_method: string | null;
  impact_weight: number | null;
  confidence_level: string | null;
  collected_at: string | null;
  created_at: string | null;
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
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const params = req.method === 'GET' ? req.query : req.body || {};
  const limit = params.limit ? Math.min(Number(params.limit) || 50, 500) : 50;

  const dbPool = getPool();
  if (!dbPool) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const rows = await fetchRecentEvidence(dbPool, limit);
    if (!rows.length) {
      return res.status(200).json({ success: true, count: 0, validations: [] });
    }

    const items = rows.map(buildInstitutionalEvidenceItem);

    const validations = await Promise.all(
      items.map((item, idx) =>
        validateEvidence({
          evidence_item: item,
          firm_id: rows[idx].firm_id,
          related_evidence: buildRelatedEvidence(items, item.evidence_id),
        })
      )
    );

    await ensureValidationTable(dbPool);
    await persistValidations(dbPool, rows, validations);

    return res.status(200).json({
      success: true,
      count: validations.length,
      validations,
    });
  } catch (error: any) {
    console.error('Validation run error:', error);
    return res.status(500).json({ error: 'Validation run failed', message: error.message });
  }
}

async function fetchRecentEvidence(dbPool: Pool, limit: number): Promise<EvidenceRow[]> {
  const result = await dbPool.query(
    `SELECT id AS evidence_id,
            firm_id,
            evidence_type,
            evidence_source,
            evidence_hash,
            content_text,
            content_json,
            content_url,
            NULL AS content_snapshot_path,
            collected_by,
            collection_method,
            impact_weight,
            confidence_level,
            collected_at,
            created_at
     FROM agent_evidence
     ORDER BY collected_at DESC NULLS LAST
     LIMIT $1`,
    [limit]
  );
  return result.rows || [];
}

async function ensureValidationTable(dbPool: Pool): Promise<void> {
  await dbPool.query(
    `CREATE TABLE IF NOT EXISTS evidence_validation_results (
      id SERIAL PRIMARY KEY,
      evidence_id INTEGER NOT NULL,
      firm_id TEXT NOT NULL,
      validation JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )`
  );
}

async function persistValidations(
  dbPool: Pool,
  rows: EvidenceRow[],
  validations: any[]
): Promise<void> {
  const insertSql =
    'INSERT INTO evidence_validation_results (evidence_id, firm_id, validation) VALUES ($1, $2, $3)';

  for (let i = 0; i < validations.length; i += 1) {
    const validation = validations[i];
    const row = rows[i];
    const confidence = validation?.final_validation?.overall_confidence || 'low';
    const approved = Boolean(validation?.final_validation?.approved);
    const reviewerNotes = validation?.final_validation?.reviewer_notes || null;
    const validatedBy = validation?.final_validation?.validated_by || 'agent:validation-layer-v1.0';

    await dbPool.query(insertSql, [row.evidence_id, row.firm_id, validation]);

    await dbPool.query(
      `UPDATE agent_evidence
       SET is_verified = $1,
           confidence_level = $2
       WHERE id = $3`,
      [approved, confidence, row.evidence_id]
    );
  }
}

function buildInstitutionalEvidenceItem(row: EvidenceRow): InstitutionalEvidenceItem {
  const timestamp = row.collected_at || row.created_at || new Date().toISOString();
  const description = row.content_text || row.evidence_source || 'Evidence item';
  const rawDataHash = row.evidence_hash || sha256Text(row.content_text || JSON.stringify(row.content_json || {}));
  const confidence = normalizeConfidence(row.confidence_level);

  return {
    evidence_id: String(row.evidence_id),
    type: mapEvidenceType(row.evidence_type),
    description,
    confidence,
    timestamp,
    source: row.content_url || row.evidence_source || 'unknown',
    value: typeof row.impact_weight === 'number' ? row.impact_weight : 0,
    reference_id: String(row.evidence_id),
    provenance: {
      source_system: mapSourceSystem(row.collected_by),
      source_url: row.content_url || undefined,
      crawler_agent: row.collected_by || 'unknown',
      crawler_version: '1.0',
      extraction_method: mapExtractionMethod(row.collection_method),
      extraction_timestamp: timestamp,
      transformation_chain: [
        {
          step: 1,
          operation: 'extract',
          input_hash: rawDataHash,
          output_hash: rawDataHash,
          agent: row.collected_by || 'unknown',
          agent_version: '1.0',
          timestamp,
        },
      ],
      validation: {
        validated_by: 'rule',
        validator_version: '1.0',
        validation_score: 0,
        validation_timestamp: new Date().toISOString(),
        validation_notes: 'Initial validation from evidence ingestion',
      },
      raw_data_hash: rawDataHash,
      raw_data_archive_url: row.content_snapshot_path || undefined,
    },
    evidence_hash: row.evidence_hash || rawDataHash,
    immutable: {
      created_at: row.created_at || timestamp,
      created_by: row.collected_by || 'system',
      locked: false,
    },
  };
}

function buildRelatedEvidence(items: InstitutionalEvidenceItem[], currentId: string) {
  return items
    .filter((item) => item.evidence_id !== currentId)
    .slice(0, 10)
    .map((item) => ({
      evidence_id: item.evidence_id,
      source: item.source,
      description: item.description,
      impact_on_score: item.value ?? 0,
      confidence_level: normalizeConfidence(item.confidence),
      extraction_date: item.provenance.extraction_timestamp,
    }));
}

function normalizeConfidence(value: string | null): 'high' | 'medium' | 'low' {
  const normalized = (value || '').toLowerCase();
  if (normalized === 'high') return 'high';
  if (normalized === 'medium') return 'medium';
  return 'low';
}

function mapEvidenceType(value: string): InstitutionalEvidenceItem['type'] {
  const normalized = (value || '').toLowerCase();
  if (normalized.includes('regulatory')) return 'regulatory_filing';
  if (normalized.includes('audit')) return 'audit';
  if (normalized.includes('news')) return 'news';
  if (normalized.includes('litigation')) return 'litigation';
  if (normalized.includes('financial')) return 'financial_report';
  return 'disclosure';
}

function mapSourceSystem(collectedBy: string | null): InstitutionalEvidenceItem['provenance']['source_system'] {
  const normalized = (collectedBy || '').toLowerCase();
  if (normalized.includes('manual')) return 'manual_review';
  if (normalized.includes('api')) return 'api_integration';
  if (normalized.includes('news')) return 'news_crawler';
  if (normalized.includes('financial')) return 'financial_crawler';
  return 'regulatory_crawler';
}

function mapExtractionMethod(method: string | null): InstitutionalEvidenceItem['provenance']['extraction_method'] {
  const normalized = (method || '').toLowerCase();
  if (normalized.includes('llm')) return 'llm';
  if (normalized.includes('manual')) return 'manual';
  if (normalized.includes('api')) return 'api';
  if (normalized.includes('scrap')) return 'scraping';
  return 'regex';
}

function sha256Text(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}
