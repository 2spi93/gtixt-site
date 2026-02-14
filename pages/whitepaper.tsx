import Head from "next/head";
import Link from "next/link";
import InstitutionalHeader from "../components/InstitutionalHeader";
import Footer from "../components/Footer";
import { useTranslation } from "../lib/useTranslationStub";
import { useIsMounted } from "../lib/useIsMounted";

export default function WhitepaperPage() {
  const isMounted = useIsMounted();
  const { t } = useTranslation("common");

  return (
    <>
      <Head>
        <title>{t("whitepaper.meta.title")}</title>
        <meta
          name="description" content={t("whitepaper.meta.description")}
        />
      </Head>

      <InstitutionalHeader
        breadcrumbs={isMounted ? [{ label: "Whitepaper", href: "/whitepaper" }] : []}
      />

      <main style={styles.container}>
        {/* Title Page */}
        <section style={styles.titlePage}>
          <div style={styles.titleContent}>
            <div style={styles.titleEyebrow}>{t("whitepaper.titleEyebrow")}</div>
            <h1 style={styles.titleH1}>{t("whitepaper.titleH1")}</h1>
            <div style={styles.titleSubtitle}>{t("whitepaper.titleSubtitle")}</div>
            <p style={styles.titleLead}>{t("whitepaper.titleLead")}</p>
            <div style={styles.titleMeta}>
              <div style={styles.metaRow}>
                <span style={styles.metaLabel}>{t("whitepaper.metaVersion")}</span>
                <span style={styles.metaValue}>{t("whitepaper.metaVersionValue")}</span>
              </div>
              <div style={styles.metaRow}>
                <span style={styles.metaLabel}>{t("whitepaper.metaSHA")}</span>
                <span style={{...styles.metaValue, fontFamily: "monospace", fontSize: "12px"}}>
                  a3f2e1c9...7d4b5a8f
                </span>
              </div>
              <div style={styles.metaRow}>
                <span style={styles.metaLabel}>{t("whitepaper.metaContact")}</span>
                <span style={styles.metaValue}>{t("whitepaper.metaContactValue")}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Table of Contents */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("whitepaper.toc")}</h2>
          <ol style={styles.toc}>
            <li style={styles.tocItem}>
              <Link href="#section-1" style={styles.tocLink}>{t("whitepaper.tocSection1")}</Link>
            </li>
            <li style={styles.tocItem}>
              <Link href="#section-2" style={styles.tocLink}>{t("whitepaper.tocSection2")}</Link>
            </li>
            <li style={styles.tocItem}>
              <Link href="#section-3" style={styles.tocLink}>{t("whitepaper.tocSection3")}</Link>
            </li>
            <li style={styles.tocItem}>
              <Link href="#section-4" style={styles.tocLink}>{t("whitepaper.tocSection4")}</Link>
            </li>
            <li style={styles.tocItem}>
              <Link href="#section-5" style={styles.tocLink}>{t("whitepaper.tocSection5")}</Link>
            </li>
            <li style={styles.tocItem}>
              <Link href="#section-6" style={styles.tocLink}>{t("whitepaper.tocSection6")}</Link>
            </li>
            <li style={styles.tocItem}>
              <Link href="#section-7" style={styles.tocLink}>{t("whitepaper.tocSection7")}</Link>
            </li>
            <li style={styles.tocItem}>
              <Link href="#section-8" style={styles.tocLink}>{t("whitepaper.tocSection8")}</Link>
            </li>
            <li style={styles.tocItem}>
              <Link href="#section-9" style={styles.tocLink}>{t("whitepaper.tocSection9")}</Link>
            </li>
            <li style={styles.tocItem}>
              <Link href="#section-10" style={styles.tocLink}>{t("whitepaper.tocSection10")}</Link>
            </li>
          </ol>
        </section>

        {/* 1. Executive Summary */}
        <section id="section-1" style={styles.section}>
          <div style={styles.sectionNumber}>1</div>
          <h2 style={styles.h2}>Executive Summary</h2>
          <p style={styles.p}>
            GTIXT is an institutional benchmark for the global proprietary trading market. It converts 
            fragmented, public information into a deterministic, auditable index designed for institutions, 
            regulators, data partners, and market participants.
          </p>
          <p style={styles.p}>
            This whitepaper specifies the complete GTIXT system: the five-pillar methodology, cryptographic 
            integrity model, evidence-based extraction, versioning policy, and governance framework. 
            It serves as the definitive reference for GTIXT v1.1 and the foundation for all derivative works.
          </p>

          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <div style={styles.summaryIcon}>📊</div>
              <h5 style={styles.summaryTitle}>5-Pillar Framework</h5>
              <p style={styles.summaryText}>Transparency, Payout Reliability, Risk Model, Legal Compliance, Reputation & Support</p>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryIcon}>🔐</div>
              <h5 style={styles.summaryTitle}>Cryptographic Integrity</h5>
              <p style={styles.summaryText}>SHA-256 snapshots, immutable pointers, public verification, audit trails</p>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryIcon}>⚖️</div>
              <h5 style={styles.summaryTitle}>Institutional Governance</h5>
              <p style={styles.summaryText}>No commercial influence, deterministic scoring, versioned methodology</p>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryIcon}>🌐</div>
              <h5 style={styles.summaryTitle}>Public API</h5>
              <p style={styles.summaryText}>RESTful data access, snapshot browser, evidence queries, verification</p>
            </div>
          </div>
        </section>

        {/* 2. Market Context */}
        <section id="section-2" style={styles.section}>
          <div style={styles.sectionNumber}>2</div>
          <h2 style={styles.h2}>Market Context & Problem Statement</h2>
          
          <h4 style={styles.h4}>The Prop Trading Landscape</h4>
          <p style={styles.p}>
            Proprietary trading has grown from a boutique sector into a global, institutional marketplace. 
            Firms now operate across multiple jurisdictions, manage thousands of traders, and handle billions 
            in capital. Yet the market remains:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Non-standardized — no shared definitions of risk, transparency, or compliance</li>
            <li style={styles.listItem}>Non-benchmarked — no neutral reference point for comparison</li>
            <li style={styles.listItem}>Non-auditable — evidence is fragmented, contradictory, or proprietary</li>
            <li style={styles.listItem}>Non-institutional — treated as a niche market without formal structure</li>
          </ul>

          <h4 style={styles.h4}>Institutional Gap</h4>
          <p style={styles.p}>
            Regulatory bodies, institutional investors, and market participants lack a consistent, measurable 
            view of structural quality. Decisions are made on reputation, anecdote, or incomplete public data. 
            This creates opacity, reduces trust, and increases systemic risk.
          </p>

          <h4 style={styles.h4}>GTIXT as Solution</h4>
          <p style={styles.p}>
            GTIXT provides the missing institutional layer: a neutral, auditable, publicly available index 
            that measures structural quality, not performance or returns. It serves as the reference standard 
            for the prop trading industry.
          </p>
        </section>

        {/* 3. Objectives & Scope */}
        <section id="section-3" style={styles.section}>
          <div style={styles.sectionNumber}>3</div>
          <h2 style={styles.h2}>GTIXT Objectives & Scope</h2>

          <h4 style={styles.h4}>Core Objectives</h4>
          <div style={styles.objectivesGrid}>
            <div style={styles.objectiveCard}>
              <h5 style={styles.objectiveTitle}>🎯 Standardization</h5>
              <p style={styles.objectiveText}>Establish a common measurement framework for structural quality across the industry.</p>
            </div>
            <div style={styles.objectiveCard}>
              <h5 style={styles.objectiveTitle}>⚖️ Neutrality</h5>
              <p style={styles.objectiveText}>Measure facts, not opinions. No commercial influence, no paid positioning.</p>
            </div>
            <div style={styles.objectiveCard}>
              <h5 style={styles.objectiveTitle}>📋 Auditability</h5>
              <p style={styles.objectiveText}>Every input, score, and decision is traceable and reproducible.</p>
            </div>
            <div style={styles.objectiveCard}>
              <h5 style={styles.objectiveTitle}>🔐 Integrity</h5>
              <p style={styles.objectiveText}>Data is cryptographically verified and published as immutable snapshots.</p>
            </div>
            <div style={styles.objectiveCard}>
              <h5 style={styles.objectiveTitle}>👁️ Transparency</h5>
              <p style={styles.objectiveText}>All rules, inputs, and evidence are public and machine-readable.</p>
            </div>
            <div style={styles.objectiveCard}>
              <h5 style={styles.objectiveTitle}>📊 Institutional Grade</h5>
              <p style={styles.objectiveText}>Built to institutional standards: versioned, governed, and auditable.</p>
            </div>
          </div>

          <h4 style={styles.h4}>Scope & Inclusion Criteria</h4>
          <p style={styles.p}>
            GTIXT measures proprietary trading firms that offer funded trading programs or challenge-style 
            evaluations. Inclusion requires:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Sufficient public documentation to compute a score</li>
            <li style={styles.listItem}>Verifiable website, regulatory filings, or regulatory presence</li>
            <li style={styles.listItem}>Active operations within the past 12 months</li>
            <li style={styles.listItem}>Ability to maintain auditability and reproducibility</li>
          </ul>

          <h4 style={styles.h4}>Out of Scope</h4>
          <p style={styles.p}>
            GTIXT <strong>does not</strong> measure:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Trader performance or returns</li>
            <li style={styles.listItem}>Profitability or financial stability</li>
            <li style={styles.listItem}>Market impact or systemic risk</li>
            <li style={styles.listItem}>Subjective quality or culture</li>
            <li style={styles.listItem}>Future success or investment potential</li>
          </ul>
        </section>

        {/* 4. Architecture & Data Pipeline */}
        <section id="section-4" style={styles.section}>
          <div style={styles.sectionNumber}>4</div>
          <h2 style={styles.h2}>Architecture & Data Pipeline</h2>

          <h4 style={styles.h4}>System Architecture</h4>
          <p style={styles.p}>
            GTIXT operates as a multi-stage deterministic pipeline:
          </p>

          <div style={styles.architectureFlow}>
            <div style={styles.flowStage}>
              <div style={styles.flowBadge}>Agent A</div>
              <div style={styles.flowLabel}>Crawl</div>
              <p style={styles.flowDesc}>Ingest public data from firm websites, regulatory databases, and public disclosures</p>
            </div>
            <div style={styles.flowArrow}>→</div>
            <div style={styles.flowStage}>
              <div style={styles.flowBadge}>Agent B</div>
              <div style={styles.flowLabel}>Validate</div>
              <p style={styles.flowDesc}>Extract, normalize, and store evidence with timestamps and source URIs</p>
            </div>
            <div style={styles.flowArrow}>→</div>
            <div style={styles.flowStage}>
              <div style={styles.flowBadge}>Scoring</div>
              <div style={styles.flowLabel}>Score</div>
              <p style={styles.flowDesc}>Apply deterministic rules to compute 5-pillar scores and final index</p>
            </div>
            <div style={styles.flowArrow}>→</div>
            <div style={styles.flowStage}>
              <div style={styles.flowBadge}>Agent C</div>
              <div style={styles.flowLabel}>Gate</div>
              <p style={styles.flowDesc}>Enforce data quality, NA policy, and consistency thresholds</p>
            </div>
            <div style={styles.flowArrow}>→</div>
            <div style={styles.flowStage}>
              <div style={styles.flowBadge}>Publish</div>
              <div style={styles.flowLabel}>Release</div>
              <p style={styles.flowDesc}>Create immutable JSON snapshot, compute SHA-256, sign pointer</p>
            </div>
          </div>

          <h4 style={styles.h4}>Evidence Model</h4>
          <p style={styles.p}>
            Every data point includes:
          </p>
          <div style={styles.evidenceTable}>
            <div style={styles.tableRow}>
              <div style={{...styles.tableCell, fontWeight: "700"}}>pillar</div>
              <div style={styles.tableCell}>Reference pillar (e.g., transparency, risk_model)</div>
            </div>
            <div style={styles.tableRow}>
              <div style={{...styles.tableCell, fontWeight: "700"}}>metric</div>
              <div style={styles.tableCell}>Specific metric within pillar (e.g., disclosure_completeness)</div>
            </div>
            <div style={styles.tableRow}>
              <div style={{...styles.tableCell, fontWeight: "700"}}>value</div>
              <div style={styles.tableCell}>Extracted value (e.g., "documented", "yes", "0.85")</div>
            </div>
            <div style={styles.tableRow}>
              <div style={{...styles.tableCell, fontWeight: "700"}}>source_uri</div>
              <div style={styles.tableCell}>URL or reference to source document</div>
            </div>
            <div style={styles.tableRow}>
              <div style={{...styles.tableCell, fontWeight: "700"}}>captured_at</div>
              <div style={styles.tableCell}>ISO 8601 timestamp of extraction</div>
            </div>
          </div>
        </section>

        {/* 5. Methodology */}
        <section id="section-5" style={styles.section}>
          <div style={styles.sectionNumber}>5</div>
          <h2 style={styles.h2}>Methodology: 5-Pillar Framework</h2>

          <p style={styles.p}>
            GTIXT v1.1 scores firms on five pillars, each weighted and normalized. The final index ranges 0–100.
          </p>

          <h4 style={styles.h4}>Scoring Formula</h4>
          <div style={styles.formulaBox}>
            <code style={styles.code}>
              GTIXT Score = (T × 0.25) + (P × 0.25) + (R × 0.20) + (L × 0.20) + (S × 0.10)
            </code>
            <p style={styles.formulaNote}>
              Where T = Transparency, P = Payout Reliability, R = Risk Model, L = Legal Compliance, S = Reputation & Support
            </p>
          </div>

          <div style={styles.pillarsGrid}>
            <div style={styles.pillarCard}>
              <h4 style={styles.pillarTitle}>Pillar 1: Transparency (25%)</h4>
              <p style={styles.pillarDesc}>
                Public disclosure of rules, pricing, and operational structure. Metrics include rule availability, 
                fee documentation, withdrawal policy clarity, and compliance certifications.
              </p>
              <div style={styles.pillarMetrics}>
                <span style={styles.metric}>Rules Published</span>
                <span style={styles.metric}>Fees Documented</span>
                <span style={styles.metric}>Governance Disclosed</span>
                <span style={styles.metric}>Compliance Certified</span>
              </div>
            </div>

            <div style={styles.pillarCard}>
              <h4 style={styles.pillarTitle}>Pillar 2: Payout Reliability (25%)</h4>
              <p style={styles.pillarDesc}>
                Track record and reliability of profit payouts. Metrics include historical payout rate, 
                withdrawal success rate, payment speed, and evidence of consistency.
              </p>
              <div style={styles.pillarMetrics}>
                <span style={styles.metric}>Payout Rate</span>
                <span style={styles.metric}>Withdrawal Success</span>
                <span style={styles.metric}>Payment Speed</span>
                <span style={styles.metric}>Consistency Track</span>
              </div>
            </div>

            <div style={styles.pillarCard}>
              <h4 style={styles.pillarTitle}>Pillar 3: Risk Model (20%)</h4>
              <p style={styles.pillarDesc}>
                Quality and transparency of risk controls. Metrics include documented risk limits, 
                VaR disclosures, position sizing rules, and equity protection mechanisms.
              </p>
              <div style={styles.pillarMetrics}>
                <span style={styles.metric}>Risk Limits</span>
                <span style={styles.metric}>VaR Model</span>
                <span style={styles.metric}>Position Rules</span>
                <span style={styles.metric}>Equity Guard</span>
              </div>
            </div>

            <div style={styles.pillarCard}>
              <h4 style={styles.pillarTitle}>Pillar 4: Legal Compliance (20%)</h4>
              <p style={styles.pillarDesc}>
                Regulatory registration, compliance history, and legal standing. Metrics include regulatory 
                licensing, sanctions history, dispute records, and jurisdiction tier.
              </p>
              <div style={styles.pillarMetrics}>
                <span style={styles.metric}>Registration</span>
                <span style={styles.metric}>Sanctions Check</span>
                <span style={styles.metric}>Dispute Record</span>
                <span style={styles.metric}>Jurisdiction Tier</span>
              </div>
            </div>

            <div style={styles.pillarCard}>
              <h4 style={styles.pillarTitle}>Pillar 5: Reputation & Support (10%)</h4>
              <p style={styles.pillarDesc}>
                Community reputation, customer support quality, and institutional backing. Metrics include 
                support availability, review aggregates, institutional partnerships, and media presence.
              </p>
              <div style={styles.pillarMetrics}>
                <span style={styles.metric}>Support Quality</span>
                <span style={styles.metric}>Reviews & Ratings</span>
                <span style={styles.metric}>Partnerships</span>
                <span style={styles.metric}>Media Presence</span>
              </div>
            </div>
          </div>

          <h4 style={styles.h4}>NA Policy & Determinism</h4>
          <p style={styles.p}>
            Missing data (NA) is handled deterministically: metrics without sufficient evidence default to 
            a neutral baseline rather than a penalty. This prevents data gaps from unfairly penalizing firms 
            with incomplete public records.
          </p>
          <p style={styles.p}>
            <strong>Deterministic Scoring:</strong> Given identical inputs, the algorithm always produces 
            identical outputs. No manual adjustments, overrides, or subjective interpretations are permitted.
          </p>

          <h4 style={styles.h4}>Versioning & Backward Compatibility</h4>
          <p style={styles.p}>
            Methodology changes follow semantic versioning:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}><strong>Major versions (v1 → v2):</strong> Breaking changes to pillar definitions or weights</li>
            <li style={styles.listItem}><strong>Minor versions (v1.0 → v1.1):</strong> New metrics or enhanced data sources (backward compatible)</li>
            <li style={styles.listItem}><strong>Reproducibility:</strong> All past snapshots include version metadata, allowing historical score recomputation</li>
          </ul>
        </section>

        {/* 6. Integrity Model */}
        <section id="section-6" style={styles.section}>
          <div style={styles.sectionNumber}>6</div>
          <h2 style={styles.h2}>Integrity Model & Verification</h2>

          <h4 style={styles.h4}>Snapshot Lifecycle</h4>
          <p style={styles.p}>
            Each GTIXT release is an immutable JSON snapshot with cryptographic proof:
          </p>

          <div style={styles.integrityFlow}>
            <div style={styles.integrityStep}>
              <div style={styles.stepNumber}>1</div>
              <h5 style={styles.stepTitle}>Snapshot Created</h5>
              <p style={styles.stepDesc}>All ranked firms + metadata serialized to JSON</p>
            </div>
            <div style={styles.integrityStep}>
              <div style={styles.stepNumber}>2</div>
              <h5 style={styles.stepTitle}>Hash Computed</h5>
              <p style={styles.stepDesc}>SHA-256 hash of entire snapshot</p>
            </div>
            <div style={styles.integrityStep}>
              <div style={styles.stepNumber}>3</div>
              <h5 style={styles.stepTitle}>Pointer Created</h5>
              <p style={styles.stepDesc}>Metadata object with version, timestamp, hash, object path</p>
            </div>
            <div style={styles.integrityStep}>
              <div style={styles.stepNumber}>4</div>
              <h5 style={styles.stepTitle}>Published</h5>
              <p style={styles.stepDesc}>Snapshot + pointer released to public storage</p>
            </div>
            <div style={styles.integrityStep}>
              <div style={styles.stepNumber}>5</div>
              <h5 style={styles.stepTitle}>Verified</h5>
              <p style={styles.stepDesc}>Any party can download, hash, and verify integrity</p>
            </div>
          </div>

          <h4 style={styles.h4}>Pointer Format</h4>
          <div style={styles.codeBlock}>
            <code style={styles.codeText}>
{`{
  "object": "s3://gtixt-data/snapshots/2026-02-01/snapshot.json",
  "sha256": "a3f2e1c9d7b4e6f1a2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "created_at": "2026-02-01T00:00:00Z",
  "version": "1.1",
  "count": 847,
  "schema": "snapshot_v1"
}`}
            </code>
          </div>

          <h4 style={styles.h4}>Public Verification</h4>
          <p style={styles.p}>
            Any user can verify snapshot integrity with standard tools:
          </p>
          <div style={styles.codeBlock}>
            <code style={styles.codeText}>
{`# Download latest pointer
curl https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json -o latest.json

# Download latest snapshot
OBJECT=$(cat latest.json | jq -r '.object')
curl https://data.gtixt.com/gpti-snapshots/$OBJECT -o snapshot.json

# Verify hash
sha256sum snapshot.json
# Output: a3f2e1c9... snapshot.json

# Compare with published pointer
cat latest.json | jq -r '.sha256'
# Output: "a3f2e1c9..."`}
            </code>
          </div>

          <h4 style={styles.h4}>Audit Trail</h4>
          <p style={styles.p}>
            Every firm record includes:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>Historical scores across all versions</li>
            <li style={styles.listItem}>Evidence trail with timestamps and sources</li>
            <li style={styles.listItem}>Update changelog (when data changed and why)</li>
            <li style={styles.listItem}>Confidence metadata and NA indicators</li>
          </ul>
        </section>

        {/* 7. Governance Framework */}
        <section id="section-7" style={styles.section}>
          <div style={styles.sectionNumber}>7</div>
          <h2 style={styles.h2}>Governance Framework</h2>

          <h4 style={styles.h4}>Neutrality Charter</h4>
          <p style={styles.p}>
            GTIXT operates under an explicit neutrality commitment:
          </p>
          <div style={styles.governanceGrid}>
            <div style={styles.govCard}>
              <h5 style={styles.govTitle}>⚖️ No Commercial Influence</h5>
              <p style={styles.govText}>GTIXT does not accept payments, sponsorships, or incentives from evaluated firms or related parties.</p>
            </div>
            <div style={styles.govCard}>
              <h5 style={styles.govTitle}>⚙️ No Discretionary Overrides</h5>
              <p style={styles.govText}>Scores are deterministic. Identical inputs always produce identical outputs. No manual adjustments permitted.</p>
            </div>
            <div style={styles.govCard}>
              <h5 style={styles.govTitle}>📋 Deterministic Methodology</h5>
              <p style={styles.govText}>All rules are explicit, versioned, and publicly documented. Changes require formal versioning and notice.</p>
            </div>
            <div style={styles.govCard}>
              <h5 style={styles.govTitle}>👁️ Full Transparency</h5>
              <p style={styles.govText}>Scoring rules, data sources, and evidence are public and machine-readable. No proprietary black boxes.</p>
            </div>
          </div>

          <h4 style={styles.h4}>Governance Structure</h4>
          <p style={styles.p}>
            Governance is enforced through structural separation:
          </p>
          <div style={styles.govStructure}>
            <div style={styles.govLayer}>
              <div style={styles.govLayerNum}>1</div>
              <div style={styles.govLayerContent}>
                <h5 style={styles.govLayerTitle}>Data Layer (Agent A, B)</h5>
                <p style={styles.govLayerDesc}>Crawl and normalize public evidence. No scoring authority.</p>
              </div>
            </div>
            <div style={styles.govLayer}>
              <div style={styles.govLayerNum}>2</div>
              <div style={styles.govLayerContent}>
                <h5 style={styles.govLayerTitle}>Scoring Layer</h5>
                <p style={styles.govLayerDesc}>Apply deterministic methodology. No override capability.</p>
              </div>
            </div>
            <div style={styles.govLayer}>
              <div style={styles.govLayerNum}>3</div>
              <div style={styles.govLayerContent}>
                <h5 style={styles.govLayerTitle}>Integrity Layer (Agent C)</h5>
                <p style={styles.govLayerDesc}>Enforce data quality gates. Approve/reject for publication.</p>
              </div>
            </div>
            <div style={styles.govLayer}>
              <div style={styles.govLayerNum}>4</div>
              <div style={styles.govLayerContent}>
                <h5 style={styles.govLayerTitle}>Publication Layer</h5>
                <p style={styles.govLayerDesc}>Release immutable snapshots. No modification after publication.</p>
              </div>
            </div>
          </div>

          <h4 style={styles.h4}>Methodology Evolution</h4>
          <p style={styles.p}>
            <strong>Major versions (v1 → v2):</strong> Require 90-day notice, community consultation, and new methodology period.
          </p>
          <p style={styles.p}>
            <strong>Minor versions (v1.0 → v1.1):</strong> New metrics or data sources, backward compatible, applied prospectively.
          </p>
          <p style={styles.p}>
            All changes are documented in a public changelog and preserved for historical reconstruction.
          </p>
        </section>

        {/* 8. API & Data Access */}
        <section id="section-8" style={styles.section}>
          <div style={styles.sectionNumber}>8</div>
          <h2 style={styles.h2}>API & Data Access</h2>

          <h4 style={styles.h4}>REST API Overview</h4>
          <p style={styles.p}>
            The GTIXT API is public, unauthenticated, and rate-limited. Base URL: <code style={styles.inlineCode}>https://gtixt.com/api</code>
          </p>

          <div style={styles.apiTable}>
            <div style={styles.apiRow}>
              <div style={styles.apiMethod}>GET</div>
              <div style={styles.apiPath}>/snapshots?limit=1</div>
              <div style={styles.apiDesc}>Latest ranking snapshot (all firms)</div>
            </div>
            <div style={styles.apiRow}>
              <div style={styles.apiMethod}>GET</div>
              <div style={styles.apiPath}>/firms</div>
              <div style={styles.apiDesc}>List firms with pagination and filters</div>
            </div>
            <div style={styles.apiRow}>
              <div style={styles.apiMethod}>GET</div>
              <div style={styles.apiPath}>/firm?id=:id</div>
              <div style={styles.apiDesc}>Firm details + evidence trail + historical scores</div>
            </div>
            <div style={styles.apiRow}>
              <div style={styles.apiMethod}>GET</div>
              <div style={styles.apiPath}>/latest-pointer</div>
              <div style={styles.apiDesc}>Snapshot pointer (metadata + SHA-256)</div>
            </div>
          </div>

          <h4 style={styles.h4}>Data Models</h4>
          <p style={styles.p}>
            All responses are JSON. Key schemas:
          </p>

          <div style={styles.schemaCard}>
            <h5 style={styles.schemaTitle}>Firm Object</h5>
            <div style={styles.codeBlock}>
              <code style={styles.codeText}>
{`{
  "id": "firm-001",
  "name": "ExampleProp Inc.",
  "score": 82,
  "confidence": 0.87,
  "pillars": {
    "transparency": 85,
    "payout_reliability": 78,
    "risk_model": 81,
    "legal_compliance": 88,
    "reputation_support": 75
  },
  "version": "1.1",
  "updated_at": "2026-02-01T00:00:00Z",
  "evidence": [...]
}`}
              </code>
            </div>
          </div>

          <h4 style={styles.h4}>Public Data Objects</h4>
          <p style={styles.p}>
            All snapshots are stored in public cloud storage with no authentication required:
          </p>
          <ul style={styles.list}>
            <li style={styles.listItem}>S3 bucket: <code style={styles.inlineCode}>s3://gtixt-data/snapshots/</code></li>
            <li style={styles.listItem}>HTTPS accessible: <code style={styles.inlineCode}>https://data.gtixt.com/snapshots/</code></li>
            <li style={styles.listItem}>Format: JSON + gzip</li>
            <li style={styles.listItem}>Retention: Permanent (all historical snapshots available)</li>
          </ul>
        </section>

        {/* 9. Roadmap */}
        <section id="section-9" style={styles.section}>
          <div style={styles.sectionNumber}>9</div>
          <h2 style={styles.h2}>Roadmap v1–v3</h2>

          <p style={styles.p}>
            The GTIXT roadmap reflects controlled methodological evolution, not feature marketing.
          </p>

          <div style={styles.versionTimeline}>
            <div style={styles.versionItem}>
              <div style={styles.versionBadge}>✅ v1.0</div>
              <div style={styles.versionContent}>
                <h5 style={styles.versionTitle}>Foundation & Credibility (Q4 2025 - Q1 2026)</h5>
                <ul style={styles.versionList}>
                  <li>5-pillar framework with explicit weights</li>
                  <li>Deterministic scoring engine</li>
                  <li>NA-neutral policy and fallback hierarchy</li>
                  <li>Public evidence trails and timestamps</li>
                  <li>SHA-256 snapshot integrity</li>
                  <li>Public REST API</li>
                </ul>
              </div>
            </div>

            <div style={styles.versionItem}>
              <div style={styles.versionBadge}>🟦 v1.1</div>
              <div style={styles.versionContent}>
                <h5 style={styles.versionTitle}>Refinement & Intelligence (Q1-Q2 2026)</h5>
                <ul style={styles.versionList}>
                  <li>Agent C integrity gate with quality thresholds</li>
                  <li>Enhanced NA policy and edge case handling</li>
                  <li>Improved evidence extraction from legal docs</li>
                  <li>Risk model scoring enhancements</li>
                  <li>Expanded jurisdiction coverage</li>
                  <li>Backward compatible with v1.0 data</li>
                </ul>
              </div>
            </div>

            <div style={styles.versionItem}>
              <div style={styles.versionBadge}>🔄 v2.0</div>
              <div style={styles.versionContent}>
                <h5 style={styles.versionTitle}>Risk Intelligence Layer (Q2-Q3 2026)</h5>
                <ul style={styles.versionList}>
                  <li>New pillar: Institutional Readiness Index</li>
                  <li>Risk projection models (stress testing)</li>
                  <li>Market intelligence agents (compliance monitoring)</li>
                  <li>Legal compliance signals (regulatory tracking)</li>
                  <li>Advanced NLP for rule extraction</li>
                  <li>Breaking changes to pillar structure</li>
                </ul>
              </div>
            </div>

            <div style={styles.versionItem}>
              <div style={styles.versionBadge}>🎯 v3.0</div>
              <div style={styles.versionContent}>
                <h5 style={styles.versionTitle}>Projection & Standardization (2027)</h5>
                <ul style={styles.versionList}>
                  <li>Stress scenario simulations</li>
                  <li>Forward-looking risk signals</li>
                  <li>Governance intelligence and benchmark committees</li>
                  <li>Institutional data contracts</li>
                  <li>Integration with regulatory reporting standards</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 10. Appendices */}
        <section id="section-10" style={styles.section}>
          <div style={styles.sectionNumber}>10</div>
          <h2 style={styles.h2}>Appendices</h2>

          <h4 style={styles.h4}>Appendix A: Glossary</h4>
          <div style={styles.glossary}>
            <div style={styles.glossaryItem}>
              <div style={styles.glossaryTerm}>Snapshot</div>
              <div style={styles.glossaryDef}>Immutable JSON document containing all ranked firms and evidence for a specific date/version.</div>
            </div>
            <div style={styles.glossaryItem}>
              <div style={styles.glossaryTerm}>Pointer</div>
              <div style={styles.glossaryDef}>Metadata object containing snapshot location, SHA-256 hash, version, and timestamp.</div>
            </div>
            <div style={styles.glossaryItem}>
              <div style={styles.glossaryTerm}>Evidence</div>
              <div style={styles.glossaryDef}>Timestamped fact extracted from public source with pillar, metric, value, source URI, and capture time.</div>
            </div>
            <div style={styles.glossaryItem}>
              <div style={styles.glossaryTerm}>NA Policy</div>
              <div style={styles.glossaryDef}>Deterministic rule for handling missing data (defaults to neutral baseline, not penalty).</div>
            </div>
            <div style={styles.glossaryItem}>
              <div style={styles.glossaryTerm}>Agent A (Crawl)</div>
              <div style={styles.glossaryDef}>Automated system for ingesting public data from firm websites and regulatory databases.</div>
            </div>
            <div style={styles.glossaryItem}>
              <div style={styles.glossaryTerm}>Agent B (Validate)</div>
              <div style={styles.glossaryDef}>Automated system for extracting, normalizing, and storing evidence with timestamps.</div>
            </div>
            <div style={styles.glossaryItem}>
              <div style={styles.glossaryTerm}>Agent C (Gate)</div>
              <div style={styles.glossaryDef}>Automated integrity validator that enforces data quality and consistency before publication.</div>
            </div>
            <div style={styles.glossaryItem}>
              <div style={styles.glossaryTerm}>Determinism</div>
              <div style={styles.glossaryDef}>Property that identical inputs always produce identical outputs. No randomness or subjectivity permitted.</div>
            </div>
          </div>

          <h4 style={styles.h4}>Appendix B: JSON Specification</h4>
          <p style={styles.p}>
            Complete JSON schemas for Snapshot, Firm, Evidence, and Pointer objects are available at:
          </p>
          <p style={styles.p}>
            <code style={styles.inlineCode}>https://gtixt.com/spec/gpti_score_v1.json</code>
          </p>

          <h4 style={styles.h4}>Appendix C: Pillar Definitions & Metrics</h4>
          <p style={styles.p}>
            Detailed metric definitions for all five pillars are documented at:
          </p>
          <p style={styles.p}>
            <code style={styles.inlineCode}>https://methodology.gtixt.com/v1.1/metrics</code>
          </p>

          <h4 style={styles.h4}>Appendix D: Evidence Examples</h4>
          <p style={styles.p}>
            Sample evidence artifacts, source URIs, and captured values are available at:
          </p>
          <p style={styles.p}>
            <code style={styles.inlineCode}>https://integrity.gtixt.com/examples</code>
          </p>
        </section>

        {/* Limitations & Disclaimers */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Limitations & Disclaimers</h2>
          <p style={styles.p}>
            <strong>Not Investment Advice:</strong> GTIXT is not a financial advisor and does not provide investment recommendations. 
            Scores do not predict returns, profitability, or firm outcomes.
          </p>
          <p style={styles.p}>
            <strong>Data Availability:</strong> Scores reflect publicly available information. Missing public data may 
            result in lower scores, not necessarily lower structural quality.
          </p>
          <p style={styles.p}>
            <strong>No Endorsement:</strong> GTIXT measures structural quality only and should not be interpreted as an endorsement 
            of any firm.
          </p>
          <p style={styles.p}>
            <strong>Temporal Snapshot:</strong> Snapshots represent a point in time. Firms, markets, and regulations change continuously.
          </p>
        </section>

        {/* Download & Versioning */}
        <section style={styles.section}>
          <h2 style={styles.h2}>Downloads & Versioning</h2>
          <p style={styles.p}>
            GTIXT whitepaper is available in multiple formats:
          </p>
          <div style={styles.downloadGrid}>
            <a href="/api/whitepaper" style={styles.downloadButton} download="GTIXT_Whitepaper_v1.1.pdf">
              📄 Whitepaper PDF v1.1
            </a>
            <Link href="/methodology" style={styles.downloadButton}>
              📊 Methodology Interactive
            </Link>
            <Link href="/integrity" style={styles.downloadButton}>
              🔐 Integrity Beacon
            </Link>
            <Link href="/api-docs" style={styles.downloadButton}>
              🔌 API Documentation
            </Link>
          </div>

          <h4 style={styles.h4}>Version History</h4>
          <ul style={styles.list}>
            <li style={styles.listItem}><strong>v1.1</strong> (February 2026) — Complete institutional whitepaper with architecture, integrity model, governance, API reference</li>
            <li style={styles.listItem}><strong>v1.0</strong> (January 2026) — Initial institutional release with 5-pillar methodology</li>
          </ul>
        </section>

        {/* CTA */}
        <section style={styles.ctaSection}>
          <h3 style={styles.ctaTitle}>Explore GTIXT</h3>
          <p style={styles.ctaText}>
            This whitepaper defines the complete GTIXT system. Explore the interactive implementations and API for details.
          </p>
          <div style={styles.ctaButtons}>
            <Link href="/methodology" style={{...styles.button, ...styles.buttonPrimary}}>
              📚 Methodology
            </Link>
            <Link href="/integrity" style={{...styles.button, ...styles.buttonSecondary}}>
              🔒 Integrity
            </Link>
            <Link href="/governance" style={{...styles.button, ...styles.buttonSecondary}}>
              ⚖️ Governance
            </Link>
            <Link href="/api-docs" style={{...styles.button, ...styles.buttonSecondary}}>
              🔌 API Docs
            </Link>
          </div>
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
    padding: "0",
  },
  titlePage: {
    backgroundColor: "#11161C",
    padding: "80px 20px",
    borderBottom: "1px solid #2F81F7",
    textAlign: "center",
  },
  titleContent: {
    maxWidth: "900px",
    margin: "0 auto",
  },
  titleEyebrow: {
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "#2F81F7",
    marginBottom: "16px",
  },
  titleH1: {
    fontSize: "48px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
    lineHeight: "1.1",
  },
  titleSubtitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#2F81F7",
    marginBottom: "20px",
  },
  titleLead: {
    fontSize: "16px",
    color: "#8B949E",
    lineHeight: "1.6",
    marginBottom: "40px",
  },
  titleMeta: {
    display: "grid",
    gap: "12px",
    maxWidth: "600px",
    margin: "0 auto",
    padding: "24px",
    backgroundColor: "#1E2630",
    borderRadius: "12px",
    border: "1px solid #2F81F7",
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#2F81F7",
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: "14px",
    color: "#C9D1D9",
  },
  section: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "60px 20px",
    borderBottom: "1px solid #2F81F7",
    position: "relative",
  },
  sectionNumber: {
    position: "absolute",
    top: "40px",
    right: "20px",
    fontSize: "72px",
    fontWeight: "700",
    color: "#2F81F7",
    opacity: 0.1,
  },
  h2: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "20px",
    lineHeight: "1.2",
  },
  h4: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "16px",
    marginTop: "24px",
  },
  p: {
    fontSize: "15px",
    color: "#8B949E",
    lineHeight: "1.7",
    marginBottom: "16px",
  },
  list: {
    listStyle: "none",
    padding: "0",
    margin: "0 0 16px 0",
  },
  listItem: {
    fontSize: "15px",
    color: "#8B949E",
    lineHeight: "1.7",
    paddingLeft: "24px",
    marginBottom: "12px",
    position: "relative",
  },
  toc: {
    listStyle: "none",
    padding: "0",
    margin: "0",
    display: "grid",
    gap: "12px",
  },
  tocItem: {
    fontSize: "15px",
    color: "#8B949E",
    paddingLeft: "24px",
    position: "relative",
  },
  tocLink: {
    color: "#2F81F7",
    textDecoration: "none",
    fontWeight: "600",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "24px",
    marginTop: "32px",
  },
  summaryCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
    textAlign: "center",
  },
  summaryIcon: {
    fontSize: "40px",
    marginBottom: "16px",
  },
  summaryTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  summaryText: {
    fontSize: "13px",
    color: "#8B949E",
    lineHeight: "1.6",
  },
  objectivesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
    marginTop: "24px",
  },
  objectiveCard: {
    backgroundColor: "#1E2630",
    border: "1px solid #2F81F7",
    borderRadius: "12px",
    padding: "24px",
  },
  objectiveTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  objectiveText: {
    fontSize: "13px",
    color: "#8B949E",
    lineHeight: "1.6",
  },
  architectureFlow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "32px",
    padding: "24px",
    backgroundColor: "#1E2630",
    borderRadius: "12px",
    border: "1px solid #2F81F7",
  },
  flowStage: {
    flex: "0 1 140px",
    textAlign: "center",
  },
  flowBadge: {
    display: "inline-block",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "700",
    backgroundColor: "#2F81F7",
    color: "#0B0E11",
    borderRadius: "6px",
    marginBottom: "8px",
  },
  flowLabel: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "8px",
  },
  flowDesc: {
    fontSize: "12px",
    color: "#8B949E",
    lineHeight: "1.4",
  },
  flowArrow: {
    fontSize: "20px",
    color: "#2F81F7",
    fontWeight: "700",
  },
  evidenceTable: {
    display: "grid",
    gap: "0",
    marginTop: "16px",
    backgroundColor: "#1E2630",
    border: "1px solid #2F81F7",
    borderRadius: "12px",
    overflow: "hidden",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    borderBottom: "1px solid #2F81F7",
  },
  tableCell: {
    padding: "16px",
    fontSize: "14px",
    color: "#8B949E",
    borderRight: "1px solid #2F81F7",
  },
  pillarsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
    marginTop: "24px",
  },
  pillarCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
  },
  pillarTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#3FB950",
    marginBottom: "12px",
  },
  pillarDesc: {
    fontSize: "13px",
    color: "#8B949E",
    lineHeight: "1.6",
    marginBottom: "16px",
  },
  pillarMetrics: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  metric: {
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: "#0B0E11",
    color: "#2F81F7",
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #2F81F7",
  },
  formulaBox: {
    backgroundColor: "#0B0E11",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
    marginTop: "16px",
  },
  code: {
    fontFamily: "monospace",
    fontSize: "14px",
    color: "#C9D1D9",
    lineHeight: "1.8",
    wordBreak: "break-all",
  },
  formulaNote: {
    fontSize: "12px",
    color: "#8B949E",
    marginTop: "12px",
    fontStyle: "italic",
  },
  integrityFlow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "16px",
    marginTop: "24px",
  },
  integrityStep: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "24px",
    textAlign: "center",
  },
  stepNumber: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#2F81F7",
    marginBottom: "12px",
  },
  stepTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "8px",
  },
  stepDesc: {
    fontSize: "12px",
    color: "#8B949E",
    lineHeight: "1.5",
  },
  codeBlock: {
    backgroundColor: "#0B0E11",
    border: "1px solid #2F81F7",
    borderRadius: "12px",
    padding: "20px",
    overflow: "auto",
    marginTop: "16px",
    marginBottom: "16px",
  },
  codeText: {
    fontFamily: "monospace",
    fontSize: "13px",
    color: "#C9D1D9",
    lineHeight: "1.8",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  inlineCode: {
    fontFamily: "monospace",
    fontSize: "13px",
    color: "#2F81F7",
    backgroundColor: "#1E2630",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  governanceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "24px",
    marginTop: "24px",
  },
  govCard: {
    backgroundColor: "#1E2630",
    border: "1px solid #2F81F7",
    borderRadius: "12px",
    padding: "24px",
  },
  govTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  govText: {
    fontSize: "13px",
    color: "#8B949E",
    lineHeight: "1.6",
  },
  govStructure: {
    display: "grid",
    gap: "16px",
    marginTop: "24px",
  },
  govLayer: {
    display: "flex",
    gap: "20px",
    alignItems: "flex-start",
    backgroundColor: "#1E2630",
    border: "1px solid #2F81F7",
    borderRadius: "12px",
    padding: "24px",
  },
  govLayerNum: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#2F81F7",
    minWidth: "40px",
  },
  govLayerContent: {
    flex: 1,
  },
  govLayerTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "8px",
  },
  govLayerDesc: {
    fontSize: "13px",
    color: "#8B949E",
    lineHeight: "1.6",
  },
  apiTable: {
    display: "grid",
    gap: "0",
    marginTop: "16px",
    backgroundColor: "#1E2630",
    border: "1px solid #2F81F7",
    borderRadius: "12px",
    overflow: "hidden",
  },
  apiRow: {
    display: "grid",
    gridTemplateColumns: "80px 200px 1fr",
    borderBottom: "1px solid #2F81F7",
    padding: "16px",
    gap: "16px",
  },
  apiMethod: {
    fontSize: "12px",
    fontWeight: "700",
    backgroundColor: "#0B0E11",
    color: "#3FB950",
    padding: "4px 8px",
    borderRadius: "4px",
    textAlign: "center",
  },
  apiPath: {
    fontFamily: "monospace",
    fontSize: "13px",
    color: "#C9D1D9",
  },
  apiDesc: {
    fontSize: "13px",
    color: "#8B949E",
  },
  schemaCard: {
    backgroundColor: "#1E2630",
    border: "1px solid #2F81F7",
    borderRadius: "12px",
    padding: "24px",
    marginTop: "16px",
  },
  schemaTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "16px",
  },
  versionTimeline: {
    display: "grid",
    gap: "24px",
    marginTop: "24px",
  },
  versionItem: {
    display: "flex",
    gap: "20px",
    alignItems: "flex-start",
  },
  versionBadge: {
    flexShrink: 0,
    padding: "10px 16px",
    fontSize: "13px",
    fontWeight: "700",
    backgroundColor: "#2F81F7",
    color: "#0B0E11",
    borderRadius: "8px",
    minWidth: "80px",
    textAlign: "center",
  },
  versionContent: {
    flex: 1,
    backgroundColor: "#1E2630",
    border: "1px solid #2F81F7",
    borderRadius: "12px",
    padding: "24px",
  },
  versionTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  versionList: {
    listStyle: "none",
    padding: "0",
    margin: "0",
    display: "grid",
    gap: "8px",
  },
  glossary: {
    display: "grid",
    gap: "12px",
    marginTop: "16px",
  },
  glossaryItem: {
    backgroundColor: "#1E2630",
    border: "1px solid #2F81F7",
    borderRadius: "8px",
    padding: "16px",
    display: "grid",
    gap: "8px",
  },
  glossaryTerm: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#2F81F7",
  },
  glossaryDef: {
    fontSize: "13px",
    color: "#8B949E",
    lineHeight: "1.6",
  },
  downloadGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginTop: "24px",
  },
  downloadButton: {
    display: "inline-block",
    padding: "16px 24px",
    fontSize: "14px",
    fontWeight: "600",
    backgroundColor: "#2F81F7",
    color: "#0B0E11",
    textDecoration: "none",
    borderRadius: "8px",
    textAlign: "center",
    transition: "all 0.2s ease",
  },
  ctaSection: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "60px 20px",
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "16px",
    textAlign: "center",
  },
  ctaTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "16px",
  },
  ctaText: {
    fontSize: "15px",
    color: "#8B949E",
    lineHeight: "1.6",
    marginBottom: "32px",
  },
  ctaButtons: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  button: {
    display: "inline-block",
    padding: "14px 28px",
    fontSize: "14px",
    fontWeight: "600",
    border: "1px solid transparent",
    borderRadius: "8px",
    textDecoration: "none",
    textAlign: "center",
    transition: "all 0.2s ease",
  },
  buttonPrimary: {
    backgroundColor: "#2F81F7",
    color: "#0B0E11",
  },
  buttonSecondary: {
    backgroundColor: "#1E2630",
    color: "#C9D1D9",
    border: "1px solid #2F81F7",
  },
};
