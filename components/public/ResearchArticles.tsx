'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Calendar, ArrowRight, TrendingUp } from 'lucide-react'
import InfoTooltip from '@/components/ui/InfoTooltip'

const articles = [
  {
    title: '2026 Prop Firm Industry Report',
    description: 'Comprehensive analysis of survival rates, payout trends, and regulatory changes across the global prop trading industry.',
    date: 'March 1, 2026',
    category: 'Industry Report',
    slug: '2026-industry-report',
  },
  {
    title: 'Which Prop Firms Have the Best Payout Reliability?',
    description: 'Data-driven analysis revealing the top performers in trader payouts based on verified transaction data.',
    date: 'February 28, 2026',
    category: 'Data Analysis',
    slug: 'best-payout-reliability',
  },
  {
    title: 'Risk Trends: Q1 2026',
    description: 'Quarterly risk assessment showing improving sector stability and reduced volatility across major jurisdictions.',
    date: 'February 15, 2026',
    category: 'Risk Analysis',
    slug: 'q1-2026-risk-trends',
  },
]

export default function ResearchArticles() {
  return (
    <section className="py-20 px-6 bg-dark-950">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Research & Insights
              </h2>
              <InfoTooltip
                content="Editorial and quantitative analysis published from GTIXT monitoring and evidence pipelines."
                example="Use these notes to understand why scores move and what changed operationally."
                label="Research and insights explanation"
              />
            </div>
            <p className="text-dark-300 text-lg">
              Data intelligence from the GTIXT research team
            </p>
          </div>
          <Link href="/research" className="hidden md:block">
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-6 py-3 bg-primary-500/10 text-primary-400 font-medium rounded-lg border border-primary-500/20 hover:bg-primary-500/20 transition-all"
            >
              All Research
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <motion.div
              key={article.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/research/${article.slug}`}>
                <div className="group rounded-xl bg-dark-900/50 border border-dark-700 p-6 hover:border-primary-500/50 hover:bg-dark-900 transition-all duration-300 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 text-xs font-medium border border-primary-500/20">
                      {article.category}
                    </span>
                    <div className="flex items-center gap-1 text-dark-400 text-xs">
                      <Calendar className="w-3 h-3" />
                      <span>{article.date}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-primary-400 transition-colors">
                    {article.title}
                  </h3>

                  <p className="text-dark-300 text-sm mb-4 flex-grow">
                    {article.description}
                  </p>

                  <div className="flex items-center gap-2 text-primary-400 text-sm font-medium group-hover:gap-3 transition-all">
                    Read Article
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 md:hidden">
          <Link href="/research">
            <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-500/10 text-primary-400 font-medium rounded-lg border border-primary-500/20">
              View All Research
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}
