import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth, getPasswordExpiryStatus } from "../../../../lib/internal-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  const passwordExpiry = await getPasswordExpiryStatus(user.id);

  res.status(200).json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    password_expired: passwordExpiry.expired,
    password_rotation_days: passwordExpiry.rotationDays,
    password_days_remaining: passwordExpiry.daysRemaining,
  });
}
