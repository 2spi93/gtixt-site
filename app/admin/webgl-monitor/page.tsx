'use client'

/**
 * WebGL Performance Monitor — Admin
 *
 * Live dashboard for the Globe v2 production observation window:
 *  - FPS gauge, frame-time p99, first-frame latency
 *  - Error rate (per minute), OOM signals
 *  - Feature flag status + one-click rollback toggle
 *  - Last 50 telemetry events table
 *  - Auto-refreshes every 15s during first-hour observation window
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'

interface TelemetryEvent {
  kind: string
  ts: number
  value?: number
  label?: string
  severity?: string
  ua?: string
  dpr?: number
}

interface FlagInfo {
  enabled: boolean
  rolloutPct?: number
  description?: string
}

interface FeatureFlags {
  globe_v2: FlagInfo
  anomaly_panel: FlagInfo
  cluster_intelligence: FlagInfo
  arc_cinematic: FlagInfo
}

interface Metrics {
  latestFps: number | null
  fpsP10: number | null  // worst 10% — lowest fps samples
  frameP99: number | null
  firstFrameMs: number | null
  errorCount1m: number
  oomCount: number
  assetFailures: number
  totalSamples: number
}

function deriveMetrics(events: TelemetryEvent[]): Metrics {
  const now = Date.now()
  const window1m = events.filter((e) => now - e.ts < 60_000)

  const fpsSamples = events.filter((e) => e.kind === 'fps_sample' && typeof e.value === 'number')
  const fpsValues = fpsSamples.map((e) => e.value as number).sort((a, b) => a - b)
  const frameTimes = fpsSamples.map((e) => (e.value && e.value > 0 ? 1000 / e.value : 999)).sort((a, b) => a - b)

  return {
    latestFps: fpsSamples.length > 0 ? (fpsSamples[fpsSamples.length - 1].value ?? null) : null,
    fpsP10: fpsValues.length > 0 ? (fpsValues[Math.floor(fpsValues.length * 0.1)] ?? null) : null,
    frameP99: frameTimes.length > 0 ? (frameTimes[Math.floor(frameTimes.length * 0.99)] ?? null) : null,
    firstFrameMs: events.find((e) => e.kind === 'first_frame')?.value ?? null,
    errorCount1m: window1m.filter((e) => e.kind === 'error').length,
    oomCount: events.filter((e) => e.kind === 'oom_signal').length,
    assetFailures: events.filter((e) => e.kind === 'asset_failure').length,
    totalSamples: events.length,
  }
}

const THRESHOLDS = { fps: 30, frameP99: 120, firstFrame: 4000, errors1m: 5 }

function severityColor(value: number | null, threshold: number, invert = false): string {
  if (value === null) return 'text-slate-400'
  const bad = invert ? value > threshold : value < threshold
  return bad ? 'text-red-400' : value === threshold ? 'text-amber-400' : 'text-emerald-400'
}

export default function WebGLMonitorPage() {
  const [events, setEvents] = useState<TelemetryEvent[]>([])
  const [flags, setFlags] = useState<FeatureFlags | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [evRes, flagRes] = await Promise.all([
        fetch('/api/telemetry/webgl?limit=200'),
        fetch('/api/feature-flags'),
      ])
      if (evRes.ok) {
        const data = await evRes.json()
        setEvents(data.events ?? [])
      }
      if (flagRes.ok) {
        const data = await flagRes.json()
        setFlags(data.flags ?? null)
      }
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(fetchData, 15_000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoRefresh, fetchData])

  const metrics = deriveMetrics(events)
  const recentEvents = [...events].reverse().slice(0, 50)

  const kindIcon: Record<string, string> = {
    fps_sample: '📊',
    first_frame: '⏱',
    camera_sweep: '🎬',
    label_render: '🏷',
    anomaly_rings: '⚠️',
    error: '❌',
    oom_signal: '💥',
    asset_failure: '🔴',
  }

  const sevBadge = (sev?: string) => {
    if (sev === 'critical') return <span className="ml-1 rounded-full bg-red-500/20 px-1.5 py-0.5 text-[9px] text-red-300 uppercase">critical</span>
    if (sev === 'warning') return <span className="ml-1 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] text-amber-300 uppercase">warning</span>
    return null
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🌐</span> Globe WebGL Monitor
            <span className="ml-2 rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] text-cyan-300 font-normal uppercase tracking-wider">Production</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active observation window — thresholds: FPS &lt; {THRESHOLDS.fps} | frame p99 &gt; {THRESHOLDS.frameP99}ms | errors &gt; {THRESHOLDS.errors1m}/min
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && <span className="text-[10px] text-slate-500">Refreshed {lastRefresh.toLocaleTimeString()}</span>}
          <button
            type="button"
            onClick={() => setAutoRefresh((v) => !v)}
            className={`rounded-lg px-3 py-1.5 text-xs border transition-colors ${autoRefresh ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200' : 'border-slate-600 bg-slate-800 text-slate-400'}`}
          >
            {autoRefresh ? '⏸ Auto-refresh ON (15s)' : '▶ Auto-refresh OFF'}
          </button>
          <button
            type="button"
            onClick={fetchData}
            className="rounded-lg px-3 py-1.5 text-xs border border-slate-600 bg-slate-800 text-slate-300 hover:text-white"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {loading && <p className="text-slate-400 text-sm">Loading telemetry…</p>}

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          {
            label: 'Latest FPS',
            value: metrics.latestFps?.toFixed(1) ?? '—',
            sub: `p10: ${metrics.fpsP10?.toFixed(1) ?? '—'}`,
            color: severityColor(metrics.latestFps, THRESHOLDS.fps),
            alert: metrics.latestFps !== null && metrics.latestFps < THRESHOLDS.fps,
          },
          {
            label: 'Frame p99',
            value: metrics.frameP99 !== null ? `${metrics.frameP99.toFixed(0)}ms` : '—',
            sub: `threshold: ${THRESHOLDS.frameP99}ms`,
            color: severityColor(metrics.frameP99, THRESHOLDS.frameP99, true),
            alert: metrics.frameP99 !== null && metrics.frameP99 > THRESHOLDS.frameP99,
          },
          {
            label: 'First Frame',
            value: metrics.firstFrameMs !== null ? `${metrics.firstFrameMs.toFixed(0)}ms` : '—',
            sub: `budget: ${THRESHOLDS.firstFrame}ms`,
            color: severityColor(metrics.firstFrameMs, THRESHOLDS.firstFrame, true),
            alert: metrics.firstFrameMs !== null && metrics.firstFrameMs > THRESHOLDS.firstFrame,
          },
          {
            label: 'Errors /min',
            value: String(metrics.errorCount1m),
            sub: `threshold: ${THRESHOLDS.errors1m}`,
            color: severityColor(metrics.errorCount1m === 0 ? 100 : THRESHOLDS.errors1m + 1 - metrics.errorCount1m, THRESHOLDS.errors1m),
            alert: metrics.errorCount1m > THRESHOLDS.errors1m,
          },
          { label: 'OOM Signals', value: String(metrics.oomCount), sub: 'GPU context lost', color: metrics.oomCount > 0 ? 'text-red-400' : 'text-emerald-400', alert: metrics.oomCount > 0 },
          { label: 'Asset Failures', value: String(metrics.assetFailures), sub: '404 / network', color: metrics.assetFailures > 0 ? 'text-amber-400' : 'text-emerald-400', alert: false },
          { label: 'Total Samples', value: String(metrics.totalSamples), sub: 'all time (in-proc)', color: 'text-slate-300', alert: false },
          { label: 'Data Window', value: events.length > 0 ? `${Math.round((Date.now() - Math.min(...events.map((e) => e.ts))) / 60_000)}m` : '—', sub: 'age of oldest event', color: 'text-slate-400', alert: false },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-xl border px-3 py-2.5 ${kpi.alert ? 'border-red-400/50 bg-red-950/30' : 'border-slate-700 bg-slate-900'}`}
          >
            {kpi.alert && <span className="block text-[9px] text-red-400 font-semibold uppercase mb-1">⚠ ALERT</span>}
            <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{kpi.label}</p>
            <p className="text-[9px] text-slate-600">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Feature Flags + Rollback */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">🚩 Feature Flags &amp; Rollback</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {flags
            ? Object.entries(flags).map(([key, flag]) => (
                <div key={key} className={`rounded-lg border px-3 py-2 ${flag.enabled ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-red-500/30 bg-red-950/20'}`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${flag.enabled ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <span className="text-xs font-mono text-slate-200">{key}</span>
                  </div>
                  <p className={`text-[10px] mt-0.5 font-semibold ${flag.enabled ? 'text-emerald-300' : 'text-red-300'}`}>
                    {flag.enabled ? 'ENABLED' : 'DISABLED'}
                    {flag.rolloutPct !== undefined && flag.rolloutPct < 100 && ` (${flag.rolloutPct}%)`}
                  </p>
                  {flag.description && <p className="text-[9px] text-slate-500 mt-0.5">{flag.description}</p>}
                </div>
              ))
            : <p className="col-span-4 text-slate-500 text-xs">Loading flags…</p>}
        </div>
        <div className="mt-3 rounded-lg bg-amber-950/20 border border-amber-400/20 px-3 py-2 text-[11px] text-amber-300">
          <strong>Rollback:</strong> set <code className="bg-black/30 px-1 rounded">GLOBE_V2_ENABLED=false</code> in <code className="bg-black/30 px-1 rounded">.env.local</code> then <code className="bg-black/30 px-1 rounded">systemctl restart gpti-site</code> — takes effect in &lt;5s. No code change required.
        </div>
      </div>

      {/* Live Event Table */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-3">📋 Last {recentEvents.length} Telemetry Events</h2>
        {recentEvents.length === 0 ? (
          <p className="text-slate-500 text-xs">No events yet. Globe telemetry will appear here once a user loads /industry-map.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-700">
                  <th className="pb-1.5 pr-3">Time</th>
                  <th className="pb-1.5 pr-3">Kind</th>
                  <th className="pb-1.5 pr-3">Value</th>
                  <th className="pb-1.5 pr-3">Severity</th>
                  <th className="pb-1.5">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentEvents.map((ev, i) => (
                  <tr key={i} className={ev.severity === 'critical' ? 'bg-red-950/20' : ev.severity === 'warning' ? 'bg-amber-950/10' : ''}>
                    <td className="py-1 pr-3 text-slate-500 font-mono">{new Date(ev.ts).toLocaleTimeString()}</td>
                    <td className="py-1 pr-3 text-slate-300">{kindIcon[ev.kind] ?? '·'} {ev.kind}</td>
                    <td className="py-1 pr-3 font-mono text-slate-200">{ev.value !== undefined ? ev.value.toFixed(2) : '—'}</td>
                    <td className="py-1 pr-3">{sevBadge(ev.severity)}</td>
                    <td className="py-1 text-slate-400 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">{ev.label ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alert Thresholds Reference */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <h2 className="text-sm font-semibold text-slate-200 mb-3">📐 Alert Thresholds</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { metric: 'FPS', alert: '< 30', critical: '< 20', action: 'Reduce lambda, disable micro-animations' },
            { metric: 'Frame p99', alert: '> 120ms', critical: '> 250ms', action: 'Reduce bloom, lower anomaly pool' },
            { metric: 'First Frame', alert: '> 4s', critical: '> 8s', action: 'Check texture loading, CDN cache' },
            { metric: 'Errors /min', alert: '> 5', critical: '> 15', action: 'Check stack trace, flag rollback' },
            { metric: 'OOM Signal', alert: '≥ 1', critical: '≥ 3', action: 'Immediate rollback, heap snapshot' },
            { metric: 'Asset failures', alert: '≥ 3', critical: '≥ 10', action: 'Check CDN / 404s, serve low-res fallback' },
          ].map((row) => (
            <div key={row.metric} className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2">
              <p className="font-semibold text-slate-200">{row.metric}</p>
              <p className="text-amber-300">⚠ {row.alert}</p>
              <p className="text-red-400">🚨 {row.critical}</p>
              <p className="text-slate-500 mt-1">{row.action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-2 text-xs">
        <Link href="/admin/monitoring" className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-slate-300 hover:text-white">↩ System Monitoring</Link>
        <Link href="/admin/logs" className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-slate-300 hover:text-white">📜 Logs</Link>
        <Link href="/api/telemetry/webgl?limit=500" target="_blank" className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-slate-300 hover:text-white">🔗 Raw Telemetry API</Link>
        <Link href="/api/feature-flags" target="_blank" className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-slate-300 hover:text-white">🚩 Feature Flags API</Link>
        <Link href="/industry-map" target="_blank" className="rounded-lg border border-cyan-600/50 bg-cyan-950/30 px-3 py-1.5 text-cyan-300 hover:text-white">🌐 Open Globe</Link>
      </div>
    </div>
  )
}
