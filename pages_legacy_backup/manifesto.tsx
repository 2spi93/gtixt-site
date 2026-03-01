import Head from "next/head";
import { useTranslation } from "../lib/useTranslationStub";
import InstitutionalHeader from "../components/InstitutionalHeader";

export default function Manifesto() {
  const { t } = useTranslation("common");
  return (
    <div style={styles.container}>
      <Head>
        <title>{t("manifesto.meta.title")}</title>
        <meta
          name="description"
          content={t("manifesto.meta.description")}
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <InstitutionalHeader breadcrumbs={[{ label: t("nav.manifesto") || "Manifesto", href: "/manifesto" }]} />

      <div style={styles.pageHeader}>
        <div style={styles.contentContainer}>
          <p style={styles.eyebrow}>{t("manifesto.eyebrow")}</p>
          <h1 style={styles.h1}>{t("manifesto.title")}</h1>
          <p style={styles.lead}>{t("manifesto.lead")}</p>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.contentContainer}>
          <div style={styles.card}>
            <p style={styles.p}>{t("manifesto.section1.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("manifesto.section1.item1")}</li>
              <li style={styles.listItem}>{t("manifesto.section1.item2")}</li>
            </ul>
            <p style={styles.p}>
              {t("manifesto.section1.para2")}
            </p>
            <p style={styles.p}>{t("manifesto.section1.conclusion")}</p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.h2}>{t("manifesto.section2.title")}</h2>
            <p style={styles.p}>{t("manifesto.section2.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("manifesto.section2.item1")}</li>
              <li style={styles.listItem}>{t("manifesto.section2.item2")}</li>
              <li style={styles.listItem}>{t("manifesto.section2.item3")}</li>
              <li style={styles.listItem}>{t("manifesto.section2.item4")}</li>
              <li style={styles.listItem}>{t("manifesto.section2.item5")}</li>
            </ul>
            <p style={styles.p}>{t("manifesto.section2.para2")}</p>
            <p style={styles.p}><strong>👉 {t("manifesto.section2.key")}</strong></p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.h2}>{t("manifesto.section3.title")}</h2>
            <p style={styles.p}>{t("manifesto.section3.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("manifesto.section3.item1")}</li>
              <li style={styles.listItem}>{t("manifesto.section3.item2")}</li>
              <li style={styles.listItem}>{t("manifesto.section3.item3")}</li>
              <li style={styles.listItem}>{t("manifesto.section3.item4")}</li>
            </ul>
            <p style={styles.p}>
              {t("manifesto.section3.para2")}
            </p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.h2}>{t("manifesto.section4.title")}</h2>
            <p style={styles.p}>{t("manifesto.section4.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("manifesto.section4.item1")}</li>
              <li style={styles.listItem}>{t("manifesto.section4.item2")}</li>
              <li style={styles.listItem}>{t("manifesto.section4.item3")}</li>
              <li style={styles.listItem}>{t("manifesto.section4.item4")}</li>
              <li style={styles.listItem}>{t("manifesto.section4.item5")}</li>
            </ul>
            <p style={styles.p}>{t("manifesto.section4.conclusion")}</p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.h2}>{t("manifesto.section5.title")}</h2>
            <div style={styles.quoteBlock}>
              <p style={styles.quoteTitle}>{t("manifesto.section5.principle1.title")}</p>
              <p style={styles.p}>{t("manifesto.section5.principle1.text")}</p>
            </div>
            <div style={styles.quoteBlock}>
              <p style={styles.quoteTitle}>{t("manifesto.section5.principle2.title")}</p>
              <p style={styles.p}>{t("manifesto.section5.principle2.text")}</p>
            </div>
            <div style={styles.quoteBlock}>
              <p style={styles.quoteTitle}>{t("manifesto.section5.principle3.title")}</p>
              <p style={styles.p}>{t("manifesto.section5.principle3.text")}</p>
            </div>
            <div style={styles.quoteBlock}>
              <p style={styles.quoteTitle}>{t("manifesto.section5.principle4.title")}</p>
              <p style={styles.p}>{t("manifesto.section5.principle4.text")}</p>
            </div>
            <div style={styles.quoteBlock}>
              <p style={styles.quoteTitle}>{t("manifesto.section5.principle5.title")}</p>
              <p style={styles.p}>{t("manifesto.section5.principle5.text")}</p>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.h2}>{t("manifesto.section6.title")}</h2>
            <p style={styles.p}>{t("manifesto.section6.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("manifesto.section6.item1")}</li>
              <li style={styles.listItem}>{t("manifesto.section6.item2")}</li>
              <li style={styles.listItem}>{t("manifesto.section6.item3")}</li>
              <li style={styles.listItem}>{t("manifesto.section6.item4")}</li>
            </ul>
            <p style={styles.p}>{t("manifesto.section6.para2")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("manifesto.section6.item5")}</li>
              <li style={styles.listItem}>{t("manifesto.section6.item6")}</li>
              <li style={styles.listItem}>{t("manifesto.section6.item7")}</li>
              <li style={styles.listItem}>{t("manifesto.section6.item8")}</li>
              <li style={styles.listItem}>{t("manifesto.section6.item9")}</li>
            </ul>
            <p style={styles.p}><strong>{t("manifesto.section6.conclusion")}</strong></p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.h2}>{t("manifesto.section7.title")}</h2>
            <p style={styles.p}>{t("manifesto.section7.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("manifesto.section7.item1")}</li>
              <li style={styles.listItem}>{t("manifesto.section7.item2")}</li>
              <li style={styles.listItem}>{t("manifesto.section7.item3")}</li>
              <li style={styles.listItem}>{t("manifesto.section7.item4")}</li>
            </ul>
            <p style={styles.p}>{t("manifesto.section7.conclusion")}</p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.h2}>{t("manifesto.section8.title")}</h2>
            <p style={styles.p}>{t("manifesto.section8.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("manifesto.section8.item1")}</li>
              <li style={styles.listItem}>{t("manifesto.section8.item2")}</li>
              <li style={styles.listItem}>{t("manifesto.section8.item3")}</li>
              <li style={styles.listItem}>{t("manifesto.section8.item4")}</li>
              <li style={styles.listItem}>{t("manifesto.section8.item5")}</li>
            </ul>
            <p style={styles.p}>{t("manifesto.section8.conclusion")}</p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.h2}>{t("manifesto.section9.title")}</h2>
            <p style={styles.p}>{t("manifesto.section9.para1")}</p>
            <p style={styles.p}>{t("manifesto.section9.para2")}</p>
            <p style={styles.p}><strong>{t("manifesto.section9.conclusion")}</strong></p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.h2}>{t("manifesto.section10.title")}</h2>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("manifesto.section10.principle1")}</li>
              <li style={styles.listItem}>{t("manifesto.section10.principle2")}</li>
              <li style={styles.listItem}>{t("manifesto.section10.principle3")}</li>
              <li style={styles.listItem}>{t("manifesto.section10.principle4")}</li>
              <li style={styles.listItem}>{t("manifesto.section10.principle5")}</li>
            </ul>
          </div>

          <div style={styles.footerNote}>
            {t("manifesto.footerNote")}
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
  list: {
    margin: 0,
    paddingLeft: "1.2rem",
    display: "grid",
    gap: "0.5rem",
  },
  listItem: {
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 1.6,
  },
  quoteBlock: {
    borderLeft: "3px solid rgba(0, 209, 193, 0.6)",
    paddingLeft: "1rem",
    marginBottom: "1rem",
  },
  quoteTitle: {
    margin: "0 0 0.35rem 0",
    fontWeight: 600,
    color: "#FFFFFF",
  },
  footerNote: {
    marginTop: "2rem",
    paddingTop: "1.5rem",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    color: "rgba(255, 255, 255, 0.7)",
    fontStyle: "italic",
  },
};
