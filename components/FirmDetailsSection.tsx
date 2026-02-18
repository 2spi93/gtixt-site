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
    daily_drawdown_rule?: number;
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
  const MISSING_VALUE = 'Not available';
  const formatValue = (value: unknown, fallback = MISSING_VALUE): string => {
    if (value === undefined || value === null) return fallback;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed === '—') return fallback;
      return trimmed;
    }
    return String(value);
  };
  const formatPercent = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return MISSING_VALUE;
    return `${value}%`;
  };
  const formatRatioPercent = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return MISSING_VALUE;
    return `${(Number(value) * 100).toFixed(1)}%`;
  };
  const valueClass = (base: string, value: string): string =>
    value === MISSING_VALUE ? `${base} missing` : base;

  const foundedValue = firm.founded || (firm.founded_year ? new Date(firm.founded_year, 0, 1).getFullYear().toString() : undefined);
  const headquartersValue = firm.headquarters || firm.jurisdiction;

  const details: Array<{ label: string; value: string; section?: string }> = [
    // Basic Info
    {
      label: 'Founded',
      value: formatValue(foundedValue),
    },
    {
      label: 'Headquarters',
      value: formatValue(headquartersValue),
    },
    {
      label: 'Jurisdiction Tier',
      value: formatValue(firm.jurisdiction_tier),
    },
    {
      label: 'Model Type',
      value: formatValue(firm.model_type),
    },
    // Program Parameters
    {
      label: 'Payout Frequency',
      value: formatValue(firm.payout_frequency),
      section: 'Program Parameters'
    },
    {
      label: 'Max Drawdown Rule',
      value: formatPercent(firm.max_drawdown_rule),
      section: 'Program Parameters'
    },
    {
      label: 'Daily Drawdown Rule',
      value: formatPercent(firm.daily_drawdown_rule),
      section: 'Program Parameters'
    },
    {
      label: 'Rule Change Frequency',
      value: formatValue(firm.rule_changes_frequency),
      section: 'Program Parameters'
    },
    {
      label: 'NA Rate',
      value: formatPercent(firm.na_rate),
      section: 'Program Parameters'
    },
    // Integrity Metrics
    {
      label: 'Payout Reliability',
      value: formatRatioPercent(firm.payout_reliability),
      section: 'Integrity Metrics'
    },
    {
      label: 'Risk Model Integrity',
      value: formatRatioPercent(firm.risk_model_integrity),
      section: 'Integrity Metrics'
    },
    {
      label: 'Operational Stability',
      value: formatRatioPercent(firm.operational_stability),
      section: 'Integrity Metrics'
    },
    {
      label: 'Historical Consistency',
      value: formatRatioPercent(firm.historical_consistency),
      section: 'Integrity Metrics'
    },
    // Compliance & Policy
    {
      label: 'NA Policy Applied',
      value: firm.na_policy_applied !== undefined ? (firm.na_policy_applied ? 'Yes' : 'No') : MISSING_VALUE,
      section: 'Compliance'
    },
    // Percentiles
    {
      label: 'Percentile vs Universe',
      value: formatPercent(firm.percentile_vs_universe),
      section: 'Comparative'
    },
    {
      label: 'Percentile vs Model Type',
      value: formatPercent(firm.percentile_vs_model_type),
      section: 'Comparative'
    },
    {
      label: 'Percentile vs Jurisdiction',
      value: formatPercent(firm.percentile_vs_jurisdiction),
      section: 'Comparative'
    },
    // Snapshot Info
    {
      label: 'Snapshot ID',
      value: formatValue(firm.snapshot_id || snapshot?.snapshot_key || snapshot?.object),
      section: 'Snapshot'
    },
    {
      label: 'SHA-256 Hash',
      value: formatValue(firm.snapshot_sha256 || snapshot?.sha256),
      section: 'Snapshot'
    },
  ];

  return (
    <div className="firm-details-section">
      <h2>Firm Details</h2>
      <p className="details-note">Values reflect the latest verified snapshot. Program parameters are listed below when available; missing values indicate unavailable or unverified data.</p>
      
      {/* Basic Info Section */}
      <div className="details-subsection">
        <h3>Basic Information</h3>
        <div className="details-grid">
          {details.filter(d => !d.section).map((detail, idx) => (
            <div key={idx} className="detail-item">
              <div className="detail-label">{detail.label}</div>
              <div className={valueClass('detail-value', detail.value)}>{detail.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Program Parameters Section */}
      {details.some(d => d.section === 'Program Parameters') && (
        <div className="details-subsection">
          <h3>Program Parameters</h3>
          <div className="details-grid">
            {details.filter(d => d.section === 'Program Parameters').map((detail, idx) => (
              <div key={idx} className="detail-item">
                <div className="detail-label">{detail.label}</div>
                <div className={valueClass('detail-value', detail.value)}>{detail.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integrity Metrics Section */}
      {details.some(d => d.section === 'Integrity Metrics') && (
        <div className="details-subsection">
          <h3>Integrity & Performance Metrics</h3>
          <div className="details-grid">
            {details.filter(d => d.section === 'Integrity Metrics').map((detail, idx) => (
              <div key={idx} className="detail-item">
                <div className="detail-label">{detail.label}</div>
                <div className={valueClass('detail-value metric-value', detail.value)}>{detail.value}</div>
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
                <div className={valueClass('detail-value percentile-value', detail.value)}>{detail.value}</div>
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
                <div className={valueClass('detail-value', detail.value)}>{detail.value}</div>
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
                <div className={valueClass('detail-value snapshot-value', detail.value)}>{detail.value}</div>
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

        .details-note {
          margin: 0 1.5rem 1.25rem;
          color: #6b7280;
          font-size: 0.9rem;
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

        .detail-value.missing {
          color: #9ca3af;
          font-style: italic;
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
