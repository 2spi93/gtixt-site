'use client';

import Head from "next/head";
import { useTranslation } from "../../lib/useTranslationStub";
import InstitutionalHeader from "../../components/InstitutionalHeader";
import Link from "next/link";

export default function GettingStarted() {
  const { t } = useTranslation("common");

  return (
    <div style={styles.container}>
      <Head>
        <title>Getting Started - GTIXT</title>
        <meta name="description" content="Getting started guide for GTIXT benchmarking data. Access rankings, download snapshots, and integrate with your systems." />
      </Head>

      <InstitutionalHeader breadcrumbs={[{ label: "Getting Started", href: "/docs/getting-started" }]} />

      <div style={styles.pageHeader}>
        <div style={styles.contentContainer}>
          <p style={styles.eyebrow}>Documentation</p>
          <h1 style={styles.h1}>Getting Started with GTIXT</h1>
          <p style={styles.lead}>
            Quick start guide to access rankings, download snapshots, and integrate GTIXT data into your workflow.
          </p>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.contentContainer}>
          {/* Section 1: Browse Rankings */}
          <div style={styles.section}>
            <h2 style={styles.h2}>1. Browse Firm Rankings</h2>
            <p style={styles.p}>
              The easiest way to get started is to visit the <Link href="/rankings" style={styles.link}>Rankings page</Link> to see all 100+ proprietary trading firms in the current benchmark.
            </p>
            <div style={styles.card}>
              <h3 style={styles.h3}>What you'll find:</h3>
              <ul style={styles.list}>
                <li style={styles.listItem}><strong>Firm Name & Website</strong> — Direct links to each firm's public site</li>
                <li style={styles.listItem}><strong>Integrity Score (0–100)</strong> — Composite measure of structural quality</li>
                <li style={styles.listItem}><strong>Pillar Scores</strong> — Breakdown by Transparency, Risk Model, Compliance, etc.</li>
                <li style={styles.listItem}><strong>Status</strong> — Pass, Review, or Candidate confidence level</li>
                <li style={styles.listItem}><strong>Link to Full Details</strong> — Click any firm to see detailed evidence</li>
              </ul>
            </div>
          </div>

          {/* Section 2: Download Snapshots */}
          <div style={styles.section}>
            <h2 style={styles.h2}>2. Download Snapshots</h2>
            <p style={styles.p}>
              Visit the <Link href="/data" style={styles.link}>Data page</Link> to download complete snapshots in JSON format. Each snapshot includes all firm records, metadata, and a SHA-256 hash for verification.
            </p>
            <div style={styles.card}>
              <h3 style={styles.h3}>What's in a snapshot:</h3>
              <ul style={styles.list}>
                <li style={styles.listItem}><code style={styles.code}>snapshot_id</code> — Unique identifier (YYYY-MM-DD)</li>
                <li style={styles.listItem}><code style={styles.code}>records[]</code> — Array of firm objects with full data</li>
                <li style={styles.listItem}><code style={styles.code}>sha256_hash</code> — Cryptographic fingerprint for integrity verification</li>
                <li style={styles.listItem}><code style={styles.code}>generated_at</code> — Timestamp of snapshot creation</li>
              </ul>
            </div>
          </div>

          {/* Section 3: Verify Integrity */}
          <div style={styles.section}>
            <h2 style={styles.h2}>3. Verify Snapshot Integrity</h2>
            <p style={styles.p}>
              Use the <Link href="/integrity" style={styles.link}>Integrity page</Link> to verify that snapshot data has not been modified. Upload or paste the SHA-256 hash to confirm authenticity.
            </p>
            <div style={styles.card}>
              <h3 style={styles.h3}>Verification steps:</h3>
              <ol style={styles.orderedList}>
                <li style={styles.listItem}>Open the <Link href="/integrity" style={styles.link}>Integrity Verification</Link> page</li>
                <li style={styles.listItem}>Click "Verify Latest Snapshot" to fetch the current hash</li>
                <li style={styles.listItem}>Compare with the hash published on this website (immutable)</li>
                <li style={styles.listItem}>✅ Match = Authentic, ❌ Mismatch = Alert</li>
              </ol>
            </div>
          </div>

          {/* Section 4: Use the REST API */}
          <div style={styles.section}>
            <h2 style={styles.h2}>4. Use the REST API (For Developers)</h2>
            <p style={styles.p}>
              For programmatic access, integrate GTIXT data via our REST API. See the <Link href="/api-docs" style={styles.link}>API Documentation</Link> for complete endpoint reference.
            </p>
            <div style={styles.card}>
              <h3 style={styles.h3}>Key endpoints:</h3>
              <ul style={styles.list}>
                <li style={styles.listItem}><code style={styles.code}>GET /api/firms</code> — Fetch all firms with pagination</li>
                <li style={styles.listItem}><code style={styles.code}>GET /api/health</code> — Check system status</li>
                <li style={styles.listItem}><code style={styles.code}>GET /api/snapshots</code> — List historical snapshots</li>
              </ul>
              <p style={styles.p}>
                <strong>Example:</strong>
              </p>
              <pre style={styles.codeBlock}>
{`curl -s http://localhost:3000/api/firms?limit=10&sort=score | jq .`}
              </pre>
            </div>
          </div>

          {/* Section 5: Understand the Methodology */}
          <div style={styles.section}>
            <h2 style={styles.h2}>5. Understand the Methodology</h2>
            <p style={styles.p}>
              To understand how scores are calculated, read the <Link href="/methodology" style={styles.link}>Methodology page</Link> or the <Link href="/whitepaper" style={styles.link}>Whitepaper</Link> for the full institutional specification.
            </p>
            <div style={styles.card}>
              <h3 style={styles.h3}>Key concepts:</h3>
              <ul style={styles.list}>
                <li style={styles.listItem}><strong>Five-Pillar Framework</strong> — Transparency, Risk Model, Payout Reliability, Compliance, Reputation</li>
                <li style={styles.listItem}><strong>Deterministic Scoring</strong> — Same inputs always produce same outputs</li>
                <li style={styles.listItem}><strong>Evidence-Based</strong> — All inputs derived from public sources with timestamps</li>
                <li style={styles.listItem}><strong>NA Neutral</strong> — Missing data doesn't penalize scores automatically</li>
              </ul>
            </div>
          </div>

          {/* Section 6: FAQ */}
          <div style={styles.section}>
            <h2 style={styles.h2}>6. Frequently Asked Questions</h2>
            <p style={styles.p}>
              For answers to common questions about data, API access, and subscriptions, see the <Link href="/docs/faq" style={styles.link}>FAQ</Link>.
            </p>
          </div>

          {/* Section 7: Support & Feedback */}
          <div style={styles.section}>
            <h2 style={styles.h2}>Need Help?</h2>
            <p style={styles.p}>
              Have questions or feedback? <Link href="/contact" style={styles.link}>Get in touch</Link> or email us at:
            </p>
            <ul style={styles.list}>
              <li style={styles.listItem}>📧 <a href="mailto:support@center.gtixt.com" style={styles.link}>support@center.gtixt.com</a> — Data & methodology questions</li>
              <li style={styles.listItem}>📧 <a href="mailto:first@api.gtixt.com" style={styles.link}>first@api.gtixt.com</a> — API & integration support</li>
              <li style={styles.listItem}>📧 <a href="mailto:support@center.gtixt.com" style={styles.link}>support@center.gtixt.com</a> — Business inquiries</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #070B12 0%, #0F1620 100%)",
    color: "#E5E7EB",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  contentContainer: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "0 2rem",
  },
  pageHeader: {
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    padding: "4rem 0 3rem",
    background: "rgba(0, 20, 40, 0.4)",
  },
  eyebrow: {
    margin: "0 0 0.75rem 0",
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#00D1C1",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  h1: {
    margin: "0 0 1rem 0",
    fontSize: "2.5rem",
    fontWeight: 700,
    lineHeight: 1.2,
    color: "#FFFFFF",
  },
  lead: {
    margin: "0",
    fontSize: "1.125rem",
    lineHeight: 1.5,
    color: "#B8BCC8",
  },
  content: {
    padding: "3rem 0",
  },
  section: {
    marginBottom: "3rem",
  },
  h2: {
    margin: "0 0 1.5rem 0",
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#FFFFFF",
  },
  h3: {
    margin: "0 0 1rem 0",
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#E5E7EB",
  },
  p: {
    margin: "0 0 1.5rem 0",
    fontSize: "1rem",
    lineHeight: 1.6,
    color: "#B8BCC8",
  },
  card: {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(0, 209, 193, 0.1)",
    borderRadius: "8px",
    padding: "1.5rem",
    marginTop: "1rem",
  },
  list: {
    margin: "0 0 1rem 0",
    paddingLeft: "1.5rem",
    listStyle: "disc",
  },
  listItem: {
    margin: "0 0 0.75rem 0",
    fontSize: "1rem",
    lineHeight: 1.6,
    color: "#B8BCC8",
  },
  orderedList: {
    margin: "0 0 1rem 0",
    paddingLeft: "1.5rem",
    listStyle: "decimal",
  },
  link: {
    color: "#00D1C1",
    textDecoration: "none",
    cursor: "pointer",
    fontWeight: 500,
    borderBottom: "1px solid rgba(0, 209, 193, 0.2)",
  },
  code: {
    background: "rgba(0, 209, 193, 0.1)",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "0.9rem",
    color: "#00D1C1",
  },
  codeBlock: {
    background: "rgba(0, 0, 0, 0.3)",
    padding: "1rem",
    borderRadius: "8px",
    borderLeft: "3px solid #00D1C1",
    fontFamily: "monospace",
    fontSize: "0.9rem",
    color: "#00D1C1",
    margin: "1rem 0",
    overflowX: "auto",
  },
};
