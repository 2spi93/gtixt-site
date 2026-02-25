/**
 * API Validation Middleware Helper
 * Provides validation and response standardization utilities
 */

import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { ValidationError } from "./validation-schemas";
import { ApiErrorResponse, ApiResponse, ValidationErrorDetail } from "./data-models";

// ============================================================================
// RESPONSE HELPERS - STANDARDIZE ALL API RESPONSES
// ============================================================================

/**
 * Send standardized success response
 */
export function sendSuccess<T>(
  res: NextApiResponse,
  data: T,
  statusCode = 200,
  message?: string,
) {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      api_version: process.env.NEXT_PUBLIC_API_VERSION || "1.0.0",
      spec_version: process.env.NEXT_PUBLIC_SPEC_VERSION || "1.0.0",
      sdk_version: process.env.NEXT_PUBLIC_SDK_VERSION || "1.0.0",
      timestamp: new Date().toISOString(),
    },
    message,
  };

  res.status(statusCode).json(response);
}

/**
 * Send standardized error response
 */
export function sendError(
  res: NextApiResponse,
  error: string,
  statusCode = 500,
  details?: ValidationErrorDetail[],
) {
  const response: ApiErrorResponse = {
    success: false,
    error,
    code: statusCode,
    details,
  };

  res.status(statusCode).json(response);
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate request data against Zod schema
 * Returns data or sends error response
 */
export async function validateRequest<T>(
  req: NextApiRequest,
  res: NextApiResponse,
  schema: z.ZodSchema,
): Promise<T | null> {
  try {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        value: undefined,
        rule: err.code,
      }));

      sendError(res, "Validation failed", 400, errors);
      return null;
    }

    return result.data as T;
  } catch (error) {
    sendError(res, "Request parsing failed", 400);
    return null;
  }
}

/**
 * Validate query parameters against Zod schema
 */
export async function validateQuery<T>(
  req: NextApiRequest,
  res: NextApiResponse,
  schema: z.ZodSchema,
): Promise<T | null> {
  try {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        value: undefined,
        rule: err.code,
      }));

      sendError(res, "Invalid query parameters", 400, errors);
      return null;
    }

    return result.data as T;
  } catch (error) {
    sendError(res, "Query parsing failed", 400);
    return null;
  }
}

/**
 * Validate path parameters
 */
