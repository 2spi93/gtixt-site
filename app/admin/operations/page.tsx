'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  jobName: string;
  status: 'success' | 'failed' | 'running';
  duration?: number;
  startTime: string;
  endTime: string;
}

export default function OperationsDashboard() {
  const router = useRouter();
  const [crawls, setCrawls] = useState<Crawl[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [crawlCounts, setCrawlCounts] = useState<{ total: number; byStatus: Record<string, number> } | null>(null);
  const [jobCounts, setJobCounts] = useState<{ totalJobs: number; executionsByStatus: Record<string, number> } | null>(null);
  const [, setLoading] = useState(true);
  const [actionState, setActionState] = useState<{ loading: boolean; message: string; error: boolean }>({
    loading: false,
    message: '',
    error: false,
  });

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
        fetch('/api/admin/jobs/executions/?limit=5')
      ]);

      const crawlsData = await crawlsRes.json();
      const alertsData = await alertsRes.json();
      const jobsData = await jobsRes.json();

      setCrawls(crawlsData.data || []);
      setAlerts(alertsData.data || []);
      
      // Handle jobs data with proper error handling
      if (jobsData.data) {
        setJobs(jobsData.data);
      } else if (jobsData.error) {
        console.warn('Jobs API error:', jobsData.error);
        // Fallback to empty jobs if API errors
        setJobs([]);
      }
      
      if (crawlsData.counts) setCrawlCounts(crawlsData.counts);
      if (jobsData.counts) setJobCounts(jobsData.counts);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Ensure we don't crash on API errors
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const activeCrawls = crawls.filter(c => c.status === 'running').length;
  const failedAlerts = alerts.filter(a => a.severity === 'error').length;
  const recentJobs = jobs.filter(j => j.status === 'success').length;

  const runAction = async (action: 'new-crawl' | 'retry-failed' | 'rescore') => {
    setActionState({ loading: true, message: '', error: false });
    try {
      if (action === 'new-crawl') {
        const res = await fetch('/api/admin/crawls/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'Firms', maxFirms: 100, priority: 'high' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create crawl');
        setActionState({ loading: false, message: `Crawl cree: ${data?.data?.id || 'ok'}`, error: false });
      }

      if (action === 'retry-failed') {
        const failed = crawls.find(c => c.status === 'failed');
        if (!failed) {
          setActionState({ loading: false, message: 'Aucun crawl en echec a relancer.', error: false });
          return;
        }
        const res = await fetch('/api/admin/crawls/', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crawlId: failed.id, action: 'retry' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Retry failed');
        setActionState({ loading: false, message: `Retry lance pour ${failed.id}`, error: false });
      }

      if (action === 'rescore') {
        const res = await fetch('/api/admin/jobs/execute/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobName: 'scoring_update' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Rescore failed');
        setActionState({ loading: false, message: `Rescore lance (${data?.data?.jobId || 'ok'})`, error: false });
      }

      fetchData();
    } catch (error) {
      setActionState({
        loading: false,
        message: error instanceof Error ? error.message : String(error),
        error: true,
      });
    }
  };

  const stopCrawl = async (crawlId: string) => {
    setActionState({ loading: true, message: '', error: false });
    try {
      const res = await fetch('/api/admin/crawls/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crawlId, action: 'stop' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to stop crawl');
      setActionState({ loading: false, message: `Crawl stopped: ${crawlId}`, error: false });
      fetchData();
    } catch (error) {
      setActionState({
        loading: false,
        message: error instanceof Error ? error.message : String(error),
        error: true,
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-4xl font-bold">Operations Control Center</h1>

      {/* Quick Stats with Counts */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Crawls</CardTitle>
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
            <CardTitle className="text-sm font-medium text-red-600">Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{failedAlerts}</div>
            <p className="text-xs text-red-500">Errors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Metrics</CardTitle>
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
            <CardTitle>Active Crawls</CardTitle>
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
                      <button
                        onClick={() => stopCrawl(crawl.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Stop
                      </button>
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
                  <button
                    onClick={() => router.push('/admin/logs?severity=error')}
                    className="text-xs text-red-600 hover:underline mt-1"
                  >
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
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {actionState.message && (
            <div
              className={`mb-3 rounded border px-3 py-2 text-sm ${
                actionState.error ? 'border-red-300 bg-red-50 text-red-700' : 'border-green-300 bg-green-50 text-green-700'
              }`}
            >
              {actionState.message}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => runAction('new-crawl')}
              disabled={actionState.loading}
              className="flex items-center justify-center gap-2 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-60"
            >
              New Crawl
            </button>
            <button
              onClick={() => runAction('retry-failed')}
              disabled={actionState.loading}
              className="flex items-center justify-center gap-2 p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold disabled:opacity-60"
            >
              Retry Failed
            </button>
            <button
              onClick={() => runAction('rescore')}
              disabled={actionState.loading}
              className="flex items-center justify-center gap-2 p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold disabled:opacity-60"
            >
              Rescore
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {jobs.length === 0 ? (
              <p className="text-sm text-gray-500">No recent jobs. Executions will appear here once you run a job.</p>
            ) : (
              jobs.map(job => (
                <div key={job.id} className="flex justify-between items-center p-2 border-b">
                  <div>
                    <p className="font-medium">{job.jobName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(job.startTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-sm">
                    {job.status === 'success' && <span className="text-green-600">✓ {job.duration || 0}s</span>}
                    {job.status === 'failed' && <span className="text-red-600">✗ Failed</span>}
                    {job.status === 'running' && <span className="text-blue-600">⏳ Running</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
