'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import GTIXTGlobe, { type ActiveLayer as GlobeActiveLayer, type GlobeLinkType } from '@/components/public/GTIXTGlobe'
import { RealIcon } from '@/components/design-system/RealIcon'
import { resolveFirmCoordinates } from '@/lib/firm-geolocation'
import { useGlobeTelemetry } from '@/hooks/useGlobeTelemetry'
import { GlobeTelemetry } from '@/lib/globe-telemetry'

type ApiIndustryNode = {
  id: string
  label: string
  slug: string
  websiteRoot?: string | null
  headquarters?: string | null
  modelType: string
  score: number
  riskIndex: number
  riskCategory: string
  jurisdiction: string
  rviStatus: string
  payoutReliability: number
  operationalStability: number
  earlyWarning: boolean
  firstSeenPeriod?: string | null
  lastSeenPeriod?: string | null
}

type ApiIndustryEdge = {
  source: string
  target: string
  relation: 'jurisdiction' | 'risk-cluster' | 'warning-signal'
  weight: number
}

type ApiIndustryPayload = {
  success: boolean
  count: number
  clusters: {
    highRisk: number
    stable: number
    earlyWarning: number
  }
  timeline?: {
    minYear: number
    maxYear: number
    years: number[]
    minPeriod: string
    maxPeriod: string
    periods: string[]
    yearlyTotals: Array<{
      year: number
      nodeCount: number
      earlyWarningCount: number
      avgRisk: number
    }>
    monthlyTotals: Array<{
      period: string
      nodeCount: number
      earlyWarningCount: number
      avgRisk: number
    }>
    perFirm: Record<
      string,
      {
        firstPeriod: string | null
        lastPeriod: string | null
        firstYear: number | null
        lastYear: number | null
        monthly: Array<{ period: string; avgRisk: number; earlyWarning: boolean }>
        yearly: Array<{ year: number; avgRisk: number; earlyWarning: boolean }>
      }
    >
  }
  nodes: ApiIndustryNode[]
  edges: ApiIndustryEdge[]
}

type LayerKey = 'regulatory' | 'risk' | 'community'
type RiskFilter = 'all' | 'low' | 'medium' | 'high' | 'critical'
type RegionFilter = 'all' | 'USA' | 'EU' | 'UAE' | 'Australia'
type ActiveGlobeLayer = GlobeActiveLayer
type RegimeMode = 'stable' | 'stress' | 'instability'
type TradingViewMode = 'compact' | 'bloomberg' | 'palantir'

function riskBandFromNumeric(value: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (value >= 65) return 'CRITICAL'
  if (value >= 48) return 'HIGH'
  if (value >= 30) return 'MEDIUM'
  return 'LOW'
}

type FirmIntelligencePayload = {
  success: boolean
  data?: {
    firm_id: string
    name: string
    website?: string
    jurisdiction?: string
    gtixt_score: number
    risk_index: number
    risk_category: string
    early_warning: boolean
    regulatory_status: 'Verified' | 'Unknown' | 'Suspicious'
    rvi_status: string
    rvi_score: number
    payout_reliability: number
    operational_stability: number
  }
  snapshot_info?: {
    snapshot_key?: string
    created_at?: string
  }
}

type CollapseScenarioNode = {
  id: string
  label?: string
  modelType?: string
  currentRiskIndex?: number
  riskIndex?: number
  currentEarlyWarning?: boolean
  periodDelta?: number
}

type CollapseScenarioLink = {
  source: string
  target: string
}

function buildCollapseScenario(
  seedId: string | null,
  nodes: CollapseScenarioNode[],
  links: CollapseScenarioLink[],
  maxDepth: number
) {
  if (!seedId || !nodes.length) return null

  const adjacency = new Map<string, string[]>()
  nodes.forEach((node) => adjacency.set(node.id, []))
  links.forEach((link) => {
    adjacency.get(link.source)?.push(link.target)
    adjacency.get(link.target)?.push(link.source)
  })

  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const hopById = new Map<string, number>([[seedId, 0]])
  const queue = [{ id: seedId, depth: 0 }]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || current.depth >= maxDepth) continue
    const neighbors = adjacency.get(current.id) || []
    neighbors.forEach((nextId) => {
      if (hopById.has(nextId)) return
      hopById.set(nextId, current.depth + 1)
      queue.push({ id: nextId, depth: current.depth + 1 })
    })
  }

  const impactedNodes = [...hopById.keys()]
    .map((id) => nodeById.get(id))
    .filter((node): node is CollapseScenarioNode => Boolean(node))

  const hopCounts = [...hopById.entries()].reduce(
    (accumulator, [, hop]) => {
      accumulator.set(hop, (accumulator.get(hop) || 0) + 1)
      return accumulator
    },
    new Map<number, number>()
  )

  const topSectors = impactedNodes.reduce(
    (accumulator, node) => {
      const key = String(node.modelType || 'UNKNOWN')
      const current = accumulator.get(key) || { count: 0, cumulativeRisk: 0 }
      current.count += 1
      current.cumulativeRisk += Number(node.currentRiskIndex ?? node.riskIndex ?? 0)
      accumulator.set(key, current)
      return accumulator
    },
    new Map<string, { count: number; cumulativeRisk: number }>()
  )

  const impactedSet = new Set(hopById.keys())
  const stressedLinks = links.filter((link) => impactedSet.has(link.source) && impactedSet.has(link.target)).length
  const earlyWarningCount = impactedNodes.filter((node) => node.currentEarlyWarning).length
  const avgRisk =
    impactedNodes.reduce((sum, node) => sum + Number(node.currentRiskIndex ?? node.riskIndex ?? 0), 0) /
    Math.max(impactedNodes.length, 1)
  const avgDelta = impactedNodes.reduce((sum, node) => sum + Number(node.periodDelta || 0), 0) / Math.max(impactedNodes.length, 1)
  const hops = [...hopById.values()]

  return {
    seedId,
    impactedCount: impactedNodes.length,
    maxHop: hops.length ? Math.max(...hops) : 0,
    seedConnections: adjacency.get(seedId)?.length || 0,
    stressedLinks,
    earlyWarningCount,
    avgRisk,
    avgDelta,
    impactedSet,
    hopCounts: [...hopCounts.entries()].sort((a, b) => a[0] - b[0]),
    topSectors: [...topSectors.entries()]
      .map(([sector, value]) => ({
        sector,
        count: value.count,
        share: Math.round((value.count / Math.max(impactedNodes.length, 1)) * 100),
        cumulativeRisk: value.cumulativeRisk,
      }))
      .sort((a, b) => b.cumulativeRisk - a.cumulativeRisk)
      .slice(0, 3),
  }
}

function toRiskBand(category: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const normalized = category.toLowerCase()
  if (normalized.includes('low')) return 'LOW'
  if (normalized.includes('moderate')) return 'MEDIUM'
  if (normalized.includes('elevated')) return 'HIGH'
  if (normalized.includes('high') || normalized.includes('critical')) return 'CRITICAL'
  return 'MEDIUM'
}

function toRegion(jurisdiction: string): 'USA' | 'EU' | 'UAE' | 'Australia' {
  const token = (jurisdiction || '').toUpperCase()
  if (['US', 'USA', 'UNITED STATES'].includes(token)) return 'USA'
  if (['AE', 'UAE', 'DUBAI'].includes(token)) return 'UAE'
  if (['AU', 'AUS', 'AUSTRALIA'].includes(token)) return 'Australia'
  return 'EU'
}

