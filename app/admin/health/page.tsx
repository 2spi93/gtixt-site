'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  database: string;
  crawlers: string;
  apiLatency: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: string;
}

interface SystemLog {
  timestamp: string;
  severity: 'info' | 'warning' | 'error';
  component: string;
  message: string;
}

export default function HealthMonitoring() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [logsError, setLogsError] = useState('');

  useEffect(() => {
    fetchHealth();
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchHealth();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    fetchLogs();
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, severity]);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/admin/health/');
      const data = await res.json();
      setHealth(data);
    } catch (error) {
      console.error('Failed to fetch health:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/admin/logs/?severity=${severity}&hours=1`);
      const data = await res.json();
      setLogs(data.logs || []);
      setLogsError('');
    } catch (error) {
      setLogsError('Failed to load logs. Please try again.');
      console.error('Failed to fetch logs:', error);
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getHealthBadge = (status: string) => {
    if (status === 'OK' || status === 'RUNNING') return 'bg-green-50 text-green-700 border-green-300';
    if (status === 'WARNING') return 'bg-yellow-50 text-yellow-700 border-yellow-300';
    return 'bg-red-50 text-red-700 border-red-300';
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">🏥 System Health</h1>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`px-4 py-2 rounded font-semibold ${
            autoRefresh
              ? 'bg-green-500 text-white'
              : 'bg-gray-300 text-gray-700'
          }`}
        >
          {autoRefresh ? '🔄 Auto-Refresh ON' : '❌ Auto-Refresh OFF'}
        </button>
      </div>

      {/* Health Status Badges */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Database</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`px-4 py-3 rounded border-2 text-center font-bold ${getHealthBadge(health.database)}`}>
                {health.database}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Crawlers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`px-4 py-3 rounded border-2 text-center font-bold ${getHealthBadge(health.crawlers)}`}>
                {health.crawlers}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Overall Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`px-4 py-3 rounded border-2 text-center font-bold text-lg ${
                health.status === 'healthy'
                  ? 'bg-green-50 text-green-700 border-green-300'
                  : health.status === 'warning'
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                  : 'bg-red-50 text-red-700 border-red-300'
              }`}>
                {health.status === 'healthy' ? '✅ HEALTHY' : health.status === 'warning' ? '⚠️ WARNING' : '🔴 CRITICAL'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Metrics */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>CPU Usage</span>
                  <span className="font-semibold">{health.cpuUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded h-2">
                  <div
                    className={`rounded h-2 transition ${
                      health.cpuUsage > 80
                        ? 'bg-red-500'
                        : health.cpuUsage > 50
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${health.cpuUsage}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>Memory Usage</span>
                  <span className="font-semibold">{health.memoryUsage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded h-2">
                  <div
                    className={`rounded h-2 transition ${
                      health.memoryUsage > 80
                        ? 'bg-red-500'
                        : health.memoryUsage > 60
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${health.memoryUsage}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>API Latency</span>
                  <span className="font-semibold">{health.apiLatency}ms</span>
                </div>
                <div className="text-xs text-gray-600">
                  {health.apiLatency > 500
                    ? '🔴 Slow'
                    : health.apiLatency > 200
                    ? '🟡 Normal'
                    : '🟢 Fast'}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-600">Last Updated</p>
                <p className="font-mono text-sm">{new Date(health.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>System Logs (Last Hour)</CardTitle>
            <div className="flex gap-2">
              {(['all', 'info', 'warning', 'error'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setSeverity(sev)}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    severity === sev
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {sev === 'all' ? '📋 All' : sev === 'info' ? 'ℹ️ Info' : sev === 'warning' ? '⚠️ Warning' : '❌ Error'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logsError && (
              <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
                {logsError}
              </div>
            )}
            {!logsError && logs.length === 0 && (
              <div className="p-3 rounded border border-gray-200 bg-gray-50 text-gray-600 text-sm">
                No logs found for the selected severity.
              </div>
            )}
            {logs.map((log, i) => (
              <div
                key={i}
                className={`p-3 rounded border-l-4 font-mono text-sm ${getSeverityColor(log.severity)}`}
              >
                <div className="flex justify-between">
                  <span className="font-bold">[{log.component}]</span>
                  <span className="text-xs opacity-70">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-1 text-xs">{log.message}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">🔧 Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold text-sm">
              🔄 Restart Services
            </button>
            <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold text-sm">
              📦 Clear Cache
            </button>
            <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold text-sm">
              💾 Force Backup
            </button>
            <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold text-sm">
              🔍 Run Diagnostics
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
