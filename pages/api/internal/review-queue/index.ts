import type { NextApiRequest, NextApiResponse } from "next";
import { getPool } from "../../../../lib/internal-db";
import { requireRole, logAccess, getClientIp } from "../../../../lib/internal-auth";

interface ReviewQueueRow {
  id: number;
  firm_id: string;
  firm_name: string;
  afs_name: string;
  fuzzy_score: string;
  review_status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  website_root: string | null;
  jurisdiction: string | null;
  jurisdiction_tier: string | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireRole(req, res, ["reviewer", "lead_reviewer", "auditor", "admin"]);
  if (!user) return;

  const dbPool = getPool();
  if (!dbPool) {
    return res.status(503).json({ error: "Database not configured" });
  }

  const status = typeof req.query.status === "string" ? req.query.status : "all";
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const jurisdiction = typeof req.query.jurisdiction === "string" ? req.query.jurisdiction : "";
  const minScore = req.query.minScore ? Number(req.query.minScore) : undefined;
  const maxScore = req.query.maxScore ? Number(req.query.maxScore) : undefined;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const offset = Number(req.query.offset) || 0;

  const filters: string[] = [];
  const values: Array<string | number> = [];

  if (status && status !== "all") {
    values.push(status);
    filters.push(`arq.review_status = $${values.length}`);
  }

  if (!Number.isNaN(minScore) && minScore !== undefined) {
    values.push(minScore);
    filters.push(`arq.fuzzy_score >= $${values.length}`);
  }

  if (!Number.isNaN(maxScore) && maxScore !== undefined) {
    values.push(maxScore);
    filters.push(`arq.fuzzy_score <= $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    const idx = values.length;
    filters.push(`(
      arq.firm_name ILIKE $${idx}
      OR arq.afs_name ILIKE $${idx}
      OR arq.firm_id ILIKE $${idx}
      OR f.website_root ILIKE $${idx}
    )`);
  }

  if (jurisdiction) {
    values.push(jurisdiction);
    filters.push(`f.jurisdiction = $${values.length}`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  try {
    const listQuery = `
      SELECT
        arq.id,
        arq.firm_id,
        arq.firm_name,
        arq.afs_name,
        arq.fuzzy_score,
        arq.review_status,
        arq.reviewed_by,
        arq.reviewed_at,
        arq.created_at,
        f.website_root,
        f.jurisdiction,
        f.jurisdiction_tier
      FROM asic_review_queue arq
      LEFT JOIN firms f ON f.firm_id = arq.firm_id
      ${whereClause}
      ORDER BY arq.fuzzy_score DESC, arq.created_at DESC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    const listValues = [...values, limit, offset];
    const listResult = await (dbPool.query(listQuery, listValues) as Promise<{ rows: ReviewQueueRow[] }>);

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM asic_review_queue arq
      LEFT JOIN firms f ON f.firm_id = arq.firm_id
      ${whereClause}
    `;
    const countResult = await dbPool.query(countQuery, values);

    const pendingResult = await dbPool.query(
      `SELECT COUNT(*) AS pending FROM asic_review_queue WHERE review_status = 'pending'`
    );
    const avgResult = await dbPool.query(
      `SELECT AVG(fuzzy_score)::float AS avg_score FROM asic_review_queue`
    );

    await logAccess(user.id, "view_review_queue", null, { filters: { status, search, jurisdiction } }, getClientIp(req));

    res.status(200).json({
      success: true,
      data: listResult.rows,
      meta: {
        total: Number(countResult.rows[0]?.total || 0),
        pending: Number(pendingResult.rows[0]?.pending || 0),
        avgScore: Number(avgResult.rows[0]?.avg_score || 0),
        limit,
        offset,
      },
    });
  } catch (error: any) {
    console.error("Review queue list error:", error);
    res.status(500).json({ error: "Failed to load review queue" });
  }
}
