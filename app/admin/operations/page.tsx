'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Crawl {
  id: string;
  type: string;
  status: 'running' | 'pending' | 'success' | 'failed';
  progress: number;
  firmsCount: number;
  startTime: Date;
}

interface Alert {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: Date;
}

interface Job {
  id: string;
  name: string;
  status: 'success' | 'failed' | 'running';
  duration: number;
  timestamp: Date;
}

export default function OperationsDashboard() {
  const [crawls, setCrawls] = useState<Crawl[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [crawlCounts, setCrawlCounts] = useState<{ total: number; byStatus: Record<string, number> } | null>(null);
  const [jobCounts, setJobCounts] = useState<{ totalJobs: number; executionsByStatus: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [crawlsRes, alertsRes, jobsRes] = await Promise.all([
        fetch('/api/admin/crawls/?limit=5'),
        fetch('/api/admin/alerts/?severity=all'),
        fetch('/api/admin/jobs/?limit=5')
      ]);

      const crawlsData = await crawlsRes.json();
      const alertsData = await alertsRes.json();
      const jobsData = await jobsRes.json();

      setCrawls(crawlsData.data || []);
      setAlerts(alertsData.data || []);
      setJobs(jobsData.data || []);
      if (crawlsData.counts) setCrawlCounts(crawlsData.counts);
      if (jobsData.counts) setJobCounts(jobsData.counts);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeCrawls = crawls.filter(c => c.status === 'running').length;
  const failedAlerts = alerts.filter(a => a.severity === 'error').length;
  const recentJobs = jobs.filter(j => j.status === 'success').length;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-4xl font-bold">🎛️ Operations Control Center</h1>

      {/* Quick Stats with Counts */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">🕷️ Crawls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeCrawls}</div>
            <p className="text-xs text-gray-500">In progress</p>
            {crawlCounts && (
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <p>Total: {crawlCounts.total}</p>
                {Object.entries(crawlCounts.byStatus).slice(0, 2).map(([status, count]) => (
                  <p key={status} className="capitalize">{status}: {count}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">⚙️ Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{recentJobs}</div>
            <p className="text-xs text-gray-500">Completed today</p>
            {jobCounts && (
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <p>Total: {jobCounts.totalJobs}</p>
                {Object.entries(jobCounts.executionsByStatus).slice(0, 2).map(([status, count]) => (
                  <p key={status} className="capitalize">{status}: {count}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-red-300 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">🚨 Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{failedAlerts}</div>
            <p className="text-xs text-red-500">Errors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">📊 Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">198</div>
            <p className="text-xs text-gray-500">Total firms</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Crawls */}
      {activeCrawls > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🕷️ Active Crawls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {crawls.filter(c => c.status === 'running').map(crawl => (
                <div key={crawl.id} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{crawl.type} (#{crawl.id})</p>
                      <p className="text-sm text-gray-600">
                        {crawl.firmsCount} firms • Started {new Date(crawl.startTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{crawl.progress}%</p>
                      <button className="text-xs text-red-600 hover:underline">Stop</button>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${crawl.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {failedAlerts > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">🔴 Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.filter(a => a.severity === 'error').map(alert => (
                <div key={alert.id} className="border-l-4 border-red-500 pl-4 py-2">
                  <p className="font-semibold text-red-700">{alert.title}</p>
                  <p className="text-sm text-red-600">{alert.description}</p>
                  <button className="text-xs text-red-600 hover:underline mt-1">
                    Retry / More Info
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ready-to-Use Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>⚡ Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <button className="flex items-center justify-center gap-2 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold">
              ▶️ New Crawl
            </button>
            <button className="flex items-center justify-center gap-2 p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold">
              🔄 Retry Failed
            </button>
            <button className="flex items-center justify-center gap-2 p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold">
              📈 Rescore
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {jobs.map(job => (
              <div key={job.id} className="flex justify-between items-center p-2 border-b">
                <div>
                  <p className="font-medium">{job.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(job.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="text-sm">
                  {job.status === 'success' && <span className="text-green-600">✓ {job.duration}s</span>}
                  {job.status === 'failed' && <span className="text-red-600">✗ Failed</span>}
                  {job.status === 'running' && <span className="text-blue-600">⏳ Running</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
