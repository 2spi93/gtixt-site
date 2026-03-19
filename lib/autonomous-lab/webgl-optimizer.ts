import type { ExperimentMetrics } from './types'

export interface WebglOptimizationAction {
  issue: string
  suggestion: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
}

type TelemetryEvent = {
  kind: string
  ts: number
  value?: number
  severity?: string
  frameTime?: number
  drawCalls?: number
  gpuTier?: string
  device?: string
}

export async function analyzeWebglTelemetry(baseUrl: string): Promise<{
  summary: Record<string, number>
  optimizationHints: string[]
  optimizationActions: WebglOptimizationAction[]
  metrics: ExperimentMetrics
}> {
  const response = await fetch(`${baseUrl}/api/telemetry/webgl?limit=500&maxAgeSec=1800`, { cache: 'no-store' })
  if (!response.ok) {
    return {
      summary: { events: 0 },
      optimizationHints: ['No telemetry available from /api/telemetry/webgl'],
      optimizationActions: [],
      metrics: { perfDelta: 0, qualityDelta: 0 },
    }
  }

  const payload = await response.json()
  const events: TelemetryEvent[] = Array.isArray(payload?.events) ? payload.events : []

  const fpsSamples = events.filter((e) => e.kind === 'fps_sample' && typeof e.value === 'number')
  const avgFps = fpsSamples.length > 0
    ? fpsSamples.reduce((acc, e) => acc + Number(e.value || 0), 0) / fpsSamples.length
    : 0
  const avgFrameTime = fpsSamples.length > 0
    ? fpsSamples.reduce((acc, e) => acc + Number(e.frameTime || 0), 0) / fpsSamples.length
    : 0
  const avgDrawCalls = fpsSamples.length > 0
    ? fpsSamples.reduce((acc, e) => acc + Number(e.drawCalls || 0), 0) / fpsSamples.length
    : 0

  const criticalCount = events.filter((e) => e.severity === 'critical').length
  const warningCount = events.filter((e) => e.severity === 'warning').length
  const oomSignals = events.filter((e) => e.kind === 'oom_signal').length
  const firstFrame = events.filter((e) => e.kind === 'first_frame' && typeof e.value === 'number')
  const avgFirstFrameMs = firstFrame.length > 0
    ? firstFrame.reduce((acc, e) => acc + Number(e.value || 0), 0) / firstFrame.length
    : 0

  const hints: string[] = []
  const actions: WebglOptimizationAction[] = []
  if (avgFps > 0 && avgFps < 35) {
    hints.push('Enable aggressive LOD and reduce shader complexity for globe layers.')
    actions.push({
      issue: 'lowFps',
      suggestion: 'enableAdaptiveLod',
      impact: avgFps < 25 ? 'high' : 'medium',
      confidence: avgFps < 25 ? 0.86 : 0.74,
    })
  }
  if (avgFrameTime > 24) {
    hints.push('Frame-time is elevated (>24ms). Consider reducing expensive post-processing passes.')
    actions.push({
      issue: 'frameTimePressure',
      suggestion: 'reducePostProcessingPasses',
      impact: avgFrameTime > 32 ? 'high' : 'medium',
      confidence: avgFrameTime > 32 ? 0.84 : 0.71,
    })
  }
  if (avgDrawCalls > 1800) {
    hints.push('Draw-call pressure is high. Merge geometries and reduce transparent overlays.')
    actions.push({
      issue: 'drawCallPressure',
      suggestion: 'useInstancedMesh',
      impact: 'high',
      confidence: 0.82,
    })
  }
  if (oomSignals > 0) {
    hints.push('Reduce texture memory budget and enable asset streaming for heavy scenes.')
    actions.push({
      issue: 'gpuMemoryPressure',
      suggestion: 'enableTextureStreaming',
      impact: 'high',
      confidence: 0.88,
    })
  }
  if (avgFirstFrameMs > 1800) {
    hints.push('Precompile shaders and defer non-critical entities after first frame.')
    actions.push({
      issue: 'slowFirstFrame',
      suggestion: 'precompileShadersAndDeferNonCriticalEntities',
      impact: avgFirstFrameMs > 2800 ? 'high' : 'medium',
      confidence: avgFirstFrameMs > 2800 ? 0.85 : 0.73,
    })
  }
  if (criticalCount > 0) {
    hints.push('Add runtime safety fallback to static map when critical telemetry spikes.')
    actions.push({
      issue: 'criticalRuntimeErrors',
      suggestion: 'fallbackToStaticMap',
      impact: 'high',
      confidence: 0.9,
    })
  }
  if (hints.length === 0) {
    hints.push('Current telemetry is healthy; continue with A/B micro-optimizations only.')
  }

  return {
    summary: {
      events: events.length,
      avgFps: Number(avgFps.toFixed(2)),
      criticalCount,
      warningCount,
      oomSignals,
      avgFirstFrameMs: Number(avgFirstFrameMs.toFixed(2)),
      avgFrameTime: Number(avgFrameTime.toFixed(2)),
      avgDrawCalls: Number(avgDrawCalls.toFixed(2)),
      topGpuTier: payload?.summary?.topGpuTier || 'unknown',
      topDevice: payload?.summary?.topDevice || 'unknown',
    },
    optimizationHints: hints,
    optimizationActions: actions,
    metrics: {
      perfDelta: Number((avgFps - 40).toFixed(2)),
      qualityDelta: -criticalCount,
    },
  }
}
