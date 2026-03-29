'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import GTIXTGlobe, { type ActiveLayer as GlobeActiveLayer, type GlobeLinkType, type LabelTone } from '@/components/public/GTIXTGlobe'
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
  const lastPayloadSignatureRef = useRef('')
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
  const [collapsePropagationDepth] = useState(4)
  const [collapseIntensity] = useState(1)
  const [collapsePlaybackRunning, setCollapsePlaybackRunning] = useState(true)
  const [collapsePlaybackSpeed] = useState(1)
  const [collapsePlaybackStepSignal] = useState(0)
  const [collapsePlaybackResetSignal] = useState(0)
  const [selectedFirmId, setSelectedFirmId] = useState<string | null>(null)
  const [selectedLink, setSelectedLink] = useState<{ source: string; target: string; type?: GlobeLinkType } | null>(null)
  const [tradingViewMode, setTradingViewMode] = useState<TradingViewMode>('bloomberg')
  const [executiveClarityEnabled, setExecutiveClarityEnabled] = useState(false)
  const [labelTone, setLabelTone] = useState<LabelTone>('institutional')
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null)
  const [, setIntelligence] = useState<FirmIntelligencePayload | null>(null)
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
          const nextSignature = [
            json.count,
            json.nodes?.length || 0,
            json.edges?.length || 0,
            json.timeline?.maxPeriod || '',
            json.timeline?.minPeriod || '',
            json.nodes?.[0]?.id || '',
            json.nodes?.[json.nodes.length - 1]?.id || '',
          ].join('|')

          if (nextSignature !== lastPayloadSignatureRef.current) {
            setPayload(json)
            lastPayloadSignatureRef.current = nextSignature
          }
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
  }, [payload?.timeline?.maxPeriod, timelineCursor])

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

  const collapseComparisonCandidates = useMemo(() => {
    return collapseCandidates.filter((node) => node.id !== collapseSeedId)
  }, [collapseCandidates, collapseSeedId])

  useEffect(() => {
    if (!runtimeGraph.nodes.length) {
      if (selectedFirmId) setSelectedFirmId(null)
      return
    }

    const visibleIds = new Set(runtimeGraph.nodes.map((node) => node.id))
    const stillVisible = selectedFirmId && visibleIds.has(selectedFirmId)
    if (!stillVisible) {
      setSelectedFirmId(null)
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
                  <span className="title-gradient">Industry Map</span>
                </h1>
                <p className="im-art-hero-sub mt-2 max-w-2xl text-sm text-slate-300">
                  Institutional network intelligence across relationships, risk clusters, and early-warning propagation.
                </p>
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
                    onClick={() => setExecutiveClarityEnabled((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-xl border text-xs transition-all ${
                      executiveClarityEnabled
                        ? 'border-cyan-300/60 bg-cyan-500/18 text-cyan-100'
                        : 'border-white/15 bg-white/5 text-slate-400'
                    }`}
                  >
                    Executive Clarity
                  </button>

                  {([
                    { key: 'institutional', label: 'Labels: Institutional' },
                    { key: 'demonstrative', label: 'Labels: Demonstrative' },
                  ] as { key: LabelTone; label: string }[]).map((mode) => (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => setLabelTone(mode.key)}
                      className={`px-3 py-1.5 rounded-xl border text-xs transition-all ${
                        labelTone === mode.key
                          ? 'border-indigo-300/55 bg-indigo-500/16 text-indigo-100'
                          : 'border-white/15 bg-white/5 text-slate-400'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}

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
          <div className="im-art-shell mb-4 rounded-2xl border border-white/10 bg-slate-950/35 p-5 md:p-6">
            <div className="im-art-header flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="im-art-title text-2xl md:text-3xl font-semibold tracking-tight text-white">Industry Map</h2>
                <p className="im-art-subtitle mt-2 max-w-2xl text-sm text-slate-300">
                  Institutional relationships, risk clusters, and early-warning signals.
                </p>
              </div>
              <div className="im-art-badges flex flex-wrap items-center gap-2 text-[10px]">
                <span className="im-art-badge rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-sky-200">Regulatory {relationCounts.jurisdiction}</span>
                <span className="im-art-badge rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-amber-200">Risk {relationCounts['risk-cluster']}</span>
                <span className="im-art-badge rounded-full border border-pink-400/20 bg-pink-400/10 px-2.5 py-1 text-pink-200">Warning {relationCounts['warning-signal']}</span>
              </div>
            </div>
            <div className="im-art-separator mt-6 h-px w-full bg-white/10" />

            <div className="im-art-main-grid mt-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] gap-5">
              <div className="im-art-globe-wrap rounded-2xl border border-white/10 bg-slate-950/40 p-3 backdrop-blur-md">
                <div
                  className={`relative isolate z-0 rounded-[12px] p-2 overflow-hidden ${
                    tradingViewMode === 'compact'
                      ? 'bg-black/35'
                      : tradingViewMode === 'bloomberg'
                        ? 'bg-black/25'
                        : 'bg-slate-950/55'
                  }`}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    aspectRatio: '16 / 9',
                    minHeight: '560px',
                    maxHeight: '860px',
                    border: tradingViewMode === 'compact'
                      ? '2px solid rgba(203,213,225,0.48)'
                      : tradingViewMode === 'bloomberg'
                        ? '2px solid rgba(165,243,252,0.52)'
                        : '2px solid rgba(103,232,249,0.62)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(148,163,184,0.24)',
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-[6px] rounded-[10px]"
                    style={{
                      border: '1px solid rgba(165,243,252,0.4)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 0 22px rgba(34,211,238,0.12)',
                    }}
                  />
                  <div
                    className="pointer-events-none absolute inset-[8px] rounded-[10px]"
                    style={{
                      background: 'radial-gradient(circle at 50% 42%, rgba(14,31,53,0.0) 42%, rgba(4,9,16,0.36) 86%, rgba(2,6,10,0.58) 100%)',
                      mixBlendMode: 'multiply',
                    }}
                  />
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
                        executiveClarityEnabled={executiveClarityEnabled}
                        labelTone={labelTone}
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
              </div>

              <aside className="im-art-rail space-y-4">
                <div className="im-art-card rounded-xl border border-white/15 bg-slate-900/45 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <RealIcon name="methodology" size={14} className="opacity-80 grayscale" />
                    <h3 className="text-xs uppercase tracking-[0.12em] text-slate-200">How to read the map</h3>
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm text-slate-300">
                    <p>Node size = relevance.</p>
                    <p>Color = risk level.</p>
                    <p>Links = structural relationships.</p>
                    <p>Scroll to zoom. Drag to orbit.</p>
                  </div>
                </div>

                <div className="im-art-card rounded-xl border border-white/15 bg-slate-900/45 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <RealIcon name="analytics" size={14} className="opacity-80 grayscale" />
                    <h3 className="text-xs uppercase tracking-[0.12em] text-slate-200">Legend</h3>
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm text-slate-300">
                    <p className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" />Stable</p>
                    <p className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-400" />Stress</p>
                    <p className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-400" />Critical</p>
                    <p className="text-slate-400">Node size = market relevance.</p>
                  </div>
                </div>

                <div className="im-art-card rounded-xl border border-white/15 bg-slate-900/45 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <RealIcon name="monitoring" size={14} className="opacity-80 grayscale" />
                    <h3 className="text-xs uppercase tracking-[0.12em] text-slate-200">Signal snapshot</h3>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      <p className="text-slate-400 text-[11px]">Early Warning</p>
                      <p className="text-amber-300 font-semibold">{anomalyNodes.length}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      <p className="text-slate-400 text-[11px]">Rising Risk</p>
                      <p className="text-red-300 font-semibold">{runtimeGraph.nodes.filter((n) => predictions[n.id]?.trajectory === 'rising').length}</p>
                    </div>
                  </div>
                </div>

                <div className="im-art-card rounded-xl border border-white/15 bg-slate-900/45 overflow-hidden" style={{ height: priorityQueueDrawerOpen ? '248px' : '42px' }}>
                  <button
                    type="button"
                    onClick={() => setPriorityQueueDrawerOpen(!priorityQueueDrawerOpen)}
                    className="w-full flex items-center justify-between px-4 py-2 text-[11px] uppercase tracking-[0.1em] text-slate-200 hover:bg-white/5 transition-colors"
                  >
                    <span>Priority Queue</span>
                    <span className="text-slate-400">{priorityQueueDrawerOpen ? '−' : '+'}</span>
                  </button>
                  {priorityQueueDrawerOpen && (
                    <div className="border-t border-white/10 p-2 space-y-1 max-h-[202px] overflow-y-auto">
                      {shortlist.map((node) => (
                        <button
                          key={node.id}
                          type="button"
                          onClick={() => {
                            setSelectedFirmId(node.id)
                            setPriorityQueueDrawerOpen(false)
                          }}
                          className={`w-full text-left rounded-lg border px-2.5 py-1.5 text-[11px] transition-colors ${selectedFirmId === node.id ? 'border-cyan-400/40 bg-cyan-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-slate-100">{node.label}</span>
                            <span className="text-[10px] uppercase text-slate-400">{toRegion(node.jurisdiction)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <details className="im-art-card rounded-xl border border-white/15 bg-slate-900/45 px-5 py-4">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-2 text-xs uppercase tracking-[0.12em] text-slate-200">
                    <span className="flex items-center gap-2">
                      <RealIcon name="api" size={14} className="opacity-80 grayscale" />
                      Glossary
                    </span>
                    <span className="text-slate-400">Open</span>
                  </summary>
                  <div className="mt-3 space-y-1.5 text-sm text-slate-300">
                    <p><span className="text-white font-medium">Score:</span> execution quality signal.</p>
                    <p><span className="text-white font-medium">Risk:</span> instability probability.</p>
                    <p><span className="text-white font-medium">RVI:</span> regulatory validation intensity.</p>
                  </div>
                </details>

                <div className="im-art-card rounded-xl border border-cyan-400/20 bg-cyan-500/5 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <RealIcon name="audit" size={14} className="opacity-80 grayscale" />
                    <h3 className="text-xs uppercase tracking-[0.12em] text-cyan-200">Methodology and transparency</h3>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">Scoring, attribution, and governance are versioned and auditable.</p>
                  <Link href="/methodology" className="mt-3 inline-flex rounded-lg border border-cyan-400/35 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-500/10">
                    Open methodology docs
                  </Link>
                </div>
              </aside>
            </div>

            <div className="im-art-separator my-6 h-px w-full bg-white/10" />

            <div className="im-art-bottom-grid grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="im-art-card rounded-xl border border-white/15 bg-slate-900/45 px-5 py-4">
                <h3 className="text-xs uppercase tracking-[0.12em] text-slate-200">Timeline and coverage</h3>
                <p className="mt-2 text-sm text-slate-300">Current period: {timelineDisplay}. Coverage: {payload?.timeline?.minPeriod || 'Q1 2024'} to {payload?.timeline?.maxPeriod || 'Q4 2025'}.</p>
                <p className="mt-2 text-sm text-slate-400">Use Advanced Filters for period, jurisdiction, risk band, and early-warning scope.</p>
              </div>

              <div className="im-art-card rounded-xl border border-white/15 bg-slate-900/45 px-5 py-4 min-h-[140px]">
                <h3 className="text-xs uppercase tracking-[0.12em] text-slate-200">Firm drilldown</h3>
                {!selectedFirm && <p className="mt-2 text-sm text-slate-400">Select a firm in Priority Queue to inspect risk, model, and jurisdiction.</p>}
                {selectedFirm && (
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-100 truncate">{selectedFirm.label}</p>
                      <span className="text-[11px] uppercase text-slate-400">{selectedFirm.jurisdiction || 'Global'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"><p className="text-slate-400">Score</p><p className="text-slate-100 font-semibold">{selectedFirm.score.toFixed(1)}</p></div>
                      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"><p className="text-slate-400">Risk</p><p className="text-slate-100 font-semibold">{selectedFirm.riskIndex.toFixed(1)}</p></div>
                      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"><p className="text-slate-400">Model</p><p className="text-slate-100 font-semibold">{selectedFirm.modelType || 'N/A'}</p></div>
                      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"><p className="text-slate-400">Region</p><p className="text-slate-100 font-semibold">{toRegion(selectedFirm.jurisdiction)}</p></div>
                    </div>
                    {intelligenceLoading && <p className="text-xs text-slate-400">Loading intelligence...</p>}
                    {intelligenceError && <p className="text-xs text-red-200">Unable to load profile: {intelligenceError}</p>}
                  </div>
                )}
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
            <p className="text-slate-400 text-sm">How GTIXT scores, links, and warnings are produced and verified.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
            <div className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-6">
              <h3 className="text-cyan-300 font-semibold text-sm uppercase tracking-wider mb-2 flex items-center gap-2"><RealIcon name="analytics" size={14} className="grayscale opacity-80" />Risk Scoring</h3>
              <p className="text-slate-300 text-sm">Scores combine flow, balance-sheet stress, and regulatory posture. Updated monthly.</p>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-slate-900/50 p-6">
              <h3 className="text-emerald-300 font-semibold text-sm uppercase tracking-wider mb-2 flex items-center gap-2"><RealIcon name="galaxy" size={14} className="grayscale opacity-80" />Relationship Graph</h3>
              <p className="text-slate-300 text-sm">Institutions are mapped by jurisdiction, cluster, and propagation path. Links are verified.</p>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-slate-900/50 p-6">
              <h3 className="text-amber-300 font-semibold text-sm uppercase tracking-wider mb-2 flex items-center gap-2"><RealIcon name="monitoring" size={14} className="grayscale opacity-80" />Early Warning</h3>
              <p className="text-slate-300 text-sm">Alerts track score deltas, contagion pressure, and RVI breaches. Live refresh.</p>
            </div>

            <div className="rounded-xl border border-violet-500/20 bg-slate-900/50 p-6">
              <h3 className="text-violet-300 font-semibold text-sm uppercase tracking-wider mb-2 flex items-center gap-2"><RealIcon name="audit" size={14} className="grayscale opacity-80" />Data Provenance</h3>
              <p className="text-slate-300 text-sm">Evidence comes from profiles, snapshots, and regulatory feeds. Governance is audited.</p>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-slate-900/30 p-6 text-sm text-slate-300">
            <p className="mb-3">
              <span className="font-semibold text-white">Live Data · </span>
              Updated every 2 minutes from verified governance sources. Timeline extends to {payload?.timeline?.minPeriod || 'Q1 2024'} — {payload?.timeline?.maxPeriod || 'Q4 2025'}.
            </p>
            <p>
              For methodology details, audit reports, and risk model documentation, see <Link href="/methodology" className="text-cyan-400 hover:text-cyan-300">full methodology docs</Link>.
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
              <Link href="/methodology">Methodology</Link>
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
