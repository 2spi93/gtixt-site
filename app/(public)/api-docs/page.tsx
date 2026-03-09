'use client'

import { motion } from 'framer-motion'
import { RealIcon, RealIconName } from '@/components/design-system/RealIcon'
import { GradientText } from '@/components/design-system/GlassComponents'

const endpoints = [
  {
    method: 'GET',
    path: '/api/index/latest',
    description: 'Get the latest GTIXT index snapshot with all constituents',
    response: {
      gtixt_score: 72.9,
      risk_index: 24.8,
      firms_count: 100,
      updated_at: '2026-02-26T10:00:00Z'
    }
  },
  {
    method: 'GET',
    path: '/api/firms',
    description: 'List all scored firms with optional filters',
    params: ['jurisdiction', 'risk_level', 'min_score'],
    response: {
      total: 245,
      firms: [
        { slug: 'ftmo', name: 'FTMO', score: 92.3, risk: 'LOW' }
      ]
    }
  },
  {
    method: 'GET',
    path: '/api/firms/:slug',
    description: 'Get detailed data for a specific firm',
    response: {
      slug: 'ftmo',
      name: 'FTMO',
      gtixt_score: 92.3,
      pillars: {
        payout_reliability: 95.2,
        rule_fairness: 88.7
      }
    }
  },
  {
    method: 'GET',
    path: '/api/rankings',
    description: 'Get ranked firms with pagination',
    params: ['page', 'limit', 'sort'],
    response: {
      data: [],
      pagination: { page: 1, total: 245 }
    }
  },
]

const features = [
  {
    icon: 'analytics' as RealIconName,
    title: 'Real-Time Data',
    description: 'Updated daily with the latest scores and evidence'
  },
  {
    icon: 'shield' as RealIconName,
    title: 'No Authentication Required',
    description: 'All endpoints are public and free to use'
  },
  {
    icon: 'api' as RealIconName,
    title: 'JSON Format',
    description: 'Clean, structured responses with consistent schemas'
  },
  {
    icon: 'methodology' as RealIconName,
    title: 'RESTful Design',
    description: 'Standard HTTP methods and status codes'
  },
]

export default function APIDocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <div className="inline-block p-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-6 backdrop-blur-sm">
            <RealIcon name="api" size={34} />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            <GradientText variant="h1">API Documentation</GradientText>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Access GTIXT data programmatically. All endpoints are free, public, and return JSON.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
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

        {/* Base URL */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl bg-slate-900/40 border border-cyan-500/25 p-6 mb-12 backdrop-blur-md"
        >
          <div className="text-sm text-slate-400 mb-2">Base URL</div>
          <code className="text-cyan-300 text-lg font-mono">https://gtixt.com</code>
        </motion.div>

        {/* Endpoints */}
        <div className="space-y-8">
          {endpoints.map((endpoint, index) => (
            <motion.div
              key={endpoint.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="rounded-xl bg-slate-900/40 border border-cyan-500/25 p-8 backdrop-blur-md"
            >
              {/* Method & Path */}
              <div className="flex items-center gap-4 mb-4">
                <span className="px-3 py-1 rounded bg-success/20 text-success text-xs font-bold">
                  {endpoint.method}
                </span>
                <code className="text-cyan-300 font-mono text-lg">{endpoint.path}</code>
              </div>

              {/* Description */}
              <p className="text-slate-300 mb-6">{endpoint.description}</p>

              {/* Parameters (if any) */}
              {endpoint.params && (
                <div className="mb-6">
                  <div className="text-sm font-semibold text-white mb-3">Query Parameters</div>
                  <div className="flex flex-wrap gap-2">
                    {endpoint.params.map((param) => (
                      <code key={param} className="px-3 py-1 rounded bg-slate-950/80 border border-cyan-500/20 text-cyan-300 text-sm font-mono">
                        {param}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Example Response */}
              <div>
                <div className="text-sm font-semibold text-white mb-3">Example Response</div>
                <div className="rounded-lg bg-slate-950/80 border border-cyan-500/20 p-4 overflow-x-auto">
                  <pre className="text-slate-200 text-sm font-mono">
                    {JSON.stringify(endpoint.response, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Try it Button */}
              <button className="mt-6 px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium 
                               hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/30">
                Open in Browser
              </button>
            </motion.div>
          ))}
        </div>

        {/* Rate Limits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-16 rounded-xl bg-slate-900/40 border border-cyan-500/25 p-8 backdrop-blur-md"
        >
          <h2 className="text-2xl font-semibold text-white mb-6">Rate Limits & Best Practices</h2>
          <div className="space-y-4 text-slate-300">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
              <div>
                <strong className="text-white">No rate limits currently:</strong> All endpoints are free and open
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
              <div>
                <strong className="text-white">Cache responses:</strong> Data updates daily at 10:00 UTC
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
              <div>
                <strong className="text-white">Use pagination:</strong> For large datasets, use <code className="text-cyan-300">?limit=50</code>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
