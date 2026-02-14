'use client';

import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import InstitutionalHeader from "../components/InstitutionalHeader";
import Footer from "../components/Footer";
import { useIsMounted } from "../lib/useIsMounted";
import { useTranslation } from "../lib/useTranslationStub";

type LatestPointer = {
  object: string;
  sha256: string;
  created_at: string;
  count: number;
};

type VerifyStatus =
  | { state: "idle" }
  | { state: "loading"; message: string }
  | { state: "verified"; hash: string }
  | { state: "mismatch"; expected: string; got: string }
  | { state: "error"; message: string; detail?: string };

const LATEST_POINTER_URL =
  process.env.NEXT_PUBLIC_LATEST_POINTER_URL ||
  "https://data.gtixt.com/gpti-snapshots/universe_v0.1_public/_public/latest.json";

const MINIO_PUBLIC_ROOT =
  process.env.NEXT_PUBLIC_MINIO_PUBLIC_ROOT ||
  "https://data.gtixt.com/gpti-snapshots/";

function isoToHuman(s?: string) {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return d.toUTCString();
  } catch {
    return s;
  }
}

function isoToLocal(s?: string) {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return d.toLocaleString();
  } catch {
    return s;
  }
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeTruncateHex(h: string, n = 12) {
  if (!h) return "—";
  return h.length <= n * 2 ? h : `${h.slice(0, n)}…${h.slice(-n)}`;
}

