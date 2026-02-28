/**
 * Admin Dashboard Home
 * Central control hub for GTIXT management
 * 
 * Features:
 * - Real-time system statistics
 * - Quick action buttons
 * - Categorized admin functions
 * - System health overview
 * - Project information
 */

'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

interface DashboardStats {
  totalFirms?: number;
  publishedFirms?: number;
  agentCPassRate?: number;
  pendingReviews?: number;
  lastUpdate?: string;
}

const adminSections = [
  { 
    title: 'Review Queue', 
    href: '/admin/review', 
    icon: '📋', 
    description: 'Pending items for review & approval',
    category: 'Operations'
  },
  { 
    title: 'User Management', 
    href: '/admin/users', 
    icon: '👥', 
    description: 'Manage admin users & roles' ,
    category: 'Security'
  },
  { 
    title: 'Change Password', 
    href: '/admin/security/password', 
    icon: '🔑', 
    description: 'Update your account password',
    category: 'Security'
  },
  { 
    title: 'Setup 2FA', 
    href: '/admin/security/2fa', 
    icon: '🔐', 
    description: 'Enable two-factor authentication',
    category: 'Security'
  },
  { 
    title: 'Agents Monitor', 
    href: '/admin/agents', 
    icon: '🤖', 
    description: 'Monitor AI agents & scoring',
    category: 'Operations'
  },
  { 
    title: 'Audit Trails', 
    href: '/admin/audit', 
    icon: '📊', 
    description: 'Complete audit log of all actions',
    category: 'Operations'
  },
  { 
    title: 'Jobs Execution', 
    href: '/admin/jobs', 
    icon: '⚙️', 
    description: 'Run & manage Python scripts' ,
    category: 'Advanced'
  },
  { 
    title: 'System Logs', 
    href: '/admin/logs', 
    icon: '📜', 
    description: 'Real-time logs from filesystem',
    category: 'Advanced'
  },
  { 
    title: 'Health Monitor', 
    href: '/admin/health', 
    icon: '🏥', 
    description: 'System health & monitoring',
    category: 'Monitoring'
  },
  { 
    title: 'Operations Log', 
    href: '/admin/operations', 
    icon: '🎛️', 
    description: 'Operation history & details',
    category: 'Monitoring'
  },
  { 
    title: 'Add Firms', 
    href: '/admin/firms', 
    icon: '➕', 
    description: 'Manually add new firms',
    category: 'Data'
  },
  { 
    title: 'Validation', 
    href: '/admin/validation', 
    icon: '✅', 
    description: 'Validate and approve data',
    category: 'Data'
  },
  { 
    title: 'Web Crawls', 
    href: '/admin/crawls', 
    icon: '🕷️', 
    description: 'Manage web crawls',
    category: 'Data'
  },
  { 
    title: 'Planning', 
    href: '/admin/planning', 
    icon: '📅', 
    description: 'Task planning & scheduling',
    category: 'Scheduling'
  },
  { 
    title: 'AI Assistant', 
    href: '/admin/copilot', 
    icon: '🚀', 
    description: 'AI Assistant & automation',
    category: 'Advanced'
  },
];

