'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RealIcon } from '@/components/design-system/RealIcon'
import { PublicNavigation } from '@/components/design-system/UnifiedNavigation'
import { GradientText } from '@/components/design-system/GlassComponents'

const articles = [
  {
    id: 1,
    title: '2026 Prop Trading Industry Report',
    excerpt: 'Comprehensive analysis of 245 firms across 15 jurisdictions, revealing trends in payout reliability and regulatory compliance.',
    category: 'Industry Report',
    date: '2026-02-20',
    readTime: '12 min',
    author: 'GTIXT Research Team'
  },
  {
    id: 2,
    title: 'Which Firms Have Best Payout Reliability?',
    excerpt: 'Data-driven ranking of firms with highest verified payout success rates, based on 1,200+ trader testimonials.',
    category: 'Analysis',
    date: '2026-02-15',
    readTime: '8 min',
    author: 'Sarah Chen'
  },
  {
    id: 3,
    title: 'Q1 2026 Risk Trends',
    excerpt: 'Risk index analysis showing 4.2% improvement in sector stability, with 67% of firms now in low-risk category.',
    category: 'Quarterly Report',
    date: '2026-02-10',
    readTime: '6 min',
    author: 'Michael Torres'
  },
  {
    id: 4,
    title: 'Regulatory Compliance Deep Dive',
    excerpt: 'How FCA, ASIC, and SEC regulations impact firm scores, with case studies from UK and Australian markets.',
    category: 'Regulatory',
    date: '2026-02-05',
    readTime: '10 min',
    author: 'GTIXT Legal Team'
  },
  {
    id: 5,
    title: 'Sentiment Analysis Methodology Update',
    excerpt: 'New NLP models for Reddit and YouTube review analysis, improving sentiment accuracy by 23%.',
    category: 'Methodology',
    date: '2026-01-28',
    readTime: '7 min',
    author: 'David Kumar'
  },
  {
    id: 6,
    title: 'Top 10 Firms January 2026',
    excerpt: 'Monthly ranking update with detailed breakdowns of score changes and new entrants to the index.',
    category: 'Rankings',
    date: '2026-01-25',
    readTime: '5 min',
    author: 'GTIXT Research Team'
  },
]

const categories = ['All', 'Industry Report', 'Analysis', 'Quarterly Report', 'Regulatory', 'Methodology', 'Rankings']

export default function ResearchPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <PublicNavigation />
      <div className="pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            <GradientText variant="h1">Research & Insights</GradientText>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl">
            Evidence-based analysis, industry reports, and methodology updates from the GTIXT research team.
          </p>
        </motion.div>

        {/* Search & Filters */}
        <div className="mb-12 space-y-6">
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
              placeholder="Search articles..."
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
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                <button className="text-cyan-300 hover:text-cyan-200 text-sm font-medium">
                  Read Article
                </button>
              </div>
            </motion.article>
          ))}
        </div>

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
