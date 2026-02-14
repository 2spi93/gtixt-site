'use client';

import Head from "next/head";
import InstitutionalHeader from "../components/InstitutionalHeader";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useIsMounted } from "../lib/useIsMounted";
import { useTranslation } from "../lib/useTranslationStub";
import { ScoreDistributionChart } from "../components/ScoreDistributionChart";
import {
  parseNumber,
  normalizeScore,
  pickFirst,
  inferJurisdictionFromUrl,
  formatConfidenceLabel,
} from "../lib/dataUtils";
import type { NormalizedFirm } from "../lib/types";

interface Firm extends Partial<Omit<NormalizedFirm, 'confidence'>> {
  score?: number;
  confidence?: 'high' | 'medium' | 'low' | 'unknown' | number;
}

interface GlobalStats {
  totalFirms: number;
  avgScore: number;
  medianScore: number;
  passRate: number;
  snapshotDate: string;
  credibilityRatio?: number | null;
}

interface LatestPointer {
  snapshot_uri?: string;
  object?: string;
}

export default function Rankings() {
  const isMounted = useIsMounted();
  const { t } = useTranslation("common");
  const [firms, setFirms] = useState<Firm[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [sortBy, setSortBy] = useState<"score" | "name">("score");
  const [filterConfidence, setFilterConfidence] = useState<"all" | "high" | "medium" | "low">("all");
  const [lastSync, setLastSync] = useState<string>("—");
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "error">("idle");
  const [isLoading, setIsLoading] = useState(true);
  const lastPointerRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const pollInterval = process.env.NEXT_PUBLIC_POLL_INTERVAL
      ? parseInt(process.env.NEXT_PUBLIC_POLL_INTERVAL, 10)
      : 5 * 60 * 1000;

    const fetchLatestPointer = async () => {
      const res = await fetch('/api/latest-pointer', { cache: 'no-store' });
      if (!res.ok) throw new Error(`latest-pointer HTTP ${res.status}`);
      return res.json();
    };

    const fetchRankings = async () => {
      const apiRes = await fetch('/api/firms/?limit=200', { cache: 'no-store' });
      if (!apiRes.ok) throw new Error(`API firms HTTP ${apiRes.status}`);
      return apiRes.json();
    };

    const updateFromApiData = (apiData: any) => {
      // Transform records to match Firm interface
      const transformedRecords = apiData.firms.map((r: any) => {
        const score = normalizeScore(
          r.score_0_100 ?? r.score ?? r.integrity_score ?? r.metric_scores?.score_0_100 ?? r.metric_scores?.score
        );
        const firmName = pickFirst(r.name, r.firm_name, r.brand_name, r.firm_id, "Unknown firm");
        const jurisdiction = pickFirst(
          r.jurisdiction,
          r.headquarters,
          r.legal?.jurisdiction,
          r.country,
          r.legal?.country,
          inferJurisdictionFromUrl(r.website_root || r.website || r.homepage || r.site)
        );
        return {
          firm_id: r.firm_id,
          firm_name: firmName,
          name: firmName,
          score: score ?? 0,
          score_0_100: score ?? r.score_0_100,
          pillar_scores: r.pillar_scores,
          status: r.gtixt_status || r.status || r.status_gtixt,
          confidence: formatConfidenceLabel(r.confidence ?? r.metric_scores?.confidence),
          jurisdiction: jurisdiction || "—",
        } as Firm;
      });

      // Deduplicate firms by firm_id (or firm_name if no id)
      const uniqueFirms = Array.from(
        new Map(
          transformedRecords.map(firm => [
            firm.firm_id || firm.firm_name,
            firm
          ])
        ).values()
      ) as Firm[];

      console.log(`[Rankings] Total records: ${transformedRecords.length}, Unique firms: ${uniqueFirms.length}`);

      setFirms(uniqueFirms);

      // Calculate global statistics
      const scores = uniqueFirms.map(f => f.score).filter(s => s > 0);
      const sortedScores = [...scores].sort((a, b) => a - b);
      const passCount = uniqueFirms.filter(
        (firm) => (firm.status || '').toLowerCase() === 'pass'
      ).length;
      const scoreCount = scores.length;
      const totalFirms = apiData.total || uniqueFirms.length;
      const naRates = uniqueFirms
        .map((f: any) => (typeof f.na_rate === 'number' ? f.na_rate : null))
        .filter((v: number | null): v is number => v !== null);
      const avgNaRate = naRates.length
        ? naRates.reduce((a, b) => a + b, 0) / naRates.length
        : null;
      const credibilityRatio = avgNaRate !== null
        ? Math.max(0, Math.min(100, Math.round((100 - avgNaRate) * 10) / 10))
        : null;
      const avgScore = scoreCount
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scoreCount) * 100) / 100
        : 0;
      const medianScore = scoreCount
        ? sortedScores[Math.floor(sortedScores.length / 2)]
        : 0;
      const passRate = totalFirms ? Math.round((passCount / totalFirms) * 100) : 0;

      setStats({
        totalFirms,
        avgScore,
        medianScore,
        passRate,
        snapshotDate: new Date().toISOString().split('T')[0],
        credibilityRatio,
      });
    };

    const tick = async () => {
      if (cancelled) return;
      setSyncStatus('syncing');
      try {
        const pointer = await fetchLatestPointer();
        const pointerKey = pointer?.sha256 || pointer?.object;
        if (!pointerKey) throw new Error('Invalid latest pointer');

        const shouldFetch = !lastPointerRef.current || lastPointerRef.current !== pointerKey;
        if (shouldFetch) {
          const apiData = await fetchRankings();
          if (!apiData.success || !Array.isArray(apiData.firms)) {
            throw new Error('Invalid API response');
          }
          updateFromApiData(apiData);
          lastPointerRef.current = pointerKey;
        }

        setLastSync(new Date().toLocaleTimeString());
        setSyncStatus('idle');
      } catch (error) {
        console.error("Failed to refresh rankings:", error);
        setSyncStatus('error');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    tick();
    const intervalId = setInterval(tick, pollInterval);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  const sortedFirms = [...firms]
    .filter((f) => filterConfidence === "all" || f.confidence?.toString() === filterConfidence)
    .sort((a, b) => (sortBy === "score" ? (b.score ?? 0) - (a.score ?? 0) : ((a.firm_name ?? a.name) || "").localeCompare((b.firm_name ?? b.name) || "")));

  return (
    <>
      <Head>
        <title>{t("rankings.metaTitle")}</title>
        <meta name="description" content={t("rankings.metaDescription")} />
      </Head>

      <InstitutionalHeader breadcrumbs={isMounted ? [{ label: t("rankings.breadcrumb"), href: "/rankings" }] : []} />

      <main id="main-content" style={styles.container}>
        {/* Sync Status Indicator */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: syncStatus === 'error' ? '#D64545' : syncStatus === 'syncing' ? '#F0883E' : '#3FB950',
          color: '#fff',
          zIndex: 10,
        }}>
          {syncStatus === 'syncing' && (
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
          )}
          {syncStatus === 'error' && '⚠️'}
          {syncStatus === 'idle' && '✓'}
          {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'error' ? 'Sync Error' : `Last sync: ${lastSync}`}
        </div>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.eyebrow}>{t("rankings.eyebrow")}</div>
          <h1 style={styles.h1}>{t("rankings.title")}</h1>
          <p style={styles.lead}>
            {t("rankings.lead", { count: stats?.totalFirms || 0 })}
          </p>
        </section>

        {/* Global Statistics */}
        {stats && (
          <>
            <section style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{stats.totalFirms}</div>
                <div style={styles.statLabel}>{t("rankings.stats.totalFirms")}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{stats.avgScore}</div>
                <div style={styles.statLabel}>{t("rankings.stats.avgScore")}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{stats.passRate}%</div>
                <div style={styles.statLabel}>{t("rankings.stats.passRate")}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{stats.medianScore}</div>
                <div style={styles.statLabel}>{t("rankings.stats.medianScore")}</div>
              </div>
            </section>

            <ScoreDistributionChart
              avgScore={stats.avgScore}
              medianScore={stats.medianScore}
              passRate={stats.passRate}
              totalFirms={stats.totalFirms}
              credibilityRatio={stats.credibilityRatio}
            />
          </>
        )}

        {/* Filters & Controls */}
        <section style={styles.controls}>
          <div style={styles.filterGroup}>
            <label htmlFor="rankings-sort-by" style={styles.label}>{t("rankings.controls.sortBy")}</label>
            <select
              id="rankings-sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "score" | "name")}
              style={styles.select}
            >
              <option value="score">{t("rankings.controls.sortScore")}</option>
              <option value="name">{t("rankings.controls.sortName")}</option>
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label htmlFor="rankings-filter-confidence" style={styles.label}>{t("rankings.controls.filterBy")}</label>
            <select
              id="rankings-filter-confidence"
              value={filterConfidence}
              onChange={(e) => setFilterConfidence(e.target.value as any)}
              style={styles.select}
            >
              <option value="all">{t("rankings.controls.filterAll")}</option>
              <option value="high">{t("rankings.controls.filterHigh")}</option>
              <option value="medium">{t("rankings.controls.filterMedium")}</option>
              <option value="low">{t("rankings.controls.filterLow")}</option>
            </select>
          </div>

          <div style={styles.resultCount}>
            {!isLoading && <span>{t("rankings.controls.resultCount", { count: sortedFirms.length })}</span>}
          </div>
        </section>

        {/* Rankings Table */}
        {isLoading ? (
          <div style={styles.loading}>{t("rankings.loading")}</div>
        ) : sortedFirms.length > 0 ? (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.headerRow}>
                  <th style={styles.th}>{t("rankings.table.rank")}</th>
                  <th style={styles.th}>{t("rankings.table.firmName")}</th>
                  <th style={styles.th}>{t("rankings.table.score")}</th>
                  <th style={styles.th}>{t("rankings.table.tier")}</th>
                  <th style={styles.th}>{t("rankings.table.confidence")}</th>
                  <th style={styles.th}>{t("rankings.table.jurisdiction")}</th>
                  <th style={styles.th}>{t("rankings.table.action")}</th>
                </tr>
              </thead>
              <tbody>
                {sortedFirms.map((firm, idx) => (
                  <tr key={`${firm.firm_id || firm.firm_name}-${idx}`} style={styles.row}>
                    <td style={styles.td}>
                      <span style={styles.rank}>{idx + 1}</span>
                    </td>
                    <td style={styles.tdName}>
                      <strong style={styles.firmName}>{firm.firm_name || firm.name || t("rankings.table.unknownFirm")}</strong>
                    </td>
                    <td style={styles.tdScore}>
                      <span style={getScoreStyle(firm.score ?? 0)}>
                        {(firm.score ?? 0) > 0 ? (firm.score ?? 0).toFixed(2) : "—"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={getTierBadge(firm.score ?? 0)}>
                        {getTierLabel(firm.score ?? 0)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={getConfidenceBadge((firm.confidence ?? "unknown") as string)}>
                        {firm.confidence === "unknown" || !firm.confidence
                          ? "Unknown"
                          : (firm.confidence as string).charAt(0).toUpperCase() + (firm.confidence as string).slice(1)}
                      </span>
                    </td>
                    <td style={styles.td}>{firm.jurisdiction}</td>
                    <td style={styles.td}>
                      <Link
                        href={`/firm/${encodeURIComponent(firm.firm_id || firm.firm_name || firm.name || "")}`}
                        style={styles.viewBtn}
                      >
                        {t("rankings.table.viewTearsheet")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.empty}>{t("rankings.noResults")}</div>
        )}

        {/* Methodology Note */}
        <section style={styles.note}>
          <h2 style={styles.h2}>{t("rankings.note.title")}</h2>
          <p style={styles.noteText}>
            {t("rankings.note.textPrefix")}
            <strong> {t("rankings.note.textHighlight")}</strong>
            {t("rankings.note.textSuffix")}
          </p>
          <Link href="/methodology" style={styles.methodologyLink}>
            {t("rankings.note.cta")}
          </Link>
        </section>
      </main>

      <style jsx>{`
        @media (max-width: 768px) {
          table { font-size: 12px; }
          th, td { padding: 8px 4px; }
        }
      `}</style>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "2rem 1rem",
  },
  hero: {
    marginBottom: "3rem",
  },
  eyebrow: {
    fontSize: "0.75rem",
    color: "#00D4C2",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    marginBottom: "0.5rem",
    fontWeight: 700,
  },
  h1: {
    fontSize: "2.5rem",
    color: "#D0D7DE",
    marginBottom: "1rem",
    fontWeight: 900,
    letterSpacing: "-0.02em",
  },
  lead: {
    fontSize: "1rem",
    color: "rgba(234, 240, 255, 0.8)",
    maxWidth: "70ch",
    lineHeight: 1.6,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.5rem",
    marginBottom: "3rem",
  },
  statCard: {
    padding: "1.5rem",
    borderRadius: "16px",
    border: "1px solid rgba(0, 212, 194, 0.25)",
    background: "rgba(0, 212, 194, 0.08)",
    textAlign: "center",
  },
  statValue: {
    fontSize: "2rem",
    fontWeight: 900,
    color: "#00D4C2",
    marginBottom: "0.5rem",
  },
  statLabel: {
    fontSize: "0.875rem",
    color: "rgba(234, 240, 255, 0.7)",
    fontWeight: 500,
  },
  controls: {
    display: "flex",
    gap: "1.5rem",
    marginBottom: "2rem",
    padding: "1.5rem",
    background: "rgba(208, 215, 222, 0.02)",
    borderRadius: "14px",
    border: "1px solid rgba(208, 215, 222, 0.08)",
    flexWrap: "wrap",
    alignItems: "flex-end",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.75rem",
    color: "rgba(234, 240, 255, 0.65)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: 700,
  },
  select: {
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    border: "1px solid rgba(208, 215, 222, 0.12)",
    background: "rgba(7, 11, 18, 0.8)",
    color: "#D0D7DE",
    fontSize: "0.875rem",
    cursor: "pointer",
    minWidth: "180px",
  },
  resultCount: {
    color: "rgba(234, 240, 255, 0.6)",
    fontSize: "0.875rem",
  },
  tableWrapper: {
    overflowX: "auto",
    marginBottom: "3rem",
    borderRadius: "14px",
    border: "1px solid rgba(208, 215, 222, 0.08)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "rgba(5, 8, 18, 0.5)",
  },
  headerRow: {
    background: "rgba(0, 212, 194, 0.12)",
    borderBottom: "2px solid rgba(0, 212, 194, 0.3)",
  },
  th: {
    padding: "1.25rem",
    textAlign: "left" as const,
    fontSize: "0.75rem",
    color: "#00D4C2",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: 800,
  },
  row: {
    borderBottom: "1px solid rgba(208, 215, 222, 0.05)",
    transition: "background 0.2s ease",
  },
  td: {
    padding: "1rem 1.25rem",
    fontSize: "0.875rem",
    color: "rgba(234, 240, 255, 0.85)",
  },
  tdName: {
    padding: "1rem 1.25rem",
    fontSize: "0.875rem",
  },
  tdScore: {
    padding: "1rem 1.25rem",
    fontSize: "0.875rem",
    fontWeight: 700,
  },
  rank: {
    display: "inline-block",
    width: "2rem",
    height: "2rem",
    lineHeight: "2rem",
    textAlign: "center" as const,
    borderRadius: "50%",
    background: "rgba(0, 212, 194, 0.15)",
    color: "#00D4C2",
    fontWeight: 700,
    fontSize: "0.875rem",
  },
  firmName: {
    color: "#D0D7DE",
  },
  viewBtn: {
    color: "#00D4C2",
    textDecoration: "none",
    cursor: "pointer",
    transition: "color 0.2s",
    fontWeight: 600,
    fontSize: "0.875rem",
  },
  loading: {
    padding: "3rem 2rem",
    textAlign: "center",
    color: "rgba(234, 240, 255, 0.6)",
    fontSize: "1rem",
  },
  empty: {
    padding: "3rem 2rem",
    textAlign: "center",
    color: "rgba(234, 240, 255, 0.6)",
    fontSize: "1rem",
  },
  note: {
    padding: "2rem",
    background: "rgba(26, 115, 232, 0.08)",
    borderRadius: "14px",
    border: "1px solid rgba(26, 115, 232, 0.2)",
  },
  h2: {
    fontSize: "1.1rem",
    color: "#D0D7DE",
    marginBottom: "0.75rem",
    fontWeight: 800,
    margin: "0 0 0.75rem 0",
  },
  noteText: {
    fontSize: "0.875rem",
    color: "rgba(234, 240, 255, 0.8)",
    lineHeight: 1.6,
    marginBottom: "1rem",
  },
  methodologyLink: {
    color: "#1A73E8",
    textDecoration: "none",
    cursor: "pointer",
    fontWeight: 700,
    transition: "color 0.2s",
  },
};

function getScoreStyle(score: number): React.CSSProperties {
  let color = "#D0D7DE";
  let bg = "transparent";
  
  if (score >= 80) {
    color = "#00D4C2";
    bg = "rgba(0, 212, 194, 0.1)";
  } else if (score >= 60) {
    color = "#FFD700";
    bg = "rgba(255, 215, 0, 0.1)";
  } else if (score >= 40) {
    color = "#FF9500";
    bg = "rgba(255, 149, 0, 0.1)";
  } else {
    color = "#FF6B6B";
    bg = "rgba(255, 107, 107, 0.1)";
  }

  return {
    color,
    background: bg,
    padding: "0.5rem 0.75rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 700,
    display: "inline-block",
  };
}

function getTierLabel(score: number): string {
  if (score >= 80) return "Tier 1";
  if (score >= 60) return "Tier 2";
  if (score >= 40) return "Tier 3";
  return "Tier 4";
}

function getTierBadge(score: number): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    padding: "0.35rem 0.75rem",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 700,
    textTransform: "uppercase",
    display: "inline-block",
  };

  if (score >= 80)
    return { ...baseStyle, background: "rgba(0, 212, 194, 0.2)", color: "#00D4C2" };
  if (score >= 60)
    return { ...baseStyle, background: "rgba(255, 215, 0, 0.2)", color: "#FFD700" };
  if (score >= 40)
    return { ...baseStyle, background: "rgba(255, 149, 0, 0.2)", color: "#FF9500" };
  return { ...baseStyle, background: "rgba(255, 107, 107, 0.2)", color: "#FF6B6B" };
}

function getConfidenceBadge(confidence: string): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    padding: "0.35rem 0.75rem",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 700,
    textTransform: "uppercase",
    display: "inline-block",
  };

  if (confidence === "high")
    return { ...baseStyle, background: "rgba(0, 212, 194, 0.2)", color: "#00D4C2" };
  if (confidence === "medium")
    return { ...baseStyle, background: "rgba(255, 215, 0, 0.2)", color: "#FFD700" };
  if (confidence === "low")
    return { ...baseStyle, background: "rgba(255, 107, 107, 0.2)", color: "#FF6B6B" };
  return { ...baseStyle, background: "rgba(208, 215, 222, 0.2)", color: "#D0D7DE" };
}
