/**
 * Visitor Tracking Utilities
 * Captures and stores visitor analytics data
 */

import { headers } from "next/headers";
import { randomUUID } from "crypto";

let schemaReady = false;

type DeviceType = "desktop" | "mobile" | "tablet" | "bot" | "unknown";

interface EnrichedVisitorData {
  country?: string;
  city?: string;
  region?: string;
  org_name?: string;
  asn?: string;
  as_name?: string;
  is_institutional?: boolean;
  visitor_class?: string;
  device_type?: DeviceType;
  browser?: string;
  os?: string;
}

// Bot detection patterns
const BOT_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /slotovod/i,
  /naver/i,
  /pingdom/i,
  /uptime/i,
  /monitoring/i,
  /httpclient/i,
  /curl/i,
  /wget/i,
  /python/i,
  /scrapy/i,
  /crawl/i,
  /spider/i,
  /robot/i,
];

interface VisitorData {
  ip_address: string;
  user_agent: string;
  path: string;
  referer?: string;
  is_bot: boolean;
  bot_type?: string;
  session_id: string;
  status_code?: number;
  response_time_ms?: number;
  country?: string;
  city?: string;
  region?: string;
  org_name?: string;
  asn?: string;
  as_name?: string;
  is_institutional?: boolean;
  visitor_class?: string;
  device_type?: DeviceType;
  browser?: string;
  os?: string;
}

function isPrivateOrLocalIp(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "0.0.0.0" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)
  );
}

