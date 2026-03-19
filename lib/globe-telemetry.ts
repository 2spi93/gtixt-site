/**
 * Globe WebGL Telemetry — client-side event collector
 * Batches perf samples and forwards to /api/telemetry/webgl.
 * Tracks FPS, frame time p99, first-frame time, camera sweeps,
 * uncaught errors, and GPU OOM signals.
 *
 * Thresholds (initial prod values, aligned with rollout guide):
 *   FPS        < 30  → warning alert
 *   frameP99   > 120 ms → warning alert
 *   errors     > 5 /min → critical alert
 *   firstFrame > 4000 ms → warning alert
 */

export type TelemetryEventKind =
  | 'fps_sample'
  | 'first_frame'
  | 'camera_sweep'
  | 'label_render'
  | 'anomaly_rings'
  | 'error'
  | 'oom_signal'
  | 'asset_failure'

export interface TelemetryEvent {
  kind: TelemetryEventKind
  ts: number       // epoch ms
  value?: number   // fps / duration ms / count
  label?: string   // extra context
  severity?: 'info' | 'warning' | 'critical'
  frameTime?: number
  drawCalls?: number
  gpuTier?: string
  device?: string
}

// Rolling ring-buffer for frame times (last 600 frames ≈ 10s @60fps)
const FRAME_BUFFER_SIZE = 600
const frameBuffer: number[] = new Array(FRAME_BUFFER_SIZE).fill(0)
let fbHead = 0
let fbCount = 0

function recordFrameTime(ms: number) {
  frameBuffer[fbHead] = ms
  fbHead = (fbHead + 1) % FRAME_BUFFER_SIZE
  if (fbCount < FRAME_BUFFER_SIZE) fbCount++
}

function frameP99(): number {
  if (fbCount === 0) return 0
  const slice = frameBuffer.slice(0, fbCount).sort((a, b) => a - b)
  return slice[Math.floor(slice.length * 0.99)] ?? 0
}

// Event queue — flushed every 30s or on critical events
const queue: TelemetryEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let initTs: number | null = null
let errorCountInWindow = 0
let errorWindowStart = 0

export const GlobeTelemetry = {
  /** Call once at globe init to anchor the startup timer. */
  start() {
    initTs = performance.now()
    errorWindowStart = Date.now()
    errorCountInWindow = 0
    const profile = readDeviceProfile()
    queue.push({
      kind: 'label_render',
      ts: Date.now(),
      severity: 'info',
      label: `device_profile:${profile.device}|gpu:${profile.gpuTier}`,
      device: profile.device,
      gpuTier: profile.gpuTier,
      value: Number(profile.deviceMemory ?? 0),
    })
    scheduleFlush()
  },

  /** Called every rendered frame — measures FPS and frame time. */
  recordFrame(deltaMs: number, drawCalls?: number) {
    recordFrameTime(deltaMs)
    const fps = deltaMs > 0 ? 1000 / deltaMs : 0
    if (fbCount % 60 === 0) {
      // Sample every ~60 frames
      const p99 = frameP99()
      const profile = readDeviceProfile()
      const ev: TelemetryEvent = {
        kind: 'fps_sample',
        ts: Date.now(),
        value: fps,
        frameTime: deltaMs,
        drawCalls,
        gpuTier: profile.gpuTier,
        device: profile.device,
      }
      queue.push(ev)
      if (fps < 30) {
        flush({
          kind: 'fps_sample',
          ts: Date.now(),
          value: fps,
          frameTime: deltaMs,
          drawCalls,
          gpuTier: profile.gpuTier,
          device: profile.device,
          severity: 'warning',
          label: `FPS dropped to ${fps.toFixed(1)}, p99=${p99.toFixed(0)}ms`,
        })
      } else if (p99 > 120) {
        flush({
          kind: 'fps_sample',
          ts: Date.now(),
          value: fps,
          frameTime: p99,
          drawCalls,
          gpuTier: profile.gpuTier,
          device: profile.device,
          severity: 'warning',
          label: `Frame p99 ${p99.toFixed(0)}ms`,
        })
      }
    }
  },

  /** Call when first frame is committed (after readyReported). */
  firstFrame() {
    if (!initTs) return
    const ms = performance.now() - initTs
    const ev: TelemetryEvent = { kind: 'first_frame', ts: Date.now(), value: ms, severity: ms > 4000 ? 'warning' : 'info' }
    queue.push(ev)
    if (ms > 4000) flush(ev)
    performance.mark('globe:firstFrame', { detail: { ms } })
  },

  /** Call when a cinematic camera sweep begins with its expected duration. */
  cameraSweepStart(durationMs: number) {
    performance.mark('globe:cameraSweepStart')
    queue.push({ kind: 'camera_sweep', ts: Date.now(), value: durationMs, label: 'start' })
  },

  /** Call when the sweep completes. */
  cameraSweepEnd() {
    try {
      performance.measure('globe:cameraSweep', 'globe:cameraSweepStart')
      const entries = performance.getEntriesByName('globe:cameraSweep')
      const last = entries[entries.length - 1]
      if (last) queue.push({ kind: 'camera_sweep', ts: Date.now(), value: last.duration, label: 'end' })
    } catch { /* mark may not exist if sweep was cancelled */ }
  },

  /** Call after labels are rendered: pass wall-clock time for the batch. */
  labelRenderTime(ms: number) {
    queue.push({ kind: 'label_render', ts: Date.now(), value: ms })
  },

  /** Call with the current active anomaly ring count on each tick. */
  anomalyRingCount(count: number) {
    // Only push if changed — avoids flooding
    const last = queue.findLast?.((e) => e.kind === 'anomaly_rings')
    if (!last || last.value !== count) {
      queue.push({ kind: 'anomaly_rings', ts: Date.now(), value: count })
    }
  },

  /** Record an uncaught or globe-level error. Triggers critical alert if > 5/min. */
  recordError(message: string, stack?: string) {
    const now = Date.now()
    if (now - errorWindowStart > 60_000) {
      errorCountInWindow = 0
      errorWindowStart = now
    }
    errorCountInWindow++
    const ev: TelemetryEvent = {
      kind: 'error',
      ts: now,
      label: String(message).slice(0, 200) + (stack ? ` | ${String(stack).slice(0, 200)}` : ''),
      severity: errorCountInWindow > 5 ? 'critical' : 'warning',
    }
    queue.push(ev)
    if (errorCountInWindow > 5) flush(ev)
  },

  /** Record GPU OOM / context lost signal. Always flushes immediately as critical. */
  oomSignal(label = 'webgl context lost') {
    const ev: TelemetryEvent = { kind: 'oom_signal', ts: Date.now(), label, severity: 'critical' }
    queue.push(ev)
    flush(ev)
  },

  /** Asset 404 / network failure for globe textures. */
  assetFailure(url: string) {
    queue.push({ kind: 'asset_failure', ts: Date.now(), label: url, severity: 'warning' })
  },

  /** Force-flush the queue now (call on component unmount). */
  flush: flushNow,
}

