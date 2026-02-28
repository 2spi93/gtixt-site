import React from 'react';

interface Props {
  score?: number;
  confidence?: number;
  methodologyNotes?: string;
}

export default function InterpretationLayer({
  score = 0,
  confidence = 0.85,
  methodologyNotes,
}: Props) {
  // Generate interpretation based on score
  const getInterpretation = () => {
    if (score >= 80) {
      return 'This score indicates a structurally resilient operating profile with strong governance practices and minimal regulatory concerns.';
    } else if (score >= 60) {
      return 'This score indicates a generally sound operating profile with adequate controls and compliance infrastructure, though some areas require monitoring.';
    } else if (score >= 40) {
      return 'This score indicates a moderately resilient profile with some concerns in governance or operational practices that should be addressed.';
    } else {
      return 'This score indicates significant structural or operational concerns that require prompt attention and remediation.';
    }
  };

  const getSensitivityFactors = () => {
    const factors: string[] = [];
    if (score >= 80) {
      factors.push('Sensitivity to rule or jurisdictional changes');
      factors.push('Market condition changes');
    } else if (score < 50) {
      factors.push('Regulatory changes');
      factors.push('Market volatility');
      factors.push('Operational changes');
    }
    return factors;
  };

  const interpretation = getInterpretation();
  const sensitivityFactors = getSensitivityFactors();

  return (
    <div className="interpretation-layer">
      <h2>GTIXT Interpretation Layer</h2>

      <div className="interpretation-content">
        <div className="interpretation-main">
          <p className="interpretation-text">{interpretation}</p>
          <p className="interpretation-meta">
            Confidence is {(confidence * 100).toFixed(0)}%; interpretation should be weighted by
            data coverage and snapshot recency.
          </p>
        </div>

        {sensitivityFactors.length > 0 && (
          <div className="sensitivity-factors">
            <h3>Key Sensitivities</h3>
            <ul>
              {sensitivityFactors.map((factor, idx) => (
                <li key={idx}>{factor}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {methodologyNotes && (
        <div className="methodology-notes">
          <h3>Methodology Notes</h3>
          <p>{methodologyNotes}</p>
        </div>
      )}

      <style jsx>{`
        .interpretation-layer {
          margin: 3rem 0;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          overflow: hidden;
        }

        .interpretation-layer h2 {
          margin: 0;
          padding: 1.5rem;
          background: #f9f9f9;
          border-bottom: 1px solid #e5e5e5;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .interpretation-content {
          padding: 1.5rem;
          display: grid;
          gap: 2rem;
        }

        .interpretation-main {
          border-left: 4px solid #0066cc;
          padding-left: 1.5rem;
        }

        .interpretation-text {
          margin: 0 0 0.75rem 0;
          font-size: 0.95rem;
          line-height: 1.6;
          color: #333;
        }

        .interpretation-meta {
          margin: 0;
          font-size: 0.85rem;
          color: #999;
          font-style: italic;
        }

        .sensitivity-factors {
          padding: 1rem;
          background: #f0f7ff;
          border-radius: 6px;
          border-left: 4px solid #f59e0b;
        }

        .sensitivity-factors h3 {
          margin: 0 0 0.75rem 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: #333;
        }

        .sensitivity-factors ul {
          margin: 0;
          padding-left: 1.25rem;
          list-style: none;
        }

        .sensitivity-factors li {
          padding: 0.25rem 0;
          font-size: 0.9rem;
          color: #333;
          position: relative;
          padding-left: 0.75rem;
        }

        .sensitivity-factors li:before {
          content: '→';
          position: absolute;
          left: -0.75rem;
          color: #f59e0b;
          font-weight: bold;
        }

        .methodology-notes {
          padding: 1rem;
          background: #f9f9f9;
          border-radius: 6px;
          border-top: 1px solid #e5e5e5;
          margin-top: 1rem;
        }

        .methodology-notes h3 {
          margin: 0 0 0.75rem 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: #333;
        }

        .methodology-notes p {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.5;
          color: #666;
        }

        @media (max-width: 768px) {
          .interpretation-content {
            gap: 1rem;
          }

          .interpretation-main {
            padding-left: 1rem;
            border-left-width: 3px;
          }

          .interpretation-text {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
