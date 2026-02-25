/**
 * GTIXT Merkle Tree Implementation
 * 
 * Efficient cryptographic verification of large datasets using Merkle trees.
 * Allows verification of a single firm's inclusion without downloading entire dataset.
 * 
 * Features:
 * - Build Merkle tree from firm hashes
 * - Generate Merkle proofs for individual firms
 * - Verify proofs efficiently
 * - Support for unbalanced trees (any number of leaves)
 * 
 * @module lib/merkle-tree
 * @version 1.0.0
 */

import { sha256, hashArray } from './hashing-utils';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

/**
 * Merkle tree node
 */
interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  isLeaf: boolean;
  leafIndex?: number; // For leaf nodes, index in original array
}

/**
 * Merkle tree structure
 */
export interface MerkleTree {
  root: MerkleNode;
  leaves: MerkleNode[];
  height: number;
  leafCount: number;
}

/**
 * Merkle proof for a single leaf
 */
export interface MerkleProof {
  leaf: string; // Hash of the leaf
  leafIndex: number;
  proof: Array<{
    hash: string;
    position: 'left' | 'right';
  }>;
  root: string;
}

/**
 * Proof verification result
 */
export interface ProofVerificationResult {
  valid: boolean;
  computedRoot: string;
  expectedRoot: string;
  message: string;
}

// =====================================================
// MERKLE TREE CONSTRUCTION
// =====================================================

/**
 * Build a Merkle tree from an array of hashes
 * 
 * @param hashes - Array of leaf hashes (firm final hashes)
 * @returns Merkle tree structure
 */
export function buildMerkleTree(hashes: string[]): MerkleTree {
  if (hashes.length === 0) {
    throw new Error('Cannot build Merkle tree from empty array');
  }
  
  // Create leaf nodes
  const leaves: MerkleNode[] = hashes.map((hash, index) => ({
    hash,
    isLeaf: true,
    leafIndex: index,
  }));
  
  // Build tree bottom-up
  const root = buildTreeRecursive(leaves);
  
  // Calculate height
  const height = calculateTreeHeight(leaves.length);
  
  return {
    root,
    leaves,
    height,
    leafCount: leaves.length,
  };
}

/**
 * Recursively build Merkle tree
 * @param nodes - Current level nodes
 * @returns Root node
 */
function buildTreeRecursive(nodes: MerkleNode[]): MerkleNode {
  // Base case: single node is the root
  if (nodes.length === 1) {
    return nodes[0];
  }
  
  const parentNodes: MerkleNode[] = [];
  
  // Pair up nodes and create parents
  for (let i = 0; i < nodes.length; i += 2) {
    const left = nodes[i];
    const right = i + 1 < nodes.length ? nodes[i + 1] : left; // Duplicate last node if odd
    
    // Parent hash = hash(left || right)
    const parentHash = hashPair(left.hash, right.hash);
    
    const parent: MerkleNode = {
      hash: parentHash,
      left,
      right: right !== left ? right : undefined, // Don't store duplicate
      isLeaf: false,
    };
    
    parentNodes.push(parent);
  }
  
  // Recurse with parent level
  return buildTreeRecursive(parentNodes);
}

/**
 * Hash two nodes together (order-sensitive)
 * @param leftHash - Left node hash
 * @param rightHash - Right node hash
 * @returns Combined hash
 */
function hashPair(leftHash: string, rightHash: string): string {
  // Concatenate with separator to prevent collision attacks
  return sha256(leftHash + '|' + rightHash);
}

/**
 * Calculate tree height
 * @param leafCount - Number of leaves
 * @returns Tree height (levels from root to leaves, inclusive)
 */
function calculateTreeHeight(leafCount: number): number {
  if (leafCount === 0) return 0;
  if (leafCount === 1) return 1;
  return Math.ceil(Math.log2(leafCount)) + 1;
}

// =====================================================
// MERKLE PROOF GENERATION
// =====================================================

/**
 * Generate Merkle proof for a specific leaf
 * 
 * @param tree - Merkle tree
 * @param leafIndex - Index of leaf to prove
 * @returns Merkle proof
 */
export function generateMerkleProof(tree: MerkleTree, leafIndex: number): MerkleProof {
  if (leafIndex < 0 || leafIndex >= tree.leaves.length) {
    throw new Error(`Invalid leaf index: ${leafIndex} (tree has ${tree.leaves.length} leaves)`);
  }
  
  const leaf = tree.leaves[leafIndex];
  const proof: MerkleProof['proof'] = [];
  
  // Collect sibling hashes from leaf to root
  collectProofNodes(tree.root, leafIndex, tree.leaves.length, proof);
  
  return {
    leaf: leaf.hash,
    leafIndex,
    proof,
    root: tree.root.hash,
  };
}

/**
 * Recursively collect proof nodes
 * @param node - Current node
 * @param targetIndex - Index of target leaf
 * @param totalLeaves - Total number of leaves
 * @param proof - Accumulator for proof nodes
 */
