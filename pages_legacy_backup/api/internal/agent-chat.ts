import type { NextApiRequest, NextApiResponse } from "next";
import { getPool } from "../../../lib/internal-db";
import { requireRole, logAccess, getClientIp } from "../../../lib/internal-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireRole(req, res, ["reviewer", "lead_reviewer", "admin"]);
  if (!user) return;

  const dbPool = getPool();
  if (!dbPool) {
    return res.status(503).json({ error: "Database not configured" });
  }

  const reviewId = req.body?.review_id ? Number(req.body.review_id) : NaN;
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";

  if (Number.isNaN(reviewId) || !message) {
    return res.status(400).json({ error: "review_id and message required" });
  }

  try {
    const reviewResult = await dbPool.query(
      `SELECT firm_name, afs_name, fuzzy_score, review_status FROM asic_review_queue WHERE id = $1`,
      [reviewId]
    );

    if (!reviewResult.rows.length) {
      return res.status(404).json({ error: "Review not found" });
    }

    const candidate = reviewResult.rows[0];
    const score = Number(candidate.fuzzy_score || 0);
    const status = candidate.review_status || "pending";

    const suggestions: string[] = [];
    if (score >= 0.88) {
      suggestions.push("Verifier le nom legal exact et la coherence ABN/ACN.");
    } else if (score >= 0.84) {
      suggestions.push("Exiger une preuve reglementaire avant approbation.");
    } else {
      suggestions.push("Verifier le site officiel et rechercher des preuves externes.");
    }

    if (status === "pending") {
      suggestions.push("Confirmer le statut AFS avant decision finale.");
    }

    const reply = `Analyse rapide pour ${candidate.firm_name}: score ${score.toFixed(2)}. ` +
      `Correspondance AFS: ${candidate.afs_name}. ` +
      `Recommandation: ${suggestions.join(" ")}`;

    await dbPool.query(
      `INSERT INTO asic_verification_audit (review_queue_id, action, details, triggered_by) VALUES ($1, $2, $3, $4)`,
      [reviewId, "chat_message", { message }, user.username]
    );
    await dbPool.query(
      `INSERT INTO asic_verification_audit (review_queue_id, action, details, triggered_by) VALUES ($1, $2, $3, $4)`,
      [reviewId, "chat_reply", { reply, suggestions }, "review_agent"]
    );

    await logAccess(user.id, "agent_chat", `review_${reviewId}`, { message }, getClientIp(req));

    res.status(200).json({ success: true, data: { reply, suggestions } });
  } catch (error: any) {
    console.error("Agent chat error:", error);
    res.status(500).json({ error: "Failed to process chat" });
  }
}
