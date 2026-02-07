// API Route: /api/validation/metrics
// Purpose: Validation framework metrics dashboard
// Updated: 2026-02-01
// Phase: 1 (Validation Framework)

import type { NextApiRequest, NextApiResponse } from "next";
import { Pool } from "pg";

interface ValidationMetrics {
  snapshot_id: string;
  timestamp: string;
  source: string;
  coverage: {
    total_firms: number;
    coverage_percent: number;
    avg_na_rate: number;
    agent_c_pass_rate: number;
    by_jurisdiction: {
      jurisdiction: string;
      count: number;
      avg_na_rate: number;
    }[];
  };
  stability: {
    avg_score_change: number;
    median_score_change: number;
    max_score_change: number;
    top_10_turnover: number;
    top_20_turnover: number;
    firms_with_major_changes: number;
  };
  ground_truth: {
    events_in_period: number;
    events_predicted: number;
    prediction_precision: number;
    recent_events: {
      firm_id: string;
      event_type: string;
      event_date: string;
      expected_impact: number;
    }[];
  };
  calibration: {
    avg_confidence: number;
    high_confidence_count: number;
    medium_confidence_count: number;
    low_confidence_count: number;
    confidence_accuracy: number;
  };
  sensitivity: {
    avg_score: number;
    median_score: number;
    std_dev: number;
    score_distribution: {
      range: string;
      count: number;
    }[];
  };
  auditability: {
    total_evidence_items: number;
    verified_evidence_percent: number;
    avg_evidence_per_firm: number;
    stale_evidence_count: number;
  };
  alerts?: string[];
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ValidationMetrics | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const dbPool = getPool();
    if (!dbPool) {
      return res.status(503).json({ error: "Database not configured for validation metrics" });
    }

    const metricsResult = await dbPool.query(
      "SELECT * FROM validation_metrics ORDER BY timestamp DESC LIMIT 1"
    );

    if (!metricsResult.rows.length) {
      return res.status(404).json({ error: "No validation metrics found" });
    }

    const latest = metricsResult.rows[0];
    const snapshotId = String(latest.snapshot_id);

    const scoreStatsResult = await dbPool.query(
      `SELECT
        COUNT(*) AS firm_count,
        AVG(score_0_100) AS avg_score,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY score_0_100) AS median_score,
        STDDEV_POP(score_0_100) AS std_dev,
        AVG(na_rate) AS avg_na_rate
      FROM snapshot_scores
      WHERE snapshot_key = $1`,
      [snapshotId]
    );

    const scoreDistributionResult = await dbPool.query(
      `SELECT
        SUM(CASE WHEN score_0_100 <= 20 THEN 1 ELSE 0 END) AS range_0_20,
        SUM(CASE WHEN score_0_100 > 20 AND score_0_100 <= 40 THEN 1 ELSE 0 END) AS range_21_40,
        SUM(CASE WHEN score_0_100 > 40 AND score_0_100 <= 60 THEN 1 ELSE 0 END) AS range_41_60,
        SUM(CASE WHEN score_0_100 > 60 AND score_0_100 <= 80 THEN 1 ELSE 0 END) AS range_61_80,
        SUM(CASE WHEN score_0_100 > 80 THEN 1 ELSE 0 END) AS range_81_100
      FROM snapshot_scores
      WHERE snapshot_key = $1`,
      [snapshotId]
    );

    const confidenceResult = await dbPool.query(
      `SELECT
        SUM(CASE WHEN confidence = 'high' THEN 1 ELSE 0 END) AS high,
        SUM(CASE WHEN confidence = 'medium' THEN 1 ELSE 0 END) AS medium,
        SUM(CASE WHEN confidence = 'low' THEN 1 ELSE 0 END) AS low
      FROM snapshot_scores
      WHERE snapshot_key = $1`,
      [snapshotId]
    );

    const jurisdictionResult = await dbPool.query(
      `SELECT
        COALESCE(f.jurisdiction_tier, 'UNKNOWN') AS jurisdiction,
        COUNT(*) AS count,
        AVG(COALESCE(ss.na_rate, 0)) AS avg_na_rate
      FROM snapshot_scores ss
      LEFT JOIN firms f ON ss.firm_id = f.firm_id
      WHERE ss.snapshot_key = $1
      GROUP BY COALESCE(f.jurisdiction_tier, 'UNKNOWN')
      ORDER BY count DESC`,
      [snapshotId]
    );

    const recentEventsResult = await dbPool.query(
      `SELECT firm_id, event_type, event_date, expected_score_impact
       FROM ground_truth_events
       ORDER BY event_date DESC
       LIMIT 5`
    );

