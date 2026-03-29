'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

type RadarEvent = {
  firm_id: string
  firm_name: string
  website: string | null
  jurisdiction: string | null
  gri_score: number
  risk_category: string
  warning_signals: string[]
  dimensions: {
    operational: number
    financial: number
    behavioural: number
    community: number
    infrastructure: number
  }
  snapshot_date: string
  computed_at: string | null
  status: 'Healthy' | 'Watch' | 'Danger'
  collapse_probability: number
  stability_score: number
  signal_count: number
  is_new_alert: boolean
  share_text: string
  share_url: string
}

type RadarPayload = {
  success: boolean
  headline: string
  count: number
  window_days: number
  data_source?: string
  as_of?: string
  distribution: {
    low: number
    moderate: number
    elevated: number
    high: number
    critical: number
  }
  data: RadarEvent[]
  high_risk_firms: RadarEvent[]
  new_alerts: RadarEvent[]
  stability_ranking: RadarEvent[]
}

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
type RelationType = 'jurisdiction' | 'risk-cluster' | 'warning-signal'
type Region = 'USA' | 'EU' | 'UAE' | 'Australia'

type EnrichedEvent = RadarEvent & {
  riskLevel: RiskLevel
  region: Region
  relationType: RelationType
  importance: number
}

type RadarNode = {
  event: EnrichedEvent
  x: number
  y: number
  size: number
  color: string
  ring: 'inner' | 'mid' | 'outer'
}

type PropagationCandidate = {
  event: EnrichedEvent
  score: number
  sharedSignals: number
  sameRegion: boolean
  sameRiskCluster: boolean
  tier: 'primary' | 'secondary'
  parentId: string | null
}

type PropagationNode = PropagationCandidate & {
  x: number
  y: number
  path: string
}

const COLORS = {
  bg: '#050A14',
  grid: '#1A2333',
  stable: '#1ED6FF',
  watch: '#FFD166',
  danger: '#FF5C5C',
  critical: '#FF2E2E',
}

