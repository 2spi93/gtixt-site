'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'

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

type RadarViewport = {
  x: number
  y: number
  span: number
}

type RadarOffset = {
  x: number
  y: number
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

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3
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
function formatSignalLabel(signal: string) {
  const source = String(signal || 'warning signal')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!source) return 'Warning signal'
  return source.charAt(0).toUpperCase() + source.slice(1)
}
function relationLabel(relation: RelationType) {
  if (relation === 'jurisdiction') return 'regulatory and jurisdictional pressure'
  if (relation === 'risk-cluster') return 'shared market and liquidity stress'
  return 'converging operational warning signals'
}
function ringLabel(level: RiskLevel) {
  if (level === 'LOW') return 'inner ring'
  if (level === 'MEDIUM') return 'mid ring'
  return 'outer ring'
}
function buildInstitutionalNarrative(event: EnrichedEvent | null) {
  if (!event) {
    return {
      overview: 'Select a firm to read a plain-language interpretation of the signal, its relevance, and the monitoring posture it implies.',
      purpose: 'The radar is designed to convert technical alerts into an intelligible supervisory view for clients, counterparties, and institutional reviewers.',
      action: 'Choose any node to open a structured explanation.',
      whyNow: 'No firm is currently selected.',
    }
  }
  const firstSignal = formatSignalLabel(event.warning_signals?.[0] || 'multi-factor stress')
  const signalCountLabel = event.signal_count <= 1 ? 'one corroborated signal' : `${event.signal_count} corroborated signals`
  let overview = `${event.firm_name} is currently positioned in the ${ringLabel(event.riskLevel)} of the radar, which means GTIXT detects a material change in its operating risk posture rather than routine background noise.`
  let purpose = `This point exists to help a client understand whether the firm should still be approached as operationally stable, monitored more closely, or treated as a heightened diligence case.`
  let action = `Current monitoring stance: maintain standard observation while watching for repetition of ${firstSignal.toLowerCase()}.`
  if (event.riskLevel === 'MEDIUM') {
    overview = `${event.firm_name} sits in the mid ring because the system is detecting an emerging deviation that deserves attention, but not yet a severe deterioration.`
    purpose = 'For an institutional reader, this is an early review signal: it indicates that the firm may be moving away from baseline stability and should not be read as fully neutral.'
    action = `Current monitoring stance: place the firm under reinforced review and verify whether ${firstSignal.toLowerCase()} persists across the next evidence cycle.`
  }
  if (event.riskLevel === 'HIGH') {
    overview = `${event.firm_name} is now inside the outer ring, indicating a high-risk configuration where multiple inputs point to a meaningful deterioration in resilience.`
    purpose = 'For a client, this point is useful because it translates fragmented evidence into a practical conclusion: the firm now warrants escalated diligence before any reliance, allocation, or renewed engagement.'
    action = `Current monitoring stance: escalate review, verify payout continuity and operational disclosures, and treat new evidence as potentially market-relevant.`
  }
  if (event.riskLevel === 'CRITICAL') {
    overview = `${event.firm_name} is classified as critical, which means the radar no longer presents a simple cautionary note but a concentrated risk signal with immediate supervisory value.`
    purpose = 'For a client or institutional reviewer, this point answers a simple question in plain terms: this is a case where continuity, governance quality, or execution reliability may degrade abruptly.'
    action = 'Current monitoring stance: treat the case as priority monitoring, review exposure immediately, and assume that additional adverse signals may arrive in short succession.'
  }
  return {
    overview,
    purpose,
    action,
    whyNow: `${firstSignal} is currently the lead explanatory signal, reinforced by ${signalCountLabel}, ${relationLabel(event.relationType)}, and a collapse probability estimated at ${event.collapse_probability}%.`,
  }
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
  const [focusMode, setFocusMode] = useState(true)
  const [streamExpanded, setStreamExpanded] = useState(false)
  const [explainAudience, setExplainAudience] = useState<'retail' | 'investor' | 'data'>('retail')
  const [shockBurstId, setShockBurstId] = useState(0)
  const [animatedViewport, setAnimatedViewport] = useState<RadarViewport>({ x: 0, y: 0, span: 520 })
  const [parallaxOffset, setParallaxOffset] = useState<RadarOffset>({ x: 0, y: 0 })
  const [focusEntryId, setFocusEntryId] = useState(0)
  const streamRef = useRef<HTMLDivElement | null>(null)
  const previousShockMode = useRef(false)
  const animatedViewportRef = useRef<RadarViewport>({ x: 0, y: 0, span: 520 })
  const previousFocusedFirmId = useRef<string | null>(null)

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

  const targetViewport = useMemo<RadarViewport>(() => {
    const focusNode = focused ? radarNodeById.get(focused.firm_id) : null
    const zoom = clamp(focusMode && focusNode ? Math.max(radarZoom, 1.45) : radarZoom, 1, 2.3)
    const span = 520 / zoom
    const half = span / 2
    const centerX = focusMode && focusNode ? focusNode.x : 260
    const centerY = focusMode && focusNode ? focusNode.y : 260
    const min = 0
    const max = 520 - span
    const offsetX = clamp(centerX - half, min, max)
    const offsetY = clamp(centerY - half, min, max)
    return { x: offsetX, y: offsetY, span }
  }, [focusMode, focused, radarNodeById, radarZoom])

  useEffect(() => {
    animatedViewportRef.current = animatedViewport
  }, [animatedViewport])

  useEffect(() => {
    const startViewport = animatedViewportRef.current
    const delta =
      Math.abs(startViewport.x - targetViewport.x) +
      Math.abs(startViewport.y - targetViewport.y) +
      Math.abs(startViewport.span - targetViewport.span)

    if (delta < 0.5) {
      animatedViewportRef.current = targetViewport
      setAnimatedViewport(targetViewport)
      return
    }

    let frame = 0
    let startTime: number | null = null
    const duration = focusMode && focused ? 360 : 260

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp
      const progress = clamp((timestamp - startTime) / duration, 0, 1)
      const eased = easeOutCubic(progress)
      const nextViewport = {
        x: startViewport.x + (targetViewport.x - startViewport.x) * eased,
        y: startViewport.y + (targetViewport.y - startViewport.y) * eased,
        span: startViewport.span + (targetViewport.span - startViewport.span) * eased,
      }
      animatedViewportRef.current = nextViewport
      setAnimatedViewport(nextViewport)
      if (progress < 1) {
        frame = window.requestAnimationFrame(animate)
      }
    }

    frame = window.requestAnimationFrame(animate)

    return () => window.cancelAnimationFrame(frame)
  }, [focusMode, focused, targetViewport])

  const radarViewBox = `${animatedViewport.x} ${animatedViewport.y} ${animatedViewport.span} ${animatedViewport.span}`

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
  const focusedNarrative = useMemo(() => buildInstitutionalNarrative(focused), [focused])
  const focusTone = focused ? riskColor(focused.riskLevel) : COLORS.stable
  const committeeStatusLabel = focused
    ? focused.riskLevel === 'CRITICAL'
      ? 'Immediate committee review'
      : focused.riskLevel === 'HIGH'
        ? 'Escalated diligence'
        : focused.riskLevel === 'MEDIUM'
          ? 'Reinforced observation'
          : 'Baseline supervision'
    : 'Awaiting case selection'
  const radarSurfaceTransform = `translate(${parallaxOffset.x.toFixed(2)} ${parallaxOffset.y.toFixed(2)}) scale(${focused ? '1.01' : '1'})`

  useEffect(() => {
    const nextFocusedId = focused?.firm_id || null
    if (nextFocusedId && previousFocusedFirmId.current !== nextFocusedId) {
      setFocusEntryId((value) => value + 1)
    }
    previousFocusedFirmId.current = nextFocusedId
  }, [focused])

  const toggleWatch = (firmId: string) => {
    setWatchlist((prev) => (prev.includes(firmId) ? prev.filter((id) => id !== firmId) : [...prev, firmId]))
  }

  return (
    <div className="radar-page min-h-screen text-slate-100" style={{ backgroundColor: COLORS.bg }}>

      <div className="mx-auto max-w-[1560px] px-4 py-7 lg:px-8">
        <section className="rounded-2xl border border-white/10 bg-slate-900/35 px-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.14em] text-cyan-300">Sector Oversight Snapshot</p>
          <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.1em] text-slate-500">Sector Resilience</p>
              <p className={`text-lg font-semibold ${healthTone}`}>{sectorHealth} / 100</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.1em] text-slate-500">Risk Intensity</p>
              <p className="text-lg font-semibold text-amber-300">{sectorRiskIndex}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.1em] text-slate-500">Priority Alerts</p>
              <p className="text-lg font-semibold text-red-300">{threatGroups.high.length}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.1em] text-slate-500">Firms Under Coverage</p>
              <p className="text-lg font-semibold text-cyan-300">{payload?.count || events.length}</p>
            </div>
          </div>
          <div className="mt-2 border-t border-white/10 pt-2 text-[9px] uppercase tracking-[0.08em] text-slate-400">
            {loading ? 'Refreshing the supervisory evidence feed...' : payload?.headline || 'Supervisory evidence feed active'}
            {payload?.as_of ? ` · ${new Date(payload.as_of).toLocaleString('en-GB', { hour12: false })} UTC` : ''}
            {payload?.data_source ? ` · ${payload.data_source.replace(/_/g, ' ')}` : ''}
            {payload?.window_days ? ` · ${payload.window_days}d window` : ''}
          </div>
        </section>
        <section className="mt-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.45fr_0.78fr_0.9fr]">
            <div className="rounded-xl border border-cyan-400/15 bg-cyan-500/[0.05] px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] uppercase tracking-[0.16em] text-cyan-200">Committee Reading Framework</p>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-cyan-100">Primary Decision Surface</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-50">Evidence is compressed here so the circle stays dominant and the readout stays short.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-300">Threshold Logic</p>
              <p className="mt-2 text-[12px] leading-5 text-slate-200">Inner = baseline. Mid = reinforced. Outer = priority diligence.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-300">Expected Output</p>
              <p className="mt-2 text-[12px] leading-5 text-slate-200">A concise institutional memo on selection, not a long explainer block.</p>
            </div>
          </div>
        </section>

        {loadError && (
          <div className="mt-3 rounded-xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-100">
            Supervisory radar temporarily unavailable: {loadError}
          </div>
        )}

        <section className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
          <div className="xl:col-span-9 rounded-2xl border border-white/10 bg-slate-900/35 p-3">
            <div className="flex items-center justify-between">
              <p className="text-[9px] uppercase tracking-[0.12em] text-cyan-300">Radar Core</p>
              <div className="flex items-center gap-2">
                <div className="rounded-full border border-cyan-400/20 bg-cyan-500/[0.08] px-3 py-1 text-[9px] uppercase tracking-[0.12em] text-cyan-100">
                  Wheel Zoom Active · {radarZoom.toFixed(2)}x
                </div>
                <button
                  type="button"
                  onClick={() => setFocusMode((prev) => !prev)}
                  className={`rounded-md border px-2 py-1 text-[9px] uppercase tracking-[0.08em] ${focusMode ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200' : 'border-white/15 bg-white/5 text-slate-300'}`}
                >
                  Node Focus {focusMode ? 'On' : 'Off'}
                </button>
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
                  Contagion Mode {shockMode ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            <div className="mt-2 border-t border-white/10" />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
              <p className="text-[10px] text-slate-400">Wheel to zoom, click any node for memo, double-click to restore the default framing.</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">Focused transitions active</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">Committee view</span>
              </div>
            </div>

            <div className="mt-3">
              <div
                className="relative overflow-hidden rounded-[1.55rem] border border-white/10 bg-[radial-gradient(circle_at_top,#12324e_0%,#07111f_42%,#020611_100%)] p-2 shadow-[0_28px_90px_rgba(2,6,17,0.55)]"
                onWheel={(event) => {
                  event.preventDefault()
                  const delta = event.deltaY > 0 ? -0.08 : 0.08
                  setRadarZoom((value) => clamp(Number((value + delta).toFixed(2)), 1, 2.3))
                }}
                onDoubleClick={() => {
                  setRadarZoom(1)
                  setFocusMode(true)
                }}
                onPointerMove={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect()
                  const ratioX = (event.clientX - rect.left) / rect.width - 0.5
                  const ratioY = (event.clientY - rect.top) / rect.height - 0.5
                  setParallaxOffset({
                    x: clamp(ratioX * 12, -6, 6),
                    y: clamp(ratioY * 10, -5, 5),
                  })
                }}
                onPointerLeave={() => setParallaxOffset({ x: 0, y: 0 })}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.08),transparent_42%),radial-gradient(circle_at_50%_82%,rgba(248,250,252,0.04),transparent_45%)]" />
                <div className="pointer-events-none absolute inset-x-[14%] top-3 h-28 rounded-full bg-cyan-300/5 blur-3xl" />
                <div className="pointer-events-none absolute left-3 top-3 z-10 w-[198px] rounded-xl border border-white/10 bg-slate-950/82 p-2.5 backdrop-blur">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-slate-300">Radar Legend</p>
                  <div className="mt-2 space-y-1.5 text-[10px] text-slate-200">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.08em] text-slate-500">Colour</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-white/10 px-2 py-1" style={{ color: COLORS.stable }}>Stable</span>
                        <span className="rounded-full border border-white/10 px-2 py-1" style={{ color: COLORS.watch }}>Elevated review</span>
                        <span className="rounded-full border border-white/10 px-2 py-1" style={{ color: COLORS.danger }}>High concern</span>
                        <span className="rounded-full border border-white/10 px-2 py-1" style={{ color: COLORS.critical }}>Critical</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.08em] text-slate-500">Ring</p>
                      <p className="mt-1 leading-4 text-slate-300">Inner = baseline. Mid = reinforced. Outer = priority.</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.08em] text-slate-500">Placement</p>
                      <p className="mt-1 leading-4 text-slate-300">Jurisdiction, cluster and warning pattern determine placement.</p>
                    </div>
                  </div>
                </div>
                <div className="mx-auto flex w-full max-w-[980px] justify-center">
                <svg viewBox={radarViewBox} className="h-[560px] w-full rounded-[1.3rem]" role="img" aria-label="GTIXT Tactical Radar">
                  <defs>
                    <radialGradient id="radar-core" cx="50%" cy="50%" r="65%">
                      <stop offset="0%" stopColor="#0b1628" />
                      <stop offset="100%" stopColor={COLORS.bg} />
                    </radialGradient>
                    <radialGradient id="radar-breath" cx="50%" cy="50%" r="65%">
                      <stop offset="0%" stopColor="rgba(34,211,238,0.18)" />
                      <stop offset="100%" stopColor="rgba(34,211,238,0)" />
                    </radialGradient>
                    <filter id="focus-spotlight" x="-40%" y="-40%" width="180%" height="180%">
                      <feGaussianBlur stdDeviation="16" />
                    </filter>
                  </defs>
                  <rect x="0" y="0" width="520" height="520" fill="url(#radar-core)" />
                  <circle cx="260" cy="260" r="158" fill="url(#radar-breath)" opacity="0.14">
                    <animate attributeName="r" values="152;166;152" dur="6.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.08;0.18;0.08" dur="6.8s" repeatCount="indefinite" />
                  </circle>

                  <g transform={radarSurfaceTransform}>

                  <circle cx="260" cy="260" r={RING.inner} stroke={COLORS.grid} strokeWidth="1" fill="none" />
                  <circle cx="260" cy="260" r={RING.mid} stroke={COLORS.grid} strokeWidth="1" fill="none" />
                  <circle cx="260" cy="260" r={RING.outer} stroke={COLORS.grid} strokeWidth="1" fill="none" />
                  <circle cx="260" cy="260" r={240} stroke={COLORS.grid} strokeWidth="1" fill="none" opacity="0.6" />

                  <line x1="260" y1="20" x2="260" y2="500" stroke={COLORS.grid} strokeWidth="1" />
                  <line x1="20" y1="260" x2="500" y2="260" stroke={COLORS.grid} strokeWidth="1" />

                  <text x="260" y="45" textAnchor="middle" fill="#7e8da3" fontSize="9" letterSpacing="1">OUTER RING / PRIORITY DILIGENCE</text>
                  <text x="260" y="132" textAnchor="middle" fill="#7e8da3" fontSize="9" letterSpacing="1">MID RING / REINFORCED REVIEW</text>
                  <text x="260" y="234" textAnchor="middle" fill="#7e8da3" fontSize="9" letterSpacing="1">INNER RING / BASELINE SUPERVISION</text>

                  {focused && (
                    <circle cx="260" cy="260" r="252" fill="#020611" opacity="0.32" />
                  )}

                  {focused && radarNodeById.get(focused.firm_id) && (
                    <g pointerEvents="none">
                      <circle
                        cx={radarNodeById.get(focused.firm_id)?.x}
                        cy={radarNodeById.get(focused.firm_id)?.y}
                        r={(radarNodeById.get(focused.firm_id)?.size || 0) + 30}
                        fill={riskColor(focused.riskLevel)}
                        opacity="0.18"
                        filter="url(#focus-spotlight)"
                      />
                      <circle
                        cx={radarNodeById.get(focused.firm_id)?.x}
                        cy={radarNodeById.get(focused.firm_id)?.y}
                        r={(radarNodeById.get(focused.firm_id)?.size || 0) + 18}
                        fill="none"
                        stroke="#f8fafc"
                        strokeWidth="0.9"
                        opacity="0.38"
                      >
                        <animate attributeName="r" values={`${(radarNodeById.get(focused.firm_id)?.size || 0) + 14};${(radarNodeById.get(focused.firm_id)?.size || 0) + 19};${(radarNodeById.get(focused.firm_id)?.size || 0) + 14}`} dur="2.8s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.18;0.4;0.18" dur="2.8s" repeatCount="indefinite" />
                      </circle>
                      <circle
                        key={`focus-entry-${focusEntryId}`}
                        cx={radarNodeById.get(focused.firm_id)?.x}
                        cy={radarNodeById.get(focused.firm_id)?.y}
                        r={(radarNodeById.get(focused.firm_id)?.size || 0) + 6}
                        fill="none"
                        stroke={riskColor(focused.riskLevel)}
                        strokeWidth="1.2"
                        opacity="0.8"
                      >
                        <animate attributeName="r" values={`${(radarNodeById.get(focused.firm_id)?.size || 0) + 6};${(radarNodeById.get(focused.firm_id)?.size || 0) + 26}`} dur="0.55s" repeatCount="1" />
                        <animate attributeName="opacity" values="0.75;0" dur="0.55s" repeatCount="1" />
                      </circle>
                    </g>
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
                      <g
                        key={node.event.firm_id}
                        opacity={dimmed ? 0.16 : 1}
                        onMouseEnter={() => setSelectedFirmId(node.event.firm_id)}
                        onClick={() => {
                          setSelectedFirmId(node.event.firm_id)
                          setFocusMode(true)
                        }}
                        style={{ cursor: 'pointer' }}
                      >
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
                          stroke={isFocused ? '#f8fafc' : isConnected ? `${node.color}88` : '#020617'}
                          strokeWidth={isFocused ? 1.4 : 1}
                        />
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isFocused ? node.size + 5.5 : node.size + 2.5}
                          fill="none"
                          stroke={isFocused ? `${node.color}99` : `${node.color}40`}
                          strokeWidth="0.85"
                          opacity={isFocused ? 0.95 : 0.32}
                        />
                        {(isFocused || isConnected) && (
                          <text x={node.x + node.size + 8} y={node.y - 8} fill="#e2e8f0" fontSize="9" letterSpacing="0.6">
                            {node.event.firm_name.slice(0, 18)}
                          </text>
                        )}
                        <title>{`${node.event.firm_name} · ${node.event.riskLevel} · ${node.event.gri_score.toFixed(1)}`}</title>
                      </g>
                    )
                  })}
                  </g>
                </svg>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.96))] shadow-[0_18px_60px_rgba(2,6,23,0.42)]">
                <div className="border-b border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.18em] text-slate-400">Investment Committee Memorandum</p>
                      <p className="mt-1 text-base font-semibold text-white">Selected Institutional Readout</p>
                    </div>
                    <span
                      className="rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.14em]"
                      style={{ borderColor: `${focusTone}55`, color: focusTone, backgroundColor: `${focusTone}14` }}
                    >
                      {committeeStatusLabel}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <AnimatePresence mode="wait">
                    {!focused && (
                      <motion.div
                        key="empty-readout"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center"
                      >
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Awaiting Case Selection</p>
                        <p className="mt-2 text-sm text-slate-300">Select any firm on the radar to open a short supervisory memorandum.</p>
                      </motion.div>
                    )}
                    {focused && (
                      <motion.div
                        key={focused.firm_id}
                        initial={{ opacity: 0, y: 12, scale: 0.985 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.985 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="space-y-3"
                      >
                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.15fr_0.85fr]">
                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="truncate text-lg font-semibold text-white">{focused.firm_name}</p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">{focused.region} · {focused.riskLevel}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500">Evidence cycle</p>
                                <p className="mt-1 text-[11px] text-slate-200">{new Date(focused.computed_at || focused.snapshot_date).toLocaleString('en-GB', { hour12: false })} UTC</p>
                              </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
                              <div className="rounded-xl border border-white/10 bg-slate-950/55 px-3 py-3">
                                <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500">GTI Score</p>
                                <p className="mt-1 text-lg font-semibold text-cyan-300">{focused.gri_score.toFixed(1)}</p>
                              </div>
                              <div className="rounded-xl border border-white/10 bg-slate-950/55 px-3 py-3">
                                <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500">Distress</p>
                                <p className="mt-1 text-lg font-semibold text-red-300">{focused.collapse_probability}%</p>
                              </div>
                              <div className="rounded-xl border border-white/10 bg-slate-950/55 px-3 py-3">
                                <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500">Signals</p>
                                <p className="mt-1 text-lg font-semibold text-slate-100">{focused.signal_count}</p>
                              </div>
                              <div className="rounded-xl border border-white/10 bg-slate-950/55 px-3 py-3">
                                <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500">Lead axis</p>
                                <p className="mt-1 text-sm font-semibold text-slate-100">{focused.relationType.replace(/-/g, ' ')}</p>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-cyan-500/[0.05] px-4 py-4">
                            <p className="text-[9px] uppercase tracking-[0.16em] text-cyan-200">Executive Readout</p>
                            <p className="mt-3 text-base font-medium leading-7 text-slate-100">{focusedNarrative.overview}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">Basis For Placement</p>
                            <p className="mt-2 text-sm leading-6 text-slate-200">{focusedNarrative.whyNow}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">Client Relevance</p>
                            <p className="mt-2 text-sm leading-6 text-slate-200">{focusedNarrative.purpose}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">Supervisory Posture</p>
                            <p className="mt-2 text-sm leading-6 text-slate-200">{focusedNarrative.action}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[0.9fr_1.1fr]">
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">Corroborating Indicators</p>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {(focused.warning_signals?.length ? focused.warning_signals : ['No explicit signal']).slice(0, 6).map((signal) => (
                                <span key={signal} className="rounded-full border border-white/10 bg-slate-950/70 px-2 py-1 text-[10px] text-slate-200">
                                  {formatSignalLabel(signal)}
                                </span>
                              ))}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-1.5">
                              <Link href={`/firms/${focused.firm_id}`} className="rounded-md border border-cyan-400/35 bg-cyan-500/10 px-2 py-1 text-[9px] uppercase tracking-[0.08em] text-cyan-100">
                                Open Institutional Profile
                              </Link>
                              <button
                                type="button"
                                onClick={() => toggleWatch(focused.firm_id)}
                                className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[9px] uppercase tracking-[0.08em] text-slate-200"
                              >
                                {watchlist.includes(focused.firm_id) ? 'Remove From Watchlist' : 'Add To Watchlist'}
                              </button>
                            </div>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-slate-950/55 p-4">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">Transmission Map</p>
                              <span className="text-[9px] uppercase tracking-[0.08em] text-slate-600">{shockMode ? 'Stress View' : 'Correlation View'}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[9px] uppercase tracking-[0.08em] text-slate-500">
                              <span>Primary {propagationGraph.filter((node) => node.tier === 'primary').length}</span>
                              <span>Secondary {propagationGraph.filter((node) => node.tier === 'secondary').length}</span>
                              <span>{payload?.data_source === 'live_evidence' ? 'Live' : 'Runtime'}</span>
                            </div>
                            <svg viewBox="0 0 320 180" className="mt-3 h-[168px] w-full rounded bg-black/20" role="img" aria-label="Risk Propagation Graph">
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
                              Source {payload?.data_source?.replace(/_/g, ' ') || 'runtime'} · ranked by shared indicators, jurisdictional overlap, and risk-cluster proximity.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {shockMode && focused && (
              <div className="rounded-xl border border-red-400/25 bg-red-950/20 p-2">
                <p className="text-[9px] uppercase tracking-[0.1em] text-red-200">Contagion Scenario</p>
                <p className="mt-1 text-xs text-red-100">If {focused.firm_name} were to fail abruptly, these cases would warrant immediate review for possible transmission effects:</p>
                <div className="mt-1.5 space-y-1">
                  {shockImpacted.map((event) => (
                    <button
                      key={event.firm_id}
                      type="button"
                      onClick={() => {
                        setSelectedFirmId(event.firm_id)
                        setFocusMode(true)
                      }}
                      className="w-full rounded border border-red-300/25 bg-red-500/10 px-2 py-1 text-left text-[9px] uppercase tracking-[0.08em] text-red-100"
                    >
                      {event.firm_name} · {event.riskLevel}
                    </button>
                  ))}
                  {!shockImpacted.length && <p className="text-[10px] text-red-100/80">No immediate transmission candidate is currently indicated.</p>}
                </div>
              </div>
            )}
          </div>

          <aside className="xl:col-span-3 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/35 p-3">
              <p className="text-[9px] uppercase tracking-[0.12em] text-red-300">Priority Review Queue</p>
              <div className="mt-2 border-t border-white/10" />

              <div className="mt-2 space-y-2">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.08em] text-red-300">Immediate Escalations</p>
                  <div className="mt-1 space-y-1">
                    {highThreatEvents.map((event) => {
                      const ts = event.computed_at || event.snapshot_date
                      const confidence = Math.round(clamp(event.collapse_probability * 0.92, 45, 99))
                      return (
                        <button
                          key={`${event.firm_id}-${ts}`}
                          type="button"
                          onClick={() => {
                            setSelectedFirmId(event.firm_id)
                            setFocusMode(true)
                          }}
                          className={`w-full rounded-2xl border px-3 py-2.5 text-left shadow-[0_12px_30px_rgba(2,6,23,0.2)] transition-colors ${focused?.firm_id === event.firm_id ? 'border-cyan-400/40 bg-cyan-500/10' : 'border-red-400/20 bg-red-500/[0.08]'}`}
                        >
                          <p className="truncate text-[10px] font-semibold text-white">{event.firm_name}</p>
                          <p className="mt-0.5 truncate text-[10px] text-red-100">{event.warning_signals?.[0] || 'Collapse probability rising'}</p>
                          <div className="mt-1 flex items-center justify-between text-[9px] uppercase tracking-[0.08em] text-slate-300">
                            <span>Confidence {confidence}%</span>
                            <span>{new Date(ts).toLocaleTimeString('en-GB', { hour12: false })}</span>
                          </div>
                          <p className="mt-0.5 text-[9px] uppercase tracking-[0.08em] text-slate-400">Evidence axis {event.relationType}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-2">
                  <p className="text-[9px] uppercase tracking-[0.08em] text-amber-300">Reinforced Review</p>
                  <div className="mt-1 grid grid-cols-1 gap-1">
                    {threatGroups.medium.slice(0, 5).map((event) => (
                      <button key={event.firm_id} type="button" onClick={() => {
                        setSelectedFirmId(event.firm_id)
                        setFocusMode(true)
                      }} className="rounded border border-amber-300/25 bg-amber-500/10 px-2 py-1 text-left text-[9px] uppercase tracking-[0.08em] text-amber-100">
                        {event.firm_name} · {event.warning_signals?.[0] || 'watch signal'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-2">
                  <p className="text-[9px] uppercase tracking-[0.08em] text-yellow-200">Early Monitoring</p>
                  <div className="mt-1 grid grid-cols-1 gap-1">
                    {threatGroups.low.slice(0, 5).map((event) => (
                      <button key={event.firm_id} type="button" onClick={() => {
                        setSelectedFirmId(event.firm_id)
                        setFocusMode(true)
                      }} className="rounded border border-yellow-200/25 bg-yellow-400/10 px-2 py-1 text-left text-[9px] uppercase tracking-[0.08em] text-yellow-100">
                        {event.firm_name} · {event.warning_signals?.[0] || 'low-level signal'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/35 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[9px] uppercase tracking-[0.12em] text-cyan-300">Latest Evidentiary Flow</p>
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
                    {audience === 'retail' ? 'client brief' : audience === 'investor' ? 'investor brief' : 'data lens'}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-slate-300">
                {explainAudience === 'retail' && 'Client brief: each line records a newly surfaced warning attached to one firm. It should be read as a review note requiring judgement, not as a definitive conclusion.'}
                {explainAudience === 'investor' && 'Investor brief: recurrence, clustering, and cadence of repetition usually carry more supervisory value than any isolated alert taken on its own.'}
                {explainAudience === 'data' && 'Data lens: the stream foregrounds the latest timestamped observations and the leading explanatory label assigned by the model.'}
              </p>
              <div ref={streamRef} className="mt-2 max-h-[220px] overflow-y-auto rounded-md border border-white/10 bg-black/25 p-2 font-mono text-[10px] leading-relaxed text-cyan-100">
                {visibleStreamItems.map((item) => (
                  <div key={item.id} className="truncate">
                    <span className="text-slate-500">[{new Date(item.ts).toLocaleTimeString('en-GB', { hour12: false })}]</span>{' '}
                    <span className="text-slate-200">{item.signal}</span>{' '}
                    <span className="text-cyan-200">— {item.firm}</span>
                  </div>
                ))}
                {!visibleStreamItems.length && <p className="text-slate-500">No live evidence item is currently visible in the feed.</p>}
              </div>
              <div className="mt-2 border-t border-white/10 pt-2 text-[9px] uppercase tracking-[0.08em] text-slate-500">
                Regulatory Mesh {relationCounts.jurisdiction} · Risk Cluster {relationCounts['risk-cluster']} · Warning Lattice {relationCounts['warning-signal']}
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-3 rounded-xl border border-white/10 bg-slate-900/35 p-3">
          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-400">Supervisory Timeline</p>
          <div className="mt-2 border-t border-white/10" />
          <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-8">
            {timeline.map(([label, stats]) => (
              <div key={label} className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5">
                <p className="text-[9px] uppercase tracking-[0.08em] text-slate-400">{label}</p>
                <div className="mt-1.5 h-1.5 w-full rounded bg-white/10">
                  <div className="h-full rounded bg-red-400/80" style={{ width: `${clamp(stats.critical * 10, 8, 100)}%` }} />
                </div>
                <p className="mt-1 text-[9px] uppercase tracking-[0.08em] text-slate-500">Critical {stats.critical} · Review {stats.watch}</p>
              </div>
            ))}
            {!timeline.length && <p className="text-xs text-slate-400">No supervisory markers are available yet.</p>}
          </div>
        </section>

        <section className="mt-3 rounded-xl border border-white/10 bg-slate-900/35 p-3">
          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-400">Watchlist</p>
          <div className="mt-2 border-t border-white/10" />
          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
            {watchlistEvents.map((event) => (
              <div key={event.firm_id} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[10px] font-semibold text-white">{event.firm_name}</p>
                  <span className="text-[9px] uppercase" style={{ color: riskColor(event.riskLevel) }}>{event.riskLevel}</span>
                </div>
                <p className="mt-0.5 text-[9px] uppercase tracking-[0.08em] text-slate-500">{event.region} · {event.collapse_probability}%</p>
                <p className="mt-1 truncate text-[10px] text-slate-300">{event.warning_signals?.[0] || 'No active evidence flag'}</p>
              </div>
            ))}
            {!watchlistEvents.length && <p className="text-xs text-slate-400">Add firms from radar core or active threats.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}
