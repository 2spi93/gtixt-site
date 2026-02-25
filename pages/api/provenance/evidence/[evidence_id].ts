/**
 * GET /api/provenance/evidence/[evidence_id]
 * 
 * Get complete provenance for a single evidence item
 * Shows transformation chain from raw data to processed evidence
 * 
 * @example
 * GET /api/provenance/evidence/evt_abc123
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "evidence": {
 *       "evidence_id": "evt_abc123",
 *       "provenance": {...},
 *       "evidence_hash": "abc123...",
 *       "verification": {
 *         "hash_valid": true,
 *         "signature_valid": true
 *       }
 *     }
 *   }
 * }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { Pool } from 'pg';
import { z } from 'zod';
import {
  sendSuccess,
  sendError,
  requireGET,
  withValidation,
} from '../../../../lib/api-middleware';
import type { ApiResponse } from '../../../../lib/data-models';
import type { InstitutionalEvidenceItem } from '../../../../lib/institutional-data-models';
import { verifyEvidenceHash } from '../../../../lib/hashing-utils';

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

// =====================================================
// REQUEST VALIDATION
// =====================================================

const PathParamsSchema = z.object({
  evidence_id: z.string().uuid('Invalid evidence_id format (must be UUID)'),
});

const QueryParamsSchema = z.object({
  verify: z
    .enum(['true', 'false'])
    .optional()
    .default('true')
    .transform((val) => val === 'true'),
  include_raw_data: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
});

// =====================================================
// RESPONSE TYPES
// =====================================================

interface EvidenceProvenanceResponse {
  evidence: InstitutionalEvidenceItem;
  verification?: {
    hash_valid: boolean;
    legacy_hash_used?: boolean;
    legacy_hash_valid?: boolean;
    signature_valid: boolean;
    provenance_complete: boolean;
    message: string;
  };
  raw_data_url?: string;
}

// =====================================================
// HANDLER
// =====================================================

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<EvidenceProvenanceResponse>>
) {
  // Validate method
  requireGET(req, res);
  
  // Parse and validate path parameters
  const pathResult = PathParamsSchema.safeParse(req.query);
  if (!pathResult.success) {
    const details = pathResult.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      value: undefined,
      rule: issue.code,
    }));
    sendError(res, 'Invalid path parameters', 400, details);
    return;
  }
  const queryParams = QueryParamsSchema.parse(req.query);
  
  const { evidence_id } = pathResult.data;
  const { verify, include_raw_data } = queryParams;
  
  try {
    const dbPool = getPool();
    if (!dbPool) {
      return sendError(res, 'Database not configured for provenance queries', 503);
    }
    const evidenceResult = await getEvidenceWithProvenance(dbPool, evidence_id);
    
    if (!evidenceResult) {
      return sendError(res, `Evidence item ${evidence_id} not found`, 404);
    }

    const { evidence, evidenceKey, firmId } = evidenceResult;
    
    const response: EvidenceProvenanceResponse = {
      evidence,
    };
    
    // Optionally verify hash
    if (verify) {
      let hashValid = verifyEvidenceHash(evidence, evidence.evidence_hash);
      let legacyHashUsed = false;
      let legacyHashValid = false;

      if (!hashValid && evidenceKey) {
        const legacyHash = computeLegacyEvidenceHash(
          firmId,
          evidenceKey,
          evidence.provenance.raw_data_hash || '',
          evidence.provenance.source_url || ''
        );
        legacyHashUsed = true;
        legacyHashValid = legacyHash === evidence.evidence_hash;
        hashValid = legacyHashValid;
      }

      response.verification = {
        hash_valid: hashValid,
        legacy_hash_used: legacyHashUsed || undefined,
        legacy_hash_valid: legacyHashUsed ? legacyHashValid : undefined,
        signature_valid: evidence.immutable.signature ? true : false, // TODO: Actual signature verification
        provenance_complete: evidence.provenance.transformation_chain.length > 0,
        message: hashValid
          ? legacyHashUsed
            ? 'Evidence hash verified successfully (legacy schema)'
            : 'Evidence hash verified successfully'
          : 'WARNING: Evidence hash mismatch - data may be corrupted',
      };
    }
    
    // Optionally include raw data URL
    if (include_raw_data) {
      response.raw_data_url = evidence.provenance.raw_data_archive_url;
    }
    
    return sendSuccess(res, response);
  } catch (error) {
    console.error('Error fetching evidence provenance:', error);
    
    return sendError(res, 'Failed to fetch evidence provenance', 500);
  }
}

// =====================================================
// DATABASE QUERY (PLACEHOLDER)
// =====================================================

async function getEvidenceWithProvenance(
  dbPool: Pool,
  evidenceId: string
): Promise<{ evidence: InstitutionalEvidenceItem; evidenceKey: string | null; firmId: string } | null> {
  const result = await dbPool.query(
    `
    SELECT
      ep.evidence_id,
      ep.firm_id,
      ep.snapshot_id,
      ep.pillar_id,
      e.key AS evidence_key,
      ep.source_system,
      ep.source_url,
      ep.crawler_agent,
      ep.crawler_version,
      ep.extraction_method,
      ep.extraction_timestamp,
      ep.operator_id,
      ep.transformation_chain,
      ep.validation,
      ep.raw_data_hash,
      ep.raw_data_archive_url,
      ep.evidence_hash,
      ep.created_at,
      ep.created_by,
      ep.locked,
      ep.signature
    FROM evidence_provenance ep
    LEFT JOIN evidence e
      ON e.firm_id = ep.firm_id
     AND e.source_url = ep.source_url
     AND (e.sha256 = ep.raw_data_hash OR ep.raw_data_hash IS NULL)
    WHERE ep.evidence_id = $1
    LIMIT 1
    `,
    [evidenceId]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const validation = row.validation || {};
  const validationScore = typeof validation.validation_score === 'number'
    ? validation.validation_score
    : Number(validation.validation_score || 0);

  const confidence = mapConfidenceLevel(validationScore);
  const evidenceType = mapEvidenceType(row.source_system);
  const timestamp = row.extraction_timestamp || row.created_at || new Date().toISOString();

  const evidence = {
    evidence_id: row.evidence_id,
    type: evidenceType,
    description: row.source_url ? `Evidence from ${row.source_url}` : 'Evidence item',
    source: row.source_system,
    timestamp: new Date(timestamp).toISOString(),
    confidence,
    value: null,
    provenance: {
      source_system: row.source_system,
      source_url: row.source_url || undefined,
      crawler_agent: row.crawler_agent,
      crawler_version: row.crawler_version,
      extraction_method: row.extraction_method,
      extraction_timestamp: new Date(timestamp).toISOString(),
      operator_id: row.operator_id || undefined,
      transformation_chain: Array.isArray(row.transformation_chain) ? row.transformation_chain : [],
      validation: {
        validated_by: validation.validated_by || 'heuristic',
        validator_version: validation.validator_version || 'unknown',
        validation_score: validationScore || 0,
        validation_timestamp: validation.validation_timestamp || new Date(timestamp).toISOString(),
        validation_notes: validation.validation_notes || undefined,
        checks: Array.isArray(validation.checks) ? validation.checks : undefined,
      },
      raw_data_hash: row.raw_data_hash || row.evidence_hash,
      raw_data_archive_url: row.raw_data_archive_url || undefined,
    },
    evidence_hash: row.evidence_hash,
    immutable: {
      created_at: row.created_at?.toISOString?.() || new Date().toISOString(),
      created_by: row.created_by,
      locked: Boolean(row.locked),
      signature: row.signature || undefined,
    },
  };

  return {
    evidence,
    evidenceKey: row.evidence_key || null,
    firmId: row.firm_id,
  };
}

function computeLegacyEvidenceHash(
  firmId: string,
  evidenceKey: string,
  rawDataHash: string,
  sourceUrl: string
): string {
  const payload = {
    firm_id: firmId,
    evidence_key: evidenceKey,
    raw_data_hash: rawDataHash,
    source_url: sourceUrl,
  };
  const orderedKeys = Object.keys(payload).sort();
  const serialized = `{${orderedKeys
    .map((key) => `${JSON.stringify(key)}: ${JSON.stringify(payload[key as keyof typeof payload])}`)
    .join(', ')}}`;
  return crypto
    .createHash('sha256')
    .update(serialized, 'utf8')
    .digest('hex');
}

function mapEvidenceType(sourceSystem: string): InstitutionalEvidenceItem['type'] {
  const normalized = (sourceSystem || '').toLowerCase();
  if (normalized.includes('regulatory')) return 'regulatory_filing';
  if (normalized.includes('news')) return 'news';
  if (normalized.includes('manual')) return 'audit';
  return 'disclosure';
}

function mapConfidenceLevel(score: number): InstitutionalEvidenceItem['confidence'] {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  if (score > 0) return 'low';
  return 'medium';
}

// Export with validation middleware
export default withValidation(handler);
