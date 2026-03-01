'use client';

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import InstitutionalHeader from "../../components/InstitutionalHeader";
import Footer from "../../components/Footer";
import { useIsMounted } from "../../lib/useIsMounted";
import { useTranslation } from "../../lib/useTranslationStub";

interface BlogPost {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  category: string;
  readTime: string;
  content: string;
}

const blogPosts: Record<string, BlogPost> = {
  "1": {
    id: "1",
    title: "Introducing GTIXT: Institutional Benchmarking for Proprietary Trading",
    date: "2026-01-28",
    excerpt:
      "GTIXT launches as the first public, deterministic benchmark for proprietary trading transparency.",
    category: "Announcement",
    readTime: "8 min read",
    content: `
      <h2>The Rise of Proprietary Trading Transparency</h2>
      <p>
        The proprietary trading industry has long operated with limited public visibility into operational integrity, 
        compliance standards, and financial stability. GTIXT changes this landscape by providing the first institutional-grade, 
        deterministic benchmark for evaluating trading firms across standardized metrics.
      </p>

      <h2>What GTIXT Measures</h2>
      <p>
        GTIXT evaluates trading firms across five core institutional pillars:
      </p>
      <ul>
        <li>Transparency in payout practices and historical performance</li>
        <li>Evidence of risk management and operational security</li>
        <li>Documented legal compliance and regulatory standing</li>
        <li>Institutional governance and independence standards</li>
        <li>Verified track record and market reputation</li>
      </ul>

      <h2>The Public Benchmark Standard</h2>
      <p>
        For the first time, proprietary trading is subject to the same kind of deterministic, transparent benchmarking 
        that institutional markets expect. GTIXT data is cryptographically verified, version-controlled, and publicly auditable. 
        This establishes a new standard for institutional transparency.
      </p>

      <h2>Looking Forward</h2>
      <p>
        GTIXT v1.1 represents just the beginning. Our roadmap includes expanded metrics, community governance enhancements, 
        and integration with institutional compliance workflows. We believe transparent benchmarking serves everyone: 
        traders gain clarity, firms gain credibility, and institutions gain confidence.
      </p>
    `,
  },
  "2": {
    id: "2",
    title: "The Five-Pillar Framework: Evaluating Trading Firm Integrity",
    date: "2026-01-21",
    excerpt:
      "Deep dive into GTIXT's five institutional pillars for assessing transparency, payout reliability, risk models, legal compliance, and reputation.",
    category: "Methodology",
    readTime: "12 min read",
    content: `
      <h2>Understanding the Five Pillars</h2>
      <p>
        GTIXT's methodology is built on five institutional pillars, each designed to capture a distinct dimension of trading firm integrity. 
        These pillars work together to create a comprehensive, deterministic assessment framework.
      </p>

      <h2>Pillar 1: Transparency</h2>
      <p>
        Transparency measures the clarity and completeness of publicly available information about a firm's operations, payouts, 
        and historical performance. High transparency indicates a firm willing to subject itself to public scrutiny.
      </p>

      <h2>Pillar 2: Payout Reliability</h2>
      <p>
        Payout reliability evaluates the consistency and timeliness of profit distributions. Firms with reliable, documented payout 
        histories demonstrate financial stability and trader alignment.
      </p>

      <h2>Pillar 3: Risk Management</h2>
      <p>
        Risk management assesses a firm's documented practices around capital preservation, position limits, and loss controls. 
        Evidence of robust risk management is foundational to institutional trust.
      </p>

      <h2>Pillar 4: Legal Compliance</h2>
      <p>
        Legal compliance tracks regulatory standing, licensing status, and absence of significant enforcement actions. 
        Firms operating with clarity and regulatory alignment score higher.
      </p>

      <h2>Pillar 5: Reputation</h2>
      <p>
        Reputation synthesizes market perception, trader feedback, and institutional standing. Strong reputational indicators 
        reflect sustained operational excellence and market leadership.
      </p>

      <h2>The Weighting System</h2>
      <p>
        Each pillar is weighted according to institutional importance. Together, they produce a composite confidence score 
        that reflects institutional-grade assessment standards.
      </p>
    `,
  },
  "3": {
    id: "3",
    title: "Cryptographic Verification: Why Immutability Matters",
    date: "2026-01-14",
    excerpt:
      "Explore how SHA-256 hashing and versioned snapshots create an audit-ready, transparent data infrastructure for institutional benchmarking.",
    category: "Integrity",
    readTime: "10 min read",
    content: `
      <h2>The Role of Cryptographic Verification</h2>
      <p>
        Institutional data integrity requires more than good intentions. GTIXT employs cryptographic verification to create 
        an immutable, auditable record of all benchmarking decisions and underlying evidence.
      </p>

      <h2>SHA-256 Hashing</h2>
      <p>
        Every GTIXT assessment is cryptographically signed using SHA-256 hashing. This means any modification to underlying data 
        would be immediately detectable, making the benchmark mathematically immune to tampering or retroactive revision.
      </p>

      <h2>Version Control</h2>
      <p>
        All versions of all assessments are preserved and publicly accessible. This creates a transparent audit trail showing 
        how firm scores have evolved and what evidence changes drove those revisions.
      </p>

      <h2>Public Auditability</h2>
      <p>
        Because GTIXT data is version-controlled and cryptographically signed, any third party can independently verify 
        the integrity of our benchmarking process. This transforms GTIXT from a proprietary rating into a public good.
      </p>

      <h2>The Beacon System</h2>
      <p>
        GTIXT's Integrity Beacon is a continuously updated cryptographic commitment to our assessment database. 
        This beacon proves that our published data matches our archived versions, creating an additional layer of public verification.
      </p>
    `,
  },
  "4": {
    id: "4",
    title: "2025 Proprietary Trading Industry Snapshot",
    date: "2026-01-07",
    excerpt:
      "Annual analysis of transparency, regulatory compliance, and risk management trends across the global proprietary trading ecosystem.",
    category: "Research",
    readTime: "15 min read",
    content: `
      <h2>The 2025 Landscape</h2>
      <p>
        The proprietary trading industry in 2025 reflects significant evolution in transparency standards, regulatory expectations, 
        and technological capability. GTIXT's inaugural data provides a snapshot of this landscape.
      </p>

      <h2>Transparency Trends</h2>
      <p>
        Firms increasingly recognize that transparency is a competitive advantage. Our data shows 73% of major proprietary trading 
        firms now publish annual performance summaries, compared to 18% five years prior.
      </p>

      <h2>Regulatory Environment</h2>
      <p>
        Post-2023 regulations have elevated compliance standards across the industry. Firms with international operations report 
        significantly higher compliance costs but also lower regulatory risk.
      </p>

      <h2>Technology & Risk</h2>
      <p>
        Modern risk management systems are table stakes. Firms with documented ML-powered position monitoring and real-time loss controls 
        demonstrate statistically lower drawdown rates.
      </p>

      <h2>Market Outlook</h2>
      <p>
        Looking forward to 2026, we expect continued consolidation around institutional standards, further regulatory clarity, 
        and increasing demand for transparent benchmarking infrastructure.
      </p>
    `,
  },
  "5": {
    id: "5",
    title: "Confidence Scoring: Navigating Evidence Quality in Institutional Benchmarking",
    date: "2025-12-28",
    excerpt:
      "How GTIXT quantifies data quality and evidence completeness to establish confidence levels (High/Medium/Low) for each firm evaluation.",
    category: "Methodology",
    readTime: "11 min read",
    content: `
      <h2>Beyond Point Estimates</h2>
      <p>
        GTIXT's confidence scoring system acknowledges an important reality: not all evidence is created equal. 
        A firm with comprehensive documentation should score higher confidence than one with sparse public information, 
        even if their point estimate is similar.
      </p>

      <h2>The Three-Tier System</h2>
      <p>
        GTIXT uses a three-tier confidence system: High, Medium, and Low. These tiers reflect the completeness and quality 
        of available evidence for each pillar assessment.
      </p>

      <h2>High Confidence</h2>
      <p>
        High confidence assessments are based on comprehensive, independently verified evidence. This includes audited financials, 
        regulatory filings, third-party certifications, and sustained market performance data.
      </p>

      <h2>Medium Confidence</h2>
      <p>
        Medium confidence reflects partial evidence: firm-published data that is consistent but not independently verified, 
        or mixed evidence from multiple sources that are generally aligned.
      </p>

      <h2>Low Confidence</h2>
      <p>
        Low confidence indicates sparse evidence, conflicting sources, or lack of sustained track record. Firms with low confidence 
        assessments may improve by providing more transparent documentation.
      </p>

      <h2>Using Confidence Scores</h2>
      <p>
        Institutional users should weight confidence levels as part of their decision-making. A medium-confidence score from GTIXT 
        still represents substantial analysis, but acknowledges the evidentiary limitations.
      </p>
    `,
  },
  "6": {
    id: "6",
    title: "Governance & Independence: Institutional Standards for GTIXT",
    date: "2025-12-14",
    excerpt:
      "GTIXT operates under strict governance principles. This article outlines our Board, Methodology Committee, and quality assurance standards.",
    category: "Governance",
    readTime: "9 min read",
    content: `
      <h2>Governance as Foundation</h2>
      <p>
        For GTIXT to serve as an institutional benchmark, our own governance must be above reproach. We operate under strict 
        independence principles and transparent decision-making.
      </p>

      <h2>The Board Structure</h2>
      <p>
        GTIXT's Board consists of independent industry veterans, academic researchers, and institutional representatives. 
        No single commercial interest has controlling influence over benchmark methodology.
      </p>

      <h2>The Methodology Committee</h2>
      <p>
        Our Methodology Committee is responsible for establishing and updating the GTIXT Framework. This committee operates 
        publicly, with proposal timelines and public comment periods.
      </p>

      <h2>Quality Assurance</h2>
      <p>
        Every firm assessment undergoes independent verification and cross-checking. We maintain redundancy in review processes 
        to catch inconsistencies and errors.
      </p>

      <h2>Conflict of Interest Management</h2>
      <p>
        GTIXT maintains strict conflict of interest policies. Board members, staff, and contractors cannot have material 
        financial interests in assessed firms.
      </p>

      <h2>Public Accountability</h2>
      <p>
        All governance documents, methodology decisions, and assessment methodologies are public. Firms and institutional users 
        can hold GTIXT accountable by reviewing our decisions directly.
      </p>
    `,
  },
};

