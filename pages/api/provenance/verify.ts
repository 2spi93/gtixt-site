/**
 * POST /api/provenance/verify
 * 
 * Verify provenance chain integrity
 * Can verify:
 * - Evidence hash
 * - Pillar hash chain
 * - Firm hash chain  
 * - Dataset hash
 * - Merkle proof
 * - Snapshot signature
 * 
 * @example
 * POST /api/provenance/verify
 * Body: {
 *   "type": "evidence",
 *   "evidence_id": "evt_abc123",
 *   "claimed_hash": "abc123..."
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "verification": {
 *       "valid": true,
 *       "verification_type": "evidence",
 *       "details": {...}
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
  requirePOST,
  withValidation,
  validateRequest,
} from '../../../lib/api-middleware';
import type { ApiResponse } from '../../../lib/data-models';
import { verifyMerkleProof, type MerkleProof } from '../../../lib/merkle-tree';
import {
  verifyEvidenceHash,
  verifyPillarHash,
  verifyFirmHash,
  verifyDatasetHash,
  verifySnapshotChain,
} from '../../../lib/hashing-utils';
import { verifySnapshotSignature } from '../../../lib/snapshot-signing';
import type { InstitutionalEvidenceItem } from '../../../lib/institutional-data-models';

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

const EvidenceVerificationSchema = z.object({
  type: z.literal('evidence'),
  evidence_id: z.string().uuid(),
  claimed_hash: z.string().regex(/^[a-f0-9]{64}$/),
});

const PillarVerificationSchema = z.object({
  type: z.literal('pillar'),
  pillar_id: z.string(),
  snapshot_id: z.string().uuid(),
});

const FirmVerificationSchema = z.object({
  type: z.literal('firm'),
  firm_id: z.string().regex(/^[a-z0-9_]+$/),
  snapshot_id: z.string().uuid(),
});

const DatasetVerificationSchema = z.object({
  type: z.literal('dataset'),
  dataset_timestamp: z.string().datetime(),
});

const MerkleProofVerificationSchema = z.object({
  type: z.literal('merkle_proof'),
  proof: z.object({
    leaf: z.string().regex(/^[a-f0-9]{64}$/),
    leafIndex: z.number().int().min(0),
    proof: z.array(
      z.object({
        hash: z.string().regex(/^[a-f0-9]{64}$/),
        position: z.enum(['left', 'right']),
      })
    ),
    root: z.string().regex(/^[a-f0-9]{64}$/),
  }),
});

const SnapshotChainVerificationSchema = z.object({
  type: z.literal('snapshot_chain'),
  current_snapshot_id: z.string().uuid(),
  previous_snapshot_id: z.string().uuid().optional(),
});

const BodySchema = z.discriminatedUnion('type', [
  EvidenceVerificationSchema,
  PillarVerificationSchema,
  FirmVerificationSchema,
  DatasetVerificationSchema,
  MerkleProofVerificationSchema,
  SnapshotChainVerificationSchema,
]);

type VerificationRequest = z.infer<typeof BodySchema>;

// =====================================================
// RESPONSE TYPES
// =====================================================

interface VerificationResult {
  valid: boolean;
  verification_type: string;
  verified_at: string;
  details: Record<string, any>;
  message: string;
}

// =====================================================
// HANDLER
// =====================================================

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<{ verification: VerificationResult }>>
) {
  // Validate method
  if (!requirePOST(req, res)) {
    return;
  }
  
  // Parse and validate request body
  const body = await validateRequest<VerificationRequest>(req, res, BodySchema);
  if (!body) {
    return;
  }
  
  try {
    const dbPool = getPool();
    if (!dbPool) {
      return sendError(res, 'Database not configured for provenance queries', 503);
    }
    let result: VerificationResult;
    
    switch (body.type) {
      case 'evidence':
        result = await verifyEvidence(dbPool, body.evidence_id, body.claimed_hash);
        break;
      
      case 'pillar':
        result = await verifyPillar(dbPool, body.pillar_id, body.snapshot_id);
        break;
      
      case 'firm':
        result = await verifyFirm(dbPool, body.firm_id, body.snapshot_id);
        break;
      
      case 'dataset':
        result = await verifyDataset(dbPool, body.dataset_timestamp);
        break;
      
      case 'merkle_proof':
        result = verifyMerkle(body.proof);
        break;
      
      case 'snapshot_chain':
        result = await verifyChain(dbPool, body.current_snapshot_id, body.previous_snapshot_id);
        break;
      
      default:
        return sendError(res, 'Invalid verification type', 400);
    }
    
    return sendSuccess(res, { verification: result });
  } catch (error: any) {
    console.error('Verification error:', error);
    
    return sendError(res, error.message || 'Verification failed', 500);
  }
}

// =====================================================
// VERIFICATION IMPLEMENTATIONS
// =====================================================

async function verifyEvidence(
  dbPool: Pool,
  evidenceId: string,
  claimedHash: string
): Promise<VerificationResult> {
  const result = await dbPool.query(
    `
    SELECT
      ep.evidence_id,
      ep.firm_id,
      ep.source_system,
      ep.source_url,
      e.key AS evidence_key,
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
    return {
      valid: false,
      verification_type: 'evidence',
      verified_at: new Date().toISOString(),
      details: {
        evidence_id: evidenceId,
      },
      message: 'Evidence not found',
    };
  }

  const evidence = mapEvidenceRow(row);
  const computedHash = evidence.evidence_hash;
  let isValid = verifyEvidenceHash(evidence, claimedHash);
  let legacyComputedHash: string | null = null;

  if (!isValid && row.evidence_key) {
    legacyComputedHash = computeLegacyEvidenceHash(
      row.firm_id,
      row.evidence_key,
      row.raw_data_hash || '',
      row.source_url || ''
    );
    isValid = legacyComputedHash === claimedHash;
  }

  return {
    valid: isValid,
    verification_type: 'evidence',
    verified_at: new Date().toISOString(),
    details: {
      evidence_id: evidenceId,
      claimed_hash: claimedHash,
      computed_hash: computedHash,
      legacy_computed_hash: legacyComputedHash || undefined,
    },
    message: isValid
      ? legacyComputedHash
        ? 'Evidence hash verified successfully (legacy schema)'
        : 'Evidence hash verified successfully'
      : 'Evidence hash mismatch - data may be corrupted',
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

async function verifyPillar(
  dbPool: Pool,
  pillarId: string,
  snapshotId: string
): Promise<VerificationResult> {
  const snapshotResult = await dbPool.query(
    `SELECT created_at FROM snapshot_metadata WHERE snapshot_uuid = $1 LIMIT 1`,
    [snapshotId]
  );
  const snapshotRow = snapshotResult.rows[0];
  if (!snapshotRow) {
    return {
      valid: false,
      verification_type: 'pillar',
      verified_at: new Date().toISOString(),
      details: {
        pillar_id: pillarId,
        snapshot_id: snapshotId,
      },
      message: 'Snapshot not found',
    };
  }

  const snapshotDate = new Date(snapshotRow.created_at).toISOString().slice(0, 10);
  const hashResult = await dbPool.query(
    `
    SELECT firm_hashes, dataset_timestamp
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
      valid: false,
      verification_type: 'pillar',
      verified_at: new Date().toISOString(),
      details: {
        pillar_id: pillarId,
        snapshot_id: snapshotId,
      },
      message: 'No hashing record available for this snapshot',
    };
  }

  const firmHashes = hashRow.firm_hashes || {};
  const pillarResults = Object.values(firmHashes)
    .map((firmHash: any) => firmHash?.pillar_hashing?.[pillarId])
    .filter(Boolean)
    .map((pillarHash: any) => verifyPillarHash(pillarHash));

  const isValid = pillarResults.length > 0 && pillarResults.every(Boolean);

  return {
    valid: isValid,
    verification_type: 'pillar',
    verified_at: new Date().toISOString(),
    details: {
      pillar_id: pillarId,
      snapshot_id: snapshotId,
      pillars_checked: pillarResults.length,
    },
    message: isValid
      ? 'Pillar hash chain verified across dataset'
      : 'Pillar hash chain verification failed or missing data',
  };
}

async function verifyFirm(
  dbPool: Pool,
  firmId: string,
  snapshotId: string
): Promise<VerificationResult> {
  const snapshotResult = await dbPool.query(
    `SELECT created_at FROM snapshot_metadata WHERE snapshot_uuid = $1 LIMIT 1`,
    [snapshotId]
  );
  const snapshotRow = snapshotResult.rows[0];
  if (!snapshotRow) {
    return {
      valid: false,
      verification_type: 'firm',
      verified_at: new Date().toISOString(),
      details: {
        firm_id: firmId,
        snapshot_id: snapshotId,
      },
      message: 'Snapshot not found',
    };
  }

  const snapshotDate = new Date(snapshotRow.created_at).toISOString().slice(0, 10);
  const hashResult = await dbPool.query(
    `
    SELECT firm_hashes, dataset_timestamp
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
      valid: false,
      verification_type: 'firm',
      verified_at: new Date().toISOString(),
      details: {
        firm_id: firmId,
        snapshot_id: snapshotId,
      },
      message: 'No hashing record available for this snapshot',
    };
  }

  const firmHashing = hashRow.firm_hashes?.[firmId];
  const isValid = firmHashing ? verifyFirmHash(firmHashing) : false;

  return {
    valid: isValid,
    verification_type: 'firm',
    verified_at: new Date().toISOString(),
    details: {
      firm_id: firmId,
      snapshot_id: snapshotId,
    },
    message: isValid
      ? 'Firm hash chain verified successfully'
      : 'Firm hash chain verification failed or missing data',
  };
}

async function verifyDataset(
  dbPool: Pool,
  datasetTimestamp: string
): Promise<VerificationResult> {
  const result = await dbPool.query(
    `
    SELECT dataset_timestamp, dataset_hash, merkle_root, firm_hashes
    FROM multi_level_hashes
    WHERE dataset_timestamp = $1
    LIMIT 1
    `,
    [datasetTimestamp]
  );

  const row = result.rows[0];
  if (!row) {
    return {
      valid: false,
      verification_type: 'dataset',
      verified_at: new Date().toISOString(),
      details: {
        dataset_timestamp: datasetTimestamp,
      },
      message: 'Dataset hash record not found',
    };
  }

  const isValid = verifyDatasetHash({
    dataset_timestamp: row.dataset_timestamp,
    dataset_hash: row.dataset_hash,
    firm_hashes: row.firm_hashes || {},
    merkle_root: row.merkle_root,
    merkle_proofs: undefined,
    metadata: {
      algorithm: 'sha256',
      total_firms: Object.keys(row.firm_hashes || {}).length,
      tree_height: 0,
      created_at: new Date().toISOString(),
    },
  });

  return {
    valid: isValid,
    verification_type: 'dataset',
    verified_at: new Date().toISOString(),
    details: {
      dataset_timestamp: datasetTimestamp,
      dataset_hash_valid: isValid,
      merkle_root_valid: isValid,
      total_firms_verified: Object.keys(row.firm_hashes || {}).length,
    },
    message: isValid
      ? 'Dataset hash verified successfully - all firm hashes are consistent'
      : 'Dataset hash verification failed',
  };
}

function verifyMerkle(proof: MerkleProof): VerificationResult {
  const result = verifyMerkleProof(proof);
  
  return {
    valid: result.valid,
    verification_type: 'merkle_proof',
    verified_at: new Date().toISOString(),
    details: {
      leaf: proof.leaf,
      leaf_index: proof.leafIndex,
      proof_length: proof.proof.length,
      computed_root: result.computedRoot,
      expected_root: result.expectedRoot,
    },
    message: result.message,
  };
}

async function verifyChain(
  dbPool: Pool,
  currentSnapshotId: string,
  previousSnapshotId?: string
): Promise<VerificationResult> {
  const currentResult = await dbPool.query(
    `
    SELECT snapshot_uuid, snapshot_hash, sha256, previous_snapshot_hash, signature
    FROM snapshot_metadata
    WHERE snapshot_uuid = $1
    LIMIT 1
    `,
    [currentSnapshotId]
  );

  const current = currentResult.rows[0];
  if (!current) {
    return {
      valid: false,
      verification_type: 'snapshot_chain',
      verified_at: new Date().toISOString(),
      details: {
        current_snapshot_id: currentSnapshotId,
      },
      message: 'Snapshot not found',
    };
  }

  let previous: any = null;
  if (previousSnapshotId) {
    const prevResult = await dbPool.query(
      `
      SELECT snapshot_hash, sha256
      FROM snapshot_metadata
      WHERE snapshot_uuid = $1
      LIMIT 1
      `,
      [previousSnapshotId]
    );
    previous = prevResult.rows[0] || null;
  } else if (current.previous_snapshot_hash) {
    const prevResult = await dbPool.query(
      `
      SELECT snapshot_hash, sha256
      FROM snapshot_metadata
      WHERE snapshot_hash = $1
      LIMIT 1
      `,
      [current.previous_snapshot_hash]
    );
    previous = prevResult.rows[0] || null;
  }

  const currentHash = current.snapshot_hash || current.sha256;
  const previousHash = previous?.snapshot_hash || previous?.sha256 || null;
  const chainValid = verifySnapshotChain(
    {
      snapshot_hash: currentHash,
      previous_snapshot_hash: current.previous_snapshot_hash || null,
    },
    previousHash ? { snapshot_hash: previousHash } : undefined
  );

  let signatureValid = false;
  if (current.signature && currentHash) {
    try {
      signatureValid = verifySnapshotSignature(currentHash, current.signature);
    } catch {
      signatureValid = false;
    }
  }

  return {
    valid: Boolean(chainValid && (current.signature ? signatureValid : true)),
    verification_type: 'snapshot_chain',
    verified_at: new Date().toISOString(),
    details: {
      current_snapshot_id: currentSnapshotId,
      previous_snapshot_id: previousSnapshotId || null,
      chain_link_valid: chainValid,
      signature_valid: signatureValid,
    },
    message: chainValid
      ? 'Snapshot chain verified - link is valid'
      : 'Snapshot chain verification failed - link is broken',
  };
}

function mapEvidenceRow(row: any): InstitutionalEvidenceItem {
  const validation = row.validation || {};
  const validationScore = typeof validation.validation_score === 'number'
    ? validation.validation_score
    : Number(validation.validation_score || 0);

  const confidence = validationScore >= 80 ? 'high'
    : validationScore >= 50 ? 'medium'
    : validationScore > 0 ? 'low'
    : 'medium';

  const timestamp = row.extraction_timestamp || row.created_at || new Date().toISOString();

  return {
    evidence_id: row.evidence_id,
    type: mapEvidenceType(row.source_system),
    description: row.source_url ? `Evidence from ${row.source_url}` : 'Evidence item',
    source: row.source_system,
    timestamp: new Date(timestamp).toISOString(),
    confidence,
    value: undefined,
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
}

function mapEvidenceType(sourceSystem: string): InstitutionalEvidenceItem['type'] {
  const normalized = (sourceSystem || '').toLowerCase();
  if (normalized.includes('regulatory')) return 'regulatory_filing';
  if (normalized.includes('news')) return 'news';
  if (normalized.includes('manual')) return 'audit';
  return 'disclosure';
}

// Export with validation middleware
export default withValidation(handler);
