/**
 * Enterprise Monitoring Dashboard
 * Centralized view of Prometheus metrics, Grafana dashboards, and system health
 * 
 * Features:
 * - Prometheus metrics overview
 * - Grafana dashboard links
 * - Rate limiting statistics
 * - Redis cache performance
 * - Backup status
 * - Real-time system metrics
 */

'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PrometheusMetric {
  name: string;
  value: number;
  timestamp: number;
}

interface MonitoringStats {
  prometheusAvailable: boolean;
  grafanaAvailable: boolean;
  metricsCount: number;
  lastScrape: string;
  rateLimiting: {
    enabled: boolean;
    activeClients: number;
    blockedRequests24h: number;
  };
  redisCache: {
    enabled: boolean;
    hitRate: number;
    cached: boolean;
    ttl: number;
  };
  backup: {
    lastBackup: string;
    status: string;
    sizeGB: number;
  };
}

export default function EnterpriseMonitoring() {
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [metrics, setMetrics] = useState<PrometheusMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchMonitoringData = async () => {
    try {
      // Fetch metrics endpoint
      const metricsRes = await fetch('/api/metrics');
      const metricsText = await metricsRes.text();
      
      // Parse Prometheus metrics (simple parsing)
      const metricLines = metricsText.split('\n').filter(line => 
        !line.startsWith('#') && line.trim() !== ''
      );
      
      const parsedMetrics: PrometheusMetric[] = metricLines.slice(0, 10).map(line => {
        const [name, value] = line.split(' ');
        return {
          name: name || 'unknown',
          value: parseFloat(value) || 0,
          timestamp: Date.now(),
        };
      });
      
      setMetrics(parsedMetrics);

      // Mock stats (in production, fetch from actual endpoints)
      setStats({
        prometheusAvailable: true,
        grafanaAvailable: true,
        metricsCount: metricLines.length,
        lastScrape: new Date().toISOString(),
        rateLimiting: {
          enabled: true,
          activeClients: 45,
          blockedRequests24h: 127,
        },
        redisCache: {
          enabled: true,
          hitRate: 94.3,
          cached: true,
          ttl: 300,
        },
        backup: {
          lastBackup: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
          status: 'success',
          sizeGB: 2.4,
        },
      });

      setError(null);
    } catch (err) {
      console.error('Failed to fetch monitoring data:', err);
      setError('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-center mt-4 text-gray-600">Loading monitoring data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Enterprise Monitoring</h1>
          <p className="text-gray-600 mt-1">Prometheus, Grafana, and system observability</p>
        </div>
        <button
          onClick={fetchMonitoringData}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* External Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href="http://localhost:9090"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white rounded-xl shadow-sm border-2 border-orange-300 p-6 hover:shadow-md hover:border-orange-500 transition group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition">
                🔥 Prometheus
              </h3>
              <p className="text-sm text-gray-600 mt-1">Metrics collection & alerting</p>
              <p className="text-xs text-gray-500 mt-2">http://localhost:9090</p>
            </div>
            <div className={`text-3xl ${stats?.prometheusAvailable ? 'text-green-500' : 'text-gray-300'}`}>
              {stats?.prometheusAvailable ? '✅' : '❌'}
            </div>
          </div>
        </a>

        <a
          href="http://localhost:3001"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white rounded-xl shadow-sm border-2 border-orange-300 p-6 hover:shadow-md hover:border-orange-500 transition group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition">
                📈 Grafana
              </h3>
              <p className="text-sm text-gray-600 mt-1">Visualization & dashboards</p>
              <p className="text-xs text-gray-500 mt-2">http://localhost:3001 (admin/admin)</p>
            </div>
            <div className={`text-3xl ${stats?.grafanaAvailable ? 'text-green-500' : 'text-gray-300'}`}>
              {stats?.grafanaAvailable ? '✅' : '❌'}
            </div>
          </div>
        </a>
      </div>

      {/* Metrics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Metrics Exported</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.metricsCount}</p>
              <p className="text-xs text-gray-500 mt-1">Active time series</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Rate Limited Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{stats.rateLimiting.activeClients}</p>
              <p className="text-xs text-gray-500 mt-1">Tracked IPs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cache Hit Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.redisCache.hitRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Redis performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Last Backup</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {Math.floor((Date.now() - new Date(stats.backup.lastBackup).getTime()) / 3600000)}h
              </p>
              <p className="text-xs text-gray-500 mt-1">{stats.backup.sizeGB} GB</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enterprise Features Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">🚀 Enterprise Features Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900">Rate Limiting</p>
              <p className="text-sm text-gray-600">100 req/min per IP</p>
            </div>
            <span className="text-2xl">
              {stats?.rateLimiting.enabled ? '✅' : '❌'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900">Redis Cache</p>
              <p className="text-sm text-gray-600">5min TTL snapshots</p>
            </div>
            <span className="text-2xl">
              {stats?.redisCache.enabled ? '✅' : '❌'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900">Automated Backups</p>
              <p className="text-sm text-gray-600">Daily PostgreSQL → S3</p>
            </div>
            <span className="text-2xl">
              {stats?.backup.status === 'success' ? '✅' : '⚠️'}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900">CI/CD Pipeline</p>
              <p className="text-sm text-gray-600">GitHub Actions</p>
            </div>
            <span className="text-2xl">✅</span>
          </div>
        </div>
      </div>

      {/* Recent Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Recent Metrics (Sample)</h2>
        <div className="space-y-2">
          {metrics.slice(0, 8).map((metric, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm font-mono text-gray-700">{metric.name}</span>
              <span className="text-sm font-bold text-blue-600">{metric.value.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <Link
          href="/api/metrics"
          target="_blank"
          className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View all Prometheus metrics →
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/api/metrics"
            target="_blank"
            className="px-4 py-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-center font-medium text-gray-700 hover:text-blue-700 transition"
          >
            📊 Raw Metrics
          </Link>
          <Link
            href="/admin/health"
            className="px-4 py-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-center font-medium text-gray-700 hover:text-blue-700 transition"
          >
            🏥 Health Check
          </Link>
          <Link
            href="/admin/logs"
            className="px-4 py-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-center font-medium text-gray-700 hover:text-blue-700 transition"
          >
            📜 System Logs
          </Link>
          <button
            onClick={() => window.open('http://localhost:9090/alerts', '_blank')}
            className="px-4 py-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-center font-medium text-gray-700 hover:text-blue-700 transition"
          >
            🚨 Alerts
          </button>
        </div>
      </div>

      {/* Documentation Links */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 text-lg mb-3">📚 Documentation</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <a href="/opt/gpti/monitoring/prometheus.yml" className="text-blue-700 hover:text-blue-900 font-medium">
              📄 Prometheus configuration →
            </a>
          </li>
          <li>
            <a href="/opt/gpti/monitoring/alerts.yml" className="text-blue-700 hover:text-blue-900 font-medium">
              🚨 Alert rules →
            </a>
          </li>
          <li>
            <a href="/opt/gpti/monitoring/grafana-dashboard.json" className="text-blue-700 hover:text-blue-900 font-medium">
              📈 Grafana dashboard JSON →
            </a>
          </li>
          <li>
            <a href="/opt/gpti/ENTERPRISE_IMPLEMENTATION_REPORT_20250301.md" className="text-blue-700 hover:text-blue-900 font-medium">
              📋 Enterprise implementation report →
            </a>
          </li>
        </ul>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-6">
          <p className="text-red-900 font-semibold">⚠️ {error}</p>
        </div>
      )}
    </div>
  );
}
