import type { NextApiRequest, NextApiResponse } from "next";
import * as crypto from "crypto";
import { getPool } from "../../../../lib/internal-db";
import nodemailer from "nodemailer";

/**
 * POST /api/internal/auth/forgot-password/
 * Send password reset email with token
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const dbPool = getPool();
    if (!dbPool) {
      return res.status(500).json({ error: "Database not configured" });
    }

    // Check if user exists
    const result = await dbPool.query(
      `SELECT id, username, email FROM internal_users WHERE email = $1 AND active = TRUE`,
      [email]
    );

    // Always return success even if email doesn't exist (security best practice)
    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: "If that email exists, a reset link has been sent",
      });
    }

    const user = result.rows[0];

    // Generate reset token (32 bytes = 64 hex chars)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store hashed token in DB
    await dbPool.query(
      `UPDATE internal_users 
       SET password_reset_token = $1, 
           password_reset_expires = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [hashedToken, expiresAt, user.id]
    );

    // Send email with reset link
    const resetUrl = `https://admin.gtixt.com/admin/reset-password?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "contact@gtixt.com",
      to: email,
      subject: "GTIXT Admin - Password Reset Request",
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.username},</p>
        <p>You requested a password reset for your GTIXT admin account.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 30 minutes.</p>
        <p>If you didn't request this reset, please ignore this email.</p>
        <hr>
        <p><small>GTIXT Admin Console</small></p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "If that email exists, a reset link has been sent",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ error: "Failed to process request" });
  }
}
