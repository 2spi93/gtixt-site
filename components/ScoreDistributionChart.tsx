'use client';

import React, { useState } from 'react';

interface ScoreDistributionChartProps {
  avgScore: number;
  medianScore: number;
  passRate: number;
  totalFirms: number;
  credibilityRatio?: number | null;
}

export function ScoreDistributionChart({
  avgScore,
  medianScore,
  passRate,
  totalFirms,
  credibilityRatio,
}: ScoreDistributionChartProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  const threshold = 60;
  const maxScore = 100;

  const avgPercent = Math.min(Math.max((avgScore / maxScore) * 100, 0), 100);
  const medianPercent = Math.min(Math.max((medianScore / maxScore) * 100, 0), 100);
  const thresholdPercent = Math.min(Math.max((threshold / maxScore) * 100, 0), 100);
  const credibilityPercent =
    credibilityRatio !== null && credibilityRatio !== undefined
      ? Math.min(Math.max((credibilityRatio / maxScore) * 100, 0), 100)
      : null;

  // Market health interpretation
  const marketHealth = avgScore >= threshold ? 'healthy' : avgScore >= 50 ? 'developing' : 'emerging';
  const healthColor = marketHealth === 'healthy' ? '#28d39d' : marketHealth === 'developing' ? '#f7b731' : '#ff6b6b';
  const healthLabel = marketHealth === 'healthy' ? '🟢 Healthy Market' : marketHealth === 'developing' ? '🟡 Developing Market' : '🔴 Emerging Market';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ flex: 1 }}>
          <div style={styles.kicker}>GTIXT Market Intelligence</div>
          <h3 style={styles.title}>Proprietary Trading Firms Index Distribution</h3>
          <div style={styles.subtitle}>
            Real-time transparency for traders, firms, investors & regulators
          </div>
        </div>
        <div style={styles.headerRight}>
          <span style={{ ...styles.healthBadge, borderColor: healthColor, color: healthColor }}>
            {healthLabel}
          </span>
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={styles.toggleButton}
          >
            {showAdvanced ? '📊 Simple View' : '🎓 Advanced View'}
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div style={styles.chartArea}>
        <div style={styles.railWrap}>
          <div style={styles.railGlow} />
          <div style={styles.rail} />
          
          {/* Gradient Legend Overlay */}
          <div style={styles.gradientLegend}>
            <span style={styles.gradientLabel}>0-40: Insufficient Data</span>
            <span style={styles.gradientLabel}>40-60: Under Review</span>
            <span style={styles.gradientLabel}>60-100: Institutional Grade</span>
          </div>

          {/* Threshold Marker */}
          <div 
            style={{ ...styles.thresholdMarker, left: `${thresholdPercent}%` }}
            onMouseEnter={() => setActiveTooltip('threshold')}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <div style={styles.thresholdPillar} />
            <span style={styles.thresholdLabel}>Threshold {threshold}</span>
            {activeTooltip === 'threshold' && (
              <div style={styles.tooltip}>
                <strong>Institutional Pass Threshold</strong>
                <p>Minimum score of 60/100 required for "institutional grade" classification. Firms scoring above 60/100 meet regulatory transparency & operational standards.</p>
              </div>
            )}
          </div>

          {/* Average Marker */}
          <div 
            style={{ ...styles.beacon, left: `${avgPercent}%` }}
            onMouseEnter={() => setActiveTooltip('avg')}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <div style={styles.beaconDot} />
            <span style={styles.beaconLabel}>Market Avg {avgScore.toFixed(1)}</span>
            {activeTooltip === 'avg' && (
              <div style={styles.tooltip}>
                <strong>Weighted Market Average</strong>
                <p>Mean score across all {totalFirms} firms. Weighted by data completeness. Current: {avgScore.toFixed(1)}/100</p>
              </div>
            )}
          </div>

          {/* Median Marker (only in advanced mode) */}
          {showAdvanced && (
            <div 
              style={{ ...styles.beacon, left: `${medianPercent}%`, top: '65%' }}
              onMouseEnter={() => setActiveTooltip('median')}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              <div style={{ ...styles.beaconDot, backgroundColor: '#f7b731' }} />
              <span style={styles.medianLabel}>Median {medianScore.toFixed(1)}</span>
              {activeTooltip === 'median' && (
                <div style={styles.tooltip}>
                  <strong>Statistical Median</strong>
                  <p>50th percentile - half of firms score above, half below. Median: {medianScore.toFixed(1)}/100. Gap from average: {Math.abs(avgScore - medianScore).toFixed(1)} points.</p>
                </div>
              )}
            </div>
          )}

          {/* Credibility Marker (only in advanced mode) */}
          {showAdvanced && credibilityPercent !== null && (
            <div 
              style={{ ...styles.credibilityMarker, left: `${credibilityPercent}%` }}
              onMouseEnter={() => setActiveTooltip('credibility')}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              <div style={styles.credibilityDiamond} />
              <span style={styles.credibilityLabel}>
                Data Quality {credibilityRatio?.toFixed(0)}%
              </span>
              {activeTooltip === 'credibility' && (
                <div style={styles.tooltip}>
                  <strong>Data Completeness Ratio</strong>
                  <p>Percentage of verified data vs missing fields. {credibilityRatio?.toFixed(0)}% of required data points collected. Higher = more reliable scores.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={styles.scaleRow}>
          {['0', '20', '40', '60', '80', '100'].map((label, idx) => (
            <span key={label} style={{
              ...styles.scaleLabel,
              color: idx === 3 ? '#7a5cff' : '#7f8ea3',
              fontWeight: idx === 3 ? 700 : 600,
            }}>{label}</span>
          ))}
        </div>

        {/* Legend */}
        <div style={styles.legendRow}>
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendSwatch, backgroundColor: '#28d39d' }} />
            Market Average
          </div>
          {showAdvanced && (
            <>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendSwatch, backgroundColor: '#f7b731' }} />
                Statistical Median
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendSwatch, backgroundColor: '#4fb3ff' }} />
                Data Quality
              </div>
            </>
          )}
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendSwatch, backgroundColor: '#7a5cff' }} />
            Pass Threshold (60/100)
          </div>
        </div>
      </div>

      {/* Interpretation Section */}
      <div style={styles.interpretationBox}>
        <div style={styles.interpHeader}>
          <span style={styles.interpIcon}>💡</span>
          <strong>What This Means For You</strong>
        </div>
        
        {/* For Traders */}
        <div style={styles.interpSection}>
          <div style={styles.interpRole}>👤 Traders:</div>
          <div style={styles.interpText}>
            {avgScore < threshold 
              ? `⚠️ Market average (${avgScore.toFixed(1)}/100) is BELOW the institutional threshold of 60/100. Exercise caution - only ${passRate}% of firms meet industry standards. Verify firm credentials independently.`
              : `✅ Market average (${avgScore.toFixed(1)}/100) meets institutional standards. ${passRate}% of firms pass the 60/100 threshold score. Choose firms scoring above 60/100 for lower risk.`
            }
          </div>
        </div>

        {/* For Firms */}
        <div style={styles.interpSection}>
          <div style={styles.interpRole}>🏢 Firms:</div>
          <div style={styles.interpText}>
            {avgScore < threshold
              ? `To reach the institutional threshold of 60/100 (currently ${(threshold - avgScore).toFixed(1)} points away), improve data transparency, regulatory compliance, and operational standards. Check /methodology for score breakdown.`
              : `Industry benchmark: ${avgScore.toFixed(1)}/100. To stand out, target scores above ${(avgScore + 10).toFixed(1)}/100 by enhancing transparency and client protections.`
            }
          </div>
        </div>

        {/* For Investors/Analysts */}
        {showAdvanced && (
          <div style={styles.interpSection}>
            <div style={styles.interpRole}>📊 Analysts & Investors:</div>
            <div style={styles.interpText}>
              Distribution analysis: Average {avgScore.toFixed(1)}, Median {medianScore.toFixed(1)} (spread: {Math.abs(avgScore - medianScore).toFixed(1)}), Pass rate {passRate}%. 
              {credibilityRatio !== null && ` Data completeness: ${credibilityRatio.toFixed(0)}%.`}
              {Math.abs(avgScore - medianScore) < 2 
                ? ' Symmetric distribution suggests consistent market standards.'
                : ' Asymmetric distribution indicates market fragmentation.'
              }
            </div>
          </div>
        )}
      </div>

      {/* CTA Footer */}
      <div style={styles.ctaFooter}>
        <a href="/methodology" style={styles.ctaLink}>
          📖 Understand the Scoring Methodology
        </a>
        <a href="/rankings" style={styles.ctaLink}>
          🔍 Explore Individual Firm Rankings
        </a>
        {passRate === 0 && (
          <a href="/integrity" style={{ ...styles.ctaLink, color: '#ff6b6b' }}>
            ⚠️ Why No Firms Pass? (Data Update in Progress)
          </a>
        )}
      </div>

      <p style={styles.note}>
        Analyzing {totalFirms} proprietary trading firms. Distribution currently sits {avgScore >= threshold ? 'above' : 'below'} the institutional threshold score of 60/100. 
        {credibilityRatio !== null && credibilityRatio < 20 && ' ⚠️ Low data completeness - scores are provisional.'}
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginTop: '2rem',
    padding: '2rem',
    borderRadius: '24px',
    border: '1px solid rgba(39, 57, 73, 0.35)',
    background: 'radial-gradient(circle at 10% 0%, rgba(40, 211, 157, 0.12), transparent 45%), radial-gradient(circle at 80% 20%, rgba(122, 92, 255, 0.18), transparent 45%), #0b0f14',
    color: '#dbe5f0',
    fontFamily: '"Space Grotesk", "IBM Plex Sans", system-ui, sans-serif',
    boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.75rem',
    gap: '1.5rem',
    flexWrap: 'wrap',
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
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#eaf2ff',
    margin: 0,
    marginBottom: '0.4rem',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: '#9aa9bc',
    fontStyle: 'italic',
  },
  headerRight: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    alignItems: 'flex-end',
  },
  healthBadge: {
    fontSize: '0.85rem',
    fontWeight: 700,
    padding: '0.5rem 1rem',
    borderRadius: '999px',
    border: '2px solid',
    backgroundColor: 'rgba(0,0,0,0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  toggleButton: {
    fontSize: '0.8rem',
    fontWeight: 600,
    padding: '0.5rem 1rem',
    borderRadius: '12px',
    background: 'linear-gradient(120deg, rgba(122, 92, 255, 0.2), rgba(79, 179, 255, 0.2))',
    color: '#c7d8ff',
    border: '1px solid rgba(122, 92, 255, 0.4)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
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
    marginBottom: '1.5rem',
  },
  railWrap: {
    position: 'relative',
    height: '150px',
    borderRadius: '18px',
    background: 'linear-gradient(120deg, rgba(15, 22, 31, 0.9), rgba(9, 13, 19, 0.95))',
    border: '1px solid rgba(123, 140, 158, 0.25)',
    overflow: 'visible',
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
    height: '10px',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #ff6b6b 0%, #f7b731 45%, #28d39d 65%, #7a5cff 100%)',
    boxShadow: '0 0 24px rgba(40, 211, 157, 0.25)',
    transform: 'translateY(-50%)',
  },
  gradientLegend: {
    position: 'absolute',
    bottom: '8px',
    left: '5%',
    right: '5%',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.65rem',
    color: '#7f8ea3',
    fontWeight: 600,
  },
  gradientLabel: {
    flex: 1,
    textAlign: 'center',
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%) translateY(-8px)',
    backgroundColor: 'rgba(15, 22, 31, 0.98)',
    border: '1px solid rgba(123, 140, 158, 0.4)',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    minWidth: '220px',
    maxWidth: '280px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    zIndex: 1000,
    fontSize: '0.8rem',
    lineHeight: 1.5,
    color: '#cbd7e6',
    pointerEvents: 'none',
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
    fontSize: '0.75rem',
    color: '#fff',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    backgroundColor: 'rgba(122, 92, 255, 0.95)',
    padding: '0.25rem 0.6rem',
    borderRadius: '6px',
    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
    boxShadow: '0 4px 12px rgba(122, 92, 255, 0.6)',
    border: '1px solid rgba(255,255,255,0.3)',
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
    fontSize: '0.75rem',
    color: '#fff',
    fontWeight: 700,
    backgroundColor: 'rgba(40, 211, 157, 0.95)',
    padding: '0.25rem 0.6rem',
    borderRadius: '6px',
    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
    boxShadow: '0 4px 12px rgba(40, 211, 157, 0.6)',
    border: '1px solid rgba(255,255,255,0.3)',
  },
  medianLabel: {
    fontSize: '0.75rem',
    color: '#fff',
    fontWeight: 700,
    backgroundColor: 'rgba(247, 183, 49, 0.95)',
    padding: '0.25rem 0.6rem',
    borderRadius: '6px',
    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
    boxShadow: '0 4px 12px rgba(247, 183, 49, 0.6)',
    border: '1px solid rgba(255,255,255,0.3)',
  },
  credibilityMarker: {
    position: 'absolute',
    top: '18%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.35rem',
  },
  credibilityDiamond: {
    width: '12px',
    height: '12px',
    backgroundColor: '#4fb3ff',
    transform: 'rotate(45deg)',
    boxShadow: '0 0 16px rgba(79, 179, 255, 0.7)',
    borderRadius: '2px',
  },
  credibilityLabel: {
    fontSize: '0.75rem',
    color: '#fff',
    fontWeight: 700,
    backgroundColor: 'rgba(79, 179, 255, 0.95)',
    padding: '0.25rem 0.6rem',
    borderRadius: '6px',
    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
    boxShadow: '0 4px 12px rgba(79, 179, 255, 0.6)',
    border: '1px solid rgba(255,255,255,0.3)',
    whiteSpace: 'nowrap',
  },
  interpretationBox: {
    marginTop: '2rem',
    padding: '1.5rem',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, rgba(122, 92, 255, 0.08), rgba(40, 211, 157, 0.08))',
    border: '1px solid rgba(123, 140, 158, 0.2)',
  },
  interpHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1rem',
    fontWeight: 700,
    color: '#eaf2ff',
    marginBottom: '1rem',
  },
  interpIcon: {
    fontSize: '1.3rem',
  },
  interpSection: {
    marginBottom: '1rem',
    paddingLeft: '0.5rem',
    borderLeft: '3px solid rgba(122, 92, 255, 0.3)',
  },
  interpRole: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#c7d8ff',
    marginBottom: '0.4rem',
  },
  interpText: {
    fontSize: '0.85rem',
    color: '#b7c5d8',
    lineHeight: 1.6,
  },
  ctaFooter: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  ctaLink: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#4fb3ff',
    textDecoration: 'none',
    padding: '0.6rem 1rem',
    borderRadius: '8px',
    border: '1px solid rgba(79, 179, 255, 0.3)',
    backgroundColor: 'rgba(79, 179, 255, 0.1)',
    transition: 'all 0.2s ease',
    display: 'inline-block',
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
