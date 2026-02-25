import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth, disableTotp, logAccess, getClientIp } from "../../../../lib/internal-auth";

/**
 * POST /api/internal/auth/disable-2fa/
 * Disable TOTP 2FA
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    await disableTotp(user.id);
    await logAccess(user.id, "2fa_disabled", null, null, getClientIp(req));

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Disable 2FA error:", error);
    return res.status(500).json({ error: "Failed to disable 2FA" });
  }
}
