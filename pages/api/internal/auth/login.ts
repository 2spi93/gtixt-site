import type { NextApiRequest, NextApiResponse } from "next";
import {
  verifyCredentials,
  createSession,
  logAccess,
  getClientIp,
  getPasswordExpiryStatus,
  getTotpStatus,
  verifyTotpCode,
} from "../../../../lib/internal-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password, totp } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  const user = await verifyCredentials(username, password);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Check if TOTP is required
  const totp_status = await getTotpStatus(user.id);
  if (totp_status.enabled && !totp) {
    // TOTP required but not provided - return temp secret to generate QR on client
    return res.status(200).json({
      success: false,
      totp_required: true,
      message: "Please provide TOTP code",
    });
  }

  // Verify TOTP if enabled
  if (totp_status.enabled && totp) {
    const verified = await verifyTotpCode(user.id, totp);
    if (!verified) {
      return res.status(401).json({ error: "Invalid TOTP code" });
    }
  }

  const ipAddress = getClientIp(req);
  const userAgent = req.headers["user-agent"] || null;
  const token = await createSession(user.id, ipAddress, userAgent);
  const passwordExpiry = await getPasswordExpiryStatus(user.id);

  await logAccess(user.id, "login", null, { username, totp_used: totp_status.enabled }, ipAddress);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    password_expired: passwordExpiry.expired,
    password_rotation_days: passwordExpiry.rotationDays,
    password_days_remaining: passwordExpiry.daysRemaining,
    totp_enabled: totp_status.enabled,
  });
}
