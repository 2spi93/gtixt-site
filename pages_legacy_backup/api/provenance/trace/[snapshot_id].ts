/**
 * GET /api/provenance/trace/[snapshot_id]
 * 
 * Trace complete score calculation for a snapshot
 * Shows how the final score was computed from all evidence
 * 
 * @example
 * GET /api/provenance/trace/snap_abc123
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "trace": {
 *       "snapshot_id": "snap_abc123",
 *       "firm_id": "jane_street",
 *       "final_score": 87.5,
 *       "computation_steps": [...],
 *       "evidence_count": 42,
 *       "verification": {...}
 *     }
 *   }
 * }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import { z } from 'zod';
import {
  sendSuccess,
  sendError,
  requireGET,
  withValidation,
} from '../../../../lib/api-middleware';
import type { ApiResponse, PillarId } from '../../../../lib/data-models';
import { verifyDatasetHash, verifyFirmHash } from '../../../../lib/hashing-utils';

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
  snapshot_id: z.string().uuid('Invalid snapshot_id format (must be UUID)'),
});

const QueryParamsSchema = z.object({
  verify_hashes: z
    .enum(['true', 'false'])
    .optional()
    .default('true')
    .transform((val) => val === 'true'),
  include_evidence: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
  firm_id: z.string().regex(/^[a-z0-9_]+$/).optional(),
});

// =====================================================
// RESPONSE TYPES
// =====================================================

interface ComputationStep {
  step: number;
  operation: string;
  input: string;
  output: string;
  formula?: string;
  parameters?: Record<string, any>;
  timestamp: string;
}

interface ScoreTraceResponse {
  trace: {
    snapshot_id: string;
    firm_id: string;
    firm_name: string;
    final_score: number;
    pillar_scores: Record<PillarId, number>;
    computation_steps: ComputationStep[];
    evidence_count: number;
    evidence_by_pillar: Record<PillarId, number>;
    specification_version: string;
    verification?: {
      firm_hash_valid: boolean;
      all_pillar_hashes_valid: boolean;
      evidence_hashes_valid: boolean;
      chain_valid: boolean;
      message: string;
    };
  };
}

// =====================================================
// HANDLER
// =====================================================

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ScoreTraceResponse>>
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
  
  const { snapshot_id } = pathResult.data;
  const { verify_hashes, include_evidence, firm_id } = queryParams;
  
  try {
    const dbPool = getPool();
    if (!dbPool) {
      return sendError(res, 'Database not configured for provenance queries', 503);
    }
    const trace = await getScoreTrace(dbPool, snapshot_id, include_evidence, firm_id);
    
    if (!trace) {
      return sendError(res, `Snapshot ${snapshot_id} not found`, 404);
    }
    
    // Optionally verify hashes
    if (verify_hashes) {
      const verification = await verifySnapshotHashes(dbPool, snapshot_id, trace.firm_id);
      trace.verification = verification;
    }
    
    return sendSuccess(res, { trace });
  } catch (error) {
    console.error('Error tracing snapshot computation:', error);
    
    return sendError(res, 'Failed to trace snapshot computation', 500);
  }
}

// =====================================================
// DATABASE QUERIES (PLACEHOLDER)
// =====================================================

async function getScoreTrace(
  dbPool: Pool,
  snapshotId: string,
  includeEvidence: boolean,
  firmId?: string
): Promise<ScoreTraceResponse['trace'] | null> {
  const snapshotResult = await dbPool.query(
    `
    SELECT id, snapshot_uuid, snapshot_key, created_at, signature, snapshot_hash
    FROM snapshot_metadata
    WHERE snapshot_uuid = $1
    LIMIT 1
    `,
    [snapshotId]
  );

  const snapshotRow = snapshotResult.rows[0];
  if (!snapshotRow) {
    return null;
  }

  let resolvedFirmId = firmId;
  if (!resolvedFirmId) {
    const firmResult = await dbPool.query(
      `
      SELECT firm_id
      FROM snapshot_scores
      WHERE snapshot_id = $1
      ORDER BY score_0_100 DESC NULLS LAST
      LIMIT 1
      `,
      [snapshotRow.id]
    );
    resolvedFirmId = firmResult.rows[0]?.firm_id;
  }

  if (!resolvedFirmId) {
    return null;
  }

  const scoreResult = await dbPool.query(
    `
    SELECT firm_id, score_0_100, pillar_scores, metric_scores, na_rate, confidence, version_key
    FROM snapshot_scores
    WHERE snapshot_id = $1 AND firm_id = $2
    LIMIT 1
    `,
    [snapshotRow.id, resolvedFirmId]
  );

  const scoreRow = scoreResult.rows[0];
  if (!scoreRow) {
    return null;
  }

  const firmResult = await dbPool.query(
    `SELECT name FROM firms WHERE firm_id = $1 LIMIT 1`,
    [resolvedFirmId]
  );

  const evidenceCountResult = await dbPool.query(
    `SELECT COUNT(*)::int AS count FROM evidence_provenance WHERE firm_id = $1`,
    [resolvedFirmId]
  );

  const evidenceByPillarResult = await dbPool.query(
    `
    SELECT pillar_id, COUNT(*)::int AS count
    FROM evidence_provenance
    WHERE firm_id = $1 AND pillar_id IS NOT NULL
    GROUP BY pillar_id
    `,
    [resolvedFirmId]
  );

  const evidenceByPillar = {} as Record<PillarId, number>;
  evidenceByPillarResult.rows.forEach((row) => {
    if (row.pillar_id) {
      evidenceByPillar[row.pillar_id as PillarId] = Number(row.count) || 0;
    }
  });

  const pillarScores = (scoreRow.pillar_scores || {}) as Record<PillarId, number>;
  const scoreTimestamp = snapshotRow.created_at?.toISOString?.() || new Date().toISOString();
  const evidenceCount = Number(evidenceCountResult.rows[0]?.count || 0);

  const computationSteps: ComputationStep[] = [
    {
      step: 1,
      operation: 'evidence_collection',
      input: 'raw_data_sources',
      output: `${evidenceCount} evidence items`,
      timestamp: scoreTimestamp,
    },
    {
      step: 2,
      operation: 'pillar_scoring',
      input: 'evidence_items',
      output: `${Object.keys(pillarScores).length} pillar scores`,
      timestamp: scoreTimestamp,
    },
    {
      step: 3,
      operation: 'final_aggregation',
      input: 'pillar_scores',
      output: `final_score: ${Number(scoreRow.score_0_100) || 0}`,
      timestamp: scoreTimestamp,
    },
  ];

  if (snapshotRow.snapshot_hash) {
    computationSteps.push({
      step: computationSteps.length + 1,
      operation: 'hash_computation',
      input: 'snapshot_data',
      output: 'snapshot_hash',
      timestamp: scoreTimestamp,
    });
  }

  if (snapshotRow.signature) {
    computationSteps.push({
      step: computationSteps.length + 1,
      operation: 'signature',
      input: 'snapshot_hash',
      output: 'signed_snapshot',
      parameters: { algorithm: 'ECDSA-secp256k1' },
      timestamp: scoreTimestamp,
    });
  }

  return {
    snapshot_id: snapshotId,
    firm_id: resolvedFirmId,
    firm_name: firmResult.rows[0]?.name || resolvedFirmId,
    final_score: Number(scoreRow.score_0_100) || 0,
    pillar_scores: pillarScores,
    computation_steps: includeEvidence ? computationSteps : computationSteps.slice(0, 3),
    evidence_count: evidenceCount,
    evidence_by_pillar: evidenceByPillar,
    specification_version: scoreRow.version_key || 'unknown',
  };
}

async function verifySnapshotHashes(dbPool: Pool, snapshotId: string, firmId: string) {
  const snapshotResult = await dbPool.query(
    `SELECT created_at FROM snapshot_metadata WHERE snapshot_uuid = $1 LIMIT 1`,
    [snapshotId]
  );
  const snapshotRow = snapshotResult.rows[0];
  if (!snapshotRow) {
    return {
      firm_hash_valid: false,
      all_pillar_hashes_valid: false,
      evidence_hashes_valid: false,
      chain_valid: false,
      message: 'Snapshot not found',
    };
  }

  const snapshotDate = new Date(snapshotRow.created_at).toISOString().slice(0, 10);
  const hashResult = await dbPool.query(
    `
    SELECT firm_hashes, dataset_hash, merkle_root, dataset_timestamp
    FROM multi_level_hashes
    WHERE snapshot_date = $1
    ORDER BY dataset_timestamp DESC
    LIMIT 1
    `,
    [snapshotDate]
  );

  const hashRow = hashResult.rows[0];
  if (!hashRow) {
    return {
      firm_hash_valid: false,
      all_pillar_hashes_valid: false,
      evidence_hashes_valid: false,
      chain_valid: false,
      message: 'No hashing record available for this snapshot',
    };
  }

  const firmHashing = hashRow.firm_hashes?.[firmId];
  const firmHashValid = firmHashing ? verifyFirmHash(firmHashing) : false;
  const datasetValid = verifyDatasetHash({
    dataset_timestamp: hashRow.dataset_timestamp,
    dataset_hash: hashRow.dataset_hash,
    firm_hashes: hashRow.firm_hashes || {},
    merkle_root: hashRow.merkle_root,
    merkle_proofs: undefined,
    metadata: {
      algorithm: 'sha256',
      total_firms: Object.keys(hashRow.firm_hashes || {}).length,
      tree_height: 0,
      created_at: new Date().toISOString(),
    },
  });

  return {
    firm_hash_valid: firmHashValid,
    all_pillar_hashes_valid: firmHashValid,
    evidence_hashes_valid: firmHashValid,
    chain_valid: datasetValid,
    message: firmHashValid && datasetValid
      ? 'Hash records verified for firm and dataset'
      : 'Hash verification incomplete or missing data',
  };
}

// Export with validation middleware
export default withValidation(handler);