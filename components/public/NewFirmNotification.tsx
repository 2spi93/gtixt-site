'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'

/**
 * 🌟 New Firm Notification Component
 * 
 * Shows a toast notification when autonomous discovery agent
 * detects new prop firms and adds them to the galaxy
 * 
 * Polls /api/galaxy/discoveries every 30 seconds
 * Auto-dismisses after 10 seconds
 * 
 * Visual:
 * ┌────────────────────────────────────┐
 * │ ⭐ NEW FIRMS DETECTED              │
 * │                                    │
 * │ 3 new prop firms added to galaxy:  │
 * │ • FundedPro (UK) - Score: 85      │
 * │ • TradeMaster (UAE) - Score: 78   │
 * │ • ProCapital (US) - Score: 82     │
 * │                                    │
 * │ [View in Galaxy →]                 │
 * └────────────────────────────────────┘
 */

interface NewFirm {
  firm_id: string
  name: string
  score: number
  jurisdiction?: string
  detected_at: string
  cluster?: string  // NEW: forex, futures, crypto, quant
  model_type?: string
  platform?: string
  profit_split?: string
}

interface DiscoveryNotification {
  hasNewFirms: boolean
  count: number
  timestamp?: string
  firms: NewFirm[]
}

export function NewFirmNotification() {
  const [notification, setNotification] = useState<DiscoveryNotification | null>(null)
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const handleDismiss = useCallback(async () => {
    setShow(false)
    setDismissed(true)

    // Mark as acknowledged on server
    try {
      await fetch('/api/galaxy/discoveries', { method: 'POST', cache: 'no-store' })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
    }
  }, [])

  useEffect(() => {
    let mounted = true
    let autoDismissTimer: ReturnType<typeof setTimeout> | null = null
    const controller = new AbortController()

    // Poll for new discoveries every 30 seconds
    const pollDiscoveries = async () => {
      try {
        const response = await fetch('/api/galaxy/discoveries', {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!response.ok) return
        const data: DiscoveryNotification = await response.json()
        
        if (!mounted) return

        if (data.hasNewFirms && data.count > 0 && !dismissed) {
          setNotification(data)
          setShow(true)
          
          // Auto-dismiss after 30 seconds (increased for manual validation)
          if (autoDismissTimer) clearTimeout(autoDismissTimer)
          autoDismissTimer = setTimeout(() => {
            void handleDismiss()
          }, 30000)
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
      }
    }

    // Poll immediately and then every 30 seconds
    pollDiscoveries()
    const interval = setInterval(pollDiscoveries, 30000)

    return () => {
      mounted = false
      controller.abort()
      if (autoDismissTimer) clearTimeout(autoDismissTimer)
      clearInterval(interval)
    }
  }, [dismissed, handleDismiss])

  if (!notification || !show) return null

  // Calculate cluster statistics
  const clusterStats = notification.firms.reduce((acc: Record<string, number>, firm) => {
    const cluster = firm.cluster || 'unknown'
    acc[cluster] = (acc[cluster] || 0) + 1
    return acc
  }, {})

  const getClusterColor = (cluster?: string) => {
    switch (cluster) {
      case 'forex': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
      case 'futures': return 'bg-orange-500/20 text-orange-300 border-orange-500/40'
      case 'crypto': return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
      case 'quant': return 'bg-green-500/20 text-green-300 border-green-500/40'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/40'
    }
  }

  const getClusterIcon = (cluster?: string) => {
    switch (cluster) {
      case 'forex': return '/assets/generated-icons/cluster-forex.png'
      case 'futures': return '/assets/generated-icons/cluster-futures.png'
      case 'crypto': return '/assets/generated-icons/cluster-crypto.png'
      case 'quant': return '/assets/generated-icons/cluster-quant.png'
      default: return '/assets/generated-icons/cluster-default.png'
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed bottom-6 right-6 z-50 max-w-md"
      >
        <div className="rounded-2xl bg-gradient-to-br from-[#0B1C2B] to-[#041420] border border-primary-500/30 shadow-[0_0_40px_rgba(0,212,198,0.25)] backdrop-blur-xl p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center animate-pulse">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Image
                    src="/assets/generated-icons/cluster-default.png"
                    alt="new firms"
                    width={16}
                    height={16}
                    className="w-4 h-4 object-contain"
                  />
                  NEW FIRMS DETECTED
                </h3>
                <p className="text-dark-300 text-xs">
                  Autonomous discovery • {notification.timestamp ? new Date(notification.timestamp).toLocaleDateString() : 'today'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="text-dark-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-4">
            <p className="text-dark-200 text-sm mb-3">
              <span className="text-primary-400 font-semibold">{notification.count}</span> new prop firm
              {notification.count > 1 ? 's' : ''} added to galaxy
            </p>
            
            {/* Cluster Statistics */}
            {Object.keys(clusterStats).length > 1 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.entries(clusterStats).map(([cluster, count]) => (
                  <div 
                    key={cluster}
                    className={`px-2 py-1 rounded-full text-xs font-semibold border ${getClusterColor(cluster)}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Image
                        src={getClusterIcon(cluster)}
                        alt={cluster}
                        width={14}
                        height={14}
                        className="w-3.5 h-3.5 object-contain"
                      />
                      {cluster}: {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {notification.firms.slice(0, 5).map((firm) => (
                <motion.div
                  key={firm.firm_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-dark-950/50 border border-dark-700/50 hover:border-primary-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative">
                      <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                      <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary-500 animate-ping opacity-75" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-white text-sm font-medium">{firm.name}</div>
                        {firm.cluster && (
                          <span className="inline-flex items-center">
                            <Image
                              src={getClusterIcon(firm.cluster)}
                              alt={firm.cluster}
                              width={14}
                              height={14}
                              className="w-3.5 h-3.5 object-contain"
                            />
                          </span>
                        )}
                      </div>
                      <div className="text-dark-400 text-xs flex items-center gap-2">
                        <span>{firm.jurisdiction || 'Unknown'}</span>
                        <span>•</span>
                        <span>Score: {Math.round(firm.score)}</span>
                        {firm.platform && (
                          <>
                            <span>•</span>
                            <span>{firm.platform}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-primary-400 text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-500/10 border border-primary-500/30">
                      NEW
                    </div>
                    {firm.profit_split && (
                      <div className="text-green-400 text-[10px]">
                        {Math.round(parseFloat(firm.profit_split) * 100)}% split
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            
            {notification.count > 5 && (
              <p className="text-dark-400 text-xs mt-2">
                +{notification.count - 5} more firms...
              </p>
            )}
          </div>

          {/* Action */}
          <a
            href="/industry-map"
            className="block w-full text-center px-4 py-2.5 rounded-xl bg-gradient-turquoise text-white font-semibold hover:scale-105 transition-transform"
          >
            View in Galaxy →
          </a>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