function VerifyBadge({
  verify,
  rawSize,
  snapshotUrl,
  t,
}: {
  verify: VerifyStatus;
  rawSize: number | null;
  snapshotUrl: string | null;
  t: any;
}) {
  if (verify.state === "idle") {
    return <span style={{fontSize: "13px", color: "#8B949E", display: "block"}}>{t("integrity.verify.clickToBegin")}</span>;
  }
  if (verify.state === "loading") {
    return (
      <div style={styles.loading}>
        <span style={{ display: "inline-block", height: "8px", width: "8px", borderRadius: "50%", backgroundColor: "#C9D1D9", marginRight: "8px", animation: "pulse 2s infinite" }} />
        {verify.message}
      </div>
    );
  }
  if (verify.state === "verified") {
    return (
      <div>
        <div style={{display: "inline-flex", alignItems: "center", gap: "8px", borderRadius: "9999px", backgroundColor: "#1E2630", padding: "6px 12px", fontSize: "14px", fontWeight: "600", color: "#3FB950"}}>
          <span style={{height: "8px", width: "8px", borderRadius: "50%", backgroundColor: "#3FB950"}} />
          {t("integrity.verify.verified")}
        </div>
        <div style={{marginTop: "12px", fontSize: "12px", color: "#8B949E"}}>
          {t("integrity.verify.computed")}: <span style={{fontFamily: "monospace", color: "#C9D1D9"}}>{safeTruncateHex(verify.hash, 14)}</span>
          {typeof rawSize === "number" ? (
            <>
              {" "} · {t("integrity.verify.size")}: <span style={{fontFamily: "monospace", color: "#C9D1D9"}}>{rawSize.toLocaleString()} bytes</span>
            </>
          ) : null}
        </div>
      </div>
    );
  }
  if (verify.state === "mismatch") {
    return (
      <div>
        <div style={{display: "inline-flex", alignItems: "center", gap: "8px", borderRadius: "9999px", backgroundColor: "#1E2630", padding: "6px 12px", fontSize: "14px", fontWeight: "600", color: "#D64545"}}>
          <span style={{height: "8px", width: "8px", borderRadius: "50%", backgroundColor: "#D64545"}} />
          {t("integrity.verify.mismatch")}
        </div>
        <div style={{marginTop: "12px", fontSize: "12px", color: "#8B949E"}}>
          <div>
            {t("integrity.verify.expected")}: <span style={{fontFamily: "monospace", color: "#C9D1D9"}}>{safeTruncateHex(verify.expected, 14)}</span>
          </div>
          <div>
            {t("integrity.verify.got")}: <span style={{fontFamily: "monospace", color: "#C9D1D9"}}>{safeTruncateHex(verify.got, 14)}</span>
          </div>
          {snapshotUrl ? (
            <div>
              Snapshot URL: <span style={{fontFamily: "monospace", color: "#C9D1D9"}}>{snapshotUrl}</span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
  return (
    <div>
      <span style={{fontSize: "14px", color: "#D64545"}}>{verify.message}</span>
      {verify.detail ? (
        <div style={{marginTop: "10px", fontSize: "12px", color: "#8B949E"}}>{verify.detail}</div>
      ) : null}
      {snapshotUrl ? (
        <div style={{marginTop: "6px", fontSize: "12px", color: "#8B949E"}}>
          Snapshot URL: <span style={{fontFamily: "monospace", color: "#C9D1D9"}}>{snapshotUrl}</span>
        </div>
      ) : null}
    </div>
  );
}

export default function IntegrityBeacon() {
  const { t } = useTranslation("common");
  const isMounted = useIsMounted();
  const [pointer, setPointer] = useState<LatestPointer | null>(null);
  const [pointerErr, setPointerErr] = useState<string | null>(null);
  const [verify, setVerify] = useState<VerifyStatus>({ state: "idle" });
  const [rawSize, setRawSize] = useState<number | null>(null);
  const [pointerSource, setPointerSource] = useState<string | null>(null);

  const snapshotUrl = useMemo(() => {
    if (!pointer?.object) return null;
    return `${MINIO_PUBLIC_ROOT}${pointer.object}`;
  }, [pointer]);

  useEffect(() => {
    let cancelled = false;

    async function loadPointer() {
      setPointerErr(null);
      try {
        const r = await fetch(LATEST_POINTER_URL, { cache: "no-store" });
        if (!r.ok) throw new Error(`latest.json HTTP ${r.status}`);
        const j = (await r.json()) as LatestPointer;
        if (!cancelled) {
          setPointer(j);
          setPointerSource(LATEST_POINTER_URL);
        }
      } catch (e: any) {
        try {
          const fallback = await fetch("/api/latest-pointer", { cache: "no-store" });
          if (!fallback.ok) throw new Error(`api/latest-pointer HTTP ${fallback.status}`);
          const j = (await fallback.json()) as LatestPointer;
          if (!cancelled) {
            setPointer(j);
            setPointerSource("/api/latest-pointer");
          }
          return;
        } catch (fallbackError: any) {
          if (!cancelled) setPointerErr(fallbackError?.message || e?.message || "Failed to load latest pointer");
        }
      }
    }

    loadPointer();
    return () => {
      cancelled = true;
    };
  }, []);

  async function runVerify() {
    if (!pointer || !snapshotUrl) return;

    setVerify({ state: "loading", message: "Downloading snapshot…" });
    setRawSize(null);

    try {
      const r = await fetch(snapshotUrl, { cache: "no-store" });
      if (!r.ok) throw new Error(`snapshot HTTP ${r.status}`);

      const buf = await r.arrayBuffer();
      setRawSize(buf.byteLength);

      setVerify({ state: "loading", message: "Computing SHA-256…" });
      const got = await sha256Hex(buf);
      const expected = (pointer.sha256 || "").toLowerCase();

      if (got.toLowerCase() === expected) {
        setVerify({ state: "verified", hash: got });
      } else {
        setVerify({ state: "mismatch", expected, got });
      }
    } catch (e: any) {
      setVerify({
        state: "error",
        message: e?.message || "Verification failed",
        detail: "Check network access and CORS for the snapshot URL.",
      });
    }
  }

  return (
    <>
      <Head>
        <title>Integrity Beacon — GTIXT</title>
        <meta
          name="description"
          content="GTIXT Integrity Beacon — verify the latest snapshot hash, provenance, and publication integrity."
        />
      </Head>

      <InstitutionalHeader
        breadcrumbs={isMounted ? [
          { label: t("integrity.breadcrumb"), href: "/integrity" },
        ] : []}
      />

      <main style={styles.container}>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.eyebrow}>{t("integrity.eyebrow")}</div>
          <h1 style={styles.h1}>{t("integrity.title")}</h1>
          <p style={styles.lead}>
            {t("integrity.lead")}
          </p>
        </section>

        {/* Latest Pointer Section */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("integrity.pointer.title")}</h2>
          <p style={styles.sectionLead}>
            {t("integrity.pointer.lead")}
          </p>
          
          <div style={styles.pointerGrid}>
            <div style={styles.pointerCard}>
              <div style={styles.pointerLabel}>{t("integrity.pointer.objectLabel")}</div>
              {pointer?.object ? (
                <div style={styles.codeBlock}>
                  <code style={styles.codeText}>{pointer.object}</code>
                </div>
              ) : (
                <div style={styles.loading}>{t("integrity.pointer.loading")}</div>
              )}
            </div>

            <div style={styles.pointerCard}>
              <div style={styles.pointerLabel}>{t("integrity.pointer.sha256Label")}</div>
              {pointer?.sha256 ? (
                <div style={styles.codeBlock}>
                  <code style={styles.codeText}>{pointer.sha256}</code>
                </div>
              ) : (
                <div style={styles.loading}>{t("integrity.pointer.loading")}</div>
              )}
              <div style={styles.badge}>{t("integrity.pointer.badge")}</div>
            </div>

            <div style={styles.pointerCard}>
              <div style={styles.pointerLabel}>{t("integrity.pointer.timestampLabel")}</div>
              <div style={styles.statValue}>{isoToHuman(pointer?.created_at)} UTC</div>
              <div style={styles.metaSubtle}>{isoToLocal(pointer?.created_at)} local</div>
              {pointerSource ? (
                <div style={styles.metaSubtle}>Source: {pointerSource}</div>
              ) : null}
            </div>

            <div style={styles.pointerCard}>
              <div style={styles.pointerLabel}>{t("integrity.pointer.recordsLabel")}</div>
              <div style={styles.statValue}>{pointer?.count?.toLocaleString() || "—"}</div>
            </div>
          </div>

          <div style={styles.controls}>
            <button
              onClick={runVerify}
              disabled={!pointer || !snapshotUrl || verify.state === "loading"}
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
                ...(!pointer || !snapshotUrl || verify.state === "loading" ? styles.buttonDisabled : {}),
              }}
            >
              {verify.state === "loading" ? t("integrity.pointer.verifying") : `🔍 ${t("integrity.pointer.verifyButton")}`}
            </button>
            <a
              href={snapshotUrl || "#"}
              style={{...styles.button, ...styles.buttonSecondary}}
              target="_blank"
              rel="noreferrer"
            >
              📥 {t("integrity.pointer.downloadButton")}
            </a>
          </div>
        </section>

        {/* Verification Result Section */}
        <section style={styles.section}>
          <div style={styles.resultCard}>
            <h3 style={styles.resultTitle}>{t("integrity.result.title")}</h3>
            <VerifyBadge verify={verify} rawSize={rawSize} snapshotUrl={snapshotUrl} t={t} />
          </div>
        </section>

        {/* How Verification Works */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("integrity.how.title")}</h2>
          <p style={styles.sectionLead}>
            {t("integrity.how.lead")}
          </p>

          <div style={styles.flowGrid}>
            <div style={styles.flowCard}>
              <div style={styles.flowNumber}>1</div>
              <h4 style={styles.flowTitle}>{t("integrity.how.steps.pointerPublished.title")}</h4>
              <p style={styles.flowText}>
                {t("integrity.how.steps.pointerPublished.textStart")} <code style={styles.inlineCode}>latest.json</code> {t("integrity.how.steps.pointerPublished.textEnd")}
              </p>
            </div>

            <div style={styles.flowCard}>
              <div style={styles.flowNumber}>2</div>
              <h4 style={styles.flowTitle}>{t("integrity.how.steps.snapshotDownloaded.title")}</h4>
              <p style={styles.flowText}>
                {t("integrity.how.steps.snapshotDownloaded.text")}
              </p>
            </div>

            <div style={styles.flowCard}>
              <div style={styles.flowNumber}>3</div>
              <h4 style={styles.flowTitle}>{t("integrity.how.steps.hashComputed.title")}</h4>
              <p style={styles.flowText}>
                {t("integrity.how.steps.hashComputed.textStart")} <code style={styles.inlineCode}>sha256sum</code> {t("integrity.how.steps.hashComputed.textEnd")}
              </p>
            </div>

            <div style={styles.flowCard}>
              <div style={styles.flowNumber}>4</div>
              <h4 style={styles.flowTitle}>{t("integrity.how.steps.verificationComplete.title")}</h4>
              <p style={styles.flowText}>
                {t("integrity.how.steps.verificationComplete.text")}
              </p>
            </div>
          </div>
        </section>

        {/* Why This Matters */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("integrity.why.title")}</h2>
          <p style={styles.sectionLead}>
            {t("integrity.why.lead")}
          </p>

          <div style={styles.whyGrid}>
            <div style={styles.whyCard}>
              <div style={styles.whyIcon}>🔒</div>
              <h4 style={styles.whyTitle}>{t("integrity.why.cards.integrity.title")}</h4>
              <p style={styles.whyText}>
                {t("integrity.why.cards.integrity.text")}
              </p>
            </div>

            <div style={styles.whyCard}>
              <div style={styles.whyIcon}>👁️</div>
              <h4 style={styles.whyTitle}>{t("integrity.why.cards.transparency.title")}</h4>
              <p style={styles.whyText}>
                {t("integrity.why.cards.transparency.text")}
              </p>
            </div>

            <div style={styles.whyCard}>
              <div style={styles.whyIcon}>📊</div>
              <h4 style={styles.whyTitle}>{t("integrity.why.cards.auditability.title")}</h4>
              <p style={styles.whyText}>
                {t("integrity.why.cards.auditability.text")}
              </p>
            </div>

            <div style={styles.whyCard}>
              <div style={styles.whyIcon}>🏛️</div>
              <h4 style={styles.whyTitle}>{t("integrity.why.cards.institutionalTrust.title")}</h4>
              <p style={styles.whyText}>
                {t("integrity.why.cards.institutionalTrust.text")}
              </p>
            </div>
          </div>
        </section>

        {/* Manual Verification */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("integrity.manual.title")}</h2>
          <p style={styles.sectionLead}>
            {t("integrity.manual.lead")}
          </p>

          <div style={styles.manualGrid}>
            <div style={styles.manualCard}>
              <h4 style={styles.manualTitle}>{t("integrity.manual.steps.downloadPointer.title")}</h4>
              <div style={styles.codeBlock}>
                <code style={styles.codeText}>
                  curl {LATEST_POINTER_URL} -o latest.json
                </code>
              </div>
            </div>

            <div style={styles.manualCard}>
              <h4 style={styles.manualTitle}>{t("integrity.manual.steps.extractPath.title")}</h4>
              <div style={styles.codeBlock}>
                <code style={styles.codeText}>
                  cat latest.json | jq -r '.object'
                </code>
              </div>
            </div>

            <div style={styles.manualCard}>
              <h4 style={styles.manualTitle}>{t("integrity.manual.steps.downloadSnapshot.title")}</h4>
              <div style={styles.codeBlock}>
                <code style={styles.codeText}>
                  curl {MINIO_PUBLIC_ROOT}$(cat latest.json | jq -r '.object') -o snapshot.json
                </code>
              </div>
            </div>

            <div style={styles.manualCard}>
              <h4 style={styles.manualTitle}>{t("integrity.manual.steps.computeHash.title")}</h4>
              <div style={styles.codeBlock}>
                <code style={styles.codeText}>
                  sha256sum snapshot.json
                </code>
              </div>
            </div>

            <div style={styles.manualCard}>
              <h4 style={styles.manualTitle}>{t("integrity.manual.steps.compareHashes.title")}</h4>
              <div style={styles.codeBlock}>
                <code style={styles.codeText}>
                  cat latest.json | jq -r '.sha256'
                </code>
              </div>
              <p style={styles.manualNote}>
                {t("integrity.manual.steps.compareHashes.note")}
              </p>
            </div>
          </div>
        </section>

        {/* API Verification */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("integrity.api.title")}</h2>
          <p style={styles.sectionLead}>
            {t("integrity.api.lead")}
          </p>

          <div style={styles.apiGrid}>
            <div style={styles.apiCard}>
              <h4 style={styles.apiTitle}>{t("integrity.api.endpointLatest.title")}</h4>
              <div style={styles.apiMethod}>GET</div>
              <div style={styles.codeBlock}>
                <code style={styles.codeText}>{LATEST_POINTER_URL}</code>
              </div>
              <p style={styles.apiDesc}>
                {t("integrity.api.endpointLatest.desc")}
              </p>
            </div>

            <div style={styles.apiCard}>
              <h4 style={styles.apiTitle}>{t("integrity.api.examplePython.title")}</h4>
              <div style={styles.codeBlock}>
                <code style={styles.codeText}>{`import hashlib, requests

# Download pointer
r = requests.get("${LATEST_POINTER_URL}")
pointer = r.json()

# Download snapshot
snapshot_url = "${MINIO_PUBLIC_ROOT}" + pointer["object"]
snapshot = requests.get(snapshot_url).content

# Compute hash
computed = hashlib.sha256(snapshot).hexdigest()
expected = pointer["sha256"]

# Verify
assert computed == expected, "Hash mismatch!"`}</code>
              </div>
            </div>

            <div style={styles.apiCard}>
              <h4 style={styles.apiTitle}>{t("integrity.api.exampleJavaScript.title")}</h4>
              <div style={styles.codeBlock}>
                <code style={styles.codeText}>{`async function verify() {
  // Fetch pointer
  const r = await fetch("${LATEST_POINTER_URL}");
  const pointer = await r.json();
  
  // Fetch snapshot
  const url = "${MINIO_PUBLIC_ROOT}" + pointer.object;
  const snapshot = await fetch(url);
  const buf = await snapshot.arrayBuffer();
  
  // Compute SHA-256
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const computed = Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  
  // Verify
  return computed === pointer.sha256;
}`}</code>
              </div>
            </div>
          </div>
        </section>

        {/* Evidence Verification */}
        <section style={styles.section}>
          <h2 style={styles.h2}>{t("integrity.evidence.title")}</h2>
          <p style={styles.sectionLead}>
            {t("integrity.evidence.lead")}
          </p>

          <div style={styles.evidenceGrid}>
            <div style={styles.evidenceCard}>
              <h4 style={styles.evidenceTitle}>{t("integrity.evidence.cards.excerpts.title")}</h4>
              <p style={styles.evidenceText}>
                {t("integrity.evidence.cards.excerpts.text")}
              </p>
            </div>

            <div style={styles.evidenceCard}>
              <h4 style={styles.evidenceTitle}>{t("integrity.evidence.cards.uris.title")}</h4>
              <p style={styles.evidenceText}>
                {t("integrity.evidence.cards.uris.text")}
              </p>
            </div>

            <div style={styles.evidenceCard}>
              <h4 style={styles.evidenceTitle}>{t("integrity.evidence.cards.chain.title")}</h4>
              <p style={styles.evidenceText}>
                {t("integrity.evidence.cards.chain.text")}
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "80px 20px",
  },
  hero: {
    marginBottom: "80px",
    textAlign: "center",
  },
  eyebrow: {
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "#2F81F7",
    marginBottom: "16px",
  },
  h1: {
    fontSize: "48px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "20px",
    lineHeight: "1.1",
  },
  lead: {
    fontSize: "18px",
    color: "#8B949E",
    lineHeight: "1.7",
    maxWidth: "800px",
    margin: "0 auto",
  },
  section: {
    marginBottom: "80px",
    backgroundColor: "#11161C",
    padding: "60px 20px",
    borderRadius: "16px",
  },
  h2: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "20px",
    textAlign: "center",
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
  },
  sectionLead: {
    fontSize: "17px",
    color: "#C9D1D9",
    lineHeight: "1.6",
    textAlign: "center",
    maxWidth: "700px",
    margin: "0 auto 40px",
    fontWeight: "500",
  },
  pointerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },
  pointerCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 4px 12px rgba(47, 129, 247, 0.2)",
  },
  pointerLabel: {
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "#8B949E",
    marginBottom: "12px",
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#C9D1D9",
  },
  metaSubtle: {
    marginTop: "8px",
    fontSize: "12px",
    color: "#8B949E",
  },
  badge: {
    display: "inline-block",
    marginTop: "12px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: "600",
    backgroundColor: "#1E2630",
    color: "#3FB950",
    borderRadius: "6px",
  },
  controls: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  button: {
    display: "inline-block",
    padding: "14px 28px",
    fontSize: "15px",
    fontWeight: "600",
    border: "1px solid transparent",
    borderRadius: "8px",
    cursor: "pointer",
    textDecoration: "none",
    textAlign: "center",
    transition: "all 0.2s ease",
  },
  buttonPrimary: {
    backgroundColor: "#2F81F7",
    color: "#C9D1D9",
  },
  buttonSecondary: {
    backgroundColor: "#1E2630",
    color: "#C9D1D9",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  resultCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "16px",
    padding: "32px",
    textAlign: "center",
    boxShadow: "0 6px 16px rgba(7, 11, 20, 0.08)",
  },
  resultTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#C9D1D9",
    marginBottom: "20px",
  },
  flowGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "24px",
  },
  flowCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
    textAlign: "center",
    position: "relative",
  },
  flowNumber: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#2F81F7",
    color: "#0B0E11",
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "16px",
  },
  flowTitle: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  flowText: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
  },
  whyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "24px",
  },
  whyCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
    textAlign: "center",
  },
  whyIcon: {
    fontSize: "40px",
    marginBottom: "16px",
  },
  whyTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  whyText: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
  },
  manualGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "20px",
  },
  manualCard: {
    backgroundColor: "#1E2630",
    border: "1px solid #2F81F7",
    borderRadius: "12px",
    padding: "24px",
  },
  manualTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  manualNote: {
    fontSize: "13px",
    color: "#8B949E",
    marginTop: "12px",
    fontStyle: "italic",
  },
  apiGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "24px",
  },
  apiCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #2F81F7",
    borderRadius: "12px",
    padding: "28px",
  },
  apiTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  apiMethod: {
    display: "inline-block",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: "700",
    backgroundColor: "#1E2630",
    color: "#3FB950",
    borderRadius: "6px",
    marginBottom: "12px",
  },
  apiDesc: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
    marginTop: "12px",
  },
  evidenceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
  },
  evidenceCard: {
    backgroundColor: "#1E2630",
    border: "2px solid #D64545",
    borderRadius: "12px",
    padding: "28px",
  },
  evidenceTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#C9D1D9",
    marginBottom: "12px",
  },
  evidenceText: {
    fontSize: "14px",
    color: "#8B949E",
    lineHeight: "1.6",
  },
  codeBlock: {
    backgroundColor: "#0B0E11",
    border: "1px solid #2F81F7",
    borderRadius: "8px",
    padding: "16px",
    overflow: "auto",
  },
  codeText: {
    fontFamily: "monospace",
    fontSize: "13px",
    color: "#C9D1D9",
    lineHeight: "1.6",
    wordBreak: "break-all",
    whiteSpace: "pre-wrap",
  },
  inlineCode: {
    fontFamily: "monospace",
    fontSize: "13px",
    color: "#2F81F7",
    backgroundColor: "#0B0E11",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  loading: {
    fontSize: "14px",
    color: "#8B949E",
  },
  error: {
    fontSize: "14px",
    color: "#D64545",
  },
};

