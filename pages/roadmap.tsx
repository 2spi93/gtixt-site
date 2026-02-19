import Head from "next/head";
import Link from "next/link";
import InstitutionalHeader from "../components/InstitutionalHeader";
import Footer from "../components/Footer";
import { useIsMounted } from "../lib/useIsMounted";
import { useTranslation } from "../lib/useTranslationStub";

export default function RoadmapPage() {
  const isMounted = useIsMounted();
  const { t } = useTranslation("common");

  return (
    <>
      <Head>
        <title>Roadmap — GTIXT</title>
        <meta
          name="description"
          content="GTIXT Roadmap — From Benchmark to Infrastructure to Standard. Completed milestones, in-progress features, and long-term vision."
        />
      </Head>

      <InstitutionalHeader
        breadcrumbs={isMounted ? [{ label: t("roadmap.breadcrumb"), href: "/roadmap" }] : []}
      />

      <main style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.eyebrow}>{t("roadmap.eyebrow")}</div>
          <h1 style={styles.h1}>{t("roadmap.title")}</h1>
          <p style={styles.lead}>
            {t("roadmap.lead")}
          </p>
        </section>

        {/* Completed Milestones */}
        <section style={styles.section}>
          <h2 style={styles.h2}>✅ {t("roadmap.completed.title")}</h2>
          <p style={styles.sectionLead}>
            {t("roadmap.completed.lead")}
          </p>

          <div style={styles.timeline}>
            <div style={styles.timelineItem}>
              <div style={{...styles.timelineBadge, ...styles.timelineBadgeComplete}}>Q4 2025</div>
              <div style={styles.timelineContent}>
                <h3 style={styles.timelineTitle}>GTIXT v0.1 — Prototype</h3>
                <p style={styles.timelineDesc}>
                  Initial prototype with 5-pillar framework, database infrastructure (PostgreSQL + MinIO), 
                  validation framework foundation, and basic orchestration. Validated methodology with pilot firms.
                </p>
                <div style={styles.milestoneGrid}>
                  <div style={styles.milestoneTag}>5-pillar framework</div>
                  <div style={styles.milestoneTag}>PostgreSQL + MinIO setup</div>
                  <div style={styles.milestoneTag}>Pilot universe (20 firms)</div>
                  <div style={styles.milestoneTag}>Validation tables</div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* In Progress */}
        <section style={styles.section}>
          <h2 style={styles.h2}>🔄 {t("roadmap.inProgress.title")}</h2>
          <p style={styles.sectionLead}>
            {t("roadmap.inProgress.lead")}
          </p>

          <div style={styles.timeline}>
            <div style={styles.timelineItem}>
              <div style={{...styles.timelineBadge, ...styles.timelineBadgeProgress}}>Q1 2026</div>
              <div style={styles.timelineContent}>
                <h3 style={styles.timelineTitle}>GTIXT v1.0 — Foundation (95% Complete)</h3>
                <p style={styles.timelineDesc}>
                  9 agents operational (Crawler with integrated extraction, 7 specialized agents + IIP), evidence-backed scoring with 18 evidence types, 
                  Phase 3 external API integrations (FCA, OFAC, SEC), REST API with 5 endpoints, cryptographic verification in progress.
                </p>
                <div style={styles.milestoneGrid}>
                  <div style={styles.milestoneTag}>✅ Crawler Agent (integrated A+B)</div>
                  <div style={styles.milestoneTag}>✅ RVI (Registry Verification)</div>
                  <div style={styles.milestoneTag}>✅ SSS (Sanctions Screening)</div>
                  <div style={styles.milestoneTag}>✅ REM (Regulatory Events)</div>
                  <div style={styles.milestoneTag}>✅ IRS (Review System)</div>
                  <div style={styles.milestoneTag}>✅ FRP (Reputation & Payout)</div>
                  <div style={styles.milestoneTag}>✅ MIS (Investigation System)</div>
                  <div style={styles.milestoneTag}>✅ IIP (IOSCO Integration)</div>
                  <div style={{...styles.milestoneTag, ...styles.milestoneTagProgress}}>🔄 Agent C (Oversight Gate)</div>
                  <div style={styles.milestoneTag}>✅ Phase 3 APIs (FCA/OFAC/SEC)</div>
                  <div style={styles.milestoneTag}>✅ REST API (5 endpoints)</div>
                  <div style={{...styles.milestoneTag, ...styles.milestoneTagProgress}}>
                    <Link href="/integrity" style={styles.milestoneLink}>🔄 Integrity Beacon</Link>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.timelineItem}>
              <div style={{...styles.timelineBadge, ...styles.timelineBadgePlanned}}>Q2 2026</div>
              <div style={styles.timelineContent}>
                <h3 style={styles.timelineTitle}>v1.0 Completion & Quality Controls</h3>
                <p style={styles.timelineDesc}>
                  Finalize Agent C (Oversight Gate) with deterministic quality thresholds. Complete cryptographic 
                  verification and integrity beacon. Enhance validation framework with automated alerting and ground truth validation.
                </p>
                <div style={styles.milestoneGrid}>
                  <div style={{...styles.milestoneTag, ...styles.milestoneTagPlanned}}>⏳ Finalize Agent C operations</div>
                  <div style={{...styles.milestoneTag, ...styles.milestoneTagPlanned}}>⏳ Complete crypto verification</div>
                  <div style={{...styles.milestoneTag, ...styles.milestoneTagPlanned}}>⏳ NA-rate quality controls</div>
                  <div style={{...styles.milestoneTag, ...styles.milestoneTagPlanned}}>⏳ Validation alerting (Slack)</div>
                  <div style={{...styles.milestoneTag, ...styles.milestoneTagPlanned}}>⏳ Universe filtering logic</div>
                  <div style={{...styles.milestoneTag, ...styles.milestoneTagPlanned}}>⏳ Ground truth validation</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Planned */}
        <section style={styles.section}>
          <h2 style={styles.h2}>⏳ {t("roadmap.planned.title")}</h2>
          <p style={styles.sectionLead}>
            {t("roadmap.planned.lead")}
          </p>

          <div style={styles.timeline}>
            <div style={styles.timelineItem}>
              <div style={{...styles.timelineBadge, ...styles.timelineBadgePlanned}}>Q3 2026</div>
              <div style={styles.timelineContent}>
                <h3 style={styles.timelineTitle}>v1.1 — Risk Intelligence & Data Access</h3>
                <p style={styles.timelineDesc}>
                  Enhance existing agents with predictive capabilities. Add Legal Clarity Index, Rule Ambiguity Heatmap. 
                  Public snapshot browser, historical query API, institutional dashboard for data exploration.
                </p>
                <div style={styles.milestoneGrid}>
                  <div style={{...styles.milestoneTag, ...styles.milestoneTagPlanned}}>⏳ Legal Clarity Index</div>
                  <div style={{...styles.milestoneTag, ...styles.milestoneTagPlanned}}>⏳ Enhanced RVI (predictive)</div>
                  <div style={{...styles.milestoneTag, ...styles.milestoneTagPlanned}}>⏳ Rule Ambiguity Heatmap</div>
                  <div style={{...styles.milestoneTag, ...styles.milestoneTagPlanned}}>⏳ Snapshot browser UI</div>
                  <div style={{...styles.milestoneTag, ...styles.milestoneTagPlanned}}>⏳ API v1.1 (historical queries)</div>
                  <div style={{...styles.milestoneTag, ...styles.milestoneTagPlanned}}>⏳ Institutional dashboard</div>
                </div>
              </div>
            </div>

            <div style={styles.timelineItem}>
              <div style={{...styles.timelineBadge, ...styles.timelineBadgePlanned}}>Q4 2026</div>
              <div style={styles.timelineContent}>
                <h3 style={styles.timelineTitle}>Governance & Oversight</h3>
                <p style={styles.timelineDesc}>
                  Governance framework with Oversight Gate v2, institutional advisory board, and 
                  whitepaper v1.1. Prepare for standardization.
                </p>
                <div style={styles.milestoneGrid}>
                  <div style={{...styles.milestoneTag, ...styles.milestoneTagPlanned}}>Governance framework</div>
                  <div style={{...styles.milestoneTag, ...styles.milestoneTagPlanned}}>Oversight Gate v2</div>
                  <div style={{...styles.milestoneTag, ...styles.milestoneTagPlanned}}>Whitepaper v1.1</div>
                  <div style={{...styles.milestoneTag, ...styles.milestoneTagPlanned}}>Advisory board</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Long-term Vision */}
        <section style={styles.section}>
          <h2 style={styles.h2}>🔮 {t("roadmap.longTermVision.title")}</h2>
          <p style={styles.sectionLead}>
            {t("roadmap.longTermVision.lead")}
          </p>

          <div style={styles.visionGrid}>
            <div style={styles.visionCard}>
              <div style={styles.visionIcon}>🏛️</div>
              <h4 style={styles.visionTitle}>Institutional Partnerships</h4>
              <p style={styles.visionText}>
                Collaborate with regulatory bodies, institutional investors, and academic research 
                centers. Establish GTIXT as a neutral third-party standard.
              </p>
            </div>

            <div style={styles.visionCard}>
              <div style={styles.visionIcon}>🌍</div>
              <h4 style={styles.visionTitle}>Multi-Jurisdiction Compliance</h4>
              <p style={styles.visionText}>
                Expand legal compliance pillar to cover EU MiFID II, UK FCA, CFTC, ASIC, and ESMA 
                frameworks. Multi-jurisdiction risk modeling.
              </p>
            </div>

            <div style={styles.visionCard}>
              <div style={styles.visionIcon}>📊</div>
              <h4 style={styles.visionTitle}>Stress Testing & Scenarios</h4>
              <p style={styles.visionText}>
                Introduce stress scenario simulations, future risk projection, and systemic risk 
                analysis. Model firm resilience under adverse conditions.
              </p>
            </div>

            <div style={styles.visionCard}>
              <div style={styles.visionIcon}>🤝</div>
              <h4 style={styles.visionTitle}>Data Contracts & Standardization</h4>
              <p style={styles.visionText}>
                Establish data contracts with firms willing to provide structured, machine-readable 
                disclosures. Reduce friction, increase accuracy.
              </p>
            </div>

            <div style={styles.visionCard}>
              <div style={styles.visionIcon}>🔬</div>
              <h4 style={styles.visionTitle}>Research & Publications</h4>
              <p style={styles.visionText}>
                Publish annual reports, academic papers, and industry whitepapers. Contribute to 
                the body of knowledge on prop trading structural risk.
              </p>
            </div>

            <div style={styles.visionCard}>
              <div style={styles.visionIcon}>⚡</div>
              <h4 style={styles.visionTitle}>Real-time Intelligence</h4>
              <p style={styles.visionText}>
                Move from snapshot-based to continuous monitoring. Real-time rule change detection, 
                regulatory event tracking, and market intelligence.
              </p>
            </div>
          </div>

          <div style={styles.visionQuote}>
            <p style={styles.quoteText}>
              "An index is born when a market becomes measurable. It becomes infrastructure when the 
              market becomes systemic."
            </p>
            <p style={styles.quoteAuthor}>— GTIXT Design Philosophy</p>
          </div>
        </section>

        {/* Versioning */}
        <section style={styles.section}>
          <h2 style={styles.h2}>📦 {t("roadmap.versioning.title")}</h2>
          <p style={styles.sectionLead}>
            {t("roadmap.versioning.lead")}
          </p>

          <div style={styles.versionTimeline}>
            <div style={styles.versionItem}>
              <div style={styles.versionBadge}>v0.1</div>
              <div style={styles.versionContent}>
                <h4 style={styles.versionTitle}>Prototype (Q4 2025)</h4>
                <p style={styles.versionDesc}>
                  Foundation infrastructure: 5-pillar framework, PostgreSQL database (10+ tables), MinIO object storage, 
                  validation framework tables (events, metrics, alerts), Prefect orchestration. Pilot testing with 20 firms.
                </p>
              </div>
            </div>

            <div style={styles.versionItem}>
              <div style={{...styles.versionBadge, backgroundColor: "#1E2630", color: "#F0A500"}}>v1.0</div>
              <div style={styles.versionContent}>
                <h4 style={styles.versionTitle}>Foundation (Q1 2026 - 95% Complete)</h4>
                <p style={styles.versionDesc}>
                  9 agents operational: Crawler (integrated collection & extraction), RVI, SSS, REM, IRS, FRP, MIS, IIP. 
                  Phase 3 external APIs (FCA, OFAC, SEC). REST API with 5 endpoints. 18 evidence types. 
                  Agent C (Oversight Gate) and cryptographic verification in final stages.
                </p>
              </div>
            </div>

            <div style={styles.versionItem}>
              <div style={{...styles.versionBadge, backgroundColor: "#1E2630", color: "#2F81F7"}}>v1.1</div>
              <div style={styles.versionContent}>
                <h4 style={styles.versionTitle}>Refinement (Q2-Q3 2026 - Planned)</h4>
                <p style={styles.versionDesc}>
                  Complete v1.0 (Agent C operations, cryptographic verification). Enhanced risk intelligence (Legal Clarity Index, predictive RVI). 
                  Snapshot browser and API v1.1 with historical queries. Institutional dashboard for data exploration. 
                  Backward compatible with v1.0.
                </p>
              </div>
            </div>

            <div style={styles.versionItem}>
              <div style={{...styles.versionBadge, backgroundColor: "#1E2630", color: "#2F81F7"}}>v2.0</div>
              <div style={styles.versionContent}>
                <h4 style={styles.versionTitle}>Risk Intelligence (Q2-Q3 2026)</h4>
                <p style={styles.versionDesc}>
                  Risk intelligence layer with Legal Clarity Index, REM, Rule Volatility Index, 
                  and Survivability Score. New pillar: Institutional Readiness.
                </p>
              </div>
            </div>

            <div style={styles.versionItem}>
              <div style={{...styles.versionBadge, backgroundColor: "#1E2630", color: "#2F81F7"}}>v3.0</div>
              <div style={styles.versionContent}>
                <h4 style={styles.versionTitle}>Projection & Standardization (2027)</h4>
                <p style={styles.versionDesc}>
                  Stress scenario simulations, future risk projection, and data contracts. 
                  Governance framework and institutional partnerships established.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Principles */}
        <section style={styles.section}>
          <h2 style={styles.h2}>🎯 {t("roadmap.principles.title")}</h2>
          <p style={styles.sectionLead}>
            {t("roadmap.principles.lead")}
          </p>

          <div style={styles.principlesGrid}>
            <div style={styles.principleCard}>
              <h4 style={styles.principleTitle}>Deterministic Evolution</h4>
              <p style={styles.principleText}>
                Every version is reproducible. New features are additive, not disruptive. Historical 
                scores remain verifiable under their original spec.
              </p>
            </div>

            <div style={styles.principleCard}>
              <h4 style={styles.principleTitle}>Institutional Rigor</h4>
              <p style={styles.principleText}>
                New capabilities must meet institutional standards for transparency, auditability, 
                and credibility before public release.
              </p>
            </div>

            <div style={styles.principleCard}>
              <h4 style={styles.principleTitle}>Neutral Infrastructure</h4>
              <p style={styles.principleText}>
                GTIXT does not promote firms, accept influence, or alter scores on request. The 
                roadmap is driven by systemic value, not commercial pressure.
              </p>
            </div>

            <div style={styles.principleCard}>
              <h4 style={styles.principleTitle}>Open Methodology</h4>
              <p style={styles.principleText}>
                All scoring specifications, weights, and logic are published openly. No black boxes, 
                no proprietary secrets.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={styles.ctaSection}>
          <h3 style={styles.ctaTitle}>{t("roadmap.cta.title")}</h3>
          <p style={styles.ctaText}>
            {t("roadmap.cta.text")}
          </p>
          <div style={styles.ctaButtons}>
            <Link href="/integrity" style={{...styles.button, ...styles.buttonPrimary}}>
              🔒 {t("roadmap.cta.verifyButton")}
            </Link>
            <Link href="/methodology" style={{...styles.button, ...styles.buttonSecondary}}>
              📚 {t("roadmap.cta.methodologyButton")}
            </Link>
            <Link href="/data" style={{...styles.button, ...styles.buttonGhost}}>
              📊 {t("roadmap.cta.dataButton")}
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
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "80px 20px",
  },
  hero: {
    marginBottom: "80px",
    textAlign: "center",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "#2F81F7",
    marginBottom: "16px",
  },
  h1: {
    fontSize: "48px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "20px",
    lineHeight: "1.1",
  },
  lead: {
    fontSize: "18px",
    color: "#8B949E",
    lineHeight: "1.7",
    maxWidth: "800px",
    margin: "0 auto",
  },
  section: {
    marginBottom: "80px",
    backgroundColor: "#11161C",
    padding: "60px 20px",
    borderRadius: "16px",
  },
  h2: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "20px",
    textAlign: "center",
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
  },
  sectionLead: {
    fontSize: "17px",
    color: "#C9D1D9",
    lineHeight: "1.6",
    textAlign: "center",
    maxWidth: "700px",
    margin: "0 auto 40px",
    fontWeight: "500",
  },
  timeline: {
    position: "relative",
    paddingLeft: "40px",
  },
  timelineItem: {
    position: "relative",
    marginBottom: "40px",
    paddingLeft: "40px",
  },
  timelineBadge: {
    position: "absolute",
    left: "-20px",
    top: "0",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "700",
    borderRadius: "8px",
    whiteSpace: "nowrap",
  },
  timelineBadgeComplete: {
    backgroundColor: "#1E2630",
    color: "#3FB950",
  },
  timelineBadgeProgress: {
    backgroundColor: "#1E2630",
    color: "#F0A500",
  },
  timelineBadgePlanned: {
    backgroundColor: "#1E2630",
    color: "#2F81F7",
  },
  timelineContent: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
    marginTop: "40px",
  },
  timelineTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  timelineDesc: {
    fontSize: "15px",
    color: "#8B949E",
    lineHeight: "1.6",
    marginBottom: "20px",
  },
  milestoneGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  milestoneTag: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#C9D1D9",
    backgroundColor: "#1E2630",
    padding: "6px 12px",
    borderRadius: "6px",
  },
  milestoneTagProgress: {
    backgroundColor: "#1E2630",
    color: "#F0A500",
  },
  milestoneTagPlanned: {
    backgroundColor: "#1E2630",
    color: "#2F81F7",
  },
  milestoneLink: {
    color: "#2F81F7",
    textDecoration: "underline",
    fontWeight: "700",
  },
  visionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
    marginBottom: "40px",
  },
  visionCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
    textAlign: "center",
  },
  visionIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  visionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  visionText: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
  },
  visionQuote: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "40px",
    textAlign: "center",
  },
  quoteText: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#C9D1D9",
    lineHeight: "1.6",
    marginBottom: "16px",
    fontStyle: "italic",
  },
  quoteAuthor: {
    fontSize: "14px",
    color: "#8B949E",
    fontWeight: "600",
  },
  versionTimeline: {
    display: "grid",
    gap: "20px",
  },
  versionItem: {
    display: "flex",
    gap: "20px",
    alignItems: "flex-start",
  },
  versionBadge: {
    flexShrink: 0,
    padding: "10px 18px",
    fontSize: "16px",
    fontWeight: "700",
    color: "#0B0E11",
    backgroundColor: "#2F81F7",
    borderRadius: "8px",
    minWidth: "70px",
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
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "8px",
  },
  versionDesc: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
  },
  principlesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "24px",
  },
  principleCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
  },
  principleTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  principleText: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
  },
  ctaSection: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "16px",
    padding: "48px",
    textAlign: "center",
  },
  ctaTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "16px",
  },
  ctaText: {
    fontSize: "16px",
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
    fontSize: "15px",
    fontWeight: "600",
    border: "1px solid transparent",
    borderRadius: "8px",
    cursor: "pointer",
    textDecoration: "none",
    textAlign: "center",
    transition: "all 0.2s ease",
  },
  buttonPrimary: {
    backgroundColor: "#2F81F7",
    color: "#C9D1D9",
  },
  buttonSecondary: {
    backgroundColor: "#1E2630",
    color: "#C9D1D9",
  },
  buttonGhost: {
    backgroundColor: "transparent",
    color: "#2F81F7",
    border: "2px solid #2F81F7",
  },
};
