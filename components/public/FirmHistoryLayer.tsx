import { GlassCard } from '@/components/design-system/GlassComponents'

export type HistoryPoint = {
  date: string
  granularity: string
  value: number | string | null
  metadata?: Record<string, unknown> | null
  sourceUrl?: string | null
}

export type HistorySources = Record<string, Record<string, HistoryPoint[]>>

type FirmHistoryLayerProps = {
  sources: HistorySources | null
  error?: string | null
}

type MetricSnapshot = {
  key: string
  label: string
  value: number
  sourceUrl?: string | null
}

function getNumericSeries(sources: HistorySources | null, source: string, metricKey: string): HistoryPoint[] {
  const points = sources?.[source]?.[metricKey] || []
  return points
    .filter((point) => typeof point.value === 'number' && Number.isFinite(point.value))
    .sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime())
}

function getLatestNumericValue(sources: HistorySources | null, source: string, metricKey: string): number | null {
  const points = getNumericSeries(sources, source, metricKey)
  const latest = points[points.length - 1]
  return latest && typeof latest.value === 'number' ? latest.value : null
}

function getLatestSourceUrl(points: HistoryPoint[]): string | null {
  return points[points.length - 1]?.sourceUrl || null
}

function formatCompactNumber(value: number | null, digits = 1): string {
  if (value === null || !Number.isFinite(value)) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: digits,
  }).format(value)
}

function formatInteger(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'N/A'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'N/A'
  const normalized = value <= 1 ? value * 100 : value
  return `${normalized.toFixed(1)}%`
}

function formatDuration(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'N/A'
  const minutes = Math.floor(value / 60)
  const seconds = Math.round(value % 60)
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
}

function formatMonth(date: string | null): string {
  if (!date) return 'N/A'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(parsed)
}

