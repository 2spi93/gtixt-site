// API Endpoint: GET /api/snapshots/history
// Purpose: Retrieve historical snapshots for time-series analysis
// Example: /api/snapshots/history?firm_id=example-corp&version=v1.0&limit=10

import type { NextApiRequest, NextApiResponse } from 'next';

interface HistoricalSnapshot {
  date: string;
  version: string;
  score: number;
  sha256: string;
  status: 'published' | 'retracted';
  pillar_scores?: Record<string, number>;
}

interface HistoryResponse {
  success: boolean;
  query: {
    firm_id?: string;
    version?: string;
    date_start?: string;
    date_end?: string;
    limit: number;
  };
  snapshots: HistoricalSnapshot[];
  total_count: number;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HistoryResponse>
) {
  const { firm_id, version = 'v1.0', date_start, date_end, limit = 50 } = req.query;

  if (!firm_id) {
    return res.status(400).json({
      success: false,
      query: { limit: parseInt(limit as string) || 50 },
      snapshots: [],
      total_count: 0,
      message: 'firm_id parameter required',
    });
  }

  const mockSnapshots: HistoricalSnapshot[] = [
    {
      date: '2026-02-24',
      version: 'v1.0',
      score: 83.2,
      sha256: 'abc123def456...',
      status: 'published',
      pillar_scores: {
        regulatory_compliance: 0.85,
        financial_stability: 0.90,
        operational_risk: 0.80,
        governance: 0.82,
        client_protection: 0.75,
        market_conduct: 0.88,
        transparency_disclosure: 0.92,
      },
    },
  ];

  res.status(200).json({
    success: true,
    query: {
      firm_id: firm_id as string,
      version: version as string,
      limit: Math.min(parseInt(limit as string) || 50, 250),
    },
    snapshots: mockSnapshots,
    total_count: mockSnapshots.length,
  });
}
