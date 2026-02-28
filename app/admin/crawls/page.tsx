'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Crawl {
  id: string;
  type: 'ASIC' | 'ABN' | 'Firms' | 'Macro';
  status: 'pending' | 'running' | 'success' | 'failed';
  startTime: string;
  endTime?: string;
  duration?: number;
  firmsCount: number;
  firmsProcessed: number;
  errors: number;
  userId: string;
  progress?: number;
  logs?: string;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCrawls();
    const interval = setInterval(fetchCrawls, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchCrawls = async () => {
    try {
      const res = await fetch('/api/admin/crawls/');
      const data = await res.json();
      setCrawls(data.data || []);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (error) {
      console.error('Failed to fetch crawls:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">🕷️ Crawl Management</h1>
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
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
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
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select className="w-full border rounded px-3 py-2">
                  <option value="ASIC">ASIC v2.1</option>
                  <option value="ABN">ABN Lookup</option>
                  <option value="Firms">New Firms</option>
                  <option value="Macro">Macro Scan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Max Firms</label>
                <input type="number" defaultValue="100" className="w-full border rounded px-3 py-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select className="w-full border rounded px-3 py-2">
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
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold"
                >
                  Launch
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
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
                    <td className="py-3">{crawl.type}</td>
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
                        <button className="text-red-600 hover:underline text-xs">Stop</button>
                      )}
                      {(crawl.status === 'failed' || crawl.status === 'pending') && (
                        <button className="text-blue-600 hover:underline text-xs">Retry</button>
                      )}
                      {crawl.status === 'success' && (
                        <button className="text-green-600 hover:underline text-xs">Re-run</button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedCrawl(crawl);
                          setShowLogs(true);
                        }}
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
              <CardTitle>Logs - Crawl #{selectedCrawl.id} ({selectedCrawl.type})</CardTitle>
              <button onClick={() => setShowLogs(false)} className="text-gray-600 hover:text-gray-800">
                ✕
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-xs h-64 overflow-y-auto">
              <pre>{selectedCrawl.logs || '[No logs available]'}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