export function validatePath(
  params: Record<string, string | string[]>,
  rules: Record<string, z.ZodSchema>,
): { valid: boolean; errors: Array<{ field: string; message: string }> } {
  const errors = [];

  for (const [key, schema] of Object.entries(rules)) {
    const value = params[key];
    const result = schema.safeParse(value);

    if (!result.success) {
      errors.push({
        field: key,
        message: result.error.issues[0]?.message || "Invalid",
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// METHOD VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Ensure request uses allowed HTTP method
 */
export function requireMethod(
  req: NextApiRequest,
  res: NextApiResponse,
  ...allowedMethods: string[]
): boolean {
  if (!req.method || !allowedMethods.includes(req.method.toUpperCase())) {
    res.setHeader("Allow", allowedMethods.join(", "));
    sendError(res, `Method ${req.method} not allowed`, 405);
    return false;
  }

  return true;
}

/**
 * Ensure request is GET
 */
export function requireGET(req: NextApiRequest, res: NextApiResponse): boolean {
  return requireMethod(req, res, "GET");
}

/**
 * Ensure request is POST
 */
export function requirePOST(req: NextApiRequest, res: NextApiResponse): boolean {
  return requireMethod(req, res, "POST");
}

/**
 * Ensure request is PUT
 */
export function requirePUT(req: NextApiRequest, res: NextApiResponse): boolean {
  return requireMethod(req, res, "PUT");
}

/**
 * Ensure request is DELETE
 */
export function requireDELETE(req: NextApiRequest, res: NextApiResponse): boolean {
  return requireMethod(req, res, "DELETE");
}

// ============================================================================
// RATE LIMITING HELPERS
// ============================================================================

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple in-memory rate limiter
 * For production, use dedicated service (Redis)
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // New key or window expired
  if (!record || record.resetTime < now) {
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime,
    };
  }

  // Within existing window
  if (record.count < limit) {
    record.count++;
    return {
      allowed: true,
      remaining: limit - record.count,
      resetTime: record.resetTime,
    };
  }

  // Rate limit exceeded
  return {
    allowed: false,
    remaining: 0,
    resetTime: record.resetTime,
  };
}

/**
 * Rate limit middleware with API key support
 */
export function applyRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  requestsPerMinute = 1000,
): boolean {
  // Get rate limit key (API key or IP)
  const apiKey =
    (req.headers["x-api-key"] as string) ||
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    (req.socket?.remoteAddress) ||
    "anonymous";
  const rateLimitKey = `api:${apiKey}`;

  const { allowed, remaining, resetTime } = checkRateLimit(rateLimitKey, requestsPerMinute, 60000);

  // Set rate limit headers
  res.setHeader("X-RateLimit-Limit", requestsPerMinute);
  res.setHeader("X-RateLimit-Remaining", remaining);
  res.setHeader("X-RateLimit-Reset", new Date(resetTime).toISOString());

  if (!allowed) {
    const secondsUntilReset = Math.ceil((resetTime - Date.now()) / 1000);
    res.setHeader("X-RateLimit-Retry-After", secondsUntilReset);
    sendError(res, "Rate limit exceeded", 429, [
      {
        field: "rate_limit",
        message: `Limit: ${requestsPerMinute}/min. Reset in ${secondsUntilReset}s`,
      },
    ]);
    return false;
  }

  return true;
}

// ============================================================================
// CONTENT TYPE VALIDATION
// ============================================================================

/**
 * Ensure request has JSON content type
 */
export function requireJSON(req: NextApiRequest, res: NextApiResponse): boolean {
  const contentType = req.headers["content-type"] || "";

  if (!contentType.includes("application/json")) {
    sendError(res, "Content-Type must be application/json", 400);
    return false;
  }

  return true;
}

// ============================================================================
// HANDLER WRAPPER - COMBINES COMMON CHECKS
// ============================================================================

interface HandlerOptions {
  methods?: string[];
  requireAuth?: boolean;
  rateLimit?: number;
  parseJSON?: boolean;
}

/**
 * Wraps API handler with common validation
 * Usage: export default withValidation(myHandler, { methods: ['GET', 'POST'] })
 */
export function withValidation(
  handler: (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>,
  options: HandlerOptions = {},
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key");

    // Handle OPTIONS requests
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    try {
      // Check method
      if (options.methods && !requireMethod(req, res, ...options.methods)) {
        return;
      }

      // Check authentication (stub - implement per your needs)
      if (options.requireAuth) {
        const apiKey = req.headers["x-api-key"];
        if (!apiKey) {
          sendError(res, "Missing API key", 401);
          return;
        }
      }

      // Check rate limit
      if (options.rateLimit && !applyRateLimit(req, res, options.rateLimit)) {
        return;
      }

      // Check JSON content type for POST/PUT
      if (options.parseJSON && ["POST", "PUT"].includes(req.method || "")) {
        if (!requireJSON(req, res)) {
          return;
        }
      }

      // Call handler
      await handler(req, res);
    } catch (error: unknown) {
      console.error("Handler error:", error);

      const errorMessage = error instanceof Error ? error.message : "Internal server error";
      sendError(res, errorMessage, 500);
    }
  };
}

// ============================================================================
// ERROR RESPONSE UTILITIES
// ============================================================================

/**
 * Create validation error response
 */
export function createValidationErrorResponse(
  errors: z.ZodError,
): Parameters<typeof sendError>[3] {
  return errors.issues.map((err) => ({
    field: err.path.join("."),
    message: err.message,
    value: undefined,
    rule: err.code,
  }));
}

/**
 * Create database error response
 */
export function createDatabaseErrorResponse(fieldName: string) {
  return [
    {
      field: fieldName,
      message: `Database operation failed. Please try again later.`,
      rule: "database_error",
    },
  ];
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

interface RequestLog {
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  apiKey?: string;
}

/**
 * Log API request/response
 */
export function logRequest(
  req: NextApiRequest,
  statusCode: number,
  durationMs: number,
) {
  const log: RequestLog = {
    timestamp: new Date().toISOString(),
    method: req.method || "UNKNOWN",
    path: req.url || "UNKNOWN",
    statusCode,
    duration: durationMs,
    apiKey: (req.headers["x-api-key"] as string)?.substring(0, 8) + "...",
  };

  if (statusCode >= 400) {
    console.warn(`[${statusCode}] ${log.method} ${log.path} (${durationMs}ms)`, log);
  } else {
    console.log(`[${statusCode}] ${log.method} ${log.path} (${durationMs}ms)`);
  }
}

/**
 * Performance-aware handler wrapper
 */
export function withLogging(
  handler: (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>,
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now();

    // Wrap res.end to capture status code
    const originalEnd = res.end;
    res.end = function (...args: unknown[]) {
      const duration = Date.now() - startTime;
      logRequest(req, res.statusCode, duration);
      return originalEnd.apply(res, args);
    };

    await handler(req, res);
  };
}

// ============================================================================
// TYPE-SAFE HANDLER BUILDER
// ============================================================================

/**
 * Type-safe API handler builder
 * Usage:
 * const handler = createHandler<GetFirmRequest, FirmSnapshot>({
 *   GET: async (req, res, data) => { ... }
 * })
 */
export function createHandler<T = unknown, R = unknown>(
  routes: Record<string, (req: NextApiRequest, res: NextApiResponse, data: T) => void | Promise<void>>,
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const method = req.method?.toUpperCase();

    if (!method || !routes[method]) {
      res.setHeader("Allow", Object.keys(routes).join(", "));
      sendError(res, `Method ${method} not allowed`, 405);
      return;
    }

    try {
      await routes[method](req, res, {} as T);
    } catch (error: unknown) {
      console.error("Handler error:", error);
      sendError(res, "Internal server error", 500);
    }
  };
}
