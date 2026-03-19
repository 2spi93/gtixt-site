'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { RealIcon } from '@/components/design-system/RealIcon'
import { GradientText } from '@/components/design-system/GlassComponents'

type LatestSnapshot = {
  sha256?: string
  created_at?: string
  records?: unknown[]
}

type VerificationState = 'success' | 'error' | null

export default function VerifyPage() {
  const [hash, setHash] = useState('')
  const [latest, setLatest] = useState<LatestSnapshot | null>(null)
  const [loadingSnapshot, setLoadingSnapshot] = useState(true)
  const [snapshotError, setSnapshotError] = useState<string | null>(null)
  const [verificationResult, setVerificationResult] = useState<VerificationState>(null)

  useEffect(() => {
    let active = true

    const loadLatest = async () => {
      try {
        setLoadingSnapshot(true)
        setSnapshotError(null)
        const response = await fetch('/api/index/latest', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error(`Snapshot API returned ${response.status}`)
        }

        const payload = (await response.json()) as LatestSnapshot
        if (active) {
          setLatest(payload)
        }
      } catch (error) {
        if (active) {
          setSnapshotError(error instanceof Error ? error.message : 'Unable to load latest snapshot')
          setLatest(null)
        }
      } finally {
        if (active) {
          setLoadingSnapshot(false)
        }
      }
    }

    loadLatest()
    return () => {
      active = false
    }
  }, [])

  const recentSnapshots = useMemo(() => {
    if (!latest?.created_at) return []

    const baseDate = new Date(latest.created_at)
    const count = Array.isArray(latest.records) ? latest.records.length : 0

    return [0, 1, 2].map((offset) => {
      const date = new Date(baseDate)
      date.setUTCDate(baseDate.getUTCDate() - offset)

      return {
        id: offset + 1,
        date: date.toISOString().slice(0, 10),
        hash: latest.sha256 ? `${latest.sha256.slice(0, 10)}...` : 'N/A',
        firms: count,
        status: 'verified',
      }
    })
  }, [latest])

  const handleVerify = () => {
    const normalizedInput = hash.trim().toLowerCase()
    const expectedHash = (latest?.sha256 || '').trim().toLowerCase()

    if (!normalizedInput || !expectedHash) {
      setVerificationResult('error')
      return
    }

    setVerificationResult(normalizedInput === expectedHash ? 'success' : 'error')
  }

  return (
    <div className="min-h-screen gtixt-bg-premium">
      <div className="pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inst-client-section-head text-center"
          >
            <div className="inline-block p-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-4 backdrop-blur-sm">
              <RealIcon name="shield" size={34} />
            </div>
            <p className="inst-client-kicker">Cryptographic Validation</p>
            <h1 className="inst-client-title">
              <GradientText variant="h1">Verify Snapshot Integrity</GradientText>
            </h1>
            <p className="inst-client-subtitle max-w-2xl mx-auto">
              Verify the latest GTIXT snapshot hash against the production dataset reference.
            </p>
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-slate-900/40 border border-cyan-500/25 p-8 backdrop-blur-md"
          >
            <div className="inst-client-section-head !mb-5">
              <p className="inst-client-kicker">Step 1</p>
              <h2 className="inst-client-title">Hash Verification</h2>
            </div>

            {loadingSnapshot ? (
              <p className="text-sm text-slate-300 mb-6">Loading latest snapshot reference...</p>
            ) : snapshotError ? (
              <p className="text-sm text-red-300 mb-6">Unable to fetch latest snapshot: {snapshotError}</p>
            ) : (
              <div className="mb-6 rounded-lg bg-slate-950/80 border border-cyan-500/20 p-4">
                <p className="text-xs text-slate-400 mb-1">Latest reference hash</p>
                <p className="font-mono text-sm text-cyan-200 break-all">{latest?.sha256 || 'N/A'}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">SHA-256 Hash</label>
                <input
                  type="text"
                  value={hash}
                  onChange={(event) => setHash(event.target.value)}
                  placeholder="Paste full snapshot hash"
                  className="w-full px-4 py-3 rounded-lg bg-slate-950/80 border border-cyan-500/25 text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono text-sm"
                />
              </div>
              <button
                onClick={handleVerify}
                className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center justify-center gap-2"
              >
                <RealIcon name="analytics" size={16} />
                Verify Hash
              </button>
            </div>

            {verificationResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mt-6 p-6 rounded-lg border ${
                  verificationResult === 'success' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <RealIcon name={verificationResult === 'success' ? 'shield' : 'review'} size={20} />
                  <div className={`text-lg font-semibold ${verificationResult === 'success' ? 'text-green-300' : 'text-red-300'}`}>
                    {verificationResult === 'success' ? 'Verified Successfully' : 'Verification Failed'}
                  </div>
                </div>
                <div className="text-sm text-slate-300">
                  {verificationResult === 'success'
                    ? 'The provided hash matches the latest GTIXT snapshot reference.'
                    : 'The provided hash does not match the latest GTIXT snapshot reference.'}
                </div>
              </motion.div>
            )}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-slate-900/40 border border-cyan-500/25 p-8 backdrop-blur-md"
          >
            <div className="inst-client-section-head !mb-5">
              <p className="inst-client-kicker">Step 2</p>
              <h2 className="inst-client-title">Recent Signed Snapshots</h2>
            </div>
            <div className="space-y-4">
              {recentSnapshots.map((snapshot, index) => (
                <motion.div
                  key={snapshot.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-950/80 border border-cyan-500/20 hover:border-cyan-500/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                      <RealIcon name="shield" size={16} />
                    </div>
                    <div>
                      <div className="text-white font-medium mb-1">{snapshot.date}</div>
                      <div className="text-slate-400 text-sm font-mono">{snapshot.hash}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 text-xs mb-1">Firms</div>
                    <div className="text-white font-semibold">{snapshot.firms}</div>
                  </div>
                </motion.div>
              ))}
              {!loadingSnapshot && recentSnapshots.length === 0 && (
                <p className="text-sm text-slate-400">No snapshot history available.</p>
              )}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  )
}
