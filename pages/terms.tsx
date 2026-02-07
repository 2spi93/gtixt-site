import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "../lib/useTranslationStub";
import InstitutionalHeader from "../components/InstitutionalHeader";

export default function Terms() {
  const { t } = useTranslation("common");

  return (
    <>
      <Head>
        <title>{t("terms.meta.title")}</title>
        <meta name="description" content={t("terms.meta.description")} />
      </Head>

      <InstitutionalHeader breadcrumbs={[{ label: t("nav.terms") || "Terms", href: "/terms" }]} />

      <div style={styles.container}>
        <section style={styles.hero}>
          <div style={styles.eyebrow}>{t("terms.eyebrow")}</div>
          <h1 style={styles.h1}>{t("terms.title")}</h1>
          <p style={styles.lead}>
            {t("terms.lead")}
          </p>
        </section>

        <div style={styles.content}>
          <section style={styles.section}>
            <h2 style={styles.h2}>{t("terms.section1.title")}</h2>
            <p style={styles.p}>{t("terms.section1.para1")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("terms.section2.title")}</h2>
            <p style={styles.p}>{t("terms.section2.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("terms.section2.item1")}</li>
              <li style={styles.listItem}>{t("terms.section2.item2")}</li>
              <li style={styles.listItem}>{t("terms.section2.item3")}</li>
            </ul>
            <p style={styles.p}>{t("terms.section2.para2")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("terms.section3.title")}</h2>
            <p style={styles.p}>{t("terms.section3.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("terms.section3.item1")}</li>
              <li style={styles.listItem}>{t("terms.section3.item2")}</li>
              <li style={styles.listItem}>{t("terms.section3.item3")}</li>
              <li style={styles.listItem}>{t("terms.section3.item4")}</li>
              <li style={styles.listItem}>{t("terms.section3.item5")}</li>
              <li style={styles.listItem}>{t("terms.section3.item6")}</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("terms.section4.title")}</h2>
            <p style={styles.p}>{t("terms.section4.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("terms.section4.canItem1")}</li>
              <li style={styles.listItem}>{t("terms.section4.canItem2")}</li>
            </ul>
            <p style={styles.p}>{t("terms.section4.cantIntro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("terms.section4.cantItem1")}</li>
              <li style={styles.listItem}>{t("terms.section4.cantItem2")}</li>
              <li style={styles.listItem}>{t("terms.section4.cantItem3")}</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("terms.section5.title")}</h2>
            <p style={styles.p}>{t("terms.section5.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("terms.section5.item1")}</li>
              <li style={styles.listItem}>{t("terms.section5.item2")}</li>
              <li style={styles.listItem}>{t("terms.section5.item3")}</li>
            </ul>
            <p style={styles.p}>{t("terms.section5.para2")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("terms.section6.title")}</h2>
            <p style={styles.p}>{t("terms.section6.para1")}</p>
            <p style={styles.p}>{t("terms.section6.para2")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("terms.section7.title")}</h2>
            <p style={styles.p}>{t("terms.section7.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("terms.section7.item1")}</li>
              <li style={styles.listItem}>{t("terms.section7.item2")}</li>
              <li style={styles.listItem}>{t("terms.section7.item3")}</li>
            </ul>
            <p style={styles.p}>{t("terms.section7.para2")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("terms.section8.title")}</h2>
            <p style={styles.p}>{t("terms.section8.para1")}</p>
            <p style={styles.p}>{t("terms.section8.para2")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("terms.section9.title")}</h2>
            <p style={styles.p}>{t("terms.section9.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("terms.section9.item1")}</li>
              <li style={styles.listItem}>{t("terms.section9.item2")}</li>
              <li style={styles.listItem}>{t("terms.section9.item3")}</li>
              <li style={styles.listItem}>{t("terms.section9.item4")}</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("terms.section10.title")}</h2>
            <p style={styles.p}>{t("terms.section10.para1")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("terms.section11.title")}</h2>
            <p style={styles.p}>{t("terms.section11.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("terms.section11.item1")} <a href="mailto:legal@contact.gtixt.com" style={styles.link}>legal@contact.gtixt.com</a></li>
              <li style={styles.listItem}>{t("terms.section11.item2")} <Link href="/contact" style={styles.link}>/contact</Link></li>
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
