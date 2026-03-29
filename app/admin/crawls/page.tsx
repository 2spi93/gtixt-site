'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Crawl {
  id: string;
  type?: string;
  name?: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startTime: string;
  endTime?: string;
  duration?: number;
  firmsCount: number;
  firmsProcessed: number;
  errors: number;
  userId: string;
  progress?: number;
  url?: string;
}

interface AdminLogEntry {
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  component: string;
  message: string;
  details?: Record<string, unknown>;
}

export default function CrawlManagement() {
  const [crawls, setCrawls] = useState<Crawl[]>([]);
  const [counts, setCounts] = useState<{ total: number; byStatus: Record<string, number> }>({
    total: 0,
    byStatus: {},
  });
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedCrawl, setSelectedCrawl] = useState<Crawl | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [crawlLogs, setCrawlLogs] = useState<string[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [form, setForm] = useState({
    type: 'ASIC',
    maxFirms: 100,
    priority: 'normal',
  });

  const inferCrawlType = (url?: string, name?: string): string => {
    const source = `${url || ''} ${name || ''}`.toLowerCase();
    if (source.includes('asic')) return 'ASIC';
    if (source.includes('abn')) return 'ABN';
    if (source.includes('macro')) return 'Macro';
    if (source.includes('fca')) return 'FCA';
    if (source.includes('batch') || source.includes('crawl')) return 'Firms';
    return 'General';
  };

  const loadCrawlLogs = async (crawl: Crawl) => {
    setLogsLoading(true);
    setCrawlLogs([]);
    try {
      const res = await fetch('/api/admin/logs/?source=database&hours=168&limit=800');
      const data = await res.json();
      const allLogs: AdminLogEntry[] = data?.logs || [];

      const matching = allLogs.filter((entry) => {
        const detailsText = JSON.stringify(entry.details || {}).toLowerCase();
        const crawlId = crawl.id.toLowerCase();
        const crawlName = (crawl.name || '').toLowerCase();
        const crawlUrl = (crawl.url || '').toLowerCase();
        const message = (entry.message || '').toLowerCase();

        if (entry.component === 'admin-crawls') {
          return (
            (crawlName && message.includes(crawlName)) ||
            (crawlUrl && detailsText.includes(crawlUrl)) ||
            message.includes(crawlId) ||
            detailsText.includes(crawlId)
          );
        }

        if (entry.component === 'admin-operations') {
          return detailsText.includes(crawlId) || (crawlName && detailsText.includes(crawlName));
        }

        return false;
      });

      if (matching.length > 0) {
        setCrawlLogs(
          matching.slice(0, 100).map((entry) => {
            const ts = new Date(entry.timestamp).toLocaleString();
            return `[${ts}] [${entry.severity.toUpperCase()}] ${entry.component}: ${entry.message}`;
          })
        );
      } else {
        const created = new Date(crawl.startTime).toLocaleString();
        const updated = crawl.endTime ? new Date(crawl.endTime).toLocaleString() : null;
        const base = [
          `[INFO] Crawl id: ${crawl.id}`,
          `[INFO] Name: ${crawl.name || 'n/a'}`,
          `[INFO] Status: ${crawl.status.toUpperCase()}`,
          `[INFO] Created: ${created}`,
        ];

        if (updated) base.push(`[INFO] Updated: ${updated}`);
        if (typeof crawl.firmsProcessed === 'number' || typeof crawl.firmsCount === 'number') {
          base.push(`[INFO] Firms: ${crawl.firmsProcessed || 0}/${crawl.firmsCount || 0}`);
        }

        if (crawl.status === 'pending') {
          base.push('[INFO] Crawl is queued. Detailed execution logs will appear once the worker starts processing this crawl.');
        } else if (crawl.status === 'running') {
          base.push('[INFO] Crawl is running. If detailed lines are not visible yet, refresh in a few seconds.');
        } else if (crawl.status === 'success') {
          base.push('[INFO] Crawl finished successfully. This entry may not include verbose line-by-line traces.');
        } else if (crawl.status === 'failed') {
          base.push('[WARNING] Crawl failed. Check /admin/logs with severity=error for broader diagnostics.');
        }

        if (crawl.id.startsWith('crawl_demo_')) {
          base.push('[INFO] This is a legacy demo crawl record; historical trace files may not exist.');
        }

        setCrawlLogs(base);
      }
    } catch (error) {
      setCrawlLogs([
        `Failed to load crawl logs: ${error instanceof Error ? error.message : String(error)}`,
      ]);
    } finally {
      setLogsLoading(false);
    }
  };

  const openCrawlLogs = async (crawl: Crawl) => {
    setSelectedCrawl(crawl);
    setShowLogs(true);
    await loadCrawlLogs(crawl);
  };

  const fetchCrawls = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/crawls/');
      const data = await res.json();
      const normalized = (data.data || []).map((item: Record<string, unknown>) => ({
        id: item.id,
        name: item.name,
        type: inferCrawlType(item.url as string | undefined, item.name as string | undefined),
        status: item.status === 'completed' ? 'success' : item.status,
        startTime: item.createdAt,
        endTime: item.updatedAt,
        duration: item.updatedAt && item.createdAt
          ? Math.max(0, Math.round((new Date(item.updatedAt as string).getTime() - new Date(item.createdAt as string).getTime()) / 1000))
          : undefined,
        firmsCount: item.resultsCount || 0,
        firmsProcessed: item.resultsCount || 0,
        errors: item.errorCount || 0,
        userId: 'system',
        progress: item.status === 'running' ? 50 : item.status === 'completed' ? 100 : 0,
        url: item.url,
      }));
      setCrawls(normalized);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (error) {
      console.error('Failed to fetch crawls:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrawls();
    const interval = setInterval(fetchCrawls, 5000);
    return () => clearInterval(interval);
  }, [fetchCrawls]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-blue-600 bg-blue-50';
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const createCrawl = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/crawls/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create crawl');
      setActionMessage({ text: `Crawl cree: ${data?.data?.id || 'ok'}`, error: false });
      setShowNewForm(false);
      fetchCrawls();
    } catch (error) {
      setActionMessage({ text: error instanceof Error ? error.message : String(error), error: true });
    } finally {
      setSubmitting(false);
    }
  };

  const updateCrawl = async (crawlId: string, action: 'retry' | 'stop' | 'rerun') => {
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/crawls/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crawlId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action}`);
      setActionMessage({ text: data.message || `Action ${action} executee`, error: false });
      fetchCrawls();
    } catch (error) {
      setActionMessage({ text: error instanceof Error ? error.message : String(error), error: true });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold break-words">🕷️ Crawl Management</h1>
          <p className="mt-1 text-sm text-gray-600 break-words">Pilotage des crawls et suivi des executions en temps reel.</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">
              Total {counts.total}
            </span>
            {Object.entries(counts.byStatus).map(([status, value]) => (
              <span key={status} className={`px-2 py-1 rounded ${getStatusColor(status)}`}>
                {status.toUpperCase()} {value}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="w-full sm:w-auto px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
        >
          + New Crawl
        </button>
      </div>

      {/* New Crawl Form */}
      {showNewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Crawl</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={createCrawl}>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.type}
                  onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="ASIC">ASIC v2.1</option>
                  <option value="ABN">ABN Lookup</option>
                  <option value="Firms">New Firms</option>
                  <option value="Macro">Macro Scan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Max Firms</label>
                <input
                  type="number"
                  value={form.maxFirms}
                  onChange={(e) => setForm(prev => ({ ...prev, maxFirms: Number(e.target.value) || 0 }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={form.priority}
                  onChange={(e) => setForm(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold disabled:opacity-60"
                >
                  {submitting ? 'Launching...' : 'Launch'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {actionMessage && (
        <div
          className={`rounded border px-3 py-2 text-sm ${
            actionMessage.error ? 'border-red-300 bg-red-50 text-red-700' : 'border-green-300 bg-green-50 text-green-700'
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Crawls Table */}
      <Card>
        <CardHeader>
          <CardTitle>Crawl History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">ID</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Start Time</th>
                  <th className="text-left py-2">Duration</th>
                  <th className="text-left py-2">Firms</th>
                  <th className="text-left py-2">Errors</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {crawls.map(crawl => (
                  <tr key={crawl.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">{crawl.id}</td>
                    <td className="py-3">{crawl.type || crawl.name || '-'}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(crawl.status)}`}>
                        {crawl.status.toUpperCase()}
                      </span>
                      {crawl.status === 'running' && crawl.progress && (
                        <div className="text-xs text-gray-600 mt-1">{crawl.progress}%</div>
                      )}
                    </td>
                    <td className="py-3">{new Date(crawl.startTime).toLocaleString()}</td>
                    <td className="py-3">{crawl.duration ? `${crawl.duration}s` : '-'}</td>
                    <td className="py-3">
                      {crawl.firmsProcessed}/{crawl.firmsCount}
                    </td>
                    <td className="py-3">{crawl.errors > 0 && <span className="text-red-600">{crawl.errors}</span>}</td>
                    <td className="py-3 space-x-2">
                      {crawl.status === 'running' && (
                        <button
                          onClick={() => updateCrawl(crawl.id, 'stop')}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Stop
                        </button>
                      )}
                      {(crawl.status === 'failed' || crawl.status === 'pending') && (
                        <button
                          onClick={() => updateCrawl(crawl.id, 'retry')}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Retry
                        </button>
                      )}
                      {crawl.status === 'success' && (
                        <button
                          onClick={() => updateCrawl(crawl.id, 'rerun')}
                          className="text-green-600 hover:underline text-xs"
                        >
                          Re-run
                        </button>
                      )}
                      <button
                        onClick={() => openCrawlLogs(crawl)}
                        className="text-gray-600 hover:underline text-xs"
                      >
                        Logs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Logs Modal */}
      {showLogs && selectedCrawl && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Logs - Crawl #{selectedCrawl.id}{selectedCrawl.type ? ` (${selectedCrawl.type})` : ''}</CardTitle>
              <button onClick={() => setShowLogs(false)} className="text-gray-600 hover:text-gray-800">
                ✕
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-xs h-64 overflow-y-auto">
              <pre>
                {logsLoading
                  ? 'Loading logs...'
                  : crawlLogs.join('\n')}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
