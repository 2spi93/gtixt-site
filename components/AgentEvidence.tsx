/**
 * AgentEvidence Component
 * Displays evidence from all 7 agents for a firm
 */

import React, { useState, useEffect, useCallback } from 'react';

interface AgentEvidenceProps {
  firmId: string;
}

interface AgentResult {
  agent: string;
  label: string;
  status: 'SUCCESS' | 'ERROR' | 'PENDING';
  evidence?: any;
  error?: string;
  timestamp: string;
}

export default function AgentEvidence({ firmId }: AgentEvidenceProps) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<AgentResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchAgentEvidence = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/agents/evidence?firmId=${firmId}`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch agent evidence:', err);
    } finally {
      setLoading(false);
    }
  }, [firmId]);

  useEffect(() => {
    if (!firmId) return;

    fetchAgentEvidence();
  }, [firmId, fetchAgentEvidence]);

  if (loading) {
    return (
      <div className="agent-evidence-loading">
        <div className="spinner"></div>
        <p>Loading agent evidence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="agent-evidence-error">
        <h3>⚠️ Error Loading Evidence</h3>
        <p>{error}</p>
        <button onClick={fetchAgentEvidence}>Retry</button>
      </div>
    );
  }

  return (
    <div className="agent-evidence-container">
      <h2>Agent Evidence</h2>
      <p className="subtitle">
        Data collected by {results.length} autonomous verification agents
      </p>

      <div className="agents-grid">
        {results.map((result) => (
          <AgentCard key={result.agent} result={result} />
        ))}
      </div>

      <style jsx>{`
        .agent-evidence-container {
          margin: 2rem 0;
        }

        .agents-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .subtitle {
          color: #666;
          margin-top: 0.5rem;
        }

        .agent-evidence-loading,
        .agent-evidence-error {
          text-align: center;
          padding: 2rem;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0066cc;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function AgentCard({ result }: { result: AgentResult }) {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = () => {
    if (result.status === 'ERROR') return '#dc3545';
    if (result.status === 'PENDING') return '#9ca3af';
    if (result.evidence?.confidence >= 0.8) return '#28a745';
    if (result.evidence?.confidence >= 0.5) return '#ffc107';
    return '#6c757d';
  };

  const getAgentIcon = () => {
    const icons: Record<string, string> = {
      'RVI': '🔍',
      'SSS': '🚨',
      'REM': '📰',
      'FRP': '⭐',
      'IRS': '📝',
      'MIS': '🕵️',
      'IIP': '📊',
    };
    return icons[result.agent] || '🤖';
  };

  return (
    <div className="agent-card" style={{ borderLeftColor: getStatusColor() }}>
      <div className="agent-header" onClick={() => setExpanded(!expanded)}>
        <div className="agent-icon">{getAgentIcon()}</div>
        <div className="agent-info">
          <h3>{result.label}</h3>
          <span className="agent-code">{result.agent}</span>
        </div>
        <div className="agent-status" style={{ color: getStatusColor() }}>
          {result.status === 'SUCCESS' ? '✓' : result.status === 'PENDING' ? '○' : '✗'}
        </div>
      </div>

      {expanded && (
        <div className="agent-details">
          {result.status === 'SUCCESS' ? (
            <EvidenceDetails evidence={result.evidence} agent={result.agent} />
          ) : result.status === 'PENDING' ? (
            <div className="pending-message">
              <p>{result.error || 'Awaiting evidence collection'}</p>
            </div>
          ) : (
            <div className="error-message">
              <p>{result.error || 'Unknown error'}</p>
            </div>
          )}
          <div className="timestamp">
            Updated: {new Date(result.timestamp).toLocaleString()}
          </div>
        </div>
      )}

      <style jsx>{`
        .agent-card {
          background: white;
          border: 1px solid #ddd;
          border-left: 4px solid;
          border-radius: 8px;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }

        .agent-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .agent-header {
          display: flex;
          align-items: center;
          padding: 1rem;
          cursor: pointer;
          gap: 1rem;
        }

        .agent-icon {
          font-size: 2rem;
        }

        .agent-info {
          flex: 1;
        }

        .agent-info h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .agent-code {
          font-size: 0.875rem;
          color: #666;
          font-family: monospace;
        }

        .agent-status {
          font-size: 1.5rem;
          font-weight: bold;
        }

        .agent-details {
          padding: 1rem;
          border-top: 1px solid #eee;
          background: #f9f9f9;
        }

        .error-message {
          color: #dc3545;
          padding: 0.5rem;
          background: #fff5f5;
          border-radius: 4px;
        }

        .pending-message {
          color: #6b7280;
          padding: 0.5rem;
          background: #f3f4f6;
          border-radius: 4px;
        }

        .timestamp {
          margin-top: 1rem;
          font-size: 0.875rem;
          color: #999;
          text-align: right;
        }
      `}</style>
    </div>
  );
}

function EvidenceDetails({ evidence, agent }: { evidence: any; agent: string }) {
  if (!evidence) return <p>No evidence available</p>;

  // Render different evidence types
  switch (agent) {
    case 'RVI':
      return <RVIEvidence evidence={evidence} />;
    case 'SSS':
      return <SSSEvidence evidence={evidence} />;
    case 'REM':
      return <REMEvidence evidence={evidence} />;
    case 'FRP':
      return <FRPEvidence evidence={evidence} />;
    case 'IRS':
      return <IRSEvidence evidence={evidence} />;
    case 'MIS':
      return <MISEvidence evidence={evidence} />;
    case 'IIP':
      return <IIPEvidence evidence={evidence} />;
    default:
      return <pre>{JSON.stringify(evidence, null, 2)}</pre>;
  }
}

function RVIEvidence({ evidence }: { evidence: any }) {
  return (
    <div>
      <p><strong>Status:</strong> {evidence.status}</p>
      <p><strong>Confidence:</strong> {(evidence.confidence * 100).toFixed(0)}%</p>
      {evidence.fca_reference && (
        <p><strong>FCA Reference:</strong> {evidence.fca_reference}</p>
      )}
    </div>
  );
}

function SSSEvidence({ evidence }: { evidence: any }) {
  const isList = Array.isArray(evidence);
  const items = isList ? evidence : [evidence];
  
  return (
    <div>
      {items.map((item: any, idx: number) => (
        <div key={idx}>
          <p><strong>Match Type:</strong> {item.match_type}</p>
          <p><strong>Confidence:</strong> {(item.confidence * 100).toFixed(0)}%</p>
          <p><strong>List:</strong> {item.sanctions_list}</p>
        </div>
      ))}
    </div>
  );
}

function REMEvidence({ evidence }: { evidence: any }) {
  const events = Array.isArray(evidence) ? evidence : [evidence];
  
  return (
    <div>
      {events.slice(0, 3).map((event: any, idx: number) => (
        <div key={idx} style={{ marginBottom: '1rem' }}>
          <p><strong>{event.title}</strong></p>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>
            {event.event_type} - {event.severity}
          </p>
        </div>
      ))}
    </div>
  );
}

function FRPEvidence({ evidence }: { evidence: any }) {
  return (
    <div>
      {evidence.trustpilot_score && (
        <p><strong>TrustPilot:</strong> {evidence.trustpilot_score.toFixed(1)} ⭐</p>
      )}
      <p><strong>Sentiment:</strong> {evidence.sentiment}</p>
      <p><strong>Payout Issues:</strong> {evidence.payout_issues}</p>
    </div>
  );
}

function IRSEvidence({ evidence }: { evidence: any }) {
  const submissions = Array.isArray(evidence) ? evidence : [evidence];
  
  return (
    <div>
      <p><strong>Submissions:</strong> {submissions.length}</p>
      <p><strong>Verified:</strong> {submissions.filter((s: any) => s.status === 'VERIFIED').length}</p>
    </div>
  );
}

function MISEvidence({ evidence }: { evidence: any }) {
  return (
    <div>
      <p><strong>Risk Level:</strong> {evidence.risk_level}</p>
      <p><strong>Status:</strong> {evidence.status}</p>
      {evidence.findings && (
        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
          {evidence.findings.slice(0, 3).map((finding: string, idx: number) => (
            <li key={idx} style={{ fontSize: '0.875rem' }}>{finding}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IIPEvidence({ evidence }: { evidence: any }) {
  return (
    <div>
      <p><strong>Compliance Score:</strong> {evidence.compliance_score}/100</p>
      <p><strong>Report Type:</strong> {evidence.report_type}</p>
      {evidence.recommendations && (
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          {evidence.recommendations[0]}
        </p>
      )}
    </div>
  );
}
