'use client'

import { useState, useEffect } from 'react'
import { Save, RotateCcw, AlertCircle, Zap } from 'lucide-react'

interface DiscoveryConfig {
  scan_limit: number
  max_new_firms: number
  min_confidence: number
  trust_threshold: number
  sources: string[]
  auto_run_enabled: boolean
  auto_run_schedule: string // cron format or interval
}

const DEFAULT_CONFIG: DiscoveryConfig = {
  scan_limit: 5000,
  max_new_firms: 50,
  min_confidence: 0.75,
  trust_threshold: 0.4,
  sources: [
    'listofpropfirms.com',
    'thetrustedprop.com',
    'propfirmmatch.com',
    'propfirms.com',
    'myfxbook.com',
    'fxverify.com',
    'reddit.com/r/Daytrading',
    'reddit.com/r/proptrading',
    'reddit.com/r/Forex',
    'forexpeacearmy.com',
    'trustpilot.com',
    'quora.com',
  ],
  auto_run_enabled: true,
  auto_run_schedule: '0 3 * * *', // Daily at 3:00 AM UTC
}

export function DiscoveryConfigPanel() {
  const [config, setConfig] = useState<DiscoveryConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [newSource, setNewSource] = useState('')
  const [testRunning, setTestRunning] = useState(false)

  // Load config from API
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/discovery-config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      setSaveStatus('idle')
      const response = await fetch('/api/admin/discovery-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (response.ok) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      console.error('Failed to save config:', error)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    if (confirm('Reset all settings to defaults?')) {
      setConfig(DEFAULT_CONFIG)
    }
  }

  const runDiscoveryTest = async () => {
    try {
      setTestRunning(true)
      const response = await fetch('/api/admin/discovery-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scan_limit: Math.min(config.scan_limit, 100),
          max_new_firms: 3,
          min_confidence: config.min_confidence,
          trust_threshold: config.trust_threshold,
        }),
      })
      if (response.ok) {
        alert('Discovery test started! Check logs for progress.')
      } else {
        alert('Failed to start discovery test.')
      }
    } catch (error) {
      console.error('Failed to start discovery test:', error)
      alert('Error starting discovery test')
    } finally {
      setTestRunning(false)
    }
  }

  const addSource = () => {
    if (newSource.trim() && !config.sources.includes(newSource.trim())) {
      setConfig({
        ...config,
        sources: [...config.sources, newSource.trim()],
      })
      setNewSource('')
    }
  }

  const removeSource = (index: number) => {
    setConfig({
      ...config,
      sources: config.sources.filter((_, i) => i !== index),
    })
  }

  if (loading) return <div className="text-center py-8 text-dark-400">Loading configuration...</div>

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Discovery System Configuration</h1>
        <p className="text-dark-300">Configure autonomous Prop Firm discovery parameters</p>
      </div>

      {/* Status Message */}
      {saveStatus !== 'idle' && (
        <div
          className={`p-4 rounded-lg ${
            saveStatus === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {saveStatus === 'success' ? 'Configuration saved successfully.' : 'Failed to save configuration.'}
        </div>
      )}

      {/* Discovery Parameters */}
      <div className="bg-dark-800/50 border border-white/10 rounded-lg p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Discovery Parameters
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {/* Scan Limit */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Scan Limit</label>
              <input
                type="number"
                min="10"
                max="10000"
                value={config.scan_limit}
                onChange={(e) => setConfig({ ...config, scan_limit: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-dark-700 border border-white/10 rounded text-white focus:outline-none focus:border-primary-500"
              />
              <p className="text-xs text-dark-500 mt-1">Max domains to scan per run (10-10000)</p>
            </div>

            {/* Max New Firms */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Max New Firms</label>
              <input
                type="number"
                min="1"
                max="500"
                value={config.max_new_firms}
                onChange={(e) => setConfig({ ...config, max_new_firms: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-dark-700 border border-white/10 rounded text-white focus:outline-none focus:border-primary-500"
              />
              <p className="text-xs text-dark-500 mt-1">Maximum new firms to add per run (1-500)</p>
            </div>

            {/* Min Confidence */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Min AI Confidence</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={config.min_confidence}
                onChange={(e) => setConfig({ ...config, min_confidence: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-dark-700 border border-white/10 rounded text-white focus:outline-none focus:border-primary-500"
              />
              <p className="text-xs text-dark-500 mt-1">LLM classification confidence (0-1, lower = more discoveries)</p>
            </div>

            {/* Trust Threshold */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Trust Score Threshold</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={config.trust_threshold}
                onChange={(e) => setConfig({ ...config, trust_threshold: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-dark-700 border border-white/10 rounded text-white focus:outline-none focus:border-primary-500"
              />
              <p className="text-xs text-dark-500 mt-1">Minimum trust score for validation (0-1, lower = more lenient)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Discovery Sources */}
      <div className="bg-dark-800/50 border border-white/10 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          📡 Discovery Sources
        </h2>
        <div className="space-y-3">
          {config.sources.map((source, index) => (
            <div key={index} className="flex items-center justify-between bg-dark-700/50 p-3 rounded border border-white/5">
              <code className="text-sm text-dark-300">{source}</code>
              <button
                onClick={() => removeSource(index)}
                className="px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 rounded transition"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <input
            type="text"
            placeholder="Add new source (e.g., reddit.com/r/Daytrading)"
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSource()}
            className="flex-1 px-3 py-2 bg-dark-700 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-primary-500"
          />
          <button
            onClick={addSource}
            className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded hover:bg-primary-600 transition"
          >
            Add
          </button>
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-sm text-blue-300">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>Sources can be websites, Reddit communities, or other discovery endpoints</p>
        </div>
      </div>

      {/* Automation Schedule */}
      <div className="bg-dark-800/50 border border-white/10 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">⏰ Automation Schedule</h2>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={config.auto_run_enabled}
            onChange={(e) => setConfig({ ...config, auto_run_enabled: e.target.checked })}
            className="w-5 h-5"
          />
          <span className="text-dark-300">Enable automatic daily discovery runs</span>
        </label>

        {config.auto_run_enabled && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Cron Schedule</label>
            <input
              type="text"
              value={config.auto_run_schedule}
              onChange={(e) => setConfig({ ...config, auto_run_schedule: e.target.value })}
              className="w-full px-3 py-2 bg-dark-700 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-primary-500 font-mono"
              placeholder="0 3 * * * (daily at 3:00 AM UTC)"
            />
            <p className="text-xs text-dark-500 mt-1">
              Cron format: minute hour day month weekday (default: daily at 3:00 AM UTC)
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="flex-1 px-4 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 disabled:bg-primary-500/50 transition flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>

        <button
          onClick={runDiscoveryTest}
          disabled={testRunning}
          className="flex-1 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-green-600/50 transition flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          {testRunning ? 'Testing...' : 'Run Discovery Test'}
        </button>

        <button
          onClick={resetToDefaults}
          className="px-4 py-3 bg-dark-700 text-dark-300 font-medium rounded-lg hover:bg-dark-600 transition flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Info */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-300 flex gap-3">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium mb-1">💡 Tips for best results:</p>
          <ul className="list-disc list-inside space-y-1 text-xs opacity-90">
            <li>Lower confidence = more discoveries but higher false positives</li>
            <li>Lower trust threshold = more firms but potentially lower quality</li>
            <li>Start with 100-200 scan limit for testing</li>
            <li>Monitor logs to see what's being discovered</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
