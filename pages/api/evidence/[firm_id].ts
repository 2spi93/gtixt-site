// API Endpoint: GET /api/evidence/[firm_id]
// Purpose: Get evidence captured for a firm's score

import type { NextApiRequest, NextApiResponse } from 'next';

interface EvidenceItem {
  pillar: string;
  type: string;
  description: string;
  confidence: string;
  timestamp: string;
  source: string;
}

interface PillarEvidence {
  pillar_id: string;
  pillar_name: string;
  weight: number;
  score: number;
  evidence: EvidenceItem[];
}

interface EvidenceResponse {
  success: boolean;
  firm_id: string;
  snapshot_date: string;
  total_score: number;
  evidence_by_pillar: PillarEvidence[];
  message?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<EvidenceResponse>
) {
  const { firm_id } = req.query;

  if (!firm_id) {
    return res.status(400).json({
      success: false,
      firm_id: '',
      snapshot_date: '',
      total_score: 0,
      evidence_by_pillar: [],
      message: 'firm_id required',
    });
  }

  const mockEvidence: PillarEvidence[] = [
    {
      pillar_id: 'regulatory_compliance',
      pillar_name: 'Regulatory Compliance',
      weight: 0.30,
      score: 0.85,
      evidence: [
        {
          pillar: 'regulatory_compliance',
          type: 'regulatory_filing',
          description: 'SEC Form ADV filed 2026-01-15 - No enforcement actions',
          confidence: 'high',
          timestamp: '2026-01-15T10:30:00Z',
          source: 'SEC EDGAR',
        },
      ],
    },
  ];

  res.status(200).json({
    success: true,
    firm_id: firm_id as string,
    snapshot_date: '2026-02-24',
    total_score: 83.2,
    evidence_by_pillar: mockEvidence,
  });
}
