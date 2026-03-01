import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "../lib/useTranslationStub";
import InstitutionalHeader from "../components/InstitutionalHeader";

export default function Privacy() {
  const { t } = useTranslation("common");

  return (
    <>
      <Head>
        <title>{t("privacy.meta.title")}</title>
        <meta name="description" content={t("privacy.meta.description")} />
      </Head>

      <InstitutionalHeader breadcrumbs={[{ label: t("nav.privacy") || "Privacy", href: "/privacy" }]} />

      <div style={styles.container}>
        <section style={styles.hero}>
          <div style={styles.eyebrow}>{t("privacy.eyebrow")}</div>
          <h1 style={styles.h1}>{t("privacy.title")}</h1>
          <p style={styles.lead}>{t("privacy.lead")}</p>
        </section>

        <div style={styles.content}>
          <section style={styles.section}>
            <h2 style={styles.h2}>{t("privacy.section1.title")}</h2>
            <p style={styles.p}>{t("privacy.section1.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>
                <strong>{t("privacy.section1.item1.title")}:</strong> {t("privacy.section1.item1.desc")}
              </li>
              <li style={styles.listItem}>
                <strong>{t("privacy.section1.item2.title")}:</strong> {t("privacy.section1.item2.desc")}
              </li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("privacy.section2.title")}</h2>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("privacy.section2.item1")}</li>
              <li style={styles.listItem}>{t("privacy.section2.item2")}</li>
              <li style={styles.listItem}>{t("privacy.section2.item3")}</li>
              <li style={styles.listItem}>{t("privacy.section2.item4")}</li>
              <li style={styles.listItem}>{t("privacy.section2.item5")}</li>
              <li style={styles.listItem}>{t("privacy.section2.item6")}</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("privacy.section3.title")}</h2>
            <p style={styles.p}>{t("privacy.section3.para1")}</p>
            <p style={styles.p}>{t("privacy.section3.para2")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("privacy.section4.title")}</h2>
            <p style={styles.p}>{t("privacy.section4.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("privacy.section4.item1")}</li>
              <li style={styles.listItem}>{t("privacy.section4.item2")}</li>
              <li style={styles.listItem}>{t("privacy.section4.item3")}</li>
              <li style={styles.listItem}>{t("privacy.section4.item4")}</li>
              <li style={styles.listItem}>{t("privacy.section4.item5")}</li>
            </ul>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("privacy.section5.title")}</h2>
            <p style={styles.p}>{t("privacy.section5.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("privacy.section5.item1")}</li>
              <li style={styles.listItem}>{t("privacy.section5.item2")}</li>
              <li style={styles.listItem}>{t("privacy.section5.item3")}</li>
              <li style={styles.listItem}>{t("privacy.section5.item4")}</li>
              <li style={styles.listItem}>{t("privacy.section5.item5")}</li>
            </ul>
            <p style={styles.p}>
              {t("privacy.section5.contact")} <a href="mailto:privacy@contact.gtixt.com" style={styles.link}>privacy@contact.gtixt.com</a> {t("privacy.section5.contactEnd")}.
            </p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("privacy.section6.title")}</h2>
            <p style={styles.p}>{t("privacy.section6.para1")}</p>
            <p style={styles.p}>{t("privacy.section6.para2")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("privacy.section7.title")}</h2>
            <p style={styles.p}>{t("privacy.section7.para1")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("privacy.section8.title")}</h2>
            <p style={styles.p}>{t("privacy.section8.para1")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("privacy.section9.title")}</h2>
            <p style={styles.p}>{t("privacy.section9.para1")}</p>
          </section>

          <section style={styles.section}>
            <h2 style={styles.h2}>{t("privacy.section10.title")}</h2>
            <p style={styles.p}>{t("privacy.section10.intro")}</p>
            <ul style={styles.list}>
              <li style={styles.listItem}>{t("privacy.section10.email")}: <a href="mailto:privacy@contact.gtixt.com" style={styles.link}>privacy@contact.gtixt.com</a></li>
              <li style={styles.listItem}>{t("privacy.section10.mail")}</li>
              <li style={styles.listItem}>{t("privacy.section10.contact")}: <Link href="/contact" style={styles.link}>/contact</Link></li>
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
