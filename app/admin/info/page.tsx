'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { useState } from 'react';

export default function ProjectInfo() {
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');

  const sections = [
    {
      id: 'overview',
      title: 'Project Overview',
      icon: '📋',
      content: `GTIXT stands for "Governance, Transparency & Institutional eXcellence Tracking". It is a comprehensive system designed to:

• Monitor and rank Australian institutional firms by sustainability and governance standards
• Automate evidence collection from web crawls and API integrations
• Validate firm eligibility through multi-stage AI-powered processes
• Provide transparency in institutional decision-making
• Track compliance with regulatory requirements`
    },
    {
      id: 'architecture',
      title: 'System Architecture',
      icon: '🏗️',
      content: `GTIXT uses a modern, enterprise-grade architecture:

FRONTEND:
- Next.js 14 with App Router (React 18)
- Tailwind CSS + shadcn/ui components
- Real-time data updates and filtering

BACKEND:
- Node.js with Next.js API Routes
- Python data pipeline with 50 parallel workers
- OpenAI GPT-4 integration for AI validation

DATABASE & STORAGE:
- PostgreSQL 15 (localhost:5434)
- Prisma ORM for type-safe queries
- MinIO object storage for snapshots
- Redis cache (5min TTL, 94%+ hit rate)

MONITORING & OBSERVABILITY:
- Prometheus metrics export (/api/metrics)
- Grafana dashboards (localhost:3001)
- Real-time alerting (Slack + PagerDuty)
- Rate limiting (100 req/min per IP)

INFRASTRUCTURE:
- NGINX reverse proxy with SSL
- Let's Encrypt certificate management
- Automated PostgreSQL → S3 backups (daily)
- CI/CD with GitHub Actions
- Docker containerization
- Production: admin.gtixt.com`
    },
    {
      id: 'database',
      title: 'Database Structure',
      icon: '💾',
      content: `Core Tables:

ADMIN TABLES:
- AdminOperations: Audit trail of all actions
- AdminJobs: Job execution history
- AdminCrawls: Web crawl tracking
- AdminPlans: Task planning records
- AdminValidation: Data validation records
- AdminAlerts: System alerts

BUSINESS TABLES:
- firms: Core institutional data
- evidence_collection: Evidence from crawls
- agent_c_audit: AI validation results

KEY FIELDS:
- timestamps: When operations occurred
- user: Who performed the action
- resource: What was affected
- result: success/error status`
    },
    {
      id: 'jobs',
      title: 'Available Jobs',
      icon: '⚙️',
      content: `8 Real Python Scripts Available:

1. enrichment_daily - Daily data enrichment
2. scoring_update - Update firm scores
3. discovery_scan - Discover new firms
4. sentiment_analysis - Analyze firm sentiment
5. asic_sync - Sync ASIC registry data
6. full_pipeline - Complete data pipeline
7. database_cleanup - Data maintenance
8. snapshot_export - Export data snapshots

Each job:
- Runs real Python code
- Logs to AdminOperations table
- Captures stdout/stderr
- Tracks execution time`
    },
    {
      id: 'api',
      title: 'Admin APIs',
      icon: '🔌',
      content: `20+ API Endpoints Available:

OPERATIONS & MONITORING:
/api/admin/operations - Get/filter operations audit trail
/api/admin/dashboard-stats - Real-time KPI statistics
/api/admin/health - System health check
/api/metrics - Prometheus metrics export

DATA MANAGEMENT:
/api/admin/firms - Firm CRUD operations
/api/admin/validation - Data validation operations
/api/admin/crawls - Web crawler management
/api/admin/plans - Task planning
/api/snapshot/latest - Cached snapshot (Redis)

JOBS & EXECUTION:
/api/admin/jobs - List available Python jobs
/api/admin/jobs/execute - Execute job with real output
/api/admin/logs - Read system logs from filesystem

SECURITY & ADMIN:
/api/admin/alerts - System alerts management
/api/admin/copilot - AI assistant integration
/api/admin/users - User management (RBAC)

ENTERPRISE FEATURES:
- Rate limiting middleware (100 req/min)
- Redis caching layer
- Prometheus metrics
- JWT authentication with 24h expiration
- RBAC: admin, auditor, lead_reviewer, reviewer`
    },
    {
      id: 'procedures',
      title: 'Admin Procedures',
      icon: '📖',
      content: `Common Administrative Tasks:

VIEWING DATA:
1. Go to Audit page for operation history
2. Use filters to find specific operations
3. Click any row to see detailed payload
4. Export as CSV or JSON

RUNNING JOBS:
1. Navigate to Jobs/Execution page
2. Select job from dropdown
3. Click "Execute" button
4. Watch real-time output
5. Check database for results

DATA VALIDATION:
1. Go to Users page to manage admins
2. Add new user with password
3. Optional: Enable 2FA for security
4. Reset password if needed

ERROR HANDLING:
1. Check Audit page for failed operations
2. View error details in modal
3. Read System Logs for stack traces
4. Contact support if issue persists`
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting Guide',
      icon: '🔧',
      content: `Common Issues & Solutions:

ISSUE: Operation shows "error" status
FIX: Click the operation in Audit to view error details in the modal payload

ISSUE: Job execution fails
FIX: Check System Logs page for Python error messages, view job output

ISSUE: Page not loading
FIX: Clear browser cache, hard refresh (Ctrl+Shift+R), check console logs

ISSUE: Can't login
FIX: Check username/password, ensure cookies enabled, clear localStorage

ISSUE: 2FA not working
FIX: Sync device time, regenerate backup codes, try authenticator app

DATABASE ISSUES:
- Check PostgreSQL connection: /api/admin/health
- Verify database backups are recent
- Contact DBA if data inconsistency detected

PERFORMANCE:
- Check System Health page
- Review slow query logs
- Consider job scheduling during off-peak hours`
    },
    {
      id: 'security',
      title: 'Security Best Practices',
      icon: '🔐',
      content: `Recommended Security Measures:

AUTHENTICATION:
✓ Change password on first login
✓ Use strong, unique passwords (12+ chars)
✓ Enable 2FA for all admin accounts
✓ Keep backup codes in secure location
✓ Regularly rotate passwords (90 days)

AUDIT & MONITORING:
✓ Review audit logs weekly
✓ Monitor for unusual activity patterns
✓ Set up alerts for failed login attempts
✓ Track sensitive operations
✓ Export audit logs monthly for archival

DATA PROTECTION:
✓ Encrypt database backups
✓ Limit data access by role
✓ Never share credentials
✓ Use VPN for remote access
✓ Enable database query logging

SESSION MANAGEMENT:
✓ Log out after administrative work
✓ Don't share browser sessions
✓ Clear browser data when leaving machine
✓ Disable auto-save of passwords
✓ Use secure, private networks`
    },
    {
      id: 'features',
      title: 'Key Features',
      icon: '✨',
      content: `Production-Ready Capabilities:

✅ Real Python Script Execution
   - 8 jobs with actual data processing
   - Real-time output streaming
   - Execution tracking

✅ Complete Audit Trail
   - Every operation logged automatically
   - User attribution
   - Detailed error tracking
   - Export functionality

✅ Advanced Filtering & Search
   - Filter by user, type, date, status
   - Combined filter conditions
   - Grouping and aggregation
   - Analytics views

✅ Secure Authentication
   - Username/password with validation
   - Time-based OTP (TOTP) 2FA
   - Session management
   - Password strength requirements

✅ System Monitoring
   - Real-time health checks
   - Performance metrics
   - Log streaming from filesystem
   - Alert management

✅ Admin Tools
   - User management & roles
   - Manual firm addition
   - Validation workflows
   - Job scheduling`
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Hero Header */}
      <div className="relative border border-purple-400/30 rounded-3xl overflow-hidden bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-transparent backdrop-blur-md">
        <div className="absolute inset-0 bg-grid opacity-5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full"></div>
        <div className="relative z-10 p-8">
          <h1 className="text-5xl font-black text-white">📚 <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Project</span> Information</h1>
          <p className="text-white/70 mt-3 text-lg">Complete documentation and guide for GTIXT administration</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 flex-wrap">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setExpandedSection(section.id)}
            className={`px-5 py-3 rounded-xl font-bold transition backdrop-blur-md border ${
              expandedSection === section.id
                ? 'bg-purple-500/30 text-purple-300 border-purple-400/60 shadow-lg shadow-purple-500/30'
                : 'bg-white/5 text-white/70 hover:bg-white/10 border-white/10'
            }`}
          >
            {section.icon} {section.title}
          </button>
        ))}
      </div>

      {/* Content Sections */}
      {sections.map(section => (
        <div key={section.id} hidden={expandedSection !== section.id}>
          <Card className="p-8 border-l-4 border-l-purple-500 border border-purple-400/30 bg-gradient-to-br from-purple-500/10 to-blue-500/5 backdrop-blur-md shadow-xl shadow-purple-500/10">
            <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-3">
              <span className="text-4xl">{section.icon}</span>
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{section.title}</span>
            </h2>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
              <p className="text-white/90 leading-relaxed text-base">{section.content}</p>
            </div>
          </Card>
        </div>
      ))}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/admin/audit"
          className="p-6 bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-400/40 rounded-xl hover:shadow-xl hover:shadow-blue-500/20 transition backdrop-blur-md hover:scale-105"
        >
          <div className="text-3xl mb-3">📋</div>
          <div className="font-black text-blue-300 text-lg">Audit Trail</div>
          <div className="text-xs text-blue-400/70 mt-1">View all operations</div>
        </Link>

        <Link
          href="/admin/jobs"
          className="p-6 bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-400/40 rounded-xl hover:shadow-xl hover:shadow-purple-500/20 transition backdrop-blur-md hover:scale-105"
        >
          <div className="text-3xl mb-3">⚙️</div>
          <div className="font-black text-purple-300 text-lg">Jobs</div>
          <div className="text-xs text-purple-400/70 mt-1">Run Python scripts</div>
        </Link>

        <Link
          href="/admin/logs"
          className="p-6 bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-400/40 rounded-xl hover:shadow-xl hover:shadow-green-500/20 transition backdrop-blur-md hover:scale-105"
        >
          <div className="text-3xl mb-3">📜</div>
          <div className="font-black text-green-300 text-lg">Logs</div>
          <div className="text-xs text-green-400/70 mt-1">System logs</div>
        </Link>

        <Link
          href="/admin/users"
          className="p-6 bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-400/40 rounded-xl hover:shadow-xl hover:shadow-orange-500/20 transition backdrop-blur-md hover:scale-105"
        >
          <div className="text-3xl mb-3">👥</div>
          <div className="font-black text-orange-300 text-lg">Users</div>
          <div className="text-xs text-orange-400/70 mt-1">Manage admins</div>
        </Link>
      </div>

      {/* Video Guide */}
      <Card className="p-8 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/40 backdrop-blur-md shadow-xl shadow-indigo-500/20">
        <h3 className="text-2xl font-black text-indigo-300 mb-4">🎓 Learning Resources</h3>
        <div className="space-y-4">
          <p className="text-white/80 text-base">
            For more detailed information about GTIXT administration, refer to the system documentation or contact the engineering team.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/admin" className="px-5 py-3 bg-indigo-500/30 hover:bg-indigo-500/40 border border-indigo-400/50 text-indigo-300 rounded-xl font-bold transition backdrop-blur-sm shadow-lg shadow-indigo-500/30">
              ← Back to Dashboard
            </Link>
            <a
              href="https://github.com/gpti/gpti-site"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 bg-gray-500/30 hover:bg-gray-500/40 border border-gray-400/50 text-gray-300 rounded-xl font-bold transition backdrop-blur-sm shadow-lg shadow-gray-500/20"
            >
              🔗 GitHub Repository
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
