import type { FirmSignal, BestForTag } from '@/lib/signal-engine'

// ─── Signal Badge ────────────────────────────────────────────────────────────

const SIGNAL_CFG: Record<
  string,
  { dot: string; bg: string; border: string; text: string }
> = {
  deteriorating: {
    dot: '#f87171',
    bg: 'rgba(239,68,68,0.10)',
    border: 'rgba(239,68,68,0.28)',
    text: '#fca5a5',
  },
  'high-risk': {
    dot: '#fb923c',
    bg: 'rgba(251,146,60,0.10)',
    border: 'rgba(251,146,60,0.28)',
    text: '#fdba74',
  },
  rising: {
    dot: '#34d399',
    bg: 'rgba(52,211,153,0.08)',
    border: 'rgba(52,211,153,0.28)',
    text: '#6ee7b7',
  },
  stable: {
    dot: '#94a3b8',
    bg: 'rgba(148,163,184,0.08)',
    border: 'rgba(148,163,184,0.22)',
    text: '#cbd5e1',
  },
  unrated: {
    dot: '#475569',
    bg: 'rgba(71,85,105,0.08)',
    border: 'rgba(71,85,105,0.20)',
    text: '#64748b',
  },
}

export function SignalBadge({
  signal,
  size = 'sm',
}: {
  signal: FirmSignal
  size?: 'sm' | 'md'
}) {
  const cfg = SIGNAL_CFG[signal.type] ?? SIGNAL_CFG.unrated
  const pad = size === 'md' ? '5px 11px' : '3px 8px'
  const fontSize = size === 'md' ? '11px' : '9px'
  const dotSize = size === 'md' ? '7px' : '5px'

  return (
    <span
      title={signal.reason}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: pad,
        borderRadius: '999px',
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
        color: cfg.text,
        whiteSpace: 'nowrap' as const,
        cursor: 'default',
      }}
    >
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      {signal.label}
    </span>
  )
}

// ─── Best For Badge ───────────────────────────────────────────────────────────

const BEST_FOR_CFG: Record<BestForTag, { label: string; color: string }> = {
  conservative: { label: 'Conservative', color: '#6ee7b7' },
  'fast-payouts': { label: 'Fast Payouts', color: '#67e8f9' },
  'high-capital': { label: 'High Capital', color: '#a78bfa' },
  'new-traders': { label: 'New Traders', color: '#fdba74' },
}

export function BestForBadge({ tag }: { tag: BestForTag }) {
  const cfg = BEST_FOR_CFG[tag]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 7px',
        borderRadius: '999px',
        border: `1px solid ${cfg.color}33`,
        background: `${cfg.color}12`,
        fontSize: '9px',
        fontWeight: 600,
        letterSpacing: '0.10em',
        textTransform: 'uppercase' as const,
        color: cfg.color,
        whiteSpace: 'nowrap' as const,
      }}
    >
      {cfg.label}
    </span>
  )
}
