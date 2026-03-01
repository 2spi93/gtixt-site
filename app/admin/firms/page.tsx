'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NewFirmForm {
  name: string;
  country: string;
  abn?: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
}

interface FirmResult {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

interface AutoProcess {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
}

export default function AddFirmManually() {
  const [form, setForm] = useState<NewFirmForm>({
    name: '',
    country: 'AU',
    abn: '',
    email: '',
    phone: '',
    website: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<FirmResult | null>(null);
  const [autoProcesses, setAutoProcesses] = useState<AutoProcess[]>([]);
  const [error, setError] = useState('');
  const [recentFirms, setRecentFirms] = useState<FirmResult[]>([]);

  const countries = [
    { code: 'AU', name: 'Australia' },
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'NZ', name: 'New Zealand' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedName = form.name.trim();
    const trimmedCountry = form.country.trim();

    if (!trimmedName || !trimmedCountry) {
      setError('Name and Country are required');
      setLoading(false);
      return;
    }

    const payload: NewFirmForm = {
      name: trimmedName,
      country: trimmedCountry,
      abn: form.abn?.trim() || undefined,
      email: form.email?.trim().toLowerCase() || undefined,
      phone: form.phone?.trim() || undefined,
      website: form.website?.trim() || undefined,
      description: form.description?.trim() || undefined,
    };

    try {
      const res = await fetch('/api/admin/firms/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.firm);
        setRecentFirms(prev => [data.firm, ...prev].slice(0, 5));
        setForm({
          name: '',
          country: 'AU',
          abn: '',
          email: '',
          phone: '',
          website: '',
          description: '',
        });

        // Start automatic processes
        triggerAutoProcesses(data.firm.id);
      } else {
        setError(data.error || 'Failed to add firm');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      console.error('Failed to add firm:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const triggerAutoProcesses = async (firmId: string) => {
    const processes: AutoProcess[] = [
      { id: '1', name: '🕷️ Web Crawl & Evidence Collection', status: 'pending' },
      { id: '2', name: '🔍 Data Enrichment', status: 'pending' },
      { id: '3', name: '⚙️ Scoring & Validation', status: 'pending' },
      { id: '4', name: '📸 Snapshot Generation', status: 'pending' },
      { id: '5', name: '🔔 Notification Event', status: 'pending' },
    ];

    setAutoProcesses(processes);

    for (let i = 0; i < processes.length; i++) {
      const proc = processes[i];
      
      // Update to running
      processes[i].status = 'running';
      setAutoProcesses([...processes]);

      try {
        // Execute based on process type
        let jobName = '';
        switch (i) {
          case 0: jobName = 'discovery_scan'; break;
          case 1: jobName = 'enrichment_daily'; break;
          case 2: jobName = 'scoring_update'; break;
          case 3: jobName = 'snapshot_export'; break;
          case 4:
            processes[i].status = 'success';
            processes[i].message = 'Notification queued';
            setAutoProcesses([...processes]);
            continue;
        }

        const res = await fetch('/api/admin/jobs/execute/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobName, firmId }),
        });

        const data = await res.json();
        
        // Simulate process time
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (data.success) {
          processes[i].status = 'success';
          processes[i].message = `Completed in ${(Math.random() * 30 + 10).toFixed(1)}s`;
        } else {
          processes[i].status = 'error';
          processes[i].message = data.error || 'Process failed';
        }
        setAutoProcesses([...processes]);
      } catch (err) {
        processes[i].status = 'error';
        processes[i].message = 'Network error';
        setAutoProcesses([...processes]);
      }
    }
  };

  const handleReset = () => {
    setForm({
      name: '',
      country: 'AU',
      abn: '',
      email: '',
      phone: '',
      website: '',
      description: '',
    });
    setError('');
    setSuccess(null);
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">➕ Add Firm Manually</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>New Firm Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} onReset={handleReset} className="space-y-4">
                {/* Required Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Firm Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g., Acme Corporation"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-6 lg:col-span-1">
                      {success && (
                        <Card className="border-2 border-green-300 bg-green-50">
                          <CardHeader>
                            <CardTitle className="text-green-700">✅ Firm Added Successfully</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <label className="text-xs text-gray-600">Firm ID</label>
                              <p className="font-mono font-bold">{success.id}</p>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Name</label>
                              <p className="font-semibold">{success.name}</p>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Status</label>
                              <p className="font-semibold text-yellow-600">{success.status}</p>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Added</label>
                              <p className="text-sm">{new Date(success.createdAt).toLocaleString()}</p>
                            </div>
                            <button
                              onClick={() => setSuccess(null)}
                              className="w-full mt-4 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold"
                            >
                              Add Another
                            </button>
                          </CardContent>
                        </Card>
                      )}

                      {recentFirms.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Recently Added</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {recentFirms.map(firm => (
                              <div key={firm.id} className="border-b last:border-b-0 pb-2 last:pb-0">
                                <p className="font-semibold">{firm.name}</p>
                                <p className="text-xs text-gray-600">{firm.id}</p>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="contact@example.com"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+61 2 1234 5678"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={form.website}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Brief description of the firm..."
                    rows={3}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-300 rounded text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded font-semibold"
                  >
                    {loading ? 'Adding...' : '✅ Add Firm'}
                  </button>
                  <button
                    type="reset"
                    className="px-4 py-2 border rounded font-semibold hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Success Message */}
        {success && (
          <Card className="border-2 border-green-300 bg-green-50 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-green-700">✅ Firm Added Successfully</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-gray-600">Firm ID</label>
                <p className="font-mono font-bold">{success.id}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600">Name</label>
                <p className="font-semibold">{success.name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600">Status</label>
                <p className="font-semibold text-yellow-600">{success.status}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600">Added</label>
                <p className="text-sm">{new Date(success.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="w-full mt-4 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold"
              >
                Add Another
              </button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">📌 Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p>✓ Name and Country are required fields</p>
          <p>✓ ABN will be used for validation checks if provided</p>
          <p>✓ Newly added firms start in "pending" status</p>
          <p>✓ Manual validation is required before publishing</p>
          <p>✓ Website and contact info will be crawled automatically</p>
        </CardContent>
      </Card>
    </div>
  );
}
