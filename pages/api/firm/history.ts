import type { NextApiRequest, NextApiResponse } from "next";

interface HistoryPoint {
  date: string;
  score?: number;
  confidence?: string;
  status?: string;
  percentile_overall?: number;
  pillar_scores?: Record<string, number>;
  snapshot_id?: string;
}

interface TrajectoryPoint {
  date: string;
  score?: number;
  min_score?: number;
  max_score?: number;
  count?: number;
}

interface ApiResponse {
  history?: HistoryPoint[];
  trajectory?: TrajectoryPoint[];
  firmId?: string;
  recordCount?: number;
  error?: string;
}

// Mock data for demonstration (production would use real DB)
const MOCK_HISTORY: Record<string, HistoryPoint[]> = {
  "topstepclient": [
    { date: "2025-11-15", score: 72, confidence: "medium", status: "candidate", snapshot_id: "20251115T000000Z_all" },
    { date: "2025-12-01", score: 75, confidence: "medium", status: "candidate", snapshot_id: "20251201T000000Z_all" },
    { date: "2025-12-15", score: 79, confidence: "high", status: "candidate", snapshot_id: "20251215T000000Z_all" },
    { date: "2026-01-02", score: 85, confidence: "high", status: "ranked", snapshot_id: "20260102T000000Z_all" },
    { date: "2026-01-20", score: 89, confidence: "high", status: "ranked", snapshot_id: "20260120T000000Z_all" },
    { date: "2026-02-01", score: 91, confidence: "high", status: "ranked", snapshot_id: "20260201T000000Z_all" },
  ],
  "maven": [
    { date: "2025-12-01", score: 76, confidence: "high", status: "candidate", snapshot_id: "20251201T000000Z_all" },
    { date: "2026-01-02", score: 82, confidence: "high", status: "ranked", snapshot_id: "20260102T000000Z_all" },
    { date: "2026-02-01", score: 87, confidence: "high", status: "ranked", snapshot_id: "20260201T000000Z_all" },
  ],
  "luxtrading": [
    { date: "2026-01-02", score: 91, confidence: "high", status: "candidate", snapshot_id: "20260102T000000Z_all" },
    { date: "2026-02-01", score: 87, confidence: "high", status: "candidate", snapshot_id: "20260201T000000Z_all" },
  ],
};

const normalizeFirmId = (id: string): string =>
  id
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { id, name, type = "history", days = "90" } = req.query;

  // Validate parameters
  if (!id && !name) {
    return res.status(400).json({ error: "Missing id or name parameter" });
  }

  try {
    const firmId = (id as string) || (name as string);
    const normalizedId = normalizeFirmId(firmId);
    const requestType = (type as string).toLowerCase();
    const dayLimit = Math.min(Math.max(parseInt(days as string) || 90, 1), 365);

    // Get mock data (production: fetch from firm_snapshots table)
    let historyData = MOCK_HISTORY[normalizedId] || [];

    // Filter by days if needed
    if (requestType === "trajectory" || dayLimit < 365) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - dayLimit);
      historyData = historyData.filter((h) => new Date(h.date) >= cutoffDate);
    }

    if (historyData.length === 0) {
      // Return empty trajectory
      if (requestType === "trajectory") {
        return res.status(200).json({
          firmId,
          trajectory: [],
          recordCount: 0,
        });
      }

      // Return empty history
      return res.status(200).json({
        firmId,
        history: [],
        recordCount: 0,
      });
    }

    // Return trajectory view (aggregated by date)
    if (requestType === "trajectory") {
      const trajectory: TrajectoryPoint[] = historyData.map((h) => ({
        date: h.date,
        score: h.score,
      }));

      return res.status(200).json({
        firmId,
        trajectory,
        recordCount: trajectory.length,
      });
    }

    // Return full history
    return res.status(200).json({
      firmId,
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
