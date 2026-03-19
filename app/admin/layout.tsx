'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth, adminLogout } from '@/lib/admin-auth-guard';
import { RealIcon, RealIconName } from '@/components/design-system/RealIcon';
import RouteBriefingBanner from '@/components/ui/RouteBriefingBanner';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: 'dashboard', roles: ['admin', 'auditor', 'lead_reviewer', 'reviewer'] },
  { name: 'Operations', href: '/admin/operations', icon: 'operations', roles: ['admin', 'lead_reviewer'] },
  { name: 'Monitoring', href: '/admin/monitoring', icon: 'monitoring', roles: ['admin', 'auditor', 'lead_reviewer'] },
  { name: 'Health', href: '/admin/health', icon: 'health', roles: ['admin', 'auditor'] },
  { name: 'Crawls', href: '/admin/crawls', icon: 'analytics', roles: ['admin', 'lead_reviewer'] },
  { name: 'Agents', href: '/admin/agents', icon: 'agents', roles: ['admin', 'lead_reviewer'] },
  { name: 'Policies', href: '/admin/agents/policies', icon: 'operations', roles: ['admin', 'lead_reviewer'] },
  { name: 'Jobs', href: '/admin/jobs', icon: 'jobs', roles: ['admin', 'lead_reviewer'] },
  { name: 'Discovery', href: '/admin/discovery', icon: 'research', roles: ['admin', 'lead_reviewer'] },
  { name: 'Integrity', href: '/admin/integrity', icon: 'shield', roles: ['admin', 'auditor', 'lead_reviewer'] },
  { name: 'Logs', href: '/admin/logs', icon: 'logs', roles: ['admin', 'auditor'] },
  { name: 'Validation', href: '/admin/validation', icon: 'review', roles: ['admin', 'lead_reviewer', 'reviewer'] },
  { name: 'Review', href: '/admin/review', icon: 'review', roles: ['admin', 'lead_reviewer'] },
  { name: 'Add Firm', href: '/admin/firms', icon: 'add', roles: ['admin', 'lead_reviewer'] },
  { name: 'Audit', href: '/admin/audit', icon: 'audit', roles: ['admin', 'auditor'] },
  { name: 'Planning', href: '/admin/planning', icon: 'methodology', roles: ['admin', 'lead_reviewer'] },
  { name: 'Autonomous Lab', href: '/admin/autonomous-lab', icon: 'copilot', roles: ['admin', 'lead_reviewer', 'auditor'] },
  { name: 'Pilote AI', href: '/admin/copilot', icon: 'copilot', roles: ['admin', 'lead_reviewer'] },
  { name: 'Info', href: '/admin/info', icon: 'api', roles: ['admin', 'auditor', 'lead_reviewer', 'reviewer'] },
  { name: 'Users', href: '/admin/users', icon: 'users', roles: ['admin'] },
  { name: 'Sessions', href: '/admin/sessions', icon: 'dashboard', roles: ['admin'] },
];

type NavItem = {
  name: string
  href: string
  icon: RealIconName
  roles: string[]
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const auth = useAdminAuth();
  const [collapsed, setCollapsed] = useState(false);
  
  // Login page should not show the admin layout sidebar and header
  // Check for both with and without trailing slash due to Next.js routing
  const isLoginPage = pathname?.includes('/login') || false;
  
  if (isLoginPage) {
    return <>{children}</>;
  }
  
  const role = auth.user?.role;
  const filteredNav = role ? (navigation as NavItem[]).filter((item) => item.roles.includes(role)) : [];

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
              <RealIcon name={item.icon} size={18} alt={item.name} />
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
              <Link href="/admin/audit" className="admin-action-btn"><RealIcon name="audit" size={16} alt="Audit" /> Audit</Link>
              <Link href="/admin/jobs" className="admin-action-btn"><RealIcon name="jobs" size={16} alt="Jobs" /> Jobs</Link>
              <Link href="/admin/logs" className="admin-action-btn"><RealIcon name="logs" size={16} alt="Logs" /> Logs</Link>
              <Link href="/admin/logs" className="admin-action-btn" aria-label="Notifications"><RealIcon name="monitoring" size={16} alt="Notifications" /></Link>
              <Link href="/admin/info" className="admin-action-btn" aria-label="Settings"><RealIcon name="operations" size={16} alt="Settings" /></Link>
              <Link href="/admin/info" className="admin-action-btn" aria-label="Profile"><RealIcon name="users" size={16} alt="Profile" /></Link>
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
          <RouteBriefingBanner scope="admin" />
          {children}
        </main>
      </div>
    </div>
  );
}
