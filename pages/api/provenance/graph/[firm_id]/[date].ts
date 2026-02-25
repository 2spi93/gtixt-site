/**
 * GET /api/provenance/graph/[firm_id]/[date]
 * 
 * Get complete provenance graph for a firm on a specific date
 * Shows full data lineage from raw sources to final score
 * 
 * @example
 * GET /api/provenance/graph/jane_street/2025-02-20
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "graph": {
 *       "graph_id": "uuid",
 *       "firm_id": "jane_street",
 *       "snapshot_date": "2025-02-20",
 *       "nodes": [...],
 *       "edges": [...],
 *       "root_nodes": [...],
 *       "final_node": "uuid",
 *       "reproducibility": {...}
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
} from '../../../../../lib/api-middleware';
import type { ApiResponse } from '../../../../../lib/data-models';
import type { ProvenanceGraph } from '../../../../../lib/institutional-data-models';

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
  firm_id: z.string().regex(/^[a-z0-9_]+$/, 'Invalid firm_id format'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)'),
});

const QueryParamsSchema = z.object({
  include_content: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
});

// =====================================================
// HANDLER
// =====================================================

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<{ graph: ProvenanceGraph }>>
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
  
  const { firm_id, date } = pathResult.data;
  const { include_content } = queryParams;
  
  try {
    const dbPool = getPool();
    if (!dbPool) {
      return sendError(res, 'Database not configured for provenance queries', 503);
    }
    const graph = await getProvenanceGraph(dbPool, firm_id, date, include_content);
    
    if (!graph) {
      return sendError(
        res,
        `No provenance graph found for firm ${firm_id} on ${date}`,
        404
      );
    }
    
    return sendSuccess(res, { graph });
  } catch (error) {
    console.error('Error fetching provenance graph:', error);
    
    return sendError(res, 'Failed to fetch provenance graph', 500);
  }
}

// =====================================================
// DATABASE QUERY (PLACEHOLDER)
// =====================================================

async function getProvenanceGraph(
  dbPool: Pool,
  firmId: string,
  date: string,
  includeContent: boolean
): Promise<ProvenanceGraph | null> {
  const result = await dbPool.query(
    `
    SELECT
      graph_id,
      firm_id,
      snapshot_date,
      snapshot_id,
      nodes,
      edges,
      root_nodes,
      final_node,
      reproducibility,
      node_count,
      edge_count,
      graph_depth,
      specification_version,
      code_commit_hash,
      created_at
    FROM provenance_graphs
    WHERE firm_id = $1 AND snapshot_date = $2
    LIMIT 1
    `,
    [firmId, date]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const nodes = Array.isArray(row.nodes) ? row.nodes : [];
  const edges = Array.isArray(row.edges) ? row.edges : [];
  const rootNodes = Array.isArray(row.root_nodes) ? row.root_nodes : [];
  const reproducibility = {
    ...(row.reproducibility || {}),
    specification_version: row.specification_version,
    code_commit_hash: row.code_commit_hash,
  };

  const sanitizedNodes = includeContent
    ? nodes
    : nodes.map((node: any) => ({
        ...node,
        content_ref: undefined,
      }));

  return {
    graph_id: row.graph_id,
    firm_id: row.firm_id,
    snapshot_date: row.snapshot_date,
    nodes: sanitizedNodes,
    edges,
    root_nodes: rootNodes,
    final_node: row.final_node,
    reproducibility,
    metadata: {
      created_at: row.created_at?.toISOString?.() || new Date().toISOString(),
      node_count: Number(row.node_count) || nodes.length,
      edge_count: Number(row.edge_count) || edges.length,
      depth: Number(row.graph_depth) || 0,
    },
  };
}

// Export with validation middleware
export default withValidation(handler);
