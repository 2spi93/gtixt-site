import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "../../lib/useTranslationStub";
import InstitutionalHeader from "../../components/InstitutionalHeader";
import { useState } from "react";

interface FAQItem {
  category: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    category: "Getting Started",
    question: "What is GTIXT?",
    answer:
      "GTIXT (GTIX Transparency Index) is an independent institutional benchmarking platform that evaluates proprietary trading firms across seven pillars: regulatory compliance, financial stability, operational risk, technology infrastructure, governance structure, client protection, and market conduct. We publish quarterly snapshots with integrity scores and confidence levels.",
  },
  {
    category: "Getting Started",
    question: "Is GTIXT a regulatory body or credit rating agency?",
    answer:
      "No. GTIXT is an independent transparency and benchmarking platform, not a regulator, credit rater, or financial advisor. Our scores complement (but do not replace) formal regulatory oversight and credit analysis. See our Legal Disclaimer for important limitations.",
  },
  {
    category: "Getting Started",
    question: "How much does GTIXT cost?",
    answer:
      "GTIXT offers three tiers: Community (free, non-commercial), Professional ($99/month, commercial use), and Enterprise (custom pricing). See our Pricing page for details. All tiers include access to public rankings and limited API access.",
  },
  {
    category: "Data",
    question: "How often are GTIXT snapshots released?",
    answer:
      "Quarterly, typically in January, April, July, and October. Release dates are announced on our website and via email to subscribers. Historical snapshots are available for download and API access.",
  },
  {
    category: "Data",
    question: "How do I download GTIXT data?",
    answer:
      "Snapshots are available for direct download from our Data page. Each snapshot includes a JSON file with all firm records, metadata, and SHA-256 hash for verification. Alternatively, use our REST API to programmatically access current and historical data.",
  },
  {
    category: "Data",
    question: "Can I use GTIXT data commercially?",
    answer:
      "Community (free) tier is for non-commercial use only. Professional and Enterprise tiers include commercial licenses allowing integration into products and reports. See Terms of Service for details.",
  },
  {
    category: "Data",
    question: "What is the 'confidence level' in GTIXT?",
    answer:
      "Confidence (HIGH/MEDIUM/LOW) reflects our assessment of data completeness for each firm: HIGH (>95% pillar coverage), MEDIUM (70-95%), LOW (<70%). It indicates data quality, not score accuracy. See Methodology for the calculation.",
  },
  {
    category: "Methodology",
    question: "How does GTIXT calculate integrity scores?",
    answer:
      "Each firm is evaluated on seven pillars (regulatory compliance, financial stability, operational risk, technology, governance, client protection, market conduct). Each pillar is scored 0-1.0 based on public regulatory data, disclosures, and news. The final integrity score is the weighted average. See our Methodology page for the complete calculation.",
  },
  {
    category: "Methodology",
    question: "Is GTIXT methodology transparent?",
    answer:
      "Yes. Our complete methodology is published on our Methodology page, including pillar definitions, data sources, scoring weights, and example calculations. We're committed to transparency and reproducibility.",
  },
  {
    category: "Methodology",
    question: "Can a firm request a correction to their GTIXT score?",
    answer:
      "Yes. If you represent a firm and believe information is factually inaccurate or outdated, submit a correction request via our Contact page. We review requests within 30 days and update scores if warranted. See Methodology for the formal process.",
  },
  {
    category: "API",
    question: "How do I get an API key?",
    answer:
      "Visit our Contact page and select 'API Access Request' in the subject line. We'll respond within 24 hours with credentials and documentation. Community tier keys are free; Professional and Enterprise require subscription.",
  },
  {
    category: "API",
    question: "What are the API rate limits?",
    answer:
      "Community: 100 requests/hour. Professional: 10,000 requests/hour. Enterprise: Unlimited (custom). Rate limit information is included in API response headers. See API documentation for details.",
  },
  {
    category: "API",
    question: "Can I scrape GTIXT data instead of using the API?",
    answer:
      "No. Web scraping is prohibited under our Terms of Service. Please use our REST API or download snapshots directly. If API rate limits are insufficient for your use case, contact us about upgrading to Professional or Enterprise tier.",
  },
  {
    category: "Legal",
    question: "What is your data retention policy?",
    answer:
      "Institutional benchmarking data is retained indefinitely to provide historical analysis. Personal account data (for API subscribers) is retained for as long as your account is active, plus 30 days after deletion. See Privacy Policy for details.",
  },
  {
    category: "Legal",
    question: "Is GTIXT SOC 2 compliant?",
    answer:
      "Yes. GTIXT is SOC 2 Type II certified. We also use TLS 1.3+ encryption, SHA-256 verification, role-based access control, and regular security audits. See our Data page for security details.",
  },
  {
    category: "Legal",
    question: "What is your data privacy policy?",
    answer:
      "We collect minimal personal data (email, organization, API usage). Data is used only to provide services and comply with legal obligations. We do not sell data to third parties. See Privacy Policy for full details.",
  },
  {
    category: "Technical",
    question: "What format is GTIXT snapshot data?",
    answer:
      "Snapshots are JSON files with an array of firm records. Each record includes firm_name, integrity_score (0-1.0), confidence (HIGH/MEDIUM/LOW), jurisdiction, seven pillar scores, and metadata. See Data Schema for complete field reference.",
  },
  {
    category: "Technical",
    question: "How is data integrity verified?",
    answer:
      "Each snapshot includes a SHA-256 hash. You can verify snapshot integrity by computing SHA-256 on the data.json file and comparing to the published hash. This guarantees data hasn't been modified.",
  },
  {
    category: "Technical",
    question: "Are GTIXT snapshots versioned/immutable?",
    answer:
      "Yes. Snapshots are assigned immutable IDs (YYYY-MM-DD format). Once published, a snapshot never changes. Historical snapshots are available for comparison and trend analysis. This ensures audit trail integrity.",
  },
];

