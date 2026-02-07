import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "../lib/useTranslationStub";
import InstitutionalHeader from "../components/InstitutionalHeader";

export default function Disclaimer() {
  const { t } = useTranslation("common");

  return (
    <>
      <Head>
        <title>{t("disclaimer.meta.title")}</title>
        <meta name="description" content={t("disclaimer.meta.description")} />
      </Head>

      <InstitutionalHeader breadcrumbs={[{ label: t("nav.disclaimer") || "Disclaimer", href: "/disclaimer" }]} />

      <div style={styles.container}>
        <section style={styles.hero}>
          <div style={styles.eyebrow}>{t("disclaimer.eyebrow")}</div>
          <h1 style={styles.h1}>{t("disclaimer.title")}</h1>
          <p style={styles.lead}>
            {t("disclaimer.lead")}
          </p>
        </section>

        <div style={styles.content}>
          <section style={styles.section}>
            <h2 style={styles.h2}>{t("disclaimer.section1.title")}</h2>
            <p style={styles.p}>{t("disclaimer.section1.para1")}</p>
            <p style={styles.p}>{t("disclaimer.section1.para2")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("disclaimer.section2.title")}</h2>
            <p style={styles.p}>{t("disclaimer.section2.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>
                <strong>{t("disclaimer.section2.item1.title")}:</strong> {t("disclaimer.section2.item1.text")}
              </li>
              <li style={styles.listItem}>
                <strong>{t("disclaimer.section2.item2.title")}:</strong> {t("disclaimer.section2.item2.text")}
              </li>
              <li style={styles.listItem}>
                <strong>{t("disclaimer.section2.item3.title")}:</strong> {t("disclaimer.section2.item3.text")}
              </li>
              <li style={styles.listItem}>
                <strong>{t("disclaimer.section2.item4.title")}:</strong> {t("disclaimer.section2.item4.text")}
              </li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("disclaimer.section3.title")}</h2>
            <p style={styles.p}>{t("disclaimer.section3.para1")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("disclaimer.section4.title")}</h2>
            <p style={styles.p}>{t("disclaimer.section4.para1")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("disclaimer.section5.title")}</h2>
            <p style={styles.p}>{t("disclaimer.section5.para1")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("disclaimer.section6.title")}</h2>
            <p style={styles.p}>{t("disclaimer.section6.para1")}</p>
            <p style={styles.p}>{t("disclaimer.section6.para2")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("disclaimer.section7.title")}</h2>
            <p style={styles.p}>{t("disclaimer.section7.para1")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("disclaimer.section8.title")}</h2>
            <p style={styles.p}>{t("disclaimer.section8.para1")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("disclaimer.section9.title")}</h2>
            <p style={styles.p}>{t("disclaimer.section9.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("disclaimer.section9.item1")}</li>
              <li style={styles.listItem}>{t("disclaimer.section9.item2")}</li>
              <li style={styles.listItem}>{t("disclaimer.section9.item3")}</li>
              <li style={styles.listItem}>{t("disclaimer.section9.item4")}</li>
              <li style={styles.listItem}>{t("disclaimer.section9.item5")}</li>
            </ul>
            <p style={styles.p}>{t("disclaimer.section9.note")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("disclaimer.section10.title")}</h2>
            <p style={styles.p}>{t("disclaimer.section10.para1")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("disclaimer.section11.title")}</h2>
            <p style={styles.p}>{t("disclaimer.section11.para1")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("disclaimer.section12.title")}</h2>
            <p style={styles.p}>{t("disclaimer.section12.para1")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("disclaimer.section13.title")}</h2>
            <p style={styles.p}>{t("disclaimer.section13.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("disclaimer.section13.item1")} <Link href="/methodology" style={styles.link}>{t("disclaimer.section13.methodologyLink")}</Link> {t("disclaimer.section13.page")}</li>
              <li style={styles.listItem}>{t("disclaimer.section13.item2")} <Link href="/terms" style={styles.link}>{t("disclaimer.section13.termsLink")}</Link></li>
              <li style={styles.listItem}>{t("disclaimer.section13.item3")}: <a href="mailto:legal@contact.gtixt.com" style={styles.link}>legal@contact.gtixt.com</a></li>
              <li style={styles.listItem}>{t("disclaimer.section13.item4")}: <Link href="/contact" style={styles.link}>/contact</Link></li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "900px",
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
    marginBottom: "2rem",
  },
  content: {
    paddingBottom: "2rem",
  },
  section: {
    marginBottom: "2.5rem",
  },
  h2: {
    fontSize: "1.25rem",
    color: "#FFFFFF",
    marginBottom: "1rem",
    fontWeight: 700,
  },
  p: {
    fontSize: "0.875rem",
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 1.8,
    marginBottom: "1rem",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: "1rem 0",
  },
  listItem: {
    fontSize: "0.875rem",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: "0.75rem",
    paddingLeft: "1.5rem",
    position: "relative",
    lineHeight: 1.6,
  },
  link: {
    color: "#00D1C1",
    textDecoration: "none",
    borderBottom: "1px solid #00D1C1",
  },
};
