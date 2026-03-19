'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { RealIcon, RealIconName } from '@/components/design-system/RealIcon'
import { GradientText } from '@/components/design-system/GlassComponents'

type EndpointDoc = {
  method: 'GET'
  path: string
  livePath: string
  description: string
  params?: string[]
  fallbackResponse: Record<string, unknown>
}

const endpoints: EndpointDoc[] = [
  {
    method: 'GET',
    path: '/api/index/latest',
    livePath: '/api/index/latest',
    description: 'Get the latest GTIXT index snapshot with all constituents',
    fallbackResponse: {
      success: false,
      error: 'Live example unavailable',
    },
  },
  {
    method: 'GET',
    path: '/api/firms',
    livePath: '/api/firms?limit=5&offset=0&sort=score',
    description: 'List all scored firms with optional pagination and sort',
    params: ['limit', 'offset', 'sort'],
    fallbackResponse: {
      success: true,
      count: 0,
      total: 0,
      firms: [],
    },
  },
  {
    method: 'GET',
    path: '/api/firms/:slug',
    livePath: '/api/firms/ftmo',
    description: 'Get detailed data for a specific firm by slug',
    fallbackResponse: {
      success: false,
      error: 'Firm sample not available',
    },
  },
  {
    method: 'GET',
    path: '/api/rankings',
    livePath: '/api/rankings?limit=5&offset=0',
    description: 'Get ranked firms with filters and pagination',
    params: ['limit', 'offset', 'q', 'jurisdiction', 'risk'],
    fallbackResponse: {
      success: true,
      count: 0,
      total: 0,
      data: [],
    },
  },
  {
    method: 'GET',
    path: '/api/research',
    livePath: '/api/research',
    description: 'Get research feed generated from institutional documentation',
    fallbackResponse: {
      success: true,
      count: 0,
      data: [],
    },
  },
  {
    method: 'GET',
    path: '/api/data/exports/:dataset',
    livePath: '/api/data/exports/rankings-feed?format=json',
    description: 'Download public GTIXT export packages in JSON or CSV format',
    params: ['format'],
    fallbackResponse: {
      success: false,
      error: 'Export example unavailable',
    },
  },
]

const features = [
  {
    icon: 'analytics' as RealIconName,
    title: 'Live Example Payloads',
    description: 'Responses below are fetched in real time from production endpoints',
  },
  {
    icon: 'shield' as RealIconName,
    title: 'Public Endpoints',
    description: 'Core public APIs are accessible without authentication',
  },
  {
    icon: 'api' as RealIconName,
    title: 'JSON Contracts',
    description: 'Consistent response envelopes for reliable integrations',
  },
  {
    icon: 'methodology' as RealIconName,
    title: 'Operational Transparency',
    description: 'Contracts reflect the deployed institutional data model',
  },
]