function scheduleFlush() {
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => {
    flushNow()
    scheduleFlush()
  }, 30_000) // flush every 30s during observation window
}

async function flushNow(priorityEvent?: TelemetryEvent) {
  if (typeof window === 'undefined') return
  const payload = priorityEvent
    ? [priorityEvent, ...queue.splice(0)]
    : queue.splice(0)
  if (payload.length === 0) return
  try {
    await fetch('/api/telemetry/webgl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: payload, userAgent: navigator.userAgent, dpr: window.devicePixelRatio }),
      keepalive: true,
    })
  } catch { /* never throw in telemetry */ }
}

// Named alias for the exported flush so it can reference itself
function flush(ev: TelemetryEvent) {
  void flushNow(ev)
}

type DeviceProfile = {
  device: string
  gpuTier: string
  deviceMemory?: number
}

let cachedProfile: DeviceProfile | null = null

function readDeviceProfile(): DeviceProfile {
  if (cachedProfile) return cachedProfile
  if (typeof window === 'undefined') {
    cachedProfile = { device: 'unknown', gpuTier: 'unknown' }
    return cachedProfile
  }

  const ua = navigator.userAgent || ''
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const cores = navigator.hardwareConcurrency || 0
  const isMobile = /Android|iPhone|iPad|Mobile/i.test(ua)
  const device = isMobile ? 'mobile' : 'desktop'

  let gpuTier = 'unknown'
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (gl) {
      const dbg = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info')
      const renderer = dbg
        ? (gl as WebGLRenderingContext).getParameter(dbg.UNMASKED_RENDERER_WEBGL)
        : ''
      const r = String(renderer || '').toLowerCase()
      if (/rtx|radeon rx|apple m3|apple m2|max|pro/.test(r)) gpuTier = 'high'
      else if (/gtx|iris|apple m1|adreno|radeon|arc/.test(r)) gpuTier = 'medium'
      else if (r) gpuTier = 'low'
    }
  } catch {
    gpuTier = 'unknown'
  }

  if (gpuTier === 'unknown') {
    if ((mem ?? 0) >= 8 || cores >= 12) gpuTier = 'high'
    else if ((mem ?? 0) >= 4 || cores >= 8) gpuTier = 'medium'
    else gpuTier = 'low'
  }

  cachedProfile = { device, gpuTier, deviceMemory: mem }
  return cachedProfile
}
