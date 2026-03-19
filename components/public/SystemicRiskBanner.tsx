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

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 18px',
        borderRadius: '12px',
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
      }}
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
          fontSize: '10px',
          fontWeight: 700,
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

      {/* Stress ratio pill */}
      {risk.level !== 'nominal' && (
        <span
          style={{
            marginLeft: 'auto',
            flexShrink: 0,
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: cfg.headlineColor,
            padding: '2px 8px',
            borderRadius: '999px',
            background: `${cfg.dot}18`,
            border: `1px solid ${cfg.border}`,
          }}
        >
          {(risk.stressRatio * 100).toFixed(0)}% stress
        </span>
      )}
    </div>
  )
}
