import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Layout from "../../../components/Layout";
import PageNavigation from "../../../components/PageNavigation";
import { useAdminAuth, adminFetch, adminLogout } from "../../../lib/admin-auth-guard";

interface ReviewCandidate {
  id: number;
  firm_id: string;
  firm_name: string;
  afs_name: string;
  fuzzy_score: string;
  review_status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  created_at: string;
  website_root: string | null;
  jurisdiction: string | null;
  jurisdiction_tier: string | null;
  asic_abn: string | null;
  asic_acn: string | null;
  asic_afs_licence: string | null;
  asic_company_status: string | null;
}

interface AuditEntry {
  id: number;
  action: string;
  details: any;
  triggered_by: string | null;
  occurred_at: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const ReviewCandidatePage: NextPage = () => {
  // Auth guard
  const auth = useAdminAuth();
  
  const router = useRouter();
  const { id } = router.query;
  const [candidate, setCandidate] = useState<ReviewCandidate | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [proofUrls, setProofUrls] = useState("");
  const [comment, setComment] = useState("");
  const [mounted, setMounted] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);

  const reviewId = useMemo(() => (typeof id === "string" ? Number(id) : NaN), [id]);

  const fetchCandidate = async () => {
    if (Number.isNaN(reviewId)) return;
    setLoading(true);
    const [candidateRes, auditRes] = await Promise.all([
      adminFetch(`/api/internal/review-queue/${reviewId}`),
      adminFetch(`/api/internal/review-queue/${reviewId}/audit`),
    ]);

    if (candidateRes.ok) {
      const json = await candidateRes.json();
      setCandidate(json.data || null);
    }
    if (auditRes.ok) {
      const json = await auditRes.json();
      setAudit(json.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    if (!auth.loading && auth.authenticated) {
      fetchCandidate();
    }
  }, [reviewId, auth.authenticated, auth.loading]);

  const submitAction = async (action: string) => {
    if (Number.isNaN(reviewId)) return;
    await adminFetch(`/api/internal/review-queue/${reviewId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        reviewer: "internal_ui",
        notes,
        proof_urls: proofUrls
          .split("\n")
          .map((url) => url.trim())
          .filter(Boolean),
      }),
    });
    setNotes("");
    setProofUrls("");
    fetchCandidate();
  };

  const submitComment = async () => {
    if (!comment.trim() || Number.isNaN(reviewId)) return;
    await adminFetch(`/api/internal/review-queue/${reviewId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "comment",
        reviewer: "internal_ui",
        notes: comment,
      }),
    });
    setComment("");
    fetchCandidate();
  };

  const sendChat = async () => {
    if (!chatInput.trim() || Number.isNaN(reviewId)) return;
    const message = chatInput.trim();
    setChat((prev) => [
      ...prev,
      { role: "user", content: message, timestamp: new Date().toISOString() },
    ]);
    setChatInput("");

    const res = await adminFetch("/api/internal/agent-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review_id: reviewId, message, user: "internal_ui" }),
    });
    if (res.ok) {
      const json = await res.json();
      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: json?.data?.reply || "No response",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const evidenceLinks = audit
    .flatMap((entry) => entry?.details?.proof_urls || [])
    .filter((url) => typeof url === "string" && url.trim().length > 0);

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
        { label: `Candidate ${id}`, href: `/admin/review/${id}` },
      ]}
    >
      <Head>
        <title>Review Candidate</title>
        <meta name="description" content="Review queue candidate detail" />
      </Head>

      <PageNavigation
        currentPage="/admin/review-queue"
        customButtons={[
          { href: "/admin/review-queue", label: "Review Queue" },
          { href: "/admin/users", label: "User Management" },
          { href: "/admin/change-password", label: "Change Password" },
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

      {loading && <div className="loading">Loading candidate...</div>}

      {candidate && (
        <div className="candidate-grid">
          <section className="card overview">
            <h1>{candidate.firm_name}</h1>
            <p className="subtext">AFS match: {candidate.afs_name}</p>
            <div className="overview-grid">
              <div>
                <span className="label">Score</span>
                <strong>{Number(candidate.fuzzy_score).toFixed(4)}</strong>
              </div>
              <div>
                <span className="label">Status</span>
                <strong className={`status status-${candidate.review_status}`}>
                  {candidate.review_status}
                </strong>
              </div>
              <div>
                <span className="label">Jurisdiction</span>
                <strong>{candidate.jurisdiction || "-"}</strong>
              </div>
              <div>
                <span className="label">Website</span>
                <strong>{candidate.website_root || "-"}</strong>
              </div>
            </div>
          </section>

          <section className="card evidence">
            <h2>Evidence Panel</h2>
            <div className="evidence-grid">
              <div>
                <span className="label">ABN</span>
                <strong>{candidate.asic_abn || "-"}</strong>
              </div>
              <div>
                <span className="label">ACN</span>
                <strong>{candidate.asic_acn || "-"}</strong>
              </div>
              <div>
                <span className="label">Company status</span>
                <strong>{candidate.asic_company_status || "Unknown"}</strong>
              </div>
              <div>
                <span className="label">AFS licence</span>
                <strong>{candidate.asic_afs_licence || "-"}</strong>
              </div>
            </div>
            <div className="proofs">
              <span className="label">Proof links</span>
              {evidenceLinks.length === 0 && <p>No proof links yet.</p>}
              {evidenceLinks.map((url, idx) => (
                <a key={`${url}-${idx}`} href={url} target="_blank" rel="noreferrer">
                  {url}
                </a>
              ))}
            </div>
          </section>

          <section className="card actions">
            <h2>Decision Panel</h2>
            <label className="label">Decision notes</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add decision rationale"
            />
            <label className="label">Proof URLs (one per line)</label>
            <textarea
              value={proofUrls}
              onChange={(event) => setProofUrls(event.target.value)}
              placeholder="https://..."
            />
            <div className="actions-row">
              <button className="btn approve" onClick={() => submitAction("approve")}>Approve</button>
              <button className="btn reject" onClick={() => submitAction("reject")}>Reject</button>
              <button className="btn escalate" onClick={() => submitAction("escalate")}>Needs proof</button>
            </div>
          </section>

          <section className="card collaboration">
            <h2>Notes and Collaboration</h2>
            <label className="label">Internal comment</label>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Add a comment for other reviewers"
            />
            <button className="btn secondary" onClick={submitComment}>Post comment</button>
          </section>

          <section className="card audit">
            <h2>Audit History</h2>
            <div className="audit-list">
              {audit.length === 0 && <p>No audit events yet.</p>}
              {audit.map((entry) => (
                <div key={entry.id} className="audit-entry">
                  <div>
                    <strong>{entry.action}</strong>
                    <span suppressHydrationWarning>
                      {mounted ? new Date(entry.occurred_at).toLocaleString("en-GB") : entry.occurred_at}
                    </span>
                  </div>
                  <p>{entry.triggered_by || "system"}</p>
                  {entry.details?.notes && <p className="note">{entry.details.notes}</p>}
                </div>
              ))}
            </div>
          </section>

          <section className="card chat">
            <h2>Agent Chat</h2>
            <div className="chat-box">
              {chat.length === 0 && (
                <div className="chat-empty">Ask the optimizer agent for guidance.</div>
              )}
              {chat.map((msg, idx) => (
                <div key={idx} className={`chat-msg ${msg.role}`}>
                  <span>{msg.content}</span>
                  <em>{new Date(msg.timestamp).toLocaleTimeString("en-GB")}</em>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask about evidence, status, or risk"
              />
              <button className="btn secondary" onClick={sendChat}>Send</button>
            </div>
          </section>
        </div>
      )}

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap");
        :root {
          --review-ink: #0f172a;
          --review-muted: #64748b;
          --review-border: rgba(148, 163, 184, 0.3);
          --review-surface: #ffffff;
          --review-accent: #0f766e;
          --review-danger: #dc2626;
        }
      `}</style>

      <style jsx>{`
        .loading {
          padding: 2rem;
          text-align: center;
          color: var(--review-muted);
        }
        .candidate-grid {
          display: grid;
          gap: 1.5rem;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          margin: 2rem 0 3rem;
        }
        .card {
          background: var(--review-surface);
          border-radius: 20px;
          padding: 1.5rem;
          border: 1px solid var(--review-border);
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
        }
        .overview h1 {
          margin: 0 0 0.5rem;
        }
        .subtext {
          color: var(--review-muted);
          margin-bottom: 1rem;
        }
        .overview-grid,
        .evidence-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
        }
        .label {
          display: block;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--review-muted);
        }
        .status {
          padding: 0.3rem 0.6rem;
          border-radius: 999px;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
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
          color: #1e3a8a;
        }
        textarea,
        input {
          width: 100%;
          border-radius: 12px;
          border: 1px solid var(--review-border);
          padding: 0.75rem;
          margin: 0.4rem 0 0.8rem;
          font-family: "IBM Plex Mono", monospace;
        }
        .actions-row {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .btn {
          border: none;
          border-radius: 999px;
          padding: 0.6rem 1.3rem;
          cursor: pointer;
          font-weight: 600;
        }
        .approve {
          background: rgba(34, 197, 94, 0.2);
          color: #166534;
        }
        .reject {
          background: rgba(239, 68, 68, 0.2);
          color: #991b1b;
        }
        .escalate {
          background: rgba(59, 130, 246, 0.2);
          color: #1e3a8a;
        }
        .secondary {
          background: rgba(15, 118, 110, 0.15);
          color: #0f766e;
        }
        .audit-list {
          display: grid;
          gap: 0.75rem;
        }
        .audit-entry {
          border-left: 3px solid rgba(15, 118, 110, 0.5);
          padding-left: 0.75rem;
        }
        .audit-entry span {
          display: block;
          color: var(--review-muted);
          font-size: 0.8rem;
        }
        .note {
          font-style: italic;
        }
        .chat-box {
          background: rgba(15, 23, 42, 0.04);
          border-radius: 12px;
          padding: 1rem;
          min-height: 160px;
        }
        .chat-msg {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }
        .chat-msg.user span {
          color: #0f766e;
        }
        .chat-msg.assistant span {
          color: #1e293b;
        }
        .chat-msg em {
          font-size: 0.7rem;
          color: var(--review-muted);
        }
        .chat-input {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.75rem;
        }
        .chat-input input {
          flex: 1;
        }
        .proofs a {
          display: block;
          color: #0f766e;
          margin-top: 0.35rem;
        }
      `}</style>
    </Layout>
  );
};

export default ReviewCandidatePage;
