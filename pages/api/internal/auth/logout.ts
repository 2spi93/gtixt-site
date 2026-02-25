import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth, logAccess, getClientIp } from "../../../../lib/internal-auth";
import { getPool } from "../../../../lib/internal-db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies.auth_token;
  const dbPool = getPool();

  if (dbPool && token) {
    await dbPool.query(`DELETE FROM internal_sessions WHERE token = $1`, [token]);
  }

  await logAccess(user.id, "logout", null, null, getClientIp(req));

  res.status(200).json({ success: true });
}
