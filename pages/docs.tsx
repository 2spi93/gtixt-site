import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useTranslation } from '../lib/useTranslationStub';

const Docs: NextPage = () => {
  const { t } = useTranslation('common');
  
  return (
    <>
      <Head>
        <title>{t("docs.meta.title")}</title>
        <meta name="description" content={t("docs.meta.description")} />
        <style>{`
          @media (max-width: 768px) {
            .responsive-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
            .responsive-2col { grid-template-columns: repeat(2, 1fr) !important; }
            .responsive-card { padding: 16px 12px !important; }
            .responsive-text { font-size: 14px !important; }
          }
          @media (max-width: 480px) {
            .responsive-2col { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </Head>

      <div style={styles.container}>
        <h1 style={styles.mainTitle}>{t("docs.title")}</h1>
        <p style={styles.subtitle}>{t("docs.subtitle")}</p>
        
        {/* Phase Selector */}
        <div style={styles.phaseTabs}>
          <div style={styles.phaseTab}>
            <h3 style={styles.phaseTitle}>📋 {t("docs.phase1Tab.title")}</h3>
            <p style={styles.phaseDescription}>{t("docs.phase1Tab.description")}</p>
          </div>
          <div style={styles.phaseTab}>
            <h3 style={styles.phaseTitle}>🤖 {t("docs.phase2Tab.title")}</h3>
            <p style={styles.phaseDescription}>{t("docs.phase2Tab.description")}</p>
          </div>
        </div>

        {/* Phase 1 Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>{t("docs.phase1.title")}</h2>
          
          <h3 style={styles.subsectionTitle}>📚 {t("docs.phase1.coreDocuments")}</h3>
          <div style={styles.coreDocGrid}>
            <div style={styles.coreDocCard}>
              <div style={styles.docIconContainer}>📖</div>
              <h4 style={styles.docCardTitle}>VERIFIED_FEED_SPEC_v1.1.md</h4>
              <p style={styles.docCardDescription}>{t("docs.phase1.doc1")}</p>
              <p style={styles.docCardMeta}>Partner API specification • Essential reference</p>
            </div>
            <div style={styles.coreDocCard}>
              <div style={styles.docIconContainer}>📝</div>
              <h4 style={styles.docCardTitle}>RELEASE_NOTES_v1.1.md</h4>
              <p style={styles.docCardDescription}>{t("docs.phase1.doc2")}</p>
              <p style={styles.docCardMeta}>Complete changelog • Migration guide</p>
            </div>
            <div style={styles.coreDocCard}>
              <div style={styles.docIconContainer}>✅</div>
              <h4 style={styles.docCardTitle}>IOSCO_COMPLIANCE_v1.1.md</h4>
              <p style={styles.docCardDescription}>{t("docs.phase1.doc3")}</p>
              <p style={styles.docCardMeta}>Regulatory compliance • Evidence trail</p>
            </div>
          </div>

          <h3 style={styles.subsectionTitle}>🔐 Institutional Endpoints (v1.1+)</h3>
          <p style={styles.sectionIntro}>
            Advanced cryptographic verification and complete provenance tracking for institutional-grade audit trails.
          </p>
          <div style={styles.apiGrid}>
            <div style={styles.apiCard}>
              <code style={styles.apiEndpoint}>/api/provenance/trace</code>
              <p style={styles.apiDescription}>Complete hash chain from evidence to multi-level aggregates. Includes timestamp, signer, and verification status.</p>
            </div>
            <div style={styles.apiCard}>
              <code style={styles.apiEndpoint}>/api/provenance/graph</code>
              <p style={styles.apiDescription}>Provenance graph for a firm across time periods. Shows all transformation steps and data lineage.</p>
            </div>
            <div style={styles.apiCard}>
              <code style={styles.apiEndpoint}>/api/provenance/evidence</code>
              <p style={styles.apiDescription}>Retrieve evidence with multi-level hashing proof. Includes SHA-256 at evidence, firm, pillar, dataset, and ECDSA-secp256k1 signature levels.</p>
            </div>
            <div style={styles.apiCard}>
              <code style={styles.apiEndpoint}>/api/provenance/verify</code>
              <p style={styles.apiDescription}>Verify signature and hash chain integrity. Validates ECDSA-secp256k1 signatures against published keys for non-repudiation.</p>
            </div>
          </div>

          <h3 style={styles.subsectionTitle}>📊 Core Public Endpoints</h3>
          <div style={styles.apiGrid}>
            <div style={styles.apiCard}>
              <code style={styles.apiEndpoint}>/api/events</code>
              <p style={styles.apiDescription}>{t("docs.phase1.endpoint1")}</p>
            </div>
            <div style={styles.apiCard}>
              <code style={styles.apiEndpoint}>/api/evidence</code>
              <p style={styles.apiDescription}>{t("docs.phase1.endpoint2")}</p>
            </div>
            <div style={styles.apiCard}>
              <code style={styles.apiEndpoint}>/api/validation/metrics</code>
              <p style={styles.apiDescription}>{t("docs.phase1.endpoint3")}</p>
            </div>
            <div style={styles.apiCard}>
              <code style={styles.apiEndpoint}>/api/audit/explain</code>
              <p style={styles.apiDescription}>{t("docs.phase1.endpoint4")}</p>
            </div>
          </div>

          <h3 style={styles.subsectionTitle}>✔️ {t("docs.phase1.validationTests")}</h3>
          <div style={styles.testGrid}>
            <div style={styles.testCard}>
              <span style={styles.testIcon}>1</span>
              <p style={styles.testName}>Multi-Level Hashing (Evidence → Firm → Pillar → Dataset → ECDSA)</p>
            </div>
            <div style={styles.testCard}>
              <span style={styles.testIcon}>2</span>
              <p style={styles.testName}>Provenance Trace Endpoint (/api/provenance/trace)</p>
            </div>
            <div style={styles.testCard}>
              <span style={styles.testIcon}>3</span>
              <p style={styles.testName}>Provenance Graph Endpoint (/api/provenance/graph)</p>
            </div>
            <div style={styles.testCard}>
              <span style={styles.testIcon}>4</span>
              <p style={styles.testName}>Evidence Verification Endpoint (/api/provenance/evidence)</p>
            </div>
            <div style={styles.testCard}>
              <span style={styles.testIcon}>5</span>
              <p style={styles.testName}>Signature Verification Endpoint (/api/provenance/verify)</p>
            </div>
            <div style={styles.testCard}>
              <span style={styles.testIcon}>6</span>
              <p style={styles.testName}>ECDSA-secp256k1 Non-Repudiation Validation</p>
            </div>
          </div>

          <div style={styles.infoBox}>
            <p><strong>{t("docs.phase1.statusLabel")}</strong> ✅ {t("docs.phase1.statusValue")}</p>
          </div>
        </div>

        {/* Phase 2 Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>{t("docs.phase2.title")}</h2>
          
          <p style={styles.sectionIntro}>
            Phase 2 introduces 7 specialized bot agents for automated compliance verification, complete evidence pipeline, and IOSCO compliance reporting.
          </p>

          <h3 style={styles.subsectionTitle}>Getting Started</h3>
          <ul style={styles.docList}>
            <li>
              <Link href="/phase2" style={styles.docLink}>
                📄 {t("docs.phase2.overviewTitle")}
              </Link>
              - {t("docs.phase2.overviewDesc")}
            </li>
            <li>
              <Link href="/agents-dashboard" style={styles.docLink}>
                🤖 Agent Dashboard
              </Link>
              - Real-time health monitoring of all 7 agents
            </li>
            <li>
              <strong>PHASE_2_QUICKSTART.md</strong> - {t("docs.phase2.coreDoc2")}
            </li>
            <li>
              <strong>PHASE_2_DELIVERY_REPORT.md</strong> - {t("docs.phase2.coreDoc4")}
            </li>
          </ul>

          <h3 style={styles.subsectionTitle}>The 7 Agents</h3>
          <div style={styles.agentGrid}>
            <div style={styles.agentBox}>
              <h4>🏛️ {t("docs.phase2.agents.rvi.title")}</h4>
              <p>Registry Verification - License and entity verification</p>
              <span style={styles.agentBadge}>COMPLETE ✅</span>
            </div>
            <div style={styles.agentBox}>
              <h4>⛔ {t("docs.phase2.agents.sss.title")}</h4>
              <p>Sanctions Screening - OFAC/UN watchlist checking</p>
              <span style={styles.agentBadge}>COMPLETE ✅</span>
            </div>
            <div style={styles.agentBox}>
              <h4>📰 {t("docs.phase2.agents.rem.title")}</h4>
              <p>Regulatory Events - Enforcement action tracking</p>
              <span style={styles.agentBadge}>COMPLETE ✅</span>
            </div>
            <div style={styles.agentBox}>
              <h4>📋 {t("docs.phase2.agents.irs.title")}</h4>
              <p>Review System - Submission validation</p>
              <span style={styles.agentBadge}>COMPLETE ✅</span>
            </div>
            <div style={styles.agentBox}>
              <h4>⭐ {t("docs.phase2.agents.frp.title")}</h4>
              <p>Reputation & Payout - Sentiment analysis</p>
              <span style={styles.agentBadge}>COMPLETE ✅</span>
            </div>
            <div style={styles.agentBox}>
              <h4>🔍 {t("docs.phase2.agents.mis.title")}</h4>
              <p>Investigation System - Deep research</p>
              <span style={styles.agentBadge}>COMPLETE ✅</span>
            </div>
            <div style={styles.agentBox}>
              <h4>📊 {t("docs.phase2.agents.iip.title")}</h4>
              <p>IOSCO Reporting - Compliance certification</p>
              <span style={styles.agentBadge}>COMPLETE ✅</span>
            </div>
          </div>

          <h3 style={styles.subsectionTitle}>{t("docs.phase2.apiTitle")}</h3>
          <ul style={styles.endpointList}>
            <li><code>/api/agents/status</code> - {t("docs.phase2.api1")}</li>
            <li><code>/api/agents/health</code> - {t("docs.phase2.api2")}</li>
            <li><code>/api/evidence</code> - Evidence collection (updated)</li>
            <li><code>/api/compliance/reports</code> - IOSCO compliance reports</li>
          </ul>

          <h3 style={styles.subsectionTitle}>{t("docs.phase2.completeDocsTitle")}</h3>
          <div style={styles.docGrid}>
            <div style={styles.docCard}>
              <h4>📊 {t("docs.phase2.reportsTitle")}</h4>
              <ul style={styles.docList}>
                <li>PHASE_2_FINAL_STATUS.md</li>
                <li>PHASE_2_IMPLEMENTATION_SUMMARY.md</li>
                <li>PHASE_2_DELIVERY_REPORT.md</li>
              </ul>
            </div>
            <div style={styles.docCard}>
              <h4>📅 {t("docs.phase2.weeklyTitle")}</h4>
              <ul style={styles.docList}>
                <li>PHASE_2_WEEK_1_COMPLETE.md</li>
                <li>PHASE_2_WEEK_2_COMPLETE.md</li>
                <li>PHASE_2_WEEK_3_COMPLETE.md</li>
                <li>PHASE_2_WEEK_4_COMPLETE.md</li>
              </ul>
            </div>
            <div style={styles.docCard}>
              <h4>📚 {t("docs.phase2.referenceTitle")}</h4>
              <ul style={styles.docList}>
                <li>PHASE_2_PLAN.md</li>
                <li>PHASE_2_DOCUMENTATION_INDEX.md</li>
                <li>PHASE_2_QUICKSTART.md</li>
              </ul>
            </div>
          </div>

          <div style={styles.infoBox}>
            <p><strong>{t("docs.phase2.statusLabel")}</strong> ✅ {t("docs.phase2.statusValue")}</p>
            <p><strong>{t("docs.phase2.nextPhaseLabel")}</strong> {t("docs.phase2.nextPhaseValue")}</p>
            <p><strong>{t("docs.phase2.launchLabel")}</strong> 📅 {t("docs.phase2.launchValue")}</p>
          </div>
        </div>

        {/* Quick Navigation */}
        <div style={styles.navigationSection}>
          <h2 style={styles.sectionTitle}>{t("docs.navigation.title")}</h2>
          <div style={styles.navGrid}>
            <Link href="/phase2" style={styles.navCard}>
              <h3>📄 {t("docs.navigation.phase2.title")}</h3>
              <p>{t("docs.navigation.phase2.description")}</p>
            </Link>
            <Link href="/agents-dashboard" style={styles.navCard}>
              <h3>🤖 {t("docs.navigation.agents.title")}</h3>
              <p>{t("docs.navigation.agents.description")}</p>
            </Link>
            <Link href="/validation" style={styles.navCard}>
              <h3>✅ {t("docs.navigation.validation.title")}</h3>
              <p>{t("docs.navigation.validation.description")}</p>
            </Link>
            <Link href="/api-docs" style={styles.navCard}>
              <h3>🔌 {t("docs.navigation.api.title")}</h3>
              <p>{t("docs.navigation.api.description")}</p>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: '#F3F7FF',
    lineHeight: 1.6,
  } as React.CSSProperties,

  mainTitle: {
    fontSize: '42px',
    fontWeight: 700,
    color: '#F3F7FF',
    margin: '0 0 10px',
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 209, 193, 0.3)',
  } as React.CSSProperties,

  subtitle: {
    fontSize: '18px',
    color: 'rgba(243,247,255,.72)',
    margin: '0 0 40px',
    fontWeight: 500,
  } as React.CSSProperties,

  phaseTabs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '60px',
  } as React.CSSProperties,

  phaseTab: {
    padding: '24px',
    backgroundColor: 'rgba(255,255,255,.04)',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,.10)',
    borderLeft: '4px solid #00D1C1',
  } as React.CSSProperties,

  phaseTitle: {
    fontSize: '20px',
    fontWeight: 700,
    margin: '0 0 8px',
    color: '#00D1C1',
  } as React.CSSProperties,

  phaseDescription: {
    fontSize: '14px',
    color: 'rgba(243,247,255,.55)',
    margin: 0,
  } as React.CSSProperties,

  section: {
    marginBottom: '60px',
    paddingBottom: '40px',
    borderBottom: '1px solid rgba(255,255,255,.10)',
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '30px',
    color: '#00D1C1',
    borderBottom: '3px solid #00D1C1',
    paddingBottom: '12px',
  } as React.CSSProperties,

  sectionIntro: {
    fontSize: '16px',
    color: 'rgba(243,247,255,.55)',
    marginBottom: '24px',
    fontWeight: 500,
  } as React.CSSProperties,

  subsectionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    marginTop: '32px',
    marginBottom: '16px',
    color: '#00D1C1',
  } as React.CSSProperties,

  docList: {
    listStyle: 'none' as const,
    padding: 0,
    margin: '0 0 20px',
  } as React.CSSProperties,

  docLink: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: 500,
  } as React.CSSProperties,

  // Core Document Cards
  coreDocGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  } as React.CSSProperties,

  coreDocCard: {
    padding: '24px',
    backgroundColor: 'rgba(255,255,255,.04)',
    border: '2px solid #00D1C1',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 209, 193, 0.15)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  } as React.CSSProperties,

  docIconContainer: {
    fontSize: '32px',
    marginBottom: '12px',
  } as React.CSSProperties,

  docCardTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#00D1C1',
    margin: '0 0 8px',
    fontFamily: 'monospace',
  } as React.CSSProperties,

  docCardDescription: {
    fontSize: '14px',
    color: '#F3F7FF',
    margin: '8px 0',
    fontWeight: 500,
  } as React.CSSProperties,

  docCardMeta: {
    fontSize: '12px',
    color: 'rgba(243,247,255,.55)',
    margin: '8px 0 0',
    fontStyle: 'italic',
  } as React.CSSProperties,

  // API Endpoint Cards
  apiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
    marginBottom: '40px',
  } as React.CSSProperties,

  apiCard: {
    padding: '20px',
    backgroundColor: 'rgba(255,255,255,.02)',
    border: '1px solid rgba(0, 209, 193, 0.3)',
    borderRadius: '6px',
    borderLeft: '4px solid #00D1C1',
  } as React.CSSProperties,

  apiEndpoint: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#00D1C1',
    backgroundColor: 'rgba(0, 209, 193, 0.1)',
    padding: '6px 12px',
    borderRadius: '4px',
    display: 'block',
    marginBottom: '8px',
    fontFamily: 'monospace',
  } as React.CSSProperties,

  apiDescription: {
    fontSize: '13px',
    color: '#F3F7FF',
    margin: 0,
  } as React.CSSProperties,

  // Validation Test Cards
  testGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  } as React.CSSProperties,

  testCard: {
    padding: '16px',
    backgroundColor: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.10)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  } as React.CSSProperties,

  testIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    minWidth: '32px',
    backgroundColor: '#00D1C1',
    color: '#070B14',
    borderRadius: '50%',
    fontWeight: 700,
    fontSize: '14px',
  } as React.CSSProperties,

  testName: {
    fontSize: '14px',
    color: '#F3F7FF',
    margin: 0,
    fontWeight: 500,
  } as React.CSSProperties,

  endpointList: {
    listStyle: 'none' as const,
    padding: 0,
    margin: '0 0 20px',
  } as React.CSSProperties,

  testList: {
    marginBottom: '20px',
  } as React.CSSProperties,

  infoBox: {
    padding: '20px',
    backgroundColor: 'rgba(0, 209, 193, 0.1)',
    border: '2px solid #00D1C1',
    borderRadius: '6px',
    marginTop: '24px',
    color: '#00D1C1',
  } as React.CSSProperties,

  agentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  } as React.CSSProperties,

  agentBox: {
    padding: '16px',
    backgroundColor: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.10)',
    borderRadius: '6px',
  } as React.CSSProperties,

  agentBadge: {
    display: 'inline-block',
    marginTop: '12px',
    padding: '6px 14px',
    backgroundColor: '#00D1C1',
    color: '#070B14',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
  } as React.CSSProperties,

  docGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  } as React.CSSProperties,

  docCard: {
    padding: '20px',
    backgroundColor: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.10)',
    borderRadius: '6px',
    borderLeft: '4px solid #00D1C1',
  } as React.CSSProperties,

  navigationSection: {
    marginTop: '40px',
  } as React.CSSProperties,

  navGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  } as React.CSSProperties,

  navCard: {
    padding: '24px',
    backgroundColor: 'rgba(255,255,255,.04)',
    border: '2px solid #00D1C1',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#F3F7FF',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0, 209, 193, 0.1)',
  } as React.CSSProperties,
};

export default Docs;
