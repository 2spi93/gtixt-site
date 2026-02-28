'use client';
export const dynamic = 'force-dynamic';

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

  const pendingCount = counts.pending;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">✅ Manual Validation</h1>
          {includeCounts && (
            <div className="text-sm text-gray-600 mt-2">
              {pendingCount} pending validation(s)
            </div>
          )}
        </div>
        <button
          onClick={() => setIncludeCounts(!includeCounts)}
          className={`px-3 py-1 rounded text-xs font-semibold ${
            includeCounts
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
          title="Toggle count fetching for performance"
        >
          {includeCounts ? '👁 Counts ON' : '👁 Counts OFF'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
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
          <span className="text-sm text-gray-500 self-center">Switch to Pending to run batch actions.</span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4">
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

      {/* Firms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {firms.map(firm => (
          <Card
            key={firm.id}
            className={`cursor-pointer border-2 hover:border-blue-400 transition ${
              firm.status === 'approved'
                ? 'border-green-300 bg-green-50'
                : firm.status === 'rejected'
                ? 'border-red-300 bg-red-50'
                : 'border-yellow-300 bg-yellow-50'
            }`}
            onClick={() => setSelectedFirm(firm)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{firm.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{firm.country}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    firm.status === 'pending'
                      ? 'bg-yellow-200 text-yellow-800'
                      : firm.status === 'approved'
                      ? 'bg-green-200 text-green-800'
                      : 'bg-red-200 text-red-800'
                  }`}
                >
                  {firm.status.toUpperCase()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {firm.abn && (
                  <div>
                    <p className="text-xs text-gray-600">ABN</p>
                    <p className="font-mono font-semibold">{firm.abn}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-600">Enrichment Level</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded h-2">
                      <div
                        className="bg-blue-500 rounded h-2 transition"
                        style={{ width: `${firm.enrichmentLevel}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${enrichmentColor(firm.enrichmentLevel)}`}>
                      {firm.enrichmentLevel}%
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-600">Added</p>
                  <p className="text-sm">{new Date(firm.createdAt).toLocaleDateString()}</p>
                </div>

                {firm.status === 'pending' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        validateFirm(firm.id, true);
                      }}
                      disabled={savingIds[firm.id]}
                      className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded font-semibold"
                    >
                      {savingIds[firm.id] ? 'Saving...' : '✅ Approve'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        validateFirm(firm.id, false);
                      }}
                      disabled={savingIds[firm.id]}
                      className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded font-semibold"
                    >
                      {savingIds[firm.id] ? 'Saving...' : '❌ Reject'}
                    </button>
                  </div>
                )}
                {firm.status !== 'pending' && (
                  <div className="mt-4 pt-4 border-t">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        undoValidation(firm.id);
                      }}
                      disabled={savingIds[firm.id]}
                      className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 rounded font-semibold"
                    >
                      {savingIds[firm.id] ? 'Saving...' : '↩ Undo to Pending'}
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Modal */}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Name</label>
                  <p className="font-semibold">{selectedFirm.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Country</label>
                  <p className="font-semibold">{selectedFirm.country}</p>
                </div>
                {selectedFirm.abn && (
                  <div>
                    <label className="text-sm text-gray-600">ABN</label>
                    <p className="font-mono font-semibold">{selectedFirm.abn}</p>
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

      {/* Post-Validation Checklist Modal */}
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
            {postValidation.items.map((item, index) => (
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
