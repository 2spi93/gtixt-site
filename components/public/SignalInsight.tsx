import type { FirmSignal, BestForTag } from '@/lib/signal-engine'
import { SignalBadge, BestForBadge } from './SignalBadge'

const TREND_ICON: Record<string, string> = {
  up:       '↑',
  down:     '↓',
  sideways: '→',
  volatile: '⇅',
}

const TREND_COLOR: Record<string, string> = {
  up:       '#34d399',
  down:     '#f87171',
  sideways: '#94a3b8',
  volatile: '#fb923c',
}

const VOLATILITY_COLOR: Record<string, string> = {
  low:      '#34d399',
  moderate: '#facc15',
  high:     '#f87171',
}

const ACTION_BORDER: Record<string, string> = {
  deteriorating: 'rgba(239,68,68,0.28)',
  'high-risk':   'rgba(251,146,60,0.28)',
  rising:        'rgba(52,211,153,0.28)',
  stable:        'rgba(148,163,184,0.22)',
  unrated:       'rgba(71,85,105,0.20)',
}

const ACTION_BG: Record<string, string> = {
  deteriorating: 'rgba(239,68,68,0.05)',
  'high-risk':   'rgba(251,146,60,0.05)',
  rising:        'rgba(52,211,153,0.04)',
  stable:        'rgba(148,163,184,0.04)',
  unrated:       'rgba(71,85,105,0.04)',
}

export function SignalInsight({
  signal,
  bestFor = [],
}: {
  signal: FirmSignal
  bestFor?: BestForTag[]
}) {
  const trendIcon  = TREND_ICON[signal.trend]     ?? '→'
  const trendColor = TREND_COLOR[signal.trend]    ?? '#94a3b8'
  const volColor   = VOLATILITY_COLOR[signal.volatility] ?? '#94a3b8'
  const border     = ACTION_BORDER[signal.type]   ?? 'rgba(148,163,184,0.2)'
  const bg         = ACTION_BG[signal.type]       ?? 'rgba(148,163,184,0.04)'

  return (
    <div
      style={{
        borderRadius: '16px',
        border: `1px solid ${border}`,
        background: bg,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}
    >
      {/* Header — badge + trend + volatility */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <SignalBadge signal={signal} size="md" />
        <span style={{ fontSize: '12px', fontWeight: 700, color: trendColor }}>
          {trendIcon} {signal.trend.charAt(0).toUpperCase() + signal.trend.slice(1)} trend
        </span>
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: volColor,
            padding: '2px 7px',
            borderRadius: '999px',
            background: `${volColor}18`,
            border: `1px solid ${volColor}33`,
          }}
        >
          {signal.volatility} volatility
        </span>
      </div>

      {/* Operator recommendation */}
      <div
        style={{
          borderLeft: `3px solid ${border}`,
          paddingLeft: '14px',
        }}
      >
        <p
          style={{
            fontSize: '9px',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            fontWeight: 700,
            marginBottom: '5px',
          }}
        >
          Operator Recommendation
        </p>
        <p style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 600, lineHeight: 1.45 }}>
          {signal.action}
        </p>
      </div>

      {/* Why this signal? — pillar evidence */}
      {signal.evidence.length > 0 && (
        <div>
          <p
            style={{
              fontSize: '9px',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              fontWeight: 700,
              marginBottom: '8px',
            }}
          >
            Why this signal?
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {signal.evidence.map((item) => (
              <span
                key={item}
                style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                  background: 'rgba(148,163,184,0.07)',
                  border: '1px solid rgba(148,163,184,0.14)',
                  borderRadius: '6px',
                  padding: '3px 9px',
                  fontFeatureSettings: '"tnum"',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '0.02em',
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Best For tags */}
      {bestFor.length > 0 && (
        <div>
          <p
            style={{
              fontSize: '9px',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              fontWeight: 700,
              marginBottom: '8px',
            }}
          >
            Best For
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {bestFor.map((tag) => (
              <BestForBadge key={tag} tag={tag} />
            ))}
          </div>
        </div>
      )}

      {/* Footer — source note */}
      <p style={{ fontSize: '10px', color: '#475569', lineHeight: 1.55, marginTop: '-4px' }}>
        {signal.reason} · Derived from current GTIXT validated snapshot. Signal logic is deterministic
        and auditable — not editorial opinion.
      </p>
    </div>
  )
}
