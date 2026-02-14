// API Route: /api/audit/explain
// Purpose: Audit Trail - Explain score calculation
// Created: 2026-02-01
// Phase: 1 (Validation Framework) - Week 3

import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import { fetchJsonWithFallback, parseFallbackRoots } from '../../../lib/fetchWithFallback';

interface ScoreExplanation {
  firm_id: string;
  firm_name: string;
  score: number;
  snapshot_id: string;
  timestamp: string;
  breakdown: {
    pillar: string;
    score: number;
    weight: number;
    contribution: number;
    metrics: {
      metric_name: string;
      value: any;
      score: number;
      weight: number;
    }[];
  }[];
  evidence_summary: {
    total_evidence_items: number;
    by_type: {
      type: string;
      count: number;
    }[];
    by_agent: {
      agent: string;
      count: number;
    }[];
    recent_evidence: {
      evidence_id: number;
      type: string;
      collected_by: string;
      relevance_score: number;
      collected_at: string;
    }[];
  };
  confidence_factors: {
    factor: string;
    value: string;
    impact: string;
  }[];
  na_rate: number;
  last_updated: string;
}

interface ErrorResponse {
  error: string;
  message?: string;
}

interface EvidenceRow {
  evidence_id: number;
  evidence_type: string;
  collected_by: string;
  relevance_score: number | null;
  collected_at: string;
}

const LATEST_POINTER_URL =
  process.env.SNAPSHOT_LATEST_URL ||
  process.env.NEXT_PUBLIC_LATEST_POINTER_URL ||
  'https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json';

const MINIO_PUBLIC_ROOT =
  process.env.MINIO_INTERNAL_ROOT ||
  process.env.NEXT_PUBLIC_MINIO_PUBLIC_ROOT ||
  'https://data.gtixt.com/gpti-snapshots/';

const FALLBACK_POINTER_URLS = parseFallbackRoots(
  process.env.NEXT_PUBLIC_LATEST_POINTER_FALLBACKS
);

const FALLBACK_MINIO_ROOTS = parseFallbackRoots(
  process.env.NEXT_PUBLIC_MINIO_FALLBACK_ROOTS
);

let pool: Pool | null = null;

