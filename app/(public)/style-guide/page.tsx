'use client'

import { motion } from 'framer-motion'
import { PublicNavigation } from '@/components/design-system/UnifiedNavigation'

export default function StyleGuidePage() {
  const colors = [
    { name: 'Turquoise Primary', value: '#00ACC1', css: 'var(--gtixt-turquoise-primary)' },
    { name: 'Turquoise Deep', value: '#00838F', css: 'var(--gtixt-turquoise-deep)' },
    { name: 'Turquoise Light', value: '#80DEEA', css: 'var(--gtixt-turquoise-light)' },
    { name: 'Gray Light', value: '#F5F7F9', css: 'var(--gtixt-gray-light)' },
    { name: 'Gray Medium', value: '#CFD8DC', css: 'var(--gtixt-gray-medium)' },
    { name: 'Gray Dark', value: '#263238', css: 'var(--gtixt-gray-dark)' },
    { name: 'White', value: '#FFFFFF', css: 'var(--gtixt-white)' },
    { name: 'Success', value: '#4CAF50', css: 'var(--gtixt-success)' },
    { name: 'Warning', value: '#FFA726', css: 'var(--gtixt-warning)' },
    { name: 'Error', value: '#E53935', css: 'var(--gtixt-error)' },
    { name: 'Info', value: '#29B6F6', css: 'var(--gtixt-info)' },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      <PublicNavigation />
      <div className="pt-24 pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#00838F]">
              GTIXT Style Guide
            </h1>
            <p className="text-lg text-[#263238] opacity-80">
              Comprehensive institutional design system for GTIXT applications
            </p>
          </motion.div>

          {/* Colors Section */}
          <motion.div
            className="card mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="section-title">Color Palette</h2>
            <p className="mb-6 text-[#263238]">
              The GTIXT institutional color palette is designed for professional clarity and visual hierarchy.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {colors.map((color, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="rounded-lg overflow-hidden border border-[#CFD8DC] shadow-sm"
                >
                  <div
                    className="h-24 w-full"
                    style={{ backgroundColor: color.value }}
                  />
                  <div className="p-3 bg-white">
                    <p className="font-semibold text-sm text-[#00838F]">{color.name}</p>
                    <p className="text-xs text-[#263238] font-mono mt-1">{color.value}</p>
                    <p className="text-xs text-[#CFD8DC] font-mono">{color.css}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Typography Section */}
          <motion.div
            className="card mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="section-title">Typography</h2>
            <div className="space-y-6">
              <motion.div variants={itemVariants}>
                <h1 className="text-4xl font-bold text-[#00838F] mb-2">Heading 1</h1>
                <p className="text-sm text-[#CFD8DC]">Font weight: 700 (Bold) | Size: 2.5rem</p>
              </motion.div>
              <motion.div variants={itemVariants}>
                <h2 className="text-3xl font-semibold text-[#00838F] mb-2">Heading 2</h2>
                <p className="text-sm text-[#CFD8DC]">Font weight: 600 (Semibold) | Size: 1.8rem</p>
              </motion.div>
              <motion.div variants={itemVariants}>
                <h3 className="text-2xl font-semibold text-[#00838F] mb-2">Heading 3</h3>
                <p className="text-sm text-[#CFD8DC]">Font weight: 600 (Semibold) | Size: 1.4rem</p>
              </motion.div>
              <motion.div variants={itemVariants}>
                <p className="text-base text-[#263238] mb-2">
                  Body text: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
                <p className="text-sm text-[#CFD8DC]">Font weight: 400 (Regular) | Size: 1rem</p>
              </motion.div>
              <motion.div variants={itemVariants}>
                <p className="text-sm text-[#CFD8DC]">
                  Secondary text: This is used for descriptions and metadata.
                </p>
                <p className="text-xs text-[#CFD8DC]">Font weight: 400 (Regular) | Size: 0.9rem</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Components Section */}
          <motion.div
            className="card mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="section-title">UI Components</h2>

            {/* Buttons */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#00838F] mb-4">Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <motion.button
                  variants={itemVariants}
                  className="button"
                >
                  Primary Button
                </motion.button>
                <motion.button
                  variants={itemVariants}
                  className="button button-secondary"
                >
                  Secondary Button
                </motion.button>
                <motion.button
                  variants={itemVariants}
                  className="button button-outline"
                >
                  Outline Button
                </motion.button>
              </div>
            </div>

            {/* Badges */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#00838F] mb-4">Badges</h3>
              <div className="flex flex-wrap gap-2">
                <motion.span variants={itemVariants} className="badge">
                  Default
                </motion.span>
                <motion.span variants={itemVariants} className="badge badge-outline">
                  Outline
                </motion.span>
                <motion.span variants={itemVariants} className="badge badge-success">
                  Success
                </motion.span>
                <motion.span variants={itemVariants} className="badge badge-warning">
                  Warning
                </motion.span>
                <motion.span variants={itemVariants} className="badge badge-error">
                  Error
                </motion.span>
                <motion.span variants={itemVariants} className="badge badge-info">
                  Info
                </motion.span>
              </div>
            </div>

            {/* Cards */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#00838F] mb-4">Cards</h3>
              <motion.div variants={itemVariants} className="card">
                <div className="card-header">
                  <h4 className="card-title">Card Title</h4>
                  <span className="card-meta">Meta info</span>
                </div>
                <p className="text-[#263238]">
                  This is a card component with the institutional design system. Cards have a turquoise left border, subtle shadow, and hover effects.
                </p>
              </motion.div>
            </div>

            {/* Table */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#00838F] mb-4">Tables</h3>
              <motion.div variants={itemVariants}>
                <table>
                  <thead>
                    <tr>
                      <th>Column 1</th>
                      <th>Column 2</th>
                      <th>Column 3</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Data Cell 1</td>
                      <td>Data Cell 2</td>
                      <td>Data Cell 3</td>
                    </tr>
                    <tr>
                      <td>Data Cell 4</td>
                      <td>Data Cell 5</td>
                      <td>Data Cell 6</td>
                    </tr>
                    <tr>
                      <td>Data Cell 7</td>
                      <td>Data Cell 8</td>
                      <td>Data Cell 9</td>
                    </tr>
                  </tbody>
                </table>
              </motion.div>
            </div>
          </motion.div>

          {/* Spacing & Layout Section */}
          <motion.div
            className="card"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="section-title">Design Tokens</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-[#00838F] mb-3">Spacing</h3>
                <ul className="space-y-2 text-sm text-[#263238]">
                  <li><code className="bg-[#F5F7F9] px-2 py-1 rounded">--gtixt-spacing-xs</code>: 4px</li>
                  <li><code className="bg-[#F5F7F9] px-2 py-1 rounded">--gtixt-spacing-sm</code>: 8px</li>
                  <li><code className="bg-[#F5F7F9] px-2 py-1 rounded">--gtixt-spacing-md</code>: 12px</li>
                  <li><code className="bg-[#F5F7F9] px-2 py-1 rounded">--gtixt-spacing-lg</code>: 20px</li>
                  <li><code className="bg-[#F5F7F9] px-2 py-1 rounded">--gtixt-spacing-xl</code>: 40px</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#00838F] mb-3">Border Radius</h3>
                <ul className="space-y-2 text-sm text-[#263238]">
                  <li><code className="bg-[#F5F7F9] px-2 py-1 rounded">--gtixt-radius-sm</code>: 4px</li>
                  <li><code className="bg-[#F5F7F9] px-2 py-1 rounded">--gtixt-radius-md</code>: 10px</li>
                  <li><code className="bg-[#F5F7F9] px-2 py-1 rounded">--gtixt-radius-lg</code>: 16px</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
