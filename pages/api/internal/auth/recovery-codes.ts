import type { NextApiRequest, NextApiResponse } from "next";
import {
  requireAuth,
  getTotpStatus,
  verifyTotpCode,
  consumeRecoveryCode,
  generateRecoveryCodes,
  getRecoveryCodeStats,
  logAccess,
  getClientIp,
} from "../../../../lib/internal-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (req.method === "GET") {
    const stats = await getRecoveryCodeStats(user.id);
    return res.status(200).json({ success: true, ...stats });
  }

  if (req.method === "POST") {
    const { code } = req.body || {};
    const totpStatus = await getTotpStatus(user.id);

    if (totpStatus.enabled) {
      if (!code) {
        return res.status(400).json({ error: "TOTP/recovery code required" });
      }

      const isTotp = await verifyTotpCode(user.id, code);
      if (!isTotp) {
        const isRecovery = await consumeRecoveryCode(user.id, code);
        if (!isRecovery) {
          return res.status(401).json({ error: "Invalid TOTP/recovery code" });
        }
      }
    }

    const backupCodes = await generateRecoveryCodes(user.id);
    await logAccess(user.id, "recovery_codes_regenerated", null, null, getClientIp(req));

    return res.status(200).json({ success: true, backup_codes: backupCodes });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
