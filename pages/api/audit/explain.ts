// API Route: /api/audit/explain
// Purpose: Audit Trail - Explain score calculation
// Created: 2026-02-01
// Phase: 1 (Validation Framework) - Week 3

import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

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

// Load test snapshot for explanation
function loadTestSnapshot() {
  try {
    const snapshotPath = path.join(process.cwd(), 'data', 'test-snapshot.json');
    const snapshotData = fs.readFileSync(snapshotPath, 'utf-8');
    return JSON.parse(snapshotData);
  } catch (error) {
    console.error('Error loading test snapshot:', error);
    return null;
  }
}

// Mock evidence data (will be replaced with database query)
const mockEvidence = [
  {
    evidence_id: 1,
    firm_id: 'ftmocom',
    type: 'webpage',
    collected_by: 'web_crawler',
    relevance_score: 0.95,
    collected_at: '2026-02-01T06:00:00Z',
  },
  {
    evidence_id: 2,
    firm_id: 'fundedtradingplus',
    type: 'registry_entry',
    collected_by: 'RVI',
    relevance_score: 1.0,
    collected_at: '2026-02-01T06:10:00Z',
  },
  {
    evidence_id: 3,
    firm_id: 'topsteptrader',
    type: 'api_response',
    collected_by: 'SSS',
    relevance_score: 0.75,
    collected_at: '2026-02-01T06:55:00Z',
  },
];

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
    // Load snapshot data
    const snapshot = loadTestSnapshot();
    
    if (!snapshot || !snapshot.records) {
      return res.status(500).json({ error: 'Failed to load snapshot data' });
    }

    // Find firm in snapshot
    const firmRecord = snapshot.records.find((r: any) => r.firm_id === firm_id);

    if (!firmRecord) {
      return res.status(404).json({ 
        error: 'Firm not found',
        message: `No data available for firm: ${firm_id}`
      });
    }

    // Get evidence for this firm
    const firmEvidence = mockEvidence.filter(e => e.firm_id === firm_id);

    // Build evidence summary
    const evidenceByType = new Map();
    const evidenceByAgent = new Map();

    firmEvidence.forEach(e => {
      evidenceByType.set(e.type, (evidenceByType.get(e.type) || 0) + 1);
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
      snapshot_id: snapshot.metadata?.version || 'unknown',
      timestamp: snapshot.metadata?.generated_at || new Date().toISOString(),
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
        recent_evidence: firmEvidence.slice(0, 5),
      },
      confidence_factors: confidenceFactors,
      na_rate: firmRecord.na_rate || 0,
      last_updated: snapshot.metadata?.generated_at || new Date().toISOString(),
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
