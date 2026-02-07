import React from 'react';

interface ComplianceFlag {
  icon: string;
  type: 'green' | 'amber' | 'red';
  title: string;
  items: string[];
}

interface Props {
  naRate?: number;
  score?: number;
  confidence?: number;
}

export default function ComplianceFlags({ naRate = 0, score = 0, confidence = 0.85 }: Props) {
  const flags: ComplianceFlag[] = [];

  // Green flags
  const greenFlags: string[] = [];
  if (score >= 80) {
    greenFlags.push('Strong GTIXT composite score (≥0.8)');
  }
  if (confidence >= 0.80) {
    greenFlags.push('High confidence level (≥0.80)');
  }
  if (naRate < 10) {
    greenFlags.push('Excellent data coverage (>90%)');
  }

  if (greenFlags.length > 0) {
    flags.push({
      icon: '✓',
      type: 'green',
      title: 'Green Flags (Positive Indicators)',
      items: greenFlags,
    });
  }

  // Amber flags
  const amberFlags: string[] = [];
  if (naRate >= 10 && naRate < 30) {
    amberFlags.push('Moderate data gaps (10-30% N/A) - monitor coverage');
  }
  if (score >= 50 && score < 70) {
    amberFlags.push('Moderate composite score - review pillar breakdown');
  }
  if (confidence >= 0.70 && confidence < 0.85) {
    amberFlags.push('Moderate confidence - consider recency of data');
  }

  if (amberFlags.length > 0) {
    flags.push({
      icon: '⚠',
      type: 'amber',
      title: 'Amber Flags (Review Required)',
      items: amberFlags,
    });
  }

  // Red flags
  const redFlags: string[] = [];
  if (naRate >= 30) {
    redFlags.push('High NA rate (≥30%) - data quality concerns');
  }
  if (score < 50) {
    redFlags.push('Low composite score - significant concerns');
  }
  if (confidence < 0.70) {
    redFlags.push('Low confidence - data reliability issues');
  }

  if (redFlags.length > 0) {
    flags.push({
      icon: '✗',
      type: 'red',
      title: 'Red Flags (Requires Attention)',
      items: redFlags,
    });
  }

  return (
    <div className="compliance-flags">
      <h2>Compliance Flags</h2>
      <div className="flags-container">
        {flags.map((flag, idx) => (
          <div key={idx} className={`flag-section flag-${flag.type}`}>
            <h3>
              <span className="flag-icon">{flag.icon}</span>
              {flag.title}
            </h3>
            <ul className="flag-items">
              {flag.items.map((item, itemIdx) => (
                <li key={itemIdx}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {flags.length === 0 && (
        <div className="no-flags">
          <p>No compliance flags detected.</p>
        </div>
      )}

      <style jsx>{`
        .compliance-flags {
          margin: 3rem 0;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          overflow: hidden;
        }

        .compliance-flags h2 {
          margin: 0;
          padding: 1.5rem;
          background: #f9f9f9;
          border-bottom: 1px solid #e5e5e5;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .flags-container {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .flag-section {
          padding: 1rem;
          border-radius: 6px;
          border-left: 4px solid;
        }

        .flag-green {
          background: #f0fdf4;
          border-left-color: #10b981;
        }

        .flag-amber {
          background: #fffbf0;
          border-left-color: #f59e0b;
        }

        .flag-red {
          background: #fef2f2;
          border-left-color: #ef4444;
        }

        .flag-section h3 {
          margin: 0 0 0.75rem 0;
          font-size: 0.95rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .flag-green h3 {
          color: #10b981;
        }

        .flag-amber h3 {
          color: #f59e0b;
        }

        .flag-red h3 {
          color: #ef4444;
        }

        .flag-icon {
          font-size: 1.25rem;
          font-weight: bold;
        }

        .flag-items {
          margin: 0;
          padding-left: 1.5rem;
          list-style: none;
        }

        .flag-items li {
          margin: 0.5rem 0;
          font-size: 0.9rem;
          line-height: 1.4;
          color: #333;
          position: relative;
          padding-left: 1rem;
        }

        .flag-items li:before {
          content: '•';
          position: absolute;
          left: 0;
          font-weight: bold;
        }

        .no-flags {
          padding: 2rem;
          text-align: center;
          color: #999;
          font-size: 0.95rem;
        }

        @media (max-width: 768px) {
          .flags-container {
            gap: 1rem;
          }

          .flag-section {
            padding: 0.75rem;
          }

          .flag-section h3 {
            font-size: 0.875rem;
          }

          .flag-items li {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
}
