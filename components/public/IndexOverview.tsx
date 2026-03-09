'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Shield, BarChart3, Users } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  trend?: string
  icon: React.ReactNode
  color?: string
}

function MetricCard({ title, value, trend, icon, color = 'primary' }: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      className="relative overflow-hidden rounded-xl bg-dark-900/50 border border-dark-700 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary-500/50 hover:shadow-lg hover:shadow-primary-500/20"
    >
      {/* Gradient overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-turquoise opacity-5 blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
            {icon}
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-success text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-3xl font-bold text-white">{value}</p>
          <p className="text-dark-400 text-sm">{title}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function IndexOverview() {
  const metrics = [
    {
      title: 'GTIXT Index Score',
      value: '72.9',
      trend: '+1.4 (30d)',
      icon: <BarChart3 className="w-6 h-6 text-primary-400" />,
    },
    {
      title: 'Risk Index',
      value: '24.8',
      trend: '-2.1 (30d)',
      icon: <Shield className="w-6 h-6 text-success" />,
    },
    {
      title: 'Firms Indexed',
      value: '245',
      trend: '+4 (7d)',
      icon: <Users className="w-6 h-6 text-primary-400" />,
    },
    {
      title: 'Survival Rate',
      value: '67.1%',
      icon: <TrendingUp className="w-6 h-6 text-primary-400" />,
    },
  ]

  return (
    <section className="py-20 px-6 bg-dark-950 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Index Overview
          </h2>
          <p className="text-dark-300 text-lg max-w-2xl mx-auto">
            Real-time metrics tracking the global prop firm industry
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <MetricCard {...metric} />
            </motion.div>
          ))}
        </div>

        {/* Live update indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 flex items-center justify-center gap-2 text-dark-400 text-sm"
        >
          <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
          <span>Live data • Updated 2 minutes ago</span>
        </motion.div>
      </div>
    </section>
  )
}
