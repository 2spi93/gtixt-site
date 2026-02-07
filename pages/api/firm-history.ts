import type { NextApiRequest, NextApiResponse } from "next";
import { Pool } from "pg";

interface HistoryPoint {
  date: string;
  score?: number;
  confidence?: string;
  status?: string;
  snapshot_id?: string;
}

interface ApiResponse {
  history?: HistoryPoint[];
  firmId?: string;
  recordCount?: number;
  error?: string;
}

let pool: Pool | null = null;
const getDatabaseUrl = (): string | null => {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.password) return null;
  } catch (error) {
    return null;
  }
  return url;
};

const getPool = (): Pool | null => {
  const url = getDatabaseUrl();
  if (!url) return null;
  if (!pool) {
    pool = new Pool({ connectionString: url });
  }
  return pool;
};

const normalizeFirmId = (id: string): string =>
  id
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

const getBaseUrl = (req: NextApiRequest): string => {
  const protoHeader = (req.headers['x-forwarded-proto'] || '').toString();
  const protocol = protoHeader ? protoHeader.split(',')[0] : 'http';
  const host = req.headers.host || 'localhost:3000';
  return `${protocol}://${host}`;
};

const resolveFirmId = async (req: NextApiRequest, queryValue: string): Promise<string> => {
  try {
    const baseUrl = getBaseUrl(req);
    const response = await fetch(`${baseUrl}/api/firm?id=${encodeURIComponent(queryValue)}`, {
      cache: 'no-store',
    });
    if (!response.ok) return queryValue;
    const data = await response.json();
    const firm = data?.firm || data;
    if (firm?.firm_id) return String(firm.firm_id);
  } catch (error) {
    console.warn('[firm-history] Failed to resolve firm_id from /api/firm', error);
  }
  return queryValue;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { id, name, firmId } = req.query;

  const queryValue = (Array.isArray(id) ? id[0] : id) || (Array.isArray(firmId) ? firmId[0] : firmId) || (Array.isArray(name) ? name[0] : name);

  if (!queryValue) {
    return res.status(400).json({ error: "Missing id or name parameter" });
  }

  try {
    const resolvedFirmId = await resolveFirmId(req, queryValue as string);
    const normalizedId = normalizeFirmId(resolvedFirmId);

    const dbPool = getPool();
    if (!dbPool) {
      return res.status(503).json({ error: "Database not configured for firm history" });
    }

    const historyResult = await dbPool.query(
      `SELECT sm.snapshot_key, sm.created_at, ss.score_0_100, ss.confidence
       FROM snapshot_metadata sm
       JOIN snapshot_scores ss ON sm.id = ss.snapshot_id
       WHERE ss.firm_id = $1
       ORDER BY sm.created_at DESC`,
      [resolvedFirmId]
    );

    const historyData = historyResult.rows.map((row) => ({
      date: row.created_at,
      score: Number(row.score_0_100) || 0,
      confidence: row.confidence,
      status: undefined,
      snapshot_id: row.snapshot_key,
    }));

    return res.status(200).json({
      firmId: normalizedId,
      history: historyData,
      recordCount: historyData.length,
    });
  } catch (error) {
    console.error("Error fetching firm history:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
