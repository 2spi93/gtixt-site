import Head from "next/head";
import { useTranslation } from "../lib/useTranslationStub";
import InstitutionalHeader from "../components/InstitutionalHeader";

export default function Ethics() {
  const { t } = useTranslation("common");
  return (
    <div style={styles.container}>
      <Head>
        <title>{t("ethics.meta.title")}</title>
        <meta
          name="description"
          content={t("ethics.meta.description")}
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <InstitutionalHeader breadcrumbs={[{ label: t("ethics.breadcrumb"), href: "/ethics" }]} />

      <div style={styles.pageHeader}>
        <div style={styles.contentContainer}>
          <p style={styles.eyebrow}>{t("ethics.eyebrow")}</p>
          <h1 style={styles.h1}>{t("ethics.title")}</h1>
          <p style={styles.lead}>
            {t("ethics.lead")}
          </p>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.contentContainer}>
          <div style={styles.card}>
            <h2 style={styles.h2}>{t("ethics.section1.title")}</h2>
            <p style={styles.p}>
              {t("ethics.section1.text")}
            </p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.h2}>{t("ethics.section2.title")}</h2>
            <p style={styles.p}>
              {t("ethics.section2.text")}
            </p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.h2}>{t("ethics.section3.title")}</h2>
            <p style={styles.p}>
              {t("ethics.section3.text")}
            </p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.h2}>{t("ethics.section4.title")}</h2>
            <p style={styles.p}>
              {t("ethics.section4.text")}
            </p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.h2}>{t("ethics.section5.title")}</h2>
            <p style={styles.p}>
              {t("ethics.section5.text")}
            </p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.h2}>{t("ethics.section6.title")}</h2>
            <p style={styles.p}>
              {t("ethics.section6.text")}
            </p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.h2}>{t("ethics.section7.title")}</h2>
            <p style={styles.p}>
              {t("ethics.section7.text")}
            </p>
          </div>

          <div style={styles.footerNote}>
            {t("ethics.footerNote")}
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
    maxWidth: "1100px",
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
  h2: {
    margin: "0 0 0.75rem 0",
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#FFFFFF",
  },
  lead: {
    margin: 0,
    fontSize: "1.125rem",
    lineHeight: 1.6,
    color: "rgba(255, 255, 255, 0.75)",
    maxWidth: "800px",
  },
  content: {
    padding: "4rem 0",
  },
  card: {
    background: "rgba(0, 209, 193, 0.05)",
    border: "1px solid rgba(0, 209, 193, 0.2)",
    borderRadius: "0.5rem",
    padding: "2rem",
    marginBottom: "2rem",
  },
  p: {
    margin: "0 0 1rem 0",
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 1.6,
  },
  footerNote: {
    marginTop: "2rem",
    paddingTop: "1.5rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    color: "rgba(255, 255, 255, 0.7)",
    fontStyle: "italic",
  },
};