function parseUserAgent(userAgent: string, isBot: boolean): Pick<EnrichedVisitorData, "device_type" | "browser" | "os"> {
  const ua = userAgent.toLowerCase();

  let deviceType: DeviceType = "unknown";
  if (isBot) {
    deviceType = "bot";
  } else if (/tablet|ipad/.test(ua)) {
    deviceType = "tablet";
  } else if (/mobi|android|iphone/.test(ua)) {
    deviceType = "mobile";
  } else if (ua.length > 0) {
    deviceType = "desktop";
  }

  let browser = "Unknown";
  if (/edg\//.test(ua)) browser = "Edge";
  else if (/chrome\//.test(ua) && !/edg\//.test(ua)) browser = "Chrome";
  else if (/safari\//.test(ua) && !/chrome\//.test(ua)) browser = "Safari";
  else if (/firefox\//.test(ua)) browser = "Firefox";
  else if (/msie|trident/.test(ua)) browser = "IE";

  let os = "Unknown";
  if (/windows/.test(ua)) os = "Windows";
  else if (/mac os|macintosh/.test(ua)) os = "macOS";
  else if (/android/.test(ua)) os = "Android";
  else if (/iphone|ipad|ios/.test(ua)) os = "iOS";
  else if (/linux/.test(ua)) os = "Linux";

  return { device_type: deviceType, browser, os };
}

function classifyOrganization(orgName?: string, asName?: string): { isInstitutional: boolean; visitorClass: string } {
  const source = `${orgName || ""} ${asName || ""}`.toLowerCase();

  if (!source.trim()) {
    return { isInstitutional: false, visitorClass: "unknown" };
  }

  const institutionalKeywords = [
    "bank",
    "capital",
    "asset management",
    "investment",
    "securities",
    "exchange",
    "fund",
    "insurer",
    "insurance",
    "government",
    "ministry",
    "university",
    "research",
    "consulting",
    "bloomberg",
    "reuters",
    "morgan",
    "goldman",
    "blackrock",
    "vanguard",
    "citadel",
    "jpmorgan",
    "ubs",
    "barclays",
    "societe generale",
  ];

  const cloudKeywords = ["amazon", "aws", "google", "microsoft", "cloudflare", "digitalocean", "ovh", "hetzner"];

  const isInstitutional = institutionalKeywords.some((k) => source.includes(k));
  if (isInstitutional) {
    return { isInstitutional: true, visitorClass: "institutional" };
  }

  if (cloudKeywords.some((k) => source.includes(k))) {
    return { isInstitutional: false, visitorClass: "cloud_infra" };
  }

  return { isInstitutional: false, visitorClass: "commercial" };
}

async function lookupGeoAndOrg(ip: string): Promise<EnrichedVisitorData> {
  if (!ip || isPrivateOrLocalIp(ip)) {
    return {};
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city,org,as,asname,query`, {
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timer);

    if (!res.ok) {
      return await lookupGeoFallback(ip);
    }

    const json = (await res.json()) as {
      status?: string;
      country?: string;
      city?: string;
      regionName?: string;
      org?: string;
      as?: string;
      asname?: string;
      asn?: string;
    };

    if (json.status !== "success") {
      return await lookupGeoFallback(ip);
    }

    const orgName = json.org?.slice(0, 255);
    const asn = (json.as || json.asn || undefined)?.slice(0, 32);
    const asName = (json.asname || orgName || undefined)?.slice(0, 255);
    const { isInstitutional, visitorClass } = classifyOrganization(orgName, asName);

    return {
      country: json.country?.slice(0, 120),
      city: json.city?.slice(0, 120),
      region: json.regionName?.slice(0, 120),
      org_name: orgName,
      asn,
      as_name: asName,
      is_institutional: isInstitutional,
      visitor_class: visitorClass,
    };
  } catch {
    return await lookupGeoFallback(ip);
  }
}

async function lookupGeoFallback(ip: string): Promise<EnrichedVisitorData> {
  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return {};
    }

    const json = (await res.json()) as {
      error?: boolean;
      country_name?: string;
      city?: string;
      region?: string;
      org?: string;
      asn?: string;
    };

    if (json.error) {
      return {};
    }

    const orgName = json.org?.slice(0, 255);
    const asn = json.asn?.slice(0, 32);
    const { isInstitutional, visitorClass } = classifyOrganization(orgName, orgName);

    return {
      country: json.country_name?.slice(0, 120),
      city: json.city?.slice(0, 120),
      region: json.region?.slice(0, 120),
      org_name: orgName,
      asn,
      as_name: orgName,
      is_institutional: isInstitutional,
      visitor_class: visitorClass,
    };
  } catch {
    return {};
  }
}

/**
 * Detect if a user agent belongs to a bot
 */
export function detectBot(userAgent: string): { isBot: boolean; botType?: string } {
  for (const pattern of BOT_PATTERNS) {
    const match = userAgent.match(pattern);
    if (match) {
      const botType = match[0].toLowerCase();
      return { isBot: true, botType };
    }
  }
  return { isBot: false };
}

/**
 * Extract client IP from request
 */
export function getClientIP(headersList: Awaited<ReturnType<typeof headers>>): string {
  const forwarded = headersList.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : headersList.get("x-real-ip") || "0.0.0.0";
  return ip;
}

/**
 * Track a visitor - server-side
 */
export async function trackVisitor(
  path: string,
  options: {
    statusCode?: number;
    responseTime?: number;
    sessionId?: string;
  } = {}
): Promise<VisitorData | null> {
  try {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const referer = headersList.get("referer");
    const ip = getClientIP(headersList);
    const sessionId = options.sessionId || generateSessionId();

    const { isBot, botType } = detectBot(userAgent);
    const uaParsed = parseUserAgent(userAgent, isBot);
    const geoAndOrg = await lookupGeoAndOrg(ip);

    const visitorData: VisitorData = {
      ip_address: ip,
      user_agent: userAgent,
      path,
      referer: referer || undefined,
      is_bot: isBot,
      bot_type: botType,
      session_id: sessionId,
      status_code: options.statusCode,
      response_time_ms: options.responseTime,
      country: geoAndOrg.country,
      city: geoAndOrg.city,
      region: geoAndOrg.region,
      org_name: geoAndOrg.org_name,
      asn: geoAndOrg.asn,
      as_name: geoAndOrg.as_name,
      is_institutional: geoAndOrg.is_institutional,
      visitor_class: geoAndOrg.visitor_class,
      device_type: uaParsed.device_type,
      browser: uaParsed.browser,
      os: uaParsed.os,
    };

    // Log to database asynchronously
    await logVisitorToDatabase(visitorData);

    return visitorData;
  } catch (error) {
    console.error("[Visitor Tracking] Error tracking visitor:", error);
    return null;
  }
}

/**
 * Generate session ID for tracking user journeys
 */
export function generateSessionId(): string {
  return randomUUID();
}

/**
 * Log visitor data to database
 */
async function logVisitorToDatabase(data: VisitorData): Promise<void> {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.warn("[Visitor Tracking] DATABASE_URL not set, skipping tracking");
      return;
    }

    const { Client } = await import("pg");
    const client = new Client({ connectionString: databaseUrl });

    await client.connect();

    await ensureVisitorAnalyticsSchema(client);

    const query = `
      INSERT INTO visitor_analytics (
        ip_address,
        user_agent,
        path,
        referer,
        is_bot,
        bot_type,
        session_id,
        status_code,
        response_time_ms,
        country,
        city,
        region,
        org_name,
        asn,
        as_name,
        is_institutional,
        visitor_class,
        device_type,
        browser,
        os
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      ON CONFLICT DO NOTHING
    `;

    await client.query(query, [
      data.ip_address,
      data.user_agent,
      data.path,
      data.referer,
      data.is_bot,
      data.bot_type,
      data.session_id,
      data.status_code,
      data.response_time_ms,
      data.country,
      data.city,
      data.region,
      data.org_name,
      data.asn,
      data.as_name,
      data.is_institutional,
      data.visitor_class,
      data.device_type,
      data.browser,
      data.os,
    ]);

    await client.end();
  } catch (error) {
    console.error("[Visitor Tracking] Error logging to database:", error);
  }
}

/**
 * Get visitor analytics - for admin dashboard
 */
export async function getVisitorAnalytics(
  days: number = 7
): Promise<{
  dailyStats: any[];
  byPath: any[];
  botSummary: any[];
  topCountries: any[];
  topOrganizations: any[];
  totalVisitors: number;
  totalBots: number;
  institutionalVisitors: number;
} | null> {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.warn("[Visitor Tracking] DATABASE_URL not set");
      return null;
    }

    const { Client } = await import("pg");
    const client = new Client({ connectionString: databaseUrl });

    await client.connect();

    await ensureVisitorAnalyticsSchema(client);

    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Daily stats
    const dailyStatsResult = await client.query(
      `SELECT 
        DATE(timestamp) as date,
        COUNT(*) as total_visits,
        COUNT(DISTINCT ip_address) as unique_visitors,
        COUNT(CASE WHEN is_bot THEN 1 END) as bot_visits,
        COUNT(CASE WHEN NOT is_bot THEN 1 END) as human_visits
      FROM visitor_analytics
      WHERE timestamp >= $1
      GROUP BY DATE(timestamp)
      ORDER BY date DESC`,
      [sinceDate]
    );

    // By path
    const byPathResult = await client.query(
      `SELECT 
        path,
        COUNT(*) as total_visits,
        COUNT(DISTINCT ip_address) as unique_visitors,
        COUNT(CASE WHEN is_bot THEN 1 END) as bot_visits
      FROM visitor_analytics
      WHERE timestamp >= $1
      GROUP BY path
      ORDER BY total_visits DESC
      LIMIT 20`,
      [sinceDate]
    );

    // Bot summary
    const botSummaryResult = await client.query(
      `SELECT 
        bot_type,
        COUNT(*) as visits,
        COUNT(DISTINCT ip_address) as unique_bots
      FROM visitor_analytics
      WHERE is_bot = TRUE AND timestamp >= $1
      GROUP BY bot_type
      ORDER BY visits DESC`,
      [sinceDate]
    );

    const topCountriesResult = await client.query(
      `SELECT
        COALESCE(country, 'Unknown') as country,
        COUNT(*) as visits,
        COUNT(DISTINCT ip_address) as unique_visitors
      FROM visitor_analytics
      WHERE timestamp >= $1
      GROUP BY COALESCE(country, 'Unknown')
      ORDER BY visits DESC
      LIMIT 10`,
      [sinceDate]
    );

    const topOrganizationsResult = await client.query(
      `SELECT
        COALESCE(org_name, 'Unknown') as org_name,
        COALESCE(visitor_class, 'unknown') as visitor_class,
        COUNT(*) as visits,
        COUNT(DISTINCT ip_address) as unique_visitors,
        BOOL_OR(COALESCE(is_institutional, FALSE)) as is_institutional
      FROM visitor_analytics
      WHERE timestamp >= $1
      GROUP BY COALESCE(org_name, 'Unknown'), COALESCE(visitor_class, 'unknown')
      ORDER BY visits DESC
      LIMIT 10`,
      [sinceDate]
    );

    // Totals
    const totalsResult = await client.query(
      `SELECT 
        COUNT(*) as total_visitors,
        COUNT(CASE WHEN is_bot THEN 1 END) as total_bots,
        COUNT(CASE WHEN COALESCE(is_institutional, FALSE) THEN 1 END) as institutional_visitors
      FROM (
        SELECT DISTINCT ip_address, is_bot, is_institutional FROM visitor_analytics
        WHERE timestamp >= $1
      ) t`,
      [sinceDate]
    );

    await client.end();

    return {
      dailyStats: dailyStatsResult.rows,
      byPath: byPathResult.rows,
      botSummary: botSummaryResult.rows,
      topCountries: topCountriesResult.rows,
      topOrganizations: topOrganizationsResult.rows,
      totalVisitors: parseInt(totalsResult.rows[0]?.total_visitors || 0),
      totalBots: parseInt(totalsResult.rows[0]?.total_bots || 0),
      institutionalVisitors: parseInt(totalsResult.rows[0]?.institutional_visitors || 0),
    };
  } catch (error) {
    console.error("[Visitor Tracking] Error fetching analytics:", error);
    return null;
  }
}

/**
 * Get recent visitors list
 */
export async function getRecentVisitors(limit: number = 100): Promise<any[] | null> {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return null;

    const { Client } = await import("pg");
    const client = new Client({ connectionString: databaseUrl });

    await client.connect();

    await ensureVisitorAnalyticsSchema(client);

    const result = await client.query(
      `SELECT 
        id,
        ip_address,
        user_agent,
        path,
        country,
        city,
        region,
        org_name,
        asn,
        as_name,
        COALESCE(is_institutional, FALSE) as is_institutional,
        COALESCE(visitor_class, 'unknown') as visitor_class,
        COALESCE(device_type, 'unknown') as device_type,
        COALESCE(browser, 'Unknown') as browser,
        COALESCE(os, 'Unknown') as os,
        is_bot,
        bot_type,
        timestamp,
        status_code
      FROM visitor_analytics
      ORDER BY timestamp DESC
      LIMIT $1`,
      [limit]
    );

    await client.end();
    return result.rows;
  } catch (error) {
    console.error("[Visitor Tracking] Error fetching recent visitors:", error);
    return null;
  }
}

async function ensureVisitorAnalyticsSchema(client: import("pg").Client): Promise<void> {
  if (schemaReady) {
    return;
  }

  await client.query(`
    ALTER TABLE visitor_analytics
    ADD COLUMN IF NOT EXISTS city VARCHAR(120),
    ADD COLUMN IF NOT EXISTS region VARCHAR(120),
    ADD COLUMN IF NOT EXISTS org_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS asn VARCHAR(32),
    ADD COLUMN IF NOT EXISTS as_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_institutional BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS visitor_class VARCHAR(40),
    ADD COLUMN IF NOT EXISTS device_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS browser VARCHAR(64),
    ADD COLUMN IF NOT EXISTS os VARCHAR(64)
  `);

  schemaReady = true;
}
