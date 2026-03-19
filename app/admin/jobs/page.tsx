'use client';

import { useEffect, useState } from 'react';

interface Job {
  id: string;
  name: string;
  category: 'enrichment' | 'scoring' | 'maintenance';
  description: string;
  lastRun?: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  enabled: boolean;
}

interface JobExecution {
  id: string;
  jobName: string;
  status: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  user: string;
  output?: string;
  error?: string;
}

interface RiskAlertDispatch {
  firm_id: string;
  firm_name: string;
  snapshot_date: string;
  alert_type: string;
  reason?: string | null;
  sent_slack: boolean;
  sent_email: boolean;
  current_category?: string | null;
  current_score?: number;
  delta?: number;
  created_at: string;
}

interface RiskAlertSummary {
  total_dispatches: number;
  dispatches_24h: number;
  slack_sent_24h: number;
  email_sent_24h: number;
  by_type: Record<string, number>;
  latest: RiskAlertDispatch[];
  note?: string;
}

export default function JobsManagement() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobExecution | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<{ totalJobs: number; executionsByStatus: Record<string, number> } | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [riskSummary, setRiskSummary] = useState<RiskAlertSummary | null>(null);

  useEffect(() => {
    fetchJobs();
    fetchExecutions();
    fetchRiskSummary();
    const interval = setInterval(() => {
      fetchJobs();
      fetchExecutions();
      fetchRiskSummary();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/admin/jobs/');
      const data = await res.json();
      const normalized = (data.data || []).map((job: any) => ({
        ...job,
        status: job.status === 'completed' ? 'success' : job.status,
      }));
      setJobs(normalized);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutions = async () => {
    try {
      const res = await fetch('/api/admin/jobs/executions/');
      const data = await res.json();
      const normalized = (data.data || []).map((exec: any) => ({
        ...exec,
        status: exec.status === 'completed' ? 'success' : exec.status === 'queued' ? 'running' : exec.status,
      }));
      setExecutions(normalized);
    } catch (error) {
      console.error('Failed to fetch executions:', error);
    }
  };

  const fetchRiskSummary = async () => {
    try {
      const res = await fetch('/api/admin/jobs/risk-alerts/summary');
      const data = await res.json();
      if (res.ok && data?.success) {
        setRiskSummary(data.data || null);
      }
    } catch (error) {
      console.error('Failed to fetch risk summary:', error);
    }
  };

  const executeJob = async (jobName: string) => {
    try {
      setActionMessage(null);
      const res = await fetch('/api/admin/jobs/execute/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to execute job');
      setActionMessage({ text: `${jobName} lance avec succes`, error: false });
      fetchJobs();
      fetchExecutions();
    } catch (error) {
      console.error('Failed to execute job:', error);
      setActionMessage({ text: error instanceof Error ? error.message : String(error), error: true });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'enrichment':
        return 'bg-purple-50 text-purple-700';
      case 'scoring':
        return 'bg-blue-50 text-blue-700';
      case 'maintenance':
        return 'bg-amber-50 text-amber-700';
      default:
        return 'bg-gray-50 text-gray-700';
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
      case 'disabled':
        return 'text-amber-700 bg-amber-50';
      case 'idle':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getOutputText = (exec: JobExecution) => {
    if (exec.output && exec.output.trim().length > 0) return exec.output;
    if (exec.error && exec.error.trim().length > 0) return `[ERROR]\n${exec.error}`;
    if (exec.status === 'running') return '[Job is still running. Output will appear when logs are flushed.]';
    if (exec.status === 'failed') return '[No output captured for this failed run. Check /admin/logs (severity=error) for full diagnostics.]';
    if (exec.status === 'success') return '[Job completed successfully. No verbose output was persisted for this run.]';
    return '[No output available yet]';
  };

  const getStatusTextColor = (status: string) => {
    if (status === 'success') return 'text-green-600';
    if (status === 'failed') return 'text-red-600';
    if (status === 'running') return 'text-blue-600';
    return 'text-gray-700';
  };

  const formatJobLabel = (jobName: string) =>
    jobName
      .split('_')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 break-words">⚙️ <span className="text-[#0A8A9F]">Jobs</span> & Scripts</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600 break-words">Execution des scripts avec suivi des sorties et des statuts en temps reel.</p>
        {counts && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium">
              Total Jobs {counts.totalJobs}
            </span>
            {Object.entries(counts.executionsByStatus).map(([status, value]) => (
              <span key={status} className={`px-3 py-1 rounded-lg font-medium ${getStatusColor(status)}`}>
                {status.toUpperCase()} {value}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Available Jobs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-[#0A8A9F] mb-6">Available Jobs</h2>
        {actionMessage && (
          <div
            className={`mb-4 rounded border px-3 py-2 text-sm ${
              actionMessage.error ? 'border-red-300 bg-red-50 text-red-700' : 'border-green-300 bg-green-50 text-green-700'
            }`}
          >
            {actionMessage.text}
          </div>
        )}
        {loading && <p className="mb-3 text-sm text-gray-500">Chargement des jobs...</p>}

        {/* Risk Alerts Summary */}
        <div className="mb-6 p-4 rounded-lg border border-amber-200 bg-amber-50/60">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
            <div>
              <h3 className="font-bold text-amber-800 text-base">Risk Alerts Dispatch</h3>
              <p className="text-xs text-amber-700">Surveillance des escalades High/Critical et envois Slack/Email.</p>
            </div>
            <button
              onClick={() => executeJob('risk_alerts')}
              className="px-3 py-2 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm"
            >
              Run Risk Alerts
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
            <div className="p-3 rounded bg-white border border-amber-100">
              <p className="text-gray-500 text-xs">Total Dispatches</p>
              <p className="font-bold text-gray-900">{riskSummary?.total_dispatches ?? 0}</p>
            </div>
            <div className="p-3 rounded bg-white border border-amber-100">
              <p className="text-gray-500 text-xs">24h Dispatches</p>
              <p className="font-bold text-gray-900">{riskSummary?.dispatches_24h ?? 0}</p>
            </div>
            <div className="p-3 rounded bg-white border border-amber-100">
              <p className="text-gray-500 text-xs">Slack Sent (24h)</p>
              <p className="font-bold text-gray-900">{riskSummary?.slack_sent_24h ?? 0}</p>
            </div>
            <div className="p-3 rounded bg-white border border-amber-100">
              <p className="text-gray-500 text-xs">Email Sent (24h)</p>
              <p className="font-bold text-gray-900">{riskSummary?.email_sent_24h ?? 0}</p>
            </div>
          </div>

          {riskSummary?.note && <p className="text-xs text-amber-700">{riskSummary.note}</p>}

          {riskSummary?.latest?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs bg-white border border-amber-100 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-amber-100/70 text-amber-900">
                    <th className="text-left px-2 py-2">Firm</th>
                    <th className="text-left px-2 py-2">Category</th>
                    <th className="text-left px-2 py-2">Delta</th>
                    <th className="text-left px-2 py-2">Slack</th>
                    <th className="text-left px-2 py-2">Email</th>
                    <th className="text-left px-2 py-2">When</th>
                  </tr>
                </thead>
                <tbody>
                  {riskSummary.latest.slice(0, 6).map((row, idx) => (
                    <tr key={`${row.firm_id}-${idx}`} className="border-t border-amber-100 text-gray-700">
                      <td className="px-2 py-2">{row.firm_name}</td>
                      <td className="px-2 py-2">{row.current_category || '-'}</td>
                      <td className="px-2 py-2">{typeof row.delta === 'number' ? row.delta.toFixed(1) : '-'}</td>
                      <td className="px-2 py-2">{row.sent_slack ? 'yes' : 'no'}</td>
                      <td className="px-2 py-2">{row.sent_email ? 'yes' : 'no'}</td>
                      <td className="px-2 py-2">{new Date(row.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-600">No risk alert dispatch entries yet.</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {jobs.map(job => (
            <div key={job.name} className={`p-6 rounded-lg border-2 ${getCategoryColor(job.category)}`}>
              <h3 className="font-bold text-base sm:text-lg break-words leading-tight">{formatJobLabel(job.name)}</h3>
              <p className="text-xs opacity-70 mt-1 font-mono break-all">{job.name}</p>
              <p className="text-sm mt-2 opacity-80 break-words leading-relaxed">{job.description}</p>
              <div className="mt-4 flex items-center">
                <span className={`text-xs px-3 py-1 rounded-lg font-medium ${getStatusColor(job.status)}`}>
                  {job.status.toUpperCase()}
                </span>
              </div>
              <div className="mt-2">
                <button
                  disabled={job.status === 'running'}
                  onClick={() => executeJob(job.name)}
                  className={`w-full px-3 py-2 rounded text-white font-semibold text-sm ${
                    job.status === 'running'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {job.status === 'running' ? 'Running...' : 'Execute'}
                </button>
              </div>
            </div>
            ))}
          </div>
        </div>

      {/* Execution History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-[#0A8A9F]">Execution History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-bold text-[#0A8A9F]">Job Name</th>
                <th className="text-left py-3 px-4 font-bold text-[#0A8A9F]">Status</th>
                <th className="text-left py-3 px-4 font-bold text-[#0A8A9F]">Start Time</th>
                <th className="text-left py-3 px-4 font-bold text-[#0A8A9F]">Duration</th>
                <th className="text-left py-3 px-4 font-bold text-[#0A8A9F]">User</th>
                <th className="text-left py-3 px-4 font-bold text-[#0A8A9F]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {executions.map(exec => (
                <tr key={exec.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">
                    <div className="break-words">{formatJobLabel(exec.jobName)}</div>
                    <div className="text-xs text-gray-500 font-mono break-all">{exec.jobName}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(exec.status)}`}>
                      {exec.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(exec.startTime).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-gray-900">{exec.duration ? `${exec.duration}s` : '-'}</td>
                  <td className="py-3 px-4 text-gray-900">{exec.user}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => {
                        setSelectedJob(exec);
                        setShowOutput(true);
                      }}
                      className="text-[#0A8A9F] hover:text-[#087080] font-semibold"
                    >
                      View Output
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Output Modal */}
      {showOutput && selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-300 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl sm:text-2xl font-bold text-[#0A8A9F] break-words pr-2">Output - {selectedJob.jobName}</h3>
                <button onClick={() => setShowOutput(false)} className="text-gray-500 hover:text-gray-700 hover:bg-red-50 rounded-full w-10 h-10 flex items-center justify-center font-bold transition border border-gray-300">✕</button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs h-64 overflow-y-auto border border-gray-700">
                <pre>{getOutputText(selectedJob)}</pre>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Started:</span>
                  <p className="font-semibold text-gray-900">{new Date(selectedJob.startTime).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <p className={`font-semibold ${getStatusTextColor(selectedJob.status)}`}>
                    {selectedJob.status.toUpperCase()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <p className="font-semibold text-gray-900">
                    {typeof selectedJob.duration === 'number'
                      ? `${selectedJob.duration}s`
                      : selectedJob.status === 'running'
                        ? 'Pending...'
                        : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
