import React from 'react';

interface HistoryRecord {
  snapshot_key: string;
  score: number;
  date: string;
  confidence?: number;
  pillar_scores?: Record<string, number>;
}

interface Props {
  history?: HistoryRecord[];
}

export default function SnapshotHistory({ history = [] }: Props) {
  if (!history || history.length === 0) {
    return (
      <div className="snapshot-history">
        <h2>Snapshot History</h2>
        <div className="no-history">
          <p>Historical series will appear once multiple snapshots are available.</p>
        </div>
        <style jsx>{`
          .snapshot-history {
            margin: 3rem 0;
            background: white;
            border: 1px solid #e5e5e5;
            border-radius: 8px;
            overflow: hidden;
          }

          .snapshot-history h2 {
            margin: 0;
            padding: 1.5rem;
            background: #f9f9f9;
            border-bottom: 1px solid #e5e5e5;
            font-size: 1.25rem;
            font-weight: 600;
          }

          .no-history {
            padding: 3rem 1.5rem;
            text-align: center;
            color: #999;
            font-size: 0.95rem;
            background: #f9f9f9;
          }
        `}</style>
      </div>
    );
  }

  const dedupedHistory = Array.from(
    new Map(
      history.map((record) => {
        const keyParts = [record.snapshot_key, record.date, record.score, record.confidence]
          .map((value) => String(value ?? ''))
          .join('|');
        return [keyParts, record];
      })
    ).values()
  );

  const sortedHistory = [...dedupedHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="snapshot-history">
      <h2>Snapshot History</h2>
      <div className="history-timeline">
        {sortedHistory.map((record, idx) => (
          <div key={idx} className="history-item">
            <div className="history-dot"></div>
            <div className="history-content">
              <div className="history-date">
                {new Date(record.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <div className="history-score">
                <span className="score-label">Score:</span>
                <span className="score-value">{record.score}/100</span>
              </div>
              {typeof record.confidence === 'number' && (
                <div className="history-confidence">
                  <span className="confidence-label">Confidence:</span>
                  <span className="confidence-value">
                    {record.confidence > 1
                      ? `${record.confidence.toFixed(0)}%`
                      : `${(record.confidence * 100).toFixed(0)}%`}
                  </span>
                </div>
              )}
              <div className="history-snapshot-key">
                <small>{record.snapshot_key}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .snapshot-history {
          margin: 3rem 0;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          overflow: hidden;
        }

        .snapshot-history h2 {
          margin: 0;
          padding: 1.5rem;
          background: #f9f9f9;
          border-bottom: 1px solid #e5e5e5;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .history-timeline {
          padding: 1.5rem;
          position: relative;
        }

        .history-timeline::before {
          content: '';
          position: absolute;
          left: 29px;
          top: 1.5rem;
          bottom: 1.5rem;
          width: 2px;
          background: #e5e5e5;
        }

        .history-item {
          position: relative;
          padding-left: 80px;
          margin-bottom: 2rem;
        }

        .history-item:last-child {
          margin-bottom: 0;
        }

        .history-dot {
          position: absolute;
          left: 12px;
          top: 6px;
          width: 16px;
          height: 16px;
          background: #0066cc;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 2px #0066cc;
        }

        .history-content {
          background: #f9f9f9;
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid #e5e5e5;
        }

        .history-date {
          font-weight: 600;
          color: #333;
          font-size: 0.95rem;
          margin-bottom: 0.5rem;
        }

        .history-score {
          font-size: 0.9rem;
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .score-label {
          color: #666;
          font-weight: 500;
        }

        .score-value {
          color: #0066cc;
          font-weight: 600;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .history-confidence {
          font-size: 0.85rem;
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .confidence-label {
          color: #666;
          font-weight: 500;
        }

        .confidence-value {
          color: #10b981;
          font-weight: 600;
        }

        .history-snapshot-key {
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid #ddd;
        }

        .history-snapshot-key small {
          color: #999;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.75rem;
        }

        @media (max-width: 768px) {
          .history-item {
            padding-left: 60px;
          }

          .history-timeline::before {
            left: 19px;
          }

          .history-dot {
            left: 8px;
            width: 12px;
            height: 12px;
            top: 4px;
          }

          .history-content {
            padding: 0.75rem;
          }

          .history-date {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
}
