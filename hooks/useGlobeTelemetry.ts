'use client'

import { useEffect, useRef, useCallback } from 'react'
import { GlobeTelemetry } from '@/lib/globe-telemetry'

interface UseGlobeTelemetryOptions {
  /** Session or user id used for stable cohort hashing */
  sessionKey?: string
  enabled?: boolean
}

interface FeatureFlags {
  globe_v2: { enabled: boolean; rolloutPct: number }
  anomaly_panel: { enabled: boolean }
  cluster_intelligence: { enabled: boolean }
  arc_cinematic: { enabled: boolean }
}

/**
 * Returns active feature flags and wires up global error tracking
 * for uncaught exceptions and unhandled promise rejections.
 * Also registers WebGL context-lost detection.
 */
export function useGlobeTelemetry({ sessionKey, enabled = true }: UseGlobeTelemetryOptions = {}) {
  const flagsRef = useRef<FeatureFlags | null>(null)
  const globeCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Fetch feature flags once
  useEffect(() => {
    if (!enabled) return
    fetch('/api/feature-flags')
      .then((r) => r.json())
      .then((data) => {
        flagsRef.current = data.flags ?? null
      })
      .catch(() => {})
  }, [enabled])

  // Global uncaught error watcher
  useEffect(() => {
    if (!enabled) return
    GlobeTelemetry.start()

    const onError = (ev: ErrorEvent) => {
      GlobeTelemetry.recordError(ev.message, ev.error?.stack)
    }
    const onUnhandledRejection = (ev: PromiseRejectionEvent) => {
      GlobeTelemetry.recordError(String(ev.reason))
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
      GlobeTelemetry.flush()
    }
  }, [enabled])

  /**
   * Pass to GTIXTGlobe's container ref — wires up WebGL context-lost telemetry.
   * Usage: <div ref={attachGlobeContainer}>...</div>
   */
  const attachGlobeContainer = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    // Find the canvas lazily — it might not exist immediately
    const find = () => {
      const canvas = el.querySelector('canvas')
      if (canvas && canvas !== globeCanvasRef.current) {
        globeCanvasRef.current = canvas
        canvas.addEventListener('webglcontextlost', () => GlobeTelemetry.oomSignal('webgl context lost'), { once: true })
      }
    }
    find()
    const observer = new MutationObserver(find)
    observer.observe(el, { childList: true, subtree: true })
    // Clean up after 10s — canvas should be present by then
    setTimeout(() => observer.disconnect(), 10_000)
  }, [])

  /**
   * Determines if globe_v2 is enabled for this session.
   * Uses a stable hash of sessionKey to stay in/out of rollout cohort.
   */
  const isGlobeV2Enabled = useCallback((): boolean => {
    const flags = flagsRef.current
    if (!flags) return true // default open until flags load
    if (!flags.globe_v2.enabled) return false
    if (flags.globe_v2.rolloutPct >= 100) return true
    if (flags.globe_v2.rolloutPct <= 0) return false
    // Stable hash: sum char codes of sessionKey mod 100
    const key = sessionKey ?? (typeof window !== 'undefined' ? (localStorage.getItem('_gtixt_sid') || _initSession()) : '0')
    let hash = 0
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
    return (hash % 100) < flags.globe_v2.rolloutPct
  }, [sessionKey])

  return { attachGlobeContainer, isGlobeV2Enabled, flags: flagsRef }
}

function _initSession(): string {
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36)
  try { localStorage.setItem('_gtixt_sid', id) } catch { /* */ }
  return id
}