function collectProofNodes(
  node: MerkleNode,
  targetIndex: number,
  totalLeaves: number,
  proof: MerkleProof['proof']
): void {
  if (node.isLeaf) {
    // Reached target leaf
    return;
  }
  
  const left = node.left!;
  const right = node.right || left; // Handle duplicated node
  
  // Calculate which subtree contains target
  const leftLeafCount = getLeafCount(left, totalLeaves);
  const targetInLeft = targetIndex < leftLeafCount;
  
  if (targetInLeft) {
    // Target is in left subtree, add right sibling to proof
    if (node.right) {
      proof.push({
        hash: right.hash,
        position: 'right',
      });
    }
    collectProofNodes(left, targetIndex, leftLeafCount, proof);
  } else {
    // Target is in right subtree, add left sibling to proof
    proof.push({
      hash: left.hash,
      position: 'left',
    });
    collectProofNodes(right, targetIndex - leftLeafCount, totalLeaves - leftLeafCount, proof);
  }
}

/**
 * Get leaf count for a subtree
 * @param node - Subtree root
 * @param totalLeaves - Total leaves in tree
 * @returns Leaf count
 */
function getLeafCount(node: MerkleNode, totalLeaves: number): number {
  if (node.isLeaf) return 1;
  
  // For balanced trees, use power of 2
  // For unbalanced trees, this is approximate but works for proof generation
  let count = 1;
  let temp = node;
  
  while (temp.left) {
    count *= 2;
    temp = temp.left;
  }
  
  return Math.min(count, totalLeaves);
}

// =====================================================
// MERKLE PROOF VERIFICATION
// =====================================================

/**
 * Verify a Merkle proof
 * 
 * @param proof - Merkle proof to verify
 * @returns Verification result with details
 */
export function verifyMerkleProof(proof: MerkleProof): ProofVerificationResult {
  let currentHash = proof.leaf;
  
  // Compute root by combining leaf with siblings in proof
  for (const sibling of proof.proof) {
    if (sibling.position === 'left') {
      // Sibling is on left, current hash on right
      currentHash = hashPair(sibling.hash, currentHash);
    } else {
      // Sibling is on right, current hash on left
      currentHash = hashPair(currentHash, sibling.hash);
    }
  }
  
  const valid = currentHash === proof.root;
  
  return {
    valid,
    computedRoot: currentHash,
    expectedRoot: proof.root,
    message: valid
      ? 'Proof is valid - leaf is in tree'
      : `Proof is invalid - computed root ${currentHash.substring(0, 8)}... does not match expected root ${proof.root.substring(0, 8)}...`,
  };
}

/**
 * Simplified verification (returns boolean only)
 * 
 * @param leafHash - Hash of the leaf
 * @param proof - Sibling hashes
 * @param root - Expected root hash
 * @returns True if proof is valid
 */
export function verifyProof(
  leafHash: string,
  proof: Array<{ hash: string; position: 'left' | 'right' }>,
  root: string
): boolean {
  const fullProof: MerkleProof = {
    leaf: leafHash,
    leafIndex: 0, // Not needed for verification
    proof,
    root,
  };
  
  const result = verifyMerkleProof(fullProof);
  return result.valid;
}

// =====================================================
// BULK OPERATIONS
// =====================================================

/**
 * Generate proofs for all leaves in a tree
 * 
 * @param tree - Merkle tree
 * @returns Map of leaf index to proof
 */
export function generateAllProofs(tree: MerkleTree): Map<number, MerkleProof> {
  const proofs = new Map<number, MerkleProof>();
  
  for (let i = 0; i < tree.leaves.length; i++) {
    proofs.set(i, generateMerkleProof(tree, i));
  }
  
  return proofs;
}

/**
 * Generate proofs for specific firm IDs
 * 
 * @param firmHashes - Map of firm_id to hash
 * @param firmIds - Array of firm IDs to generate proofs for
 * @returns Map of firm_id to proof
 */