const getDatabaseUrl = (): string | null => {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.password) return null;
  } catch {
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
  res: NextApiResponse<ScoreExplanation | ErrorResponse>
) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firm_id } = req.query;

  if (!firm_id || typeof firm_id !== 'string') {
    return res.status(400).json({ 
      error: 'Missing required parameter: firm_id',
      message: 'Usage: /api/audit/explain?firm_id=ftmocom'
    });
  }

  try {
    const pointerUrls = [LATEST_POINTER_URL, ...FALLBACK_POINTER_URLS];
    const { data: latest } = await fetchJsonWithFallback<any>(pointerUrls, { cache: 'no-store' });
    const snapshotRoots = [MINIO_PUBLIC_ROOT, ...FALLBACK_MINIO_ROOTS];
    const snapshotUrlCandidates = snapshotRoots.map((root) => `${root}${latest.object}`);
    const { data: snapshot } = await fetchJsonWithFallback<any>(snapshotUrlCandidates, { cache: 'no-store' });

    const records = snapshot?.records || snapshot?.firms || [];
    if (!Array.isArray(records) || !records.length) {
      return res.status(500).json({ error: 'Failed to load snapshot data' });
    }

    // Find firm in snapshot
    const firmRecord = records.find((r: any) => r.firm_id === firm_id);

    if (!firmRecord) {
      return res.status(404).json({ 
        error: 'Firm not found',
        message: `No data available for firm: ${firm_id}`
      });
    }

    // Get evidence for this firm from database
    const dbPool = getPool();
    if (!dbPool) {
      return res.status(503).json({ error: 'Database not configured for evidence queries' });
    }

    const evidenceResult = await dbPool.query<EvidenceRow>(
      `SELECT evidence_id, evidence_type, collected_by, relevance_score, collected_at
       FROM evidence_collection
       WHERE firm_id = $1
       ORDER BY collected_at DESC
       LIMIT 50`,
      [firm_id]
    );

    const firmEvidence = evidenceResult.rows || [];

    // Build evidence summary
    const evidenceByType = new Map();
    const evidenceByAgent = new Map();

    firmEvidence.forEach((e) => {
      evidenceByType.set(e.evidence_type, (evidenceByType.get(e.evidence_type) || 0) + 1);
      evidenceByAgent.set(e.collected_by, (evidenceByAgent.get(e.collected_by) || 0) + 1);
    });

    // Build score breakdown from pillar scores
    const pillarScores = firmRecord.pillar_scores || {};
    const metricScores = firmRecord.metric_scores || {};
    
    const breakdown = Object.entries(pillarScores).map(([pillar, score]) => {
      // Get metrics for this pillar (simplified - in reality would need pillar-to-metric mapping)
      const pillarMetrics = Object.entries(metricScores)
        .filter(([metricName]) => {
          // Simple heuristic: match metric to pillar by name prefix
          const pillarPrefix = pillar.split('_')[0];
          return metricName.toLowerCase().includes(pillarPrefix.toLowerCase());
        })
        .map(([metricName, metricScore]) => ({
          metric_name: metricName,
          value: firmRecord.detailed_metrics?.[metricName] || 'N/A',
          score: typeof metricScore === 'number' ? metricScore : 0,
          weight: 1.0 / Object.keys(metricScores).length, // Equal weight for simplicity
        }));

      return {
        pillar: pillar,
        score: typeof score === 'number' ? score : 0,
        weight: 1.0 / Object.keys(pillarScores).length, // Equal weight assumption
        contribution: (typeof score === 'number' ? score : 0) * (1.0 / Object.keys(pillarScores).length),
        metrics: pillarMetrics,
      };
    });

    // Build confidence factors
    const confidenceFactors = [
      {
        factor: 'Data Completeness',
        value: `${100 - (firmRecord.na_rate || 0)}%`,
        impact: firmRecord.na_rate <= 25 ? 'Positive' : 'Negative',
      },
      {
        factor: 'Evidence Quality',
        value: `${firmEvidence.length} items`,
        impact: firmEvidence.length >= 3 ? 'Positive' : 'Neutral',
      },
      {
        factor: 'Source Reliability',
        value: firmRecord.confidence || 'medium',
        impact: firmRecord.confidence === 'high' ? 'Positive' : 'Neutral',
      },
      {
        factor: 'Historical Consistency',
        value: firmRecord.detailed_metrics?.historical_consistency || 'N/A',
        impact: 'Neutral',
      },
      {
        factor: 'Jurisdiction Verification',
        value: firmRecord.jurisdiction_tier || 'UNKNOWN',
        impact: ['A', 'B'].includes(firmRecord.jurisdiction_tier) ? 'Positive' : 'Neutral',
      },
    ];

    // Build response
    const explanation: ScoreExplanation = {
      firm_id: firmRecord.firm_id,
      firm_name: firmRecord.name,
      score: firmRecord.score_0_100,
      snapshot_id: snapshot.metadata?.version || snapshot.snapshot_id || 'unknown',
      timestamp: snapshot.metadata?.generated_at || snapshot.generated_at || new Date().toISOString(),
      breakdown: breakdown,
      evidence_summary: {
        total_evidence_items: firmEvidence.length,
        by_type: Array.from(evidenceByType.entries()).map(([type, count]) => ({
          type,
          count: count as number,
        })),
        by_agent: Array.from(evidenceByAgent.entries()).map(([agent, count]) => ({
          agent,
          count: count as number,
        })),
        recent_evidence: firmEvidence.slice(0, 5).map((item) => ({
          evidence_id: item.evidence_id,
          type: item.evidence_type,
          collected_by: item.collected_by,
          relevance_score: item.relevance_score ?? 0,
          collected_at: item.collected_at,
        })),
      },
      confidence_factors: confidenceFactors,
      na_rate: firmRecord.na_rate || 0,
      last_updated: snapshot.metadata?.generated_at || snapshot.generated_at || new Date().toISOString(),
    };

    return res.status(200).json(explanation);

    // TODO: Replace with actual database queries
    // const evidence = await db.query(
    //   'SELECT * FROM evidence_collection WHERE firm_id = $1 ORDER BY collected_at DESC',
    //   [firm_id]
    // );
    // const events = await db.query(
    //   'SELECT * FROM ground_truth_events WHERE firm_id = $1 ORDER BY event_date DESC',
    //   [firm_id]
    // );

  } catch (error) {
    console.error('Audit explain error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
