'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Time, UTCTimestamp } from 'lightweight-charts'

export type TimeframeKey = '5m' | '10m' | '15m' | '20m' | '30m' | '1H' | '4H' | '1D' | '7D' | '30D' | '90D' | '1Y' | 'ALL'
type PanelPreset = 'score' | 'risk' | 'resilience' | 'concentration'

type OverlayKey = 'EMA20' | 'EMA50' | 'VWAP' | 'Volume' | 'RiskZones' | 'Signals'
type CandleRow = {
  time: Time
  open: number
  high: number
  low: number
  close: number
  volume: number
}

type TerminalApiRow = {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

type OverlayState = Record<OverlayKey, boolean>
type SurfaceMode = 'Intelligence' | 'Risk' | 'Compliance'
type CompareSeriesItem = {
  name: string
  score: number
  tone?: string
}
type RegimeContextSignal = {
  regimeState: 'Stable' | 'Expansion' | 'Stress' | 'Instability' | 'Collapse'
  regimeScore: number
  profileFit: number
  topCollapseProbability: number
  topCollapseFirm: string
  highRiskFirmCount: number
  eventSignals: Array<{ label: string; impact: number }>
}
type RegimeEra = {
  label: string
  start: string
  end: string
  tone: string
  summary: string
}
type RegimeEvent = {
  date: string
  label: string
  tone: string
  summary: string
}

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const TIMEFRAME_CONFIG: Record<TimeframeKey, { windowMs: number; requestWindowDays: number }> = {
  '5m': { windowMs: 5 * MINUTE, requestWindowDays: 30 },
  '10m': { windowMs: 10 * MINUTE, requestWindowDays: 30 },
  '15m': { windowMs: 15 * MINUTE, requestWindowDays: 30 },
  '20m': { windowMs: 20 * MINUTE, requestWindowDays: 30 },
  '30m': { windowMs: 30 * MINUTE, requestWindowDays: 30 },
  '1H': { windowMs: HOUR, requestWindowDays: 30 },
  '4H': { windowMs: 4 * HOUR, requestWindowDays: 30 },
  '1D': { windowMs: DAY, requestWindowDays: 30 },
  '7D': { windowMs: 7 * DAY, requestWindowDays: 90 },
  '30D': { windowMs: 30 * DAY, requestWindowDays: 180 },
  '90D': { windowMs: 90 * DAY, requestWindowDays: 365 },
  '1Y': { windowMs: 365 * DAY, requestWindowDays: 730 },
  'ALL': { windowMs: 12 * 365 * DAY, requestWindowDays: 5000 },
}

const DEFAULT_OVERLAYS: OverlayState = {
  EMA20: true,
  EMA50: true,
  VWAP: true,
  Volume: true,
  RiskZones: true,
  Signals: true,
}

const MODE_PRESETS: Record<SurfaceMode, OverlayState> = {
  Intelligence: {
    EMA20: true,
    EMA50: true,
    VWAP: true,
    Volume: true,
    RiskZones: false,
    Signals: true,
  },
  Risk: {
    EMA20: true,
    EMA50: true,
    VWAP: false,
    Volume: true,
    RiskZones: true,
    Signals: true,
  },
  Compliance: {
    EMA20: true,
    EMA50: false,
    VWAP: true,
    Volume: true,
    RiskZones: true,
    Signals: false,
  },
}

const PRESET_CONFIG: Record<PanelPreset, { base: number; drift: number; vol: number; seed: number; riskHigh: number; riskLow: number }> = {
  score: { base: 67, drift: 0.02, vol: 1.8, seed: 91, riskHigh: 82, riskLow: 46 },
  risk: { base: 61, drift: 0.015, vol: 2.2, seed: 141, riskHigh: 78, riskLow: 42 },
  resilience: { base: 73, drift: 0.01, vol: 1.5, seed: 201, riskHigh: 86, riskLow: 52 },
  concentration: { base: 58, drift: 0.018, vol: 2.0, seed: 271, riskHigh: 74, riskLow: 39 },
}

const REGIME_ERAS: RegimeEra[] = [
  { label: 'Foundation', start: '2014-01-01T00:00:00.000Z', end: '2016-12-31T23:59:59.000Z', tone: 'rgba(148,163,184,0.18)', summary: 'Weaker baseline, fragile operating quality.' },
  { label: 'Recovery', start: '2017-01-01T00:00:00.000Z', end: '2019-12-31T23:59:59.000Z', tone: 'rgba(34,197,94,0.16)', summary: 'Score recovery and risk normalization.' },
  { label: 'Stress', start: '2020-01-01T00:00:00.000Z', end: '2021-12-31T23:59:59.000Z', tone: 'rgba(239,68,68,0.16)', summary: 'Risk shock regime with deeper score pressure.' },
  { label: 'Expansion', start: '2022-01-01T00:00:00.000Z', end: '2024-12-31T23:59:59.000Z', tone: 'rgba(30,214,255,0.14)', summary: 'Recovery broadens and resilience rebuilds.' },
  { label: 'Acceleration', start: '2025-01-01T00:00:00.000Z', end: '2026-12-31T23:59:59.000Z', tone: 'rgba(245,158,11,0.16)', summary: 'Faster score expansion with compressed risk.' },
]

const REGIME_EVENTS: RegimeEvent[] = [
  { date: '2020-03-15T00:00:00.000Z', label: 'Stress Shock', tone: '#ef4444', summary: 'Cross-sector operating stress accelerates.' },
  { date: '2022-04-10T00:00:00.000Z', label: 'Normalization', tone: '#1ed6ff', summary: 'Risk compression and payout stability begin to recover.' },
  { date: '2024-02-20T00:00:00.000Z', label: 'Expansion Signal', tone: '#22c55e', summary: 'Broader resilience and score recovery confirmed.' },
  { date: '2025-10-18T00:00:00.000Z', label: 'Acceleration', tone: '#f59e0b', summary: 'Regime upgrades with stronger operator quality.' },
]

function seededNoise(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function buildSyntheticScoreSeries(days: number, preset: PanelPreset): CandleRow[] {
  const cfg = PRESET_CONFIG[preset]
  const rows: CandleRow[] = []
  const now = new Date()
  const baseDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  baseDate.setUTCDate(baseDate.getUTCDate() - days)

  let prevClose = cfg.base

  for (let i = 0; i < days; i += 1) {
    const current = new Date(baseDate)
    current.setUTCDate(baseDate.getUTCDate() + i)

    const trend = Math.sin((i + cfg.seed) / 31) * 0.9 + Math.cos((i + cfg.seed) / 17) * 0.6
    const volatility = (seededNoise(i + cfg.seed + 101) - 0.5) * cfg.vol
    const open = prevClose + (seededNoise(i + cfg.seed + 51) - 0.5) * (cfg.vol * 0.5)
    let close = open + trend + volatility * 0.55 + cfg.drift

    close = Math.max(34, Math.min(95, close))

    const spread = Math.max(0.6, Math.abs(close - open) + seededNoise(i + cfg.seed + 71) * 1.8)
    const high = Math.min(97, Math.max(open, close) + spread)
    const low = Math.max(30, Math.min(open, close) - spread)
    const volume = Math.round(420 + seededNoise(i + cfg.seed + 211) * 1600 + Math.abs(close - open) * 180)

    rows.push({
      time: Math.floor(current.getTime() / 1000) as UTCTimestamp,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    })

    prevClose = close
  }

  return rows
}

function calcEMA(values: number[], period: number) {
  const output: number[] = []
  const alpha = 2 / (period + 1)

  values.forEach((value, idx) => {
    if (idx === 0) {
      output.push(value)
      return
    }
    const prev = output[idx - 1]
    output.push(value * alpha + prev * (1 - alpha))
  })

  return output
}

function calcVWAP(rows: CandleRow[]) {
  const out: number[] = []
  let cumulativePV = 0
  let cumulativeVolume = 0

  rows.forEach((r) => {
    const typical = (r.high + r.low + r.close) / 3
    cumulativePV += typical * r.volume
    cumulativeVolume += r.volume
    out.push(cumulativeVolume === 0 ? typical : cumulativePV / cumulativeVolume)
  })

  return out
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export default function TradingTerminalChart({
  preset = 'score',
  title = 'Candlestick Regime View',
  kicker = 'Score Evolution Monitor',
  subtitle = 'Institutional chart surface with quant overlays for regime analysis.',
  initialMode = 'Risk',
  externalTimeframe,
  compact = false,
  chartHeight,
  compareSeries,
  regimeContext,
}: {
  preset?: PanelPreset
  title?: string
  kicker?: string
  subtitle?: string
  initialMode?: SurfaceMode
  externalTimeframe?: TimeframeKey
  compact?: boolean
  chartHeight?: number
  compareSeries?: CompareSeriesItem[]
  regimeContext?: RegimeContextSignal
}) {
  const chartShellRef = useRef<HTMLDivElement | null>(null)
  const mainChartRef = useRef<HTMLDivElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const [timeframe, setTimeframe] = useState<TimeframeKey>('30D')
  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>(initialMode)
  const [overlays, setOverlays] = useState<OverlayState>(DEFAULT_OVERLAYS)
  const [chartError, setChartError] = useState<string | null>(null)
  const [liveRows, setLiveRows] = useState<CandleRow[]>([])
  const [dataSource, setDataSource] = useState<'live' | 'fallback'>('fallback')
  const [isLoading, setIsLoading] = useState(true)
  const [densityMeta, setDensityMeta] = useState<{
    count: number
    target: number
    coveragePct: number
    surplusCandles: number
    multiPointCandlePct: number
    avgPointsPerCandle: number
    ohlcIntegrityScore: number
    autoBucketOptimized: boolean
    bucketOriginOffset: string
  } | null>(null)
  const [bucketIntervalLabel, setBucketIntervalLabel] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    const load = async () => {
      setIsLoading(true)
      try {
        const days = TIMEFRAME_CONFIG[timeframe].requestWindowDays
        const response = await fetch(`/api/analytics/terminal?preset=${preset}&days=${days}&timeframe=${timeframe}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`Live analytics request failed (${response.status})`)

        const payload = await response.json()
        const rows: CandleRow[] = Array.isArray(payload?.rows)
          ? (payload.rows as TerminalApiRow[])
              .map((row): CandleRow | null => {
                const timestamp = new Date(row.date).getTime()
                if (!Number.isFinite(timestamp)) return null

                return {
                  time: Math.floor(timestamp / 1000) as UTCTimestamp,
                  open: row.open,
                  high: row.high,
                  low: row.low,
                  close: row.close,
                  volume: row.volume,
                }
              })
              .filter((row): row is NonNullable<typeof row> => row !== null)
          : []

        if (!active) return

        if (rows.length > 0) {
          setLiveRows(rows)
          setDataSource('live')
          setBucketIntervalLabel(typeof payload?.bucketInterval === 'string' ? payload.bucketInterval : null)
          setDensityMeta({
            count: Number(payload?.count || rows.length),
            target: Number(payload?.institutionalTargetCandles || 200),
            coveragePct: Number(payload?.densityCoveragePct || ((rows.length / 200) * 100)),
            surplusCandles: Number(payload?.surplusCandles || 0),
            multiPointCandlePct: Number(payload?.multiPointCandlePct || 0),
            avgPointsPerCandle: Number(payload?.avgPointsPerCandle || 0),
            ohlcIntegrityScore: Number(payload?.ohlcIntegrityScore || 0),
            autoBucketOptimized: Boolean(payload?.autoBucketOptimized),
            bucketOriginOffset: typeof payload?.bucketOriginOffset === 'string' ? payload.bucketOriginOffset : '0 days',
          })
          setChartError(null)
        } else {
          setLiveRows(buildSyntheticScoreSeries(520, preset))
          setDataSource('fallback')
          setBucketIntervalLabel(null)
          setDensityMeta(null)
          setChartError('Live dataset unavailable for this panel')
        }
      } catch (error) {
        if (!active || controller.signal.aborted) return
        setLiveRows(buildSyntheticScoreSeries(520, preset))
        setDataSource('fallback')
        setBucketIntervalLabel(null)
        setDensityMeta(null)
        setChartError(error instanceof Error ? error.message : 'Live data unavailable')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()

    return () => {
      active = false
      controller.abort()
    }
  }, [preset, timeframe])

  const fullSeries = useMemo(() => (liveRows.length ? liveRows : buildSyntheticScoreSeries(520, preset)), [liveRows, preset])

  const visibleRows = useMemo(() => {
    if (!fullSeries.length) return []

    const latestTimestamp = Number(fullSeries[fullSeries.length - 1].time) * 1000
    const cutoff = latestTimestamp - TIMEFRAME_CONFIG[timeframe].windowMs
    const filtered = fullSeries.filter((row) => Number(row.time) * 1000 >= cutoff)

    return filtered.length ? filtered : fullSeries.slice(Math.max(fullSeries.length - 1, 0))
  }, [fullSeries, timeframe])

  const latestSnapshotLabel = useMemo(() => {
    if (!visibleRows.length) return 'Unavailable'

    const latest = new Date(Number(visibleRows[visibleRows.length - 1].time) * 1000)
    return latest.toISOString().slice(0, 16).replace('T', ' ')
  }, [visibleRows])

  const historyDepthLabel = useMemo(() => {
    if (visibleRows.length < 2) return `${visibleRows.length} point`

    const first = Number(visibleRows[0].time) * 1000
    const last = Number(visibleRows[visibleRows.length - 1].time) * 1000
    const diffMs = Math.max(last - first, 0)
    const diffDays = Math.round(diffMs / DAY)

    if (diffDays >= 365) return `${(diffDays / 365).toFixed(1)}y`
    if (diffDays >= 30) return `${Math.round(diffDays / 30)}mo`
    if (diffDays >= 1) return `${diffDays}d`

    const diffHours = Math.max(1, Math.round(diffMs / HOUR))
    return `${diffHours}h`
  }, [visibleRows])

  const seriesStateLabel = useMemo(() => {
    if (dataSource === 'live') {
      if (densityMeta) {
        const surplusLabel = densityMeta.surplusCandles > 0 ? ` +${densityMeta.surplusCandles} surplus` : ''
        return `${densityMeta.count}/${densityMeta.target} candles (${densityMeta.coveragePct.toFixed(1)}%)${surplusLabel}`
      }
      return `${liveRows.length} live points`
    }
    return 'Synthetic continuity mode'
  }, [dataSource, liveRows.length, densityMeta])

  const qualityStateLabel = useMemo(() => {
    if (dataSource !== 'live' || !densityMeta) return 'Model-derived continuity only'
    return `Integrity ${densityMeta.ohlcIntegrityScore.toFixed(1)} · ${densityMeta.multiPointCandlePct.toFixed(1)}% multi-point · ${densityMeta.avgPointsPerCandle.toFixed(2)} pts/candle`
  }, [dataSource, densityMeta])

  const qualityBandLabel = useMemo(() => {
    if (!densityMeta || dataSource !== 'live') return 'Synthetic'
    if (densityMeta.ohlcIntegrityScore >= 75) return 'Institutional'
    if (densityMeta.ohlcIntegrityScore >= 50) return 'Acceptable'
    return 'Sparse'
  }, [densityMeta, dataSource])

  const contextAlert = useMemo(() => {
    if (!regimeContext) return null

    const { regimeState, regimeScore, topCollapseProbability, topCollapseFirm, highRiskFirmCount, profileFit } = regimeContext
    if (regimeState === 'Collapse' || topCollapseProbability >= 70) {
      return {
        tone: 'text-rose-200 border-rose-400/40 bg-rose-950/30',
        title: 'Critical Regime Alert',
        detail: `${topCollapseFirm} shows ${topCollapseProbability}% collapse probability. Immediate capital containment advised.`,
      }
    }
    if (regimeState === 'Instability' || topCollapseProbability >= 52 || highRiskFirmCount >= 2) {
      return {
        tone: 'text-amber-100 border-amber-400/35 bg-amber-950/25',
        title: 'Instability Alert',
        detail: `Regime ${regimeState} (${regimeScore.toFixed(1)}) with ${highRiskFirmCount} high-risk firms. Profile fit ${profileFit.toFixed(1)}.`,
      }
    }
    return {
      tone: 'text-cyan-100 border-cyan-400/35 bg-cyan-950/25',
      title: 'Regime Monitor',
      detail: `Regime ${regimeState} (${regimeScore.toFixed(1)}) remains tradable. Top collapse risk ${topCollapseProbability}% (${topCollapseFirm}).`,
    }
  }, [regimeContext])

  const visibleTimeRange = useMemo(() => {
    if (!visibleRows.length) return null
    return {
      startMs: Number(visibleRows[0].time) * 1000,
      endMs: Number(visibleRows[visibleRows.length - 1].time) * 1000,
    }
  }, [visibleRows])

  const visibleRegimeEras = useMemo(() => {
    if (!visibleTimeRange) return []
    const total = Math.max(visibleTimeRange.endMs - visibleTimeRange.startMs, 1)

    return REGIME_ERAS
      .map((era) => {
        const eraStartMs = new Date(era.start).getTime()
        const eraEndMs = new Date(era.end).getTime()
        const clippedStart = Math.max(eraStartMs, visibleTimeRange.startMs)
        const clippedEnd = Math.min(eraEndMs, visibleTimeRange.endMs)

        if (clippedEnd <= clippedStart) return null

        return {
          ...era,
          startPct: ((clippedStart - visibleTimeRange.startMs) / total) * 100,
          widthPct: ((clippedEnd - clippedStart) / total) * 100,
          eraStartMs,
        }
      })
      .filter((era): era is RegimeEra & { startPct: number; widthPct: number; eraStartMs: number } => era !== null)
  }, [visibleTimeRange])

  const activeRegime = useMemo(() => {
    if (!visibleRows.length) return null
    const lastTimeMs = Number(visibleRows[visibleRows.length - 1].time) * 1000
    return REGIME_ERAS.find((era) => {
      const startMs = new Date(era.start).getTime()
      const endMs = new Date(era.end).getTime()
      return lastTimeMs >= startMs && lastTimeMs <= endMs
    }) || null
  }, [visibleRows])

  const visibleRegimeEvents = useMemo(() => {
    if (!visibleTimeRange) return []
    return REGIME_EVENTS.filter((event) => {
      const eventMs = new Date(event.date).getTime()
      return eventMs >= visibleTimeRange.startMs && eventMs <= visibleTimeRange.endMs
    })
  }, [visibleTimeRange])

  const useLineMode = dataSource === 'live' && visibleRows.length < 10

  const lineModeReason = useMemo(() => {
    if (!useLineMode) return null
    return `${liveRows.length} real points available; 10 needed for a meaningful candle regime view.`
  }, [liveRows.length, useLineMode])

  const closes = useMemo(() => visibleRows.map((row) => row.close), [visibleRows])
  const ema20Series = useMemo(() => calcEMA(closes, 20), [closes])
  const ema50Series = useMemo(() => calcEMA(closes, 50), [closes])
  const vwapSeries = useMemo(() => calcVWAP(visibleRows), [visibleRows])

  const cfg = PRESET_CONFIG[preset]

  useEffect(() => {
    setOverlays(MODE_PRESETS[surfaceMode])
  }, [surfaceMode])

  useEffect(() => {
    setSurfaceMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    if (externalTimeframe !== undefined) setTimeframe(externalTimeframe)
  }, [externalTimeframe])

  useEffect(() => {
    if (!mainChartRef.current || !tooltipRef.current || !chartShellRef.current) return

    setChartError(null)
    let disposed = false
    let cleanup: (() => void) | undefined

    const boot = async () => {
      try {
        const shell = chartShellRef.current
        const target = mainChartRef.current
        const tooltipEl = tooltipRef.current
        if (!shell || !target || !tooltipEl) return

        const {
          createChart,
          ColorType,
          CandlestickSeries,
          LineSeries,
          HistogramSeries,
          createSeriesMarkers,
        } = await import('lightweight-charts')

        if (disposed) return

        const resolvedChartHeight = compact ? (chartHeight ?? 200) : (chartHeight ?? 500)
        const chartWidth = Math.max(shell.clientWidth - 2, 320)
        const barSpacing = clamp((chartWidth - 120) / Math.max(visibleRows.length, 1), 3, 14)

        const chart = createChart(target, {
          width: chartWidth,
          height: resolvedChartHeight,
          layout: {
            background: { type: ColorType.Solid, color: '#050A14' },
            textColor: '#A9B6CC',
            fontFamily: 'IBM Plex Sans, Inter, system-ui, -apple-system, Segoe UI, sans-serif',
          },
          grid: {
            vertLines: { color: 'rgba(255,255,255,0.04)' },
            horzLines: { color: 'rgba(255,255,255,0.04)' },
          },
          rightPriceScale: {
            borderColor: '#25324a',
          },
          timeScale: {
            borderColor: '#25324a',
            timeVisible: true,
            secondsVisible: timeframe !== '1D' && timeframe !== '7D' && timeframe !== '30D' && timeframe !== '90D' && timeframe !== '1Y' && timeframe !== 'ALL',
            rightOffset: 3,
            barSpacing,
            minBarSpacing: 2,
            fixLeftEdge: false,
            fixRightEdge: false,
          },
          crosshair: {
            vertLine: { color: '#4f6386', width: 1 },
            horzLine: { color: '#4f6386', width: 1 },
          },
          localization: {
            priceFormatter: (price: number) => `${price.toFixed(2)}`,
          },
        })

        const candle = chart.addSeries(CandlestickSeries, {
          upColor: '#1ED6FF',
          downColor: '#FF6B6B',
          borderUpColor: '#1ED6FF',
          borderDownColor: '#FF6B6B',
          wickUpColor: '#1ED6FF',
          wickDownColor: '#FF6B6B',
          priceLineColor: '#1ED6FF',
        })

        const fallbackLine = chart.addSeries(LineSeries, {
          color: '#1ED6FF',
          lineWidth: 2,
          priceLineVisible: true,
          lastValueVisible: true,
        })

        const ema20 = chart.addSeries(LineSeries, {
          color: '#38bdf8',
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        })

        const ema50 = chart.addSeries(LineSeries, {
          color: '#f59e0b',
          lineWidth: 2,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        })

        const vwap = chart.addSeries(LineSeries, {
          color: '#a78bfa',
          lineWidth: 2,
          lineStyle: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        })

        const compareColorMap: Record<string, string> = {
          emerald: '#10B981',
          cyan: '#1ED6FF',
          amber: '#FFD166',
          rose: '#FF6B6B',
        }

        const compareLines = (compareSeries || []).slice(0, 4).map((item, idx) => {
          const line = chart.addSeries(LineSeries, {
            color: compareColorMap[item.tone || ''] || ['#93C5FD', '#F9A8D4', '#86EFAC', '#FCD34D'][idx % 4],
            lineWidth: 2,
            lineStyle: idx % 2 === 0 ? 0 : 2,
            priceLineVisible: false,
            lastValueVisible: true,
            title: item.name,
          })

          const offset = (item.score - 70) * 0.08
          const amplitude = Math.max(0.5, (78 - item.score) * 0.03)
          line.setData(visibleRows.map((row, rowIdx) => ({
            time: row.time,
            value: Number((row.close + offset + Math.sin((rowIdx + 1) / 8 + idx) * amplitude).toFixed(2)),
          })))

          return line
        })

        const riskHigh = chart.addSeries(LineSeries, {
          color: 'rgba(244,63,94,0.65)',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        })

        const riskLow = chart.addSeries(LineSeries, {
          color: 'rgba(34,197,94,0.65)',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        })

        const volume = chart.addSeries(HistogramSeries, {
          priceFormat: { type: 'volume' },
          priceScaleId: '',
          lastValueVisible: false,
          priceLineVisible: false,
        })

        volume.priceScale().applyOptions({
          scaleMargins: {
            top: 0.78,
            bottom: 0,
          },
        })

        candle.setData(visibleRows)
        fallbackLine.setData(visibleRows.map((row) => ({ time: row.time, value: row.close })))
        ema20.setData(visibleRows.map((row, idx) => ({ time: row.time, value: Number(ema20Series[idx]?.toFixed(2) || row.close) })))
        ema50.setData(visibleRows.map((row, idx) => ({ time: row.time, value: Number(ema50Series[idx]?.toFixed(2) || row.close) })))
        vwap.setData(visibleRows.map((row, idx) => ({ time: row.time, value: Number(vwapSeries[idx]?.toFixed(2) || row.close) })))
        riskHigh.setData(visibleRows.map((r) => ({ time: r.time, value: cfg.riskHigh })))
        riskLow.setData(visibleRows.map((r) => ({ time: r.time, value: cfg.riskLow })))
        volume.setData(visibleRows.map((row) => ({
          time: row.time,
          value: row.volume,
          color: row.close >= row.open ? 'rgba(30,214,255,0.30)' : 'rgba(255,107,107,0.38)',
        })))

        const regimeMarkers = visibleRegimeEras
          .filter((era) => visibleRows.some((row) => Number(row.time) * 1000 >= era.eraStartMs))
          .slice(0, 5)
          .map((era) => {
            const markerRow = visibleRows.find((row) => Number(row.time) * 1000 >= era.eraStartMs)
            if (!markerRow) return null

            return {
              time: markerRow.time,
              position: 'inBar',
              color: '#94a3b8',
              shape: 'circle',
              text: era.label.toUpperCase(),
            }
          })
          .filter((marker): marker is NonNullable<typeof marker> => marker !== null)

        const eventMarkers = visibleRegimeEvents
          .map((event) => {
            const eventMs = new Date(event.date).getTime()
            const markerRow = visibleRows.find((row) => Number(row.time) * 1000 >= eventMs)
            if (!markerRow) return null

            return {
              time: markerRow.time,
              position: 'aboveBar',
              color: event.tone,
              shape: 'square',
              text: event.label.toUpperCase(),
            }
          })
          .filter((marker): marker is NonNullable<typeof marker> => marker !== null)

        if (!useLineMode) {
          createSeriesMarkers(candle, [
            {
              time: visibleRows[Math.max(visibleRows.length - 12, 1)]?.time,
              position: 'belowBar',
              color: '#22c55e',
              shape: 'arrowUp',
              text: 'GTIXT LONG',
            },
            {
              time: visibleRows[Math.max(visibleRows.length - 6, 2)]?.time,
              position: 'aboveBar',
              color: '#ef4444',
              shape: 'arrowDown',
              text: 'RISK CUT',
            },
            ...((overlays.Signals ? regimeMarkers : []).slice(0, 3)),
            ...((overlays.Signals ? eventMarkers : []).slice(0, 3)),
          ].filter((marker) => Boolean(marker.time)) as never)
        }

        chart.subscribeCrosshairMove((param) => {
          if (!param.point || !param.time || !param.seriesData.size) {
            tooltipEl.style.display = 'none'
            return
          }

          const candleData = param.seriesData.get(candle) as { open: number; high: number; low: number; close: number } | undefined
          if (!candleData) {
            tooltipEl.style.display = 'none'
            return
          }

          tooltipEl.style.display = 'block'
          tooltipEl.style.left = `${param.point.x + 14}px`
          tooltipEl.style.top = `${param.point.y + 14}px`
          tooltipEl.innerHTML = `
            <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#67e8f9;margin-bottom:4px;">GTIXT Terminal</div>
            <div style="font-size:12px;color:#e5e7eb;display:grid;grid-template-columns:auto auto;gap:2px 10px;">
              <span>Open</span><strong>${candleData.open.toFixed(2)}</strong>
              <span>High</span><strong>${candleData.high.toFixed(2)}</strong>
              <span>Low</span><strong>${candleData.low.toFixed(2)}</strong>
              <span>Close</span><strong>${candleData.close.toFixed(2)}</strong>
            </div>
          `
        })

        candle.applyOptions({ visible: !useLineMode })
        fallbackLine.applyOptions({ visible: useLineMode })
        ema20.applyOptions({ visible: overlays.EMA20 })
        ema50.applyOptions({ visible: overlays.EMA50 })
        vwap.applyOptions({ visible: overlays.VWAP })
        volume.applyOptions({ visible: overlays.Volume })
        riskHigh.applyOptions({ visible: overlays.RiskZones })
        riskLow.applyOptions({ visible: overlays.RiskZones })
        compareLines.forEach((line) => line.applyOptions({ visible: (compareSeries?.length || 0) > 0 }))

        chart.timeScale().fitContent()

        const resizeObserver = new ResizeObserver((entries) => {
          const entry = entries[0]
          if (!entry) return
          const nextWidth = Math.max(Math.floor(entry.contentRect.width) - 2, 320)
          const nextBarSpacing = clamp((nextWidth - 120) / Math.max(visibleRows.length, 1), 3, 14)
          chart.applyOptions({
            width: nextWidth,
            height: resolvedChartHeight,
            timeScale: {
              barSpacing: nextBarSpacing,
              rightOffset: 3,
            },
          })
        })

        resizeObserver.observe(shell)

        cleanup = () => {
          resizeObserver.disconnect()
          chart.remove()
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Chart initialization failed'
        setChartError(message)
      }
    }

    boot()

    return () => {
      disposed = true
      cleanup && cleanup()
    }
  }, [visibleRows, ema20Series, ema50Series, vwapSeries, overlays, cfg.riskHigh, cfg.riskLow, timeframe, useLineMode, compareSeries])

  const lastClose = visibleRows[visibleRows.length - 1]?.close || 0
  const firstClose = visibleRows[0]?.close || 0
  const lastRow = visibleRows[visibleRows.length - 1]
  const lastVwap = vwapSeries[vwapSeries.length - 1] || 0
  const lastVolume = lastRow?.volume || 0
  const delta = lastClose - firstClose
  const deltaPct = firstClose ? (delta / firstClose) * 100 : 0
  const volatilityPct = lastRow ? ((lastRow.high - lastRow.low) / Math.max(lastRow.close, 1)) * 100 : 0
  const volumeTrend = visibleRows.length > 1 ? lastVolume / Math.max(visibleRows[Math.max(visibleRows.length - 2, 0)]?.volume || 1, 1) : 1

  const { highZoneTop, highZoneHeight, lowZoneTop, lowZoneHeight } = useMemo(() => {
    if (!visibleRows.length) return { highZoneTop: 0, highZoneHeight: 0, lowZoneTop: 0, lowZoneHeight: 0 }

    const maxPrice = Math.max(...visibleRows.map((r) => r.high))
    const minPrice = Math.min(...visibleRows.map((r) => r.low))
    const range = Math.max(0.001, maxPrice - minPrice)

    const toPctFromTop = (value: number) => ((maxPrice - value) / range) * 100
    const highEdge = Math.max(0, Math.min(100, toPctFromTop(cfg.riskHigh)))
    const lowEdge = Math.max(0, Math.min(100, toPctFromTop(cfg.riskLow)))

    return {
      highZoneTop: 0,
      highZoneHeight: Math.max(0, highEdge),
      lowZoneTop: lowEdge,
      lowZoneHeight: Math.max(0, 100 - lowEdge),
    }
  }, [visibleRows, cfg.riskHigh, cfg.riskLow])

  return (
    <div className={compact ? 'overflow-hidden' : 'rounded-[22px] border border-slate-700/90 bg-[linear-gradient(180deg,#071224_0%,#050c18_100%)] p-4 md:p-5 shadow-[0_24px_60px_rgba(0,0,0,0.42)]'}>
      {!compact && <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
            <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-300">{kicker}</p>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${
              dataSource === 'live'
                ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100'
                : 'border-amber-400/30 bg-amber-400/10 text-amber-100'
            }`}>{dataSource === 'live' ? 'DB Live' : 'Fallback'}</span>
            {useLineMode && <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-amber-100">Line Mode</span>}
            {isLoading && <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Syncing...</span>}
          </div>
          <h3 className="text-[clamp(1.8rem,3vw,2.5rem)] font-semibold text-slate-100">{title}</h3>
          <p className="text-sm text-slate-400 mt-1">
            Close {lastClose.toFixed(2)} · {delta >= 0 ? '+' : ''}{delta.toFixed(2)} ({deltaPct.toFixed(2)}%)
          </p>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 min-w-[280px] xl:max-w-[420px]">
          <div className="rounded-xl border border-slate-700/80 bg-slate-950/65 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Volatility</div>
            <div className="mt-1 text-sm font-semibold text-slate-100">{volatilityPct.toFixed(2)}%</div>
          </div>
          <div className="rounded-xl border border-slate-700/80 bg-slate-950/65 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">VWAP Delta</div>
            <div className={`mt-1 text-sm font-semibold ${lastClose >= lastVwap ? 'text-emerald-300' : 'text-rose-300'}`}>{(lastClose - lastVwap).toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-slate-700/80 bg-slate-950/65 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Volume Ratio</div>
            <div className="mt-1 text-sm font-semibold text-slate-100">{volumeTrend.toFixed(2)}x</div>
          </div>
          <div className="rounded-xl border border-slate-700/80 bg-slate-950/65 px-3 py-2">
            <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Analysis Profile</div>
            <div className="mt-1 text-sm font-semibold text-cyan-100">{surfaceMode}</div>
          </div>
        </div>
      </div>}

      {!compact && <div className="flex flex-wrap gap-2 mb-4">
        {(['Intelligence', 'Risk', 'Compliance'] as SurfaceMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setSurfaceMode(mode)}
            className={`px-3 py-1.5 text-xs rounded-md border transition ${
              surfaceMode === mode
                ? 'border-cyan-300 bg-cyan-400/20 text-cyan-100'
                : 'border-slate-600 bg-slate-900 text-slate-300 hover:border-slate-400'
            }`}
          >
            {mode} Mode
          </button>
        ))}
      </div>}

      {!compact && <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4">
        <div className="rounded-xl border border-slate-700/80 bg-slate-950/65 px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Latest Snapshot</div>
          <div className="mt-1 text-sm font-semibold text-slate-100">{latestSnapshotLabel}</div>
        </div>
        <div className="rounded-xl border border-slate-700/80 bg-slate-950/65 px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">History Depth</div>
          <div className="mt-1 text-sm font-semibold text-slate-100">{historyDepthLabel}</div>
        </div>
        <div className="rounded-xl border border-slate-700/80 bg-slate-950/65 px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Series State</div>
          <div className="mt-1 text-sm font-semibold text-cyan-100">{seriesStateLabel}</div>
        </div>
        <div className="rounded-xl border border-slate-700/80 bg-slate-950/65 px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">OHLC Quality</div>
          <div className="mt-1 text-sm font-semibold text-slate-100">{qualityStateLabel}</div>
        </div>
      </div>}

      {!compact && (
        <div className="mb-4 rounded-xl border border-slate-700/80 bg-slate-950/65 px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Resolution</div>
          <div className="mt-1 text-sm font-semibold text-slate-100">
            Timeframe {timeframe} · Bucket {bucketIntervalLabel || 'auto'}{densityMeta?.autoBucketOptimized ? ` · Adaptive · Offset ${densityMeta.bucketOriginOffset}` : ''}
          </div>
        </div>
      )}

      {!compact && densityMeta && (
        <div className="mb-4 rounded-xl border border-slate-700/80 bg-slate-950/65 px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Quality Band</div>
          <div className="mt-1 text-sm font-semibold text-slate-100">{qualityBandLabel}{activeRegime ? ` · ${activeRegime.label}` : ''}</div>
        </div>
      )}

      {!compact && contextAlert && (
        <div className={`mb-4 rounded-xl border px-3 py-2 ${contextAlert.tone}`}>
          <div className="text-[10px] uppercase tracking-[0.12em] opacity-80">Decision Context</div>
          <div className="mt-1 text-sm font-semibold">{contextAlert.title}</div>
          <div className="mt-1 text-xs opacity-90">{contextAlert.detail}</div>
          {regimeContext?.eventSignals?.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {regimeContext.eventSignals.slice(0, 3).map((signal) => (
                <span key={signal.label} className="rounded-md border border-current/40 px-2 py-0.5 text-[11px]">
                  {signal.label} (+{signal.impact}%)
                </span>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {!compact && visibleRegimeEras.length > 0 && (
        <div className="mb-4 rounded-xl border border-slate-700/80 bg-slate-950/65 px-3 py-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Regime Timeline</div>
              <div className="mt-1 text-sm font-semibold text-slate-100">{activeRegime ? `${activeRegime.label} regime active` : 'Historical phase map'}</div>
            </div>
            <div className="text-xs text-slate-400">{activeRegime?.summary || 'Visible eras mapped from synthetic historical transitions.'}</div>
          </div>
          <div className="relative h-10 overflow-hidden rounded-lg border border-slate-800 bg-slate-950/80">
            {visibleRegimeEras.map((era) => (
              <div
                key={`${era.label}-${era.start}`}
                className="absolute inset-y-0 border-r border-slate-950/70"
                style={{ left: `${era.startPct}%`, width: `${Math.max(era.widthPct, 2)}%`, background: era.tone }}
                title={`${era.label}: ${era.summary}`}
              >
                <div className="px-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-100/90">{era.label}</div>
              </div>
            ))}
          </div>
          {visibleRegimeEvents.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {visibleRegimeEvents.map((event) => (
                <span
                  key={`${event.date}-${event.label}`}
                  className="rounded-md border px-2 py-1 text-[11px]"
                  style={{ borderColor: `${event.tone}55`, color: event.tone, background: `${event.tone}12` }}
                  title={event.summary}
                >
                  {event.label} · {event.date.slice(0, 10)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {!compact && (compareSeries?.length || 0) > 0 && (
        <div className="mb-4 rounded-xl border border-slate-700/80 bg-slate-950/65 px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500 mb-2">Compare Overlay</div>
          <div className="flex flex-wrap gap-2">
            {compareSeries?.slice(0, 4).map((item) => (
              <span key={item.name} className="rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-[11px] text-slate-200">
                {item.name} ({item.score})
              </span>
            ))}
          </div>
        </div>
      )}

      {!compact && <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
        <div className="rounded-xl border border-slate-700/80 bg-slate-950/65 px-3 py-2 text-xs text-slate-300">Open <span className="text-slate-100 ml-1">{lastRow?.open.toFixed(2) || '0.00'}</span></div>
        <div className="rounded-xl border border-slate-700/80 bg-slate-950/65 px-3 py-2 text-xs text-slate-300">High <span className="text-slate-100 ml-1">{lastRow?.high.toFixed(2) || '0.00'}</span></div>
        <div className="rounded-xl border border-slate-700/80 bg-slate-950/65 px-3 py-2 text-xs text-slate-300">Low <span className="text-slate-100 ml-1">{lastRow?.low.toFixed(2) || '0.00'}</span></div>
        <div className="rounded-xl border border-slate-700/80 bg-slate-950/65 px-3 py-2 text-xs text-slate-300">Close <span className="text-slate-100 ml-1">{lastClose.toFixed(2)}</span></div>
        <div className="rounded-xl border border-slate-700/80 bg-slate-950/65 px-3 py-2 text-xs text-slate-300">VWAP <span className="text-slate-100 ml-1">{lastVwap.toFixed(2)}</span></div>
        <div className="rounded-xl border border-slate-700/80 bg-slate-950/65 px-3 py-2 text-xs text-slate-300">Volume <span className="text-slate-100 ml-1">{lastVolume.toLocaleString()}</span></div>
      </div>}

      {!compact && <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(overlays) as OverlayKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setOverlays((prev) => ({ ...prev, [key]: !prev[key] }))}
            className={`px-3 py-1.5 text-xs rounded-md border transition ${
              overlays[key]
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                : 'border-slate-600 bg-slate-900 text-slate-300 hover:border-slate-400'
            }`}
          >
            {key}
          </button>
        ))}
      </div>}

      <div ref={chartShellRef} className="relative rounded-[18px] border border-slate-800/90 bg-[#020712] p-3 md:p-4">
        {!externalTimeframe && <div className="absolute top-3 right-3 z-[3] flex flex-wrap justify-end gap-1.5 max-w-[70%]">
          {(Object.keys(TIMEFRAME_CONFIG) as TimeframeKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTimeframe(key)}
              className={`px-2.5 py-1 text-[11px] rounded-md border transition ${
                timeframe === key
                  ? 'border-cyan-400 bg-cyan-500/18 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]'
                  : 'border-slate-700 bg-slate-950/90 text-slate-300 hover:border-slate-500'
              }`}
            >
              {key}
            </button>
          ))}
        </div>}
        {overlays.RiskZones && (
          <>
            <div
              className="absolute inset-x-3 md:inset-x-4 pointer-events-none bg-rose-500/8 border-b border-rose-400/25 z-[1]"
              style={{ top: `calc(${highZoneTop}% + 12px)`, height: `calc(${highZoneHeight}% - 12px)` }}
            />
            <div
              className="absolute inset-x-3 md:inset-x-4 pointer-events-none bg-emerald-500/8 border-t border-emerald-400/25 z-[1]"
              style={{ top: `calc(${lowZoneTop}% + 12px)`, height: `calc(${lowZoneHeight}% - 12px)` }}
            />
          </>
        )}
        <div className="mb-2 flex items-center justify-between gap-3 pr-[230px] min-h-[22px]">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-slate-500">
            <span className="text-slate-300">GTIXT {preset}</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span>Institutional Candle Surface</span>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-slate-500">
            <span>Crosshair</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span>Volume</span>
            <span className="h-1 w-1 rounded-full bg-slate-600" />
            <span>VWAP</span>
          </div>
        </div>
        <div ref={mainChartRef} style={{ height: compact ? (chartHeight ?? 200) : (chartHeight ?? 500), width: '100%' }} />
        <div
          ref={tooltipRef}
          className="absolute hidden pointer-events-none min-w-[170px] rounded-lg border border-slate-500/40 bg-slate-900/75 p-2 shadow-lg backdrop-blur-md z-[2]"
        />
      </div>

      {chartError && (
        <div className="mt-3 rounded-md border border-rose-500/35 bg-rose-950/35 p-2 text-xs text-rose-200">
          Chart runtime warning: {chartError}
        </div>
      )}

      {useLineMode && (
        <div className="mt-3 rounded-md border border-amber-400/30 bg-amber-950/25 p-2 text-xs text-amber-100">
          Live history is still too short for a meaningful candlestick regime view on this panel. GTIXT switches to line mode until at least 10 real candles are available. {lineModeReason}
        </div>
      )}
    </div>
  )
}
