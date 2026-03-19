'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { RealIcon } from '@/components/design-system/RealIcon'
import { GradientText } from '@/components/design-system/GlassComponents'

type ResearchArticle = {
  id: string
  title: string
  excerpt: string
  category: string
  date: string
  readTime: string
  author: string
  sourceFile: string
}

export default function ResearchPage() {
  const [articles, setArticles] = useState<ResearchArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let active = true

    const loadResearch = async () => {
      try {
        setLoading(true)
        setLoadError(null)

        const response = await fetch('/api/research', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error(`Research API returned ${response.status}`)
        }

        const payload = await response.json()
        const rows = Array.isArray(payload?.data) ? payload.data : []

        if (active) {
          setArticles(rows)
        }
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load research documents')
          setArticles([])
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadResearch()
    return () => {
      active = false
    }
  }, [])

  const categories = useMemo(() => {
    const dynamic = Array.from(new Set(articles.map((article) => article.category))).sort((a, b) => a.localeCompare(b))
    return ['All', ...dynamic]
  }, [articles])

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen gtixt-bg-premium">
      <div className="pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inst-client-section-head"
        >
          <p className="inst-client-kicker">Knowledge Base</p>
          <h1 className="inst-client-title">
            <GradientText variant="h1">Research & Insights</GradientText>
          </h1>
          <p className="inst-client-subtitle">
            Evidence-based analysis, industry reports, and methodology updates from the GTIXT research team.
          </p>
          {loadError && (
            <p className="text-red-300 text-sm mt-4">Live feed unavailable: {loadError}</p>
          )}
        </motion.div>

        {/* Search & Filters */}
        <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/45 p-4 md:p-5 space-y-6">
          <div className="inst-client-section-head !mb-0">
            <p className="inst-client-kicker">Screening</p>
            <h2 className="inst-client-title">Filter Publications</h2>
          </div>
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="absolute left-4 top-1/2 -translate-y-1/2"><RealIcon name="research" size={18} /></div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search research documents..."
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-900/40 border border-cyan-500/25 text-white 
                       focus:outline-none focus:border-cyan-500 transition-colors backdrop-blur-md"
            />
          </motion.div>

          {/* Category Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-3"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-primary-500 text-white'
                    : 'bg-slate-900/40 text-slate-300 hover:bg-slate-800/60 border border-cyan-500/20'
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>
        </section>

        {/* Articles Grid */}
        {loading ? (
          <div className="text-slate-300 mb-10">Loading research feed...</div>
        ) : (
        <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/45 p-4 md:p-5">
        <div className="inst-client-section-head !mb-4">
          <p className="inst-client-kicker">Output</p>
          <h2 className="inst-client-title">Research Library</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article, index) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="rounded-xl bg-slate-900/40 border border-cyan-500/25 p-6 hover:border-cyan-400/50 
                       transition-all cursor-pointer card-glow"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-medium">
                  {article.category}
                </span>
                <span className="text-slate-500 text-xs">{article.readTime}</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 hover:text-cyan-300 transition-colors">
                {article.title}
              </h3>
              <p className="text-slate-300 text-sm mb-6 line-clamp-3">
                {article.excerpt}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-cyan-500/20">
                <div className="text-slate-400 text-xs">
                  <div className="flex items-center gap-1 mb-1">
                    <RealIcon name="methodology" size={12} />
                    {article.date}
                  </div>
                  <div>By {article.author}</div>
                </div>
                <span className="text-cyan-300 text-xs font-medium">{article.sourceFile}</span>
              </div>
            </motion.article>
          ))}
        </div>
        </section>
        )}

        {/* No Results */}
        {filteredArticles.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-slate-800/60 border border-cyan-500/20 flex items-center justify-center"><RealIcon name="research" size={32} /></div>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">No articles found</h3>
            <p className="text-slate-500">Try adjusting your search or filters</p>
          </motion.div>
        )}
      </div>
      </div>
    </div>
  )
}
