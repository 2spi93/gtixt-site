import Head from "next/head";
import InstitutionalHeader from "../components/InstitutionalHeader";
import Link from "next/link";
import type { GetStaticProps } from 'next';
import { useState, useEffect, useRef } from "react";

import { useIsMounted } from "../lib/useIsMounted";
import { useTranslation } from "../lib/useTranslationStub";
import { ScoreDistributionChart } from "../components/ScoreDistributionChart";
import {
  normalizeScore,
  pickFirst,
  inferJurisdictionFromUrl,
  formatConfidenceLabel,
} from "../lib/dataUtils";
import type { NormalizedFirm } from "../lib/types";

interface Firm extends Partial<Omit<NormalizedFirm, 'confidence'>> {
  score?: number;
  confidence?: 'high' | 'medium' | 'low' | 'unknown' | number;
  data_completeness?: number;
  data_badge?: string;
}

interface ExcludedFirm {
  firm_id?: string;
  name?: string;
  status?: string;
  gtixt_status?: string;
  jurisdiction?: string;
  reason: 'missing_id' | 'non_firm_id' | 'placeholder' | 'excluded_status';
}

interface GlobalStats {
  totalFirms: number;
  totalUniverse: number;
  excludedCount: number;
  avgScore: number;
  medianScore: number;
  passRate: number;
  snapshotDate: string;
  credibilityRatio?: number | null;
  dataCoverage?: number | null;
}

interface LatestPointer {
  snapshot_uri?: string;
  object?: string;
}

const toCoveragePercent = (value?: number) => {
  if (typeof value !== "number") return "—";
  const percent = Math.round(value * 100);
  return `${percent}%`;
};

const getCoverageBadge = (badge?: string, completeness?: number) => {
  const normalized = badge ? badge.toLowerCase() : undefined;
  if (normalized === "complete" || (typeof completeness === "number" && completeness >= 0.75)) return "complete";
  if (normalized === "partial" || (typeof completeness === "number" && completeness >= 0.45)) return "partial";
  if (normalized === "incomplete" || typeof completeness === "number") return "incomplete";
  return "unknown";
};

const EXCLUSION_LABELS: Record<ExcludedFirm['reason'], string> = {
  missing_id: "Missing firm ID",
  non_firm_id: "Non-firm page",
  placeholder: "Placeholder entry",
  excluded_status: "Excluded status",
};

