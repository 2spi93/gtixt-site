import Head from "next/head";
import Link from "next/link";
import InstitutionalHeader from "../components/InstitutionalHeader";
import Footer from "../components/Footer";
import { useIsMounted } from "../lib/useIsMounted";
import { useTranslation } from "../lib/useTranslationStub";

export default function GovernancePage() {
  const isMounted = useIsMounted();
  const { t } = useTranslation("common");

  return (
    <>
      <Head>
        <title>Governance — GTIXT</title>
        <meta
          name="description"
          content="GTIXT governance framework ensuring neutrality, integrity, independence, and transparency. No commercial influence, no discretionary overrides."
        />
      </Head>

      <InstitutionalHeader
        breadcrumbs={isMounted ? [{ label: t("governance.breadcrumb"), href: "/governance" }] : []}
      />

      <main style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.eyebrow}>{t("governance.eyebrow")}</div>
          <h1 style={styles.h1}>{t("governance.title")}</h1>
          <p style={styles.lead}>
            {t("governance.lead")}
          </p>
        </section>

        {/* Core Principles */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("governance.principles.title")}</h2>
          <p style={styles.sectionLead}>
            {t("governance.principles.lead")}
          </p>

          <div style={styles.principlesGrid}>
            <div style={styles.principleCard}>
              <div style={styles.principleIcon}>⚙️</div>
              <h3 style={styles.principleTitle}>{t("governance.principles.determinism.title")}</h3>
              <p style={styles.principleText}>
                {t("governance.principles.determinism.text")}
              </p>
            </div>
            <div style={styles.principleCard}>
              <div style={styles.principleIcon}>📖</div>
              <h3 style={styles.principleTitle}>{t("governance.principles.transparency.title")}</h3>
              <p style={styles.principleText}>
                {t("governance.principles.transparency.text")}
              </p>
            </div>
            <div style={styles.principleCard}>
              <div style={styles.principleIcon}>🔍</div>
              <h3 style={styles.principleTitle}>{t("governance.principles.auditability.title")}</h3>
              <p style={styles.principleText}>
                {t("governance.principles.auditability.text")}
              </p>
            </div>
            <div style={styles.principleCard}>
              <div style={styles.principleIcon}>🚫</div>
              <h3 style={styles.principleTitle}>{t("governance.principles.nonIntervention.title")}</h3>
              <p style={styles.principleText}>
                {t("governance.principles.nonIntervention.text")}
              </p>
            </div>
            <div style={styles.principleCard}>
              <div style={styles.principleIcon}>🚫</div>
              <h3 style={styles.principleTitle}>{t("governance.principles.noCommercial.title")}</h3>
              <p style={styles.principleText}>
                {t("governance.principles.noCommercial.text")}
              </p>
            </div>
            <div style={styles.principleCard}>
              <div style={styles.principleIcon}>📋</div>
              <h3 style={styles.principleTitle}>{t("governance.principles.evidenceBased.title")}</h3>
              <p style={styles.principleText}>
                {t("governance.principles.evidenceBased.text")}
              </p>
            </div>
            <div style={styles.principleCard}>
              <div style={styles.principleIcon}>🔒</div>
              <h3 style={styles.principleTitle}>{t("governance.principles.oversightGate.title")}</h3>
              <p style={styles.principleText}>
                {t("governance.principles.oversightGate.text")}
              </p>
            </div>
            <div style={styles.principleCard}>
              <div style={styles.principleIcon}>🔄</div>
              <h3 style={styles.principleTitle}>{t("governance.principles.versioning.title")}</h3>
              <p style={styles.principleText}>
                {t("governance.principles.versioning.text")}
              </p>
            </div>
          </div>
        </section>

        {/* Governance Framework */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("governance.framework.title")}</h2>
          <p style={styles.sectionLead}>
            {t("governance.framework.lead")}
          </p>

          <div style={styles.frameworkGrid}>
            <div style={styles.frameworkCard}>
              <div style={styles.frameworkNumber}>1</div>
              <h4 style={styles.frameworkTitle}>{t("governance.framework.indexCommittee.title")}</h4>
              <p style={styles.frameworkText}>
                {t("governance.framework.indexCommittee.text")}
              </p>
            </div>

            <div style={styles.frameworkCard}>
              <div style={styles.frameworkNumber}>2</div>
              <h4 style={styles.frameworkTitle}>{t("governance.framework.methodologyLayer.title")}</h4>
              <p style={styles.frameworkText}>
                {t("governance.framework.methodologyLayer.text")}
              </p>
            </div>

            <div style={styles.frameworkCard}>
              <div style={styles.frameworkNumber}>3</div>
              <h4 style={styles.frameworkTitle}>{t("governance.framework.integrityLayer.title")}</h4>
              <p style={styles.frameworkText}>
                {t("governance.framework.integrityLayer.text")}
              </p>
            </div>

            <div style={styles.frameworkCard}>
              <div style={styles.frameworkNumber}>4</div>
              <h4 style={styles.frameworkTitle}>{t("governance.framework.publicationLayer.title")}</h4>
              <p style={styles.frameworkText}>
                {t("governance.framework.publicationLayer.text")}
              </p>
            </div>
          </div>

          <div style={styles.frameworkNote}>
            <p style={styles.noteText}>
              <strong>{t("governance.framework.note")}</strong>
            </p>
          </div>
        </section>

        {/* Independence */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("governance.independence.title")}</h2>
          <p style={styles.sectionLead}>
            {t("governance.independence.lead")}
          </p>

          <div style={styles.independenceGrid}>
            <div style={styles.independenceCard}>
              <h4 style={styles.independenceTitle}>{t("governance.independence.noCommercial.title")}</h4>
              <p style={styles.independenceText}>
                {t("governance.independence.noCommercial.text")}
              </p>
            </div>

            <div style={styles.independenceCard}>
              <h4 style={styles.independenceTitle}>{t("governance.independence.noInfluence.title")}</h4>
              <p style={styles.independenceText}>
                {t("governance.independence.noInfluence.text")}
              </p>
            </div>

            <div style={styles.independenceCard}>
              <h4 style={styles.independenceTitle}>{t("governance.independence.structuralSeparation.title")}</h4>
              <p style={styles.independenceText}>
                {t("governance.independence.structuralSeparation.text")}
              </p>
            </div>

            <div style={styles.independenceCard}>
              <h4 style={styles.independenceTitle}>{t("governance.independence.conflictOfInterest.title")}</h4>
              <p style={styles.independenceText}>
                {t("governance.independence.conflictOfInterest.text")}
              </p>
            </div>
          </div>
        </section>

        {/* Transparency */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("governance.transparency.title")}</h2>
          <p style={styles.sectionLead}>
            {t("governance.transparency.lead")}
          </p>

          <div style={styles.transparencyGrid}>
            <div style={styles.transparencyCard}>
              <div style={styles.transparencyIcon}>📄</div>
              <h5 style={styles.transparencyTitle}>{t("governance.transparency.openMethodology.title")}</h5>
              <p style={styles.transparencyText}>
                {t("governance.transparency.openMethodology.text")}
              </p>
              <Link href="/methodology" style={styles.transparencyLink}>
                {t("governance.transparency.openMethodology.link")}
              </Link>
            </div>

            <div style={styles.transparencyCard}>
              <div style={styles.transparencyIcon}>📦</div>
              <h5 style={styles.transparencyTitle}>{t("governance.transparency.publicSnapshots.title")}</h5>
              <p style={styles.transparencyText}>
                {t("governance.transparency.publicSnapshots.text")}
              </p>
              <Link href="/data" style={styles.transparencyLink}>
                {t("governance.transparency.publicSnapshots.link")}
              </Link>
            </div>

            <div style={styles.transparencyCard}>
              <div style={styles.transparencyIcon}>🔗</div>
              <h5 style={styles.transparencyTitle}>{t("governance.transparency.evidenceExcerpts.title")}</h5>
              <p style={styles.transparencyText}>
                {t("governance.transparency.evidenceExcerpts.text")}
              </p>
              <Link href="/integrity" style={styles.transparencyLink}>
                {t("governance.transparency.evidenceExcerpts.link")}
              </Link>
            </div>

            <div style={styles.transparencyCard}>
              <div style={styles.transparencyIcon}>📊</div>
              <h5 style={styles.transparencyTitle}>{t("governance.transparency.apiAccess.title")}</h5>
              <p style={styles.transparencyText}>
                {t("governance.transparency.apiAccess.text")}
              </p>
              <Link href="/api-docs" style={styles.transparencyLink}>
                {t("governance.transparency.apiAccess.link")}
              </Link>
            </div>
          </div>
        </section>

        {/* Oversight Gate */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("governance.oversight.title")}</h2>
          <p style={styles.sectionLead}>
            {t("governance.oversight.lead")}
          </p>

          <div style={styles.oversightCard}>
            <h4 style={styles.oversightTitle}>{t("governance.oversight.agentC.title")}</h4>
            <div style={styles.oversightGrid}>
              <div style={styles.oversightItem}>
                <div style={styles.oversightIcon}>✓</div>
                <h5 style={styles.oversightItemTitle}>{t("governance.oversight.agentC.completeness.title")}</h5>
                <p style={styles.oversightItemText}>
                  {t("governance.oversight.agentC.completeness.text")}
                </p>
              </div>

              <div style={styles.oversightItem}>
                <div style={styles.oversightIcon}>✓</div>
                <h5 style={styles.oversightItemTitle}>{t("governance.oversight.agentC.anomaly.title")}</h5>
                <p style={styles.oversightItemText}>
                  {t("governance.oversight.agentC.anomaly.text")}
                </p>
              </div>

              <div style={styles.oversightItem}>
                <div style={styles.oversightIcon}>✓</div>
                <h5 style={styles.oversightItemTitle}>{t("governance.oversight.agentC.sourceVerification.title")}</h5>
                <p style={styles.oversightItemText}>
                  {t("governance.oversight.agentC.sourceVerification.text")}
                </p>
              </div>

              <div style={styles.oversightItem}>
                <div style={styles.oversightIcon}>✓</div>
                <h5 style={styles.oversightItemTitle}>{t("governance.oversight.agentC.qualityGates.title")}</h5>
                <p style={styles.oversightItemText}>
                  {t("governance.oversight.agentC.qualityGates.text")}
                </p>
              </div>
            </div>
          </div>

          <p style={styles.oversightNote}>
            {t("governance.oversight.note")}
          </p>
        </section>

        {/* Versioning */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("governance.versioning.title")}</h2>
          <p style={styles.sectionLead}>
            {t("governance.versioning.lead")}
          </p>

          <div style={styles.versionTimeline}>
            <div style={styles.versionItem}>
              <div style={styles.versionBadge}>v0.1</div>
              <div style={styles.versionContent}>
                <h5 style={styles.versionTitle}>{t("governance.versioning.versions.v01.title")}</h5>
                <p style={styles.versionText}>
                  {t("governance.versioning.versions.v01.text")}
                </p>
              </div>
            </div>

            <div style={styles.versionItem}>
              <div style={styles.versionBadge}>v1.0</div>
              <div style={styles.versionContent}>
                <h5 style={styles.versionTitle}>{t("governance.versioning.versions.v10.title")}</h5>
                <p style={styles.versionText}>
                  {t("governance.versioning.versions.v10.text")}
                </p>
              </div>
            </div>

            <div style={styles.versionItem}>
              <div style={styles.versionBadge}>v1.1</div>
              <div style={styles.versionContent}>
                <h5 style={styles.versionTitle}>{t("governance.versioning.versions.v11.title")}</h5>
                <p style={styles.versionText}>
                  {t("governance.versioning.versions.v11.text")}
                </p>
              </div>
            </div>
          </div>

          <div style={styles.changelogCard}>
            <h5 style={styles.changelogTitle}>{t("governance.versioning.changelog.title")}</h5>
            <ul style={styles.changelogList}>
              <li style={styles.changelogItem}>
                <strong>{t("governance.versioning.changelog.major.label")}</strong> {t("governance.versioning.changelog.major.text")}
              </li>
              <li style={styles.changelogItem}>
                <strong>{t("governance.versioning.changelog.minor.label")}</strong> {t("governance.versioning.changelog.minor.text")}
              </li>
              <li style={styles.changelogItem}>
                <strong>{t("governance.versioning.changelog.reproducibility.label")}</strong> {t("governance.versioning.changelog.reproducibility.text")}
              </li>
            </ul>
          </div>
        </section>

        {/* Advisory Board */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("governance.advisory.title")}</h2>
          <p style={styles.sectionLead}>
            {t("governance.advisory.lead")}
          </p>

          <div style={styles.advisoryCard}>
            <h5 style={styles.advisoryTitle}>{t("governance.advisory.composition.title")}</h5>
            <div style={styles.advisoryGrid}>
              <div style={styles.advisoryItem}>
                <div style={styles.advisoryIcon}>🏛️</div>
                <p style={styles.advisoryText}>{t("governance.advisory.composition.risk")}</p>
              </div>
              <div style={styles.advisoryItem}>
                <div style={styles.advisoryIcon}>📊</div>
                <p style={styles.advisoryText}>{t("governance.advisory.composition.market")}</p>
              </div>
              <div style={styles.advisoryItem}>
                <div style={styles.advisoryIcon}>🔐</div>
                <p style={styles.advisoryText}>{t("governance.advisory.composition.data")}</p>
              </div>
              <div style={styles.advisoryItem}>
                <div style={styles.advisoryIcon}>💼</div>
                <p style={styles.advisoryText}>{t("governance.advisory.composition.trading")}</p>
              </div>
            </div>

            <p style={styles.advisoryNote}>
              <strong>{t("governance.advisory.role.label")}</strong> {t("governance.advisory.role.text")}
            </p>
          </div>
        </section>

        {/* Regulatory Alignment */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("governance.neutrality.title")}</h2>
          <p style={styles.sectionLead}>
            {t("governance.neutrality.lead")}
          </p>

          <div style={styles.policyGrid}>
            <div style={styles.policyCard}>
              <h4 style={styles.policyTitle}>{t("governance.neutrality.doesNot.title")}</h4>
              <ul style={styles.policyList}>
                <li>{t("governance.neutrality.doesNot.item1")}</li>
                <li>{t("governance.neutrality.doesNot.item2")}</li>
                <li>{t("governance.neutrality.doesNot.item3")}</li>
                <li>{t("governance.neutrality.doesNot.item4")}</li>
                <li>{t("governance.neutrality.doesNot.item5")}</li>
                <li>{t("governance.neutrality.doesNot.item6")}</li>
              </ul>
            </div>

            <div style={styles.policyCard}>
              <h4 style={styles.policyTitle}>{t("governance.neutrality.enforces.title")}</h4>
              <ul style={styles.policyList}>
                <li>{t("governance.neutrality.enforces.item1")}</li>
                <li>{t("governance.neutrality.enforces.item2")}</li>
                <li>{t("governance.neutrality.enforces.item3")}</li>
                <li>{t("governance.neutrality.enforces.item4")}</li>
                <li>{t("governance.neutrality.enforces.item5")}</li>
                <li>{t("governance.neutrality.enforces.item6")}</li>
              </ul>
            </div>
          </div>

          <div style={styles.disputeSection}>
            <h4 style={styles.disputeTitle}>{t("governance.neutrality.dispute.title")}</h4>
            <p style={styles.disputeText}>
              {t("governance.neutrality.dispute.lead")}
            </p>
            <ul style={styles.disputeList}>
              <li><strong>{t("governance.neutrality.dispute.item1.label")}</strong> — {t("governance.neutrality.dispute.item1.text")}</li>
              <li><strong>{t("governance.neutrality.dispute.item2.label")}</strong> — {t("governance.neutrality.dispute.item2.text")}</li>
              <li><strong>{t("governance.neutrality.dispute.item3.label")}</strong> — {t("governance.neutrality.dispute.item3.text")}</li>
            </ul>
          </div>

          <div style={styles.economicNeutralitySection}>
            <h4 style={styles.economicTitle}>{t("governance.neutrality.economic.title")}</h4>
            <p style={styles.economicText}>
              {t("governance.neutrality.economic.text")}
            </p>
          </div>
        </section>

        {/* Regulatory Alignment */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("governance.regulatory.title")}</h2>
          <p style={styles.sectionLead}>
            {t("governance.regulatory.lead")}
          </p>

          <div style={styles.regulatoryCard}>
            <h5 style={styles.regulatoryTitle}>{t("governance.regulatory.iosco.title")}</h5>
            <p style={styles.regulatoryText}>
              {t("governance.regulatory.iosco.lead")}
            </p>
            <ul style={styles.regulatoryList}>
              <li style={styles.regulatoryItem}>
                <strong>{t("governance.regulatory.iosco.governance.label")}</strong> {t("governance.regulatory.iosco.governance.text")}
              </li>
              <li style={styles.regulatoryItem}>
                <strong>{t("governance.regulatory.iosco.quality.label")}</strong> {t("governance.regulatory.iosco.quality.text")}
              </li>
              <li style={styles.regulatoryItem}>
                <strong>{t("governance.regulatory.iosco.methodology.label")}</strong> {t("governance.regulatory.iosco.methodology.text")}
              </li>
              <li style={styles.regulatoryItem}>
                <strong>{t("governance.regulatory.iosco.accountability.label")}</strong> {t("governance.regulatory.iosco.accountability.text")}
              </li>
            </ul>
          </div>

          <p style={styles.regulatoryNote}>
            {t("governance.regulatory.note")}
          </p>
        </section>

        {/* Related Resources */}
        <section style={styles.ctaSection}>
          <h3 style={styles.ctaTitle}>{t("governance.cta.title")}</h3>
          <p style={styles.ctaText}>
            {t("governance.cta.text")}
          </p>
          <div style={styles.ctaButtons}>
            <Link href="/methodology" style={{...styles.button, ...styles.buttonPrimary}}>
              📚 {t("governance.cta.methodology")}
            </Link>
            <Link href="/integrity" style={{...styles.button, ...styles.buttonSecondary}}>
              🔒 {t("governance.cta.integrity")}
            </Link>
            <Link href="/data" style={{...styles.button, ...styles.buttonGhost}}>
              📊 {t("governance.cta.data")}
            </Link>
            <Link href="/api-docs" style={{...styles.button, ...styles.buttonGhost}}>
              🔌 {t("governance.cta.api")}
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
    maxWidth: "900px",
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
  principlesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
  },
  principleCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
    textAlign: "center",
  },
  principleIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  principleTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
    wordWrap: "break-word",
    overflowWrap: "break-word",
    hyphens: "auto",
  },
  principleText: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
  },
  principleLink: {
    color: "#2F81F7",
    textDecoration: "none",
    fontWeight: "700",
  },
  frameworkGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "24px",
    marginBottom: "32px",
  },
  frameworkCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
    textAlign: "center",
  },
  frameworkNumber: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#2F81F7",
    color: "#0B0E11",
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "16px",
  },
  frameworkTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  frameworkText: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
  },
  frameworkNote: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "24px",
  },
  noteText: {
    fontSize: "15px",
    color: "#8B949E",
    lineHeight: "1.6",
    margin: 0,
  },
  independenceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
  },
  independenceCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #D64545",
    borderRadius: "12px",
    padding: "28px",
  },
  independenceTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  independenceText: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
  },
  transparencyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "24px",
  },
  transparencyCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
    textAlign: "center",
  },
  transparencyIcon: {
    fontSize: "40px",
    marginBottom: "16px",
  },
  transparencyTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  transparencyText: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
    marginBottom: "16px",
  },
  transparencyLink: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#2F81F7",
    textDecoration: "none",
  },
  oversightCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "32px",
    marginBottom: "24px",
  },
  oversightTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "24px",
    textAlign: "center",
  },
  oversightGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "24px",
  },
  oversightItem: {
    textAlign: "center",
  },
  oversightIcon: {
    fontSize: "32px",
    color: "#3FB950",
    marginBottom: "12px",
  },
  oversightItemTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "8px",
  },
  oversightItemText: {
    fontSize: "13px",
    color: "#8B949E",
    lineHeight: "1.5",
  },
  oversightNote: {
    fontSize: "14px",
    color: "#8B949E",
    textAlign: "center",
    fontStyle: "italic",
  },
  versionTimeline: {
    display: "grid",
    gap: "20px",
    marginBottom: "32px",
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
  versionText: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
  },
  changelogCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
  },
  changelogTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "16px",
  },
  changelogList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  changelogItem: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
    marginBottom: "12px",
    paddingLeft: "20px",
    position: "relative",
  },
  advisoryCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "32px",
  },
  advisoryTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "24px",
    textAlign: "center",
  },
  advisoryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "24px",
    marginBottom: "24px",
  },
  advisoryItem: {
    textAlign: "center",
  },
  advisoryIcon: {
    fontSize: "40px",
    marginBottom: "12px",
  },
  advisoryText: {
    fontSize: "14px",
    color: "#8B949E",
    fontWeight: "600",
  },
  advisoryNote: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
    padding: "20px",
    backgroundColor: "#0B0E11",
    borderRadius: "8px",
  },
  regulatoryCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "32px",
    marginBottom: "24px",
  },
  regulatoryTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "16px",
  },
  regulatoryText: {
    fontSize: "15px",
    color: "#8B949E",
    lineHeight: "1.6",
    marginBottom: "16px",
  },
  regulatoryList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  regulatoryItem: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
    marginBottom: "12px",
    paddingLeft: "20px",
    position: "relative",
  },
  regulatoryNote: {
    fontSize: "13px",
    color: "#8B949E",
    fontStyle: "italic",
    textAlign: "center",
  },
  policyGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2rem",
    marginBottom: "2rem",
  },
  policyCard: {
    padding: "1.5rem",
    borderRadius: "12px",
    border: "1px solid rgba(0, 212, 194, 0.15)",
    backgroundColor: "rgba(0, 212, 194, 0.05)",
  },
  policyTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "1rem",
  },
  policyList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  policyItem: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
    marginBottom: "0.75rem",
    paddingLeft: "20px",
    position: "relative",
  },
  disputeSection: {
    padding: "1.5rem",
    borderRadius: "12px",
    border: "1px solid rgba(255, 165, 0, 0.15)",
    backgroundColor: "rgba(255, 165, 0, 0.05)",
    marginBottom: "2rem",
  },
  disputeTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#FFD08A",
    marginBottom: "0.75rem",
  },
  disputeText: {
    fontSize: "14px",
    color: "#8B949E",
    marginBottom: "1rem",
  },
  disputeList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  economicNeutralitySection: {
    padding: "1.5rem",
    borderRadius: "12px",
    border: "1px solid rgba(63, 185, 80, 0.15)",
    backgroundColor: "rgba(63, 185, 80, 0.05)",
  },
  economicTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#56D364",
    marginBottom: "0.75rem",
  },
  economicText: {
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
