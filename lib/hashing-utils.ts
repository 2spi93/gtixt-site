/**
 * GTIXT Hashing Utilities
 * 
 * Multi-level SHA-256 hashing for institutional-grade verification:
 * - Evidence level: Individual evidence items
 * - Pillar level: Aggregated evidence per pillar
 * - Firm level: All pillars for a firm
 * - Dataset level: All firms in a snapshot
 * 
 * All hashes are deterministic and reproducible.
 * 
 * @module lib/hashing-utils
 * @version 1.0.0
 */

import crypto from 'crypto';
import type {
  InstitutionalEvidenceItem,
  EvidenceProvenance,
  PillarHashing,
  FirmHashing,
  MultiLevelHashing,
  PillarId,
} from './institutional-data-models';

// =====================================================
// CORE HASHING FUNCTIONS
// =====================================================

/**
 * Generate SHA-256 hash of any data
 * @param data - Data to hash (string or object)
 * @returns Hex-encoded SHA-256 hash (64 characters)
 */
export function sha256(data: string | object): string {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Generate deterministic hash of an array (order-independent)
 * Sorts items before hashing to ensure consistency
 * @param items - Array of strings or objects
 * @returns SHA-256 hash
 */
export function hashArray(items: (string | object)[]): string {
  const sorted = items
    .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
    .sort(); // Lexicographic sort for determinism
  
  return sha256(sorted.join('|'));
}

/**
 * Generate deterministic hash of an object (key order-independent)
 * Sorts keys before hashing
 * @param obj - Object to hash
 * @returns SHA-256 hash
 */
export function hashObject(obj: Record<string, any>): string {
  const sortedKeys = Object.keys(obj).sort();
  const sortedObj: Record<string, any> = {};
  
  for (const key of sortedKeys) {
    sortedObj[key] = obj[key];
  }
  
  return sha256(JSON.stringify(sortedObj));
}

// =====================================================
// EVIDENCE-LEVEL HASHING
// =====================================================

/**
 * Hash a single evidence item
 * Includes content, metadata, and provenance
 * 
 * @param evidence - Evidence item to hash
 * @returns SHA-256 hash (64 hex chars)
 */
export function hashEvidence(evidence: InstitutionalEvidenceItem): string {
  // Create deterministic representation
  const hashInput = {
    evidence_id: evidence.evidence_id,
    type: evidence.type,
    description: evidence.description,
    source: evidence.source,
    timestamp: evidence.timestamp,
    confidence: evidence.confidence,
    value: evidence.value ?? null,
    
    // Include provenance chain
    provenance: {
      source_system: evidence.provenance.source_system,
      source_url: evidence.provenance.source_url,
      crawler_agent: evidence.provenance.crawler_agent,
      crawler_version: evidence.provenance.crawler_version,
      extraction_method: evidence.provenance.extraction_method,
      extraction_timestamp: evidence.provenance.extraction_timestamp,
      // Hash transformation chain separately for efficiency
      transformation_chain_hash: hashArray(evidence.provenance.transformation_chain || []),
      raw_data_hash: evidence.provenance.raw_data_hash,
    },
  };
  
  return hashObject(hashInput);
}

/**
 * Hash provenance data only
 * @param provenance - Evidence provenance
 * @returns SHA-256 hash
 */
export function hashProvenance(provenance: EvidenceProvenance): string {
  return hashObject({
    source_system: provenance.source_system,
    source_url: provenance.source_url,
    crawler_agent: provenance.crawler_agent,
    crawler_version: provenance.crawler_version,
    extraction_method: provenance.extraction_method,
    transformation_chain: provenance.transformation_chain,
    raw_data_hash: provenance.raw_data_hash,
  });
}

// =====================================================
// PILLAR-LEVEL HASHING
// =====================================================

/**
 * Generate hashing for a single pillar
 * 
 * Hash chain:
 * 1. evidence_list_hash - Hash of all evidence IDs (sorted)
 * 2. computation_hash - Hash of scoring formula + weights
 * 3. final_hash - Hash combining evidence + computation + score
 * 
 * @param pillarId - Pillar identifier
 * @param evidenceItems - All evidence for this pillar
 * @param pillarScore - Computed pillar score
 * @param scoringRules - Scoring methodology (formula + weights)
 * @returns PillarHashing object
 */
export function hashPillar(
  pillarId: PillarId,
  evidenceItems: InstitutionalEvidenceItem[],
  pillarScore: number,
  scoringRules: {
    formula: string;
    weights: Record<string, number>;
    version: string;
  }
): PillarHashing {
  // Step 1: Hash individual evidence items
  const evidenceHashes: Record<string, string> = {};
  for (const evidence of evidenceItems) {
    evidenceHashes[evidence.evidence_id] = hashEvidence(evidence);
  }
  
  // Step 2: Hash the list of evidence (sorted IDs)
  const sortedEvidenceIds = Object.keys(evidenceHashes).sort();
  const evidence_list_hash = hashArray(sortedEvidenceIds.map((id) => evidenceHashes[id]));
  
  // Step 3: Hash the computation methodology
  const computation_hash = hashObject({
    formula: scoringRules.formula,
    weights: scoringRules.weights,
    version: scoringRules.version,
  });
  
  // Step 4: Final pillar hash combines everything
  const final_hash = hashObject({
    pillar_id: pillarId,
    evidence_list_hash,
    computation_hash,
    pillar_score: pillarScore,
  });
  
  return {
    pillar_id: pillarId,
    evidence_list_hash,
    computation_hash,
    final_hash,
    evidence_hashes: evidenceHashes,
  };
}

// =====================================================
// FIRM-LEVEL HASHING
// =====================================================

/**
 * Generate hashing for a complete firm snapshot
 * 
 * Hash chain:
 * 1. pillar_hashing - Hash for each of 7 pillars
 * 2. pillars_hash - Hash of all pillar final hashes
 * 3. aggregation_hash - Hash of score aggregation method
 * 4. final_score_hash - Hash combining pillars + aggregation + final score
 * 
 * @param firmId - Firm identifier
 * @param pillarHashings - Hashing objects for all 7 pillars
 * @param finalScore - Firm's final transparency score
 * @param aggregationMethod - How pillar scores are combined
 * @returns FirmHashing object
 */
export function hashFirm(
  firmId: string,
  pillarHashings: Record<PillarId, PillarHashing>,
  finalScore: number,
  aggregationMethod: {
    formula: string;
    pillar_weights: Record<PillarId, number>;
    version: string;
  }
): FirmHashing {
  // Step 1: Extract final hashes from each pillar
  const pillarFinalHashes: Record<PillarId, string> = {} as Record<PillarId, string>;
  
  for (const pillarId in pillarHashings) {
    pillarFinalHashes[pillarId as PillarId] = pillarHashings[pillarId as PillarId].final_hash;
  }
  
  // Step 2: Hash all pillar hashes (order-independent)
  const pillars_hash = hashObject(pillarFinalHashes);
  
  // Step 3: Hash the aggregation methodology
  const aggregation_hash = hashObject({
    formula: aggregationMethod.formula,
    pillar_weights: aggregationMethod.pillar_weights,
    version: aggregationMethod.version,
  });
  
  // Step 4: Final firm hash
  const final_score_hash = hashObject({
    firm_id: firmId,
    pillars_hash,
    aggregation_hash,
    final_score: finalScore,
  });
  
  return {
    firm_id: firmId,
    pillars_hash,
    aggregation_hash,
    final_score_hash,
    pillar_hashing: pillarHashings,
  };
}

// =====================================================
// DATASET-LEVEL HASHING
// =====================================================

/**
 * Generate multi-level hashing for entire dataset
 * 
 * Combines all firm hashes into:
 * 1. dataset_hash - Hash of all firm final hashes
 * 2. merkle_root - Merkle tree root (see merkle-tree.ts)
 * 
 * @param firmHashings - Hashing objects for all firms
 * @param datasetTimestamp - Snapshot timestamp
 * @param merkleRoot - Merkle tree root (computed separately)
 * @param merkleProofs - Optional Merkle proofs for each firm
 * @returns MultiLevelHashing object
 */
export function hashDataset(
  firmHashings: Record<string, FirmHashing>,
  datasetTimestamp: string,
  merkleRoot?: string,
  merkleProofs?: Record<string, { firm_id: string; proof: string[]; index: number }>
): MultiLevelHashing {
  // Extract firm hashes
  const firmIds = Object.keys(firmHashings).sort(); // Sort for determinism
  const firmFinalHashes: Record<string, string> = {};
  
  for (const firmId of firmIds) {
    firmFinalHashes[firmId] = firmHashings[firmId].final_score_hash;
  }
  
  // Dataset hash: hash of all firm hashes
  const dataset_hash = hashArray(Object.values(firmFinalHashes));
  
  // Calculate Merkle tree height
  const totalFirms = firmIds.length;
  const treeHeight = Math.ceil(Math.log2(totalFirms)) + 1;
  
  return {
    dataset_timestamp: datasetTimestamp,
    dataset_hash,
    firm_hashes: firmHashings,
    merkle_root: merkleRoot || dataset_hash, // Use dataset_hash if no Merkle tree
    merkle_proofs: merkleProofs,
    metadata: {
      algorithm: 'sha256',
      total_firms: totalFirms,
      tree_height: treeHeight,
      created_at: new Date().toISOString(),
    },
  };
}

// =====================================================
// VERIFICATION FUNCTIONS
// =====================================================

/**
 * Verify evidence hash
 * @param evidence - Evidence item
 * @param claimedHash - Hash to verify against
 * @returns True if hash matches
 */
export function verifyEvidenceHash(
  evidence: InstitutionalEvidenceItem,
  claimedHash: string
): boolean {
  const computedHash = hashEvidence(evidence);
  return computedHash === claimedHash;
}

/**
 * Verify pillar hash
 * @param pillarHashing - Pillar hashing object
 * @returns True if all internal hashes are consistent
 */
export function verifyPillarHash(pillarHashing: PillarHashing): boolean {
  // Verify evidence list hash
  const sortedHashes = Object.keys(pillarHashing.evidence_hashes)
    .sort()
    .map((id) => pillarHashing.evidence_hashes[id]);
  
  const recomputedEvidenceListHash = hashArray(sortedHashes);
  
  if (recomputedEvidenceListHash !== pillarHashing.evidence_list_hash) {
    return false;
  }
  
  // Note: Cannot verify computation_hash or final_hash without original data
  // This only verifies internal consistency of evidence hashes
  return true;
}

/**
 * Verify firm hash chain
 * @param firmHashing - Firm hashing object
 * @returns True if hash chain is consistent
 */
export function verifyFirmHash(firmHashing: FirmHashing): boolean {
  // Verify pillars hash
  const pillarFinalHashes: Record<PillarId, string> = {} as Record<PillarId, string>;
  
  for (const pillarId in firmHashing.pillar_hashing) {
    pillarFinalHashes[pillarId as PillarId] = 
      firmHashing.pillar_hashing[pillarId as PillarId].final_hash;
  }
  
  const recomputedPillarsHash = hashObject(pillarFinalHashes);
  
  return recomputedPillarsHash === firmHashing.pillars_hash;
}

/**
 * Verify dataset hash
 * @param multiLevelHashing - Dataset hashing object
 * @returns True if dataset hash is consistent
 */
export function verifyDatasetHash(multiLevelHashing: MultiLevelHashing): boolean {
  const firmFinalHashes = Object.keys(multiLevelHashing.firm_hashes)
    .sort()
    .map((firmId) => multiLevelHashing.firm_hashes[firmId].final_score_hash);
  
  const recomputedDatasetHash = hashArray(firmFinalHashes);
  
  return recomputedDatasetHash === multiLevelHashing.dataset_hash;
}

// =====================================================
// SNAPSHOT HASHING (for immutability)
// =====================================================

/**
 * Hash a complete snapshot for immutability
 * Used for blockchain-style chaining
 * 
 * @param snapshot - Snapshot data
 * @returns SHA-256 hash
 */
export function hashSnapshot(snapshot: {
  snapshot_id: string;
  firm_id: string;
  firm_name: string;
  score: number;
  pillar_scores: Record<PillarId, number>;
  timestamp: string;
  specification_version: string;
  evidence_count: number;
  firm_hashing: FirmHashing;
}): string {
  return hashObject({
    snapshot_id: snapshot.snapshot_id,
    firm_id: snapshot.firm_id,
    score: snapshot.score,
    pillar_scores: snapshot.pillar_scores,
    timestamp: snapshot.timestamp,
    specification_version: snapshot.specification_version,
    evidence_count: snapshot.evidence_count,
    firm_hashing_hash: snapshot.firm_hashing.final_score_hash,
  });
}

/**
 * Verify snapshot chain (blockchain-style)
 * 
 * @param currentSnapshot - Current snapshot
 * @param previousSnapshot - Previous snapshot in chain
 * @returns True if chain is valid
 */
export function verifySnapshotChain(
  currentSnapshot: {
    snapshot_hash: string;
    previous_snapshot_hash: string | null;
  },
  previousSnapshot?: {
    snapshot_hash: string;
  }
): boolean {
  if (!currentSnapshot.previous_snapshot_hash) {
    // First snapshot (genesis block)
    return true;
  }
  
  if (!previousSnapshot) {
    // Previous snapshot required but not provided
    return false;
  }
  
  // Verify link
  return currentSnapshot.previous_snapshot_hash === previousSnapshot.snapshot_hash;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Generate a unique deterministic hash from multiple inputs
 * Useful for composite keys
 * 
 * @param inputs - Array of strings or objects
 * @returns SHA-256 hash
 */
export function hashComposite(...inputs: (string | object)[]): string {
  return hashArray(inputs);
}

/**
 * Truncate hash for display (first 8 characters)
 * For logging/debugging only - NEVER use truncated hashes for verification
 * 
 * @param hash - Full 64-character hash
 * @returns First 8 characters
 */
export function truncateHash(hash: string): string {
  return hash.substring(0, 8);
}

/**
 * Validate hash format (64 hex characters)
 * 
 * @param hash - Hash to validate
 * @returns True if valid SHA-256 hash format
 */
export function isValidHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/.test(hash);
}

// =====================================================
// EXAMPLE USAGE (for documentation)
// =====================================================

/**
 * Example: Complete hashing workflow for a firm
 * 
 * ```typescript
 * // 1. Hash individual evidence items
 * const evidenceHashes = evidenceItems.map(hashEvidence);
 * 
 * // 2. Hash each pillar
 * const pillarHashings = {};
 * for (const pillarId of PILLARS) {
 *   const pillarEvidence = evidenceItems.filter(e => e.pillar_id === pillarId);
 *   pillarHashings[pillarId] = hashPillar(
 *     pillarId,
 *     pillarEvidence,
 *     pillarScore[pillarId],
 *     scoringRules[pillarId]
 *   );
 * }
 * 
 * // 3. Hash the firm
 * const firmHashing = hashFirm(
 *   firmId,
 *   pillarHashings,
 *   finalScore,
 *   aggregationMethod
 * );
 * 
 * // 4. Hash the dataset (all firms)
 * const datasetHashing = hashDataset(
 *   allFirmHashings,
 *   timestamp,
 *   merkleRoot
 * );
 * 
 * // 5. Verify integrity
 * const isValid = verifyDatasetHash(datasetHashing);
 * ```
 */