export default function FAQ() {
  const { t } = useTranslation("common");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const categories = Array.from(new Set(faqItems.map((item) => item.category)));

  return (
    <>
      <Head>
        <title>FAQ - GTIXT</title>
        <meta name="description" content="GTIXT Frequently Asked Questions. Everything you need to know about our institutional benchmarking platform." />
      </Head>

      <InstitutionalHeader
        breadcrumbs={[
          { label: t("nav.docs") || "Documentation", href: "/docs" },
          { label: "FAQ", href: "/docs/faq" },
        ]}
      />

      <div style={styles.container}>
        <section style={styles.hero}>
          <div style={styles.eyebrow}>{t("faq.eyebrow") || "Questions?"}</div>
          <h1 style={styles.h1}>{t("faq.title") || "Frequently Asked Questions"}</h1>
          <p style={styles.lead}>
            {t("faq.lead") || "Answers to common questions about GTIXT methodology, data, API, and operations."}
          </p>
        </section>

        {/* Category Navigation */}
        <div style={styles.categoryNav}>
          {categories.map((category) => (
            <a
              key={category}
              href={`#${category.toLowerCase().replace(/\s+/g, "-")}`}
              style={styles.categoryLink}
            >
              {category}
            </a>
          ))}
        </div>

        {/* FAQ Sections */}
        {categories.map((category) => (
          <section
            key={category}
            id={category.toLowerCase().replace(/\s+/g, "-")}
            style={styles.section}
          >
            <h2 style={styles.h2}>{category}</h2>

            <div style={styles.faqList}>
              {faqItems
                .filter((item) => item.category === category)
                .map((item, idx) => {
                  const globalIdx = faqItems.indexOf(item);
                  const isExpanded = expandedIdx === globalIdx;

                  return (
                    <div key={idx} style={styles.faqItem}>
                      <button
                        onClick={() =>
                          setExpandedIdx(isExpanded ? null : globalIdx)
                        }
                        style={styles.faqQuestion}
                      >
                        <span>{item.question}</span>
                        <span style={{...styles.faqToggle, transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)"}}>
                          ▼
                        </span>
                      </button>

                      {isExpanded && (
                        <div style={styles.faqAnswer}>{item.answer}</div>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>
        ))}

        {/* CTA */}
        <section style={styles.ctaSection}>
          <h2 style={styles.h2}>Still Have Questions?</h2>
          <p style={styles.p}>
            Can't find the answer you're looking for? Get in touch with our team.
          </p>
          <Link href="/contact" style={{ ...styles.btn, ...styles.btnPrimary }}>
            Contact Us
          </Link>
        </section>
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
  categoryNav: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "2rem",
    flexWrap: "wrap",
  },
  categoryLink: {
    padding: "0.5rem 1rem",
    borderRadius: "999px",
    border: "1px solid rgba(0, 209, 193, 0.3)",
    color: "rgba(255, 255, 255, 0.7)",
    textDecoration: "none",
    fontSize: "0.75rem",
    fontWeight: 700,
    transition: "all 0.2s",
  },
  section: {
    marginBottom: "3rem",
  },
  h2: {
    fontSize: "1.5rem",
    color: "#FFFFFF",
    marginBottom: "1.5rem",
    fontWeight: 700,
  },
  p: {
    fontSize: "0.875rem",
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 1.6,
    marginBottom: "1rem",
  },
  faqList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  faqItem: {
    background: "rgba(0, 209, 193, 0.05)",
    border: "1px solid rgba(0, 209, 193, 0.2)",
    borderRadius: "8px",
    overflow: "hidden",
  },
  faqQuestion: {
    width: "100%",
    padding: "1.25rem",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    transition: "all 0.2s",
    fontSize: "0.875rem",
    fontWeight: 700,
    color: "#FFFFFF",
    textAlign: "left",
  },
  faqToggle: {
    display: "inline-block",
    transition: "transform 0.2s",
    color: "#00D1C1",
    fontSize: "0.75rem",
  },
  faqAnswer: {
    padding: "0 1.25rem 1.25rem 1.25rem",
    fontSize: "0.875rem",
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 1.8,
    borderTop: "1px solid rgba(0, 209, 193, 0.1)",
  },
  ctaSection: {
    padding: "2rem",
    background: "linear-gradient(135deg, rgba(0, 209, 193, 0.1) 0%, rgba(0, 209, 193, 0.05) 100%)",
    borderRadius: "12px",
    border: "1px solid rgba(0, 209, 193, 0.3)",
    textAlign: "center",
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