export default function IndustryMapPage() {
  const { attachGlobeContainer, isGlobeV2Enabled } = useGlobeTelemetry()
  // Memoised perf sample callback — forwards to GlobeTelemetry singleton
  const handlePerfSample = useCallback((fps: number, frameTimeMs: number, drawCalls: number) => {
    GlobeTelemetry.recordFrame(frameTimeMs, drawCalls)
    // Also visible in dev tools console during observation window
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(
        `[Globe perf] FPS=${fps.toFixed(1)} frameMs=${frameTimeMs.toFixed(1)} drawCalls=${drawCalls.toFixed(0)}`
      )
    }
  }, [])

  const [payload, setPayload] = useState<ApiIndustryPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const hasEverLoadedRef = useRef(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all')
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all')
  const [onlyEarlyWarning, setOnlyEarlyWarning] = useState(false)
  const [webglAvailable, setWebglAvailable] = useState(true)
  const [globeRenderError, setGlobeRenderError] = useState<string | null>(null)
  const [globeMountKey, setGlobeMountKey] = useState(0)
  const [globeRenderRetryCount, setGlobeRenderRetryCount] = useState(0)
  const [activeGlobeLayer, setActiveGlobeLayer] = useState<ActiveGlobeLayer>('risk')
  const [regimeMode, setRegimeMode] = useState<RegimeMode>('stable')
  const [timelineCursor, setTimelineCursor] = useState('')
  const [riskShockEnabled, setRiskShockEnabled] = useState(false)
  const [sectorPulseEnabled, setSectorPulseEnabled] = useState(false)
  const [collapseSimulationEnabled, setCollapseSimulationEnabled] = useState(false)
  const [collapseSeedId, setCollapseSeedId] = useState<string | null>(null)
  const [collapseComparisonEnabled, setCollapseComparisonEnabled] = useState(false)
  const [collapseComparisonSeedId, setCollapseComparisonSeedId] = useState<string | null>(null)
  const [collapsePropagationDepth, setCollapsePropagationDepth] = useState(4)
  const [collapseIntensity, setCollapseIntensity] = useState(1)
  const [collapsePlaybackRunning, setCollapsePlaybackRunning] = useState(true)
  const [collapsePlaybackSpeed, setCollapsePlaybackSpeed] = useState(1)
  const [collapsePlaybackStepSignal, setCollapsePlaybackStepSignal] = useState(0)
  const [collapsePlaybackResetSignal, setCollapsePlaybackResetSignal] = useState(0)
  const [selectedFirmId, setSelectedFirmId] = useState<string | null>(null)
  const [selectedLink, setSelectedLink] = useState<{ source: string; target: string; type?: GlobeLinkType } | null>(null)
  const [tradingViewMode, setTradingViewMode] = useState<TradingViewMode>('bloomberg')
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null)
  const [intelligence, setIntelligence] = useState<FirmIntelligencePayload | null>(null)
  const [intelligenceLoading, setIntelligenceLoading] = useState(false)
  const [intelligenceError, setIntelligenceError] = useState<string | null>(null)
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    regulatory: true,
    risk: true,
    community: true,
  })
  const [globeFiltersExpanded, setGlobeFiltersExpanded] = useState(false)
  const [priorityQueueDrawerOpen, setPriorityQueueDrawerOpen] = useState(false)
  const globeRetryTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (globeRetryTimerRef.current != null) {
        window.clearTimeout(globeRetryTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    let active = true
    let pollId: number | null = null

    const loadMap = async () => {
      const isFirstLoad = !hasEverLoadedRef.current
      try {
        // Background refresh: never flash loading state if we already have data
        if (isFirstLoad) setLoading(true)
        const response = await fetch('/api/industry-map?limit=500', { cache: 'no-store' })
        const json = (await response.json()) as ApiIndustryPayload

        if (!response.ok || !json?.success) {
          throw new Error('Industry map data unavailable')
        }

        if (active) {
          setPayload(json)
          setLastRefreshAt(new Date().toISOString())
          hasEverLoadedRef.current = true
          if (isFirstLoad) setLoadError(null)
        }
      } catch (error) {
        if (active && isFirstLoad) {
          // Only show error state on first load failure; background failures are silent
          setLoadError(error instanceof Error ? error.message : 'Unable to load industry map')
          setPayload(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadMap()
    pollId = window.setInterval(() => {
      void loadMap()
    }, 45000)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadMap()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (pollId != null) {
        window.clearInterval(pollId)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const canvas = document.createElement('canvas')
    const hasWebgl = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    setWebglAvailable(hasWebgl)
  }, [])

  // Default audience targeting: compact on smaller screens, Bloomberg on desktop.
  useEffect(() => {
    if (typeof window === 'undefined') return
    setTradingViewMode(window.innerWidth < 1360 ? 'compact' : 'bloomberg')
  }, [])

  useEffect(() => {
    const maxPeriod = payload?.timeline?.maxPeriod
    if (maxPeriod && timelineCursor !== maxPeriod) {
      setTimelineCursor(maxPeriod)
    }
  }, [payload?.timeline?.maxPeriod])

  const handleGlobeRenderError = useCallback((reason: string) => {
    const normalizedReason = (reason || '').toLowerCase()
    const looksTransientContainerIssue =
      normalizedReason.includes('zero') ||
      normalizedReason.includes('invalid size') ||
      normalizedReason.includes('container') ||
      normalizedReason.includes('layout')

    if (looksTransientContainerIssue && globeRenderRetryCount < 4) {
      const nextRetry = globeRenderRetryCount + 1
      setGlobeRenderRetryCount(nextRetry)
      setGlobeRenderError(`container sizing pending; retrying GTIXT Globe (${nextRetry}/4)`)
      if (globeRetryTimerRef.current != null) {
        window.clearTimeout(globeRetryTimerRef.current)
      }
      globeRetryTimerRef.current = window.setTimeout(() => {
        setGlobeMountKey((prev) => prev + 1)
      }, 180)
      return
    }

    setGlobeRenderError(reason || 'webgl rendering error')
  }, [globeRenderRetryCount])

  const handleGlobeRenderReady = useCallback(() => {
    if (globeRetryTimerRef.current != null) {
      window.clearTimeout(globeRetryTimerRef.current)
      globeRetryTimerRef.current = null
    }
    setGlobeRenderRetryCount(0)
    setGlobeRenderError(null)
    // Record first-frame telemetry
    GlobeTelemetry.firstFrame()
  }, [])

  const filteredNodes = useMemo(() => {
    const nodes = payload?.nodes || []
    const query = searchQuery.trim().toLowerCase()

    return nodes.filter((node) => {
      if (query) {
        const haystack = `${node.id} ${node.label} ${node.jurisdiction} ${node.modelType}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }

      if (onlyEarlyWarning && !node.earlyWarning) return false

      if (riskFilter !== 'all') {
        const band = toRiskBand(node.riskCategory)
        if (riskFilter === 'critical' && band !== 'CRITICAL') return false
        if (riskFilter === 'high' && band !== 'HIGH') return false
        if (riskFilter === 'medium' && band !== 'MEDIUM') return false
        if (riskFilter === 'low' && band !== 'LOW') return false
      }

      if (regionFilter !== 'all') {
        const region = toRegion(node.jurisdiction)
        if (region !== regionFilter) return false
      }

      return true
    })
  }, [onlyEarlyWarning, payload?.nodes, regionFilter, riskFilter, searchQuery])

  const runtimeGraph = useMemo(() => {
    if (!filteredNodes.length) {
      return { nodes: [], links: [] }
    }

    const layerByRelation: Record<ApiIndustryEdge['relation'], LayerKey> = {
      jurisdiction: 'regulatory',
      'risk-cluster': 'risk',
      'warning-signal': 'community',
    }

    const visibleNodeIds = new Set(filteredNodes.map((node) => node.id))
    const filteredEdges = (payload?.edges || []).filter(
      (edge) => layers[layerByRelation[edge.relation]] && visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    )

    const mappedNodes = filteredNodes.map((node) => {
      const coordinates = resolveFirmCoordinates({
        id: node.id,
        label: node.label,
        jurisdiction: node.jurisdiction,
        websiteRoot: node.websiteRoot,
        headquarters: node.headquarters,
      })
      return {
        id: node.id,
        slug: node.slug,
        label: node.label,
        type: 'prop' as const,
        entityType: 'star' as const,
        score: Number(node.score || 0),
        riskIndex: Number(node.riskIndex || 0),
        risk: toRiskBand(node.riskCategory),
        jurisdiction: node.jurisdiction,
        influence: Math.max(55, Math.round(Number(node.score || 0) + 5)),
        region: toRegion(node.jurisdiction || ''),
        payoutReliability: Number(node.payoutReliability || 50),
        operationalStability: Number(node.operationalStability || 50),
        modelType: String(node.modelType || 'UNKNOWN'),
        currentEarlyWarning: node.earlyWarning,
        headquarters: node.headquarters || undefined,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
      }
    })

    const perFirmTimeline = payload?.timeline?.perFirm || {}
    const withTimelineMeta = mappedNodes.map((node) => {
      const record = perFirmTimeline[node.id]
      const monthly = record?.monthly || []
      const currentMonthly = monthly.find((entry) => entry.period === timelineCursor) || monthly[monthly.length - 1] || null
      const currentIndex = currentMonthly?.avgRisk ?? node.riskIndex
      const currentPosition = currentMonthly ? monthly.findIndex((entry) => entry.period === currentMonthly.period) : -1
      const previousMonthly = currentPosition > 0 ? monthly[currentPosition - 1] : null
      const periodDelta = previousMonthly ? currentIndex - previousMonthly.avgRisk : 0
      return {
        ...node,
        risk: riskBandFromNumeric(currentIndex),
        riskIndex: currentIndex,
        currentRiskIndex: currentIndex,
        currentEarlyWarning: currentMonthly?.earlyWarning ?? node.currentEarlyWarning ?? false,
        periodDelta,
        foundedPeriod: record?.firstPeriod ?? null,
        sunsetPeriod: record?.lastPeriod ?? null,
        foundedYear: record?.firstYear ?? null,
        sunsetYear: record?.lastYear ?? null,
      }
    })

    const timelineNodes = withTimelineMeta.filter((node) => {
      if (node.foundedPeriod && timelineCursor && node.foundedPeriod > timelineCursor) return false
      if (node.sunsetPeriod && timelineCursor && timelineCursor > node.sunsetPeriod) return false
      return true
    })

    const timelineNodeIds = new Set(timelineNodes.map((node) => node.id))

    const mappedLinks = filteredEdges
      .filter((edge) => timelineNodeIds.has(edge.source) && timelineNodeIds.has(edge.target))
      .map((edge) => {
        return {
          source: edge.source,
          target: edge.target,
          type: edge.relation as GlobeLinkType,
        }
      })

    return {
      nodes: timelineNodes,
      links: mappedLinks,
    }
  }, [filteredNodes, layers, payload?.edges, payload?.timeline?.perFirm, timelineCursor])

  const selectedFirm = useMemo(() => {
    if (!selectedFirmId) return null
    return runtimeGraph.nodes.find((node) => node.id === selectedFirmId) || null
  }, [runtimeGraph.nodes, selectedFirmId])

  useEffect(() => {
    let active = true
    let pollId: number | null = null

    if (!selectedFirm) {
      setIntelligence(null)
      setIntelligenceError(null)
      setIntelligenceLoading(false)
      return () => {
        active = false
        if (pollId != null) {
          window.clearInterval(pollId)
        }
      }
    }

    const fetchIntelligence = async () => {
      try {
        setIntelligenceLoading(true)
        setIntelligenceError(null)
        const response = await fetch(`/api/intelligence/firm/${encodeURIComponent(selectedFirm.slug || selectedFirm.id)}`, {
          cache: 'no-store',
        })
        const json = (await response.json()) as FirmIntelligencePayload

        if (!response.ok || !json?.success) {
          throw new Error('Intelligence unavailable')
        }

        if (active) {
          setIntelligence(json)
        }
      } catch (error) {
        if (active) {
          setIntelligence(null)
          setIntelligenceError(error instanceof Error ? error.message : 'Unable to load intelligence')
        }
      } finally {
        if (active) {
          setIntelligenceLoading(false)
        }
      }
    }

    fetchIntelligence()
    pollId = window.setInterval(() => {
      void fetchIntelligence()
    }, 30000)

    return () => {
      active = false
      if (pollId != null) {
        window.clearInterval(pollId)
      }
    }
  }, [selectedFirm])

  const runtimeNodeIds = useMemo(() => {
    return new Set(runtimeGraph.nodes.map((node) => node.id))
  }, [runtimeGraph.nodes])

  const timelineScopedNodes = useMemo(() => {
    return filteredNodes.filter((node) => runtimeNodeIds.has(node.id))
  }, [filteredNodes, runtimeNodeIds])

  const selectedFirmTimeline = useMemo(() => {
    if (!selectedFirmId) return null
    return payload?.timeline?.perFirm?.[selectedFirmId] || null
  }, [payload?.timeline?.perFirm, selectedFirmId])

  const selectedFirmConnections = useMemo(() => {
    if (!selectedFirmId) return 0
    return runtimeGraph.links.filter((link) => link.source === selectedFirmId || link.target === selectedFirmId).length
  }, [runtimeGraph.links, selectedFirmId])

  // Risk predictions: linear extrapolation from periodDelta
  const predictions = useMemo(() => {
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
    return Object.fromEntries(runtimeGraph.nodes.map((node) => {
      const base = Number(node.currentRiskIndex ?? node.riskIndex ?? 0)
      const delta = Number((node as { periodDelta?: number }).periodDelta ?? 0)
      const projectedRisk = clamp(base + delta * 1.5, 0, 100)
      const trajectory = delta > 0.5 ? 'rising' : delta < -0.5 ? 'falling' : 'stable'
      return [node.id, { projectedRisk, trajectory, delta }]
    }))
  }, [runtimeGraph.nodes])

  // Anomaly panel: early-warning firms sorted by risk index
  const anomalyNodes = useMemo(() =>
    runtimeGraph.nodes
      .filter((n) => n.currentEarlyWarning)
      .sort((a, b) => Number(b.currentRiskIndex ?? b.riskIndex ?? 0) - Number(a.currentRiskIndex ?? a.riskIndex ?? 0)),
    [runtimeGraph.nodes]
  )

  // K-means auto-clusters (k=5, dimensions: riskIndex, score, connections)
  const autoCluster = useMemo(() => {
    const degreeById = new Map<string, number>()
    runtimeGraph.links.forEach((link) => {
      degreeById.set(link.source, (degreeById.get(link.source) || 0) + 1)
      degreeById.set(link.target, (degreeById.get(link.target) || 0) + 1)
    })
    const nodes = runtimeGraph.nodes
    if (nodes.length < 5) return []

    // Normalize features: [riskIndex/100, score/100, connections/maxDegree]
    const maxDeg = Math.max(1, ...Array.from(degreeById.values()))
    const points = nodes.map((n) => [
      Number(n.currentRiskIndex ?? n.riskIndex ?? 0) / 100,
      Number((n as { score?: number }).score ?? 50) / 100,
      (degreeById.get(n.id) ?? 0) / maxDeg,
    ])

    const k = 5
    // Seed centroids by picking first k distinct-ish points
    const centroids = points.slice(0, k).map((p) => [...p])

    for (let iter = 0; iter < 20; iter++) {
      const sums = Array.from({ length: k }, () => [0, 0, 0])
      const counts = new Array(k).fill(0)
      for (const pt of points) {
        let best = 0; let bestDist = Infinity
        for (let c = 0; c < k; c++) {
          const d = Math.hypot(pt[0] - centroids[c][0], pt[1] - centroids[c][1], pt[2] - centroids[c][2])
          if (d < bestDist) { bestDist = d; best = c }
        }
        sums[best][0] += pt[0]; sums[best][1] += pt[1]; sums[best][2] += pt[2]
        counts[best]++
      }
      for (let c = 0; c < k; c++) {
        if (counts[c] > 0) {
          centroids[c][0] = sums[c][0] / counts[c]
          centroids[c][1] = sums[c][1] / counts[c]
          centroids[c][2] = sums[c][2] / counts[c]
        }
      }
    }

    // Assign each node to nearest centroid
    const assignments = points.map((pt) => {
      let best = 0; let bestDist = Infinity
      for (let c = 0; c < k; c++) {
        const d = Math.hypot(pt[0] - centroids[c][0], pt[1] - centroids[c][1], pt[2] - centroids[c][2])
        if (d < bestDist) { bestDist = d; best = c }
      }
      return best
    })

    const clusterPalette = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']
    const clusterLabels = ['Critical', 'High-Risk', 'Moderate', 'Stable', 'Low-Risk']
    return centroids.map((c, idx) => {
      const memberNodes = nodes.filter((_, i) => assignments[i] === idx)
      const avgRisk = memberNodes.length > 0
        ? memberNodes.reduce((s, n) => s + Number(n.currentRiskIndex ?? n.riskIndex ?? 0), 0) / memberNodes.length
        : 0
      return {
        id: idx,
        label: clusterLabels[idx] ?? `Cluster ${idx + 1}`,
        color: clusterPalette[idx] ?? '#6b7280',
        centroid: c,
        avgRisk,
        firmCount: memberNodes.length,
        firms: memberNodes.map((n) => n.id),
      }
    }).sort((a, b) => b.avgRisk - a.avgRisk)
  }, [runtimeGraph.nodes, runtimeGraph.links])

  const collapseCandidates = useMemo(() => {
    const degreeById = new Map<string, number>()
    runtimeGraph.links.forEach((link) => {
      degreeById.set(link.source, (degreeById.get(link.source) || 0) + 1)
      degreeById.set(link.target, (degreeById.get(link.target) || 0) + 1)
    })

    return [...runtimeGraph.nodes]
      .map((node) => ({
        ...node,
        systemicScore:
          Number(node.currentRiskIndex ?? node.riskIndex ?? 0) * 0.72 +
          (degreeById.get(node.id) || 0) * 5.5 +
          (node.currentEarlyWarning ? 18 : 0) +
          Math.max(node.periodDelta || 0, 0) * 2.2,
        connections: degreeById.get(node.id) || 0,
      }))
      .sort((a, b) => b.systemicScore - a.systemicScore)
      .slice(0, 6)
  }, [runtimeGraph.links, runtimeGraph.nodes])

  const collapseSeed = useMemo(() => {
    if (!collapseSeedId) return null
    return runtimeGraph.nodes.find((node) => node.id === collapseSeedId) || null
  }, [collapseSeedId, runtimeGraph.nodes])

  const collapseComparisonCandidates = useMemo(() => {
    return collapseCandidates.filter((node) => node.id !== collapseSeedId)
  }, [collapseCandidates, collapseSeedId])

  const collapseComparisonSeed = useMemo(() => {
    if (!collapseComparisonSeedId) return null
    return runtimeGraph.nodes.find((node) => node.id === collapseComparisonSeedId) || null
  }, [collapseComparisonSeedId, runtimeGraph.nodes])

  const collapseSimulationSummary = useMemo(() => {
    return buildCollapseScenario(collapseSeedId, runtimeGraph.nodes, runtimeGraph.links, collapsePropagationDepth)
  }, [collapsePropagationDepth, collapseSeedId, runtimeGraph.links, runtimeGraph.nodes])

  const collapseComparisonSummary = useMemo(() => {
    if (!collapseComparisonEnabled) return null
    return buildCollapseScenario(collapseComparisonSeedId, runtimeGraph.nodes, runtimeGraph.links, collapsePropagationDepth)
  }, [collapseComparisonEnabled, collapseComparisonSeedId, collapsePropagationDepth, runtimeGraph.links, runtimeGraph.nodes])

  const collapseComparisonDelta = useMemo(() => {
    if (!collapseSimulationSummary || !collapseComparisonSummary) return null
    const overlap = [...collapseSimulationSummary.impactedSet].filter((id) => collapseComparisonSummary.impactedSet.has(id)).length
    const primaryOnly = collapseSimulationSummary.impactedCount - overlap
    const secondaryOnly = collapseComparisonSummary.impactedCount - overlap
    return {
      overlap,
      primaryOnly,
      secondaryOnly,
      stressedLinkDelta: collapseSimulationSummary.stressedLinks - collapseComparisonSummary.stressedLinks,
      avgRiskDelta: collapseSimulationSummary.avgRisk - collapseComparisonSummary.avgRisk,
    }
  }, [collapseComparisonSummary, collapseSimulationSummary])

  const selectedFirmClusterShare = useMemo(() => {
    if (!selectedFirm || !timelineScopedNodes.length) return 0
    const cohortCount = timelineScopedNodes.filter((node) => node.modelType === selectedFirm.modelType).length
    return Math.round((cohortCount / timelineScopedNodes.length) * 100)
  }, [selectedFirm, timelineScopedNodes])

  useEffect(() => {
    if (!runtimeGraph.nodes.length) {
      if (selectedFirmId) setSelectedFirmId(null)
      return
    }

    const visibleIds = new Set(runtimeGraph.nodes.map((node) => node.id))
    const stillVisible = selectedFirmId && visibleIds.has(selectedFirmId)
    if (!stillVisible) {
      setSelectedFirmId(runtimeGraph.nodes[0].id)
    }
  }, [runtimeGraph.nodes, selectedFirmId])

  useEffect(() => {
    if (!runtimeGraph.nodes.length) {
      if (collapseSeedId) setCollapseSeedId(null)
      if (collapseComparisonSeedId) setCollapseComparisonSeedId(null)
      return
    }

    const visibleIds = new Set(runtimeGraph.nodes.map((node) => node.id))
    if (collapseSeedId && visibleIds.has(collapseSeedId)) {
      return
    }

    const fallbackSeed =
      (selectedFirmId && visibleIds.has(selectedFirmId) ? selectedFirmId : null) || collapseCandidates[0]?.id || runtimeGraph.nodes[0]?.id || null

    if (fallbackSeed && fallbackSeed !== collapseSeedId) {
      setCollapseSeedId(fallbackSeed)
    }
  }, [collapseCandidates, collapseComparisonSeedId, collapseSeedId, runtimeGraph.nodes, selectedFirmId])

  useEffect(() => {
    if (!collapseComparisonEnabled) return
    if (!runtimeGraph.nodes.length) {
      if (collapseComparisonSeedId) setCollapseComparisonSeedId(null)
      return
    }

    const visibleIds = new Set(runtimeGraph.nodes.map((node) => node.id))
    if (collapseComparisonSeedId && visibleIds.has(collapseComparisonSeedId) && collapseComparisonSeedId !== collapseSeedId) {
      return
    }

    const fallbackSecondary = collapseComparisonCandidates[0]?.id || runtimeGraph.nodes.find((node) => node.id !== collapseSeedId)?.id || null
    if (fallbackSecondary && fallbackSecondary !== collapseComparisonSeedId) {
      setCollapseComparisonSeedId(fallbackSecondary)
    }
  }, [collapseComparisonCandidates, collapseComparisonEnabled, collapseComparisonSeedId, collapseSeedId, runtimeGraph.nodes])

  const visibleNodeCount = runtimeGraph.nodes.length

  const shortlist = useMemo(() => {
    return [...timelineScopedNodes]
      .sort((a, b) => {
        if (a.earlyWarning !== b.earlyWarning) return a.earlyWarning ? -1 : 1
        if (a.riskIndex !== b.riskIndex) return b.riskIndex - a.riskIndex
        return b.score - a.score
      })
      .slice(0, 40)
  }, [timelineScopedNodes])

  const exportVisibleNodes = () => {
    if (!filteredNodes.length) return

    const header = [
      'firm_id',
      'firm_name',
      'region',
      'jurisdiction',
      'score_0_100',
      'risk_index',
      'risk_category',
      'rvi_status',
      'payout_reliability',
      'operational_stability',
      'early_warning',
    ]

    const lines = filteredNodes.map((node) => {
      return [
        node.id,
        `"${String(node.label).replace(/"/g, '""')}"`,
        toRegion(node.jurisdiction),
        node.jurisdiction,
        node.score,
        node.riskIndex,
        node.riskCategory,
        node.rviStatus,
        node.payoutReliability,
        node.operationalStability,
        node.earlyWarning ? 'true' : 'false',
      ].join(',')
    })

    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `gtixt-industry-map-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  const toggleLayer = (layer: LayerKey) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }))
  }

  const nodeCount = payload?.count || 0
  const edgeCount = runtimeGraph.links.length
  const relationCounts = useMemo(() => {
    return runtimeGraph.links.reduce(
      (accumulator, link) => {
        const type = link.type
        if (!type) return accumulator
        accumulator[type] += 1
        return accumulator
      },
      {
        jurisdiction: 0,
        'risk-cluster': 0,
        'warning-signal': 0,
      } as Record<GlobeLinkType, number>
    )
  }, [runtimeGraph.links])
  const timelinePeriods = payload?.timeline?.periods || []
  const timelineIndex = Math.max(0, timelinePeriods.findIndex((period) => period === timelineCursor))
  const timelineDisplay = timelineCursor || payload?.timeline?.maxPeriod || `${payload?.timeline?.maxYear || new Date().getUTCFullYear()}`

  return (
    <div className="institutional-page industry-map-page min-h-screen">
      {/* PATTERN 7: Institutional Header */}

      {/* PATTERN 1/12: Page Content with 12-Column Grid */}
      <div className="institutional-section">
        <div className="page-wrapper space-y-8">
          {/* PATTERN 5: Ultra-Compact Hero + Micro-Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inst-client-section-head"
          >
            <div className="flex flex-col gap-4">
              {/* Hero Title Row */}
              <div>
                <p className="inst-client-kicker">Geographic Intelligence Engine</p>
                <h1 className="inst-client-title leading-tight">
                  <span className="title-gradient">The GTIXT Industry Globe</span>
                </h1>
              </div>

              {/* Micro-Stats Strip */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-[0.08em] text-slate-400">Scope</span>
                  <span className="text-sm font-semibold text-cyan-200">{loading ? '...' : nodeCount}</span>
                  <span className="text-xs text-slate-600">visible</span>
                  <span className="text-xs font-medium text-slate-500">{loading ? '...' : visibleNodeCount}</span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-[0.08em] text-slate-400">Relations</span>
                  <span className="text-sm font-semibold text-emerald-200">{loading ? '...' : edgeCount}</span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-[0.08em] text-slate-400">Early Warning</span>
                  <span className="text-sm font-semibold text-amber-200">{loading ? '...' : payload?.clusters?.earlyWarning ?? 0}</span>
                </div>
              </div>

              <div className="divider-neon analytics-hero-divider" />
            </div>
          </motion.div>

          {/* Advanced Filters Toggle — Compact control bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.45 }}
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/20 bg-slate-950/40 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGlobeFiltersExpanded((prev) => !prev)}
                className="px-3 py-1.5 rounded-lg border border-cyan-400/40 bg-cyan-500/10 text-cyan-200 text-sm font-medium hover:bg-cyan-500/20 transition-colors"
              >
                {globeFiltersExpanded ? '▼' : '▶'} Advanced Filters
              </button>
              <span className="text-xs text-slate-400">
                Layers · Risk · Regime · Simulations · Timeline
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportVisibleNodes}
                className="px-3 py-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
              >
                Export
              </button>
              <Link
                href="/radar"
                className="px-3 py-1.5 rounded-lg border border-amber-400/40 bg-amber-500/10 text-amber-200 text-xs font-medium hover:bg-amber-500/20 transition-colors"
              >
                Radar
              </Link>
            </div>
          </motion.div>

          {/* Expanded Filter Block — Collapsible */}
          <AnimatePresence>
            {globeFiltersExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-4 rounded-2xl border border-cyan-500/20 bg-slate-950/40 p-4 space-y-4 overflow-hidden"
              >
            <div className="flex flex-wrap gap-3">
              {([
                { key: 'regulatory', label: 'Regulatory Layer' },
                { key: 'risk', label: 'Risk Layer' },
                { key: 'community', label: 'Community Layer' },
              ] as { key: LayerKey; label: string }[]).map((layer) => (
                <button
                  key={layer.key}
                  type="button"
                  onClick={() => toggleLayer(layer.key)}
                  className={`px-4 py-2 rounded-xl border text-sm transition-all ${
                    layers[layer.key]
                      ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200'
                      : 'border-white/20 bg-white/5 text-slate-300'
                  }`}
                >
                  {layer.label}
                </button>
              ))}
              <div className="h-6 w-px bg-white/10 self-center" />
                  {([
                    { key: 'risk', label: 'Risk', active: 'border-red-400/50 bg-red-500/15 text-red-200' },
                    { key: 'liquidity', label: 'Liquidity', active: 'border-teal-400/50 bg-teal-500/15 text-teal-200' },
                    { key: 'transparency', label: 'Transparency', active: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200' },
                    { key: 'growth', label: 'Growth', active: 'border-amber-400/50 bg-amber-500/15 text-amber-200' },
                  ] as { key: ActiveGlobeLayer; label: string; active: string }[]).map((layer) => (
                    <button
                      key={layer.key}
                      type="button"
                      onClick={() => setActiveGlobeLayer(layer.key)}
                      className={`px-3 py-1.5 rounded-xl border text-xs transition-all ${
                        activeGlobeLayer === layer.key
                          ? layer.active
                          : 'border-white/15 bg-white/5 text-slate-400'
                      }`}
                    >
                      {layer.label}
                    </button>
                  ))}

                  <div className="h-6 w-px bg-white/10 self-center" />
                  {([
                    { key: 'stable', label: 'Stable', active: 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200' },
                    { key: 'stress', label: 'Stress', active: 'border-amber-400/50 bg-amber-500/15 text-amber-200' },
                    { key: 'instability', label: 'Instability', active: 'border-red-400/50 bg-red-500/15 text-red-200' },
                  ] as { key: RegimeMode; label: string; active: string }[]).map((mode) => (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => setRegimeMode(mode.key)}
                      className={`px-3 py-1.5 rounded-xl border text-xs transition-all ${
                        regimeMode === mode.key ? mode.active : 'border-white/15 bg-white/5 text-slate-400'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setRiskShockEnabled((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-xl border text-xs transition-all ${
                      riskShockEnabled
                        ? 'border-rose-400/50 bg-rose-500/15 text-rose-200'
                        : 'border-white/15 bg-white/5 text-slate-400'
                    }`}
                  >
                    Risk Shock Simulation
                  </button>

                  <button
                    type="button"
                    onClick={() => setSectorPulseEnabled((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-xl border text-xs transition-all ${
                      sectorPulseEnabled
                        ? 'border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-200'
                        : 'border-white/15 bg-white/5 text-slate-400'
                    }`}
                  >
                    Sector Pulse
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCollapseSimulationEnabled((prev) => {
                        const next = !prev
                        if (next && !collapseSeedId) {
                          setCollapseSeedId(selectedFirmId || collapseCandidates[0]?.id || null)
                        }
                        if (next) {
                          setCollapsePlaybackRunning(true)
                        }
                        if (!next) {
                          setCollapseComparisonEnabled(false)
                        }
                        return next
                      })
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs transition-all ${
                      collapseSimulationEnabled
                        ? 'border-red-500/60 bg-red-500/15 text-red-100'
                        : 'border-white/15 bg-white/5 text-slate-400'
                    }`}
                  >
                    Collapse Simulation
                  </button>

                  {collapseSimulationEnabled && (
                    <button
                      type="button"
                      onClick={() => setCollapseComparisonEnabled((prev) => !prev)}
                      className={`px-3 py-1.5 rounded-xl border text-xs transition-all ${
                        collapseComparisonEnabled
                          ? 'border-sky-400/60 bg-sky-500/15 text-sky-100'
                          : 'border-white/15 bg-white/5 text-slate-400'
                      }`}
                    >
                      Compare Seeds
                    </button>
                  )}
              <button
                type="button"
                onClick={exportVisibleNodes}
                className="px-4 py-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 text-sm"
              >
                Export Visible Firms
              </button>
              <Link
                href="/radar"
                className="px-4 py-2 rounded-xl border border-amber-400/40 bg-amber-500/10 text-amber-200 text-sm"
              >
                Open Early Warning Radar
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search firm, id, jurisdiction"
                className="rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400"
              />

              <select
                value={riskFilter}
                onChange={(event) => setRiskFilter(event.target.value as RiskFilter)}
                className="rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
              >
                <option value="all">All Risk Bands</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={regionFilter}
                onChange={(event) => setRegionFilter(event.target.value as RegionFilter)}
                className="rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
              >
                <option value="all">All Regions</option>
                <option value="EU">EU</option>
                <option value="USA">USA</option>
                <option value="UAE">UAE</option>
                <option value="Australia">Australia</option>
              </select>

              <label className="flex items-center gap-2 rounded-xl border border-white/20 bg-slate-900/70 px-3 py-2 text-sm text-slate-100">
                <input
                  type="checkbox"
                  checked={onlyEarlyWarning}
                  onChange={(event) => setOnlyEarlyWarning(event.target.checked)}
                  className="accent-amber-400"
                />
                Early warning only
              </label>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-900/55 px-4 py-3">
              <div className="flex items-center justify-between gap-4 mb-2">
                <p className="text-xs text-slate-300 tracking-[0.08em] uppercase">Timeline</p>
                <p className="text-sm text-cyan-200 font-medium">{timelineDisplay}</p>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(timelinePeriods.length - 1, 0)}
                step={1}
                value={timelineIndex}
                onChange={(event) => {
                  const nextPeriod = timelinePeriods[Number(event.target.value)]
                  if (nextPeriod) setTimelineCursor(nextPeriod)
                }}
                className="w-full accent-cyan-400"
              />
              <p className="mt-2 text-xs text-slate-400">
                Nodes enter/exit from real GTIXT history (`firm_score_snapshots.timestamp`, `firm_gri_scores.snapshot_date`, and snapshot timestamps) by observed month.
              </p>
            </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loadError && (
            <div className="mb-8 rounded-xl border border-red-400/30 bg-red-950/20 px-4 py-3 text-sm text-red-200">
              Live industry graph unavailable: {loadError}
            </div>
          )}

          {!webglAvailable && (
            <div className="mb-8 rounded-xl border border-amber-400/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
              WebGL is not available in this browser/session. GTIXT Globe requires WebGL rendering.
            </div>
          )}

          {globeRenderError && (
            <div className="mb-8 rounded-xl border border-cyan-400/30 bg-cyan-950/20 px-4 py-3 text-sm text-cyan-200">
              {`GTIXT Globe initialization in progress (${globeRenderError}).`}
            </div>
          )}

          {/* Globe Command Center — institutional status header */}
          <div className="rounded-xl border border-cyan-500/20 bg-slate-950/70 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[9px] uppercase tracking-[0.14em] text-cyan-300 font-medium">GTIXT Globe</span>
              <span className="text-[10px] text-slate-600">·</span>
              <span className="text-[10px] text-slate-400">{loading ? '…' : `${visibleNodeCount} nodes · ${edgeCount} links`}</span>
              <span className="rounded-full border border-cyan-400/15 bg-cyan-400/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-cyan-200">Decision Graph</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[9px] uppercase tracking-[0.08em]">
              <span className="text-slate-500">Layer</span>
              <span className={`font-medium ${
                activeGlobeLayer === 'risk' ? 'text-red-300'
                : activeGlobeLayer === 'liquidity' ? 'text-teal-300'
                : activeGlobeLayer === 'transparency' ? 'text-emerald-300'
                : 'text-amber-300'
              }`}>{activeGlobeLayer.toUpperCase()}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">Regime</span>
              <span className={`font-medium ${
                regimeMode === 'stable' ? 'text-cyan-300'
                : regimeMode === 'stress' ? 'text-amber-300'
                : 'text-red-300'
              }`}>{regimeMode.toUpperCase()}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">Timeline</span>
              <span className="font-medium text-slate-200">{timelineDisplay}</span>
              {(payload?.clusters?.earlyWarning ?? 0) > 0 && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="font-medium text-amber-300">{payload!.clusters.earlyWarning} EW signals</span>
                </>
              )}
              <>
                <span className="text-slate-600">·</span>
                <span className="font-medium text-emerald-300">Auto Sync</span>
              </>
            </div>
          </div>
          <div className="mb-3 rounded-xl border border-white/10 bg-slate-950/55 px-3 py-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-[0.12em] text-slate-400">Mode</span>
              {([
                { key: 'compact', label: 'Compact' },
                { key: 'bloomberg', label: 'Bloomberg' },
                { key: 'palantir', label: 'Palantir' },
              ] as { key: TradingViewMode; label: string }[]).map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  onClick={() => setTradingViewMode(mode.key)}
                  className={`px-2.5 py-1 rounded-md border text-[9px] uppercase tracking-[0.08em] transition-colors ${
                    tradingViewMode === mode.key
                      ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.08em]">
              <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 ${loadError ? 'border-red-400/30 bg-red-500/10 text-red-200' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {loadError ? 'Feed degraded' : 'Live feed OK'}
              </span>
              <span className="text-slate-400">
                {lastRefreshAt ? `Updated ${new Date(lastRefreshAt).toLocaleTimeString('en-GB', { hour12: false })}` : 'Waiting first sync'}
              </span>
            </div>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px]">
            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-sky-200">
              Regulatory Mesh {relationCounts.jurisdiction}
            </span>
            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-amber-200">
              Risk Cluster {relationCounts['risk-cluster']}
            </span>
            <span className="rounded-full border border-pink-400/20 bg-pink-400/10 px-2.5 py-1 text-pink-200">
              Warning Lattice {relationCounts['warning-signal']}
            </span>
            <span className="text-slate-500">GTIXT signal architecture across geography, contagion, and alert propagation.</span>
          </div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.1em] text-slate-400">How to read</p>
              <p className="text-xs text-slate-200 mt-1">Node size = institutional relevance in scope.</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.1em] text-slate-400">Color logic</p>
              <p className="text-xs text-slate-200 mt-1">Green stable, amber stressed, red critical risk.</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.1em] text-slate-400">Action</p>
              <p className="text-xs text-slate-200 mt-1">Open Priority Queue, pick a firm, read drilldown.</p>
            </div>
          </div>

          {/* Institutional Stage: globe centered, everything else below */}
          <div className="mb-6 rounded-2xl border border-white/10 bg-slate-950/40 p-3 backdrop-blur-md">
            <div className="mx-auto w-full max-w-[1680px] px-3 sm:px-4 lg:px-6">
              <div
                className={`relative isolate z-0 rounded-[12px] p-2 overflow-hidden border-2 shadow-[0_4px_20px_rgba(0,0,0,0.25)] ${
                  tradingViewMode === 'compact'
                    ? 'border-white/20 bg-black/35'
                    : tradingViewMode === 'bloomberg'
                      ? 'border-white/20 bg-black/25'
                      : 'border-cyan-300/35 bg-slate-950/55'
                }`}
                style={{
                  width: '100%',
                  maxWidth: '100%',
                  aspectRatio: '16 / 9',
                  minHeight: '480px',
                  maxHeight: '860px',
                }}
              >
                <motion.section
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.45 }}
                  className="h-full w-full rounded-[10px] overflow-hidden"
                  ref={attachGlobeContainer}
                >
                  {!isGlobeV2Enabled() ? (
                    <div className="flex h-full items-center justify-center rounded-2xl border border-amber-400/20 bg-slate-950/60 text-amber-300 text-sm">
                      Globe v2 is disabled via feature flag. <span className="ml-2 text-slate-400">({`GLOBE_V2_ENABLED=false`})</span>
                    </div>
                  ) : (
                    <GTIXTGlobe
                      key={globeMountKey}
                      runtimeGraph={runtimeGraph}
                      activeLayer={activeGlobeLayer}
                      regimeMode={regimeMode}
                      timelineLabel={timelineDisplay}
                      riskShockEnabled={riskShockEnabled}
                      sectorPulseEnabled={sectorPulseEnabled}
                      collapseSimulationEnabled={collapseSimulationEnabled}
                      collapseSeedId={collapseSeedId}
                      collapseComparisonEnabled={collapseComparisonEnabled}
                      collapseComparisonSeedId={collapseComparisonSeedId}
                      collapsePropagationDepth={collapsePropagationDepth}
                      collapseIntensity={collapseIntensity}
                      collapsePlaybackRunning={collapsePlaybackRunning}
                      collapsePlaybackSpeed={collapsePlaybackSpeed}
                      collapsePlaybackStepSignal={collapsePlaybackStepSignal}
                      collapsePlaybackResetSignal={collapsePlaybackResetSignal}
                      autoTourEnabled={false}
                      selectedFirmId={selectedFirmId}
                      onFirmSelect={setSelectedFirmId}
                      selectedLinkPair={selectedLink}
                      onLinkSelect={(source, target, type) => setSelectedLink({ source, target, type })}
                      onRenderError={handleGlobeRenderError}
                      onRenderReady={handleGlobeRenderReady}
                      onPerfSample={handlePerfSample}
                    />
                  )}
                </motion.section>
              </div>

              <div className="mt-2 rounded-[10px] border border-white/10 bg-slate-950/35 px-2 py-1.5">
                <div className="flex flex-wrap items-center gap-3 text-[9px] uppercase tracking-[0.1em] text-slate-300">
                  <span className="text-slate-500">Legend</span>
                  <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Stable</span>
                  <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Stress</span>
                  <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-400" />Critical</span>
                  <span className="text-slate-500">Node size = market relevance</span>
                </div>
              </div>

              <div className="mt-2 border-t border-white/10" />

              <div className="mt-2 grid grid-cols-1 xl:grid-cols-2 gap-2">
                <div className="rounded-[10px] border border-white/10 bg-slate-950/35 p-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Signals</span>
                    <span className="text-[9px] uppercase tracking-[0.1em] text-amber-300/80">Integrated Radar</span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="rounded border border-white/10 bg-white/5 px-2 py-1">
                      <p className="text-slate-400">Early Warning</p>
                      <p className="text-amber-300 font-semibold">{anomalyNodes.length}</p>
                    </div>
                    <div className="rounded border border-white/10 bg-white/5 px-2 py-1">
                      <p className="text-slate-400">Rising Risk</p>
                      <p className="text-red-300 font-semibold">{runtimeGraph.nodes.filter((n) => predictions[n.id]?.trajectory === 'rising').length}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[10px] border border-white/10 bg-slate-950/35 overflow-hidden" style={{ height: priorityQueueDrawerOpen ? '184px' : '33px' }}>
                  <button
                    type="button"
                    onClick={() => setPriorityQueueDrawerOpen(!priorityQueueDrawerOpen)}
                    className="w-full flex items-center justify-between px-3 py-1 text-[9px] uppercase tracking-[0.1em] hover:bg-white/5 transition-colors"
                  >
                    <span className="uppercase tracking-[0.1em] text-slate-300">Priority Queue</span>
                    <span className="text-slate-400">{priorityQueueDrawerOpen ? '−' : '+'}</span>
                  </button>
                  {priorityQueueDrawerOpen && (
                    <div className="border-t border-white/10 p-1.5 space-y-1 max-h-[148px] overflow-y-auto">
                      {shortlist.map((node) => (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => {
                            setSelectedFirmId(node.id)
                            setPriorityQueueDrawerOpen(false)
                          }}
                          className={`w-full text-left rounded-lg border px-2 py-1 text-[9px] transition-colors ${selectedFirmId === node.id ? 'border-cyan-400/40 bg-cyan-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-slate-100">{node.label}</span>
                            <span className="text-[9px] uppercase text-slate-400">{toRegion(node.jurisdiction)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-2 border-t border-white/10" />

              <div className="mt-2 grid grid-cols-1 xl:grid-cols-3 gap-2">
                <div className="rounded-[10px] border border-white/10 bg-slate-950/35 p-2 min-h-0 xl:col-span-2">
                  <p className="text-[9px] uppercase tracking-[0.1em] text-slate-500 mb-1.5">Firm Drilldown</p>
                  {!selectedFirm && <p className="text-steel-grey text-xs">Select a firm in queue to inspect metrics.</p>}
                  {selectedFirm && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-[12px] text-slate-100 font-semibold truncate">{selectedFirm.label}</h3>
                        <span className="text-[9px] uppercase text-slate-400">{selectedFirm.jurisdiction || 'Global'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="panel-side"><p className="text-[9px] uppercase text-steel-grey">Score</p><p className="text-xs text-slate-100 font-semibold">{selectedFirm.score.toFixed(1)}</p></div>
                        <div className="panel-side"><p className="text-[9px] uppercase text-steel-grey">Risk</p><p className="text-xs text-slate-100 font-semibold">{selectedFirm.riskIndex.toFixed(1)}</p></div>
                        <div className="panel-side"><p className="text-[9px] uppercase text-steel-grey">Model</p><p className="text-xs text-slate-100 font-semibold">{selectedFirm.modelType || 'N/A'}</p></div>
                        <div className="panel-side"><p className="text-[9px] uppercase text-steel-grey">Region</p><p className="text-xs text-slate-100 font-semibold">{toRegion(selectedFirm.jurisdiction)}</p></div>
                      </div>
                      {selectedFirm && intelligenceLoading && <p className="text-steel-grey text-xs">Loading intelligence...</p>}
                      {selectedFirm && intelligenceError && <p className="text-red-200 text-xs">Unable to load profile: {intelligenceError}</p>}
                    </div>
                  )}
                </div>

                <div className="rounded-[10px] border border-white/10 bg-slate-950/35 p-1.5">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-cyan-300/90 mb-1">Glossary</p>
                  <div className="space-y-1 text-[9px] uppercase tracking-[0.06em]">
                    <p className="text-slate-300"><span className="text-white font-medium">Score:</span> quality signal</p>
                    <p className="text-slate-300"><span className="text-white font-medium">Risk:</span> instability probability</p>
                    <p className="text-slate-300"><span className="text-white font-medium">RVI:</span> regulatory validation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Anomaly Radar panel removed in premium v2: signals are now inline and contextual. */}

      {/* Relation detail pill — shown when an arc is selected */}
      {selectedLink && (() => {
        const srcNode = runtimeGraph.nodes.find((n) => n.id === selectedLink.source)
        const tgtNode = runtimeGraph.nodes.find((n) => n.id === selectedLink.target)
        const linkTypeLabel = selectedLink.type === 'jurisdiction' ? 'Jurisdiction Link' : selectedLink.type === 'risk-cluster' ? 'Risk Cluster' : selectedLink.type === 'warning-signal' ? 'Warning Signal' : 'Relation'
        return (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl border border-cyan-400/30 bg-slate-950/90 px-5 py-3 shadow-2xl backdrop-blur-md">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">{linkTypeLabel}</div>
            <div className="h-3 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-100">{srcNode?.label ?? selectedLink.source}</span>
              <span className="text-slate-500">→</span>
              <span className="text-xs font-medium text-slate-100">{tgtNode?.label ?? selectedLink.target}</span>
            </div>
            <button type="button" onClick={() => setSelectedLink(null)} className="ml-2 text-slate-500 hover:text-white text-sm leading-none">✕</button>
          </div>
        )
      })()}

      {/* Glossary moved into the operations rail for integrated institutional layout. */}

      {/* Methodology & Governance Section */}
      <section className="border-t border-white/5 bg-slate-950/40 py-14 px-4 mt-10">
        <div className="page-wrapper max-w-[1440px] mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">Methodology & Transparency</h2>
            <p className="text-slate-400 text-sm">How GTIXT scores and relationships are computed and verified.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
            <div className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-6">
              <h3 className="text-cyan-300 font-semibold text-sm uppercase tracking-wider mb-2">Risk Scoring</h3>
              <p className="text-slate-300 text-sm">
                GTIXT scores integrate proprietary trading flow, balance sheet stress, regulatory posture, and peer cluster volatility. Updated monthly from verified source data.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-slate-900/50 p-6">
              <h3 className="text-emerald-300 font-semibold text-sm uppercase tracking-wider mb-2">Relationship Graph</h3>
              <p className="text-slate-300 text-sm">
                500+ institutions mapped by regulatory jurisdiction, risk cluster membership, and warning-signal propagation. Relations verified against court filings and regulatory disclosures.
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-slate-900/50 p-6">
              <h3 className="text-amber-300 font-semibold text-sm uppercase tracking-wider mb-2">Early Warning</h3>
              <p className="text-slate-300 text-sm">
                Multi-factor anomaly detection: score delta, cluster contagion risk, RVI breach events, and sector-wide instability signals. Real-time update frequency.
              </p>
            </div>

            <div className="rounded-xl border border-violet-500/20 bg-slate-900/50 p-6">
              <h3 className="text-violet-300 font-semibold text-sm uppercase tracking-wider mb-2">Data Provenance</h3>
              <p className="text-slate-300 text-sm">
                Official firm profiles, GTIXT snapshot history, RVI evidence archive, and regulatory intelligence feeds. Governance verified by institutional review board.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-slate-900/30 p-6 text-sm text-slate-300">
            <p className="mb-3">
              <span className="font-semibold text-white">Live Data · </span>
              Updated every 2 minutes from verified governance sources. Timeline extends to {payload?.timeline?.minPeriod || 'Q1 2024'} — {payload?.timeline?.maxPeriod || 'Q4 2025'}.
            </p>
            <p>
              For methodology details, audit reports, and risk model documentation, see <Link href="/docs/methodology" className="text-cyan-400 hover:text-cyan-300">full methodology docs</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* PATTERN 8: Institutional Footer */}
      <footer className="footer-institutional">
        <div className="page-wrapper max-w-[1440px] mx-auto">
          <div className="footer-grid">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="/analytics">Analytics</a>
              <a href="/industry-map">Globe</a>
              <a href="/snapshots">Snapshots</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <Link href="/about">About</Link>
              <Link href="/blog">Blog</Link>
              <Link href="/careers">Careers</Link>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <Link href="/docs">Docs</Link>
              <Link href="/docs/methodology">Methodology</Link>
              <Link href="/api-docs">API</Link>
              <Link href="/research">Support</Link>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/disclaimer">Cookies</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
              <p>&copy; 2026 GTIXT. All rights reserved.</p>
              <p className="text-slate-400">Live data updated every 2 minutes · Verified governance data</p>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  )
}
