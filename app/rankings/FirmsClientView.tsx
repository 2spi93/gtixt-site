'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Firm {
  id: string;
  name: string;
  country: string;
  jurisdiction: string;
  status: string;
  score?: number;
  transparency?: number;
}

export default function FirmsClientView() {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJurisdiction, setFilterJurisdiction] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch firms list
        const firmsRes = await fetch('/api/firms/search?limit=100&offset=0');
        if (!firmsRes.ok) throw new Error('Failed to fetch firms');
        const firmsData = await firmsRes.json();
        setFirms(firmsData.firms || firmsData.data || []);

        // Fetch stats
        const statsRes = await fetch('/api/firms/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching firms:', err);
        setError('Failed to load firms. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredFirms = firms.filter(firm => {
    const matchesSearch = 
      firm.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      firm.jurisdiction?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJurisdiction = !filterJurisdiction || firm.jurisdiction === filterJurisdiction;
    return matchesSearch && matchesJurisdiction;
  });

  const jurisdictions = [...new Set(firms.map(f => f.jurisdiction))].sort();

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
        <h3 className="font-semibold mb-2">Error Loading Firms</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-[#0A8A9F]">
            <div className="text-3xl font-bold text-[#0A8A9F]">{stats.total || 0}</div>
            <div className="text-sm text-gray-600 mt-2">Total Firms</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="text-3xl font-bold text-green-600">{stats.complete || 0}</div>
            <div className="text-sm text-gray-600 mt-2">Complete Profiles</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="text-3xl font-bold text-blue-600">{stats.byCountry?.length || 0}</div>
            <div className="text-sm text-gray-600 mt-2">Jurisdictions</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="text-3xl font-bold text-purple-600">{stats.completionRate || '0'}%</div>
            <div className="text-sm text-gray-600 mt-2">Completion Rate</div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Firms</label>
          <input
            type="text"
            placeholder="Search by name, jurisdiction..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A8A9F] focus:border-transparent"
          />
        </div>

        {jurisdictions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Jurisdiction</label>
            <select
              value={filterJurisdiction}
              onChange={(e) => setFilterJurisdiction(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A8A9F] focus:border-transparent"
            >
              <option value="">All Jurisdictions</option>
              {jurisdictions.map(jur => (
                <option key={jur} value={jur}>{jur}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Firms List */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Browse Firms {filteredFirms.length > 0 && `(${filteredFirms.length})`}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredFirms.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <p className="text-gray-600 text-lg">No firms match your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFirms.map((firm) => (
              <div
                key={firm.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 border border-gray-200 hover:border-[#0A8A9F]"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 text-lg flex-1">
                    {firm.name || 'Unnamed Firm'}
                  </h3>
                  {firm.score && (
                    <div className="ml-2 px-3 py-1 bg-[#0A8A9F]/10 text-[#0A8A9F] rounded-full text-sm font-semibold">
                      {firm.score.toFixed(1)}%
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Jurisdiction:</span> {firm.jurisdiction || 'N/A'}
                  </p>
                  {firm.country && (
                    <p>
                      <span className="font-medium">Country:</span> {firm.country}
                    </p>
                  )}
                  {firm.status && (
                    <p>
                      <span className="font-medium">Status:</span>{' '}
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        firm.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {firm.status}
                      </span>
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <a href={`/api/snapshot/latest?firm_id=${firm.id}`} className="text-[#0A8A9F] hover:underline text-sm font-medium">
                    View Details →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Note */}
      {firms.length > 0 && (
        <div className="text-center text-sm text-gray-600 py-6">
          <p>Showing first {firms.length} firms. <Link href="/admin" className="text-[#0A8A9F] hover:underline font-medium">Login to view all</Link></p>
        </div>
      )}
    </div>
  );
}