export function generateProofsForFirms(
  firmHashes: Map<string, string>,
  firmIds: string[]
): Map<string, MerkleProof> {
  // Build tree from all firm hashes
  const sortedFirmIds = Array.from(firmHashes.keys()).sort();
  const hashes = sortedFirmIds.map((id) => firmHashes.get(id)!);
  
  const tree = buildMerkleTree(hashes);
  const proofs = new Map<string, MerkleProof>();
  
  // Generate proofs for requested firms
  for (const firmId of firmIds) {
    const index = sortedFirmIds.indexOf(firmId);
    if (index >= 0) {
      proofs.set(firmId, generateMerkleProof(tree, index));
    }
  }
  
  return proofs;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Get tree statistics
 * 
 * @param tree - Merkle tree
 * @returns Tree statistics
 */
export function getTreeStats(tree: MerkleTree): {
  leafCount: number;
  height: number;
  nodeCount: number;
  rootHash: string;
} {
  return {
    leafCount: tree.leafCount,
    height: tree.height,
    nodeCount: countNodes(tree.root),
    rootHash: tree.root.hash,
  };
}

/**
 * Count total nodes in a tree
 * @param node - Root node
 * @returns Total node count
 */
function countNodes(node: MerkleNode): number {
  if (node.isLeaf) return 1;
  
  let count = 1; // Current node
  if (node.left) count += countNodes(node.left);
  if (node.right && node.right !== node.left) count += countNodes(node.right);
  
  return count;
}

/**
 * Convert Merkle proof to compact string representation
 * For storage or transmission
 * 
 * @param proof - Merkle proof
 * @returns Compact string (JSON)
 */
export function serializeProof(proof: MerkleProof): string {
  return JSON.stringify({
    l: proof.leaf,
    i: proof.leafIndex,
    p: proof.proof.map((p) => ({ h: p.hash, pos: p.position === 'left' ? 'L' : 'R' })),
    r: proof.root,
  });
}

/**
 * Parse compact proof representation
 * 
 * @param serialized - Compact proof string
 * @returns Merkle proof
 */
export function deserializeProof(serialized: string): MerkleProof {
  const compact = JSON.parse(serialized);
  
  return {
    leaf: compact.l,
    leafIndex: compact.i,
    proof: compact.p.map((p: any) => ({
      hash: p.h,
      position: p.pos === 'L' ? ('left' as const) : ('right' as const),
    })),
    root: compact.r,
  };
}

/**
 * Visualize Merkle tree (text-based)
 * For debugging purposes
 * 
 * @param tree - Merkle tree
 * @returns Text representation
 */
export function visualizeTree(tree: MerkleTree): string {
  const lines: string[] = [];
  lines.push(`Merkle Tree (${tree.leafCount} leaves, height ${tree.height})`);
  lines.push(`Root: ${tree.root.hash.substring(0, 16)}...`);
  lines.push('');
  
  visualizeNode(tree.root, '', lines, tree.leaves.length);
  
  return lines.join('\n');
}

/**
 * Recursively visualize tree nodes
 */
function visualizeNode(
  node: MerkleNode,
  prefix: string,
  lines: string[],
  totalLeaves: number,
  isLast: boolean = true
): void {
  const connector = isLast ? '└─ ' : '├─ ';
  const hash = node.hash.substring(0, 12) + '...';
  const label = node.isLeaf ? `Leaf ${node.leafIndex}` : 'Node';
  
  lines.push(`${prefix}${connector}${label}: ${hash}`);
  
  if (!node.isLeaf) {
    const newPrefix = prefix + (isLast ? '   ' : '│  ');
    
    if (node.left) {
      visualizeNode(node.left, newPrefix, lines, totalLeaves, !node.right || node.right === node.left);
    }
    if (node.right && node.right !== node.left) {
      visualizeNode(node.right, newPrefix, lines, totalLeaves, true);
    }
  }
}

// =====================================================
// EXAMPLE USAGE
// =====================================================

/**
 * Example: Complete Merkle tree workflow
 * 
 * ```typescript
 * // 1. Build tree from firm hashes
 * const firmHashes = [
 *   'abc123...',  // Jane Street
 *   'def456...',  // Optiver
 *   'ghi789...',  // Citadel Securities
 *   // ... more firms
 * ];
 * 
 * const tree = buildMerkleTree(firmHashes);
 * console.log(`Merkle root: ${tree.root.hash}`);
 * 
 * // 2. Generate proof for specific firm (e.g., Jane Street at index 0)
 * const proof = generateMerkleProof(tree, 0);
 * 
 * // 3. Verify proof
 * const verification = verifyMerkleProof(proof);
 * console.log(verification.message); // "Proof is valid - leaf is in tree"
 * 
 * // 4. Serialize proof for storage
 * const serialized = serializeProof(proof);
 * 
 * // 5. Later, deserialize and verify again
 * const restoredProof = deserializeProof(serialized);
 * const stillValid = verifyMerkleProof(restoredProof);
 * ```
 */

/**
 * Example: Using Merkle proofs for API responses
 * 
 * ```typescript
 * // API endpoint: GET /api/firms/jane_street/snapshot
 * async function getSnapshotWithProof(firmId: string) {
 *   // Get snapshot data
 *   const snapshot = await db.getSnapshot(firmId);
 *   
 *   // Get current Merkle tree
 *   const tree = await db.getLatestMerkleTree();
 *   const firmIndex = await db.getFirmIndex(firmId);
 *   
 *   // Generate proof
 *   const proof = generateMerkleProof(tree, firmIndex);
 *   
 *   return {
 *     snapshot,
 *     verification: {
 *       merkle_proof: proof,
 *       dataset_root: tree.root.hash,
 *       instructions: 'Use verifyMerkleProof() to verify this snapshot is in the official dataset'
 *     }
 *   };
 * }
 * ```
 */
