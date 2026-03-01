import type { NextApiRequest, NextApiResponse } from "next";
import { getPool } from "../../../../lib/internal-db";
import { requireRole, logAccess, getClientIp } from "../../../../lib/internal-auth";

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
      SELECT
        arq.*,
        f.website_root,
        f.jurisdiction,
        f.jurisdiction_tier,
        f.logo_url
      FROM asic_review_queue arq
      LEFT JOIN firms f ON f.firm_id = arq.firm_id
      WHERE arq.id = $1
      `,
      [reviewId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Review candidate not found" });
    }

    await logAccess(user.id, "view_candidate", `review_${reviewId}`, null, getClientIp(req));

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error("Review candidate error:", error);
    res.status(500).json({ error: "Failed to load candidate" });
  }
}
