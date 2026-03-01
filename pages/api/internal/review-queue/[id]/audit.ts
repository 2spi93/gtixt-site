import type { NextApiRequest, NextApiResponse } from "next";
import { getPool } from "../../../../../lib/internal-db";
import { requireRole } from "../../../../../lib/internal-auth";

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

  const reviewId = req.query.id ? Number(req.query.id) : NaN;
  if (Number.isNaN(reviewId)) {
    return res.status(400).json({ error: "Invalid review id" });
  }

  try {
    const result = await dbPool.query(
      `
      SELECT id, action, details, triggered_by, occurred_at
      FROM asic_verification_audit
      WHERE review_queue_id = $1
      ORDER BY occurred_at DESC
      `,
      [reviewId]
    );

    res.status(200).json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error("Review audit error:", error);
    res.status(500).json({ error: "Failed to load audit trail" });
  }
}
