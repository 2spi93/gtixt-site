import React from 'react';

interface Props {
  score?: number;
  modelType?: string;
  jurisdiction?: string;
}

export default function ComparativePositioning({
  score = 0,
  modelType = 'unknown',
  jurisdiction = 'unknown',
}: Props) {
  // Calculate percentiles (mock calculations)
  const universePercentile = Math.round((score / 100) * 100);
  const modelTypePercentile = Math.round((score / 100) * 95);
  const jurisdictionPercentile = Math.round((score / 100) * 98);

  const positions = [
    {
      label: 'Percentile vs universe',
      value: universePercentile !== 0 ? `${universePercentile}th` : '—',
      description: 'Ranked among all 100 firms',
    },
    {
      label: 'Percentile vs model type',
      value: modelTypePercentile !== 0 ? `${modelTypePercentile}th` : '—',
      description: `Among ${modelType} firms`,
    },
    {
      label: 'Percentile vs jurisdiction',
      value: jurisdictionPercentile !== 0 ? `${jurisdictionPercentile}th` : '—',
      description: `Among ${jurisdiction} firms`,
    },
  ];

  return (
    <div className="comparative-positioning">
      <h2>Comparative Positioning</h2>

      <div className="positions-grid">
        {positions.map((position, idx) => (
          <div key={idx} className="position-card">
            <div className="position-label">{position.label}</div>
            <div className="position-value">{position.value}</div>
            <div className="position-description">{position.description}</div>
          </div>
        ))}
      </div>

      <div className="positioning-info">
        <p>
          Comparative metrics help contextualize performance relative to peers. Higher percentiles
          indicate stronger performance within the respective group.
        </p>
      </div>

      <style jsx>{`
        .comparative-positioning {
          margin: 3rem 0;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          overflow: hidden;
        }

        .comparative-positioning h2 {
          margin: 0;
          padding: 1.5rem;
          background: #f9f9f9;
          border-bottom: 1px solid #e5e5e5;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .positions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e5e5;
        }

        .position-card {
          padding: 1.25rem;
          background: #f9f9f9;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          text-align: center;
          transition: all 0.2s;
        }

        .position-card:hover {
          background: white;
          border-color: #0066cc;
          box-shadow: 0 2px 8px rgba(0, 102, 204, 0.1);
        }

        .position-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: #999;
          font-weight: 600;
          margin-bottom: 0.75rem;
          letter-spacing: 0.5px;
        }

        .position-value {
          font-size: 1.75rem;
          font-weight: bold;
          color: #0066cc;
          margin-bottom: 0.5rem;
        }

        .position-description {
          font-size: 0.8rem;
          color: #666;
          line-height: 1.4;
        }

        .positioning-info {
          padding: 1.5rem;
          background: #f9f9f9;
          font-size: 0.9rem;
          line-height: 1.5;
          color: #666;
        }

        .positioning-info p {
          margin: 0;
        }

        @media (max-width: 768px) {
          .positions-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .position-card {
            padding: 1rem;
          }

          .position-value {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
