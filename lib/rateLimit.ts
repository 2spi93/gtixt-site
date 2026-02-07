import type { NextApiRequest, NextApiResponse } from "next";

type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyPrefix?: string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

function getClientKey(req: NextApiRequest, prefix: string) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
  return `${prefix}:${ip}`;
}

export function rateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  options: RateLimitOptions
): boolean {
  const { windowMs, max, keyPrefix = "api" } = options;
  const key = getClientKey(req, keyPrefix);
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= max) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({
      success: false,
      error: "Too many requests. Please retry shortly.",
    });
    return false;
  }

  entry.count += 1;
  store.set(key, entry);
  return true;
}
