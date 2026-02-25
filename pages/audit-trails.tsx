import React, { useState } from 'react';
import Head from 'next/head';

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

export default function AuditTrails() {
  const [firmId, setFirmId] = useState('ACME001');
  const [dateStart, setDateStart] = useState('2026-01-01');
  const [dateEnd, setDateEnd] = useState('2026-02-24');
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportHash, setExportHash] = useState('');

  const handleFetchAudit = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        firm_id: firmId,
        date_start: dateStart,
        date_end: dateEnd,
        format,
      });

      const response = await fetch(`/api/audit_export?${params}`);
      const data = await response.json();

      if (data.success) {
        if (format === 'json') {
          setAuditRecords(data.records || []);
        } else {
          // Handle CSV download
          const blob = new Blob([data.csv_data], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `gtixt-audit-${firmId}-${dateEnd}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
        setExportHash(data.export_metadata.export_hash);
      }
    } catch (error) {
      console.error('Failed to fetch audit records:', error);
    }
    setLoading(false);
  };

  const getConfidenceBadge = (confidence: string | null) => {
    if (!confidence) return null;
    const colors: Record<string, string> = {
      high: 'bg-green-900 text-green-100',
      medium: 'bg-yellow-900 text-yellow-100',
      low: 'bg-red-900 text-red-100',
      very_low: 'bg-red-950 text-red-100',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-mono ${colors[confidence] || 'bg-gray-700'}`}>
        {confidence}
      </span>
    );
  };

  const getEventBadge = (eventType: string) => {
    const colors: Record<string, string> = {
      evidence_added: 'bg-blue-900 text-blue-100',
      evidence_reviewed: 'bg-purple-900 text-purple-100',
      score_snapshot: 'bg-green-900 text-green-100',
      evidence_retracted: 'bg-red-900 text-red-100',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[eventType] || 'bg-gray-700'}`}>
        {eventType.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <>
      <Head>
        <title>GTIXT Audit Trails - Compliance & Verification</title>
        <meta name="description" content="View complete audit trails for GTIXT scores" />
      </Head>

      <div className="min-h-screen bg-gray-950 text-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-950 to-gray-900 border-b border-indigo-900 px-6 py-8">
          <h1 className="text-3xl font-bold text-white mb-2">Audit Trails</h1>
          <p className="text-gray-400">
            Complete compliance-grade audit trail for GTIXT score modifications and evidence changes
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Search Form */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Export Audit Trail</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Firm ID
                </label>
                <input
                  type="text"
                  value={firmId}
                  onChange={(e) => setFirmId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g., ACME001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'json' | 'csv')}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV (Download)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleFetchAudit}
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded font-medium transition"
            >
              {loading ? 'Loading...' : 'Export Audit Trail'}
            </button>

            {exportHash && (
              <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
                <p className="text-sm text-gray-400">
                  Export Hash: <code className="text-green-400 font-mono text-xs">{exportHash}</code>
                </p>
              </div>
            )}
          </div>

          {/* Audit Records Table */}
          {auditRecords.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <h2 className="text-xl font-semibold p-6 border-b border-gray-800">
                {auditRecords.length} Audit Records
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 border-b border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-300">Timestamp</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-300">Event</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-300">Action</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-300">Pillar</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-300">Confidence</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-300">Score</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-300">Operator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditRecords.map((record, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-800 hover:bg-gray-800 transition"
                      >
                        <td className="px-6 py-3 font-mono text-xs text-gray-400">
                          {new Date(record.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-3">{getEventBadge(record.event_type)}</td>
                        <td className="px-6 py-3 text-gray-400">{record.action}</td>
                        <td className="px-6 py-3 text-gray-400">{record.pillar_id}</td>
                        <td className="px-6 py-3">
                          {record.confidence_before && (
                            <div>
                              {getConfidenceBadge(record.confidence_before)} →{' '}
                              {getConfidenceBadge(record.confidence_after)}
                            </div>
                          )}
                          {!record.confidence_before && getConfidenceBadge(record.confidence_after)}
                        </td>
                        <td className="px-6 py-3 text-gray-400">
                          {record.score_before !== null && (
                            <div>
                              {record.score_before} → {record.score_after}
                            </div>
                          )}
                          {record.score_before === null && <div>{record.score_after}</div>}
                        </td>
                        <td className="px-6 py-3 font-mono text-xs text-gray-400">
                          {record.operator_id}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notes Section */}
              <div className="px-6 py-4 bg-gray-800 border-t border-gray-700">
                <h3 className="font-semibold mb-2">Notes & Details</h3>
                {auditRecords.map((record, idx) => (
                  <div key={idx} className="mb-3 p-3 bg-gray-900 rounded border border-gray-700">
                    <p className="text-xs text-gray-400">
                      <span className="font-mono">{record.timestamp}</span> - {record.action}
                    </p>
                    <p className="text-sm text-gray-300 mt-1">{record.notes}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Source: <span className="font-mono">{record.source}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-12 bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">How to Use Audit Trails</h2>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <strong>1. Select a firm:</strong> Enter the firm ID to audit
              </li>
              <li>
                <strong>2. Choose date range:</strong> Specify the time period for audit
              </li>
              <li>
                <strong>3. Export format:</strong> JSON for analysis, CSV for spreadsheets
              </li>
              <li>
                <strong>4. Verify integrity:</strong> Check the export hash against published records
              </li>
              <li>
                <strong>5. Trace changes:</strong> Each record shows timestamp, operator, and verification status
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