export default function APIDocsPage() {
  const [liveExamples, setLiveExamples] = useState<Record<string, unknown>>({})
  const [resolvedPaths, setResolvedPaths] = useState<Record<string, string>>(
    Object.fromEntries(endpoints.map((endpoint) => [endpoint.path, endpoint.livePath]))
  )
  const [loadingExamples, setLoadingExamples] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null)
  const [baseUrl, setBaseUrl] = useState(process.env.NEXT_PUBLIC_SITE_URL || 'https://gtixt.com')

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location?.origin) {
      setBaseUrl(window.location.origin)
    }
  }, [])

  const loadExamples = useCallback(async () => {
    setLoadingExamples(true)
    setLoadError(null)

    try {
      const rankingResponse = await fetch('/api/rankings?limit=1&offset=0', { cache: 'no-store' })
      let dynamicFirmPath = '/api/firms/ftmo'

      try {
        if (rankingResponse.ok) {
          const rankingPayload = await rankingResponse.json()
          const topSlug = rankingPayload?.data?.[0]?.slug
          if (typeof topSlug === 'string' && topSlug.length > 0) {
            dynamicFirmPath = `/api/firms/${topSlug}`
          }
        }
      } catch {
        dynamicFirmPath = '/api/firms/ftmo'
      }

      const endpointPaths = Object.fromEntries(
        endpoints.map((endpoint) => [
          endpoint.path,
          endpoint.path === '/api/firms/:slug' ? dynamicFirmPath : endpoint.livePath,
        ])
      )

      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          const livePath = endpointPaths[endpoint.path]
          try {
            const response = await fetch(livePath, { cache: 'no-store' })
            if (!response.ok) {
              return [endpoint.path, { success: false, error: `HTTP ${response.status}` }] as const
            }
            const payload = await response.json()
            return [endpoint.path, payload] as const
          } catch (error) {
            return [
              endpoint.path,
              { success: false, error: error instanceof Error ? error.message : 'Fetch failed' },
            ] as const
          }
        })
      )

      setLiveExamples(Object.fromEntries(results))
      setResolvedPaths(endpointPaths)
      setLastRefreshAt(Date.now())
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load API examples')
    } finally {
      setLoadingExamples(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    const guardedLoad = async () => {
      if (!active) return
      await loadExamples()
    }

    guardedLoad()
    return () => {
      active = false
    }
  }, [loadExamples])

  const examples = useMemo(() => {
    const merged: Record<string, unknown> = {}
    for (const endpoint of endpoints) {
      merged[endpoint.path] = liveExamples[endpoint.path] ?? endpoint.fallbackResponse
    }
    return merged
  }, [liveExamples])

  return (
    <div className="min-h-screen gtixt-bg-premium">
      <div className="pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inst-client-section-head text-center"
        >
          <div className="inline-block p-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-4 backdrop-blur-sm">
            <RealIcon name="api" size={34} />
          </div>
          <p className="inst-client-kicker">Developer Integration</p>
          <h1 className="inst-client-title">
            <GradientText variant="h1">API Documentation</GradientText>
          </h1>
          <p className="inst-client-subtitle max-w-3xl mx-auto">
            Access GTIXT data programmatically with live contract examples generated from active endpoints and public export routes.
          </p>
          {loadError && <p className="text-red-300 text-sm mt-4">Live examples unavailable: {loadError}</p>}
        </motion.div>

        <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/45 p-5 md:p-6">
        <div className="inst-client-section-head !mb-5">
          <p className="inst-client-kicker">Capabilities</p>
          <h2 className="inst-client-title">Platform Features</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="rounded-xl bg-slate-900/40 border border-cyan-500/25 p-6 text-center backdrop-blur-md"
            >
              <div className="inline-block p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 mb-4">
                <RealIcon name={feature.icon} size={24} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-slate-900/40 border border-cyan-500/25 p-6 mb-12 backdrop-blur-md"
        >
          <div className="inst-client-section-head !mb-4">
            <p className="inst-client-kicker">Connection</p>
            <h2 className="inst-client-title">Base URL & Live Refresh</h2>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm text-slate-400 mb-2">Base URL</div>
              <code className="text-cyan-300 text-lg font-mono">{baseUrl}</code>
            </div>
            <button
              type="button"
              onClick={() => {
                void loadExamples()
              }}
              disabled={loadingExamples}
              className="inline-flex items-center px-5 py-2 rounded-lg border border-cyan-400/40 text-cyan-200 hover:text-white hover:border-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loadingExamples ? 'Refreshing...' : 'Refresh examples'}
            </button>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {loadingExamples
              ? 'Refreshing live examples...'
              : lastRefreshAt
                ? `Live examples synchronized at ${new Date(lastRefreshAt).toLocaleTimeString()}`
                : 'Live examples synchronized from active routes'}
          </div>
        </motion.section>

        <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/45 p-5 md:p-6">
        <div className="inst-client-section-head !mb-5">
          <p className="inst-client-kicker">Contracts</p>
          <h2 className="inst-client-title">Endpoint Specifications</h2>
        </div>
        <div className="space-y-8">
          {endpoints.map((endpoint, index) => (
            <motion.div
              key={endpoint.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.08 }}
              className="rounded-xl bg-slate-900/40 border border-cyan-500/25 p-8 backdrop-blur-md"
            >
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <span className="px-3 py-1 rounded bg-success/20 text-success text-xs font-bold">{endpoint.method}</span>
                <code className="text-cyan-300 font-mono text-lg">{endpoint.path}</code>
              </div>

              <p className="text-slate-300 mb-6">{endpoint.description}</p>

              {endpoint.params && (
                <div className="mb-6">
                  <div className="text-sm font-semibold text-white mb-3">Query Parameters</div>
                  <div className="flex flex-wrap gap-2">
                    {endpoint.params.map((param) => (
                      <code
                        key={param}
                        className="px-3 py-1 rounded bg-slate-950/80 border border-cyan-500/20 text-cyan-300 text-sm font-mono"
                      >
                        {param}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm font-semibold text-white mb-3">Live Example Response</div>
                <div className="rounded-lg bg-slate-950/80 border border-cyan-500/20 p-4 overflow-x-auto">
                  <pre className="text-slate-200 text-sm font-mono">
                    {JSON.stringify(examples[endpoint.path], null, 2)}
                  </pre>
                </div>
              </div>

              <a
                href={resolvedPaths[endpoint.path] ?? endpoint.livePath}
                target="_blank"
                rel="noreferrer"
                className="inline-flex mt-6 px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/30"
              >
                Open Endpoint
              </a>
            </motion.div>
          ))}
        </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-16 rounded-xl bg-slate-900/40 border border-cyan-500/25 p-8 backdrop-blur-md"
        >
          <div className="inst-client-section-head !mb-4">
            <p className="inst-client-kicker">Ops Guidance</p>
            <h2 className="inst-client-title">Rate Limits & Best Practices</h2>
          </div>
          <div className="space-y-4 text-slate-300">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
              <div>
                <strong className="text-white">Public contracts:</strong> core benchmark, research, and export endpoints are available without authentication.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
              <div>
                <strong className="text-white">Anonymous rate limits:</strong> public access is budgeted for roughly 100 requests per hour; higher-volume usage should move to API-key tiers.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
              <div>
                <strong className="text-white">API-key tiers:</strong> managed integrations can scale toward 10k requests per hour with cache-aware polling.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
              <div>
                <strong className="text-white">Cache carefully:</strong> favor short cache windows for ranking-sensitive dashboards.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
              <div>
                <strong className="text-white">Use pagination:</strong> large feeds should request bounded slices (`limit`, `offset`).
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
              <div>
                <strong className="text-white">Prefer exports for bulk pulls:</strong> use the dataset exports layer when you need attachment-ready CSV or complete snapshot packages.
              </div>
            </div>
          </div>
        </motion.section>
      </div>
      </div>
    </div>
  )
}
