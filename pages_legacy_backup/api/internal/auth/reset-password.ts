import type { NextApiRequest, NextApiResponse } from "next";
import * as crypto from "crypto";
import { getPool } from "../../../../lib/internal-db";
import { hashPassword, validatePasswordPolicy } from "../../../../lib/internal-auth";

/**
 * POST /api/internal/auth/reset-password/
 * Reset password with token
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token and new password are required" });
  }

  try {
    const dbPool = getPool();
    if (!dbPool) {
      return res.status(500).json({ error: "Database not configured" });
    }

    // Validate password policy
    const policyError = await validatePasswordPolicy(newPassword);
    if (policyError) {
      return res.status(400).json({ error: policyError });
    }

    // Hash the token to match stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid reset token
    const result = await dbPool.query(
      `SELECT id, username, email 
       FROM internal_users 
       WHERE password_reset_token = $1 
         AND password_reset_expires > NOW()
         AND active = TRUE`,
      [hashedToken]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const user = result.rows[0];

    // Hash new password
    const passwordHash = hashPassword(newPassword);

    // Update password and clear reset token
    await dbPool.query(
      `UPDATE internal_users 
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires = NULL,
           password_last_changed = NOW(),
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, user.id]
    );

    // Log the password reset
    await dbPool.query(
      `INSERT INTO internal_access_log (user_id, event_type, metadata)
       VALUES ($1, 'password_reset', $2)`,
      [user.id, JSON.stringify({ method: "reset_link" })]
    );

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return res.status(500).json({ error: "Failed to reset password" });
  }
}
