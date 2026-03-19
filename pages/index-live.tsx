import Layout from "../components/Layout";
import SeoHead from "../components/SeoHead";
import DataTable from "../components/DataTable";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "../lib/useTranslationStub";

export default function IndexLive() {
  const { t } = useTranslation("common");
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSnapshot = useCallback(async () => {
    let active = true;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/index/latest", { cache: "no-store" });
      if (!response.ok) throw new Error(`Snapshot unavailable (${response.status})`);
      const payload = await response.json();
      if (!active) return;
      setSnapshot(payload?.snapshot || payload || null);
    } catch (err) {
      if (!active) return;
      setError(err instanceof Error ? err.message : "Snapshot could not be loaded.");
      setSnapshot(null);
    } finally {
      if (active) setLoading(false);
    }

    return () => { active = false; };
  }, []);

  useEffect(() => {
    const cleanup = loadSnapshot();
    return () => { cleanup?.then((fn) => fn?.()); };
  }, [loadSnapshot]);

  return (
    <>
      <SeoHead
        title={t("indexLive.meta.title")}
        description={t("indexLive.meta.description")}
      />
      <Layout>
        <div className="page-header" suppressHydrationWarning>
          <h1>{t("indexLive.title")}</h1>
          <p>{t("indexLive.description")}</p>
        </div>

        {loading && (
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "1rem 1.25rem",
              borderRadius: "0.75rem",
              background: "rgba(0,212,198,0.06)",
              border: "1px solid rgba(0,212,198,0.15)",
              color: "#94a3b8",
              fontSize: "0.875rem",
            }}>
              <span style={{
                display: "inline-block",
                width: "1rem",
                height: "1rem",
                borderRadius: "50%",
                border: "2px solid rgba(0,212,198,0.4)",
                borderTopColor: "#00d4c6",
                animation: "spin 0.8s linear infinite",
              }} />
              <span>Snapshot syncing…</span>
            </div>
            {[1,2,3,4,5].map((i) => (
              <div key={i} style={{
                height: "2.5rem",
                borderRadius: "0.5rem",
                background: "rgba(255,255,255,0.04)",
                marginTop: "0.5rem",
                animation: "pulse 1.4s ease-in-out infinite",
                animationDelay: `${i * 0.08}s`,
              }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div style={{
            marginBottom: "1.5rem",
            padding: "1.25rem",
            borderRadius: "0.75rem",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
          }}>
            <p style={{ color: "#fca5a5", fontWeight: 600, marginBottom: "0.25rem" }}>
              Snapshot unavailable
            </p>
            <p style={{ color: "#94a3b8", fontSize: "0.8rem", marginBottom: "0.75rem" }}>
              {error} — The data pipeline may be updating. Please try again in a moment.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                onClick={loadSnapshot}
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: "0.5rem",
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.35)",
                  color: "#fca5a5",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                Retry
              </button>
              <a
                href="mailto:support@gtixt.com?subject=Snapshot%20load%20error"
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: "0.5rem",
                  background: "transparent",
                  border: "1px solid rgba(148,163,184,0.2)",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  textDecoration: "none",
                }}
              >
                Report incident
              </a>
            </div>
          </div>
        )}

        {!loading && !error && (
          <DataTable records={snapshot?.records || []} />
        )}
      </Layout>
    </>
  );
}
