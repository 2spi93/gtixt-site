import Head from "next/head";
import Link from "next/link";
import InstitutionalHeader from "../components/InstitutionalHeader";
import Footer from "../components/Footer";
import { useIsMounted } from "../lib/useIsMounted";
import { useTranslation } from "../lib/useTranslationStub";

export default function AboutPage() {
  const isMounted = useIsMounted();
  const { t } = useTranslation("common");

  return (
    <>
      <Head>
        <title>{t("about.metaTitle")}</title>
        <meta
          name="description"
          content={t("about.metaDescription")}
        />
      </Head>

      <InstitutionalHeader
        breadcrumbs={isMounted ? [{ label: t("about.breadcrumb"), href: "/about" }] : []}
      />

      <main style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.eyebrow}>{t("about.eyebrow")}</div>
          <h1 style={styles.h1}>{t("about.title")}</h1>
          <p style={styles.lead}>{t("about.lead")}</p>
        </section>

        {/* Why GTIXT Exists */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("about.why.title")}</h2>
          <p style={styles.sectionLead}>{t("about.why.lead")}</p>

          <div style={styles.whyContent}>
            <div style={styles.whyCard}>
              <h4 style={styles.whyTitle}>{t("about.why.cards.untilRecently.title")}</h4>
              <p style={styles.whyText}>{t("about.why.cards.untilRecently.text")}</p>
            </div>
            <div style={styles.whyCard}>
              <h4 style={styles.whyTitle}>{t("about.why.cards.transforms.title")}</h4>
              <p style={styles.whyText}>{t("about.why.cards.transforms.text")}</p>
            </div>
          </div>
        </section>

        {/* System, Not Personality */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("about.system.title")}</h2>
          <p style={styles.sectionLead}>{t("about.system.lead")}</p>

          <div style={styles.isIsNotGrid}>
            <div style={styles.isCard}>
              <h3 style={styles.isTitle}>{t("about.system.decisions.title")}</h3>
              <div style={styles.isList}>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✓</span>
                  <span>{t("about.system.decisions.items.deterministic")}</span>
                </div>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✓</span>
                  <span>{t("about.system.decisions.items.versioned")}</span>
                </div>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✓</span>
                  <span>{t("about.system.decisions.items.integrityGates")}</span>
                </div>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✓</span>
                  <span>{t("about.system.decisions.items.auditTrails")}</span>
                </div>
              </div>
            </div>

            <div style={styles.isNotCard}>
              <h3 style={styles.isTitle}>{t("about.system.never.title")}</h3>
              <div style={styles.isList}>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✗</span>
                  <span>{t("about.system.never.items.personalOpinions")}</span>
                </div>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✗</span>
                  <span>{t("about.system.never.items.discretionary")}</span>
                </div>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✗</span>
                  <span>{t("about.system.never.items.political")}</span>
                </div>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✗</span>
                  <span>{t("about.system.never.items.commercial")}</span>
                </div>
              </div>
            </div>
          </div>

          <p style={{...styles.sectionLead, marginTop: "2rem", fontStyle: "italic"}}>
            {t("about.system.note")}
          </p>
        </section>

        {/* What GTIXT Is / Isn't */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("about.isIsNot.title")}</h2>
          <div style={styles.isIsNotGrid}>
            <div style={styles.isCard}>
              <h3 style={styles.isTitle}>{t("about.isIsNot.is.title")}</h3>
              <div style={styles.isList}>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✓</span>
                  <span>{t("about.isIsNot.is.items.benchmark")}</span>
                </div>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✓</span>
                  <span>{t("about.isIsNot.is.items.infrastructure")}</span>
                </div>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✓</span>
                  <span>{t("about.isIsNot.is.items.transparency")}</span>
                </div>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✓</span>
                  <span>{t("about.isIsNot.is.items.reference")}</span>
                </div>
              </div>
            </div>

            <div style={styles.isNotCard}>
              <h3 style={styles.isTitle}>{t("about.isIsNot.isNot.title")}</h3>
              <div style={styles.isList}>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✗</span>
                  <span>{t("about.isIsNot.isNot.items.investmentAdvisor")}</span>
                </div>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✗</span>
                  <span>{t("about.isIsNot.isNot.items.signalService")}</span>
                </div>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✗</span>
                  <span>{t("about.isIsNot.isNot.items.endorsement")}</span>
                </div>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✗</span>
                  <span>{t("about.isIsNot.isNot.items.discretionary")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Founder-light, System-first */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("about.founder.title")}</h2>
          <p style={styles.sectionLead}>{t("about.founder.lead")}</p>
          <div style={styles.isIsNotGrid}>
            <div style={styles.isCard}>
              <h3 style={styles.isTitle}>{t("about.founder.publish.title")}</h3>
              <div style={styles.isList}>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✓</span>
                  <span>{t("about.founder.publish.items.methodology")}</span>
                </div>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✓</span>
                  <span>{t("about.founder.publish.items.architecture")}</span>
                </div>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✓</span>
                  <span>{t("about.founder.publish.items.snapshots")}</span>
                </div>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✓</span>
                  <span>{t("about.founder.publish.items.governance")}</span>
                </div>
              </div>
            </div>

            <div style={styles.isNotCard}>
              <h3 style={styles.isTitle}>{t("about.founder.notEmphasize.title")}</h3>
              <div style={styles.isList}>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✗</span>
                  <span>{t("about.founder.notEmphasize.items.founderIdentities")}</span>
                </div>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✗</span>
                  <span>{t("about.founder.notEmphasize.items.personalOpinions")}</span>
                </div>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✗</span>
                  <span>{t("about.founder.notEmphasize.items.unverifiable")}</span>
                </div>
                <div style={styles.isItem}>
                  <span style={styles.isIcon}>✗</span>
                  <span>{t("about.founder.notEmphasize.items.trustMe")}</span>
                </div>
              </div>
            </div>
          </div>
          <p style={styles.sectionLead}>
            {t("about.founder.note")}
          </p>
        </section>

        {/* How GTIXT Works */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("about.how.title")}</h2>
          <p style={styles.sectionLead}>{t("about.how.lead")}</p>

          <div style={styles.pipeline}>
            <div style={styles.pipelineStage}>
              <div style={styles.pipelineNumber}>1</div>
              <h4 style={styles.pipelineTitle}>{t("about.how.steps.crawl.title")}</h4>
              <p style={styles.pipelineDesc}>{t("about.how.steps.crawl.text")}</p>
            </div>

            <div style={styles.pipelineArrow}>→</div>

            <div style={styles.pipelineStage}>
              <div style={styles.pipelineNumber}>2</div>
              <h4 style={styles.pipelineTitle}>{t("about.how.steps.validate.title")}</h4>
              <p style={styles.pipelineDesc}>{t("about.how.steps.validate.text")}</p>
            </div>

            <div style={styles.pipelineArrow}>→</div>

            <div style={styles.pipelineStage}>
              <div style={styles.pipelineNumber}>3</div>
              <h4 style={styles.pipelineTitle}>{t("about.how.steps.score.title")}</h4>
              <p style={styles.pipelineDesc}>{t("about.how.steps.score.text")}</p>
            </div>

            <div style={styles.pipelineArrow}>→</div>

            <div style={styles.pipelineStage}>
              <div style={styles.pipelineNumber}>4</div>
              <h4 style={styles.pipelineTitle}>{t("about.how.steps.gate.title")}</h4>
              <p style={styles.pipelineDesc}>{t("about.how.steps.gate.text")}</p>
            </div>

            <div style={styles.pipelineArrow}>→</div>

            <div style={styles.pipelineStage}>
              <div style={styles.pipelineNumber}>5</div>
              <h4 style={styles.pipelineTitle}>{t("about.how.steps.publish.title")}</h4>
              <p style={styles.pipelineDesc}>{t("about.how.steps.publish.text")}</p>
            </div>

            <div style={styles.pipelineArrow}>→</div>

            <div style={styles.pipelineStage}>
              <div style={styles.pipelineNumber}>6</div>
              <h4 style={styles.pipelineTitle}>{t("about.how.steps.integrityBeacon.title")}</h4>
              <p style={styles.pipelineDesc}>{t("about.how.steps.integrityBeacon.text")}</p>
            </div>
          </div>
        </section>

        {/* The 5 Pillars */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("about.pillars.title")}</h2>
          <p style={styles.sectionLead}>{t("about.pillars.lead")}</p>

          <div style={styles.pillarsGrid}>
            <div style={styles.pillarCard}>
              <h4 style={styles.pillarTitle}>{t("about.pillars.cards.transparency.title")}</h4>
              <p style={styles.pillarDesc}>{t("about.pillars.cards.transparency.text")}</p>
            </div>
            <div style={styles.pillarCard}>
              <h4 style={styles.pillarTitle}>{t("about.pillars.cards.payout.title")}</h4>
              <p style={styles.pillarDesc}>{t("about.pillars.cards.payout.text")}</p>
            </div>
            <div style={styles.pillarCard}>
              <h4 style={styles.pillarTitle}>{t("about.pillars.cards.risk.title")}</h4>
              <p style={styles.pillarDesc}>{t("about.pillars.cards.risk.text")}</p>
            </div>
            <div style={styles.pillarCard}>
              <h4 style={styles.pillarTitle}>{t("about.pillars.cards.legal.title")}</h4>
              <p style={styles.pillarDesc}>{t("about.pillars.cards.legal.text")}</p>
            </div>
            <div style={styles.pillarCard}>
              <h4 style={styles.pillarTitle}>{t("about.pillars.cards.reputation.title")}</h4>
              <p style={styles.pillarDesc}>{t("about.pillars.cards.reputation.text")}</p>
            </div>
          </div>

          <div style={styles.formulaBox}>
            <p style={styles.formulaLabel}>{t("about.pillars.formulaLabel")}</p>
            <code style={styles.formula}>
              (T × 0.25) + (P × 0.25) + (R × 0.20) + (L × 0.20) + (S × 0.10)
            </code>
          </div>
        </section>

        {/* Governance */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("about.governance.title")}</h2>
          <p style={styles.sectionLead}>{t("about.governance.lead")}</p>

          <div style={styles.govGrid}>
            <div style={styles.govCard}>
              <h4 style={styles.govTitle}>{t("about.governance.cards.noCommercial.title")}</h4>
              <p style={styles.govDesc}>{t("about.governance.cards.noCommercial.text")}</p>
            </div>
            <div style={styles.govCard}>
              <h4 style={styles.govTitle}>{t("about.governance.cards.noOverrides.title")}</h4>
              <p style={styles.govDesc}>{t("about.governance.cards.noOverrides.text")}</p>
            </div>
            <div style={styles.govCard}>
              <h4 style={styles.govTitle}>{t("about.governance.cards.auditable.title")}</h4>
              <p style={styles.govDesc}>{t("about.governance.cards.auditable.text")}</p>
            </div>
            <div style={styles.govCard}>
              <h4 style={styles.govTitle}>{t("about.governance.cards.transparency.title")}</h4>
              <p style={styles.govDesc}>{t("about.governance.cards.transparency.text")}</p>
            </div>
          </div>
          <div style={styles.isList}>
            <div style={styles.isItem}>
              <span style={styles.isIcon}>✓</span>
              <span>{t("about.governance.list.methodologyCommittee")}</span>
            </div>
            <div style={styles.isItem}>
              <span style={styles.isIcon}>✓</span>
              <span>{t("about.governance.list.integrityGate")}</span>
            </div>
            <div style={styles.isItem}>
              <span style={styles.isIcon}>✓</span>
              <span>{t("about.governance.list.changeLog")}</span>
            </div>
            <div style={styles.isItem}>
              <span style={styles.isIcon}>✓</span>
              <span>{t("about.governance.list.advisory")}</span>
            </div>
          </div>
        </section>

        {/* For Whom */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("about.forWhom.title")}</h2>
          <p style={styles.sectionLead}>{t("about.forWhom.lead")}</p>

          <div style={styles.forWhomGrid}>
            <div style={styles.forWhomCard}>
              <div style={styles.forWhomIcon}>💱</div>
              <h4 style={styles.forWhomTitle}>{t("about.forWhom.cards.traders.title")}</h4>
              <p style={styles.forWhomText}>{t("about.forWhom.cards.traders.text")}</p>
            </div>
            <div style={styles.forWhomCard}>
              <div style={styles.forWhomIcon}>🏛️</div>
              <h4 style={styles.forWhomTitle}>{t("about.forWhom.cards.institutions.title")}</h4>
              <p style={styles.forWhomText}>{t("about.forWhom.cards.institutions.text")}</p>
            </div>
            <div style={styles.forWhomCard}>
              <div style={styles.forWhomIcon}>📊</div>
              <h4 style={styles.forWhomTitle}>{t("about.forWhom.cards.regulators.title")}</h4>
              <p style={styles.forWhomText}>{t("about.forWhom.cards.regulators.text")}</p>
            </div>
            <div style={styles.forWhomCard}>
              <div style={styles.forWhomIcon}>🔍</div>
              <h4 style={styles.forWhomTitle}>{t("about.forWhom.cards.analysts.title")}</h4>
              <p style={styles.forWhomText}>{t("about.forWhom.cards.analysts.text")}</p>
            </div>
          </div>
        </section>

        {/* Key Pages */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("about.keyPages.title")}</h2>
          <p style={styles.sectionLead}>{t("about.keyPages.lead")}</p>

          <div style={styles.keyPagesGrid}>
            <Link href="/methodology" style={styles.keyPageCard}>
              <div style={styles.keyPageIcon}>📚</div>
              <h4 style={styles.keyPageTitle}>{t("about.keyPages.cards.methodology.title")}</h4>
              <p style={styles.keyPageDesc}>{t("about.keyPages.cards.methodology.text")}</p>
            </Link>

            <Link href="/integrity" style={styles.keyPageCard}>
              <div style={styles.keyPageIcon}>🔐</div>
              <h4 style={styles.keyPageTitle}>{t("about.keyPages.cards.integrity.title")}</h4>
              <p style={styles.keyPageDesc}>{t("about.keyPages.cards.integrity.text")}</p>
            </Link>

            <Link href="/governance" style={styles.keyPageCard}>
              <div style={styles.keyPageIcon}>⚖️</div>
              <h4 style={styles.keyPageTitle}>{t("about.keyPages.cards.governance.title")}</h4>
              <p style={styles.keyPageDesc}>{t("about.keyPages.cards.governance.text")}</p>
            </Link>

            <Link href="/whitepaper" style={styles.keyPageCard}>
              <div style={styles.keyPageIcon}>📄</div>
              <h4 style={styles.keyPageTitle}>{t("about.keyPages.cards.whitepaper.title")}</h4>
              <p style={styles.keyPageDesc}>{t("about.keyPages.cards.whitepaper.text")}</p>
            </Link>

            <Link href="/api-docs" style={styles.keyPageCard}>
              <div style={styles.keyPageIcon}>🔌</div>
              <h4 style={styles.keyPageTitle}>{t("about.keyPages.cards.api.title")}</h4>
              <p style={styles.keyPageDesc}>{t("about.keyPages.cards.api.text")}</p>
            </Link>

            <Link href="/roadmap" style={styles.keyPageCard}>
              <div style={styles.keyPageIcon}>🎯</div>
              <h4 style={styles.keyPageTitle}>{t("about.keyPages.cards.roadmap.title")}</h4>
              <p style={styles.keyPageDesc}>{t("about.keyPages.cards.roadmap.text")}</p>
            </Link>
          </div>
        </section>

        {/* Closing Statement */}
        <section style={styles.closingSection}>
          <h3 style={styles.closingTitle}>{t("about.closing.title")}</h3>
          <p style={styles.closingText}>{t("about.closing.text1")}</p>
          <p style={styles.closingText}>{t("about.closing.text2")}</p>
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
  hero: {
    backgroundColor: "#11161C",
    padding: "80px 20px",
    borderBottom: "1px solid #2F81F7",
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
    marginBottom: "12px",
    lineHeight: "1.1",
  },
  heroSubtitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#2F81F7",
    marginBottom: "20px",
  },
  lead: {
    fontSize: "16px",
    color: "#8B949E",
    lineHeight: "1.6",
    marginBottom: "0",
    maxWidth: "900px",
    margin: "0 auto",
  },
  section: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "60px 20px",
    borderBottom: "1px solid #2F81F7",
  },
  h2: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "16px",
    lineHeight: "1.2",
  },
  sectionLead: {
    fontSize: "15px",
    color: "#8B949E",
    lineHeight: "1.7",
    marginBottom: "32px",
  },
  mvvGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
    marginTop: "24px",
  },
  mvvCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "32px",
    textAlign: "center",
  },
  mvvIcon: {
    fontSize: "40px",
    marginBottom: "16px",
  },
  mvvTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  mvvText: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.7",
  },
  whyContent: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
    marginTop: "24px",
  },
  whyCard: {
    backgroundColor: "#1E2630",
    border: "1px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
  },
  whyTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#2F81F7",
    marginBottom: "12px",
  },
  whyText: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.7",
    margin: "0",
  },
  isIsNotGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "24px",
    marginTop: "24px",
  },
  isCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #3FB950",
    borderRadius: "12px",
    padding: "28px",
  },
  isNotCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #D64545",
    borderRadius: "12px",
    padding: "28px",
  },
  isTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "20px",
  },
  isList: {
    display: "grid",
    gap: "12px",
  },
  isItem: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    fontSize: "14px",
    color: "#8B949E",
  },
  isIcon: {
    fontSize: "16px",
    fontWeight: "700",
    flexShrink: 0,
  },
  pipeline: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    justifyContent: "center",
    alignItems: "stretch",
    marginTop: "32px",
    padding: "24px",
    backgroundColor: "#1E2630",
    borderRadius: "12px",
    border: "1px solid #2F81F7",
  },
  pipelineStage: {
    flex: "0 1 140px",
    backgroundColor: "#0B0E11",
    border: "2px solid #2F81F7",
    borderRadius: "8px",
    padding: "16px",
    textAlign: "center",
  },
  pipelineNumber: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#2F81F7",
    marginBottom: "8px",
  },
  pipelineTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "8px",
  },
  pipelineDesc: {
    fontSize: "12px",
    color: "#8B949E",
    lineHeight: "1.4",
    margin: "0",
  },
  pipelineArrow: {
    fontSize: "20px",
    color: "#2F81F7",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
  },
  pillarsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginTop: "24px",
    marginBottom: "32px",
  },
  pillarCard: {
    backgroundColor: "#1E2630",
    border: "1px solid #2F81F7",
    borderRadius: "8px",
    padding: "20px",
  },
  pillarTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#2F81F7",
    marginBottom: "8px",
  },
  pillarDesc: {
    fontSize: "13px",
    color: "#8B949E",
    lineHeight: "1.6",
    margin: "0",
  },
  formulaBox: {
    backgroundColor: "#0B0E11",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "24px",
    textAlign: "center",
  },
  formulaLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#8B949E",
    marginBottom: "8px",
  },
  formula: {
    fontFamily: "monospace",
    fontSize: "16px",
    color: "#C9D1D9",
    lineHeight: "1.8",
  },
  govGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
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
    fontSize: "16px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  govDesc: {
    fontSize: "13px",
    color: "#8B949E",
    lineHeight: "1.7",
    margin: "0",
  },
  forWhomGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "24px",
    marginTop: "24px",
  },
  forWhomCard: {
    backgroundColor: "#1E2630",
    border: "1px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
    textAlign: "center",
  },
  forWhomIcon: {
    fontSize: "32px",
    marginBottom: "12px",
  },
  forWhomTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  forWhomText: {
    fontSize: "13px",
    color: "#8B949E",
    lineHeight: "1.6",
    margin: "0",
  },
  keyPagesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
    marginTop: "24px",
  },
  keyPageCard: {
    backgroundColor: "#1E2630",
    border: "1px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
    textDecoration: "none",
    color: "#C9D1D9",
    transition: "all 0.2s ease",
  },
  keyPageIcon: {
    fontSize: "32px",
    marginBottom: "12px",
  },
  keyPageTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "8px",
  },
  keyPageDesc: {
    fontSize: "13px",
    color: "#8B949E",
    lineHeight: "1.6",
    margin: "0",
  },
  closingSection: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "60px 20px",
    backgroundColor: "#1E2630",
    borderRadius: "16px",
    border: "2px solid #2F81F7",
    textAlign: "center",
  },
  closingTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "20px",
  },
  closingText: {
    fontSize: "16px",
    color: "#8B949E",
    lineHeight: "1.8",
    marginBottom: "16px",
  },
};
