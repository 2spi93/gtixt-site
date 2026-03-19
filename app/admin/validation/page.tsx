'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FirmPending {
  id: string;
  name: string;
  country: string;
  abn?: string;
  status: 'pending' | 'approved' | 'rejected';
  enrichmentLevel: number;
  createdAt: string;
  notes?: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: string;
  duration?: number;
  icon: string;
}

interface PostValidationChecklist {
  firmId: string;
  firmName: string;
  items: ChecklistItem[];
  completedAt?: string;
}

export default function ValidationManagement() {
  const [firms, setFirms] = useState<FirmPending[]>([]);
  const [selectedFirm, setSelectedFirm] = useState<FirmPending | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [batchLoading, setBatchLoading] = useState(false);
  const [includeCounts, setIncludeCounts] = useState(true);
  const [postValidation, setPostValidation] = useState<PostValidationChecklist | null>(null);
  const [checklistRunning, setChecklistRunning] = useState(false);

  useEffect(() => {
    fetchFirms();
  }, [filter]);

  const fetchFirms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/validation/?status=${filter}&includeCounts=${includeCounts}`);
      const data = await res.json();
      setFirms(data.data || []);
      if (data.counts) {
        setCounts(data.counts);
      } else if (filter === 'all') {
        const allFirms: FirmPending[] = data.data || [];
        setCounts({
          all: allFirms.length,
          pending: allFirms.filter(f => f.status === 'pending').length,
          approved: allFirms.filter(f => f.status === 'approved').length,
          rejected: allFirms.filter(f => f.status === 'rejected').length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch firms:', error);
    } finally {
      setLoading(false);
    }
  };

  const callValidate = async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/admin/validation/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  };

  const validateFirm = async (firmId: string, approved: boolean) => {
    setSavingIds(prev => ({ ...prev, [firmId]: true }));
    try {
      const data = await callValidate({ firmId, approved });
      if (data.success) {
        // Get firm name for checklist
        const firm = firms.find(f => f.id === firmId);
        if (approved && firm) {
          // Trigger post-validation checklist for approved firms
          triggerPostValidationChecklist(firmId, firm.name);
        }
        fetchFirms();
        setSelectedFirm(null);
      }
    } catch (error) {
      console.error('Failed to validate firm:', error);
    } finally {
      setSavingIds(prev => ({ ...prev, [firmId]: false }));
    }
  };

  const undoValidation = async (firmId: string) => {
    setSavingIds(prev => ({ ...prev, [firmId]: true }));
    try {
      const data = await callValidate({ firmId, undo: true });
      if (data.success) {
        fetchFirms();
        setSelectedFirm(null);
      }
    } catch (error) {
      console.error('Failed to undo validation:', error);
    } finally {
      setSavingIds(prev => ({ ...prev, [firmId]: false }));
    }
  };

  const validateBatch = async (approved: boolean) => {
    const pendingFirms = firms.filter(firm => firm.status === 'pending');
    if (!pendingFirms.length) return;
    setBatchLoading(true);
    setSavingIds(prev => {
      const next = { ...prev };
      pendingFirms.forEach(firm => {
        next[firm.id] = true;
      });
      return next;
    });
    try {
      await callValidate({ firmIds: pendingFirms.map(firm => firm.id), approved });
      fetchFirms();
      setSelectedFirm(null);
    } catch (error) {
      console.error('Failed to validate batch:', error);
    } finally {
      setSavingIds({});
      setBatchLoading(false);
    }
  };

  const initializeChecklist = (firmId: string, firmName: string): ChecklistItem[] => {
    return [
      {
        id: 'data-validation',
        label: 'Full Data Validation',
        description: 'Validate domain, HTTPS status, and scoring',
        status: 'pending',
        icon: '🔍',
      },
      {
        id: 'evidence-review',
        label: 'Evidence Review',
        description: 'Verify sources and evidence quality',
        status: 'pending',
        icon: '📋',
      },
      {
        id: 'fraud-detection',
        label: 'Fraud Detection',
        description: 'Run anomaly detection analysis',
        status: 'pending',
        icon: '⚠️',
      },
      {
        id: 'competitor-mapping',
        label: 'Competitor Mapping',
        description: 'Map competitors and market positioning',
        status: 'pending',
        icon: '🗺️',
      },
      {
        id: 'client-briefing',
        label: 'Client Briefing Generation',
        description: 'Generate client briefing document',
        status: 'pending',
        icon: '📄',
      },
    ];
  };

  const triggerPostValidationChecklist = async (firmId: string, firmName: string) => {
    const items = initializeChecklist(firmId, firmName);
    setPostValidation({ firmId, firmName, items });
    setChecklistRunning(true);

    // Run checks sequentially with simulated timing
    for (let i = 0; i < items.length; i++) {
      const itemId = items[i].id;
      const startTime = Date.now();

      // Mark as running
      setPostValidation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(item =>
            item.id === itemId ? { ...item, status: 'running' as const } : item
          ),
        };
      });

      // Simulate check execution
      try {
        const res = await fetch('/api/admin/validation-check/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firmId, checkType: itemId }),
        });
        const data = await res.json();
        const duration = Date.now() - startTime;

        setPostValidation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map(item =>
              item.id === itemId
                ? {
                    ...item,
                    status: data.success ? 'success' : 'error',
                    result: data.result || (data.success ? '✓ Passed' : '✗ Failed'),
                    duration,
                  }
                : item
            ),
          };
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        setPostValidation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            items: prev.items.map(item =>
              item.id === itemId
                ? { ...item, status: 'error', result: 'Check failed', duration }
                : item
            ),
          };
        });
      }

      // Small delay between checks
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setChecklistRunning(false);
    setPostValidation(prev => (prev ? { ...prev, completedAt: new Date().toISOString() } : null));
  };

  const enrichmentColor = (level: number) => {
    if (level >= 80) return 'text-green-600 bg-green-50';
    if (level >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const statusBadgeClass = (status: FirmPending['status']) => {
    if (status === 'approved') {
      return 'border-emerald-300 bg-emerald-100 text-emerald-800';
    }
    if (status === 'rejected') {
      return 'border-rose-300 bg-rose-100 text-rose-800';
    }
    return 'border-cyan-300 bg-cyan-100 text-cyan-800';
  };

  const pendingCount = counts.pending;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Card className="border border-slate-200">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">✅ Manual Validation</h1>
              <p className="text-sm text-gray-600 mt-2">
                Validation pipeline: filter -&gt; review -&gt; decision -&gt; post-validation checks
              </p>
              {includeCounts && (
                <div className="text-sm text-gray-600 mt-1">
                  {pendingCount} pending validation(s)
                </div>
              )}
            </div>
            <button
              onClick={() => setIncludeCounts(!includeCounts)}
              className={`px-3 py-2 rounded text-xs font-semibold self-start md:self-auto ${
                includeCounts
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
              title="Toggle count fetching for performance"
            >
              {includeCounts ? '👁 Counts ON' : '👁 Counts OFF'}
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200">
        <CardContent className="pt-6 space-y-4">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-3">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded font-semibold transition ${
                  filter === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status === 'all' ? '📋 All' : status === 'pending' ? '⏳ Pending' : status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                {status === 'all' && ` (${counts.all})`}
                {status === 'pending' && ` (${counts.pending})`}
                {status === 'approved' && ` (${counts.approved})`}
                {status === 'rejected' && ` (${counts.rejected})`}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => validateBatch(true)}
              disabled={filter !== 'pending' || batchLoading}
              className="px-4 py-2 rounded font-semibold bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300 disabled:text-gray-600"
            >
              ✅ Approve All Pending
            </button>
            <button
              onClick={() => validateBatch(false)}
              disabled={filter !== 'pending' || batchLoading}
              className="px-4 py-2 rounded font-semibold bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300 disabled:text-gray-600"
            >
              ❌ Reject All Pending
            </button>
            {filter !== 'pending' && (
              <span className="text-sm text-gray-500">Switch to Pending to run batch actions.</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Institutional list container */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle className="text-xl">Validation Queue</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Review each firm in sequence: identity, status, enrichment, then decision.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {firms.length} firm{firms.length > 1 ? 's' : ''} visible
            </span>
          </div>
        </CardHeader>

        <CardContent className="pt-2 space-y-6">
          {firms.map((firm) => (
            <div
              key={firm.id}
              className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/70 p-5 shadow-sm transition hover:border-cyan-300 hover:shadow-md"
              onClick={() => setSelectedFirm(firm)}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Col 1: Identity */}
                <div className="lg:col-span-5 min-w-0 space-y-3">
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Firm Identity</p>
                    <h3 className="text-xl font-semibold text-slate-900 leading-snug break-words [overflow-wrap:anywhere]">
                      {firm.name}
                    </h3>
                    <p className="text-sm text-slate-600 break-words [overflow-wrap:anywhere]">{firm.country}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(firm.status)}`}>
                      {firm.status.toUpperCase()}
                    </span>
                    {firm.abn && (
                      <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-mono text-slate-700">
                        ABN {firm.abn}
                      </span>
                    )}
                  </div>
                </div>

                {/* Col 2: Metrics */}
                <div className="lg:col-span-4 space-y-4">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Quality Metrics</p>

                  <div>
                    <p className="text-sm text-slate-600 mb-2">Enrichment Level</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded h-2.5">
                        <div
                          className="bg-cyan-500 rounded h-2.5 transition"
                          style={{ width: `${firm.enrichmentLevel}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${enrichmentColor(firm.enrichmentLevel)}`}>
                        {firm.enrichmentLevel}%
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.1em] text-slate-500">Added</p>
                    <p className="text-sm font-medium text-slate-800 mt-1">{new Date(firm.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Col 3: Actions */}
                <div className="lg:col-span-3 space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Actions</p>

                  {firm.status === 'pending' ? (
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          validateFirm(firm.id, true);
                        }}
                        disabled={savingIds[firm.id]}
                        className="w-full px-3 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded-lg font-semibold"
                      >
                        {savingIds[firm.id] ? 'Saving...' : '✅ Approve'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          validateFirm(firm.id, false);
                        }}
                        disabled={savingIds[firm.id]}
                        className="w-full px-3 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-300 text-white rounded-lg font-semibold"
                      >
                        {savingIds[firm.id] ? 'Saving...' : '❌ Reject'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        undoValidation(firm.id);
                      }}
                      disabled={savingIds[firm.id]}
                      className="w-full px-3 py-2.5 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-800 rounded-lg font-semibold"
                    >
                      {savingIds[firm.id] ? 'Saving...' : '↩ Undo to Pending'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {!loading && firms.length === 0 && (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="py-10 text-center text-gray-600">
                No firms found for the current filter.
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Context panel */}
      {selectedFirm && (
        <Card className="border-2 border-blue-300">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Firm Details - {selectedFirm.name}</CardTitle>
              <button
                onClick={() => setSelectedFirm(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Name</label>
                  <p className="font-semibold break-words [overflow-wrap:anywhere]">{selectedFirm.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Country</label>
                  <p className="font-semibold">{selectedFirm.country}</p>
                </div>
                {selectedFirm.abn && (
                  <div>
                    <label className="text-sm text-gray-600">ABN</label>
                    <p className="font-mono font-semibold break-all">{selectedFirm.abn}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600">Status</label>
                  <p className="font-semibold">{selectedFirm.status}</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600">Enrichment Level</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded h-3">
                    <div
                      className="bg-green-500 rounded h-3"
                      style={{ width: `${selectedFirm.enrichmentLevel}%` }}
                    />
                  </div>
                  <span className="font-semibold">{selectedFirm.enrichmentLevel}%</span>
                </div>
              </div>

              {selectedFirm.notes && (
                <div>
                  <label className="text-sm text-gray-600">Notes</label>
                  <p className="mt-1 p-3 bg-gray-50 rounded">{selectedFirm.notes}</p>
                </div>
              )}

              {selectedFirm.status === 'pending' && (
                <div className="flex gap-2 mt-6 pt-4 border-t">
                  <button
                    onClick={() => validateFirm(selectedFirm.id, true)}
                    disabled={savingIds[selectedFirm.id]}
                    className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded font-semibold"
                  >
                    {savingIds[selectedFirm.id] ? 'Saving...' : '✅ Approve Firm'}
                  </button>
                  <button
                    onClick={() => validateFirm(selectedFirm.id, false)}
                    disabled={savingIds[selectedFirm.id]}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded font-semibold"
                  >
                    {savingIds[selectedFirm.id] ? 'Saving...' : '❌ Reject Firm'}
                  </button>
                </div>
              )}
              {selectedFirm.status !== 'pending' && (
                <div className="mt-6 pt-4 border-t">
                  <button
                    onClick={() => undoValidation(selectedFirm.id)}
                    disabled={savingIds[selectedFirm.id]}
                    className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 rounded font-semibold"
                  >
                    {savingIds[selectedFirm.id] ? 'Saving...' : '↩ Undo to Pending'}
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post-Validation Checklist */}
      {postValidation && (
        <Card className="border-2 border-cyan-400 bg-gradient-to-br from-gray-900 to-gray-800">
          <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">✅ Post-Validation Checklist</CardTitle>
                <p className="text-sm text-cyan-100 mt-2">{postValidation.firmName}</p>
              </div>
              <button
                onClick={() => setPostValidation(null)}
                disabled={checklistRunning}
                className="text-white hover:text-cyan-200 disabled:text-gray-400"
              >
                ✕
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {postValidation.items.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-4 p-4 rounded border-l-4 transition ${
                  item.status === 'pending'
                    ? 'border-l-gray-400 bg-gray-700'
                    : item.status === 'running'
                    ? 'border-l-yellow-500 bg-yellow-900/20 animate-pulse'
                    : item.status === 'success'
                    ? 'border-l-green-500 bg-green-900/20'
                    : 'border-l-red-500 bg-red-900/20'
                }`}
              >
                <div className="flex-shrink-0 text-2xl mt-1">{item.icon}</div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{item.label}</p>
                  <p className="text-sm text-gray-300">{item.description}</p>
                  {item.result && (
                    <p
                      className={`text-xs mt-2 font-mono ${
                        item.status === 'success' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {item.result}
                    </p>
                  )}
                  {item.duration && (
                    <p className="text-xs text-gray-400 mt-1">{(item.duration / 1000).toFixed(2)}s</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  {item.status === 'pending' && <span className="text-gray-400">⏳</span>}
                  {item.status === 'running' && <span className="text-yellow-400 animate-spin">⚙️</span>}
                  {item.status === 'success' && <span className="text-green-400">✓</span>}
                  {item.status === 'error' && <span className="text-red-400">✗</span>}
                </div>
              </div>
            ))}

            {!checklistRunning && postValidation.completedAt && (
              <div className="mt-6 pt-4 border-t border-gray-600">
                <div className="text-center">
                  <p className="text-sm text-gray-400">
                    Checklist completed at{' '}
                    {new Date(postValidation.completedAt).toLocaleTimeString()}
                  </p>
                  <button
                    onClick={() => setPostValidation(null)}
                    className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded font-semibold"
                  >
                    Close Checklist
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