const RING = {
  inner: 70,
  mid: 140,
  outer: 210,
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function hashToFloat(input: string) {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return (Math.abs(hash) % 1000) / 1000
}

function sharedCount(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0
  const source = new Set(a.map((value) => value.toLowerCase()))
  return b.reduce((count, value) => count + (source.has(value.toLowerCase()) ? 1 : 0), 0)
}

function toRegion(jurisdiction: string | null): Region {
  const token = (jurisdiction || '').toUpperCase()
  if (['US', 'USA', 'UNITED STATES'].includes(token)) return 'USA'
  if (['AE', 'UAE', 'DUBAI'].includes(token)) return 'UAE'
  if (['AU', 'AUS', 'AUSTRALIA'].includes(token)) return 'Australia'
  return 'EU'
}

function toRiskLevel(event: RadarEvent): RiskLevel {
  const category = (event.risk_category || '').toLowerCase()
  if (category.includes('critical') || event.collapse_probability >= 70 || event.status === 'Danger') return 'CRITICAL'
  if (category.includes('high') || event.collapse_probability >= 52) return 'HIGH'
  if (category.includes('moderate') || category.includes('elevated') || event.collapse_probability >= 32) return 'MEDIUM'
  return 'LOW'
}

function toRelationType(signal: string): RelationType {
  const s = (signal || '').toLowerCase()
  if (s.includes('regulat') || s.includes('jurisdiction') || s.includes('compliance')) return 'jurisdiction'
  if (s.includes('cluster') || s.includes('volatility') || s.includes('liquidity') || s.includes('stress')) return 'risk-cluster'
  return 'warning-signal'
}

function severityRank(level: RiskLevel): number {
  if (level === 'CRITICAL') return 4
  if (level === 'HIGH') return 3
  if (level === 'MEDIUM') return 2
  return 1
}

function riskColor(level: RiskLevel) {
  if (level === 'CRITICAL') return COLORS.critical
  if (level === 'HIGH') return COLORS.danger
  if (level === 'MEDIUM') return COLORS.watch
  return COLORS.stable
}

function riskRing(level: RiskLevel): 'inner' | 'mid' | 'outer' {
  if (level === 'LOW') return 'inner'
  if (level === 'MEDIUM') return 'mid'
  return 'outer'
}

function relationAngle(relation: RelationType) {
  if (relation === 'jurisdiction') return 300
  if (relation === 'risk-cluster') return 60
  return 180
}

function monthKey(timestamp: string) {
  const d = new Date(timestamp)
  const m = d.toLocaleString('en-GB', { month: 'short' })
  const y = d.getUTCFullYear()
  return `${m} ${y}`
}

export default function RadarPage() {
  const [payload, setPayload] = useState<RadarPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedFirmId, setSelectedFirmId] = useState<string | null>(null)
  const [hoveredFirmId, setHoveredFirmId] = useState<string | null>(null)
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [newSignalsMode, setNewSignalsMode] = useState(true)
  const [shockMode, setShockMode] = useState(false)
  const [radarZoom, setRadarZoom] = useState(1)
  const [streamExpanded, setStreamExpanded] = useState(false)
  const [explainAudience, setExplainAudience] = useState<'retail' | 'investor' | 'data'>('retail')
  const [shockBurstId, setShockBurstId] = useState(0)
  const streamRef = useRef<HTMLDivElement | null>(null)
  const previousShockMode = useRef(false)

  useEffect(() => {
    try {
      const cached = window.localStorage.getItem('gtixt-radar-watchlist')
      if (cached) setWatchlist(JSON.parse(cached))
    } catch {
      setWatchlist([])
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem('gtixt-radar-watchlist', JSON.stringify(watchlist))
    } catch {
      // ignore
    }
  }, [watchlist])

  useEffect(() => {
    let active = true

    const loadRadar = async () => {
      try {
        setLoading(true)
        setLoadError(null)
        const response = await fetch('/api/radar/early-warning?limit=260', { cache: 'no-store' })
        const json = (await response.json()) as RadarPayload

        if (!response.ok || !json?.success) {
          throw new Error('Radar data unavailable')
        }

        if (active) {
          setPayload(json)
        }
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load radar')
          setPayload(null)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadRadar()
    const interval = window.setInterval(loadRadar, 30000)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (shockMode && !previousShockMode.current) {
      setShockBurstId((value) => value + 1)
    }
    previousShockMode.current = shockMode
  }, [shockMode])

  const events = useMemo<EnrichedEvent[]>(() => {
    const src = payload?.data || []
    return src.map((event) => {
      const relation = toRelationType(event.warning_signals?.[0] || 'warning-signal')
      const riskLevel = toRiskLevel(event)
      const importance = clamp((event.gri_score * 0.55 + event.signal_count * 3 + (100 - event.stability_score) * 0.3) / 10, 2.4, 7.2)
      return {
        ...event,
        relationType: relation,
        riskLevel,
        region: toRegion(event.jurisdiction),
        importance,
      }
    })
  }, [payload?.data])

  const sortedCritical = useMemo(() => {
    return [...events].sort((a, b) => {
      const sev = severityRank(b.riskLevel) - severityRank(a.riskLevel)
      if (sev !== 0) return sev
      return b.collapse_probability - a.collapse_probability
    })
  }, [events])

  useEffect(() => {
    if (!sortedCritical.length) {
      setSelectedFirmId(null)
      return
    }
    if (!selectedFirmId || !sortedCritical.some((event) => event.firm_id === selectedFirmId)) {
      setSelectedFirmId(sortedCritical[0].firm_id)
    }
  }, [sortedCritical, selectedFirmId])

  const focusedFirmId = hoveredFirmId || selectedFirmId

  const focused = useMemo(() => {
    return sortedCritical.find((event) => event.firm_id === focusedFirmId) || null
  }, [focusedFirmId, sortedCritical])

  const eventById = useMemo(() => {
    return new Map(sortedCritical.map((event) => [event.firm_id, event]))
  }, [sortedCritical])

  const sectorHealth = useMemo(() => {
    if (!events.length) return 0
    const avgRisk = events.reduce((sum, event) => sum + event.collapse_probability, 0) / events.length
    return Math.round(clamp(100 - avgRisk, 0, 100))
  }, [events])

  const sectorRiskIndex = useMemo(() => {
    if (!events.length) return 0
    const weighted = events.reduce((sum, event) => sum + severityRank(event.riskLevel), 0)
    return Math.round((weighted / (events.length * 4)) * 100)
  }, [events])

  const healthTone = sectorHealth >= 80 ? 'text-emerald-300' : sectorHealth >= 60 ? 'text-yellow-300' : sectorHealth >= 40 ? 'text-orange-300' : 'text-red-300'

  const relationCounts = useMemo(() => {
    const counts: Record<RelationType, number> = {
      jurisdiction: 0,
      'risk-cluster': 0,
      'warning-signal': 0,
    }
    events.forEach((event) => {
      ;(event.warning_signals || []).forEach((signal) => {
        counts[toRelationType(signal)] += 1
      })
    })
    return counts
  }, [events])

  const radarNodes = useMemo<RadarNode[]>(() => {
    return sortedCritical.slice(0, 120).map((event, idx) => {
      const ring = riskRing(event.riskLevel)
      const baseR = ring === 'inner' ? RING.inner : ring === 'mid' ? RING.mid : RING.outer
      const angle = relationAngle(event.relationType) + hashToFloat(event.firm_id) * 120 - 60 + (idx % 6) * 7
      const radialJitter = hashToFloat(`${event.firm_id}-r`) * 20 - 10
      const r = baseR + radialJitter
      const rad = (angle * Math.PI) / 180
      const x = 260 + Math.cos(rad) * r
      const y = 260 + Math.sin(rad) * r
      return {
        event,
        x,
        y,
        size: event.importance,
        color: riskColor(event.riskLevel),
        ring,
      }
    })
  }, [sortedCritical])

  const radarNodeById = useMemo(() => {
    return new Map(radarNodes.map((node) => [node.event.firm_id, node]))
  }, [radarNodes])

  const propagationCandidates = useMemo(() => {
    if (!focused) return [] as PropagationCandidate[]

    const scored = sortedCritical
      .filter((candidate) => candidate.firm_id !== focused.firm_id)
      .map((candidate) => {
        const sharedSignals = sharedCount(focused.warning_signals || [], candidate.warning_signals || [])
        const sameRegion = candidate.region === focused.region
        const sameRiskCluster = candidate.risk_category === focused.risk_category || candidate.relationType === focused.relationType
        const riskGap = Math.abs(candidate.collapse_probability - focused.collapse_probability)
        const score = clamp(
          sharedSignals * 24 +
            (sameRegion ? 18 : 0) +
            (sameRiskCluster ? 14 : 0) +
            Math.max(0, 18 - riskGap) +
            (candidate.riskLevel === 'CRITICAL' ? 12 : candidate.riskLevel === 'HIGH' ? 8 : 4),
          0,
          100
        )

        return {
          event: candidate,
          score,
          sharedSignals,
          sameRegion,
          sameRiskCluster,
        }
      })
      .filter((entry) => entry.sharedSignals > 0 || entry.sameRegion || entry.sameRiskCluster || entry.score >= 46)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return b.event.collapse_probability - a.event.collapse_probability
      })

    const primary = scored.slice(0, 4).map((entry) => ({
      ...entry,
      tier: 'primary' as const,
      parentId: null,
    }))

    const primaryIds = new Set(primary.map((entry) => entry.event.firm_id))
    const secondary = scored
      .filter((entry) => !primaryIds.has(entry.event.firm_id))
      .slice(0, 6)
      .map((entry, index) => ({
        ...entry,
        tier: 'secondary' as const,
        parentId: primary[index % Math.max(primary.length, 1)]?.event.firm_id ?? focused.firm_id,
      }))

    return [...primary, ...secondary]
  }, [focused, sortedCritical])

  const connectionIds = useMemo(() => {
    return new Set(propagationCandidates.map((candidate) => candidate.event.firm_id))
  }, [propagationCandidates])

  const shockImpacted = useMemo(() => {
    if (!shockMode) return [] as EnrichedEvent[]
    return propagationCandidates
      .filter((entry) => entry.tier === 'primary' || entry.score >= 58)
      .slice(0, 8)
      .map((entry) => entry.event)
  }, [propagationCandidates, shockMode])

  const propagationGraph = useMemo(() => {
    if (!focused) return [] as PropagationNode[]

    const primary = propagationCandidates.filter((entry) => entry.tier === 'primary')
    const primaryNodes = primary.map((entry, index) => {
      const spread = primary.length > 1 ? index / (primary.length - 1) : 0.5
      const x = 182 + (index % 2) * 16
      const y = 40 + spread * 100
      const controlX = 126 + index * 8
      return {
        ...entry,
        x,
        y,
        path: `M 84 92 C ${controlX} 92, ${controlX} ${y}, ${x} ${y}`,
      }
    })

    const primaryById = new Map(primaryNodes.map((entry) => [entry.event.firm_id, entry]))

    const secondary = propagationCandidates.filter((entry) => entry.tier === 'secondary')
    const secondaryNodes = secondary.map((entry, index) => {
      const fallbackParent = primaryNodes[index % Math.max(primaryNodes.length, 1)]
      const parent = primaryById.get(entry.parentId || '') || fallbackParent
      const lane = index % 2 === 0 ? -1 : 1
      const hop = 18 + (index % 3) * 8
      const x = clamp((parent?.x || 182) + 72 + Math.floor(index / 2) * 10, 244, 294)
      const y = clamp((parent?.y || 92) + lane * hop, 24, 156)
      const controlX = (parent?.x || 182) + 34
      return {
        ...entry,
        x,
        y,
        path: `M ${parent?.x || 182} ${parent?.y || 92} C ${controlX} ${parent?.y || 92}, ${x - 20} ${y}, ${x} ${y}`,
      }
    })

    return [...primaryNodes, ...secondaryNodes]
  }, [focused, propagationCandidates])

  const threatGroups = useMemo(() => {
    const high = sortedCritical.filter((event) => event.riskLevel === 'CRITICAL' || event.riskLevel === 'HIGH').slice(0, 8)
    const medium = sortedCritical.filter((event) => event.riskLevel === 'MEDIUM').slice(0, 8)
    const low = sortedCritical.filter((event) => event.riskLevel === 'LOW').slice(0, 8)
    return { high, medium, low }
  }, [sortedCritical])

  const highThreatEvents = useMemo(() => {
    const live = (payload?.high_risk_firms || [])
      .map((event) => eventById.get(event.firm_id))
      .filter((event): event is EnrichedEvent => Boolean(event))
    return live.length ? live : threatGroups.high
  }, [eventById, payload?.high_risk_firms, threatGroups.high])

  const liveNewAlerts = useMemo(() => {
    const live = (payload?.new_alerts || [])
      .map((event) => eventById.get(event.firm_id))
      .filter((event): event is EnrichedEvent => Boolean(event))
    return live.length ? live : sortedCritical.filter((event) => event.is_new_alert)
  }, [eventById, payload?.new_alerts, sortedCritical])

  const streamItems = useMemo(() => {
    return [...(liveNewAlerts.length ? liveNewAlerts : sortedCritical)]
      .sort((a, b) => {
        const aTs = a.computed_at ? new Date(a.computed_at).getTime() : new Date(a.snapshot_date).getTime()
        const bTs = b.computed_at ? new Date(b.computed_at).getTime() : new Date(b.snapshot_date).getTime()
        return aTs - bTs
      })
      .slice(-80)
      .flatMap((event) => {
        const ts = event.computed_at || event.snapshot_date
        const source = event.warning_signals?.length ? event.warning_signals : ['signal observed']
        return source.slice(0, 2).map((signal) => ({
          id: `${event.firm_id}-${ts}-${signal}`,
          firm: event.firm_name,
          signal,
          ts,
        }))
      })
  }, [liveNewAlerts, sortedCritical])

  const visibleStreamItems = useMemo(() => {
    return streamExpanded ? streamItems : streamItems.slice(-10)
  }, [streamExpanded, streamItems])

  const radarViewBox = useMemo(() => {
    const zoom = clamp(radarZoom, 1, 2.3)
    const span = 520 / zoom
    const offset = (520 - span) / 2
    return `${offset} ${offset} ${span} ${span}`
  }, [radarZoom])

  useEffect(() => {
    if (!streamRef.current) return
    streamRef.current.scrollTop = streamRef.current.scrollHeight
  }, [streamItems.length])

  const timeline = useMemo(() => {
    const map = new Map<string, { total: number; critical: number; watch: number }>()
    sortedCritical.forEach((event) => {
      const ts = event.computed_at || event.snapshot_date
      const key = monthKey(ts)
      const prev = map.get(key) || { total: 0, critical: 0, watch: 0 }
      prev.total += 1
      if (event.riskLevel === 'CRITICAL' || event.riskLevel === 'HIGH') prev.critical += 1
      else prev.watch += 1
      map.set(key, prev)
    })
    return [...map.entries()].slice(-8)
  }, [sortedCritical])

  const watchlistEvents = useMemo(() => {
    return watchlist
      .map((id) => sortedCritical.find((event) => event.firm_id === id))
      .filter((event): event is EnrichedEvent => Boolean(event))
  }, [sortedCritical, watchlist])

  const toggleWatch = (firmId: string) => {
    setWatchlist((prev) => (prev.includes(firmId) ? prev.filter((id) => id !== firmId) : [...prev, firmId]))
  }

  return (
    <div className="radar-page min-h-screen text-slate-100" style={{ backgroundColor: COLORS.bg }}>

      <div className="mx-auto max-w-[1560px] px-4 py-7 lg:px-8">
        <section className="rounded-2xl border border-white/10 bg-slate-900/35 px-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.14em] text-cyan-300">Sector Command Status</p>
          <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.1em] text-slate-500">Sector Health</p>
              <p className={`text-lg font-semibold ${healthTone}`}>{sectorHealth} / 100</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.1em] text-slate-500">Risk Index</p>
              <p className="text-lg font-semibold text-amber-300">{sectorRiskIndex}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.1em] text-slate-500">Active Alerts</p>
              <p className="text-lg font-semibold text-red-300">{threatGroups.high.length}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.1em] text-slate-500">Firms Monitored</p>
              <p className="text-lg font-semibold text-cyan-300">{payload?.count || events.length}</p>
            </div>
          </div>
          <div className="mt-2 border-t border-white/10 pt-2 text-[9px] uppercase tracking-[0.08em] text-slate-400">
            {loading ? 'Loading live signal bus...' : payload?.headline || 'Live monitoring active'}
            {payload?.as_of ? ` · ${new Date(payload.as_of).toLocaleString('en-GB', { hour12: false })} UTC` : ''}
            {payload?.data_source ? ` · ${payload.data_source.replace(/_/g, ' ')}` : ''}
            {payload?.window_days ? ` · ${payload.window_days}d window` : ''}
          </div>
        </section>

        {loadError && (
          <div className="mt-3 rounded-xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-100">
            Radar unavailable: {loadError}
          </div>
        )}

        <section className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
          <div className="xl:col-span-8 rounded-2xl border border-white/10 bg-slate-900/35 p-3">
            <div className="flex items-center justify-between">
              <p className="text-[9px] uppercase tracking-[0.12em] text-cyan-300">Radar Core</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-1.5 py-1 text-[9px] uppercase tracking-[0.08em] text-slate-300">
                  <span className="text-slate-500">Zoom</span>
                  <button
                    type="button"
                    onClick={() => setRadarZoom((value) => clamp(Number((value - 0.15).toFixed(2)), 1, 2.3))}
                    className="rounded border border-white/15 px-1 py-0.5 text-[9px] text-slate-200 hover:bg-white/10"
                    aria-label="Zoom out radar"
                  >
                    -
                  </button>
                  <span className="min-w-[38px] text-center text-cyan-200">{radarZoom.toFixed(2)}x</span>
                  <button
                    type="button"
                    onClick={() => setRadarZoom((value) => clamp(Number((value + 0.15).toFixed(2)), 1, 2.3))}
                    className="rounded border border-white/15 px-1 py-0.5 text-[9px] text-slate-200 hover:bg-white/10"
                    aria-label="Zoom in radar"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setNewSignalsMode((prev) => !prev)}
                  className={`rounded-md border px-2 py-1 text-[9px] uppercase tracking-[0.08em] ${newSignalsMode ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200' : 'border-white/15 bg-white/5 text-slate-300'}`}
                >
                  New Signals {newSignalsMode ? 'On' : 'Off'}
                </button>
                <button
                  type="button"
                  onClick={() => setShockMode((prev) => !prev)}
                  className={`rounded-md border px-2 py-1 text-[9px] uppercase tracking-[0.08em] ${shockMode ? 'border-red-400/40 bg-red-500/10 text-red-200' : 'border-white/15 bg-white/5 text-slate-300'}`}
                >
                  Shock Sim {shockMode ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            <div className="mt-2 border-t border-white/10" />

            <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-12">
              <div
                className="lg:col-span-8 rounded-xl border border-white/10 bg-black/20 p-2"
                onWheel={(event) => {
                  event.preventDefault()
                  const delta = event.deltaY > 0 ? -0.08 : 0.08
                  setRadarZoom((value) => clamp(Number((value + delta).toFixed(2)), 1, 2.3))
                }}
              >
                <svg viewBox={radarViewBox} className="h-[420px] w-full rounded-lg" role="img" aria-label="GTIXT Tactical Radar">
                  <defs>
                    <radialGradient id="radar-core" cx="50%" cy="50%" r="65%">
                      <stop offset="0%" stopColor="#0b1628" />
                      <stop offset="100%" stopColor={COLORS.bg} />
                    </radialGradient>
                  </defs>
                  <rect x="0" y="0" width="520" height="520" fill="url(#radar-core)" />

                  <circle cx="260" cy="260" r={RING.inner} stroke={COLORS.grid} strokeWidth="1" fill="none" />
                  <circle cx="260" cy="260" r={RING.mid} stroke={COLORS.grid} strokeWidth="1" fill="none" />
                  <circle cx="260" cy="260" r={RING.outer} stroke={COLORS.grid} strokeWidth="1" fill="none" />
                  <circle cx="260" cy="260" r={240} stroke={COLORS.grid} strokeWidth="1" fill="none" opacity="0.6" />

                  <line x1="260" y1="20" x2="260" y2="500" stroke={COLORS.grid} strokeWidth="1" />
                  <line x1="20" y1="260" x2="500" y2="260" stroke={COLORS.grid} strokeWidth="1" />

                  <text x="260" y="45" textAnchor="middle" fill="#7e8da3" fontSize="9" letterSpacing="1">OUTER RING / HIGH RISK</text>
                  <text x="260" y="132" textAnchor="middle" fill="#7e8da3" fontSize="9" letterSpacing="1">MID RING / WATCH</text>
                  <text x="260" y="234" textAnchor="middle" fill="#7e8da3" fontSize="9" letterSpacing="1">INNER RING / STABLE</text>

                  {focused && (
                    <circle cx="260" cy="260" r="252" fill="#020611" opacity="0.32" />
                  )}

                  {focused && radarNodes
                    .filter((node) => connectionIds.has(node.event.firm_id))
                    .map((node) => (
                      <line
                        key={`conn-${node.event.firm_id}`}
                        x1="260"
                        y1="260"
                        x2={node.x}
                        y2={node.y}
                        stroke={riskColor(node.event.riskLevel)}
                        strokeWidth="1"
                        opacity="0.28"
                      />
                    ))}

                  {newSignalsMode && (
                    <g>
                      <circle cx="260" cy="260" r="54" fill="none" stroke={COLORS.watch} strokeWidth="1" opacity="0.08">
                        <animate attributeName="r" values="40;240" dur="3.6s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.28;0.02" dur="3.6s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  )}

                  {radarNodes.map((node) => {
                    const isFocused = focused?.firm_id === node.event.firm_id
                    const isConnected = connectionIds.has(node.event.firm_id)
                    const dimmed = Boolean(focused && !isFocused && !isConnected)
                    const pulse = newSignalsMode && node.event.is_new_alert
                    const shockHit = shockMode && shockImpacted.some((entry) => entry.firm_id === node.event.firm_id)
                    return (
                      <g key={node.event.firm_id} opacity={dimmed ? 0.16 : 1}>
                        {pulse && (
                          <circle cx={node.x} cy={node.y} r={node.size + 2} fill="none" stroke={node.color} strokeWidth="1" opacity="0.55">
                            <animate attributeName="r" values={`${node.size};${node.size + 12};${node.size}`} dur="1.5s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.65;0.08;0.65" dur="1.5s" repeatCount="indefinite" />
                          </circle>
                        )}

                        {shockHit && <circle cx={node.x} cy={node.y} r={node.size + 7} fill="none" stroke={COLORS.critical} strokeWidth="1" opacity="0.32" />}

                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isFocused ? node.size + 1.4 : node.size}
                          fill={node.color}
                          stroke={isFocused ? '#ffffff' : '#0b1524'}
                          strokeWidth={isFocused ? 1.5 : 0.9}
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={() => setHoveredFirmId(node.event.firm_id)}
                          onMouseLeave={() => setHoveredFirmId(null)}
                          onClick={() => setSelectedFirmId(node.event.firm_id)}
                        />
                      </g>
                    )
                  })}

                  {shockMode && focused && shockBurstId > 0 && (
                    <g key={`shock-burst-core-${shockBurstId}`}>
                      <circle cx="260" cy="260" r="18" fill="none" stroke={COLORS.critical} strokeWidth="1.2" opacity="0.55">
                        <animate attributeName="r" values="18;98" dur="0.85s" repeatCount="1" />
                        <animate attributeName="opacity" values="0.55;0" dur="0.85s" repeatCount="1" />
                      </circle>
                      {shockImpacted.map((event, index) => {
                        const node = radarNodeById.get(event.firm_id)
                        if (!node) return null
                        return (
                          <circle key={`shock-burst-node-${event.firm_id}`} cx={node.x} cy={node.y} r={node.size + 3} fill="none" stroke={COLORS.critical} strokeWidth="1.2" opacity="0.7">
                            <animate attributeName="r" values={`${node.size + 2};${node.size + 14}`} dur={`${0.55 + index * 0.08}s`} repeatCount="1" />
                            <animate attributeName="opacity" values="0.7;0" dur={`${0.55 + index * 0.08}s`} repeatCount="1" />
                          </circle>
                        )
                      })}
                    </g>
                  )}
                </svg>
              </div>

              <div className="lg:col-span-4 space-y-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-2">
                  <p className="text-[9px] uppercase tracking-[0.1em] text-slate-500">Focused Context</p>
                  {!focused && <p className="mt-2 text-xs text-slate-400">Hover or click any firm node.</p>}
                  {focused && (
                    <div className="mt-2 space-y-2">
                      <div>
                        <p className="truncate text-sm font-semibold text-white">{focused.firm_name}</p>
                        <p className="text-[9px] uppercase tracking-[0.08em] text-slate-400">{focused.region} · {focused.riskLevel}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5">
                          <p className="text-[9px] uppercase text-slate-500">Score</p>
                          <p className="text-xs font-semibold text-cyan-300">{focused.gri_score.toFixed(1)}</p>
                        </div>
                        <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5">
                          <p className="text-[9px] uppercase text-slate-500">Risk</p>
                          <p className="text-xs font-semibold text-red-300">{focused.collapse_probability}%</p>
                        </div>
                      </div>
                      <div className="rounded-md border border-white/10 bg-white/5 p-2">
                        <p className="text-[9px] uppercase tracking-[0.1em] text-slate-500">Latest Alert</p>
                        <p className="mt-1 text-xs text-slate-200">{focused.warning_signals?.[0] || 'No explicit signal label'}</p>
                      </div>
                      <div className="rounded-md border border-white/10 bg-slate-950/55 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[9px] uppercase tracking-[0.1em] text-slate-500">Risk Propagation Graph</p>
                          <span className="text-[9px] uppercase tracking-[0.08em] text-slate-600">{shockMode ? 'Shock View' : 'Link View'}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[9px] uppercase tracking-[0.08em] text-slate-500">
                          <span>Primary {propagationGraph.filter((node) => node.tier === 'primary').length}</span>
                          <span>Secondary {propagationGraph.filter((node) => node.tier === 'secondary').length}</span>
                          <span>{payload?.data_source === 'live_evidence' ? 'Live' : 'Runtime'}</span>
                        </div>
                        <svg viewBox="0 0 320 180" className="mt-2 h-[160px] w-full rounded bg-black/20" role="img" aria-label="Risk Propagation Graph">
                          <defs>
                            <marker id="propagation-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                              <polygon points="0 0, 6 3, 0 6" fill="#94a3b8" />
                            </marker>
                          </defs>

                          <rect x="0" y="0" width="320" height="180" fill="#030712" />
                          <path d="M 18 92 H 302" stroke="#111827" strokeWidth="1" />
                          <path d="M 84 20 C 152 20, 232 20, 298 20" stroke="#111827" strokeWidth="1" fill="none" strokeDasharray="3 5" />
                          <path d="M 84 160 C 152 160, 232 160, 298 160" stroke="#111827" strokeWidth="1" fill="none" strokeDasharray="3 5" />
                          <text x="182" y="16" fill="#64748b" fontSize="8" letterSpacing="0.8">PRIMARY LINKS</text>
                          <text x="248" y="174" fill="#64748b" fontSize="8" letterSpacing="0.8">SECONDARY CASCADE</text>

                          {propagationGraph.map((node) => (
                            <path
                              key={`base-path-${node.event.firm_id}`}
                              d={node.path}
                              fill="none"
                              stroke={riskColor(node.event.riskLevel)}
                              strokeWidth={node.tier === 'primary' ? 1.5 : 1}
                              opacity={node.tier === 'primary' ? 0.5 : 0.28}
                              strokeDasharray={node.tier === 'primary' ? undefined : '4 6'}
                              markerEnd="url(#propagation-arrow)"
                            />
                          ))}

                          {shockMode && shockBurstId > 0 && (
                            <g key={`propagation-burst-${shockBurstId}`}>
                              <circle cx="84" cy="92" r="12" fill="none" stroke="#f87171" strokeWidth="1.2" opacity="0.7">
                                <animate attributeName="r" values="12;74" dur="0.82s" repeatCount="1" />
                                <animate attributeName="opacity" values="0.7;0" dur="0.82s" repeatCount="1" />
                              </circle>
                              {propagationGraph.map((node, index) => (
                                <g key={`burst-link-${node.event.firm_id}`}>
                                  <path d={node.path} fill="none" stroke="#fca5a5" strokeWidth={node.tier === 'primary' ? 1.8 : 1.2} strokeDasharray="180" strokeDashoffset="180" opacity="0.85">
                                    <animate attributeName="stroke-dashoffset" values="180;0" dur={`${0.35 + index * 0.08}s`} repeatCount="1" />
                                    <animate attributeName="opacity" values="0;0.85;0" dur={`${0.55 + index * 0.08}s`} repeatCount="1" />
                                  </path>
                                  <circle cx={node.x} cy={node.y} r={node.tier === 'primary' ? 3.5 : 2.5} fill="none" stroke="#fca5a5" strokeWidth="1.1" opacity="0.85">
                                    <animate attributeName="r" values={node.tier === 'primary' ? '3;8' : '2;6'} dur={`${0.55 + index * 0.08}s`} repeatCount="1" />
                                    <animate attributeName="opacity" values="0.85;0" dur={`${0.55 + index * 0.08}s`} repeatCount="1" />
                                  </circle>
                                </g>
                              ))}
                            </g>
                          )}

                          {propagationGraph.map((node, index) => {
                            const primaryCount = propagationGraph.filter((entry) => entry.tier === 'primary').length
                            const label = node.tier === 'primary' ? `P${index + 1}` : `S${index + 1 - primaryCount}`
                            return (
                              <g key={`node-${node.event.firm_id}`}>
                                <circle cx={node.x} cy={node.y} r={node.tier === 'primary' ? 5 : 3.5} fill={riskColor(node.event.riskLevel)} stroke="#0f172a" strokeWidth="1" />
                                <rect x={node.x + 6} y={node.y - 8} width={node.tier === 'primary' ? 18 : 16} height="10" rx="2" fill={node.tier === 'primary' ? '#0f172a' : '#111827'} opacity="0.95" />
                                <text x={node.x + 15} y={node.y - 1} textAnchor="middle" fill={node.tier === 'primary' ? '#7dd3fc' : '#cbd5e1'} fontSize="7" letterSpacing="0.5">
                                  {label}
                                </text>
                                <text x={node.x + 6} y={node.y + 12} fill="#cbd5e1" fontSize="8" letterSpacing="0.4">
                                  {node.event.firm_name.slice(0, node.tier === 'primary' ? 15 : 12)}
                                </text>
                              </g>
                            )
                          })}

                          <circle cx="84" cy="92" r="22" fill="none" stroke="#1e293b" strokeWidth="1" />
                          <circle cx="84" cy="92" r="8" fill="#e2e8f0" />
                          <text x="84" y="72" textAnchor="middle" fill="#67e8f9" fontSize="8" letterSpacing="0.8">FOCUS NODE</text>
                          <text x="84" y="114" textAnchor="middle" fill="#cbd5e1" fontSize="8" letterSpacing="0.4">
                            {focused.firm_name.slice(0, 16)}
                          </text>
                        </svg>
                        <p className="mt-2 text-[9px] uppercase tracking-[0.08em] text-slate-500">
                          Live source {payload?.data_source?.replace(/_/g, ' ') || 'runtime'} · shared signals, jurisdiction overlap, and risk-cluster proximity.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Link href={`/firms/${focused.firm_id}`} className="rounded-md border border-cyan-400/35 bg-cyan-500/10 px-2 py-1 text-[9px] uppercase tracking-[0.08em] text-cyan-100">
                          Open Firm
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleWatch(focused.firm_id)}
                          className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[9px] uppercase tracking-[0.08em] text-slate-200"
                        >
                          {watchlist.includes(focused.firm_id) ? 'Remove Watch' : 'Add Watch'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {shockMode && focused && (
                  <div className="rounded-xl border border-red-400/25 bg-red-950/20 p-2">
                    <p className="text-[9px] uppercase tracking-[0.1em] text-red-200">Shock Simulation</p>
                    <p className="mt-1 text-xs text-red-100">If {focused.firm_name} collapses, likely propagation candidates:</p>
                    <div className="mt-1.5 space-y-1">
                      {shockImpacted.map((event) => (
                        <button
                          key={event.firm_id}
                          type="button"
                          onClick={() => setSelectedFirmId(event.firm_id)}
                          className="w-full rounded border border-red-300/25 bg-red-500/10 px-2 py-1 text-left text-[9px] uppercase tracking-[0.08em] text-red-100"
                        >
                          {event.firm_name} · {event.riskLevel}
                        </button>
                      ))}
                      {!shockImpacted.length && <p className="text-[10px] text-red-100/80">No immediate propagation candidate detected.</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="xl:col-span-4 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/35 p-3">
              <p className="text-[9px] uppercase tracking-[0.12em] text-red-300">Active Threats</p>
              <div className="mt-2 border-t border-white/10" />

              <div className="mt-2 space-y-2">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.08em] text-red-300">High Threats</p>
                  <div className="mt-1 space-y-1">
                    {highThreatEvents.map((event) => {
                      const ts = event.computed_at || event.snapshot_date
                      const confidence = Math.round(clamp(event.collapse_probability * 0.92, 45, 99))
                      return (
                        <button
                          key={`${event.firm_id}-${ts}`}
                          type="button"
                          onClick={() => setSelectedFirmId(event.firm_id)}
                          className={`w-full rounded border px-2 py-1.5 text-left ${focused?.firm_id === event.firm_id ? 'border-cyan-400/40 bg-cyan-500/10' : 'border-red-400/25 bg-red-500/10'}`}
                        >
                          <p className="truncate text-[10px] font-semibold text-white">{event.firm_name}</p>
                          <p className="mt-0.5 truncate text-[10px] text-red-100">{event.warning_signals?.[0] || 'Collapse probability rising'}</p>
                          <div className="mt-1 flex items-center justify-between text-[9px] uppercase tracking-[0.08em] text-slate-300">
                            <span>Confidence {confidence}%</span>
                            <span>{new Date(ts).toLocaleTimeString('en-GB', { hour12: false })}</span>
                          </div>
                          <p className="mt-0.5 text-[9px] uppercase tracking-[0.08em] text-slate-400">Source {event.relationType}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-2">
                  <p className="text-[9px] uppercase tracking-[0.08em] text-amber-300">Medium Signals</p>
                  <div className="mt-1 grid grid-cols-1 gap-1">
                    {threatGroups.medium.slice(0, 5).map((event) => (
                      <button key={event.firm_id} type="button" onClick={() => setSelectedFirmId(event.firm_id)} className="rounded border border-amber-300/25 bg-amber-500/10 px-2 py-1 text-left text-[9px] uppercase tracking-[0.08em] text-amber-100">
                        {event.firm_name} · {event.warning_signals?.[0] || 'watch signal'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-2">
                  <p className="text-[9px] uppercase tracking-[0.08em] text-yellow-200">Low Signals</p>
                  <div className="mt-1 grid grid-cols-1 gap-1">
                    {threatGroups.low.slice(0, 5).map((event) => (
                      <button key={event.firm_id} type="button" onClick={() => setSelectedFirmId(event.firm_id)} className="rounded border border-yellow-200/25 bg-yellow-400/10 px-2 py-1 text-left text-[9px] uppercase tracking-[0.08em] text-yellow-100">
                        {event.firm_name} · {event.warning_signals?.[0] || 'low-level signal'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/35 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[9px] uppercase tracking-[0.12em] text-cyan-300">Signal Stream</p>
                <button
                  type="button"
                  onClick={() => setStreamExpanded((prev) => !prev)}
                  className="rounded border border-white/15 bg-white/5 px-2 py-1 text-[9px] uppercase tracking-[0.08em] text-slate-300 hover:bg-white/10"
                >
                  {streamExpanded ? 'Collapse' : 'Expand'}
                </button>
              </div>
              <div className="mt-2 border-t border-white/10" />
              <div className="mt-2 flex items-center gap-1.5 text-[9px] uppercase tracking-[0.08em]">
                {(['retail', 'investor', 'data'] as const).map((audience) => (
                  <button
                    key={audience}
                    type="button"
                    onClick={() => setExplainAudience(audience)}
                    className={`rounded border px-2 py-1 ${
                      explainAudience === audience
                        ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {audience}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-slate-300">
                {explainAudience === 'retail' && 'Retail: each line is a fresh warning linked to one firm. Rising red lines first.'}
                {explainAudience === 'investor' && 'Investor: watch recurrence and time clustering; repeated alerts usually precede regime repricing.'}
                {explainAudience === 'data' && 'Data: stream is the latest 10 lines by default, with event timestamp and first warning label key.'}
              </p>
              <div ref={streamRef} className="mt-2 max-h-[220px] overflow-y-auto rounded-md border border-white/10 bg-black/25 p-2 font-mono text-[10px] leading-relaxed text-cyan-100">
                {visibleStreamItems.map((item) => (
                  <div key={item.id} className="truncate">
                    <span className="text-slate-500">[{new Date(item.ts).toLocaleTimeString('en-GB', { hour12: false })}]</span>{' '}
                    <span className="text-slate-200">{item.signal}</span>{' '}
                    <span className="text-cyan-200">— {item.firm}</span>
                  </div>
                ))}
                {!visibleStreamItems.length && <p className="text-slate-500">No live signal in stream.</p>}
              </div>
              <div className="mt-2 border-t border-white/10 pt-2 text-[9px] uppercase tracking-[0.08em] text-slate-500">
                Regulatory Mesh {relationCounts.jurisdiction} · Risk Cluster {relationCounts['risk-cluster']} · Warning Lattice {relationCounts['warning-signal']}
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-3 rounded-xl border border-white/10 bg-slate-900/35 p-3">
          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-400">Event Timeline</p>
          <div className="mt-2 border-t border-white/10" />
          <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-8">
            {timeline.map(([label, stats]) => (
              <div key={label} className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5">
                <p className="text-[9px] uppercase tracking-[0.08em] text-slate-400">{label}</p>
                <div className="mt-1.5 h-1.5 w-full rounded bg-white/10">
                  <div className="h-full rounded bg-red-400/80" style={{ width: `${clamp(stats.critical * 10, 8, 100)}%` }} />
                </div>
                <p className="mt-1 text-[9px] uppercase tracking-[0.08em] text-slate-500">Critical {stats.critical} · Watch {stats.watch}</p>
              </div>
            ))}
            {!timeline.length && <p className="text-xs text-slate-400">No timeline markers yet.</p>}
          </div>
        </section>

        <section className="mt-3 rounded-xl border border-white/10 bg-slate-900/35 p-3">
          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-400">Watchlist</p>
          <div className="mt-2 border-t border-white/10" />
          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
            {watchlistEvents.map((event) => (
              <div key={event.firm_id} className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[10px] font-semibold text-white">{event.firm_name}</p>
                  <span className="text-[9px] uppercase" style={{ color: riskColor(event.riskLevel) }}>{event.riskLevel}</span>
                </div>
                <p className="mt-0.5 text-[9px] uppercase tracking-[0.08em] text-slate-500">{event.region} · {event.collapse_probability}%</p>
                <p className="mt-1 truncate text-[10px] text-slate-300">{event.warning_signals?.[0] || 'No active alert'}</p>
              </div>
            ))}
            {!watchlistEvents.length && <p className="text-xs text-slate-400">Add firms from radar core or active threats.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}
