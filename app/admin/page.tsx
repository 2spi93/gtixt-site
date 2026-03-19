'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AdminNavigation } from '@/components/design-system/UnifiedNavigation'
import { GlassCard, GlassStat, GlassGrid, GradientText } from '@/components/design-system/GlassComponents'
import { RealIcon, RealIconName } from '@/components/design-system/RealIcon'
import InfoTooltip from '@/components/ui/InfoTooltip'

type DashboardStats = {
  totalFirms?: number
  publishedFirms?: number
  agentCPassRate?: number
  pendingReviews?: number
  jurisdictionCoveragePct?: number
  certifiedJurisdictionCoveragePct?: number
  evidenceCoveragePct?: number
  avgEvidencePerFirm?: number
  auditEvents24h?: number
  lastUpdate?: string
  topJurisdictions?: { code: string; count: number }[]
}

const jurisdictionNames: Record<string, string> = {
  US: 'United States',
  UK: 'United Kingdom',
  AE: 'United Arab Emirates',
  AU: 'Australia',
  CZ: 'Czech Republic',
  CY: 'Cyprus',
  UN: 'Unknown',
}

function formatJurisdiction(code?: string) {
  if (!code) return 'Unknown'
  const normalized = code.toUpperCase()
  return jurisdictionNames[normalized] ?? normalized
}

type Priority = 'critical' | 'high' | 'medium' | 'low'

type IncidentItem = {
  id: string
  priority: Priority
  title: string
  detail: string
  action: { label: string; href: string }
}

function deriveIncidents(stats: DashboardStats | null): IncidentItem[] {
  if (!stats) return []
  const items: IncidentItem[] = []
  const passRate = stats.agentCPassRate ?? 100
  if (passRate < 50) {
    items.push({ id: 'agent-pass', priority: 'critical', title: 'Agent C pass rate critical', detail: `Current: ${passRate}% — below 50% threshold`, action: { label: 'View Agents', href: '/admin/agents' } })
  } else if (passRate < 70) {
    items.push({ id: 'agent-pass-warn', priority: 'high', title: 'Agent C pass rate degraded', detail: `Current: ${passRate}% — below 70% target`, action: { label: 'Review Policies', href: '/admin/agents/policies' } })
  }
  const pending = stats.pendingReviews ?? 0
  if (pending >= 20) {
    items.push({ id: 'review-queue', priority: 'high', title: `${pending} items pending review`, detail: 'Review queue requires operator attention', action: { label: 'Open Queue', href: '/admin/review' } })
  } else if (pending >= 5) {
    items.push({ id: 'review-queue-medium', priority: 'medium', title: `${pending} items in review queue`, detail: 'Review queue has queued items', action: { label: 'Open Queue', href: '/admin/review' } })
  }
  const evidCov = stats.evidenceCoveragePct ?? 100
  if (evidCov < 40) {
    items.push({ id: 'evidence-cov', priority: 'high', title: 'Evidence coverage low', detail: `${evidCov}% of firms lack sufficient evidence`, action: { label: 'Start Crawl', href: '/admin/crawls' } })
  }
  const auditEvts = stats.auditEvents24h ?? 0
  if (auditEvts === 0) {
    items.push({ id: 'no-audit', priority: 'medium', title: 'No audit events in last 24h', detail: 'Pipeline may be stalled or agents idle', action: { label: 'Check Health', href: '/admin/health' } })
  }
  return items
}

const priorityMeta: Record<Priority, { label: string; dot: string; badge: string; text: string }> = {
  critical: { label: 'Critical', dot: 'bg-red-400', badge: 'border-red-400/40 bg-red-500/15', text: 'text-red-300' },
  high:     { label: 'High',     dot: 'bg-orange-400', badge: 'border-orange-400/40 bg-orange-500/15', text: 'text-orange-300' },
  medium:   { label: 'Medium',   dot: 'bg-yellow-400', badge: 'border-yellow-400/30 bg-yellow-500/10', text: 'text-yellow-300' },
  low:      { label: 'Low',      dot: 'bg-emerald-400', badge: 'border-emerald-400/30 bg-emerald-500/10', text: 'text-emerald-300' },
}

