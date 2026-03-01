'use client';

import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "../lib/useTranslationStub";
import InstitutionalHeader from "../components/InstitutionalHeader";
import { useState } from "react";

export default function Contact() {
  const { t } = useTranslation("common");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log("Message envoyé avec succès");
        setFormSubmitted(true);
        setTimeout(() => {
          setFormSubmitted(false);
          setFormData({ name: "", email: "", organization: "", subject: "", message: "" });
        }, 3000);
      } else {
        console.error("Erreur lors de l'envoi", response.statusText);
        alert("Erreur lors de l'envoi du message");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'envoi du message");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <Head>
        <title>{t("contact.metaTitle")}</title>
        <meta name="description" content={t("contact.metaDescription")} />
      </Head>

      <InstitutionalHeader breadcrumbs={[{ label: "Contact", href: "/contact" }]} />

      <div style={styles.container}>
        <section style={styles.hero}>
          <div style={styles.eyebrow}>{t("contact.eyebrow")}</div>
          <h1 style={styles.h1}>{t("contact.title")}</h1>
          <p style={styles.lead}>
            {t("contact.lead")}
          </p>
        </section>

        <div style={styles.grid2}>
          {/* Contact Form */}
          <section style={styles.card}>
            <h2 style={styles.h2}>{t("contact.formTitle")}</h2>

            {formSubmitted && (
              <div style={styles.successMessage}>
                ✓ {t("contact.successMessage")}
              </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t("contact.form.nameLabel")}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  placeholder={t("contact.form.namePlaceholder")}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>{t("contact.form.emailLabel")}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  placeholder={t("contact.form.emailPlaceholder")}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>{t("contact.form.organizationLabel")}</label>
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder={t("contact.form.organizationPlaceholder")}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>{t("contact.form.subjectLabel")}</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  style={styles.input}
                >
                  <option value="">{t("contact.form.subjectPlaceholder")}</option>
                  <option value="api">{t("contact.subjects.api")}</option>
                  <option value="support">{t("contact.subjects.support")}</option>
                  <option value="legal">{t("contact.subjects.legal")}</option>
                  <option value="privacy">{t("contact.subjects.privacy")}</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>{t("contact.form.messageLabel")}</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  style={{ ...styles.input, ...styles.textarea }}
                  placeholder={t("contact.form.messagePlaceholder")}
                  rows={6}
                />
              </div>

              <button type="submit" style={{ ...styles.btn, ...styles.btnPrimary }}>
                {t("contact.form.submitLabel")}
              </button>
            </form>
          </section>

          {/* Contact Info */}
          <section style={styles.card}>
            <h2 style={styles.h2}>{t("contact.otherWays.title")}</h2>

            <div style={styles.contactInfo}>
              <div style={styles.infoBlock}>
                <h3 style={styles.h3}>{t("contact.otherWays.emailTitle")}</h3>
                <ul style={styles.list}>
                  <li style={styles.listItem}>
                    Support: <a href="mailto:support@center.gtixt.com" style={styles.link}>support@center.gtixt.com</a>
                  </li>
                  <li style={styles.listItem}>
                    API & Data: <a href="mailto:first@api.gtixt.com" style={styles.link}>first@api.gtixt.com</a>
                  </li>
                  <li style={styles.listItem}>
                    Legal: <a href="mailto:legal@contact.gtixt.com" style={styles.link}>legal@contact.gtixt.com</a>
                  </li>
                  <li style={styles.listItem}>
                    Privacy: <a href="mailto:privacy@contact.gtixt.com" style={styles.link}>privacy@contact.gtixt.com</a>
                  </li>
                </ul>
              </div>

              <div style={styles.infoBlock}>
                <h3 style={styles.h3}>{t("contact.otherWays.addressTitle")}</h3>
                <p style={styles.p}>
                  {t("contact.otherWays.addressLine1")}<br />
                  {t("contact.otherWays.addressLine2")}<br />
                  {t("contact.otherWays.addressLine3")}<br />
                  {t("contact.otherWays.addressLine4")}
                </p>
              </div>

              <div style={styles.infoBlock}>
                <h3 style={styles.h3}>{t("contact.otherWays.responseTitle")}</h3>
                <p style={styles.p}>{t("contact.otherWays.responseText")}</p>
              </div>

              <div style={styles.infoBlock}>
                <h3 style={styles.h3}>{t("contact.otherWays.apiSupportTitle")}</h3>
                <p style={styles.p}>
                  {t("contact.otherWays.apiSupportText")} <Link href="/docs/api-v1" style={styles.link}>{t("contact.otherWays.apiSupportLink")}</Link>.
                </p>
              </div>

              <div style={styles.infoBlock}>
                <h3 style={styles.h3}>{t("contact.otherWays.dataCorrectionsTitle")}</h3>
                <p style={styles.p}>
                  {t("contact.otherWays.dataCorrectionsText")} <Link href="/methodology" style={styles.link}>{t("contact.otherWays.dataCorrectionsLink")}</Link>.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* FAQ Section */}
        <section style={styles.card}>
          <h2 style={styles.h2}>{t("contact.faq.title")}</h2>

          <div style={styles.faqGrid}>
            {[
              {
                q: t("contact.faq.items.apiAccess.q"),
                a: t("contact.faq.items.apiAccess.a"),
              },
              {
                q: t("contact.faq.items.commercial.q"),
                a: t("contact.faq.items.commercial.a"),
              },
              {
                q: t("contact.faq.items.snapshots.q"),
                a: t("contact.faq.items.snapshots.a"),
              },
              {
                q: t("contact.faq.items.corrections.q"),
                a: t("contact.faq.items.corrections.a"),
              },
              {
                q: t("contact.faq.items.confidence.q"),
                a: t("contact.faq.items.confidence.a"),
              },
              {
                q: t("contact.faq.items.regulation.q"),
                a: t("contact.faq.items.regulation.a"),
              },
            ].map((faq, idx) => (
              <div key={idx} style={styles.faqItem}>
                <h4 style={styles.h4}>{faq.q}</h4>
                <p style={styles.p}>{faq.a}</p>
              </div>
            ))}
          </div>

          <p style={{ ...styles.p, marginTop: "1.5rem" }}>
            {t("contact.faq.moreQuestions")} <Link href="/docs/faq" style={styles.link}>{t("contact.faq.moreQuestionsLink")}</Link>.
          </p>
        </section>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1200px",
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
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "2rem",
    marginBottom: "2rem",
  },
  card: {
    padding: "2rem",
    background: "rgba(0, 209, 193, 0.05)",
    borderRadius: "12px",
    border: "1px solid rgba(0, 209, 193, 0.2)",
    marginBottom: "2rem",
  },
  h2: {
    fontSize: "1.5rem",
    color: "#FFFFFF",
    marginBottom: "1.5rem",
    fontWeight: 700,
  },
  h3: {
    fontSize: "0.875rem",
    color: "#00D1C1",
    marginBottom: "0.75rem",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  h4: {
    fontSize: "0.875rem",
    color: "#FFFFFF",
    marginBottom: "0.5rem",
    fontWeight: 700,
  },
  p: {
    fontSize: "0.875rem",
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 1.6,
    marginBottom: "1rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: "0.75rem",
    color: "#00D1C1",
    fontWeight: 700,
    textTransform: "uppercase",
    marginBottom: "0.5rem",
  },
  input: {
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid rgba(0, 209, 193, 0.3)",
    background: "rgba(7, 11, 18, 0.8)",
    color: "#FFFFFF",
    fontSize: "0.875rem",
  },
  textarea: {
    resize: "vertical",
    fontFamily: "inherit",
  },
  btn: {
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 700,
    textDecoration: "none",
    cursor: "pointer",
    border: "none",
    transition: "all 0.2s",
    alignSelf: "flex-start",
  },
  btnPrimary: {
    background: "#00D1C1",
    color: "#070B12",
  },
  successMessage: {
    padding: "1rem",
    background: "rgba(76, 175, 80, 0.1)",
    border: "1px solid rgba(76, 175, 80, 0.3)",
    color: "#4CAF50",
    borderRadius: "8px",
    fontSize: "0.875rem",
    marginBottom: "1.5rem",
  },
  contactInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  infoBlock: {
    paddingBottom: "1.5rem",
    borderBottom: "1px solid rgba(0, 209, 193, 0.1)",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  listItem: {
    fontSize: "0.875rem",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: "0.5rem",
    lineHeight: 1.6,
  },
  link: {
    color: "#00D1C1",
    textDecoration: "none",
    borderBottom: "1px solid #00D1C1",
  },
  faqGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1.5rem",
  },
  faqItem: {
    padding: "1rem",
    background: "rgba(0, 209, 193, 0.05)",
    border: "1px solid rgba(0, 209, 193, 0.1)",
    borderRadius: "8px",
  },
};