const categoryColors: Record<string, string> = {
  "Announcement": "#2F81F7",
  "Methodology": "#3FB950",
  "Integrity": "#F0A500",
  "Research": "#D64545",
  "Governance": "#2F81F7",
};

export default function BlogArticle() {
  const { t } = useTranslation("common");
  const isMounted = useIsMounted();
  const router = useRouter();
  const { slug } = router.query;

  const post = slug ? blogPosts[slug as string] : null;

  if (!post) {
    return (
      <>
        <Head>
          <title>Article Not Found — GTIXT</title>
        </Head>
        <InstitutionalHeader breadcrumbs={[]} />
        <main style={styles.container}>
          <section style={styles.notFound}>
            <h1 style={styles.h1}>Article Not Found</h1>
            <p style={styles.lead}>
              This article doesn't exist or has been removed.
            </p>
            <Link href="/blog" style={styles.backLink}>
              ← Back to Blog
            </Link>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{post.title} — GTIXT Blog</title>
        <meta name="description" content={post.excerpt} />
      </Head>

      <InstitutionalHeader
        breadcrumbs={isMounted ? [
          { label: "Blog", href: "/blog" },
          { label: post.title, href: `/blog/${post.id}` },
        ] : []}
      />

      <main style={styles.container}>
        {/* Article Header */}
        <article style={styles.article}>
          <header style={styles.header}>
            <div style={styles.meta}>
              <span
                style={{
                  ...styles.categoryBadge,
                  backgroundColor: `${categoryColors[post.category]}15`,
                  color: categoryColors[post.category],
                }}
              >
                {post.category}
              </span>
              <span style={styles.date}>
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span style={styles.readTime}>{post.readTime}</span>
            </div>

            <h1 style={styles.h1}>{post.title}</h1>

            <p style={styles.lead}>{post.excerpt}</p>
          </header>

          {/* Article Content */}
          <div style={styles.content}>
            <div
              dangerouslySetInnerHTML={{
                __html: post.content
                  .replace(/<h2>/g, `<h2 style="font-size: 24px; font-weight: 700; color: #C9D1D9; margin-top: 40px; margin-bottom: 16px; line-height: 1.3;">`)
                  .replace(/<p>/g, `<p style="font-size: 16px; color: #8B949E; line-height: 1.8; margin-bottom: 16px;">`)
                  .replace(/<ul>/g, `<ul style="margin-left: 20px; margin-bottom: 16px;">`)
                  .replace(/<li>/g, `<li style="font-size: 16px; color: #8B949E; line-height: 1.8; margin-bottom: 8px;">`)
                  .replace(/<\/h2>/g, '</h2>')
                  .replace(/<\/p>/g, '</p>')
                  .replace(/<\/ul>/g, '</ul>')
                  .replace(/<\/li>/g, '</li>'),
              }}
            />
          </div>

          {/* Back Link */}
          <footer style={styles.footer}>
            <Link href="/blog" style={styles.backLink}>
              ← Back to Blog
            </Link>
          </footer>
        </article>

        {/* Newsletter */}
        <section style={styles.newsletterSection}>
          <h2 style={styles.newsletterTitle}>Stay Updated</h2>
          <p style={styles.newsletterLead}>
            Get the latest GTIXT research and insights delivered to your inbox.
          </p>

          <form style={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="your@institution.com"
              style={styles.input}
              required
            />
            <button type="submit" style={styles.subscribeBtn}>
              Subscribe
            </button>
          </form>
        </section>
      </main>

      <Footer />
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0B0E11",
    color: "#C9D1D9",
    fontFamily: "system-ui, -apple-system, sans-serif",
    padding: "60px 20px",
  },
  article: {
    maxWidth: "900px",
    margin: "0 auto 80px",
  },
  header: {
    marginBottom: "60px",
    paddingBottom: "40px",
    borderBottom: "1px solid #2F81F7",
  },
  meta: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  categoryBadge: {
    fontSize: "11px",
    fontWeight: "700",
    padding: "6px 12px",
    borderRadius: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  date: {
    fontSize: "14px",
    color: "#8B949E",
  },
  readTime: {
    fontSize: "14px",
    color: "#8B949E",
  },
  h1: {
    fontSize: "40px",
    fontWeight: "700",
    color: "#C9D1D9",
    lineHeight: "1.2",
    marginBottom: "20px",
  },
  lead: {
    fontSize: "18px",
    color: "#8B949E",
    lineHeight: "1.6",
  },
  content: {
    marginBottom: "60px",
    fontSize: "16px",
    color: "#8B949E",
    lineHeight: "1.8",
  },
  footer: {
    paddingTop: "40px",
    borderTop: "1px solid #2F81F7",
  },
  backLink: {
    display: "inline-block",
    color: "#2F81F7",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s ease",
  },
  notFound: {
    maxWidth: "900px",
    margin: "0 auto",
    textAlign: "center",
    padding: "80px 20px",
  },
  newsletterSection: {
    maxWidth: "1100px",
    margin: "0 auto",
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "16px",
    padding: "60px 20px",
    textAlign: "center",
  },
  newsletterTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  newsletterLead: {
    fontSize: "15px",
    color: "#8B949E",
    lineHeight: "1.7",
    marginBottom: "32px",
  },
  newsletterForm: {
    display: "flex",
    gap: "12px",
    maxWidth: "500px",
    margin: "0 auto",
    flexWrap: "wrap",
  },
  input: {
    flex: 1,
    minWidth: "200px",
    padding: "12px 16px",
    backgroundColor: "#0B0E11",
    border: "1px solid #2F81F7",
    borderRadius: "8px",
    color: "#C9D1D9",
    fontSize: "14px",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  subscribeBtn: {
    padding: "12px 32px",
    backgroundColor: "#2F81F7",
    color: "#0B0E11",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};
