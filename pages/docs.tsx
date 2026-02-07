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
          
          <h3 style={styles.subsectionTitle}>{t("docs.phase1.coreDocuments")}</h3>
          <ul style={styles.docList}>
            <li><strong>VERIFIED_FEED_SPEC_v1.1.md</strong> - {t("docs.phase1.doc1")}</li>
            <li><strong>RELEASE_NOTES_v1.1.md</strong> - {t("docs.phase1.doc2")}</li>
            <li><strong>IOSCO_COMPLIANCE_v1.1.md</strong> - {t("docs.phase1.doc3")}</li>
          </ul>
          
          <h3 style={styles.subsectionTitle}>{t("docs.phase1.apiEndpoints")}</h3>
          <ul style={styles.endpointList}>
            <li><code>/api/events</code> - {t("docs.phase1.endpoint1")}</li>
            <li><code>/api/evidence</code> - {t("docs.phase1.endpoint2")}</li>
            <li><code>/api/validation/metrics</code> - {t("docs.phase1.endpoint3")}</li>
            <li><code>/api/audit/explain</code> - {t("docs.phase1.endpoint4")}</li>
          </ul>

          <h3 style={styles.subsectionTitle}>{t("docs.phase1.validationTests")}</h3>
          <ol style={styles.testList}>
            <li>{t("docs.phase1.test1")}</li>
            <li>{t("docs.phase1.test2")}</li>
            <li>{t("docs.phase1.test3")}</li>
            <li>{t("docs.phase1.test4")}</li>
            <li>{t("docs.phase1.test5")}</li>
            <li>{t("docs.phase1.test6")}</li>
          </ol>

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
    color: '#1a1a1a',
    lineHeight: 1.6,
  } as React.CSSProperties,

  mainTitle: {
    fontSize: '42px',
    fontWeight: 700,
    marginBottom: '10px',
    margin: '0 0 10px',
  } as React.CSSProperties,

  subtitle: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '40px',
    margin: '0 0 40px',
  } as React.CSSProperties,

  phaseTabs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '60px',
  } as React.CSSProperties,

  phaseTab: {
    padding: '24px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  } as React.CSSProperties,

  phaseTitle: {
    fontSize: '20px',
    fontWeight: 700,
    margin: '0 0 8px',
  } as React.CSSProperties,

  phaseDescription: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  } as React.CSSProperties,

  section: {
    marginBottom: '60px',
    paddingBottom: '40px',
    borderBottom: '1px solid #e0e0e0',
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '30px',
    color: '#2563eb',
  } as React.CSSProperties,

  sectionIntro: {
    fontSize: '16px',
    color: '#555',
    marginBottom: '24px',
  } as React.CSSProperties,

  subsectionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    marginTop: '24px',
    marginBottom: '12px',
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
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '6px',
    marginTop: '24px',
  } as React.CSSProperties,

  agentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  } as React.CSSProperties,

  agentBox: {
    padding: '16px',
    backgroundColor: '#f9f9f9',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
  } as React.CSSProperties,

  agentBadge: {
    display: 'inline-block',
    marginTop: '12px',
    padding: '4px 12px',
    backgroundColor: '#d4edda',
    color: '#155724',
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
    backgroundColor: '#f5f5f5',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
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
    backgroundColor: '#f9f9f9',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
};

export default Docs;
