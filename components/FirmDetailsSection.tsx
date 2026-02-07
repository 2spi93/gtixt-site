import React from 'react';

interface Props {
  firm: {
    founded_year?: number;
    founded?: string;
    headquarters?: string;
    jurisdiction_tier?: string;
    model_type?: string;
    payout_frequency?: string;
    max_drawdown_rule?: number;
    rule_changes_frequency?: string;
    na_rate?: number;
    payout_reliability?: number;
    risk_model_integrity?: number;
    operational_stability?: number;
    historical_consistency?: number;
    snapshot_id?: string;
    na_policy_applied?: boolean;
    percentile_vs_universe?: number;
    percentile_vs_model_type?: number;
    percentile_vs_jurisdiction?: number;
    snapshot_sha256?: string;
    [key: string]: any;
  };
  snapshot?: {
    sha256?: string;
    snapshot_key?: string;
    object?: string;
  };
}

export default function FirmDetailsSection({ firm, snapshot }: Props) {
  const details = [
    // Basic Info
    {
      label: 'Founded',
      value: firm.founded || (firm.founded_year ? new Date(firm.founded_year, 0, 1).getFullYear() : '—'),
    },
    {
      label: 'Headquarters',
      value: firm.headquarters || '—',
    },
    {
      label: 'Jurisdiction Tier',
      value: firm.jurisdiction_tier || '—',
    },
    {
      label: 'Model Type',
      value: firm.model_type || '—',
    },
    // Operational Info
    {
      label: 'Payout Frequency',
      value: firm.payout_frequency || '—',
    },
    {
      label: 'Max Drawdown Rule',
      value: firm.max_drawdown_rule !== undefined && firm.max_drawdown_rule !== null
        ? `${firm.max_drawdown_rule}%`
        : '—',
    },
    {
      label: 'Rule Change Frequency',
      value: firm.rule_changes_frequency || '—',
    },
    {
      label: 'NA Rate',
      value: firm.na_rate !== undefined && firm.na_rate !== null ? `${firm.na_rate}%` : '—',
    },
    // Integrity Metrics
    {
      label: 'Payout Reliability',
      value: firm.payout_reliability !== undefined && firm.payout_reliability !== null
        ? (Number(firm.payout_reliability) * 100).toFixed(1) + '%'
        : '—',
      section: 'Integrity Metrics'
    },
    {
      label: 'Risk Model Integrity',
      value: firm.risk_model_integrity !== undefined && firm.risk_model_integrity !== null
        ? (Number(firm.risk_model_integrity) * 100).toFixed(1) + '%'
        : '—',
      section: 'Integrity Metrics'
    },
    {
      label: 'Operational Stability',
      value: firm.operational_stability !== undefined && firm.operational_stability !== null
        ? (Number(firm.operational_stability) * 100).toFixed(1) + '%'
        : '—',
      section: 'Integrity Metrics'
    },
    {
      label: 'Historical Consistency',
      value: firm.historical_consistency !== undefined && firm.historical_consistency !== null
        ? (Number(firm.historical_consistency) * 100).toFixed(1) + '%'
        : '—',
      section: 'Integrity Metrics'
    },
    // Compliance & Policy
    {
      label: 'NA Policy Applied',
      value: firm.na_policy_applied !== undefined ? (firm.na_policy_applied ? 'Yes' : 'No') : '—',
      section: 'Compliance'
    },
    // Percentiles
    {
      label: 'Percentile vs Universe',
      value: firm.percentile_vs_universe !== undefined && firm.percentile_vs_universe !== null
        ? `${firm.percentile_vs_universe}%`
        : '—',
      section: 'Comparative'
    },
    {
      label: 'Percentile vs Model Type',
      value: firm.percentile_vs_model_type !== undefined && firm.percentile_vs_model_type !== null
        ? `${firm.percentile_vs_model_type}%`
        : '—',
      section: 'Comparative'
    },
    {
      label: 'Percentile vs Jurisdiction',
      value: firm.percentile_vs_jurisdiction !== undefined && firm.percentile_vs_jurisdiction !== null
        ? `${firm.percentile_vs_jurisdiction}%`
        : '—',
      section: 'Comparative'
    },
    // Snapshot Info
    {
      label: 'Snapshot ID',
      value: firm.snapshot_id || snapshot?.snapshot_key || snapshot?.object || '—',
      section: 'Snapshot'
    },
    {
      label: 'SHA-256 Hash',
      value: firm.snapshot_sha256 || snapshot?.sha256 || '—',
      section: 'Snapshot'
    },
  ];

  return (
    <div className="firm-details-section">
      <h2>Firm Details</h2>
      
      {/* Basic Info Section */}
      <div className="details-subsection">
        <h3>Basic Information</h3>
        <div className="details-grid">
          {details.filter(d => !d.section).slice(0, 8).map((detail, idx) => (
            <div key={idx} className="detail-item">
              <div className="detail-label">{detail.label}</div>
              <div className="detail-value">{detail.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Integrity Metrics Section */}
      {details.some(d => d.section === 'Integrity Metrics') && (
        <div className="details-subsection">
          <h3>Integrity & Performance Metrics</h3>
          <div className="details-grid">
            {details.filter(d => d.section === 'Integrity Metrics').map((detail, idx) => (
              <div key={idx} className="detail-item">
                <div className="detail-label">{detail.label}</div>
                <div className="detail-value metric-value">{detail.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparative Positioning Section */}
      {details.some(d => d.section === 'Comparative') && (
        <div className="details-subsection">
          <h3>Comparative Positioning</h3>
          <div className="details-grid">
            {details.filter(d => d.section === 'Comparative').map((detail, idx) => (
              <div key={idx} className="detail-item">
                <div className="detail-label">{detail.label}</div>
                <div className="detail-value percentile-value">{detail.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Section */}
      {details.some(d => d.section === 'Compliance') && (
        <div className="details-subsection">
          <h3>Compliance & Policy</h3>
          <div className="details-grid">
            {details.filter(d => d.section === 'Compliance').map((detail, idx) => (
              <div key={idx} className="detail-item">
                <div className="detail-label">{detail.label}</div>
                <div className="detail-value">{detail.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Snapshot Section */}
      {details.some(d => d.section === 'Snapshot') && (
        <div className="details-subsection">
          <h3>Snapshot Information</h3>
          <div className="details-grid">
            {details.filter(d => d.section === 'Snapshot').map((detail, idx) => (
              <div key={idx} className="detail-item">
                <div className="detail-label">{detail.label}</div>
                <div className="detail-value snapshot-value">{detail.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .firm-details-section {
          margin: 3rem 0;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          overflow: hidden;
        }

        .firm-details-section h2 {
          margin: 0;
          padding: 1.5rem;
          background: #f9f9f9;
          border-bottom: 1px solid #e5e5e5;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .details-subsection {
          border-bottom: 1px solid #e5e5e5;
        }

        .details-subsection:last-child {
          border-bottom: none;
        }

        .details-subsection h3 {
          margin: 0;
          padding: 1rem 1.5rem;
          background: #fafafa;
          border-bottom: 1px solid #f0f0f0;
          font-size: 0.95rem;
          font-weight: 600;
          color: #0066cc;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0;
          padding: 0;
        }

        .detail-item {
          padding: 1.5rem;
          border-bottom: 1px solid #f5f5f5;
          border-right: 1px solid #f5f5f5;
        }

        .detail-item:nth-child(4n) {
          border-right: none;
        }

        .detail-item:nth-last-child(-n + 4) {
          border-bottom: none;
        }

        .detail-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: #999;
          font-weight: 600;
          margin-bottom: 0.5rem;
          letter-spacing: 0.5px;
        }

        .detail-value {
          font-size: 1rem;
          color: #333;
          font-weight: 500;
          word-break: break-word;
        }

        .detail-value.metric-value {
          color: #0066cc;
          font-weight: 600;
        }

        .detail-value.percentile-value {
          color: #6c63ff;
          font-weight: 600;
        }

        .detail-value.snapshot-value {
          font-family: 'Courier New', monospace;
          font-size: 0.9rem;
          color: #666;
        }

        @media (max-width: 1024px) {
          .details-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }

          .detail-item:nth-child(4n) {
            border-right: 1px solid #f0f0f0;
          }

          .detail-item:nth-child(2n) {
            border-right: none;
          }
        }

        @media (max-width: 768px) {
          .details-grid {
            grid-template-columns: 1fr;
          }

          .detail-item {
            border-right: none;
            border-bottom: 1px solid #f0f0f0;
          }

          .detail-item:last-child {
            border-bottom: none;
          }
        }
      `}</style>
    </div>
  );
}
