'use client'

import { motion } from 'framer-motion'
import { Shield, AlertTriangle, TrendingUp } from 'lucide-react'

export default function SectorRisk() {
  const riskMetrics = [
    { label: 'Low Risk', value: 67, color: 'success' },
    { label: 'Medium Risk', value: 28, color: 'warning' },
    { label: 'High Risk', value: 5, color: 'danger' },
  ]

  return (
    <section className="py-20 px-6 bg-dark-950">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Sector Risk Analysis
          </h2>
          <p className="text-dark-300 text-lg max-w-2xl mx-auto">
            Real-time risk distribution across the global prop firm industry
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Risk Distribution Chart */}
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-dark-900/50 border border-dark-700 p-8">
              <h3 className="text-xl font-semibold text-white mb-6">Risk Distribution</h3>
              
              <div className="space-y-4">
                {riskMetrics.map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-300">{metric.label}</span>
                      <span className="text-white font-semibold">{metric.value}%</span>
                    </div>
                    <div className="w-full h-3 bg-dark-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${metric.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className={`h-full rounded-full ${
                          metric.color === 'success' ? 'bg-success' :
                          metric.color === 'warning' ? 'bg-warning' :
                          'bg-danger'
                        }`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-lg bg-primary-500/10 border border-primary-500/20">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium mb-1">Sector Stability: Strong</p>
                    <p className="text-dark-300 text-sm">
                      67% of firms rated LOW RISK — highest percentage in 12 months
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl bg-dark-900/50 border border-dark-700 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <h4 className="text-white font-semibold">Positive Trends</h4>
              </div>
              <ul className="space-y-2 text-dark-300 text-sm">
                <li>• Payout reliability +4.2%</li>
                <li>• Rule stability improving</li>
                <li>• Regulatory compliance up</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-xl bg-dark-900/50 border border-dark-700 p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <h4 className="text-white font-semibold">Watch List</h4>
              </div>
              <ul className="space-y-2 text-dark-300 text-sm">
                <li>• 3 firms under review</li>
                <li>• 2 rule change alerts</li>
                <li>• 1 payout delay report</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
