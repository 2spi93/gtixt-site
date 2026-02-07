'use client';

import Head from "next/head";
import InstitutionalHeader from "../components/InstitutionalHeader";
import PageNavigation from "../components/PageNavigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useIsMounted } from "../lib/useIsMounted";
import { useTranslation } from "../lib/useTranslationStub";

interface Snapshot {
  object?: string;
  count?: number;
  sha256?: string;
  created_at?: string;
}

export default function Data() {
  const isMounted = useIsMounted();
  const { t } = useTranslation("common");
  const [latestSnapshot, setLatestSnapshot] = useState<Snapshot | null>(null);

  const latestPointerUrl =
    process.env.NEXT_PUBLIC_LATEST_POINTER_URL ||
    "http://51.210.246.61:9000/gpti-snapshots/universe_v0.1_public/_public/latest.json";

  const minioRoot =
    process.env.NEXT_PUBLIC_MINIO_PUBLIC_ROOT ||
    "http://51.210.246.61:9000/gpti-snapshots/";

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch(latestPointerUrl, { cache: "no-store" });
        const data = await res.json();
        setLatestSnapshot(data);
      } catch (error) {
        console.error("Failed to fetch latest snapshot:", error);
      }
    };
    fetchLatest();
  }, []);

  return (
    <>
      <Head>
        <title>{t("data.meta.title")}</title>
        <meta name="description" content={t("data.meta.description")} />
      </Head>

      <InstitutionalHeader breadcrumbs={isMounted ? [{ label: t("data.breadcrumb"), href: "/data" }] : []} />

      <main id="main-content" style={styles.container}>
        {/* Navigation */}
        <PageNavigation />
        
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.eyebrow}>{t("data.eyebrow")}</div>
          <h1 style={styles.h1}>{t("data.title")}</h1>
          <p style={styles.lead}>
            Versioned snapshots • Immutable digests • Public integrity verification • RESTful API access
          </p>
        </section>

        {/* Snapshot Overview */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.h2}>{t("data.latestSnapshot.title")}</h2>
            <p style={styles.sectionSubtitle}>{t("data.latestSnapshot.subtitle")}</p>
          </div>

          {latestSnapshot && isMounted ? (
            <>
              <div style={styles.snapshotGrid}>
                <div style={styles.snapshotCard}>
                  <div style={styles.cardLabel}>{t("data.latestSnapshot.snapshotId")}</div>
                  <div style={styles.cardValue} title={latestSnapshot.object}>
                    {latestSnapshot.object?.substring(0, 45) || "—"}
                  </div>
                </div>
                <div style={styles.snapshotCard}>
                  <div style={styles.cardLabel}>{t("data.latestSnapshot.totalRecords")}</div>
                  <div style={styles.cardValue}>{latestSnapshot.count || "—"}</div>
                </div>
                <div style={styles.snapshotCard}>
                  <div style={styles.cardLabel}>{t("data.latestSnapshot.sha256")}</div>
                  <div style={{ ...styles.cardValue, fontSize: "0.75rem", fontFamily: "monospace", wordBreak: "break-all" }}>
                    {latestSnapshot.sha256?.substring(0, 40) || "—"}...
                  </div>
                </div>
                <div style={styles.snapshotCard}>
                  <div style={styles.cardLabel}>{t("data.latestSnapshot.generated")}</div>
                  <div style={styles.cardValue}>
                    {latestSnapshot.created_at ? new Date(latestSnapshot.created_at).toLocaleDateString('en-GB') : "—"}
                  </div>
                </div>
              </div>

              <div style={styles.snapshotActions}>
                <a
                  href={latestSnapshot.object ? `${minioRoot.replace(/\/+$/, "")}/${latestSnapshot.object.replace(/^\/+/, "")}` : "#"}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...styles.btn, ...styles.btnPrimary }}
                >
                  📥 Download JSON
                </a>
                <Link href="/integrity" style={{ ...styles.btn, ...styles.btnSecondary }}>
                  🔒 Verify Integrity
                </Link>
              </div>
            </>
          ) : (
            <div style={styles.loading}>{t("data.latestSnapshot.loading")}</div>
          )}
        </section>

        {/* Data Access Methods */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.h2}>{t("data.accessMethods.title")}</h2>
            <p style={styles.sectionSubtitle}>{t("data.accessMethods.subtitle")}</p>
          </div>

          <div style={styles.accessGrid}>
            <div style={styles.accessCard}>
              <div style={styles.accessIcon}>📥</div>
              <h3 style={styles.accessTitle}>{t("data.accessMethods.directDownload.title")}</h3>
              <p style={styles.accessDesc}>
                Download JSON snapshots directly from MinIO storage with complete firm data and scoring details.
              </p>
              <a
                href={latestSnapshot?.object ? `${minioRoot.replace(/\/+$/, "")}/${latestSnapshot.object.replace(/^\/+/, "")}` : "#"}
                style={{ ...styles.accessLink, ...styles.linkPrimary }}
              >
                {t("data.latestSnapshot.downloadBtn")} →
              </a>
            </div>

            <div style={styles.accessCard}>
              <div style={styles.accessIcon}>⚙️</div>
              <h3 style={styles.accessTitle}>{t("data.accessMethods.restApi.title")}</h3>
              <p style={styles.accessDesc}>
                Integrate with our RESTful endpoints for real-time access to snapshots, firm data, and rankings.
              </p>
              <Link href="/api-docs" style={{ ...styles.accessLink, ...styles.linkSecondary }}>
                API Reference →
              </Link>
            </div>

            <div style={styles.accessCard}>
              <div style={styles.accessIcon}>📊</div>
              <h3 style={styles.accessTitle}>{t("data.accessMethods.dashboard.title")}</h3>
              <p style={styles.accessDesc}>
                {t("data.accessMethods.dashboard.description")}
              </p>
              <Link href="/rankings" style={{ ...styles.accessLink, ...styles.linkSecondary }}>
                {t("data.accessMethods.dashboard.link")}
              </Link>
            </div>
          </div>
        </section>

        {/* Integrity & Verification */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.h2}>{t("data.integrity.title")}</h2>
            <p style={styles.sectionSubtitle}>{t("data.integrity.subtitle")}</p>
          </div>

          <div style={styles.verifyGrid}>
            <div style={styles.verifyCard}>
              <h3 style={styles.verifyTitle}>🔐 {t("data.integrity.sha256.title")}</h3>
              <p style={styles.verifyText}>
                {t("data.integrity.sha256.description")}
              </p>
            </div>
            <div style={styles.verifyCard}>
              <h3 style={styles.verifyTitle}>📝 {t("data.integrity.immutable.title")}</h3>
              <p style={styles.verifyText}>
                {t("data.integrity.immutable.description")}
              </p>
            </div>
            <div style={styles.verifyCard}>
              <h3 style={styles.verifyTitle}>✅ {t("data.integrity.evidence.title")}</h3>
              <p style={styles.verifyText}>
                {t("data.integrity.evidence.description")}
              </p>
            </div>
          </div>
        </section>

        {/* API Reference */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.h2}>{t("data.apiReference.title")}</h2>
            <p style={styles.sectionSubtitle}>{t("data.apiReference.subtitle")}</p>
          </div>

          <div style={styles.endpointsSection}>
            <div style={styles.endpoint}>
              <div style={styles.endpointHeader}>
                <span style={styles.method}>{t("data.apiReference.method")}</span>
                <span style={styles.path}>/api/firms/?limit=200</span>
              </div>
              <p style={styles.endpointDesc}>
                Fetch all firms with latest scores and metadata.
              </p>
            </div>

            <div style={styles.endpoint}>
              <div style={styles.endpointHeader}>
                <span style={styles.method}>{t("data.apiReference.method")}</span>
                <span style={styles.path}>/api/firm?name=FTMO%20Limited</span>
              </div>
              <p style={styles.endpointDesc}>
                Get comprehensive details for a specific firm by name.
              </p>
            </div>

            <div style={styles.endpoint}>
              <div style={styles.endpointHeader}>
                <span style={styles.method}>{t("data.apiReference.method")}</span>
                <span style={styles.path}>/api/snapshot?version=latest</span>
              </div>
              <p style={styles.endpointDesc}>
                Get snapshot metadata with digest and creation timestamp.
              </p>
            </div>
          </div>
        </section>

        {/* Code Examples */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.h2}>{t("data.codeExamples.title")}</h2>
            <p style={styles.sectionSubtitle}>{t("data.codeExamples.subtitle")}</p>
          </div>

          <div style={styles.examplesGrid}>
            <div style={styles.example}>
              <h3 style={styles.exampleTitle}>{t("data.codeExamples.curl.title")}</h3>
              <pre tabIndex={0} aria-label="API example" style={styles.codeBlock}>{`# Get all firms
curl https://api.gtixt.com/api/firms/?limit=200

# Get specific firm
curl https://api.gtixt.com/api/firm?name=FTMO%20Limited`}
</pre>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: "1400px", margin: "0 auto", padding: "2rem 1rem" },
  hero: { marginBottom: "3rem" },
  eyebrow: { fontSize: "0.75rem", color: "#7FB3FF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" },
  h1: { fontSize: "2.5rem", color: "#D0D7DE", marginBottom: "1rem", fontWeight: 700, letterSpacing: "-0.01em" },
  lead: { fontSize: "1rem", color: "#D0D7DE", maxWidth: "70ch", lineHeight: 1.6 },
  section: { marginBottom: "4rem" },
  sectionHeader: { marginBottom: "2.5rem" },
  sectionSubtitle: { fontSize: "0.95rem", color: "#D0D7DE", marginTop: "0.5rem" },
  h2: { fontSize: "1.75rem", color: "#D0D7DE", marginBottom: "0.5rem", fontWeight: 700 },
  snapshotGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "2rem" },
  snapshotCard: { padding: "1.5rem", backgroundColor: "rgba(0, 212, 194, 0.08)", border: "1px solid rgba(0, 212, 194, 0.3)", borderRadius: "0.5rem" },
  cardLabel: { fontSize: "0.8rem", color: "#7FB3FF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" },
  cardValue: { fontSize: "1.25rem", color: "#D0D7DE", fontWeight: 600, wordBreak: "break-word" },
  snapshotActions: { display: "flex", gap: "1rem", flexWrap: "wrap" },
  btn: { padding: "0.75rem 1.5rem", borderRadius: "0.375rem", fontWeight: 600, textDecoration: "none", cursor: "pointer", border: "none", fontSize: "0.95rem", display: "inline-block" },
  btnPrimary: { backgroundColor: "#1A5CE0", color: "#FFFFFF" },
  btnSecondary: { backgroundColor: "transparent", color: "#7FB3FF", border: "1px solid rgba(127, 179, 255, 0.6)" },
  accessGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", marginBottom: "2rem" },
  accessCard: { padding: "2rem", backgroundColor: "rgba(26, 115, 232, 0.08)", border: "1px solid rgba(26, 115, 232, 0.2)", borderRadius: "0.5rem" },
  accessIcon: { fontSize: "2.5rem", marginBottom: "1rem" },
  accessTitle: { fontSize: "1.25rem", color: "#D0D7DE", marginBottom: "0.75rem" },
  accessDesc: { color: "#D0D7DE", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1rem" },
  accessLink: { fontSize: "0.95rem", fontWeight: 600, textDecoration: "none", cursor: "pointer" },
  linkPrimary: { color: "#E6EDF3" },
  linkSecondary: { color: "#E6EDF3" },
  verifyGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", marginBottom: "2rem" },
  verifyCard: { padding: "1.5rem", backgroundColor: "rgba(255, 107, 107, 0.08)", border: "1px solid rgba(255, 107, 107, 0.2)", borderRadius: "0.5rem" },
  verifyTitle: { fontSize: "1.1rem", color: "#D0D7DE", marginBottom: "0.75rem" },
  verifyText: { color: "#D0D7DE", fontSize: "0.95rem", lineHeight: 1.6 },
  endpointsSection: { display: "flex", flexDirection: "column", gap: "2rem", marginBottom: "2rem" },
  endpoint: { backgroundColor: "rgba(0, 212, 194, 0.05)", border: "1px solid rgba(0, 212, 194, 0.2)", borderRadius: "0.5rem", padding: "1.5rem" },
  endpointHeader: { display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" },
  method: { padding: "0.35rem 0.75rem", backgroundColor: "#7FB3FF", color: "#0B0E11", borderRadius: "0.25rem", fontWeight: 600, fontSize: "0.8rem" },
  path: { color: "#E6EDF3", fontFamily: "monospace", fontWeight: 600 },
  endpointDesc: { color: "#D0D7DE", marginBottom: "1rem", fontSize: "0.95rem" },
  codeBlock: { backgroundColor: "#0B0E11", padding: "1rem", borderRadius: "0.375rem", color: "#E6EDF3", fontFamily: "monospace", fontSize: "0.85rem", overflow: "auto", border: "1px solid rgba(127, 179, 255, 0.6)" },
  examplesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", marginBottom: "2rem" },
  example: { backgroundColor: "rgba(26, 115, 232, 0.05)", border: "1px solid rgba(26, 115, 232, 0.2)", borderRadius: "0.5rem", padding: "1.5rem", overflow: "hidden" },
  exampleTitle: { fontSize: "1.1rem", color: "#D0D7DE", marginBottom: "1rem", fontWeight: 600 },
  loading: { padding: "2rem", textAlign: "center", color: "#D0D7DE" },
};
