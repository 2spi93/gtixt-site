import type { FirmSignal, BestForTag } from '@/lib/signal-engine'
import type { EarlyWarning } from '@/lib/risk-engine'
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

const BREAKDOWN_LABELS = [
  ['payout', 'Payout impact'],
  ['stability', 'Stability impact'],
  ['riskModel', 'Risk model impact'],
  ['consistency', 'Consistency impact'],
] as const

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
  earlyWarning,
}: {
  signal: FirmSignal
  bestFor?: BestForTag[]
  earlyWarning?: EarlyWarning | null
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
      {/* Header — badge (with confidence) + trend + volatility */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <SignalBadge signal={signal} size="md" showConfidence={true} />
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

      {/* Early Warning — if present, shown between header and action */}
      {earlyWarning && (
        <div
          style={{
            borderRadius: '10px',
            border: `1px solid ${earlyWarning.severity === 'caution' ? 'rgba(251,146,60,0.32)' : 'rgba(250,204,21,0.28)'}`,
            background: earlyWarning.severity === 'caution' ? 'rgba(251,146,60,0.07)' : 'rgba(250,204,21,0.05)',
            padding: '10px 14px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>
            {earlyWarning.severity === 'caution' ? '⚠️' : '👁'}
          </span>
          <div>
            <p style={{
              fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: earlyWarning.severity === 'caution' ? '#fdba74' : '#fde68a',
              marginBottom: '3px',
            }}>
              Early Warning — {earlyWarning.label}
            </p>
            <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.55 }}>
              {earlyWarning.description}
            </p>
          </div>
        </div>
      )}

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
          Signal Breakdown
        </p>
        <div style={{ display: 'grid', gap: '8px' }}>
          {BREAKDOWN_LABELS.map(([key, label]) => {
            const value = signal.breakdown[key]
            return (
              <div key={key} style={{ display: 'grid', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{label}</span>
                  <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 600 }}>{value}%</span>
                </div>
                <div
                  style={{
                    height: '6px',
                    borderRadius: '999px',
                    background: 'rgba(148,163,184,0.12)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${value}%`,
                      height: '100%',
                      borderRadius: '999px',
                      background: key === 'payout'
                        ? '#22d3ee'
                        : key === 'stability'
                        ? '#34d399'
                        : key === 'riskModel'
                        ? '#fb923c'
                        : '#a78bfa',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

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
