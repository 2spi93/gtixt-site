import { NextRequest, NextResponse } from 'next/server'
import { sendSlackAlert } from '@/lib/alerting'
import { logEvent } from '@/lib/logEvent'

// In-process ring buffer — last 2000 events per restart
const MAX_IN_MEMORY = 2000
const eventStore: Array<{
  ts: number
  kind: string
  value?: number
  label?: string
  severity?: string
  frameTime?: number
  drawCalls?: number
  gpuTier?: string
  device?: string
  ua?: string
  dpr?: number
}> = []

export interface TelemetryBatch {
  events: Array<{
    kind: string
    ts: number
    value?: number
    label?: string
    severity?: string
    frameTime?: number
    drawCalls?: number
    gpuTier?: string
    device?: string
  }>
  userAgent?: string
  dpr?: number
}

function clampInteger(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, Math.min(max, parsed))
}

/** GET — returns last N stored events (admin use) */
export async function GET(req: NextRequest) {
  const limit = clampInteger(req.nextUrl.searchParams.get('limit'), 200, 1, MAX_IN_MEMORY)
  const kind = req.nextUrl.searchParams.get('kind') ?? null
  const maxAgeSec = clampInteger(req.nextUrl.searchParams.get('maxAgeSec'), 0, 0, 7 * 24 * 60 * 60)
  const minTs = maxAgeSec > 0 ? Date.now() - maxAgeSec * 1000 : null
  const filtered = eventStore.filter((event) => {
    if (kind && event.kind !== kind) return false
    if (minTs !== null && event.ts < minTs) return false
    return true
  })
  const slice = filtered.slice(-limit)

  const fpsValues = slice.filter((e) => typeof e.value === 'number' && e.kind === 'fps_sample').map((e) => Number(e.value))
  const frameTimes = slice.filter((e) => typeof e.frameTime === 'number').map((e) => Number(e.frameTime))
  const drawCalls = slice.filter((e) => typeof e.drawCalls === 'number').map((e) => Number(e.drawCalls))

  const avg = (values: number[]) =>
    values.length > 0 ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : 0

  const topGpuTier =
    slice
      .map((e) => e.gpuTier)
      .filter((v): v is string => Boolean(v))
      .reduce<Record<string, number>>((acc, key) => {
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      }, {})
  const topDevice =
    slice
      .map((e) => e.device)
      .filter((v): v is string => Boolean(v))
      .reduce<Record<string, number>>((acc, key) => {
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      }, {})

  const pickTop = (map: Record<string, number>): string =>
    Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown'

  return NextResponse.json({
    events: slice,
    total: eventStore.length,
    filteredTotal: filtered.length,
    summary: {
      avgFps: avg(fpsValues),
      avgFrameTime: avg(frameTimes),
      avgDrawCalls: avg(drawCalls),
      topGpuTier: pickTop(topGpuTier),
      topDevice: pickTop(topDevice),
      criticalCount: slice.filter((e) => e.severity === 'critical').length,
      warningCount: slice.filter((e) => e.severity === 'warning').length,
    },
    window: {
      kind,
      limit,
      maxAgeSec,
    },
  })
}

/** POST — ingest a telemetry batch from the client */
export async function POST(req: NextRequest) {
  let body: TelemetryBatch
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const { events, userAgent, dpr } = body
  if (!Array.isArray(events)) return NextResponse.json({ error: 'events must be array' }, { status: 400 })

  for (const ev of events) {
    const record = { ...ev, ua: userAgent, dpr }
    if (eventStore.length >= MAX_IN_MEMORY) eventStore.shift()
    eventStore.push(record)

    // Log server-side for structured log aggregation
    logEvent(ev.severity === 'critical' ? 'error' : ev.severity === 'warning' ? 'warn' : 'info', `globe.telemetry.${ev.kind}`, {
      value: ev.value,
      label: ev.label,
      severity: ev.severity,
      frameTime: ev.frameTime,
      drawCalls: ev.drawCalls,
      gpuTier: ev.gpuTier,
      device: ev.device,
      dpr,
    })

    // Route critical events to Slack
    if (ev.severity === 'critical') {
      const kindLabels: Record<string, string> = {
        fps_sample: 'Low FPS',
        error: 'Uncaught Errors > 5/min',
        oom_signal: 'GPU Context Lost / OOM',
        asset_failure: 'Asset Load Failure',
        first_frame: 'Slow First Frame',
      }
      const title = `[GTIXT Globe] ${kindLabels[ev.kind] ?? ev.kind}`
      await sendSlackAlert(
        title,
        `*Kind:* ${ev.kind}\n*Value:* ${ev.value ?? '—'}\n*Detail:* ${ev.label ?? '—'}`,
        'critical',
        { userAgent: userAgent?.slice(0, 80), dpr, ts: new Date(ev.ts).toISOString() }
      ).catch(() => {})
    }

    // Also alert for warning if value crosses hard thresholds
    if (ev.severity === 'warning' && !eventStore.find((e) => e.kind === 'fps_sample' && e.severity === 'critical')) {
      if (ev.kind === 'fps_sample' && typeof ev.value === 'number' && ev.value < 20) {
        // Escalate very low FPS (< 20) to critical Slack
        await sendSlackAlert(
          '[GTIXT Globe] FPS Critical',
          `FPS=${ev.value?.toFixed(1)}. Consider feature-flag rollback.`,
          'critical',
          { label: ev.label }
        ).catch(() => {})
      }
    }
  }

  return NextResponse.json({ ok: true, ingested: events.length })
}
