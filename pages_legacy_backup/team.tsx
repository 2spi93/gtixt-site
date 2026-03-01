import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "../lib/useTranslationStub";
import InstitutionalHeader from "../components/InstitutionalHeader";

export default function Team() {
  const { t } = useTranslation("common");

  return (
    <>
      <Head>
        <title>{t("team.meta.title")}</title>
        <meta name="description" content={t("team.meta.description")} />
      </Head>

      <InstitutionalHeader breadcrumbs={[{ label: t("nav.team"), href: "/team" }]} />

      <div style={styles.container}>
        <section style={styles.hero}>
          <div style={styles.eyebrow}>{t("team.eyebrow")}</div>
          <h1 style={styles.h1}>{t("team.title")}</h1>
          <p style={styles.lead}>{t("team.lead")}</p>
        </section>

        {/* Governance Structure */}
        <section style={styles.card}>
          <h2 style={styles.h2}>{t("team.governance.title")}</h2>
          <p style={styles.p}>{t("team.governance.intro")}</p>

          <div style={styles.govGrid}>
            <div style={styles.govBox}>
              <h3 style={styles.h3}>{t("team.governance.board.title")}</h3>
              <p style={styles.p}>{t("team.governance.board.description")}</p>
            </div>

            <div style={styles.govBox}>
              <h3 style={styles.h3}>{t("team.governance.methodology.title")}</h3>
              <p style={styles.p}>{t("team.governance.methodology.description")}</p>
            </div>

            <div style={styles.govBox}>
              <h3 style={styles.h3}>{t("team.governance.quality.title")}</h3>
              <p style={styles.p}>{t("team.governance.quality.description")}</p>
            </div>

            <div style={styles.govBox}>
              <h3 style={styles.h3}>{t("team.governance.dataIntegrity.title")}</h3>
              <p style={styles.p}>{t("team.governance.dataIntegrity.description")}</p>
            </div>
          </div>
        </section>

        {/* Core Team */}
        <section style={styles.card}>
          <h2 style={styles.h2}>{t("team.coreTeam.title")}</h2>

          <div style={styles.teamGrid}>
            <div style={styles.member}>
              <div style={styles.memberTitle}>Executive Director</div>
              <div style={styles.memberName}>{t("team.coreTeam.member1.name")}</div>
              <div style={styles.memberBio}>
                Oversees GTIXT operations, governance alignment, and institutional partnerships. Ensures compliance with benchmark provider standards.
              </div>
            </div>

            <div style={styles.member}>
              <div style={styles.memberTitle}>Head of Methodology</div>
              <div style={styles.memberName}>{t("team.coreTeam.member2.name")}</div>
              <div style={styles.memberBio}>
                Leads maintenance of the seven-pillar framework. Manages confidence scoring, jurisdiction tiers, and deterministic computation standards.
              </div>
            </div>

            <div style={styles.member}>
              <div style={styles.memberTitle}>{t("team.coreTeam.member3.title")}</div>
              <div style={styles.memberName}>{t("team.coreTeam.member3.name")}</div>
              <div style={styles.memberBio}>
                Oversees snapshot generation, cryptographic verification, API operations, and immutable data infrastructure.
              </div>
            </div>

            <div style={styles.member}>
              <div style={styles.memberTitle}>Head of Research</div>
              <div style={styles.memberName}>{t("team.coreTeam.member4.name")}</div>
              <div style={styles.memberBio}>
                Conducts independent research on prop trading transparency trends. Publishes quarterly analysis and methodology insights.
              </div>
            </div>
          </div>
        </section>

        {/* Advisory Board */}
        <section style={styles.card}>
          <h2 style={styles.h2}>{t("team.advisory.title")}</h2>
          <p style={styles.p}>{t("team.advisory.intro")}</p>

          <div style={styles.advisorGrid}>
            <div style={styles.advisor}>
              <div style={styles.advisorDomain}>{t("team.advisory.trading.domain")}</div>
              <p style={styles.p}>{t("team.advisory.trading.description")}</p>
            </div>

            <div style={styles.advisor}>
              <div style={styles.advisorDomain}>{t("team.advisory.compliance.domain")}</div>
              <p style={styles.p}>{t("team.advisory.compliance.description")}</p>
            </div>

            <div style={styles.advisor}>
              <div style={styles.advisorDomain}>{t("team.advisory.technology.domain")}</div>
              <p style={styles.p}>{t("team.advisory.technology.description")}</p>
            </div>

            <div style={styles.advisor}>
              <div style={styles.advisorDomain}>{t("team.advisory.finance.domain")}</div>
              <p style={styles.p}>{t("team.advisory.finance.description")}</p>
            </div>
          </div>
        </section>

        {/* Institutional Commitments */}
        <section style={styles.card}>
          <h2 style={styles.h2}>{t("team.commitments.title")}</h2>

          <div style={styles.commitmentGrid}>
            <div style={styles.commitment}>
              <div style={styles.commitmentIcon}>✓</div>
              <h3 style={styles.h3}>{t("team.commitments.rigor.title")}</h3>
              <p style={styles.p}>{t("team.commitments.rigor.description")}</p>
            </div>

            <div style={styles.commitment}>
              <div style={styles.commitmentIcon}>✓</div>
              <h3 style={styles.h3}>{t("team.commitments.independence.title")}</h3>
              <p style={styles.p}>{t("team.commitments.independence.description")}</p>
            </div>

            <div style={styles.commitment}>
              <div style={styles.commitmentIcon}>✓</div>
              <h3 style={styles.h3}>{t("team.commitments.transparency.title")}</h3>
              <p style={styles.p}>{t("team.commitments.transparency.description")}</p>
            </div>

            <div style={styles.commitment}>
              <div style={styles.commitmentIcon}>✓</div>
              <h3 style={styles.h3}>{t("team.commitments.immutability.title")}</h3>
              <p style={styles.p}>{t("team.commitments.immutability.description")}</p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section style={styles.card}>
          <h2 style={styles.h2}>{t("team.contact.title")}</h2>
          <p style={styles.p}>{t("team.contact.description")}</p>
          <Link href="/contact" style={{ ...styles.btn, ...styles.btnPrimary }}>
            {t("team.contact.button")}
          </Link>
        </section>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "2rem 1rem",
  },
  hero: {
    marginBottom: "3rem",
  },
  eyebrow: {
    fontSize: "0.75rem",
    color: "#00D1C1",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "0.5rem",
  },
  h1: {
    fontSize: "2.5rem",
    color: "#FFFFFF",
    marginBottom: "1rem",
    fontWeight: 700,
    letterSpacing: "-0.01em",
  },
  lead: {
    fontSize: "1rem",
    color: "rgba(255, 255, 255, 0.8)",
    maxWidth: "60ch",
    lineHeight: 1.6,
  },
  card: {
    padding: "2rem",
    marginBottom: "2rem",
    background: "rgba(0, 209, 193, 0.05)",
    borderRadius: "12px",
    border: "1px solid rgba(0, 209, 193, 0.2)",
  },
  h2: {
    fontSize: "1.5rem",
    color: "#FFFFFF",
    marginBottom: "1rem",
    fontWeight: 700,
  },
  h3: {
    fontSize: "1.1rem",
    color: "#FFFFFF",
    marginBottom: "0.5rem",
    fontWeight: 700,
  },
  p: {
    fontSize: "0.875rem",
    color: "rgba(255, 255, 255, 0.7)",
    lineHeight: 1.6,
    marginBottom: "1rem",
  },
  govGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.5rem",
  },
  govBox: {
    padding: "1.5rem",
    background: "rgba(7, 11, 18, 0.5)",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  teamGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.5rem",
  },
  member: {
    padding: "1.5rem",
    background: "rgba(7, 11, 18, 0.5)",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  memberTitle: {
    fontSize: "0.7rem",
    color: "#00D1C1",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "0.5rem",
  },
  memberName: {
    fontSize: "1.1rem",
    color: "#FFFFFF",
    fontWeight: 700,
    marginBottom: "0.75rem",
  },
  memberBio: {
    fontSize: "0.875rem",
    color: "rgba(255, 255, 255, 0.7)",
    lineHeight: 1.5,
  },
  advisorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.5rem",
  },
  advisor: {
    padding: "1.5rem",
    background: "rgba(7, 11, 18, 0.5)",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  advisorDomain: {
    fontSize: "0.9rem",
    color: "#00D1C1",
    fontWeight: 700,
    marginBottom: "0.75rem",
  },
  commitmentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.5rem",
  },
  commitment: {
    padding: "1.5rem",
    background: "rgba(7, 11, 18, 0.5)",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  commitmentIcon: {
    fontSize: "1.5rem",
    color: "#00D1C1",
    marginBottom: "0.5rem",
  },
  btn: {
    display: "inline-block",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 700,
    textDecoration: "none",
    cursor: "pointer",
    border: "none",
    transition: "all 0.2s",
  },
  btnPrimary: {
    background: "#00D1C1",
    color: "#070B12",
  },
};
