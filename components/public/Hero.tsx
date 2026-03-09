'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

function stableUnit(index: number, seed: number) {
  const value = Math.sin((index + 1) * seed) * 10000
  return value - Math.floor(value)
}

const particles = Array.from({ length: 20 }, (_, index) => ({
  left: `${(stableUnit(index, 12.9898) * 100).toFixed(4)}%`,
  top: `${(stableUnit(index, 78.233) * 100).toFixed(4)}%`,
  duration: Number((3 + stableUnit(index, 45.164) * 2).toFixed(3)),
  delay: Number((stableUnit(index, 93.517) * 2).toFixed(3)),
}))

export default function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-gradient-dark">
        <div className="absolute inset-0 bg-gradient-glow" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo/Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-8">
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse-glow" />
            <span className="text-primary-400 text-sm font-medium">Institutional Grade Intelligence</span>
          </div>

          {/* Main title */}
          <h1 className="text-7xl md:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600">
            GTIXT
          </h1>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            The Global Prop Trading Index
          </h2>

          <p className="text-xl md:text-2xl text-dark-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Institutional benchmark for prop firm transparency,
            <br />
            payout reliability and risk integrity.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/index">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-turquoise text-white font-semibold rounded-lg shadow-lg hover:shadow-primary-500/50 transition-all duration-300"
              >
                Explore the Index
              </motion.button>
            </Link>
            <Link href="/rankings">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-dark-800 text-white font-semibold rounded-lg border border-primary-500/30 hover:border-primary-500 transition-all duration-300"
              >
                View Rankings
              </motion.button>
            </Link>
            <Link href="/methodology">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-transparent text-primary-400 font-semibold rounded-lg border border-primary-500/30 hover:bg-primary-500/10 transition-all duration-300"
              >
                Read Methodology
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Floating data particles effect */}
        {mounted && (
          <div className="absolute inset-0 pointer-events-none">
            {particles.map((particle, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-primary-500/30 rounded-full"
                style={{
                  left: particle.left,
                  top: particle.top,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: particle.duration,
                  repeat: Infinity,
                  delay: particle.delay,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-primary-500/30 rounded-full flex justify-center pt-2">
          <div className="w-1 h-3 bg-primary-500 rounded-full" />
        </div>
      </motion.div>
    </section>
  )
}
