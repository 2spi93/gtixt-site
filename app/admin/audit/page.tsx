'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { adminFetch, useAdminAuth } from '@/lib/admin-auth-guard';
import { useRouter } from 'next/navigation';

interface AuditOperation {
  id: string;
  timestamp: string;
  user: string;
  operationType: string;
  resource: string;
  action: string;
  result: 'success' | 'error';
  details: Record<string, any>;
}

interface AuditStats {
  total: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  byType: Record<string, number>;
  byUser: Record<string, number>;
  byResource: Record<string, number>;
}

type ViewMode = 'timeline' | 'table' | 'analytics';

export default function AuditHistory() {
  const auth = useAdminAuth();
  const router = useRouter();
  const [operations, setOperations] = useState<AuditOperation[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [filters, setFilters] = useState({
    user: '',
    operationType: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    resource: '',
  });
  const [selectedOp, setSelectedOp] = useState<AuditOperation | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.loading && auth.user && !['admin', 'auditor'].includes(auth.user.role)) {
      router.push('/admin');
    }
  }, [auth.loading, auth.user, router]);

  useEffect(() => {
    if (!auth.loading && auth.authenticated) {
      fetchOperations();
    }
  }, [filters, auth.loading, auth.authenticated]);

  const fetchOperations = async () => {
    try {
      setError(null);
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.user) params.append('userId', filters.user);
      if (filters.operationType) params.append('action', filters.operationType);
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('from', filters.dateFrom);
      if (filters.dateTo) params.append('to', filters.dateTo);

      const res = await adminFetch(`/api/admin/audit-trail?${params.toString()}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      
      const data = await res.json();
      const rawLogs = Array.isArray(data.data) ? data.data : [];
      const mapped = rawLogs.map((log: any) => ({
        id: log.id,
        timestamp: log.createdAt,
        user: log.userId || 'system',
        operationType: log.action || 'action',
        resource: log.filePath || log.environment || 'system',
        action: log.action || 'action',
        result: log.success ? 'success' : 'error',
        details: log.details || {},
      }));
      setOperations(mapped);
      
      if (data.data && Array.isArray(data.data)) {
        const successCount = data.data.filter((op: AuditOperation) => op.result === 'success').length;
        const errorCount = data.data.filter((op: AuditOperation) => op.result === 'error').length;
        const total = data.data.length;
        
        const byType: Record<string, number> = {};
        const byUser: Record<string, number> = {};
        const byResource: Record<string, number> = {};
        
        mapped.forEach((op: AuditOperation) => {
          byType[op.operationType] = (byType[op.operationType] || 0) + 1;
          byUser[op.user] = (byUser[op.user] || 0) + 1;
          byResource[op.resource] = (byResource[op.resource] || 0) + 1;
        });
        
        setStats({
          total,
          successCount,
          errorCount,
          successRate: total > 0 ? Math.round((successCount / total) * 100) : 0,
          byType,
          byUser,
          byResource,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch operations';
      setError(message);
      console.error('Failed to fetch operations:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    const params = new URLSearchParams();
    if (filters.user) params.append('userId', filters.user);
    if (filters.operationType) params.append('action', filters.operationType);
    if (filters.status) params.append('status', filters.status);
    if (filters.dateFrom) params.append('from', filters.dateFrom);
    if (filters.dateTo) params.append('to', filters.dateTo);
    window.location.href = `/api/admin/audit-trail/export?${params.toString()}`;
  };

  const getResultColor = (result: string) => {
    return result === 'success' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      crawl: 'bg-blue-100 text-blue-700',
      job: 'bg-purple-100 text-purple-700',
      plan: 'bg-orange-100 text-orange-700',
      setting: 'bg-gray-100 text-gray-700',
      validation: 'bg-green-100 text-green-700',
      export: 'bg-indigo-100 text-indigo-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const groupOperationsByDate = () => {
    const grouped: Record<string, AuditOperation[]> = {};
    operations.forEach(op => {
      const date = new Date(op.timestamp).toLocaleDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(op);
    });
    return Object.entries(grouped).reverse();
  };

  const downloadCSV = () => {
    exportCsv();
  };

  const downloadJSON = () => {
    const json = JSON.stringify(operations, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Hero Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">📋 <span className="text-[#0A8A9F]">Audit</span> & Compliance</h1>
            <p className="text-gray-600 mt-3 text-lg">Complete operation history, filtering, and analytics</p>
          </div>
          <div className="flex gap-3">
            <button onClick={downloadCSV} className="px-5 py-3 bg-[#0A8A9F] hover:bg-[#087080] text-white rounded-xl font-semibold transition shadow-sm">
              📥 CSV
            </button>
            <button onClick={downloadJSON} className="px-5 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition shadow-sm">
              📥 JSON
            </button>
          </div>
        </div>
      </div>

      {/* Error handling */}
      {error && (
        <div className="bg-white rounded-xl shadow-sm border border-red-300 border-l-4 border-l-red-500 p-6 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-bold text-red-900">Error Loading Audit Data</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <button onClick={fetchOperations} className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded text-sm font-medium">
                🔄 Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Selector */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => setViewMode('timeline')} className={`px-5 py-3 rounded-xl font-semibold transition ${
            viewMode === 'timeline'
              ? 'bg-[#0A8A9F] text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-[#0A8A9F]'
          }`}>
          📅 Timeline
        </button>
        <button onClick={() => setViewMode('table')} className={`px-5 py-3 rounded-xl font-semibold transition ${
            viewMode === 'table'
              ? 'bg-[#0A8A9F] text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-[#0A8A9F]'
          }`}>
          📊 Table
        </button>
        <button onClick={() => setViewMode('analytics')} className={`px-5 py-3 rounded-xl font-semibold transition ${
            viewMode === 'analytics'
              ? 'bg-[#0A8A9F] text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-[#0A8A9F]'
          }`}>
          📈 Analytics
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-bold text-[#0A8A9F] mb-4">🔍 Advanced Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">User</label>
            <input type="text" placeholder="Filter by user..." value={filters.user} onChange={e => setFilters({ ...filters, user: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#0A8A9F] focus:border-[#0A8A9F]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Operation Type</label>
            <select value={filters.operationType} onChange={e => setFilters({ ...filters, operationType: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-[#0A8A9F] focus:border-[#0A8A9F]">
              <option value="">All Types</option>
              <option value="crawl">🕷️ Crawl</option>
              <option value="job">⚙️ Job</option>
              <option value="plan">📅 Plan</option>
              <option value="setting">⚙️ Setting</option>
              <option value="validation">✅ Validation</option>
              <option value="export">📥 Export</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-[#0A8A9F] focus:border-[#0A8A9F]">
              <option value="">All Status</option>
              <option value="success">✅ Success</option>
              <option value="error">❌ Error</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Resource</label>
            <input type="text" placeholder="Filter by resource..." value={filters.resource} onChange={e => setFilters({ ...filters, resource: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#0A8A9F] focus:border-[#0A8A9F]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">From Date</label>
            <input type="date" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-[#0A8A9F] focus:border-[#0A8A9F]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">To Date</label>
            <input type="date" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-[#0A8A9F] focus:border-[#0A8A9F]" />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="text-sm font-semibold text-[#0A8A9F]">Total Operations</div>
            <div className="text-3xl font-bold text-gray-900 mt-3">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="text-sm font-semibold text-green-600">✅ Success</div>
            <div className="text-3xl font-bold text-gray-900 mt-3">{stats.successCount}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="text-sm font-semibold text-red-600">❌ Errors</div>
            <div className="text-3xl font-bold text-gray-900 mt-3">{stats.errorCount}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="text-sm font-semibold text-[#0A8A9F]">Success Rate</div>
            <div className="text-3xl font-bold text-gray-900 mt-3">{stats.successRate}%</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="text-sm font-semibold text-[#0A8A9F]">Unique Users</div>
            <div className="text-3xl font-bold text-gray-900 mt-3">{Object.keys(stats.byUser).length}</div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-500">⏳ Loading audit data...</div>
        </div>
      )}

      {/* Timeline View */}
      {!loading && viewMode === 'timeline' && (
        <div className="space-y-6">
          {groupOperationsByDate().map(([date, dayOps]) => (
            <div key={date}>
              <h3 className="text-lg font-bold text-[#0A8A9F] mb-4">📅 {date}</h3>
              <div className="space-y-3">
                {dayOps.map(op => (
                  <div key={op.id} className={`bg-white rounded-xl shadow-sm border-l-4 p-5 cursor-pointer hover:shadow-md transition ${op.result === 'success' ? 'border-l-green-500' : 'border-l-red-500'} border-r border-t border-b border-gray-200`} onClick={() => setSelectedOp(op)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#0A8A9F]/10 text-[#0A8A9F] border border-[#0A8A9F]/30">{op?.operationType ? op.operationType.toUpperCase() : 'UNKNOWN'}</span>
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${op?.result === 'success' ? 'bg-green-50 text-green-700 border border-green-300' : 'bg-red-50 text-red-700 border border-red-300'}`}>{op?.result === 'success' ? '✅ SUCCESS' : '❌ ERROR'}</span>
                        </div>
                        <div className="text-sm text-gray-900 font-semibold">{op.action}</div>
                        <div className="text-xs text-gray-600 mt-2">👤 {op.user} • 🔗 {op.resource} • ⏱️ {new Date(op.timestamp).toLocaleTimeString()}</div>
                      </div>
                      <div className="text-right">
                        <button className="text-[#0A8A9F] hover:text-[#087080] font-semibold text-sm px-3 py-1 rounded-lg bg-[#0A8A9F]/10 border border-[#0A8A9F]/30 hover:bg-[#0A8A9F]/20 transition">Details →</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {!loading && viewMode === 'table' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-[#0A8A9F]">📊 Operation Log</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-4 font-bold text-[#0A8A9F]">Timestamp</th>
                  <th className="text-left py-4 px-4 font-bold text-[#0A8A9F]">User</th>
                  <th className="text-left py-4 px-4 font-bold text-[#0A8A9F]">Type</th>
                  <th className="text-left py-4 px-4 font-bold text-[#0A8A9F]">Resource</th>
                  <th className="text-left py-4 px-4 font-bold text-[#0A8A9F]">Action</th>
                  <th className="text-left py-4 px-4 font-bold text-[#0A8A9F]">Result</th>
                  <th className="text-left py-4 px-4 font-bold text-[#0A8A9F]">Details</th>
                </tr>
              </thead>
              <tbody>
                {operations.slice(0, 50).map(op => (
                  <tr key={op.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-4 px-4 text-gray-600 text-xs font-mono">{new Date(op.timestamp).toLocaleString('fr-FR')}</td>
                    <td className="py-4 px-4 font-mono text-xs text-gray-900">{op.user}</td>
                    <td className="py-4 px-4"><span className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#0A8A9F]/10 text-[#0A8A9F] border border-[#0A8A9F]/30">{op?.operationType ? op.operationType.toUpperCase() : 'UNKNOWN'}</span></td>
                    <td className="py-4 px-4 font-mono text-xs max-w-xs truncate text-gray-700">{op?.resource || 'N/A'}</td>
                    <td className="py-4 px-4 text-gray-900">{op?.action || 'N/A'}</td>
                    <td className="py-4 px-4"><span className={`px-3 py-1 rounded-lg text-xs font-semibold ${op?.result === 'success' ? 'bg-green-50 text-green-700 border border-green-300' : 'bg-red-50 text-red-700 border border-red-300'}`}>{op?.result ? op.result.toUpperCase() : 'UNKNOWN'}</span></td>
                    <td className="py-4 px-4"><button onClick={() => setSelectedOp(op)} className="text-[#0A8A9F] hover:text-[#087080] text-xs font-semibold px-3 py-1 rounded-lg bg-[#0A8A9F]/10 border border-[#0A8A9F]/30 hover:bg-[#0A8A9F]/20 transition">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {operations.length > 50 && <div className="text-center py-4 text-gray-600 text-sm font-medium">Showing 50 of {operations.length} operations</div>}
          </div>
        </div>
      )}

      {/* Analytics View */}
      {!loading && viewMode === 'analytics' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-xl mb-4 text-[#0A8A9F]">📈 Operations by Type</h3>
            <div className="space-y-4">
              {Object.entries(stats.byType).sort(([, a], [, b]) => b - a).map(([type, count]) => (
                <div key={type}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold capitalize text-gray-900">{type}</span>
                    <span className="text-sm font-bold text-[#0A8A9F]">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 border border-gray-200">
                    <div className="h-3 rounded-full bg-[#0A8A9F]" style={{ width: `${(count / stats.total) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-xl mb-4 text-[#0A8A9F]">👥 Top Users</h3>
            <div className="space-y-4">
              {Object.entries(stats.byUser).sort(([, a], [, b]) => b - a).slice(0, 5).map(([user, count]) => (
                <div key={user}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold truncate text-gray-900">{user}</span>
                    <span className="text-sm font-bold text-[#0A8A9F]">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 border border-gray-200">
                    <div className="h-3 rounded-full bg-[#0A8A9F]" style={{ width: `${(count / Math.max(...Object.values(stats.byUser))) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-xl mb-4 text-[#0A8A9F]">🔗 Top Resources</h3>
            <div className="space-y-4">
              {Object.entries(stats.byResource).sort(([, a], [, b]) => b - a).slice(0, 5).map(([resource, count]) => (
                <div key={resource}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold truncate text-gray-900">{resource}</span>
                    <span className="text-sm font-bold text-[#0A8A9F]">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 border border-gray-200">
                    <div className="h-3 rounded-full bg-[#0A8A9F]" style={{ width: `${(count / Math.max(...Object.values(stats.byResource))) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-xl mb-4 text-[#0A8A9F]">📊 Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-700">Total Operations</span><span className="font-bold text-gray-900">{stats.total}</span></div>
              <div className="flex justify-between"><span className="text-gray-700">Success Rate</span><span className="font-bold text-green-600">{stats.successRate}%</span></div>
              <div className="flex justify-between"><span className="text-gray-700">Error Rate</span><span className="font-bold text-red-600">{100 - stats.successRate}%</span></div>
              <div className="flex justify-between"><span className="text-gray-700">Unique Users</span><span className="font-bold text-gray-900">{Object.keys(stats.byUser).length}</span></div>
              <div className="flex justify-between"><span className="text-gray-700">Unique Resources</span><span className="font-bold text-gray-900">{Object.keys(stats.byResource).length}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedOp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-300 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="text-3xl">{selectedOp.result === 'success' ? '✅' : '❌'}</span>
                  <span className="text-[#0A8A9F]">{selectedOp.operationType}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-sm text-gray-700 font-mono">{selectedOp.resource}</span>
                </h3>
                <button onClick={() => setSelectedOp(null)} className="text-gray-500 hover:text-gray-700 hover:bg-red-50 rounded-full w-10 h-10 flex items-center justify-center font-bold transition border border-gray-300 hover:border-red-400">✕</button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <div className="text-xs font-semibold text-[#0A8A9F]">Timestamp</div>
                    <p className="text-sm font-mono font-semibold mt-2 text-gray-900">{new Date(selectedOp.timestamp).toLocaleString('fr-FR')}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <div className="text-xs font-semibold text-[#0A8A9F]">User</div>
                    <p className="text-sm font-semibold mt-2 text-gray-900">👤 {selectedOp.user}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <div className="text-xs font-semibold text-[#0A8A9F]">Operation Type</div>
                    <p className="text-sm font-semibold mt-2 inline-block px-3 py-1 rounded-lg bg-[#0A8A9F]/10 text-[#0A8A9F] border border-[#0A8A9F]/30">{selectedOp?.operationType ? selectedOp.operationType.toUpperCase() : 'UNKNOWN'}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg md:col-span-2">
                    <div className="text-xs font-semibold text-[#0A8A9F]">Resource</div>
                    <p className="text-sm font-mono font-semibold mt-2 break-all text-gray-900">{selectedOp.resource}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <div className="text-xs font-semibold text-[#0A8A9F]">Result</div>
                    <p className={`text-sm font-semibold mt-2 inline-block px-3 py-1 rounded-lg ${selectedOp?.result === 'success' ? 'bg-green-50 text-green-700 border border-green-300' : 'bg-red-50 text-red-700 border border-red-300'}`}>{selectedOp?.result ? selectedOp.result.toUpperCase() : 'UNKNOWN'}</p>
                  </div>
                </div>

                <div className="bg-[#0A8A9F]/10 border border-[#0A8A9F]/30 p-5 rounded-lg">
                  <div className="text-sm font-semibold text-[#0A8A9F]">Action Performed</div>
                  <p className="text-lg font-bold text-gray-900 mt-2">{selectedOp.action}</p>
                </div>

                {Object.keys(selectedOp.details).length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-[#0A8A9F] mb-3">📋 Detailed Payload</div>
                    <div className="bg-gray-900 border border-gray-700 p-5 rounded-lg font-mono text-xs max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap break-words text-green-400">{JSON.stringify(selectedOp.details, null, 2)}</pre>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button onClick={() => { const json = JSON.stringify(selectedOp, null, 2); navigator.clipboard.writeText(json); }} className="px-5 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 rounded-lg font-semibold transition">
                    📋 Copy
                  </button>
                  <button onClick={() => setSelectedOp(null)} className="px-5 py-3 bg-[#0A8A9F] hover:bg-[#087080] text-white rounded-lg font-semibold transition ml-auto">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