type AdminSection = {
  title: string
  href: string
  icon: RealIconName
  description: string
  category: 'Operations' | 'Security' | 'Monitoring' | 'Data' | 'Advanced' | 'Scheduling'
}

const adminSections: AdminSection[] = [
  { title: 'Review Queue', href: '/admin/review', icon: 'review', description: 'Pending items for review & approval', category: 'Operations' },
  { title: 'Agents Monitor', href: '/admin/agents', icon: 'agents', description: 'Monitor AI agents & scoring', category: 'Operations' },
  { title: 'Agent Policies', href: '/admin/agents/policies', icon: 'operations', description: 'Promote, rollback and compare ALS policies', category: 'Operations' },
  { title: 'Audit Trails', href: '/admin/audit', icon: 'audit', description: 'Complete audit log of all actions', category: 'Operations' },
  { title: 'User Management', href: '/admin/users', icon: 'users', description: 'Manage admin users & roles', category: 'Security' },
  { title: 'Change Password', href: '/admin/security/password', icon: 'shield', description: 'Update your account password', category: 'Security' },
  { title: 'Setup 2FA', href: '/admin/security/2fa', icon: 'shield', description: 'Enable two-factor authentication', category: 'Security' },
  { title: 'Health Monitor', href: '/admin/health', icon: 'health', description: 'System health & real-time status', category: 'Monitoring' },
  { title: 'Enterprise Monitoring', href: '/admin/monitoring', icon: 'monitoring', description: 'Prometheus, Grafana & metrics', category: 'Monitoring' },
  { title: 'Operations Log', href: '/admin/operations', icon: 'operations', description: 'Operation history & details', category: 'Monitoring' },
  { title: 'Add Firms', href: '/admin/firms', icon: 'add', description: 'Manually add new firms', category: 'Data' },
  { title: 'Validation', href: '/admin/validation', icon: 'review', description: 'Validate and approve data', category: 'Data' },
  { title: 'Web Crawls', href: '/admin/crawls', icon: 'analytics', description: 'Manage web crawls', category: 'Data' },
  { title: 'Jobs Execution', href: '/admin/jobs', icon: 'jobs', description: 'Run & manage Python scripts', category: 'Advanced' },
  { title: 'System Logs', href: '/admin/logs', icon: 'logs', description: 'Real-time logs from filesystem', category: 'Advanced' },
  { title: 'AI Assistant', href: '/admin/copilot', icon: 'copilot', description: 'AI Assistant & automation', category: 'Advanced' },
  { title: 'Planning', href: '/admin/planning', icon: 'methodology', description: 'Task planning & scheduling', category: 'Scheduling' },
]

const categories: AdminSection['category'][] = ['Operations', 'Security', 'Monitoring', 'Data', 'Advanced', 'Scheduling']