    const evidenceResult = await dbPool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN is_verified THEN 1 ELSE 0 END) AS verified,
        SUM(CASE WHEN is_stale THEN 1 ELSE 0 END) AS stale
      FROM evidence_collection`
    );

    const alertsResult = await dbPool.query(
      `SELECT message
       FROM validation_alerts
       WHERE snapshot_id = $1
       ORDER BY created_at DESC`,
      [snapshotId]
    );

    const toNumber = (value: unknown, fallback = 0): number => {
      if (value === null || value === undefined) return fallback;
      const num = Number(value);
      return Number.isNaN(num) ? fallback : num;
    };

    const scoreStats = scoreStatsResult.rows[0] || {};
    const scoreDistributionRow = scoreDistributionResult.rows[0] || {};
    const confidenceRow = confidenceResult.rows[0] || {};
    const evidenceRow = evidenceResult.rows[0] || {};

    const totalFirms = toNumber(latest.total_firms, toNumber(scoreStats.firm_count));
    const avgNaRate = toNumber(latest.avg_na_rate, toNumber(scoreStats.avg_na_rate));
    const coveragePercent = toNumber(
      latest.coverage_percent,
      totalFirms > 0 ? Math.round((1 - avgNaRate / 100) * 100) : 0
    );

    const confidenceHigh = toNumber(confidenceRow.high);
    const confidenceMedium = toNumber(confidenceRow.medium);
    const confidenceLow = toNumber(confidenceRow.low);
    const confidenceTotal = confidenceHigh + confidenceMedium + confidenceLow;
    const avgConfidence = confidenceTotal
      ? Math.round(((confidenceHigh * 0.9 + confidenceMedium * 0.6 + confidenceLow * 0.3) / confidenceTotal) * 100) / 100
      : 0;

    const verifiedEvidence = toNumber(evidenceRow.verified);
    const totalEvidence = toNumber(evidenceRow.total);
    const verifiedEvidencePercent = totalEvidence
      ? Math.round((verifiedEvidence / totalEvidence) * 100)
      : 0;

    const alerts = alertsResult.rows
      .map((row) => row.message)
      .filter((message: string | null) => Boolean(message)) as string[];

    const metrics: ValidationMetrics = {
      snapshot_id: snapshotId,
      timestamp: latest.timestamp || new Date().toISOString(),
      source: "validation_metrics",
      coverage: {
        total_firms: totalFirms,
        coverage_percent: coveragePercent,
        avg_na_rate: Math.round(avgNaRate * 10) / 10,
        agent_c_pass_rate: toNumber(
          latest.agent_c_pass_rate,
          Math.max(0, 100 - Math.round(avgNaRate))
        ),
        by_jurisdiction: jurisdictionResult.rows.map((row) => ({
          jurisdiction: row.jurisdiction,
          count: toNumber(row.count),
          avg_na_rate: Math.round(toNumber(row.avg_na_rate) * 10) / 10,
        })),
      },
      stability: {
        avg_score_change: toNumber(latest.avg_score_change),
        median_score_change: 0.0,
        max_score_change: 0.0,
        top_10_turnover: toNumber(latest.top_10_turnover),
        top_20_turnover: toNumber(latest.top_20_turnover),
        firms_with_major_changes: 0,
      },
      ground_truth: {
        events_in_period: toNumber(latest.events_in_period),
        events_predicted: toNumber(latest.events_predicted),
        prediction_precision: toNumber(latest.prediction_precision),
        recent_events: recentEventsResult.rows.map((row) => ({
          firm_id: row.firm_id,
          event_type: row.event_type,
          event_date: row.event_date,
          expected_impact: toNumber(row.expected_score_impact),
        })),
      },
      calibration: {
        avg_confidence: avgConfidence,
        high_confidence_count: confidenceHigh,
        medium_confidence_count: confidenceMedium,
        low_confidence_count: confidenceLow,
        confidence_accuracy: 0,
      },
      sensitivity: {
        avg_score: Math.round(toNumber(scoreStats.avg_score) * 10) / 10,
        median_score: toNumber(scoreStats.median_score),
        std_dev: Math.round(toNumber(scoreStats.std_dev) * 100) / 100,
        score_distribution: [
          { range: '0-20', count: toNumber(scoreDistributionRow.range_0_20) },
          { range: '21-40', count: toNumber(scoreDistributionRow.range_21_40) },
          { range: '41-60', count: toNumber(scoreDistributionRow.range_41_60) },
          { range: '61-80', count: toNumber(scoreDistributionRow.range_61_80) },
          { range: '81-100', count: toNumber(scoreDistributionRow.range_81_100) },
        ],
      },
      auditability: {
        total_evidence_items: totalEvidence,
        verified_evidence_percent: verifiedEvidencePercent,
        avg_evidence_per_firm: totalFirms > 0 ? Math.round((totalEvidence / totalFirms) * 100) / 100 : 0,
        stale_evidence_count: toNumber(evidenceRow.stale),
      },
      alerts: alerts.length ? alerts : undefined,
    };

    res.status(200).json(metrics);
  } catch (error) {
    console.error("Validation metrics error:", error);
    res.status(500).json({ error: "Failed to fetch validation metrics" });
  }
}
