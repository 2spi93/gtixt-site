'use client';
export const dynamic = 'force-dynamic';

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
}

export default function JobsManagement() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobExecution | null>(null);
  const [showOutput, setShowOutput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<{ totalJobs: number; executionsByStatus: Record<string, number> } | null>(null);

  useEffect(() => {
    fetchJobs();
    fetchExecutions();
    const interval = setInterval(() => {
      fetchJobs();
      fetchExecutions();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/admin/jobs/');
      const data = await res.json();
      setJobs(data.data || []);
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
      setExecutions(data.data || []);
    } catch (error) {
      console.error('Failed to fetch executions:', error);
    }
  };

  const executeJob = async (jobName: string) => {
    try {
      const res = await fetch('/api/admin/jobs/execute/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobName }),
      });
      const data = await res.json();
      if (data.success) {
        fetchJobs();
      }
    } catch (error) {
      console.error('Failed to execute job:', error);
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
      case 'idle':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        <h1 className="text-4xl font-bold text-gray-900">⚙️ <span className="text-[#0A8A9F]">Jobs</span> & Scripts</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {jobs.map(job => (
            <div key={job.name} className={`p-6 rounded-lg border-2 ${getCategoryColor(job.category)}`}>
              <h3 className="font-bold text-lg">{job.name}</h3>
              <p className="text-sm mt-2 opacity-80">{job.description}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className={`text-xs px-3 py-1 rounded-lg font-medium ${getStatusColor(job.status)}`}>
                  {job.status.toUpperCase()}
                </span>
                <button
                  disabled={job.status === 'running'}
                  onClick={() => executeJob(job.name)}
                    className={`px-3 py-1 rounded text-white font-semibold text-sm ${
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
                  <td className="py-3 px-4 font-medium text-gray-900">{exec.jobName}</td>
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
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-[#0A8A9F]">Output - {selectedJob.jobName}</h3>
                <button onClick={() => setShowOutput(false)} className="text-gray-500 hover:text-gray-700 hover:bg-red-50 rounded-full w-10 h-10 flex items-center justify-center font-bold transition border border-gray-300">✕</button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs h-64 overflow-y-auto border border-gray-700">
                <pre>{selectedJob.output || '[No output available]'}</pre>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Started:</span>
                  <p className="font-semibold text-gray-900">{new Date(selectedJob.startTime).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <p className={`font-semibold ${selectedJob.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedJob.status.toUpperCase()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <p className="font-semibold text-gray-900">{selectedJob.duration ? `${selectedJob.duration}s` : 'Pending...'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
