import * as crypto from "crypto";
import { NextApiRequest, NextApiResponse } from "next";
import { getPool } from "./internal-db";

export type UserRole = "reviewer" | "lead_reviewer" | "auditor" | "admin";

export interface AuthUser {
  id: number;
  username: string;
  email: string | null;
  role: UserRole;
  active: boolean;
}

export interface PasswordPolicy {
  minLength: number;
  requireUpper: boolean;
  requireLower: boolean;
  requireNumber: boolean;
  requireSymbol: boolean;
}

const DEFAULT_SESSION_TTL_HOURS = 24;
const DEFAULT_PASSWORD_MIN_LENGTH = 12;
const DEFAULT_PASSWORD_ROTATION_DAYS = 0;
const DEFAULT_PASSWORD_ROTATION_REQUIRE_INITIAL = false;

/**
 * Hash password with SHA256 (simple, upgrade to bcrypt for production)
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return value === "1" || value.toLowerCase() === "true" || value.toLowerCase() === "yes";
}

export function getSessionTtlHours(): number {
  const hours = parseNumber(process.env.INTERNAL_SESSION_TTL_HOURS, DEFAULT_SESSION_TTL_HOURS);
  return Math.min(Math.max(hours, 1), 168);
}

export function getPasswordPolicy(): PasswordPolicy {
  return {
    minLength: Math.max(8, parseNumber(process.env.INTERNAL_PASSWORD_MIN_LENGTH, DEFAULT_PASSWORD_MIN_LENGTH)),
    requireUpper: parseBoolean(process.env.INTERNAL_PASSWORD_REQUIRE_UPPER, true),
    requireLower: parseBoolean(process.env.INTERNAL_PASSWORD_REQUIRE_LOWER, true),
    requireNumber: parseBoolean(process.env.INTERNAL_PASSWORD_REQUIRE_NUMBER, true),
    requireSymbol: parseBoolean(process.env.INTERNAL_PASSWORD_REQUIRE_SYMBOL, false),
  };
}

export function validatePasswordPolicy(password: string): string[] {
  const policy = getPasswordPolicy();
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters.`);
  }
  if (policy.requireUpper && !/[A-Z]/.test(password)) {
    errors.push("Password must include an uppercase letter.");
  }
  if (policy.requireLower && !/[a-z]/.test(password)) {
    errors.push("Password must include a lowercase letter.");
  }
  if (policy.requireNumber && !/[0-9]/.test(password)) {
    errors.push("Password must include a number.");
  }
  if (policy.requireSymbol && !/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must include a symbol.");
  }

  return errors;
}

export function getPasswordRotationDays(): number {
  return Math.max(0, parseNumber(process.env.INTERNAL_PASSWORD_ROTATION_DAYS, DEFAULT_PASSWORD_ROTATION_DAYS));
}

export function getPasswordRotationRequireInitial(): boolean {
  return parseBoolean(
    process.env.INTERNAL_PASSWORD_ROTATION_REQUIRE_INITIAL,
    DEFAULT_PASSWORD_ROTATION_REQUIRE_INITIAL
  );
}

/**
 * Generate session token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Verify user credentials
 */
export async function verifyCredentials(
  username: string,
  password: string
): Promise<AuthUser | null> {
  const dbPool = getPool();
  if (!dbPool) return null;

  const passwordHash = hashPassword(password);
  const result = await dbPool.query(
    `SELECT id, username, email, role, active FROM internal_users WHERE username = $1 AND password_hash = $2 AND active = TRUE`,
    [username, passwordHash]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0] as AuthUser;
}

/**
 * Create user session
 */
export async function createSession(
  userId: number,
  ipAddress: string | null,
  userAgent: string | null
): Promise<string> {
  const dbPool = getPool();
  if (!dbPool) throw new Error("Database not configured");

  const token = generateToken();
  const ttlHours = getSessionTtlHours();
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  await dbPool.query(
    `INSERT INTO internal_sessions (user_id, token, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)`,
    [userId, token, expiresAt, ipAddress, userAgent]
  );

  return token;
}

export async function deleteSession(token: string): Promise<void> {
  const dbPool = getPool();
  if (!dbPool) return;
  await dbPool.query(`DELETE FROM internal_sessions WHERE token = $1`, [token]);
}

/**
 * Get user from session token
 */
export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  const dbPool = getPool();
  if (!dbPool) return null;

  const result = await dbPool.query(
    `
    SELECT u.id, u.username, u.email, u.role, u.active
    FROM internal_users u
    JOIN internal_sessions s ON s.user_id = u.id
    WHERE s.token = $1 AND s.expires_at > NOW() AND u.active = TRUE
    `,
    [token]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0] as AuthUser;
}

export async function getLastPasswordChange(userId: number): Promise<Date | null> {
  const dbPool = getPool();
  if (!dbPool) return null;

  const result = await dbPool.query(
    `SELECT MAX(occurred_at) AS last_change
     FROM internal_access_log
     WHERE user_id = $1 AND action = 'password_change'`,
    [userId]
  );

  const value = result.rows[0]?.last_change;
  return value ? new Date(value) : null;
}

export async function getPasswordExpiryStatus(userId: number): Promise<{
  expired: boolean;
  rotationDays: number;
  daysSinceChange: number | null;
  daysRemaining: number | null;
}> {
  const rotationDays = getPasswordRotationDays();
  if (rotationDays <= 0) {
    return { expired: false, rotationDays, daysSinceChange: null, daysRemaining: null };
  }

  const lastChange = await getLastPasswordChange(userId);
  if (!lastChange) {
    const requireInitial = getPasswordRotationRequireInitial();
    return { expired: requireInitial, rotationDays, daysSinceChange: null, daysRemaining: null };
  }

  const now = Date.now();
  const daysSince = Math.floor((now - lastChange.getTime()) / (24 * 60 * 60 * 1000));
  const daysRemaining = rotationDays - daysSince;

  return {
    expired: daysRemaining <= 0,
    rotationDays,
    daysSinceChange: daysSince,
    daysRemaining,
  };
}

/**
 * Log access for audit trail
 */
export async function logAccess(
  userId: number | null,
  action: string,
  resource: string | null,
  details: any,
  ipAddress: string | null
): Promise<void> {
  const dbPool = getPool();
  if (!dbPool) return;

  await dbPool.query(
    `INSERT INTO internal_access_log (user_id, action, resource, details, ip_address) VALUES ($1, $2, $3, $4, $5)`,
    [userId, action, resource, details ? JSON.stringify(details) : null, ipAddress]
  );
}

/**
 * Middleware: require authentication
 */
export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthUser | null> {
  const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies.auth_token;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const user = await getUserFromToken(token);
  if (!user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }

  return user;
}

/**
 * Middleware: require specific role(s)
 */
export async function requireRole(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedRoles: UserRole[]
): Promise<AuthUser | null> {
  const user = await requireAuth(req, res);
  if (!user) return null;

  if (!allowedRoles.includes(user.role)) {
    res.status(403).json({ error: "Forbidden: insufficient permissions" });
    return null;
  }

  return user;
}

/**
 * Get client IP address
 */
export function getClientIp(req: NextApiRequest): string | null {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    (req.headers["x-real-ip"] as string) ||
    req.socket.remoteAddress ||
    null
  );
}