export default function Rankings({ initialStats }: { initialStats?: GlobalStats | null }) {
  const isMounted = useIsMounted();
  const { t } = useTranslation("common");
  const [firms, setFirms] = useState<Firm[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(initialStats || null);
  const [excludedFirms, setExcludedFirms] = useState<ExcludedFirm[]>([]);
  const [excludedCount, setExcludedCount] = useState<number>(0);
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
      const res = await fetch('/api/latest-pointer/', { cache: 'no-store' });
      if (!res.ok) throw new Error(`latest-pointer HTTP ${res.status}`);
      return res.json();
    };

    const fetchRankings = async () => {
      const apiRes = await fetch('/api/firms/?limit=200', { cache: 'no-store' });
      if (!apiRes.ok) throw new Error(`API firms HTTP ${apiRes.status}`);
      return apiRes.json();
    };

    const updateFromApiData = (apiData: any) => {
      console.log('[Rankings] API data received:', { 
        total: apiData.total, 
        count: apiData.count, 
        firmsLength: apiData.firms?.length 
      });
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
        const completenessRaw = typeof r.data_completeness === "number" ? r.data_completeness : undefined;
        const completeness =
          typeof completenessRaw === "number"
            ? completenessRaw > 1
              ? completenessRaw / 100
              : completenessRaw
            : typeof r.na_rate === "number"
            ? 1 - (r.na_rate > 1 ? r.na_rate / 100 : r.na_rate)
            : undefined;
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
          data_completeness: completeness,
          data_badge: r.data_badge,
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
        (firm) => typeof firm.score === 'number' && firm.score >= 60
      ).length;
      const scoreCount = scores.length;
      const totalFirms = apiData.total || uniqueFirms.length;
        const totalUniverse = apiData.total_all || apiData.total || uniqueFirms.length;
        const excludedTotal = apiData.excluded_count || 0;
      const naRates = uniqueFirms
        .map((f: any) => (typeof f.na_rate === 'number' ? f.na_rate : null))
        .filter((v: number | null): v is number => v !== null);
      const avgNaRate = naRates.length
        ? naRates.reduce((a, b) => a + b, 0) / naRates.length
        : null;
      const credibilityRatio = avgNaRate !== null
        ? Math.max(0, Math.min(100, Math.round((100 - avgNaRate) * 10) / 10))
        : null;
      // Data Coverage = percentage of firms with a valid score
      const firmsWithScores = uniqueFirms.filter(f => typeof f.score === 'number' && f.score > 0).length;
      const avgCoverage = totalFirms > 0
        ? Math.round((firmsWithScores / totalFirms) * 100)
        : null;
      const avgScore = scoreCount
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scoreCount) * 100) / 100
        : 0;
      const medianScore = scoreCount
        ? sortedScores[Math.floor(sortedScores.length / 2)]
        : 0;
      const passRate = totalFirms ? Math.round((passCount / totalFirms) * 100) : 0;

      const newStats = {
        totalFirms,
        totalUniverse,
        excludedCount: excludedTotal,
        avgScore,
        medianScore,
        passRate,
        snapshotDate: new Date().toISOString().split('T')[0],
        credibilityRatio,
        dataCoverage: avgCoverage,
      };
      console.log('[Rankings] Stats calculated:', newStats);
      setStats(newStats);

      setExcludedFirms(Array.isArray(apiData.excluded_firms) ? apiData.excluded_firms : []);
      setExcludedCount(excludedTotal);
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
          console.log('[Rankings] Fetched API data:', { success: apiData.success, firmsIsArray: Array.isArray(apiData.firms) });
          if (!apiData.success || !Array.isArray(apiData.firms)) {
            console.error('[Rankings] Invalid API response:', apiData);
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

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          [data-score="75"] {
            background: linear-gradient(135deg, #00D4C2, #00A896);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          [data-score="60"] {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          [data-score="45"] {
            background: linear-gradient(135deg, #FF9500, #FF6600);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          [data-score="30"] {
            background: linear-gradient(135deg, #FF6B6B, #D64545);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
        ` }} />
        {/* Hero Section */}
        <section style={styles.hero}>
          <div style={styles.eyebrow}>{t("rankings.eyebrow")}</div>
          <h1 style={styles.h1}>{t("rankings.title")}</h1>
          <p style={styles.lead}>
            {t("rankings.lead", { count: stats?.totalFirms || 0 })}
          </p>
        </section>

        {/* How to Read This Index */}
        <section style={styles.howToReadSection} className="how-to-read-section">
          <div style={styles.howToReadHeader}>
            <span style={styles.howToReadIcon}>📊</span>
            <h2 style={styles.howToReadTitle} className="how-to-read-title">{t('howToReadThisIndex')}</h2>
          </div>
          <div style={styles.howToReadGrid} className="how-to-read-grid">
            <div style={styles.howToReadCard} className="how-to-read-card">
              <div style={styles.scoreExample} data-score="75">75+</div>
              <div style={styles.scoreTier}>{t('tierA')}</div>
              <p style={styles.scoreDescription}>
                <strong>{t('institutionalGrade')}:</strong> {t('tierADescription')}
              </p>
            </div>
            <div style={styles.howToReadCard} className="how-to-read-card">
              <div style={styles.scoreExample} data-score="60">60–74</div>
              <div style={styles.scoreTier}>{t('tierB')}</div>
              <p style={styles.scoreDescription}>
                <strong>{t('candidateStatus')}:</strong> {t('tierBDescription')}
              </p>
            </div>
            <div style={styles.howToReadCard} className="how-to-read-card">
              <div style={styles.scoreExample} data-score="45">45–59</div>
              <div style={styles.scoreTier}>{t('tierC')}</div>
              <p style={styles.scoreDescription}>
                <strong>{t('underReview')}:</strong> {t('tierCDescription')}
              </p>
            </div>
            <div style={styles.howToReadCard} className="how-to-read-card">
              <div style={styles.scoreExample} data-score="30">&lt;45</div>
              <div style={styles.scoreTier}>{t('tierD')}</div>
              <p style={styles.scoreDescription}>
                <strong>{t('highRisk')}:</strong> {t('tierDDescription')}
              </p>
            </div>
          </div>
          <p style={styles.howToReadFooter} className="how-to-read-footer">
            {t('scoresCalculatedFrom')} <strong>{t('transparency')} (A)</strong>, <strong>{t('payoutReliability')} (B)</strong>, 
            <strong>{t('riskModel')} (C)</strong>, <strong>{t('legalCompliance')} (D)</strong>, {t('and')} <strong>{t('reputationSupport')} (E)</strong>. 
            {t('dataConfidenceReflects')}
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
              <div style={styles.statCardMuted}>
                <div style={styles.statValue}>{stats.totalUniverse}</div>
                <div style={styles.statLabel}>Universe Firms</div>
              </div>
              <div style={styles.statCardMuted}>
                <div style={styles.statValue}>{stats.excludedCount}</div>
                <div style={styles.statLabel}>Excluded from Index</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{stats.avgScore}</div>
                <div style={styles.statLabel}>{t("rankings.stats.avgScore")}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{stats.dataCoverage === null || stats.dataCoverage === undefined ? "—" : `${stats.dataCoverage}%`}</div>
                <div style={styles.statLabel}>Data Coverage</div>
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

            {excludedCount > 0 && (
              <section style={styles.excludedSection}>
                <div style={styles.excludedHeader}>
                  <div>
                    <h2 style={styles.excludedTitle}>Outside the Index</h2>
                    <p style={styles.excludedSubtitle}>
                      Firms excluded from rankings with explicit reasons.
                    </p>
                  </div>
                  <div style={styles.excludedBadge}>{excludedCount} excluded</div>
                </div>
                <div style={styles.excludedTableWrapper}>
                  <table style={styles.excludedTable}>
                    <thead>
                      <tr>
                        <th style={styles.excludedTh}>Firm</th>
                        <th style={styles.excludedTh}>Reason</th>
                        <th style={styles.excludedTh}>Status</th>
                        <th style={styles.excludedTh}>Jurisdiction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {excludedFirms.map((firm, idx) => (
                        <tr key={`${firm.firm_id || firm.name || 'excluded'}-${idx}`} style={styles.excludedRow}>
                          <td style={styles.excludedTd}>{firm.name || firm.firm_id || "Unknown"}</td>
                          <td style={styles.excludedTd}>
                            <span style={styles.excludedReason}>
                              {EXCLUSION_LABELS[firm.reason] || "Excluded"}
                            </span>
                          </td>
                          <td style={styles.excludedTd}>{firm.status || firm.gtixt_status || "—"}</td>
                          <td style={styles.excludedTd}>{firm.jurisdiction || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
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

        {/* Rankings Table / Mobile Cards */}
        {isLoading ? (
          <div style={styles.loading}>{t("rankings.loading")}</div>
        ) : sortedFirms.length > 0 ? (
          <>
            {/* Desktop: Table */}
            <div style={styles.tableWrapper} className="desktop-table-wrapper">
              <table style={styles.table}>
                <thead>
                  <tr style={styles.headerRow}>
                    <th style={styles.th}>{t("rankings.table.rank")}</th>
                    <th style={styles.th}>{t("rankings.table.firmName")}</th>
                    <th style={styles.th}>{t("rankings.table.score")}</th>
                    <th style={styles.th}>Coverage</th>
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
                        <span
                          style={{
                            ...styles.coverageBadge,
                            ...(getCoverageBadge(firm.data_badge, firm.data_completeness) === "complete"
                              ? styles.coverageBadgeComplete
                              : getCoverageBadge(firm.data_badge, firm.data_completeness) === "partial"
                              ? styles.coverageBadgePartial
                              : getCoverageBadge(firm.data_badge, firm.data_completeness) === "incomplete"
                              ? styles.coverageBadgeIncomplete
                              : styles.coverageBadgeUnknown),
                          }}
                        >
                          {toCoveragePercent(firm.data_completeness)}
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

            {/* Mobile: Cards */}
            <div style={styles.mobileCardsContainer} className="mobile-cards-wrapper">
              {sortedFirms.map((firm, idx) => (
                <Link
                  key={`${firm.firm_id || firm.firm_name}-${idx}`}
                  href={`/firm/${encodeURIComponent(firm.firm_id || firm.firm_name || firm.name || "")}`}
                  style={styles.mobileCard}
                >
                  <div style={styles.mobileCardHeader}>
                    <div style={styles.mobileRank}>{idx + 1}</div>
                    <div style={styles.mobileCardTitle}>{firm.firm_name || firm.name || t("rankings.table.unknownFirm")}</div>
                  </div>
                  <div style={styles.mobileCardBody}>
                    <div style={styles.mobileCardRow}>
                      <span style={styles.mobileLabel}>Score</span>
                      <span style={getScoreStyle(firm.score ?? 0)}>
                        {(firm.score ?? 0) > 0 ? (firm.score ?? 0).toFixed(2) : "—"}
                      </span>
                    </div>
                    <div style={styles.mobileCardRow}>
                      <span style={styles.mobileLabel}>Tier</span>
                      <span style={getTierBadge(firm.score ?? 0)}>
                        {getTierLabel(firm.score ?? 0)}
                      </span>
                    </div>
                    <div style={styles.mobileCardRow}>
                      <span style={styles.mobileLabel}>Coverage</span>
                      <span style={{...styles.coverageBadge, ...(getCoverageBadge(firm.data_badge, firm.data_completeness) === "complete"
                            ? styles.coverageBadgeComplete
                            : getCoverageBadge(firm.data_badge, firm.data_completeness) === "partial"
                            ? styles.coverageBadgePartial
                            : getCoverageBadge(firm.data_badge, firm.data_completeness) === "incomplete"
                            ? styles.coverageBadgeIncomplete
                            : styles.coverageBadgeUnknown)}}>
                        {toCoveragePercent(firm.data_completeness)}
                      </span>
                    </div>
                    <div style={styles.mobileCardRow}>
                      <span style={styles.mobileLabel}>Jurisdiction</span>
                      <span style={styles.mobileValue}>{firm.jurisdiction || "—"}</span>
                    </div>
                  </div>
                  <div style={styles.mobileCardFooter}>
                    View Details →
                  </div>
                </Link>
              ))}
            </div>
          </>
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
          .desktop-table-wrapper { display: none !important; }
          .mobile-cards-wrapper { display: block !important; }
          .how-to-read-section {
            padding: 1.5rem 1rem !important;
            margin-bottom: 2rem !important;
          }
          .how-to-read-title {
            font-size: 1.1rem !important;
          }
          .how-to-read-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          .how-to-read-card {
            padding: 1rem !important;
          }
          .how-to-read-footer {
            font-size: 0.75rem !important;
            line-height: 1.5 !important;
          }
        }
        @media (min-width: 769px) {
          .desktop-table-wrapper { display: block !important; }
          .mobile-cards-wrapper { display: none !important; }
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
  statCardMuted: {
    padding: "1.5rem",
    borderRadius: "16px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    background: "rgba(148, 163, 184, 0.08)",
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
  excludedSection: {
    marginTop: "2.5rem",
    padding: "1.5rem",
    borderRadius: "16px",
    border: "1px solid rgba(208, 215, 222, 0.08)",
    background: "rgba(5, 8, 18, 0.55)",
  },
  excludedHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
    gap: "1rem",
    flexWrap: "wrap",
  },
  excludedTitle: {
    margin: 0,
    fontSize: "1.1rem",
    color: "#D0D7DE",
    fontWeight: 800,
  },
  excludedSubtitle: {
    margin: "0.35rem 0 0 0",
    fontSize: "0.85rem",
    color: "rgba(234, 240, 255, 0.6)",
  },
  excludedBadge: {
    padding: "0.4rem 0.8rem",
    borderRadius: "999px",
    background: "rgba(239, 68, 68, 0.2)",
    color: "#EF4444",
    fontWeight: 700,
    fontSize: "0.8rem",
    border: "1px solid rgba(239, 68, 68, 0.35)",
  },
  excludedTableWrapper: {
    overflowX: "auto",
  },
  excludedTable: {
    width: "100%",
    borderCollapse: "collapse",
  },
  excludedTh: {
    textAlign: "left" as const,
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "rgba(234, 240, 255, 0.6)",
    padding: "0.75rem 0.5rem",
    borderBottom: "1px solid rgba(208, 215, 222, 0.08)",
  },
  excludedRow: {
    borderBottom: "1px solid rgba(208, 215, 222, 0.05)",
  },
  excludedTd: {
    padding: "0.7rem 0.5rem",
    fontSize: "0.85rem",
    color: "rgba(234, 240, 255, 0.8)",
  },
  excludedReason: {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.2rem 0.6rem",
    borderRadius: "999px",
    background: "rgba(245, 158, 11, 0.2)",
    color: "#F59E0B",
    fontWeight: 700,
    fontSize: "0.7rem",
    border: "1px solid rgba(245, 158, 11, 0.3)",
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
  coverageBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "56px",
    padding: "0.35rem 0.65rem",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  coverageBadgeComplete: {
    background: "rgba(16, 185, 129, 0.2)",
    color: "#10B981",
    border: "1px solid rgba(16, 185, 129, 0.35)",
  },
  coverageBadgePartial: {
    background: "rgba(245, 158, 11, 0.2)",
    color: "#F59E0B",
    border: "1px solid rgba(245, 158, 11, 0.35)",
  },
  coverageBadgeIncomplete: {
    background: "rgba(239, 68, 68, 0.2)",
    color: "#EF4444",
    border: "1px solid rgba(239, 68, 68, 0.35)",
  },
  coverageBadgeUnknown: {
    background: "rgba(148, 163, 184, 0.18)",
    color: "rgba(226, 232, 240, 0.85)",
    border: "1px solid rgba(148, 163, 184, 0.35)",
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
  howToReadSection: {
    marginBottom: "3rem",
    padding: "2.5rem",
    background: "rgba(5, 8, 18, 0.4)",
    borderRadius: "16px",
    border: "1px solid rgba(208, 215, 222, 0.06)",
  },
  howToReadHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "1.5rem",
  },
  howToReadIcon: {
    fontSize: "1.75rem",
  },
  howToReadTitle: {
    fontSize: "1.35rem",
    fontWeight: 700,
    color: "#D0D7DE",
    margin: 0,
  },
  howToReadGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "1.25rem",
    marginBottom: "1.5rem",
  },
  howToReadCard: {
    padding: "1.5rem",
    background: "rgba(13, 17, 23, 0.5)",
    borderRadius: "12px",
    border: "1px solid rgba(208, 215, 222, 0.08)",
    textAlign: "center" as const,
  },
  scoreExample: {
    fontSize: "1.75rem",
    fontWeight: 700,
    marginBottom: "0.5rem",
  },
  scoreTier: {
    fontSize: "0.875rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    color: "rgba(234, 240, 255, 0.6)",
    letterSpacing: "0.1em",
    marginBottom: "0.75rem",
  },
  scoreDescription: {
    fontSize: "0.8125rem",
    color: "rgba(234, 240, 255, 0.75)",
    lineHeight: 1.6,
    margin: 0,
  },
  howToReadFooter: {
    fontSize: "0.875rem",
    color: "rgba(234, 240, 255, 0.65)",
    lineHeight: 1.7,
    textAlign: "center" as const,
    marginTop: "1rem",
    paddingTop: "1.5rem",
    borderTop: "1px solid rgba(208, 215, 222, 0.06)",
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
  mobileCardsContainer: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "1rem",
    marginBottom: "3rem",
  },
  mobileCard: {
    display: "block",
    padding: "1.25rem",
    borderRadius: "14px",
    border: "1px solid rgba(208, 215, 222, 0.08)",
    background: "rgba(5, 8, 18, 0.5)",
    textDecoration: "none",
    transition: "all 0.2s ease",
    cursor: "pointer",
    color: "inherit",
  },
  mobileCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "0.75rem",
    paddingBottom: "0.75rem",
    borderBottom: "1px solid rgba(208, 215, 222, 0.05)",
  },
  mobileRank: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2rem",
    height: "2rem",
    borderRadius: "50%",
    background: "rgba(0, 212, 194, 0.15)",
    color: "#00D4C2",
    fontWeight: 700,
    fontSize: "0.875rem",
    flexShrink: 0,
  },
  mobileCardTitle: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#D0D7DE",
    flex: 1,
  },
  mobileCardBody: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.75rem 1rem",
    marginBottom: "0.75rem",
  },
  mobileCardRow: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.25rem",
  },
  mobileLabel: {
    fontSize: "0.75rem",
    color: "rgba(234, 240, 255, 0.55)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    fontWeight: 600,
  },
  mobileValue: {
    fontSize: "0.875rem",
    color: "rgba(234, 240, 255, 0.85)",
  },
  mobileCardFooter: {
    fontSize: "0.875rem",
    color: "#00D4C2",
    fontWeight: 600,
    paddingTop: "0.75rem",
    borderTop: "1px solid rgba(208, 215, 222, 0.05)",
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

// Generate static props with default data to prevent "0 firms" on SSG
export const getStaticProps: GetStaticProps = async () => {
  try {
    // Try to fetch real data during build
    const res = await fetch('http://localhost:3000/api/firms/', { cache: 'no-store' });
    if (res.ok) {
      const apiData = await res.json();
      const defaultStats: GlobalStats = {
        totalFirms: apiData.total || 138,
        totalUniverse: apiData.total_all || 157,
        excludedCount: apiData.excluded_count || 19,
        avgScore: 47,
        medianScore: 45,
        passRate: 32,
        snapshotDate: new Date().toISOString().split('T')[0],
        credibilityRatio: 85,
        dataCoverage: 15,
      };
      return {
        props: { initialStats: defaultStats },
        revalidate: 300, // Revalidate every 5 minutes
      };
    }
  } catch (error) {
    console.error('[Rankings] getStaticProps error:', error);
  }
  
  // Fallback default stats if API fails during build
  const fallbackStats: GlobalStats = {
    totalFirms: 138,
    totalUniverse: 157,
    excludedCount: 19,
    avgScore: 47,
    medianScore: 45,
    passRate: 32,
    snapshotDate: new Date().toISOString().split('T')[0],
    credibilityRatio: 85,
    dataCoverage: 15,
  };
  
  return {
    props: { initialStats: fallbackStats },
    revalidate: 300,
  };
};

