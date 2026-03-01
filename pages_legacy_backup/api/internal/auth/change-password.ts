import type { NextApiRequest, NextApiResponse } from "next";
import {
  requireAuth,
  hashPassword,
  validatePasswordPolicy,
  createSession,
  getClientIp,
  logAccess,
} from "../../../../lib/internal-auth";
import { getPool } from "../../../../lib/internal-db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  const { current_password, new_password, target_user_id } = req.body || {};

  if (!new_password) {
    return res.status(400).json({ error: "New password required" });
  }

  const policyErrors = validatePasswordPolicy(new_password);
  if (policyErrors.length > 0) {
    return res.status(400).json({ error: "Password policy failed", details: policyErrors });
  }

  const dbPool = getPool();
  if (!dbPool) return res.status(503).json({ error: "Database not configured" });

  const targetUserId = typeof target_user_id === "number" ? target_user_id : user.id;

  if (targetUserId !== user.id && user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (targetUserId === user.id) {
    if (!current_password) {
      return res.status(400).json({ error: "Current password required" });
    }

    const currentResult = await dbPool.query(
      `SELECT password_hash FROM internal_users WHERE id = $1 AND active = TRUE`,
      [user.id]
    );

    const currentHash = currentResult.rows[0]?.password_hash;
    if (!currentHash || currentHash !== hashPassword(current_password)) {
      return res.status(401).json({ error: "Invalid current password" });
    }
  }

  const newHash = hashPassword(new_password);

  await dbPool.query(
    `UPDATE internal_users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [newHash, targetUserId]
  );

  await dbPool.query(`DELETE FROM internal_sessions WHERE user_id = $1`, [targetUserId]);

  await logAccess(
    user.id,
    "password_change",
    null,
    { target_user_id: targetUserId, self: targetUserId === user.id },
    getClientIp(req)
  );

  if (targetUserId === user.id) {
    const token = await createSession(user.id, getClientIp(req), req.headers["user-agent"] || null);
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  }

  return res.status(200).json({ success: true });
}
