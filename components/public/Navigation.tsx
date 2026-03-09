'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const navigation = [
  { name: 'Index', href: '/index' },
  { name: 'Rankings', href: '/rankings' },
  { name: 'Firms', href: '/firms' },
  { name: 'Industry Galaxy', href: '/industry-map' },
  { name: 'Analytics', href: '/analytics' },
  { name: 'Data', href: '/data' },
  { name: 'Research', href: '/research' },
  { name: 'API', href: '/api-docs' },
  { name: 'Methodology', href: '/methodology' },
  { name: 'Verify', href: '/verify' },
]

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-950/80 backdrop-blur-md border-b border-dark-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-turquoise flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <span className="text-white font-bold text-xl group-hover:text-primary-400 transition-colors">
              GTIXT
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-800 rounded-lg transition-all duration-200 font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/admin">
              <button className="px-4 py-2 text-dark-300 hover:text-white transition-colors font-medium">
                Sign In
              </button>
            </Link>
            <Link href="/index">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-gradient-turquoise text-white font-semibold rounded-lg shadow-lg hover:shadow-primary-500/50 transition-all"
              >
                Explore Index
              </motion.button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-dark-300 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-dark-800 bg-dark-950"
          >
            <div className="px-6 py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-800 rounded-lg transition-all"
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 space-y-2">
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full px-4 py-3 text-dark-300 hover:text-white hover:bg-dark-800 rounded-lg transition-all text-left">
                    Sign In
                  </button>
                </Link>
                <Link href="/index" onClick={() => setMobileMenuOpen(false)}>
                  <button className="w-full px-6 py-3 bg-gradient-turquoise text-white font-semibold rounded-lg">
                    Explore Index
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