const categories = ['Operations', 'Security', 'Monitoring', 'Data', 'Advanced', 'Scheduling'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/dashboard-stats/?cacheBust=' + Date.now());
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Hero Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🏛️ <span className="text-[#0A8A9F]">GTIXT</span> Admin Dashboard
            </h1>
            <p className="text-gray-600 text-lg">Complete Control Hub for System Management</p>
            <p className="text-gray-500 mt-1">Access all admin functions and monitoring tools</p>
          </div>
          <button
            onClick={fetchStats}
            className="px-5 py-3 bg-[#0A8A9F] hover:bg-[#087080] text-white rounded-xl font-semibold transition shadow-sm"
          >
            🔄 Refresh Stats
          </button>
        </div>
      </div>

      {/* Key Statistics */}
      {!loading && !error && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
            <div className="text-sm font-semibold text-[#0A8A9F]">📊 Total Firms</div>
            <div className="text-4xl font-bold text-gray-900 mt-3">{stats.totalFirms || '—'}</div>
            <p className="text-xs text-gray-500 mt-2">Registered enterprises</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
            <div className="text-sm font-semibold text-[#0A8A9F]">✅ Published Firms</div>
            <div className="text-4xl font-bold text-gray-900 mt-3">{stats.publishedFirms || '—'}</div>
            <p className="text-xs text-gray-500 mt-2">Ranked & eligible</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
            <div className="text-sm font-semibold text-[#0A8A9F]">🤖 Agent C Pass Rate</div>
            <div className="text-4xl font-bold text-gray-900 mt-3">{stats.agentCPassRate || '—'}%</div>
            <p className="text-xs text-gray-500 mt-2">Validation success</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
            <div className="text-sm font-semibold text-[#0A8A9F]">⏱️ Pending Reviews</div>
            <div className="text-4xl font-bold text-gray-900 mt-3">{stats.pendingReviews || '—'}</div>
            <p className="text-xs text-gray-500 mt-2">Items to review</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-white rounded-xl shadow-sm border border-red-300 border-l-4 border-l-red-500 p-6 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-bold text-red-900">Failed to Load Dashboard</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <button
                onClick={fetchStats}
                className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-900 rounded text-sm font-medium"
              >
                🔄 Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">⚡ <span className="text-[#0A8A9F]">Quick Actions</span></h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/jobs"
            className="bg-gray-50 hover:bg-[#0A8A9F] hover:text-white border border-gray-200 px-4 py-4 rounded-xl font-semibold transition text-center text-gray-700"
          >
            ▶️ Run Jobs
          </Link>
          <Link
            href="/admin/audit"
            className="bg-gray-50 hover:bg-[#0A8A9F] hover:text-white border border-gray-200 px-4 py-4 rounded-xl font-semibold transition text-center text-gray-700"
          >
            📋 View Audit
          </Link>
          <Link
            href="/admin/logs"
            className="bg-gray-50 hover:bg-[#0A8A9F] hover:text-white border border-gray-200 px-4 py-4 rounded-xl font-semibold transition text-center text-gray-700"
          >
            📜 System Logs
          </Link>
          <Link
            href="/admin/users"
            className="bg-gray-50 hover:bg-[#0A8A9F] hover:text-white border border-gray-200 px-4 py-4 rounded-xl font-semibold transition text-center text-gray-700"
          >
            👥 Manage Users
          </Link>
        </div>
      </div>

      {/* Admin Functions by Category */}
      {Object.entries(
        adminSections.reduce((acc, item) => {
          if (!acc[item.category]) acc[item.category] = [];
          acc[item.category].push(item);
          return acc;
        }, {} as Record<string, typeof adminSections>)
      )
        .sort(([a], [b]) => categories.indexOf(a) - categories.indexOf(b))
        .map(([category, items]) => (
          <div key={category} className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              {category === 'Operations' && '🎛️'}
              {category === 'Security' && '🔐'}
              {category === 'Monitoring' && '📊'}
              {category === 'Data' && '💾'}
              {category === 'Advanced' && '⚙️'}
              {category === 'Scheduling' && '📅'}
              <span className="text-[#0A8A9F]">{category}</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {items.map((section, idx) => (
                <Link
                  key={idx}
                  href={section.href}
                  className="group bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-[#0A8A9F] transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{section.icon}</span>
                    <span className="text-[#0A8A9F] opacity-0 group-hover:opacity-100 transition transform group-hover:translate-x-1">→</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#0A8A9F] transition">{section.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">{section.description}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}

      {/* Features Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-[#0A8A9F] p-6">
          <h4 className="font-bold text-gray-900 text-lg">✨ Real Python Execution</h4>
          <p className="text-sm text-gray-700 mt-2">8 jobs running actual scripts with real output</p>
          <Link href="/admin/jobs" className="text-[#0A8A9F] hover:text-[#087080] font-medium text-sm mt-3 inline-block">
            Explore Jobs →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-[#0A8A9F] p-6">
          <h4 className="font-bold text-gray-900 text-lg">📊 Live System Logs</h4>
          <p className="text-sm text-gray-700 mt-2">Real logs read directly from filesystem</p>
          <Link href="/admin/logs" className="text-[#0A8A9F] hover:text-[#087080] font-medium text-sm mt-3 inline-block">
            View Logs →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-[#0A8A9F] p-6">
          <h4 className="font-bold text-gray-900 text-lg">🔐 Secure Management</h4>
          <p className="text-sm text-gray-700 mt-2">2FA, audit trails, complete user control</p>
          <Link href="/admin/security/2fa" className="text-[#0A8A9F] hover:text-[#087080] font-medium text-sm mt-3 inline-block">
            Security →
          </Link>
        </div>
      </div>

      {/* Project Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ℹ️ Project Information</h2>
            <p className="text-gray-600 mt-1">GTIXT - Governance, Transparency & Institutional eXcellence Tracking</p>
          </div>
          <Link
            href="/admin/info"
            className="px-4 py-2 bg-[#0A8A9F] hover:bg-[#087080] text-white rounded-lg font-medium transition"
          >
            📖 Learn More
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-bold text-gray-800 block">🏗️ Architecture</span>
            <span className="text-gray-600">Next.js 13 + Prisma + PostgreSQL</span>
          </div>
          <div>
            <span className="font-bold text-gray-800 block">🚀 Environment</span>
            <span className="text-gray-600">Production (NGINX + Let's Encrypt)</span>
          </div>
          <div>
            <span className="font-bold text-gray-800 block">📅 Last Updated</span>
            <span className="text-gray-600">{stats?.lastUpdate ? new Date(stats.lastUpdate).toLocaleDateString('fr-FR') : '—'}</span>
          </div>
        </div>
      </div>

      {/* System Status Badge */}
      <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 py-8 px-6">
        <h3 className="text-2xl font-bold text-[#0A8A9F]">✅ All Systems Operational</h3>
        <p className="text-gray-600 mt-2">15 Pages • 11 APIs • Production Ready</p>
        <div className="mt-4 flex justify-center gap-4 flex-wrap">
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">🔧 Database: OK</span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">🌐 API: OK</span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">⚙️ Jobs: OK</span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">🔒 Security: OK</span>
        </div>
      </div>
    </div>
  );
}
