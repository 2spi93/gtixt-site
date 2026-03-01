'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth, adminLogout } from '@/lib/admin-auth-guard';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: '📊', roles: ['admin', 'auditor', 'lead_reviewer', 'reviewer'] },
  { name: 'Operations', href: '/admin/operations', icon: '🎛️', roles: ['admin', 'lead_reviewer'] },
  { name: 'Monitoring', href: '/admin/monitoring', icon: '📈', roles: ['admin', 'auditor', 'lead_reviewer'] },
  { name: 'Health', href: '/admin/health', icon: '🏥', roles: ['admin', 'auditor'] },
  { name: 'Crawls', href: '/admin/crawls', icon: '🕷️', roles: ['admin', 'lead_reviewer'] },
  { name: 'Agents', href: '/admin/agents', icon: '🤖', roles: ['admin', 'lead_reviewer'] },
  { name: 'Jobs', href: '/admin/jobs', icon: '⚙️', roles: ['admin', 'lead_reviewer'] },
  { name: 'Logs', href: '/admin/logs', icon: '📜', roles: ['admin', 'auditor'] },
  { name: 'Validation', href: '/admin/validation', icon: '✅', roles: ['admin', 'lead_reviewer', 'reviewer'] },
  { name: 'Review', href: '/admin/review', icon: '📝', roles: ['admin', 'lead_reviewer'] },
  { name: 'Add Firm', href: '/admin/firms', icon: '➕', roles: ['admin', 'lead_reviewer'] },
  { name: 'Audit', href: '/admin/audit', icon: '📋', roles: ['admin', 'auditor'] },
  { name: 'Planning', href: '/admin/planning', icon: '📅', roles: ['admin', 'lead_reviewer'] },
  { name: 'Pilote AI', href: '/admin/copilot', icon: '🚀', roles: ['admin', 'lead_reviewer'] },
  { name: 'Info', href: '/admin/info', icon: '📖', roles: ['admin', 'auditor', 'lead_reviewer', 'reviewer'] },
  { name: 'Users', href: '/admin/users', icon: '👤', roles: ['admin'] },
  { name: 'Sessions', href: '/admin/sessions', icon: '🧭', roles: ['admin'] },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Login page should not show the admin layout sidebar and header
  // Check for both with and without trailing slash due to Next.js routing
  const isLoginPage = pathname?.includes('/login') || false;
  
  if (isLoginPage) {
    return <>{children}</>;
  }
  
  const auth = useAdminAuth();
  const [collapsed, setCollapsed] = useState(false);
  
  const role = auth.user?.role;
  const filteredNav = role ? navigation.filter((item) => item.roles.includes(role)) : [];

  // Show loading state during auth check
  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell admin-theme">
      {/* Sidebar */}
      <div
        className={`${
          collapsed ? 'w-16' : 'w-64'
        } admin-sidebar text-white flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="admin-brand-mark">
                <span className="admin-brand-letter admin-brand-g">G</span>
                <span className="admin-brand-letter admin-brand-t">T</span>
                <div className="admin-brand-accent"></div>
                <div className="admin-brand-glow"></div>
              </div>
              <div className="admin-brand-text">
                <div className="admin-brand-name">
                  <span className="admin-brand-blue">GT</span>
                  <span className="admin-brand-white">i</span>
                  <span className="admin-brand-blue">XT</span>
                </div>
                <div className="admin-brand-divider"></div>
                <div className="admin-brand-tag">Admin Console</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="admin-action-btn"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {filteredNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="admin-nav-link"
              title={collapsed ? item.name : ''}
            >
              <span className="text-xl">{item.icon}</span>
              {!collapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            {!collapsed && (
              <>
                <p>System Admin</p>
                <p className="text-gray-500 mt-1">v2.0 Operational</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="admin-topbar">
          <div className="admin-topbar-inner">
            <Link href="/admin" className="admin-brand">
              <div className="admin-brand-mark">
                <span className="admin-brand-letter admin-brand-g">G</span>
                <span className="admin-brand-letter admin-brand-t">T</span>
                <div className="admin-brand-accent"></div>
                <div className="admin-brand-glow"></div>
              </div>
              <div className="admin-brand-text">
                <div className="admin-brand-name">
                  <span className="admin-brand-blue">GT</span>
                  <span className="admin-brand-white">I</span>
                  <span className="admin-brand-blue">XT</span>
                </div>
                <div className="admin-brand-divider"></div>
                <div className="admin-brand-tag">Operations Control Center</div>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link href="/admin/audit" className="admin-action-btn">📋 Audit</Link>
              <Link href="/admin/jobs" className="admin-action-btn">⚙️ Jobs</Link>
              <Link href="/admin/logs" className="admin-action-btn">📜 Logs</Link>
              <button className="admin-action-btn" aria-label="Notifications">🔔</button>
              <button className="admin-action-btn" aria-label="Settings">⚙️</button>
              <button className="admin-action-btn" aria-label="Profile">👤</button>
              {auth.user && (
                <button className="admin-action-btn" onClick={() => adminLogout()}>
                  Deconnexion
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
