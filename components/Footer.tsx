import Link from "next/link";
import { useTranslation } from "../lib/useTranslationStub";

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.column}>
            <h4 style={styles.columnTitle}>GTIXT</h4>
            <p style={styles.columnText}>
              The Global Proprietary Trading Index. Institutional benchmark for transparency, integrity, and compliance.
            </p>
          </div>

          <div style={styles.column}>
            <h4 style={styles.columnTitle}>{t("nav.resources")}</h4>
            <nav style={styles.nav}>
              <Link href="/methodology" style={styles.navLink}>
                {t("nav.methodology")}
              </Link>
              <Link href="/api-docs" style={styles.navLink}>
                {t("nav.api")}
              </Link>
              <Link href="/data" style={styles.navLink}>
                {t("nav.data")}
              </Link>
              <Link href="/docs" style={styles.navLink}>
                {t("nav.docs")}
              </Link>
            </nav>
          </div>

          <div style={styles.column}>
            <h4 style={styles.columnTitle}>{t("nav.company")}</h4>
            <nav style={styles.nav}>
              <Link href="/about" style={styles.navLink}>
                {t("nav.about")}
              </Link>
              <Link href="/team" style={styles.navLink}>
                {t("nav.team")}
              </Link>
              <Link href="/careers" style={styles.navLink}>
                {t("nav.careers")}
              </Link>
              <Link href="/blog" style={styles.navLink}>
                {t("nav.blog")}
              </Link>
            </nav>
          </div>

          <div style={styles.column}>
            <h4 style={styles.columnTitle}>{t("nav.legal")}</h4>
            <nav style={styles.nav}>
              <Link href="/privacy" style={styles.navLink}>
                {t("nav.privacy")}
              </Link>
              <Link href="/terms" style={styles.navLink}>
                {t("nav.terms")}
              </Link>
              <Link href="/disclaimer" style={styles.navLink}>
                {t("nav.disclaimer")}
              </Link>
              <Link href="/governance" style={styles.navLink}>
                {t("nav.governance")}
              </Link>
            </nav>
          </div>
        </div>

        <div style={styles.divider} />

        <div style={styles.bottom}>
          <p style={styles.copyright}>
            © {currentYear} GTIXT. All rights reserved.
          </p>
          <div style={styles.socials}>
            <a href="#" style={styles.socialLink} title="Twitter/X">
              𝕏
            </a>
            <a href="#" style={styles.socialLink} title="LinkedIn">
              in
            </a>
            <a href="#" style={styles.socialLink} title="GitHub">
              gh
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    background: "linear-gradient(180deg, rgba(7,11,18,0.5) 0%, rgba(7,11,18,1) 100%)",
    borderTop: "1px solid rgba(0,209,193,0.1)",
    marginTop: "4rem",
    paddingTop: "3rem",
    paddingBottom: "2rem",
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 1rem",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "2rem",
    marginBottom: "2rem",
  },
  column: {
    display: "flex",
    flexDirection: "column",
  },
  columnTitle: {
    fontSize: "0.875rem",
    fontWeight: 700,
    color: "#00D1C1",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "1rem",
  },
  columnText: {
    fontSize: "0.75rem",
    color: "rgba(255,255,255,0.6)",
    lineHeight: 1.6,
    margin: 0,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  navLink: {
    fontSize: "0.75rem",
    color: "rgba(255,255,255,0.6)",
    textDecoration: "none",
    transition: "color 0.2s",
  },
  divider: {
    height: "1px",
    background: "rgba(0,209,193,0.1)",
    margin: "2rem 0",
  },
  bottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.75rem",
    color: "rgba(255,255,255,0.4)",
  },
  copyright: {
    margin: 0,
  },
  socials: {
    display: "flex",
    gap: "1.5rem",
  },
  socialLink: {
    color: "rgba(255,255,255,0.5)",
    textDecoration: "none",
    fontSize: "0.875rem",
    fontWeight: 700,
    transition: "color 0.2s",
  },
};
