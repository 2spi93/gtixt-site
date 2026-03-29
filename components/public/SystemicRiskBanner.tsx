import type { SystemicRisk } from '@/lib/risk-engine'

const LEVEL_CFG = {
  nominal: {
    border: 'rgba(52,211,153,0.18)',
    bg: 'rgba(52,211,153,0.04)',
    dot: '#34d399',
    headlineColor: '#6ee7b7',
    detailColor: '#4b7a62',
  },
  elevated: {
    border: 'rgba(251,191,36,0.28)',
    bg: 'rgba(251,191,36,0.05)',
    dot: '#fbbf24',
    headlineColor: '#fde68a',
    detailColor: '#78600e',
  },
  high: {
    border: 'rgba(239,68,68,0.30)',
    bg: 'rgba(239,68,68,0.06)',
    dot: '#ef4444',
    headlineColor: '#fca5a5',
    detailColor: '#6b2020',
  },
}

export function SystemicRiskBanner({ risk }: { risk: SystemicRisk }) {
  if (risk.totalTracked === 0) return null
  const cfg = LEVEL_CFG[risk.level]
  const trendLabel = risk.level === 'high' ? 'Downtrend' : risk.level === 'elevated' ? 'Volatile' : 'Stable'
  const ratio = Math.max(1, Math.round(risk.stressRatio * 100))

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '12px 18px',
        borderRadius: '12px',
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
      }}
      className="gx-interactive-card"
    >
      {/* Pulse dot */}
      <span style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
        {risk.level !== 'nominal' && (
          <span
            style={{
              position: 'absolute', inset: 0,
              borderRadius: '50%',
              background: cfg.dot,
              opacity: 0.4,
              animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
            }}
          />
        )}
        <span
          style={{
            display: 'inline-block',
            width: '8px', height: '8px',
            borderRadius: '50%',
            background: cfg.dot,
          }}
        />
      </span>

      {/* Label */}
      <span
        style={{
          fontSize: '11px',
          fontWeight: 800,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: cfg.headlineColor,
          whiteSpace: 'nowrap',
        }}
      >
        {risk.headline}
      </span>

      {/* Divider */}
      <span style={{ color: 'rgba(148,163,184,0.25)', fontSize: '12px' }}>·</span>

      {/* Detail */}
      <span style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '0.01em' }}>
        {risk.detail}
      </span>

      {/* Strong visual signal badge */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          className={`gx-signal-badge gx-signal-shimmer ${
            risk.level === 'high'
              ? 'gx-signal-badge--high'
              : risk.level === 'elevated'
                ? 'gx-signal-badge--elevated'
                : 'gx-signal-badge--nominal'
          }`}
          style={{ whiteSpace: 'nowrap' }}
        >
          {risk.level.toUpperCase()} RISK
        </span>
        <span style={{ color: cfg.headlineColor, fontSize: '13px', fontWeight: 800, letterSpacing: '0.01em' }}>
          {ratio}%
        </span>
        <span style={{ color: cfg.detailColor, fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {trendLabel}
        </span>
      </div>
    </div>
  )
}
