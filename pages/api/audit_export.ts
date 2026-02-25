import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Audit Trail Export API
 * 
 * Provides comprehensive audit trail export for compliance, verification, 
 * and historical record-keeping. Supports JSON and CSV formats.
 * 
 * Usage:
 * GET /api/audit_export?firm_id=ACME&date_start=2026-01-01&date_end=2026-02-24&format=json
 * GET /api/audit_export?firm_id=ACME&format=csv
 */

interface AuditRecord {
  timestamp: string;
  event_type: string;
  firm_id: string;
  action: string;
  pillar_id: string;
  evidence_type: string;
  evidence_description: string;
  confidence_before: string | null;
  confidence_after: string;
  score_before: number | null;
  score_after: number;
  operator_id: string;
  source: string;
  notes: string;
  verification_status: 'verified' | 'unverified' | 'retracted';
  sha256_before: string | null;
  sha256_after: string;
}

interface AuditExportResponse {
  success: boolean;
  export_metadata: {
    firm_id: string;
    date_start: string;
    date_end: string;
    format: string;
    record_count: number;
    export_timestamp: string;
    export_hash: string;
  };
  records?: AuditRecord[];
  csv_data?: string;
  message?: string;
}

// Mock data for demonstration
const mockAuditRecords: AuditRecord[] = [
  {
    timestamp: '2026-02-24T15:30:45Z',
    event_type: 'evidence_added',
    firm_id: 'ACME001',
    action: 'Add regulatory compliance evidence',
    pillar_id: 'regulatory_compliance',
    evidence_type: 'regulatory_filing',
    evidence_description: 'FCA authorization confirmation for Q1 2026',
    confidence_before: null,
    confidence_after: 'high',
    score_before: null,
    score_after: 92,
    operator_id: 'audit_001',
    source: 'FCA_REGISTRY_API',
    notes: 'Automated daily scan - full compliance confirmed',
    verification_status: 'verified',
    sha256_before: null,
    sha256_after: 'abc123def456',
  },
  {
    timestamp: '2026-02-23T09:15:22Z',
    event_type: 'evidence_reviewed',
    firm_id: 'ACME001',
    action: 'Review financial stability evidence',
    pillar_id: 'financial_stability',
    evidence_type: 'financial_report',
    evidence_description: 'Q4 2025 audited financial statements reviewed',
    confidence_before: 'medium',
    confidence_after: 'high',
    score_before: 85,
    score_after: 88,
    operator_id: 'analyst_004',
    source: 'MANUAL_REVIEW',
    notes: 'Independent third-party audit validates financial position',
    verification_status: 'verified',
    sha256_before: 'old123hash456',
    sha256_after: 'new789hash123',
  },
  {
    timestamp: '2026-02-22T14:45:18Z',
    event_type: 'score_snapshot',
    firm_id: 'ACME001',
    action: 'Score snapshot recorded',
    pillar_id: 'aggregate',
    evidence_type: 'snapshot',
    evidence_description: 'Weekly snapshot of all pillars',
    confidence_before: null,
    confidence_after: 'high',
    score_before: null,
    score_after: 87,
    operator_id: 'system',
    source: 'AUTOMATED_SNAPSHOT',
    notes: 'Aggregate score: regulatory(92)×0.30 + financial(88)×0.25 + operational(85)×0.20 + governance(82)×0.15 + client(80)×0.05 + conduct(79)×0.03 + transparency(75)×0.02 = 87',
    verification_status: 'verified',
    sha256_before: null,
    sha256_after: 'snap789abc123',
  },
];

function generateCSV(records: AuditRecord[]): string {
  const headers = [
    'Timestamp',
    'Event Type',
    'Firm ID',
    'Action',
    'Pillar ID',
    'Evidence Type',
    'Evidence Description',
    'Confidence Before',
    'Confidence After',
    'Score Before',
    'Score After',
    'Operator ID',
    'Source',
    'Notes',
    'Verification Status',
    'SHA256 Before',
    'SHA256 After',
  ];

  const rows = records.map((record) => [
    record.timestamp,
    record.event_type,
    record.firm_id,
    record.action,
    record.pillar_id,
    record.evidence_type,
    `"${record.evidence_description.replace(/"/g, '""')}"`,
    record.confidence_before || '',
    record.confidence_after,
    record.score_before || '',
    record.score_after,
    record.operator_id,
    record.source,
    `"${record.notes.replace(/"/g, '""')}"`,
    record.verification_status,
    record.sha256_before || '',
    record.sha256_after,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

function generateExportHash(data: string): string {
  // Simple hash - in production use crypto.createHash('sha256')
  return Buffer.from(data).toString('base64').substring(0, 32);
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuditExportResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      export_metadata: {
        firm_id: '',
        date_start: '',
        date_end: '',
        format: '',
        record_count: 0,
        export_timestamp: new Date().toISOString(),
        export_hash: '',
      },
      message: 'Method not allowed',
    });
  }

  const { firm_id, date_start, date_end, format = 'json' } = req.query;

  // Validation
  if (!firm_id) {
    return res.status(400).json({
      success: false,
      export_metadata: {
        firm_id: '',
        date_start: date_start as string || '',
        date_end: date_end as string || '',
        format: format as string,
        record_count: 0,
        export_timestamp: new Date().toISOString(),
        export_hash: '',
      },
      message: 'firm_id is required',
    });
  }

  if (!['json', 'csv'].includes(format as string)) {
    return res.status(400).json({
      success: false,
      export_metadata: {
        firm_id: firm_id as string,
        date_start: date_start as string || '',
        date_end: date_end as string || '',
        format: format as string,
        record_count: 0,
        export_timestamp: new Date().toISOString(),
        export_hash: '',
      },
      message: 'format must be json or csv',
    });
  }

  // Filter records by firm_id and date range (mockup)
  let filteredRecords = mockAuditRecords.filter(
    (record) => record.firm_id === firm_id
  );

  if (date_start) {
    const startDate = new Date(date_start as string);
    filteredRecords = filteredRecords.filter(
      (record) => new Date(record.timestamp) >= startDate
    );
  }

  if (date_end) {
    const endDate = new Date(date_end as string);
    filteredRecords = filteredRecords.filter(
      (record) => new Date(record.timestamp) <= endDate
    );
  }

  const exportTimestamp = new Date().toISOString();
  
  if (format === 'csv') {
    const csvData = generateCSV(filteredRecords);
    const exportHash = generateExportHash(csvData);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="gtixt-audit-${firm_id}-${exportTimestamp.split('T')[0]}.csv"`
    );

    return res.status(200).json({
      success: true,
      export_metadata: {
        firm_id: firm_id as string,
        date_start: date_start as string || 'N/A',
        date_end: date_end as string || 'N/A',
        format: 'csv',
        record_count: filteredRecords.length,
        export_timestamp: exportTimestamp,
        export_hash: exportHash,
      },
      csv_data: csvData,
    });
  }

  // JSON format (default)
  const jsonData = JSON.stringify(filteredRecords, null, 2);
  const exportHash = generateExportHash(jsonData);

  return res.status(200).json({
    success: true,
    export_metadata: {
      firm_id: firm_id as string,
      date_start: date_start as string || 'N/A',
      date_end: date_end as string || 'N/A',
      format: 'json',
      record_count: filteredRecords.length,
      export_timestamp: exportTimestamp,
      export_hash: exportHash,
    },
    records: filteredRecords,
  });
}
