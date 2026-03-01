import type { NextApiRequest, NextApiResponse } from "next";
import {
  requireRole,
  hashPassword,
  validatePasswordPolicy,
  logAccess,
  getClientIp,
} from "../../../../lib/internal-auth";
import { getPool } from "../../../../lib/internal-db";

const ALLOWED_ROLES = ["reviewer", "lead_reviewer", "auditor", "admin"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireRole(req, res, ["admin"]);
  if (!user) return;

  const dbPool = getPool();
  if (!dbPool) return res.status(503).json({ error: "Database not configured" });

  const id = Number(req.query.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  if (req.method === "PATCH") {
    const { role, active } = req.body || {};

    if (role && !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const updates: string[] = [];
    const values: Array<string | number | boolean> = [];

    if (role) {
      values.push(role);
      updates.push(`role = $${values.length}`);
    }
    if (typeof active === "boolean") {
      values.push(active);
      updates.push(`active = $${values.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No updates provided" });
    }

    values.push(id);

    await dbPool.query(
      `UPDATE internal_users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${values.length}`,
      values
    );

    await logAccess(user.id, "update_user", null, { target_user_id: id, role, active }, getClientIp(req));

    return res.status(200).json({ success: true });
  }

  if (req.method === "POST") {
    const { new_password } = req.body || {};

    if (!new_password) {
      return res.status(400).json({ error: "New password required" });
    }

    const policyErrors = validatePasswordPolicy(new_password);
    if (policyErrors.length > 0) {
      return res.status(400).json({ error: "Password policy failed", details: policyErrors });
    }

    const newHash = hashPassword(new_password);

    await dbPool.query(
      `UPDATE internal_users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newHash, id]
    );

    await dbPool.query(`DELETE FROM internal_sessions WHERE user_id = $1`, [id]);
    await logAccess(user.id, "reset_password", null, { target_user_id: id }, getClientIp(req));

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
