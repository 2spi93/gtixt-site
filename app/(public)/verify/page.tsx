'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RealIcon } from '@/components/design-system/RealIcon'
import { PublicNavigation } from '@/components/design-system/UnifiedNavigation'
import { GradientText } from '@/components/design-system/GlassComponents'

const mockSnapshots = [
  { id: 1, date: '2026-02-26', hash: 'a3f5b9c2...', firms: 245, status: 'verified' },
  { id: 2, date: '2026-02-25', hash: 'c8e1d4a7...', firms: 244, status: 'verified' },
  { id: 3, date: '2026-02-24', hash: 'b2f8e3c9...', firms: 243, status: 'verified' },
]

export default function VerifyPage() {
  const [hash, setHash] = useState('')
  const [verificationResult, setVerificationResult] = useState<'success' | 'error' | null>(null)

  const handleVerify = () => {
    // Mock verification
    if (hash.length > 8) {
      setVerificationResult('success')
    } else {
      setVerificationResult('error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <PublicNavigation />
      <div className="pt-24 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <div className="inline-block p-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-6 backdrop-blur-sm">
            <RealIcon name="shield" size={34} />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            <GradientText variant="h1">Verify Snapshot Integrity</GradientText>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Every GTIXT snapshot is cryptographically signed with SHA-256. 
            Verify any dataset's authenticity below.
          </p>
        </motion.div>

        {/* Verification Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl bg-slate-900/40 border border-cyan-500/25 p-8 mb-12 backdrop-blur-md"
        >
          <h2 className="text-2xl font-semibold text-white mb-6">Verify Hash</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                SHA-256 Hash
              </label>
              <input
                type="text"
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                placeholder="Enter snapshot hash (e.g., a3f5b9c2e1d4f8a9...)"
                className="w-full px-4 py-3 rounded-lg bg-slate-950/80 border border-cyan-500/25 text-white 
                         focus:outline-none focus:border-cyan-500 transition-colors font-mono text-sm"
              />
            </div>
            <button
              onClick={handleVerify}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold 
                       hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center justify-center gap-2"
            >
              <RealIcon name="analytics" size={16} />
              Verify Hash
            </button>
          </div>

          {/* Verification Result */}
          {verificationResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mt-6 p-6 rounded-lg border ${
                verificationResult === 'success'
                  ? 'bg-success/10 border-success/30'
                  : 'bg-danger/10 border-danger/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {verificationResult === 'success' ? (
                  <>
                    <RealIcon name="shield" size={20} />
                    <div className="text-lg font-semibold text-success">Verified Successfully</div>
                  </>
                ) : (
                  <>
                    <RealIcon name="review" size={20} />
                    <div className="text-lg font-semibold text-danger">Verification Failed</div>
                  </>
                )}
              </div>
              <div className="text-sm text-slate-300">
                {verificationResult === 'success'
                  ? 'This snapshot is authentic and has not been tampered with.'
                  : 'Hash not found in our records. Please check the hash and try again.'}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Recent Snapshots */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl bg-slate-900/40 border border-cyan-500/25 p-8 backdrop-blur-md"
        >
          <h2 className="text-2xl font-semibold text-white mb-6">Recent Snapshots</h2>
          <div className="space-y-4">
            {mockSnapshots.map((snapshot, index) => (
              <motion.div
                key={snapshot.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-950/80 border border-cyan-500/20 
                         hover:border-cyan-500/50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-success/10 border border-green-500/30">
                    <RealIcon name="shield" size={16} />
                  </div>
                  <div>
                    <div className="text-white font-medium mb-1">{snapshot.date}</div>
                    <div className="text-slate-400 text-sm font-mono">{snapshot.hash}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-slate-400 text-xs mb-1">Firms</div>
                    <div className="text-white font-semibold">{snapshot.firms}</div>
                  </div>
                  <button className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-cyan-500/20">
                    <RealIcon name="api" size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  )
}
