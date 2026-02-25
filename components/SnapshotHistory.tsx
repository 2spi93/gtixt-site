import React, { useState } from 'react';

interface HistoryRecord {
  snapshot_key?: string;
  score?: number;
  date?: string;
  confidence?: number | string;
  pillar_scores?: Record<string, number>;
  note?: string;
}

interface Props {
  history?: HistoryRecord[];
  firmName?: string;
}

export default function SnapshotHistory({ history = [], firmName = 'This firm' }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (!history || history.length === 0) {
    return (
      <div style={styles.container}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            ...styles.toggle,
            ...(isOpen ? styles.toggleOpen : {}),
          }}
        >
          <span style={styles.label}>Snapshot History</span>
          <span style={styles.icon}>{isOpen ? '−' : '+'}</span>
        </button>
        {isOpen && (
          <div style={styles.empty}>
            Historical series will appear once available.
          </div>
        )}
      </div>
    );
  }

  const dedupedHistory = Array.from(
    new Map(
      history.map((record) => {
        const keyParts = [
          record.snapshot_key || record.date,
          record.date,
          record.score,
          record.confidence,
        ]
          .map((value) => String(value ?? ''))
          .join('|');
        return [keyParts, record];
      })
    ).values()
  );

  const sortedHistory = [...dedupedHistory].sort(
    (a, b) =>
      new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
  );

  const formatScore = (score: any): string => {
    if (!score) return '—';
    if (typeof score === 'string') return score;
    return score > 1 ? String(Math.round(score)) : String(Math.round(score * 100));
  };

  const displayHistory = sortedHistory.slice(0, 5);

  return (
    <div style={styles.container}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...styles.toggle,
          ...(isOpen ? styles.toggleOpen : {}),
        }}
      >
        <span style={styles.label}>Snapshot History</span>
        <span style={styles.icon}>{isOpen ? '−' : '+'}</span>
      </button>

      {isOpen && (
        <div style={styles.timelineContainer}>
          {displayHistory.map((record, idx) => (
            <div key={`${record.date}-${idx}`} style={styles.timelineRow}>
              <div style={styles.timelineDate}>
                {record.date
                  ? new Date(record.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—'}
              </div>
              <div style={styles.timelineScore}>
                {formatScore(record.score)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginTop: '1rem',
  },
  toggle: {
    width: '100%',
    padding: '0.5rem 0.8rem',
    border: '1px solid rgba(0, 212, 194, 0.4)',
    background: 'rgba(0, 212, 194, 0.12)',
    color: '#00D4C2',
    fontSize: '0.75rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'all 0.2s ease',
    borderRadius: '6px',
    textAlign: 'left',
  },
  toggleOpen: {
    background: 'rgba(245, 158, 11, 0.15)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    color: '#F59E0B',
  },
  label: {
    fontSize: '0.72rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 900,
  },
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1rem',
    height: '1rem',
    fontSize: '0.75rem',
    fontWeight: 900,
  },
  timelineContainer: {
    marginTop: '0.5rem',
    padding: '0.5rem 0.8rem',
    background: 'rgba(0, 212, 194, 0.06)',
    borderRadius: '6px',
    border: '1px solid rgba(0, 212, 194, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  timelineRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    paddingBottom: '0.3rem',
    borderBottom: '1px solid rgba(0, 212, 194, 0.08)',
    fontSize: '0.7rem',
  },
  timelineDate: {
    color: 'rgba(255,255,255,0.5)',
    flex: 1,
  },
  timelineScore: {
    color: '#00D4C2',
    fontWeight: 800,
    fontFamily: 'monospace',
    minWidth: '30px',
    textAlign: 'right',
  },
  empty: {
    marginTop: '0.5rem',
    padding: '0.5rem 0.8rem',
    fontSize: '0.7rem',
    color: 'rgba(255,255,255,0.5)',
    background: 'rgba(0, 212, 194, 0.06)',
    borderRadius: '6px',
  },
};
