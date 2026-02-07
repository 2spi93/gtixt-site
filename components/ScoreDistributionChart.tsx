'use client';

import React from 'react';

interface ScoreDistributionChartProps {
  avgScore: number;
  medianScore: number;
  passRate: number;
  totalFirms: number;
}

export function ScoreDistributionChart({
  avgScore,
  medianScore,
  passRate,
  totalFirms,
}: ScoreDistributionChartProps) {
  const threshold = 60;
  const maxScore = 100;

  const avgPercent = Math.min(Math.max((avgScore / maxScore) * 100, 0), 100);
  const medianPercent = Math.min(Math.max((medianScore / maxScore) * 100, 0), 100);
  const thresholdPercent = Math.min(Math.max((threshold / maxScore) * 100, 0), 100);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.kicker}>Institutional Signal</div>
          <h3 style={styles.title}>Score Distribution vs Pass Threshold</h3>
        </div>
        <span style={styles.passRateBadge}>{passRate}% Pass Rate</span>
      </div>

      <div style={styles.chartArea}>
        <div style={styles.railWrap}>
          <div style={styles.railGlow} />
          <div style={styles.rail} />
          <div style={{ ...styles.thresholdMarker, left: `${thresholdPercent}%` }}>
            <div style={styles.thresholdPillar} />
            <span style={styles.thresholdLabel}>Threshold {threshold}</span>
          </div>
          <div style={{ ...styles.beacon, left: `${avgPercent}%` }}>
            <div style={styles.beaconDot} />
            <span style={styles.beaconLabel}>Avg {avgScore.toFixed(1)}</span>
          </div>
          <div style={{ ...styles.beacon, left: `${medianPercent}%`, top: '58%' }}>
            <div style={{ ...styles.beaconDot, backgroundColor: '#f7b731' }} />
            <span style={styles.beaconLabel}>Median {medianScore.toFixed(1)}</span>
          </div>
        </div>

        <div style={styles.scaleRow}>
          {['0', '20', '40', '60', '80', '100'].map((label) => (
            <span key={label} style={styles.scaleLabel}>{label}</span>
          ))}
        </div>

        <div style={styles.legendRow}>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendSwatch, backgroundColor: '#28d39d' }} />
            Average Signal
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendSwatch, backgroundColor: '#f7b731' }} />
            Median Signal
          </div>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendSwatch, backgroundColor: '#7a5cff' }} />
            Pass Threshold
          </div>
        </div>
      </div>

      <p style={styles.note}>
        {totalFirms} firms analyzed — the distribution sits{' '}
        {avgScore >= threshold && medianScore >= threshold ? 'above' : 'below'} the threshold.
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginTop: '2rem',
    padding: '1.75rem',
    borderRadius: '20px',
    border: '1px solid rgba(39, 57, 73, 0.35)',
    background: 'radial-gradient(circle at 10% 0%, rgba(40, 211, 157, 0.12), transparent 45%), radial-gradient(circle at 80% 20%, rgba(122, 92, 255, 0.18), transparent 45%), #0b0f14',
    color: '#dbe5f0',
    fontFamily: '"Space Grotesk", "IBM Plex Sans", system-ui, sans-serif',
    boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    gap: '1rem',
  },
  kicker: {
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    fontSize: '0.65rem',
    color: '#7f8ea3',
    fontWeight: 600,
    marginBottom: '0.35rem',
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#eaf2ff',
    margin: 0,
  },
  passRateBadge: {
    fontSize: '0.8rem',
    fontWeight: 600,
    padding: '0.4rem 0.85rem',
    borderRadius: '999px',
    background: 'linear-gradient(120deg, rgba(40, 211, 157, 0.2), rgba(122, 92, 255, 0.2))',
    color: '#c7f9e9',
    border: '1px solid rgba(199, 249, 233, 0.3)',
  },
  chartArea: {
    marginBottom: '1rem',
  },
  railWrap: {
    position: 'relative',
    height: '130px',
    borderRadius: '18px',
    background: 'linear-gradient(120deg, rgba(15, 22, 31, 0.9), rgba(9, 13, 19, 0.95))',
    border: '1px solid rgba(123, 140, 158, 0.25)',
    overflow: 'hidden',
  },
  railGlow: {
    position: 'absolute',
    inset: '0',
    background: 'radial-gradient(circle at 20% 40%, rgba(40, 211, 157, 0.3), transparent 40%), radial-gradient(circle at 80% 60%, rgba(122, 92, 255, 0.35), transparent 45%)',
    opacity: 0.8,
  },
  rail: {
    position: 'absolute',
    left: '5%',
    right: '5%',
    top: '50%',
    height: '8px',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #253342, #28d39d 45%, #f7b731 70%, #7a5cff 100%)',
    boxShadow: '0 0 24px rgba(40, 211, 157, 0.25)',
    transform: 'translateY(-50%)',
  },
  thresholdMarker: {
    position: 'absolute',
    top: '0',
    transform: 'translateX(-50%)',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
  },
  thresholdPillar: {
    width: '2px',
    height: '100%',
    background: 'linear-gradient(180deg, rgba(122, 92, 255, 0.1), rgba(122, 92, 255, 0.9), rgba(122, 92, 255, 0.1))',
    boxShadow: '0 0 16px rgba(122, 92, 255, 0.6)',
  },
  thresholdLabel: {
    fontSize: '0.7rem',
    color: '#c4b5fd',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  beacon: {
    position: 'absolute',
    top: '30%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.35rem',
  },
  beaconDot: {
    width: '12px',
    height: '12px',
    borderRadius: '999px',
    backgroundColor: '#28d39d',
    boxShadow: '0 0 18px rgba(40, 211, 157, 0.85)',
  },
  beaconLabel: {
    fontSize: '0.7rem',
    color: '#cbd7e6',
    fontWeight: 600,
  },
  scaleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '0.9rem',
    fontSize: '0.7rem',
    color: '#7f8ea3',
    fontWeight: 600,
  },
  scaleLabel: {
    textAlign: 'center',
    flex: 1,
  },
  legendRow: {
    display: 'flex',
    gap: '1.5rem',
    marginTop: '1rem',
    flexWrap: 'wrap',
    fontSize: '0.75rem',
    color: '#b7c5d8',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: 600,
  },
  legendSwatch: {
    width: '10px',
    height: '10px',
    borderRadius: '999px',
  },
  note: {
    fontSize: '0.85rem',
    color: '#9aa9bc',
    margin: 0,
    marginTop: '1rem',
  },
};