function formatTrafficLabel(key: string): string {
  return key
    .replace(/^traffic_source_/, '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatGeoLabel(key: string): string {
  return key.replace(/^geo_share_/, '').toUpperCase()
}

function extractLatestPrefixMetrics(sources: HistorySources | null, source: string, prefix: string, labelFormatter: (key: string) => string): MetricSnapshot[] {
  const entries = Object.entries(sources?.[source] || {})
  return entries.reduce<MetricSnapshot[]>((acc, [metricKey, points]) => {
    if (!metricKey.startsWith(prefix)) return acc

    const numericPoints = points.filter((point) => typeof point.value === 'number' && Number.isFinite(point.value))
    const latest = numericPoints[numericPoints.length - 1]
    if (!latest || typeof latest.value !== 'number') return acc

    acc.push({
      key: metricKey,
      label: labelFormatter(metricKey),
      value: latest.value,
      sourceUrl: latest.sourceUrl,
    })

    return acc
  }, [])
    .sort((left, right) => right.value - left.value)
}

function buildSparklinePath(values: number[], width: number, height: number, padding: number): string {
  if (values.length === 0) return ''
  if (values.length === 1) {
    const x = width / 2
    const y = height / 2
    return `M ${x} ${y}`
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  return values
    .map((value, index) => {
      const x = padding + (index / (values.length - 1)) * (width - padding * 2)
      const y = height - padding - ((value - min) / range) * (height - padding * 2)
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

function Sparkline({ values, stroke, fill }: { values: number[]; stroke: string; fill: string }) {
  if (values.length === 0) {
    return <div className="h-24 rounded-xl border border-white/8 bg-white/[0.03]" />
  }

  const width = 320
  const height = 96
  const padding = 8
  const linePath = buildSparklinePath(values, width, height, padding)
  const areaPath = `${linePath} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full overflow-visible">
      <defs>
        <linearGradient id={`gradient-${stroke.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.32" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#gradient-${stroke.replace(/[^a-z0-9]/gi, '')})`} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function formatRank(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'N/A'
  return `#${formatInteger(value)}`
}

function normalizePercentWidth(value: number): string {
  const normalized = value <= 1 ? value * 100 : value
  const clamped = Math.max(0, Math.min(100, normalized))
  return `${clamped.toFixed(1)}%`
}

function SignalBar({ label, value, accent = 'bg-cyan-400', href }: { label: string; value: number | null; accent?: string; href?: string | null }) {
  const formattedValue = formatPercent(value)
  const content = (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition-colors hover:border-white/20">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="text-white font-semibold">{formattedValue}</span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full rounded-full ${accent}`} style={{ width: value === null ? '0%' : normalizePercentWidth(value) }} />
      </div>
    </div>
  )

  if (!href) return content

  return (
    <a href={href} target="_blank" rel="noreferrer" className="block">
      {content}
    </a>
  )
}

export default function FirmHistoryLayer({ sources, error }: FirmHistoryLayerProps) {
  const similarwebVisits = getNumericSeries(sources, 'similarweb', 'monthly_visits')
  const waybackCaptures = getNumericSeries(sources, 'wayback', 'capture_count')
  const trustpilotRating = getLatestNumericValue(sources, 'trustpilot', 'rating')
  const trustpilotReviewCount = getLatestNumericValue(sources, 'trustpilot', 'review_count')
  const trustpilotNegativeSpike = getLatestNumericValue(sources, 'trustpilot', 'negative_review_spike')

  const currentMonthVisits = getLatestNumericValue(sources, 'similarweb', 'current_month_visits') ?? (similarwebVisits[similarwebVisits.length - 1]?.value as number | undefined) ?? null
  const globalRank = getLatestNumericValue(sources, 'similarweb', 'global_rank')
  const countryRank = getLatestNumericValue(sources, 'similarweb', 'country_rank')
  const categoryRank = getLatestNumericValue(sources, 'similarweb', 'category_rank')
  const bounceRate = getLatestNumericValue(sources, 'similarweb', 'bounce_rate')
  const pagesPerVisit = getLatestNumericValue(sources, 'similarweb', 'pages_per_visit')
  const timeOnSite = getLatestNumericValue(sources, 'similarweb', 'time_on_site_seconds')
  const rulesPresence = getLatestNumericValue(sources, 'wayback', 'rules_page_presence')

  const trafficSources = extractLatestPrefixMetrics(sources, 'similarweb', 'traffic_source_', formatTrafficLabel).slice(0, 5)
  const geoShares = extractLatestPrefixMetrics(sources, 'similarweb', 'geo_share_', formatGeoLabel).slice(0, 5)

  const archiveMonths = waybackCaptures.length
  const totalArchiveCaptures = waybackCaptures.reduce((sum, point) => sum + (typeof point.value === 'number' ? point.value : 0), 0)
  const firstArchiveMonth = waybackCaptures[0]?.date || null
  const latestArchiveMonth = waybackCaptures[waybackCaptures.length - 1]?.date || null

  const hasSignals = Boolean(
    similarwebVisits.length ||
    waybackCaptures.length ||
    trustpilotRating !== null ||
    trustpilotReviewCount !== null
  )

  return (
    <GlassCard
      variant="dark"
      hover={false}
      className="xl:col-span-2 rounded-2xl border-amber-400/20 bg-slate-950/55 shadow-amber-500/10"
      title="Historical Intelligence Layer"
      subtitle="External evidence stitched into the live firm profile: traffic, archive visibility, and platform reputation signals."
    >
      {!hasSignals && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-slate-300">
          <p className="text-white font-medium mb-1">External history is not populated for this firm yet.</p>
          <p>{error || 'GTIXT will surface SimilarWeb, Wayback, and Trustpilot signals here as soon as the ingestion layer has coverage for this domain.'}</p>
        </div>
      )}

      {hasSignals && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-xl border border-cyan-400/15 bg-cyan-500/[0.07] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">SimilarWeb</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatCompactNumber(currentMonthVisits, 1)}</p>
              <p className="mt-1 text-sm text-slate-300">Current monthly visits</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Rank Position</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatRank(globalRank)}</p>
              <p className="mt-1 text-sm text-slate-300">Global rank with country and category context</p>
            </div>
            <div className="rounded-xl border border-amber-400/15 bg-amber-500/[0.07] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-amber-200/80">Wayback</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatInteger(totalArchiveCaptures)}</p>
              <p className="mt-1 text-sm text-slate-300">Archived captures across {formatInteger(archiveMonths)} tracked months</p>
            </div>
            <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/[0.07] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Policy Surface</p>
              <p className="mt-2 text-2xl font-semibold text-white">{rulesPresence && rulesPresence > 0 ? 'Detected' : 'Limited'}</p>
              <p className="mt-1 text-sm text-slate-300">Archived rules, payout, FAQ, or terms references</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.95fr] gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-white text-lg font-semibold">Traffic Visibility Curve</h3>
                  <p className="text-sm text-slate-400 mt-1">Observed monthly visit estimates from the external SimilarWeb layer.</p>
                </div>
                {getLatestSourceUrl(similarwebVisits) && (
                  <a
                    href={getLatestSourceUrl(similarwebVisits) || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs uppercase tracking-[0.2em] text-cyan-300 hover:text-cyan-200"
                  >
                    Source
                  </a>
                )}
              </div>

              <Sparkline values={similarwebVisits.map((point) => Number(point.value || 0))} stroke="#38bdf8" fill="#0891b2" />

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
                <span>Window: <strong className="text-white">{formatMonth(similarwebVisits[0]?.date)} to {formatMonth(similarwebVisits[similarwebVisits.length - 1]?.date)}</strong></span>
                <span>Country rank: <strong className="text-white">{formatRank(countryRank)}</strong></span>
                <span>Category rank: <strong className="text-white">{formatRank(categoryRank)}</strong></span>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-slate-400">Bounce rate</p>
                  <p className="mt-1 text-white font-semibold">{formatPercent(bounceRate)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-slate-400">Pages per visit</p>
                  <p className="mt-1 text-white font-semibold">{pagesPerVisit !== null ? pagesPerVisit.toFixed(2) : 'N/A'}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-slate-400">Time on site</p>
                  <p className="mt-1 text-white font-semibold">{formatDuration(timeOnSite)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <h3 className="text-white text-lg font-semibold">Traffic Mix</h3>
                <p className="text-sm text-slate-400 mt-1 mb-4">Latest acquisition channels reported by the external SimilarWeb layer.</p>
                <div className="space-y-3">
                  {trafficSources.length === 0 && <p className="text-sm text-slate-400">No traffic-source mix available yet.</p>}
                  {trafficSources.map((metric) => (
                    <SignalBar key={metric.key} label={metric.label} value={metric.value} href={metric.sourceUrl} />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                <h3 className="text-white text-lg font-semibold">Geographic Concentration</h3>
                <p className="text-sm text-slate-400 mt-1 mb-4">Top country shares from the latest external traffic read.</p>
                <div className="space-y-3">
                  {geoShares.length === 0 && <p className="text-sm text-slate-400">No geographic share data available yet.</p>}
                  {geoShares.map((metric) => (
                    <SignalBar key={metric.key} label={metric.label} value={metric.value} accent="bg-emerald-400" href={metric.sourceUrl} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-white text-lg font-semibold">Archive Visibility</h3>
                  <p className="text-sm text-slate-400 mt-1">Wayback capture density and policy-surface detection across the site history.</p>
                </div>
                {getLatestSourceUrl(waybackCaptures) && (
                  <a
                    href={getLatestSourceUrl(waybackCaptures) || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs uppercase tracking-[0.2em] text-amber-300 hover:text-amber-200"
                  >
                    Source
                  </a>
                )}
              </div>

              <Sparkline values={waybackCaptures.map((point) => Number(point.value || 0))} stroke="#f59e0b" fill="#d97706" />

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-slate-400">First archive month</p>
                  <p className="mt-1 text-white font-semibold">{formatMonth(firstArchiveMonth)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-slate-400">Latest archive month</p>
                  <p className="mt-1 text-white font-semibold">{formatMonth(latestArchiveMonth)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-slate-400">Rules-page matches</p>
                  <p className="mt-1 text-white font-semibold">{formatInteger(rulesPresence)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <h3 className="text-white text-lg font-semibold">Reputation Snapshot</h3>
              <p className="text-sm text-slate-400 mt-1 mb-4">Trustpilot is accumulated as a recurring snapshot, not reconstructed archive history yet.</p>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-slate-400">Trustpilot rating</p>
                  <p className="mt-1 text-white font-semibold">{trustpilotRating !== null ? trustpilotRating.toFixed(2) : 'N/A'}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-slate-400">Review count</p>
                  <p className="mt-1 text-white font-semibold">{formatInteger(trustpilotReviewCount)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-slate-400">Recent negative-review spike</p>
                  <p className="mt-1 text-white font-semibold">{formatInteger(trustpilotNegativeSpike)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  )
}