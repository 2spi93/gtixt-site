import { NextRequest, NextResponse } from 'next/server'
import {
  ensureCanaryStickyKey,
  resolveCanaryTrafficForModule,
} from '@/lib/autonomous-lab/canary-policy'

/**
 * Feature flags API — server-side source of truth.
 *
 * Flags are controlled via environment variables (no external service needed):
 *   GLOBE_V2_ROLLOUT_PCT   0–100  (default 100 — fully live)
 *   GLOBE_V2_ENABLED       "true"|"false"  (master kill-switch)
 *   ANOMALY_PANEL_ENABLED  "true"|"false"  (default true)
 *   CLUSTER_PANEL_ENABLED  "true"|"false"  (default true)
 *   ARC_CINEMATIC_ENABLED  "true"|"false"  (default true)
 *
 * To perform a rollback: set GLOBE_V2_ENABLED=false and restart the service.
 * For canary: set GLOBE_V2_ROLLOUT_PCT=10 — the client will use a stable hash
 * of the user's session to decide whether it falls in the cohort.
 */
export async function GET(request: NextRequest) {
  const rolloutPct = Math.min(100, Math.max(0, Number(process.env.GLOBE_V2_ROLLOUT_PCT ?? 100)))
  const masterEnabled = process.env.GLOBE_V2_ENABLED !== 'false'
  const stickyCookie = request.cookies.get('gtixt_canary_sid')?.value
  const stickyKey = ensureCanaryStickyKey(stickyCookie)
  const canary = await resolveCanaryTrafficForModule({ module: 'webgl', stickyKey }).catch((error) => {
    console.error('[feature-flags] failed to resolve canary traffic, falling back to baseline', error)
    return {
      active: false,
      module: 'webgl' as const,
      variant: 'baseline' as const,
      trafficPct: rolloutPct,
      canaryId: null,
      promotionId: null,
      experimentId: null,
      stickyKey,
      reason: 'canary resolution failed; using baseline feature flags',
    }
  })

  const canaryEnabled = canary.active
    ? masterEnabled && canary.variant === 'candidate'
    : masterEnabled

  const effectiveRolloutPct = canary.active ? canary.trafficPct : rolloutPct

  const response = NextResponse.json({
    flags: {
      globe_v2: {
        enabled: canaryEnabled,
        rolloutPct: effectiveRolloutPct,
        canary: {
          active: canary.active,
          variant: canary.variant,
          trafficPct: canary.trafficPct,
          canaryId: canary.canaryId,
          promotionId: canary.promotionId,
          experimentId: canary.experimentId,
          stickyKey: canary.stickyKey,
          reason: canary.reason,
        },
        description: 'GTIXTGlobe v2 — cinematic focus, arc selection, anomaly rings, HiDPI labels',
      },
      anomaly_panel: {
        enabled: process.env.ANOMALY_PANEL_ENABLED !== 'false',
        rolloutPct: 100,
        description: 'Slide-in anomaly radar panel',
      },
      cluster_intelligence: {
        enabled: process.env.CLUSTER_PANEL_ENABLED !== 'false',
        rolloutPct: 100,
        description: 'K-means cluster intelligence section',
      },
      arc_cinematic: {
        enabled: process.env.ARC_CINEMATIC_ENABLED !== 'false',
        rolloutPct: 100,
        description: 'Cinematic arc selection sweep in globe',
      },
    },
    ts: Date.now(),
  })

  response.cookies.set({
    name: 'gtixt_canary_sid',
    value: stickyKey,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })

  return response
}