const categoryIcon: Record<AdminSection['category'], RealIconName> = {
  Operations: 'operations',
  Security: 'shield',
  Monitoring: 'monitoring',
  Data: 'analytics',
  Advanced: 'copilot',
  Scheduling: 'methodology',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/dashboard-stats/?cacheBust=' + Date.now())
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const incidents = deriveIncidents(stats)
  const criticalCount = incidents.filter((i) => i.priority === 'critical').length
  const highCount = incidents.filter((i) => i.priority === 'high').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <AdminNavigation />
      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* — Header — */}
        <GlassCard variant="dark" className="mb-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <RealIcon name="dashboard" size={26} alt="Dashboard" />
                <GradientText variant="h1">GTIXT Operations</GradientText>
                <InfoTooltip
                  content="Operator cockpit: incidents first, then pipeline queues, system status, and module access."
                  example="Start here — check for critical incidents before navigating to any specific module."
                  label="Admin cockpit explanation"
                />
              </h1>
              <p className="text-slate-300 text-lg">Operator Cockpit · {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <p className="text-slate-400 mt-1">Access all admin functions and monitoring tools</p>
            </div>
            <button
              onClick={fetchStats}
              className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 active:scale-95"
            >
              Refresh Stats
            </button>
          </div>
        </GlassCard>

        {/* — SECTION 1: Incident Monitor — */}
        <GlassCard variant="dark" className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <RealIcon name="shield" size={18} alt="Incidents" />
              <span>Incident Monitor</span>
              {criticalCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 border border-red-400/40 text-red-300 uppercase tracking-wide">
                  {criticalCount} Critical
                </span>
              )}
              {!loading && criticalCount === 0 && highCount === 0 && incidents.length === 0 && (
                <span className="ml-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 uppercase tracking-wide">
                  All Clear
                </span>
              )}
            </h2>
            <Link href="/admin/health" className="text-xs text-slate-400 hover:text-cyan-400 transition-colors">
              System Health →
            </Link>
          </div>

          {loading && (
            <div className="space-y-2">
              {[1,2].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          )}

          {!loading && incidents.length === 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/8 px-4 py-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
              <p className="text-sm text-emerald-300">No active incidents detected. All signals nominal.</p>
            </div>
          )}

          {!loading && incidents.length > 0 && (
            <div className="space-y-2">
              {incidents.map((incident) => {
                const meta = priorityMeta[incident.priority]
                return (
                  <div
                    key={incident.id}
                    className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${meta.badge}`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${meta.dot} ${incident.priority === 'critical' ? 'animate-pulse' : ''}`} />
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${meta.text} truncate`}>{incident.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{incident.detail}</p>
                      </div>
                    </div>
                    <Link
                      href={incident.action.href}
                      className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${meta.badge} ${meta.text} hover:opacity-80`}
                    >
                      {incident.action.label}
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </GlassCard>

        {/* — SECTION 2: System Status + Priority Queue — */}
        {!loading && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* System Status */}
            <GlassCard variant="light">
              <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <RealIcon name="monitoring" size={15} alt="Status" />
                System Status
              </h2>
              <div className="space-y-3">
                {[
                  {
                    label: 'Agent C Pass Rate',
                    value: stats.agentCPassRate !== undefined ? `${stats.agentCPassRate}%` : '—',
                    status: stats.agentCPassRate == null ? 'unknown' : stats.agentCPassRate >= 70 ? 'ok' : stats.agentCPassRate >= 50 ? 'warn' : 'crit',
                    href: '/admin/agents',
                  },
                  {
                    label: 'Evidence Coverage',
                    value: stats.evidenceCoveragePct !== undefined ? `${stats.evidenceCoveragePct}%` : '—',
                    status: stats.evidenceCoveragePct == null ? 'unknown' : stats.evidenceCoveragePct >= 70 ? 'ok' : stats.evidenceCoveragePct >= 40 ? 'warn' : 'crit',
                    href: '/admin/crawls',
                  },
                  {
                    label: 'Audit Events (24h)',
                    value: stats.auditEvents24h !== undefined ? String(stats.auditEvents24h) : '—',
                    status: stats.auditEvents24h == null ? 'unknown' : stats.auditEvents24h > 0 ? 'ok' : 'warn',
                    href: '/admin/audit',
                  },
                  {
                    label: 'Certified Jurisdiction Coverage',
                    value: stats.certifiedJurisdictionCoveragePct !== undefined ? `${stats.certifiedJurisdictionCoveragePct}%` : '—',
                    status: stats.certifiedJurisdictionCoveragePct == null ? 'unknown' : stats.certifiedJurisdictionCoveragePct >= 50 ? 'ok' : 'warn',
                    href: '/admin/validation',
                  },
                ].map(({ label, value, status, href }) => {
                  const color = status === 'ok' ? 'bg-emerald-400' : status === 'warn' ? 'bg-yellow-400' : status === 'crit' ? 'bg-red-400 animate-pulse' : 'bg-slate-500'
                  const textColor = status === 'ok' ? 'text-emerald-300' : status === 'warn' ? 'text-yellow-300' : status === 'crit' ? 'text-red-300' : 'text-slate-400'
                  return (
                    <Link key={label} href={href} className="flex items-center justify-between gap-3 hover:opacity-80 transition-opacity">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${color}`} />
                        <span className="text-sm text-slate-300 truncate">{label}</span>
                      </div>
                      <span className={`text-sm font-bold tabular-nums ${textColor}`}>{value}</span>
                    </Link>
                  )
                })}
              </div>
              {stats.lastUpdate && (
                <p className="text-[10px] text-slate-600 mt-4">Last update: {new Date(stats.lastUpdate).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}</p>
              )}
            </GlassCard>

            {/* Priority Queue */}
            <GlassCard variant="light">
              <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <RealIcon name="review" size={15} alt="Queue" />
                Priority Queue
              </h2>
              <div className="space-y-2">
                {[
                  {
                    label: 'Pending Reviews',
                    count: stats.pendingReviews ?? 0,
                    desc: 'Awaiting operator validation',
                    href: '/admin/review',
                    urgent: (stats.pendingReviews ?? 0) >= 10,
                  },
                  {
                    label: 'Firms to Publish',
                    count: (stats.totalFirms ?? 0) - (stats.publishedFirms ?? 0),
                    desc: 'Validated but not yet public',
                    href: '/admin/firms',
                    urgent: ((stats.totalFirms ?? 0) - (stats.publishedFirms ?? 0)) >= 10,
                  },
                  {
                    label: 'Evidence Gaps',
                    count: stats.avgEvidencePerFirm !== undefined && stats.avgEvidencePerFirm < 3 ? 1 : 0,
                    desc: `Avg ${stats.avgEvidencePerFirm?.toFixed(1) ?? '—'} evidence/firm — run enrichment crawl`,
                    href: '/admin/crawls',
                    urgent: (stats.avgEvidencePerFirm ?? 5) < 3,
                  },
                ].map(({ label, count, desc, href, urgent }) => (
                  <div key={label} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${urgent ? 'border-amber-400/30 bg-amber-500/8' : 'border-white/8 bg-white/[0.02]'}`}>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${urgent ? 'text-amber-300' : 'text-white'}`}>{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    </div>
                    <Link
                      href={href}
                      className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${urgent ? 'border-amber-400/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}
                    >
                      {count > 0 ? `${count} →` : 'Review'}
                    </Link>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {/* — SECTION 3: KPI Stats Grid — */}
        {!loading && !error && stats && (
          <GlassGrid cols={4} className="mb-6">
            <GlassStat label="Total Firms" value={stats.totalFirms ?? '—'} icon={<RealIcon name="firms" size={16} alt="Total Firms" />} />
            <GlassStat label="Published Firms" value={stats.publishedFirms ?? '—'} icon={<RealIcon name="review" size={16} alt="Published" />} />
            <GlassStat label="Agent C Pass Rate" value={stats.agentCPassRate !== undefined ? `${stats.agentCPassRate}%` : '—'} trend={stats.agentCPassRate && stats.agentCPassRate > 70 ? 'up' : stats.agentCPassRate && stats.agentCPassRate < 50 ? 'down' : 'neutral'} icon={<RealIcon name="agents" size={16} alt="Agent" />} />
            <GlassStat label="Pending Reviews" value={stats.pendingReviews ?? '—'} trend={stats.pendingReviews && stats.pendingReviews > 0 ? 'up' : 'neutral'} icon={<RealIcon name="review" size={16} alt="Pending" />} />
          </GlassGrid>
        )}

        {!loading && !error && stats && (
          <GlassGrid cols={4} className="mb-8">
            <GlassStat label="Jurisdiction Coverage" value={stats.jurisdictionCoveragePct !== undefined ? `${stats.jurisdictionCoveragePct}%` : '—'} icon={<RealIcon name="galaxy" size={16} alt="Coverage" />} />
            <GlassStat label="Evidence Coverage" value={stats.evidenceCoveragePct !== undefined ? `${stats.evidenceCoveragePct}%` : '—'} icon={<RealIcon name="audit" size={16} alt="Evidence" />} />
            <GlassStat label="Certified Coverage" value={stats.certifiedJurisdictionCoveragePct !== undefined ? `${stats.certifiedJurisdictionCoveragePct}%` : '—'} icon={<RealIcon name="shield" size={16} alt="Certified" />} />
            <GlassStat label="Audit Events (24h)" value={stats.auditEvents24h ?? '—'} icon={<RealIcon name="monitoring" size={16} alt="Audit Events" />} />
          </GlassGrid>
        )}

        {!loading && !error && stats && (
          <GlassCard variant="light" className="mb-8">
            <div className="text-sm font-semibold text-cyan-400 mb-2 flex items-center gap-2">
              <RealIcon name="audit" size={16} alt="Average Evidence" />
              Avg Evidence/Firm
            </div>
            <div className="text-4xl font-bold text-white">{stats.avgEvidencePerFirm ?? '—'}</div>
            <p className="text-xs text-slate-400 mt-2">Institutional depth indicator</p>
          </GlassCard>
        )}

        {!loading && !error && stats?.topJurisdictions && stats.topJurisdictions.length > 0 && (
          <GlassCard variant="light" className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                <RealIcon name="galaxy" size={16} alt="Jurisdictions" />
                Top Jurisdictions (Active Firms)
              </div>
              <span className="text-xs text-slate-400">Coverage snapshot</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.topJurisdictions.slice(0, 8).map((row) => (
                <Link
                  key={row.code}
                  href={`/rankings?jurisdiction=${encodeURIComponent(row.code)}`}
                  className="rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2 hover:border-cyan-400/40 hover:bg-slate-900/65 transition-colors"
                >
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">{row.code}</div>
                  <div className="text-sm font-semibold text-white truncate">{formatJurisdiction(row.code)}</div>
                  <div className="text-xs text-cyan-300 mt-1">{row.count} firm{row.count > 1 ? 's' : ''}</div>
                </Link>
              ))}
            </div>
          </GlassCard>
        )}

        {loading && (
          <GlassCard variant="light">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto" />
              <p className="text-slate-400 mt-4">Loading dashboard statistics...</p>
            </div>
          </GlassCard>
        )}

        {error && (
          <GlassCard variant="light" className="border-red-500/50">
            <div className="flex items-start gap-3">
              <RealIcon name="shield" size={22} alt="Warning" />
              <div>
                <h3 className="font-bold text-red-400">Failed to Load Dashboard</h3>
                <p className="text-red-300 text-sm mt-1">{error}</p>
                <button onClick={fetchStats} className="mt-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-sm font-medium transition-colors">
                  Retry
                </button>
              </div>
            </div>
          </GlassCard>
        )}

        <GlassCard variant="dark" className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <RealIcon name="operations" size={18} alt="Quick Actions" />
            <span>Quick Actions</span>
            <InfoTooltip
              content="Direct links to the most common operational commands and incident response screens."
              example="Start here for urgent actions: jobs, audit, logs, users, and policy lab."
              label="Quick actions explanation"
            />
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link href="/admin/jobs" className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 hover:from-cyan-500/20 hover:to-blue-600/20 border border-cyan-500/30 hover:border-cyan-500/50 px-4 py-4 rounded-xl font-semibold transition-all text-center text-cyan-300 hover:text-cyan-200 shadow-lg shadow-cyan-500/20 inline-flex items-center justify-center gap-2"><RealIcon name="jobs" size={16} alt="Run Jobs" />Run Jobs</Link>
            <Link href="/admin/audit" className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 hover:from-cyan-500/20 hover:to-blue-600/20 border border-cyan-500/30 hover:border-cyan-500/50 px-4 py-4 rounded-xl font-semibold transition-all text-center text-cyan-300 hover:text-cyan-200 shadow-lg shadow-cyan-500/20 inline-flex items-center justify-center gap-2"><RealIcon name="audit" size={16} alt="View Audit" />View Audit</Link>
            <Link href="/admin/logs" className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 hover:from-cyan-500/20 hover:to-blue-600/20 border border-cyan-500/30 hover:border-cyan-500/50 px-4 py-4 rounded-xl font-semibold transition-all text-center text-cyan-300 hover:text-cyan-200 shadow-lg shadow-cyan-500/20 inline-flex items-center justify-center gap-2"><RealIcon name="logs" size={16} alt="System Logs" />System Logs</Link>
            <Link href="/admin/users" className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 hover:from-cyan-500/20 hover:to-blue-600/20 border border-cyan-500/30 hover:border-cyan-500/50 px-4 py-4 rounded-xl font-semibold transition-all text-center text-cyan-300 hover:text-cyan-200 shadow-lg shadow-cyan-500/20 inline-flex items-center justify-center gap-2"><RealIcon name="users" size={16} alt="Manage Users" />Manage Users</Link>
            <Link href="/admin/agents/policies" className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 hover:from-cyan-500/20 hover:to-blue-600/20 border border-cyan-500/30 hover:border-cyan-500/50 px-4 py-4 rounded-xl font-semibold transition-all text-center text-cyan-300 hover:text-cyan-200 shadow-lg shadow-cyan-500/20 inline-flex items-center justify-center gap-2"><RealIcon name="operations" size={16} alt="Policy Lab" />Policy Lab</Link>
          </div>
        </GlassCard>

        {categories.map((category) => {
          const items = adminSections.filter((item) => item.category === category)
          return (
            <div key={category} className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <RealIcon name={categoryIcon[category]} size={18} alt={category} />
                <GradientText variant="h2">{category}</GradientText>
                <InfoTooltip
                  content="Functional grouping of admin modules by mission: operations, security, monitoring, data, advanced tooling, and scheduling."
                  label={`${category} category explanation`}
                />
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {items.map((section) => (
                  <Link key={section.href} href={section.href}>
                    <GlassCard variant="medium" className="group hover:shadow-cyan-500/30 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <RealIcon name={section.icon} size={24} alt={section.title} />
                        <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition transform group-hover:translate-x-1">View</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition">{section.title}</h3>
                      <p className="text-sm text-slate-400 mt-2">{section.description}</p>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}

        <GlassCard variant="dark" className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <RealIcon name="api" size={20} alt="Project Information" />
                <span>Project Information</span>
                <InfoTooltip
                  content="Architecture and environment context used for governance decisions and troubleshooting."
                  label="Project information explanation"
                />
              </h2>
              <p className="text-slate-300 mt-1">GTIXT - Governance, Transparency & Institutional eXcellence Tracking</p>
            </div>
            <Link href="/admin/info" className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-cyan-500/30">
              Learn More
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-bold text-cyan-300 block">Architecture</span>
              <span className="text-slate-300">Next.js + Prisma + PostgreSQL</span>
            </div>
            <div>
              <span className="font-bold text-cyan-300 block">Environment</span>
              <span className="text-slate-300">Production (NGINX + Let&apos;s Encrypt)</span>
            </div>
            <div>
              <span className="font-bold text-cyan-300 block">Last Updated</span>
              <span className="text-slate-300">{stats?.lastUpdate ? new Date(stats.lastUpdate).toLocaleDateString('fr-FR') : '—'}</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
