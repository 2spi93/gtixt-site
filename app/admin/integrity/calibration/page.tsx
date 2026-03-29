'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CalibrationSettings {
  weights: {
    payout: number
    risk: number
    operational: number
    historical: number
  }
  thresholds: {
    stable: number
    caution: number
    high_risk: number
  }
  batch_mode: {
    enrichment_timeout: number
    max_concurrent: number
    skip_deep_signals: boolean
  }
}

const DEFAULT_SETTINGS: CalibrationSettings = {
  weights: {
    payout: 0.30,
    risk: 0.25,
    operational: 0.25,
    historical: 0.20
  },
  thresholds: {
    stable: 75,
    caution: 60,
    high_risk: 40
  },
  batch_mode: {
    enrichment_timeout: 5000,
    max_concurrent: 3,
    skip_deep_signals: true
  }
}

export default function IntegrityCalibrationPage() {
  const [settings, setSettings] = useState<CalibrationSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/integrity/calibration')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || DEFAULT_SETTINGS)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/admin/integrity/calibration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully. Restart required for changes to take effect.' })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (_error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setLoading(false)
    }
  }

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS)
    setMessage({ type: 'success', text: 'Reset to defaults (not saved yet)' })
  }

  const updateWeight = (key: keyof CalibrationSettings['weights'], value: number) => {
    setSettings(prev => ({
      ...prev,
      weights: { ...prev.weights, [key]: value }
    }))
  }

  const updateThreshold = (key: keyof CalibrationSettings['thresholds'], value: number) => {
    setSettings(prev => ({
      ...prev,
      thresholds: { ...prev.thresholds, [key]: value }
    }))
  }

  const updateBatchMode = (key: keyof CalibrationSettings['batch_mode'], value: number | boolean) => {
    setSettings(prev => ({
      ...prev,
      batch_mode: { ...prev.batch_mode, [key]: value }
    }))
  }

  const totalWeight = Object.values(settings.weights).reduce((sum, w) => sum + w, 0)
  const weightValid = Math.abs(totalWeight - 1.0) < 0.01

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Integrity Score Calibration</h1>
          <p className="text-muted-foreground mt-1">
            Adjust scoring weights, thresholds, and batch processing parameters
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={resetToDefaults} disabled={loading}>
            Reset to Defaults
          </Button>
          <Button onClick={saveSettings} disabled={loading || !weightValid}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {!weightValid && (
        <Alert variant="destructive">
          <AlertDescription>
            ⚠️ Weights must sum to 1.0 (currently: {totalWeight.toFixed(2)})
          </AlertDescription>
        </Alert>
      )}

      {/* Component Weights */}
      <Card>
        <CardHeader>
          <CardTitle>Component Weights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {Object.entries(settings.weights).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between">
                  <Label className="capitalize">{key.replace('_', ' ')}</Label>
                  <span className="text-sm font-mono">{value.toFixed(2)}</span>
                </div>
                <Slider
                  value={[value * 100]}
                  onValueChange={([v]) => updateWeight(key as keyof CalibrationSettings['weights'], v / 100)}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            ))}
          </div>
          <div className="pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span>Total Weight:</span>
              <span className={`font-mono font-bold ${weightValid ? 'text-green-600' : 'text-red-600'}`}>
                {totalWeight.toFixed(2)} {weightValid ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Level Thresholds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Stable (≥ threshold)</Label>
                <Input
                  type="number"
                  value={settings.thresholds.stable}
                  onChange={(e) => updateThreshold('stable', parseInt(e.target.value))}
                  className="w-20 text-right"
                  min={0}
                  max={100}
                />
              </div>
              <div className="h-2 bg-green-200 rounded" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Caution (≥ threshold)</Label>
                <Input
                  type="number"
                  value={settings.thresholds.caution}
                  onChange={(e) => updateThreshold('caution', parseInt(e.target.value))}
                  className="w-20 text-right"
                  min={0}
                  max={100}
                />
              </div>
              <div className="h-2 bg-yellow-200 rounded" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>High Risk (≥ threshold)</Label>
                <Input
                  type="number"
                  value={settings.thresholds.high_risk}
                  onChange={(e) => updateThreshold('high_risk', parseInt(e.target.value))}
                  className="w-20 text-right"
                  min={0}
                  max={100}
                />
              </div>
              <div className="h-2 bg-orange-200 rounded" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Critical (&lt; high_risk)</Label>
                <span className="text-sm text-muted-foreground">Auto</span>
              </div>
              <div className="h-2 bg-red-200 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch Mode Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Processing Optimization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Enrichment Timeout (ms)</Label>
            <Input
              type="number"
              value={settings.batch_mode.enrichment_timeout}
              onChange={(e) => updateBatchMode('enrichment_timeout', parseInt(e.target.value))}
              min={1000}
              max={30000}
              step={1000}
            />
            <p className="text-xs text-muted-foreground">
              Timeout for enrichment operations in batch mode (lower = faster but less complete)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Max Concurrent Requests</Label>
            <Input
              type="number"
              value={settings.batch_mode.max_concurrent}
              onChange={(e) => updateBatchMode('max_concurrent', parseInt(e.target.value))}
              min={1}
              max={10}
            />
            <p className="text-xs text-muted-foreground">
              Maximum parallel enrichment requests (higher = faster but more resource intensive)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="skip_deep"
              checked={settings.batch_mode.skip_deep_signals}
              onChange={(e) => updateBatchMode('skip_deep_signals', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="skip_deep">Skip deep signals in batch mode</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            When enabled, batch operations use only cached data and basic checks (recommended for large scans)
          </p>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded text-xs overflow-auto">
{JSON.stringify(settings, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
