import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";
import PageNavigation from "../../components/PageNavigation";
import { useAdminAuth, adminFetch, adminLogout } from "../../lib/admin-auth-guard";

interface ReviewCandidate {
  id: number;
  firm_id: string;
  firm_name: string;
  afs_name: string;
  fuzzy_score: string;
  review_status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  website_root: string | null;
  jurisdiction: string | null;
  jurisdiction_tier: string | null;
}

interface QueueMeta {
  total: number;
  pending: number;
  avgScore: number;
  limit: number;
  offset: number;
}

interface AgentHealthSummary {
  agentsRunning: number;
  criticalIssues: number;
  lastUpdate: string;
}

const ReviewQueuePage: NextPage = () => {
  // Auth guard - redirects to login if not authenticated
  const auth = useAdminAuth();
  
  const [candidates, setCandidates] = useState<ReviewCandidate[]>([]);
  const [meta, setMeta] = useState<QueueMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [agentHealth, setAgentHealth] = useState<AgentHealthSummary | null>(null);
  const [mounted, setMounted] = useState(false);

  const [statusFilter, setStatusFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState("0.80");
  const [maxScore, setMaxScore] = useState("0.90");
  const [jurisdiction, setJurisdiction] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    if (minScore) params.set("minScore", minScore);
    if (maxScore) params.set("maxScore", maxScore);
    if (jurisdiction) params.set("jurisdiction", jurisdiction);
    params.set("limit", "100");
    return params.toString();
  }, [statusFilter, search, minScore, maxScore, jurisdiction]);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/internal/review-queue?${queryString}`);
      if (!res.ok) throw new Error("Failed to load queue");
      const json = await res.json();
      setCandidates(json.data || []);
      setMeta(json.meta || null);
      setLastUpdated(new Date().toISOString());
    } catch (err: any) {
      setError(err.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentHealth = async () => {
    try {
      const res = await fetch("/api/agents/health");
      if (!res.ok) return;
      const json = await res.json();
      setAgentHealth({
        agentsRunning: json?.agentsRunning || 0,
        criticalIssues: json?.criticalIssues || 0,
        lastUpdate: json?.lastUpdate || new Date().toISOString(),
      });
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {    setMounted(true);    
    if (!auth.loading && auth.authenticated) {
      fetchQueue();
      const interval = setInterval(fetchQueue, 45000);
      return () => clearInterval(interval);
    }
  }, [queryString, auth.authenticated, auth.loading]);

  useEffect(() => {
    if (!auth.loading && auth.authenticated) {
      fetchAgentHealth();
      const interval = setInterval(fetchAgentHealth, 60000);
      return () => clearInterval(interval);
    }
  }, [auth.authenticated, auth.loading]);

  const avgScore = meta?.avgScore ? meta.avgScore.toFixed(3) : "0.000";
  const pendingCount = meta?.pending ?? 0;

  const projectSignals = [
    {
      label: "Queue pending",
      value: pendingCount,
      hint: pendingCount > 10 ? "High backlog" : "Stable",
    },
    {
      label: "Average score",
      value: avgScore,
      hint: Number(avgScore) >= 0.86 ? "High confidence" : "Needs proof",
    },
    {
      label: "Agents running",
      value: agentHealth?.agentsRunning ?? "-",
      hint: agentHealth?.criticalIssues ? "Issues detected" : "Operational",
    },
  ];

  // Show loading during auth check
  if (auth.loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0e27' }}>
        <div style={{ textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
          <p>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout
      breadcrumbs={[
        { label: "Admin", href: "/admin/review-queue" },
        { label: "Review Queue", href: "/admin/review-queue" },
      ]}
    >
      <Head>
        <title>Review Queue - Internal Console</title>
        <meta name="description" content="Internal review queue and compliance operations" />
      </Head>

      <PageNavigation
        currentPage="/admin/review-queue"
        customButtons={[
          { href: "/admin/review-queue", label: "Review Queue" },
          { href: "/admin/users", label: "User Management" },
          { href: "/admin/change-password", label: "Change Password" },
          { href: "/admin/setup-2fa", label: "Setup 2FA" },
          { href: "/agents-dashboard", label: "Agents Monitor" },
          { href: "/audit-trails", label: "Audit Trails" },
        ]}
      />

      <div style={{ background: '#0f1423', padding: '8px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#888', fontSize: '13px' }}>
          👤 {auth.user?.username} ({auth.user?.role})
        </span>
        <button 
          onClick={() => adminLogout()}
          style={{ 
            background: 'transparent', 
            border: '1px solid rgba(255,255,255,0.1)', 
            color: '#888', 
            padding: '4px 12px', 
            borderRadius: '4px', 
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          Logout
        </button>
      </div>

      <section className="hero">
        <div className="hero-content">
          <div>
            <div className="hero-kicker">Institutional Review Console</div>
            <h1>Review Queue Operations</h1>
            <p>
              Prioritize, verify, and approve regulatory matches with full audit trails,
              project governance, and live monitoring.
            </p>
          </div>
          <div className="hero-stats">
            <div>
              <span className="stat-label">Pending</span>
              <span className="stat-value">{pendingCount}</span>
            </div>
            <div>
              <span className="stat-label">Avg score</span>
              <span className="stat-value">{avgScore}</span>
            </div>
            <div>
              <span className="stat-label">Last update</span>
              <span className="stat-value" suppressHydrationWarning>
                {mounted && lastUpdated ? new Date(lastUpdated).toLocaleTimeString("en-GB") : "-"}
              </span>
            </div>
          </div>
        </div>
        <div className="hero-orbit" />
      </section>

      <section className="filter-panel">
        <div className="filter-field">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Firm, AFS, domain"
          />
        </div>
        <div className="filter-field">
          <label htmlFor="status">Status</label>
          <select id="status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="escalated">Escalated</option>
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="minScore">Min score</label>
          <input
            id="minScore"
            value={minScore}
            onChange={(event) => setMinScore(event.target.value)}
            placeholder="0.80"
          />
        </div>
        <div className="filter-field">
          <label htmlFor="maxScore">Max score</label>
          <input
            id="maxScore"
            value={maxScore}
            onChange={(event) => setMaxScore(event.target.value)}
            placeholder="0.90"
          />
        </div>
        <div className="filter-field">
          <label htmlFor="jurisdiction">Jurisdiction</label>
          <input
            id="jurisdiction"
            value={jurisdiction}
            onChange={(event) => setJurisdiction(event.target.value)}
            placeholder="AU, UK, US"
          />
        </div>
        <button className="refresh" onClick={fetchQueue} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      <section className="queue-table">
        <div className="section-header">
          <div>
            <h2>Review Queue</h2>
            <p>Filtered candidates ready for manual verification and approval.</p>
          </div>
          {error && <span className="error">{error}</span>}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Firm</th>
                <th>AFS Match</th>
                <th>Score</th>
                <th>Status</th>
                <th>Jurisdiction</th>
                <th>Reviewed by</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">No candidates found.</td>
                </tr>
              )}
              {candidates.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link href={`/admin/review/${row.id}`} className="firm-link">
                      {row.firm_name}
                    </Link>
                    <span className="subtext">{row.website_root || row.firm_id}</span>
                  </td>
                  <td>{row.afs_name}</td>
                  <td>{Number(row.fuzzy_score).toFixed(4)}</td>
                  <td>
                    <span className={`status status-${row.review_status}`}>
                      {row.review_status}
                    </span>
                  </td>
                  <td>{row.jurisdiction || "-"}</td>
                  <td>{row.reviewed_by || "-"}</td>
                  <td suppressHydrationWarning>{mounted ? new Date(row.created_at).toLocaleDateString("en-GB") : row.created_at.split('T')[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="project-ops">
        <div className="section-header">
          <div>
            <h2>Project Management</h2>
            <p>Operational plan, collaboration, and automated supervision.</p>
          </div>
        </div>

        <div className="ops-grid">
          <div className="ops-card">
            <h3>Execution Signals</h3>
            <ul>
              {projectSignals.map((signal) => (
                <li key={signal.label}>
                  <span>{signal.label}</span>
                  <strong>{signal.value}</strong>
                  <em>{signal.hint}</em>
                </li>
              ))}
            </ul>
          </div>
          <div className="ops-card">
            <h3>Auto Updates</h3>
            <p>
              Auto refresh runs every 45 seconds. Monitoring data refreshes every
              60 seconds. Decisions are logged instantly to the audit trail.
            </p>
            <div className="ops-tag">Auto refresh: enabled</div>
          </div>
          <div className="ops-card">
            <h3>Decision Path</h3>
            <ol>
              <li>Review evidence and fuzzy score.</li>
              <li>Request proof if score below 0.86.</li>
              <li>Approve or reject with notes.</li>
              <li>Audit trail locks decision.</li>
            </ol>
          </div>
        </div>

        <div className="ops-grid">
          <div className="ops-card">
            <h3>Collaborators</h3>
            <div className="badge-row">
              <span className="badge">Product Owner</span>
              <span className="badge">Lead Reviewer</span>
              <span className="badge">Compliance Auditor</span>
              <span className="badge">AI Lab</span>
              <span className="badge">DevOps</span>
            </div>
            <p>Roles are enforced by internal policy. Approvals are locked to reviewers.</p>
          </div>
          <div className="ops-card">
            <h3>Standard Operating Steps</h3>
            <ul>
              <li>Daily queue scan at 09:00 UTC.</li>
              <li>Proof validation within 48 hours.</li>
              <li>Escalation for unclear matches.</li>
              <li>Weekly compliance export.</li>
            </ul>
          </div>
          <div className="ops-card">
            <h3>Optimizer Agent</h3>
            <p>
              Internal agent monitors queue health, suggests proof sources, and
              highlights stalled decisions. Use candidate chat for fast guidance.
            </p>
            <div className="ops-tag">Agent mode: monitoring</div>
          </div>
        </div>
      </section>

      <section className="monitoring">
        <div className="section-header">
          <div>
            <h2>Monitoring and Governance</h2>
            <p>Live oversight for the entire compliance pipeline.</p>
          </div>
        </div>
        <div className="monitor-grid">
          <div className="monitor-card">
            <h4>Agent Uptime</h4>
            <p>
              {agentHealth?.criticalIssues
                ? "Attention required"
                : "All agents operational"}
            </p>
            <span suppressHydrationWarning>
              Last refresh: {mounted && agentHealth?.lastUpdate ? new Date(agentHealth.lastUpdate).toLocaleString("en-GB") : "-"}
            </span>
          </div>
          <div className="monitor-card">
            <h4>Audit Integrity</h4>
            <p>All decisions are timestamped and immutable.</p>
            <span>Export audit logs weekly</span>
          </div>
          <div className="monitor-card">
            <h4>Compliance SLA</h4>
            <p>Target decision time: 48 hours.</p>
            <span>Pending backlog: {pendingCount}</span>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap");
        :root {
          --review-ink: #111827;
          --review-muted: #5b6472;
          --review-accent: #0f766e;
          --review-amber: #f59e0b;
          --review-bg: #0f172a;
          --review-surface: #111827;
          --review-border: rgba(148, 163, 184, 0.2);
          --review-card: rgba(15, 23, 42, 0.6);
          --review-highlight: #22c55e;
          --review-font: "Space Grotesk", "Segoe UI", sans-serif;
          --review-mono: "IBM Plex Mono", "Courier New", monospace;
        }
        body {
          font-family: var(--review-font);
        }
      `}</style>

      <style jsx>{`
        .hero {
          position: relative;
          overflow: hidden;
          margin: 2rem auto;
          padding: 2.5rem 2.75rem;
          border-radius: 24px;
          background: radial-gradient(circle at top left, rgba(56, 189, 248, 0.2), transparent 55%),
            linear-gradient(120deg, #0f172a 0%, #1e293b 55%, #0f766e 100%);
          color: #f8fafc;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.4);
        }
        .hero-content {
          display: flex;
          justify-content: space-between;
          gap: 2rem;
          align-items: center;
        }
        .hero h1 {
          font-size: 2.75rem;
          margin: 0.5rem 0 0.75rem;
          letter-spacing: -0.02em;
        }
        .hero p {
          max-width: 520px;
          color: rgba(248, 250, 252, 0.78);
          margin: 0;
        }
        .hero-kicker {
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          color: rgba(248, 250, 252, 0.6);
        }
        .hero-stats {
          display: grid;
          gap: 1rem;
          text-align: right;
        }
        .stat-label {
          display: block;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: rgba(248, 250, 252, 0.6);
        }
        .stat-value {
          font-size: 1.4rem;
          font-weight: 600;
        }
        .hero-orbit {
          position: absolute;
          inset: auto -20% -120% auto;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          border: 1px dashed rgba(148, 163, 184, 0.4);
          opacity: 0.6;
        }
        .filter-panel {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          background: var(--review-card);
          border: 1px solid var(--review-border);
          border-radius: 20px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          backdrop-filter: blur(12px);
        }
        .filter-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          color: #e2e8f0;
        }
        .filter-field input,
        .filter-field select {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.3);
          border-radius: 12px;
          color: #f8fafc;
          padding: 0.6rem 0.75rem;
        }
        .refresh {
          align-self: flex-end;
          background: rgba(34, 197, 94, 0.2);
          border: 1px solid rgba(34, 197, 94, 0.4);
          color: #dcfce7;
          padding: 0.6rem 1.2rem;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 600;
        }
        .queue-table {
          background: rgba(248, 250, 252, 0.9);
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
          margin-bottom: 2.5rem;
        }
        .section-header h2 {
          margin: 0;
          font-size: 1.6rem;
          color: var(--review-ink);
        }
        .section-header p {
          color: var(--review-muted);
          margin: 0.4rem 0 0;
        }
        .error {
          color: #ef4444;
          font-weight: 600;
        }
        .table-wrap {
          margin-top: 1.5rem;
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th,
        td {
          text-align: left;
          padding: 0.9rem 0.75rem;
          border-bottom: 1px solid rgba(148, 163, 184, 0.3);
          font-size: 0.95rem;
        }
        th {
          text-transform: uppercase;
          font-size: 0.7rem;
          letter-spacing: 0.14em;
          color: var(--review-muted);
        }
        .firm-link {
          font-weight: 600;
          color: #0f172a;
          text-decoration: none;
        }
        .subtext {
          display: block;
          font-size: 0.75rem;
          color: var(--review-muted);
        }
        .status {
          padding: 0.3rem 0.6rem;
          border-radius: 999px;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          background: #e2e8f0;
          color: #0f172a;
        }
        .status-pending {
          background: rgba(245, 158, 11, 0.2);
          color: #92400e;
        }
        .status-approved {
          background: rgba(34, 197, 94, 0.2);
          color: #166534;
        }
        .status-rejected {
          background: rgba(239, 68, 68, 0.2);
          color: #991b1b;
        }
        .status-escalated {
          background: rgba(59, 130, 246, 0.2);
          color: #1e40af;
        }
        .empty {
          text-align: center;
          color: var(--review-muted);
          padding: 2rem 0;
        }
        .project-ops {
          margin-bottom: 2.5rem;
        }
        .ops-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          margin-top: 1.5rem;
        }
        .ops-card {
          background: rgba(15, 23, 42, 0.9);
          color: #e2e8f0;
          border-radius: 18px;
          padding: 1.5rem;
          border: 1px solid rgba(148, 163, 184, 0.2);
        }
        .ops-card h3 {
          margin-top: 0;
          font-size: 1.1rem;
        }
        .ops-card ul,
        .ops-card ol {
          padding-left: 1.2rem;
          margin: 0.8rem 0 0;
        }
        .ops-card li {
          margin-bottom: 0.4rem;
        }
        .ops-card em {
          display: block;
          font-size: 0.75rem;
          color: rgba(226, 232, 240, 0.7);
        }
        .badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .badge {
          background: rgba(15, 118, 110, 0.2);
          border: 1px solid rgba(15, 118, 110, 0.5);
          padding: 0.3rem 0.7rem;
          border-radius: 999px;
          font-size: 0.75rem;
        }
        .ops-tag {
          margin-top: 1rem;
          display: inline-block;
          padding: 0.3rem 0.7rem;
          border-radius: 999px;
          background: rgba(59, 130, 246, 0.2);
          color: #bfdbfe;
          font-size: 0.75rem;
        }
        .monitoring {
          margin-bottom: 3rem;
        }
        .monitor-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          margin-top: 1.5rem;
        }
        .monitor-card {
          background: #f8fafc;
          border: 1px solid rgba(148, 163, 184, 0.3);
          border-radius: 16px;
          padding: 1.5rem;
        }
        .monitor-card h4 {
          margin-top: 0;
        }
        @media (max-width: 900px) {
          .hero-content {
            flex-direction: column;
            align-items: flex-start;
          }
          .hero-stats {
            text-align: left;
          }
        }
      `}</style>
    </Layout>
  );
};

export default ReviewQueuePage;
