import type { NextApiRequest, NextApiResponse } from "next";
import { getPool } from "../../../../../lib/internal-db";
import { requireRole, logAccess, getClientIp, type UserRole } from "../../../../../lib/internal-auth";

const allowedActions = ["approve", "reject", "comment", "escalate", "note", "set_status"] as const;
type ReviewAction = typeof allowedActions[number];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const requiresLeadRole = ["escalate", "set_status"];
  const action = req.body?.action as ReviewAction | undefined;
  const allowedRoles: UserRole[] = action && requiresLeadRole.includes(action)
    ? ["lead_reviewer", "admin"]
    : ["reviewer", "lead_reviewer", "admin"];

  const user = await requireRole(req, res, allowedRoles);
  if (!user) return;

  const dbPool = getPool();
  if (!dbPool) {
    return res.status(503).json({ error: "Database not configured" });
  }

  const reviewId = req.query.id ? Number(req.query.id) : NaN;
  if (Number.isNaN(reviewId)) {
    return res.status(400).json({ error: "Invalid review id" });
  }

  if (!action || !allowedActions.includes(action)) {
    return res.status(400).json({ error: "Invalid action" });
  }

  const reviewer = user.username;
  const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : "";
  const proofUrls = Array.isArray(req.body?.proof_urls) ? req.body.proof_urls : [];
  const status = typeof req.body?.status === "string" ? req.body.status : "";

  try {
    if (action === "approve" || action === "reject" || action === "escalate") {
      const nextStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "escalated";
      await dbPool.query(
        `
        UPDATE asic_review_queue
        SET review_status = $1,
            reviewed_by = $2,
            reviewed_at = NOW(),
            reviewer_notes = $3,
            verification_method = 'manual_ui'
        WHERE id = $4
        `,
        [nextStatus, reviewer, notes || null, reviewId]
      );

      await dbPool.query(
        `
        INSERT INTO asic_verification_audit
          (review_queue_id, action, details, triggered_by)
        VALUES ($1, $2, $3, $4)
        `,
        [
          reviewId,
          action === "approve" ? "review_approved" : action === "reject" ? "review_rejected" : "review_escalated",
          {
            notes: notes || null,
            proof_urls: proofUrls,
          },
          reviewer,
        ]
      );
    }

    if (action === "comment" || action === "note") {
      await dbPool.query(
        `
        INSERT INTO asic_verification_audit
          (review_queue_id, action, details, triggered_by)
        VALUES ($1, $2, $3, $4)
        `,
        [reviewId, action === "comment" ? "comment" : "note", { notes: notes || null }, reviewer]
      );
    }

    if (action === "set_status") {
      if (!status) {
        return res.status(400).json({ error: "status required" });
      }
      await dbPool.query(
        `UPDATE asic_review_queue SET review_status = $1, updated_at = NOW() WHERE id = $2`,
        [status, reviewId]
      );
    }

    await logAccess(user.id, `review_${action}`, `review_${reviewId}`, { action, notes }, getClientIp(req));

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Review action error:", error);
    res.status(500).json({ error: "Failed to update review" });
  }
}
