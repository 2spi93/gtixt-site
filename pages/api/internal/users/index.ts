import type { NextApiRequest, NextApiResponse } from "next";
import { requireRole, hashPassword, validatePasswordPolicy, logAccess, getClientIp } from "../../../../lib/internal-auth";
import { getPool } from "../../../../lib/internal-db";

const ALLOWED_ROLES = ["reviewer", "lead_reviewer", "auditor", "admin"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireRole(req, res, ["admin"]);
  if (!user) return;

  const dbPool = getPool();
  if (!dbPool) return res.status(503).json({ error: "Database not configured" });

  if (req.method === "GET") {
    const result = await dbPool.query(
      `SELECT
         u.id,
         u.username,
         u.email,
         u.role,
         u.active,
         u.created_at,
         u.updated_at,
         (
           SELECT MAX(occurred_at)
           FROM internal_access_log al
           WHERE al.user_id = u.id AND al.action = 'password_change'
         ) AS last_password_change
       FROM internal_users u
       ORDER BY u.created_at DESC`
    );

    await logAccess(user.id, "list_users", null, null, getClientIp(req));

    return res.status(200).json({ success: true, data: result.rows });
  }

  if (req.method === "POST") {
    const { username, email, role, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    if (role && !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const policyErrors = validatePasswordPolicy(password);
    if (policyErrors.length > 0) {
      return res.status(400).json({ error: "Password policy failed", details: policyErrors });
    }

    const passwordHash = hashPassword(password);

    try {
      const insert = await dbPool.query(
        `INSERT INTO internal_users (username, email, password_hash, role, active)
         VALUES ($1, $2, $3, $4, TRUE)
         RETURNING id, username, email, role, active, created_at, updated_at`,
        [username, email || null, passwordHash, role || "reviewer"]
      );

      await logAccess(user.id, "create_user", null, { username }, getClientIp(req));

      return res.status(201).json({ success: true, data: insert.rows[0] });
    } catch (error: any) {
      return res.status(400).json({ error: error?.message || "Failed to create user" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
