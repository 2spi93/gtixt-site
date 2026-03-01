import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth, verifyTotpCode, enableTotp, generateRecoveryCodes, logAccess, getClientIp } from "../../../../lib/internal-auth";

/**
 * POST /api/internal/auth/enable-2fa/
 * Verify TOTP code and enable 2FA
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ error: "TOTP code required" });
  }

  try {
    const verified = await verifyTotpCode(user.id, code);
    if (!verified) {
      return res.status(401).json({ error: "Invalid TOTP code" });
    }

    await enableTotp(user.id);
    const backupCodes = await generateRecoveryCodes(user.id);
    await logAccess(user.id, "2fa_enabled", null, null, getClientIp(req));

    return res.status(200).json({ success: true, backup_codes: backupCodes });
  } catch (error: any) {
    console.error("Enable 2FA error:", error);
    return res.status(500).json({ error: "Failed to enable 2FA" });
  }
}
