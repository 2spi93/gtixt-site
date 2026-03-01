import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth, generateTotpSecret, logAccess, getClientIp } from "../../../../lib/internal-auth";

/**
 * POST /api/internal/auth/setup-2fa/
 * Generate TOTP secret + QR code for 2FA setup
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const { secret, qrCode } = await generateTotpSecret(user.id);

    await logAccess(user.id, "setup_2fa_started", null, { secret: secret.substring(0, 6) + "***" }, getClientIp(req));

    return res.status(200).json({
      success: true,
      data: {
        secret,
        qrCode,
      },
    });
  } catch (error: any) {
    console.error("Setup 2FA error:", error);
    return res.status(500).json({ error: "Failed to setup 2FA" });
  }
}
