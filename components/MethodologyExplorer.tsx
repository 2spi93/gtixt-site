import { useEffect, useMemo, useState } from "react";
import styles from "../styles/methodology.module.css";

type Spec = {
  schema_version: string;
  global_formula?: string;
  na_policy?: {
    na_value: number;
    pillar_na_rate_review_threshold: number;
    firm_na_rate_review_threshold: number;
  };
  weights?: Record<string, number>;
  hierarchy?: Record<string, string[]>;
  pillars?: Record<
    string,
    {
      label?: string;
      description?: string;
      metrics: Record<
        string,
        {
          type: string;
          score_map: any;
          bins?: number[];
          fallback?: string[];
          notes?: string;
        }
      >;
    }
  >;
  jurisdiction_matrix_v1?: any;
};

export default function MethodologyExplorer({ specUrl }: { specUrl: string }) {
  const [spec, setSpec] = useState<Spec | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [activePillar, setActivePillar] = useState<string | null>(null);
  const [activeMetric, setActiveMetric] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setErr(null);
      try {
        const r = await fetch(specUrl, { cache: "no-store" });
        if (!r.ok) throw new Error(`spec HTTP ${r.status}`);
        const j = (await r.json()) as Spec;
        if (cancelled) return;

        setSpec(j);

        const firstPillar = j.pillars ? Object.keys(j.pillars)[0] : null;
        setActivePillar(firstPillar);
        setActiveMetric(firstPillar ? Object.keys(j.pillars![firstPillar].metrics)[0] : null);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load spec");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [specUrl]);

  const pillarKeys = useMemo(() => (spec?.pillars ? Object.keys(spec.pillars) : []), [spec]);
  const metrics = useMemo(() => {
    if (!spec?.pillars || !activePillar) return null;
    return spec.pillars[activePillar]?.metrics || null;
  }, [spec, activePillar]);

  const metricKeys = useMemo(() => (metrics ? Object.keys(metrics) : []), [metrics]);

  const metric = useMemo(() => {
    if (!metrics || !activeMetric) return null;
    return metrics[activeMetric] || null;
  }, [metrics, activeMetric]);

  if (err) {
    return (
      <div className={styles.explorerError}>
        <strong>Explorer error:</strong> {err}
      </div>
    );
  }

  if (!spec) {
    return <div className={styles.explorerLoading}>Loading scoring spec…</div>;
  }

  return (
    <div className={styles.explorer}>
      <div className={styles.explorerTop}>
        <div className={styles.specMeta}>
          <div className={styles.specTitle}>Spec</div>
          <div className={styles.specLine}>
            <span className={styles.muted}>schema_version</span>{" "}
            <code className={styles.code}>{spec.schema_version}</code>
          </div>
          {spec.global_formula ? (
            <div className={styles.specLine}>
              <span className={styles.muted}>formula</span>{" "}
              <code className={styles.code}>{spec.global_formula}</code>
            </div>
          ) : null}
        </div>

        <div className={styles.naBox}>
          <div className={styles.specTitle}>NA Policy</div>
          <div className={styles.naGrid}>
            <LabelValue label="na_value" value={spec.na_policy?.na_value ?? "—"} />
            <LabelValue label="pillar_review_thr" value={spec.na_policy?.pillar_na_rate_review_threshold ?? "—"} />
            <LabelValue label="firm_review_thr" value={spec.na_policy?.firm_na_rate_review_threshold ?? "—"} />
          </div>
        </div>
      </div>

      <div className={styles.explorerBody}>
        <div className={styles.col}>
          <div className={styles.colHead}>Pillars</div>
          <div className={styles.list}>
            {pillarKeys.map((k) => {
              const w = spec.weights?.[k];
              const isActive = k === activePillar;
              return (
                <button
                  key={k}
                  className={`${styles.listItem} ${isActive ? styles.active : ""}`}
                  onClick={() => {
                    setActivePillar(k);
                    const first = Object.keys(spec.pillars![k].metrics)[0] || null;
                    setActiveMetric(first);
                  }}
                >
                  <div className={styles.listItemTop}>
                    <span className={styles.listKey}>{k}</span>
                    <span className={styles.pillWeight}>{typeof w === "number" ? `${Math.round(w * 100)}%` : "—"}</span>
                  </div>
                  <div className={styles.listItemSub}>
                    {spec.pillars?.[k]?.label || spec.pillars?.[k]?.description || "—"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.colHead}>Metrics</div>
          <div className={styles.list}>
            {metricKeys.map((m) => {
              const isActive = m === activeMetric;
              const meta = metrics?.[m];
              return (
                <button
                  key={m}
                  className={`${styles.listItem} ${isActive ? styles.active : ""}`}
                  onClick={() => setActiveMetric(m)}
                >
                  <div className={styles.listItemTop}>
                    <span className={styles.listKey}>{m}</span>
                    <span className={styles.metricType}>{meta?.type || "—"}</span>
                  </div>
                  <div className={styles.listItemSub}>
                    {meta?.notes || (meta?.fallback?.length ? `fallbacks: ${meta.fallback.join(", ")}` : "—")}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.detail}>
          <div className={styles.colHead}>Details</div>

          {!metric || !activeMetric ? (
            <div className={styles.detailEmpty}>Select a metric to inspect its mapping and fallbacks.</div>
          ) : (
            <div className={styles.detailBody}>
              <div className={styles.detailRow}>
                <div className={styles.muted}>metric</div>
                <code className={styles.code}>{activeMetric}</code>
              </div>
              <div className={styles.detailRow}>
                <div className={styles.muted}>type</div>
                <code className={styles.code}>{metric.type}</code>
              </div>

              <div className={styles.detailBlock}>
                <div className={styles.detailLabel}>score_map</div>
                <pre className={styles.pre}>{JSON.stringify(metric.score_map, null, 2)}</pre>
              </div>

              {metric.bins?.length ? (
                <div className={styles.detailBlock}>
                  <div className={styles.detailLabel}>bins</div>
                  <pre className={styles.pre}>{JSON.stringify(metric.bins, null, 2)}</pre>
                </div>
              ) : null}

              {metric.fallback?.length ? (
                <div className={styles.detailBlock}>
                  <div className={styles.detailLabel}>fallback chain</div>
                  <pre className={styles.pre}>{JSON.stringify(metric.fallback, null, 2)}</pre>
                </div>
              ) : null}

              {spec.hierarchy?.[activeMetric]?.length ? (
                <div className={styles.detailBlock}>
                  <div className={styles.detailLabel}>hierarchy override</div>
                  <pre className={styles.pre}>{JSON.stringify(spec.hierarchy[activeMetric], null, 2)}</pre>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LabelValue({ label, value }: { label: string; value: any }) {
  return (
    <div className={styles.naCell}>
      <div className={styles.muted}>{label}</div>
      <div className={styles.naValue}>
        <code className={styles.code}>{String(value)}</code>
      </div>
    </div>
  );
}
