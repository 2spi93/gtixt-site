'use client';

import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "../lib/useTranslationStub";
import { normalizeNaRate, normalizeScore } from "../lib/dataUtils";

type LatestPointer = {
  object: string;
  sha256: string;
  created_at: string;
  count: number;
};

type GlobalMetrics = {
  totalFirms: number;
  avgScore: number;
  passRate: number;
  naRate: number;
  lastUpdate: string;
  integrityStatus: 'healthy' | 'warning' | 'error';
};

function formatIso(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function shortHash(h?: string) {
  if (!h) return "";
  const s = h.trim();
  if (s.length <= 18) return s;
  return `${s.slice(0, 10)}…${s.slice(-6)}`;
}

type HomeProps = {
  initialPtr?: LatestPointer | null;
  initialMetrics?: GlobalMetrics | null;
};

// Static fallback timestamp to prevent hydration mismatches
const STATIC_FALLBACK_TIMESTAMP = '2026-01-01T00:00:00.000Z';

const computeMetricsFromRecords = (
  records: any[],
  fallbackCreatedAt?: string,
  totalOverride?: number
): { metrics: GlobalMetrics; ptr: LatestPointer } => {
  const totalFirms = typeof totalOverride === "number" ? totalOverride : records.length;
  const scores = records
    .map((f: any) => normalizeScore(f.score_0_100 ?? f.score ?? f.integrity_score))
    .filter((s: number | undefined): s is number => typeof s === "number" && s > 0);
  const avgScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
  const passCount = scores.filter((score: number) => score >= 60).length;
  const passRate = totalFirms > 0 ? (passCount / totalFirms) * 100 : 0;
  const naRates = records
    .map((f: any) => normalizeNaRate(f.na_rate))
    .filter((v: number | undefined): v is number => typeof v === "number");
  const avgNaRate = naRates.length > 0 ? naRates.reduce((a: number, b: number) => a + b, 0) / naRates.length : 0;

  return {
    metrics: {
      totalFirms,
      avgScore: Math.round(avgScore),
      passRate: Math.round(passRate),
      naRate: Math.round(avgNaRate),
      lastUpdate: fallbackCreatedAt || STATIC_FALLBACK_TIMESTAMP,
      integrityStatus: avgScore > 70 ? 'healthy' : avgScore > 50 ? 'warning' : 'error',
    },
    ptr: {
      object: 'snapshot.json',
      sha256: '',
      created_at: fallbackCreatedAt || STATIC_FALLBACK_TIMESTAMP,
      count: totalFirms,
    },
  };
};

export default function HomeBeaconV3({ initialPtr = null, initialMetrics = null }: HomeProps) {
  const basePublic = useMemo(() => {
    return (
      process.env.NEXT_PUBLIC_SNAPSHOT_BASE_URL ||
      process.env.NEXT_PUBLIC_MINIO_PUBLIC_BASE ||
      "/snapshots"
    ).replace(/\/+$/, "");
  }, []);

  const snapshotKey = useMemo(() => {
    return process.env.NEXT_PUBLIC_PUBLIC_SNAPSHOT_KEY || "universe_v0.1_public";
  }, []);

  const latestUrl = useMemo(() => {
    return `${basePublic}/${snapshotKey}/_public/latest.json`;
  }, [basePublic, snapshotKey]);

  const [ptr, setPtr] = useState<LatestPointer | null>(initialPtr);
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(initialMetrics);
  const [err, setErr] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation("common");

  useEffect(() => {
    setMounted(true);
    // Ne charger que si aucune donnée initiale n'existe (évite l'hydratation mismatch)
    if (initialPtr && initialMetrics) {
      return;
    }

    let alive = true;
    (async () => {
      try {
        setErr(null);
        const r = await fetch('/api/firms/?limit=500', { cache: "no-store" });
        if (!r.ok) throw new Error(`API firms HTTP ${r.status}`);
        const apiData = await r.json();
        if (!alive) return;

        const j: LatestPointer = {
          object: apiData.snapshot_info?.object || 'snapshot.json',
          sha256: apiData.snapshot_info?.sha256 || '',
          created_at: apiData.snapshot_info?.created_at || STATIC_FALLBACK_TIMESTAMP,
          count: apiData.total || 0,
        };
        setPtr(j);

        if (apiData.firms && Array.isArray(apiData.firms)) {
          const { metrics: computed } = computeMetricsFromRecords(apiData.firms, j.created_at, apiData.total);
          setMetrics(computed);
        }
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || String(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [initialPtr, initialMetrics]);

  return (
    <>
      <Head>
        <title>GTIXT — The Global Prop Trading Index</title>
        <meta
          name="description"
          content="GTIXT — The Global Prop Trading Index. Institutional benchmark for prop trading transparency, payout integrity, risk model quality, and compliance."
        />
      </Head>

      <div className="page">
        <header className="topbar">
          <div className="topbar-inner">
            <div className="brand">
              <div className="brand-mark">
                <span className="brand-mark-letter brand-mark-g">G</span>
                <span className="brand-mark-letter brand-mark-t">T</span>
                <div className="brand-mark-accent"></div>
                <div className="brand-mark-glow"></div>
              </div>
              <div className="brand-text">
                <div className="brand-name"><span className="brand-letter-blue">GT</span><span className="brand-letter-white">I</span><span className="brand-letter-blue">XT</span></div>
                <div className="brand-divider"></div>
                <div className="brand-tag">The Global Prop Trading Index</div>
              </div>
            </div>

            <nav className="nav">
              <Link className="navlink" href="/rankings">Dashboard</Link>
              <Link className="navlink" href="/integrity">Integrity</Link>
              <Link className="navlink" href="/methodology">Methodology</Link>
            </nav>

            <button 
              className="hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              <span className={`hamburger-line ${mobileMenuOpen ? 'active' : ''}`}></span>
              <span className={`hamburger-line ${mobileMenuOpen ? 'active' : ''}`}></span>
              <span className={`hamburger-line ${mobileMenuOpen ? 'active' : ''}`}></span>
            </button>
          </div>
        </header>

        {mobileMenuOpen && (
          <nav className="mobile-nav">
            <Link className="mobile-nav-link" href="/rankings" onClick={() => setMobileMenuOpen(false)}>
              Dashboard
            </Link>
            <Link className="mobile-nav-link" href="/integrity" onClick={() => setMobileMenuOpen(false)}>
              Integrity
            </Link>
            <Link className="mobile-nav-link" href="/methodology" onClick={() => setMobileMenuOpen(false)}>
              Methodology
            </Link>
          </nav>
        )}

        <main id="main-content" className="main">
          {/* HERO */}
          <section className="hero">
            <div className="hero-bg">
              <div className="grid" />
              <div className="world" />
              <div className="beam" />
              <div className="beam2" />
              <div className="glow" />
            </div>

            <div className="hero-inner">
              <div className="hero-left">
                <div className="kicker">Institutional Benchmark • Transparency-First • Audit-Friendly</div>
                <h1 className="headline">
                  GTIXT — <span className="headline-accent">Integrity Beacon</span> for Global Prop Trading
                </h1>
                <p className="subhead">
                  The first public, versioned benchmark that converts messy prop firm reality into an
                  institutional-grade signal: transparency, payout reliability, risk model integrity, and compliance.
                </p>

                <div className="punchline-hero" suppressHydrationWarning>
                <p className="punchline-line">{t('punchline1')}</p>
                <p className="punchline-line punchline-highlight">{t('punchline2')}</p>
                </div>

                <div className="cta-row" suppressHydrationWarning>
                  <Link href="/rankings" className="cta-card primary">
                    <span className="cta-icon">📊</span>
                    <h2 className="cta-title">Explorer l'Index</h2>
                    <p className="cta-desc">Classement des {typeof metrics?.totalFirms === "number" ? metrics.totalFirms : "—"} firmes de trading propriétaire</p>
                  </Link>
                  <Link href="/integrity" className="cta-card secondary">
                    <span className="cta-icon">🔒</span>
                    <h2 className="cta-title">Vérification</h2>
                    <p className="cta-desc">Vérifiez l'intégrité des données et snapshots</p>
                  </Link>
                  <Link href="/methodology" className="cta-card ghost">
                    <span className="cta-icon">📖</span>
                    <h2 className="cta-title">Méthodologie</h2>
                    <p className="cta-desc">Comprenez la spec v1.0 et les 5 piliers</p>
                  </Link>
                </div>

                <div className="pillars">
                  <div className="pill">A • Transparency</div>
                  <div className="pill">B • Payout Reliability</div>
                  <div className="pill">C • Risk Model</div>
                  <div className="pill">D • Legal & Compliance</div>
                  <div className="pill">E • Reputation & Support</div>
                </div>
              </div>

              {/* Global Metrics Card */}
              <div className="hero-right">
                <div className="card metrics-card">
                  <div className="card-head" suppressHydrationWarning>
                    <div>
                      <div className="card-title">{t('indexOverview')}</div>
                      <div className="card-subtitle">{t('realtimeBenchmarkMetrics')}</div>
                    </div>
                    <span className={`badge ${metrics?.integrityStatus === 'healthy' ? 'badge-success' : 'badge-warning'}`}>
                      {metrics?.integrityStatus === 'healthy' ? '✓ HEALTHY' : '⚠ REVIEW'}
                    </span>
                  </div>

                  <div className="card-body">
                    <div className="metrics-grid" suppressHydrationWarning>
                      <div className="metric">
                        <div className="metric-value">{typeof metrics?.totalFirms === 'number' ? metrics.totalFirms : '—'}</div>
                        <div className="metric-label">Total Firms</div>
                      </div>
                      <div className="metric">
                        <div className="metric-value">{typeof metrics?.avgScore === 'number' ? metrics.avgScore : '—'}</div>
                        <div className="metric-label">Avg Score</div>
                      </div>
                      <div className="metric">
                        <div className="metric-value">{typeof metrics?.passRate === 'number' ? `${metrics.passRate}%` : '—'}</div>
                        <div className="metric-label">Pass Rate</div>
                      </div>
                      <div className="metric">
                        <div className="metric-value">{typeof metrics?.naRate === 'number' ? `${metrics.naRate}%` : '—'}</div>
                        <div className="metric-label">NA Rate</div>
                      </div>
                    </div>

                    {err && (
                      <div className="alert" role="status">
                        <div className="alert-title">Live data unavailable</div>
                        <div className="alert-text">{err}</div>
                      </div>
                    )}

                    <div className="divider" />

                    <div className="snapshot-info" suppressHydrationWarning>
                      <div className="info-row">
                        <span className="info-label">Snapshot</span>
                        <span className="info-value mono">{ptr?.object || "loading…"}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">SHA-256</span>
                        <span className="info-value mono">{ptr ? shortHash(ptr.sha256) : "loading…"}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Updated</span>
                        <span className="info-value" suppressHydrationWarning>
                          {mounted && metrics ? formatIso(metrics.lastUpdate) : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="card-actions">
                      <Link href="/integrity" className="btn-mini">
                        <span className="btn-icon">🔐</span> Verify SHA-256
                      </Link>
                      <Link href="/rankings" className="btn-mini ghost">
                        <span className="btn-icon">📈</span> View Ranking
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* WHY NOW? - REGULATORY URGENCY CALLOUT */}
          <section className="why-now-section">
            <div className="why-now-callout">
              <div className="why-now-content">
                <div className="why-now-header">
                  <span className="why-now-badge">🚨 CRITICAL TIMING</span>
                  <h2 className="why-now-title">Regulation arrives 2025-2026. We build the standard now.</h2>
                </div>
                <p className="why-now-text">
                  Global regulators are moving to formalize oversight of proprietary trading firms. 
                  GTIXT provides the benchmark infrastructure before regulation arrives—giving firms, 
                  traders, and institutions a transparent, auditable framework to demonstrate compliance and credibility.
                </p>
                <div className="why-now-phases">
                  <div className="phase-item">
                    <div className="phase-icon">👁️</div>
                    <div className="phase-label">2024-2025</div>
                    <div className="phase-title">Observation</div>
                    <div className="phase-desc">Regulators gather data</div>
                  </div>
                  <div className="phase-arrow">→</div>
                  <div className="phase-item active">
                    <div className="phase-icon">📋</div>
                    <div className="phase-label">2025</div>
                    <div className="phase-title">Formalization</div>
                    <div className="phase-desc">Standards emerge</div>
                  </div>
                  <div className="phase-arrow">→</div>
                  <div className="phase-item">
                    <div className="phase-icon">⚖️</div>
                    <div className="phase-label">2026+</div>
                    <div className="phase-title">Application</div>
                    <div className="phase-desc">Enforcement begins</div>
                  </div>
                </div>
                <div className="why-now-cta">
                  <Link href="/regulatory-timeline" className="btn-primary">
                    View Full Regulatory Timeline →
                  </Link>
                  <Link href="/rankings" className="btn-ghost">
                    See Current Rankings
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* WHY INSTITUTIONS TRUST GTIXT */}
          <section className="trust-section">
            <div className="section-header">
              <h2 className="section-title">Why Institutions Trust GTIXT</h2>
              <p className="section-subtitle">
                Built with institutional infrastructure principles: immutability, reproducibility, and full audit trail
              </p>
            </div>

            <div className="trust-grid">
              <div className="trust-card">
                <div className="trust-icon">📦</div>
                <h3 className="trust-title">Versioned Objects</h3>
                <p className="trust-text">
                  Every snapshot is an immutable object with SHA-256 digest. You can verify, download, and audit any version.
                </p>
              </div>

              <div className="trust-card">
                <div className="trust-icon">🎯</div>
                <h3 className="trust-title">Deterministic Scoring</h3>
                <p className="trust-text">
                  Spec-driven methodology (v1.0) produces reproducible results. Same inputs → same score, every time.
                </p>
              </div>

              <div className="trust-card">
                <div className="trust-icon">✅</div>
                <h3 className="trust-title">Oversight Gate</h3>
                <p className="trust-text">
                  Quality gate enforces standards before publication. Failed gate = no publish. Full transparency log.
                </p>
              </div>
            </div>
          </section>

          {/* INFRASTRUCTURE PIPELINE */}
          <section className="pipeline-section">
            <div className="section-header">
              <h2 className="section-title">Integrity Infrastructure</h2>
              <p className="section-subtitle">From raw data chaos to institutional-grade signal</p>
            </div>

            <div className="pipeline">
              <div className="pipeline-step">
                <div className="step-icon">🌐</div>
                <div className="step-title">Crawl</div>
                <div className="step-desc">FCA API, Trustpilot, prop firm websites</div>
              </div>
              <div className="pipeline-arrow">→</div>

              <div className="pipeline-step">
                <div className="step-icon">✓</div>
                <div className="step-title">Validate</div>
                <div className="step-desc">Schema checks, data quality rules</div>
              </div>
              <div className="pipeline-arrow">→</div>

              <div className="pipeline-step">
                <div className="step-icon">🎯</div>
                <div className="step-title">Score</div>
                <div className="step-desc">Methodology v1.0 (5 pillars, 0-100)</div>
              </div>
              <div className="pipeline-arrow">→</div>

              <div className="pipeline-step">
                <div className="step-icon">🚦</div>
                <div className="step-title">Gate</div>
                <div className="step-desc">Quality gate: Pass/Warn/Fail</div>
              </div>
              <div className="pipeline-arrow">→</div>

              <div className="pipeline-step">
                <div className="step-icon">📦</div>
                <div className="step-title">Publish</div>
                <div className="step-desc">Versioned snapshot + SHA-256</div>
              </div>
            </div>
          </section>

          {/* EXPLORE SECTION */}
          <section className="explore-section">
            <div className="section-header">
              <h2 className="section-title">Explore GTIXT</h2>
              <p className="section-subtitle">Deep-dive into rankings, integrity checks, and methodology</p>
            </div>

            <div className="explore-grid">
              <Link href="/rankings" className="explore-card">
                <div className="explore-icon">📊</div>
                <h3 className="explore-title">Firm Rankings</h3>
                <p className="explore-text">
                  View all {typeof metrics?.totalFirms === "number" ? metrics.totalFirms : "—"} firms ranked by GTIXT score. Filter by jurisdiction, sort by pillars.
                </p>
                <div className="explore-cta">View Dashboard →</div>
              </Link>

              <Link href="/integrity" className="explore-card">
                <div className="explore-icon">🔐</div>
                <h3 className="explore-title">Integrity Center</h3>
                <p className="explore-text">
                  Verify snapshots, check SHA-256 digests, download raw data. Full audit trail available.
                </p>
                <div className="explore-cta">Verify Now →</div>
              </Link>

              <Link href="/methodology" className="explore-card">
                <div className="explore-icon">📖</div>
                <h3 className="explore-title">Methodology v1.0</h3>
                <p className="explore-text">
                  Understand the scoring framework: 5 pillars, 23 dimensions, deterministic logic.
                </p>
                <div className="explore-cta">Read Spec →</div>
              </Link>
            </div>
          </section>
        </main>

        <footer className="footer">
          <div suppressHydrationWarning>© {new Date().getFullYear()} GTIXT — The Global Prop Trading Index.</div>
          <div className="footer-right">
            <a className="footer-link" href={latestUrl} target="_blank" rel="noreferrer">latest.json</a>
            <span className="sep">•</span>
            <Link className="footer-link" href="/integrity">Verify</Link>
          </div>
        </footer>
      </div>

      <style jsx>{`
        :global(html, body) { padding: 0; margin: 0; background: #070B14; color: #EAF0FF; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"; }
        a { color: inherit; text-decoration: none; }

        .page { min-height: 100vh; }
        .topbar { position: sticky; top: 0; z-index: 20; backdrop-filter: blur(12px); background: rgba(7,11,20,0.88); border-bottom: 1px solid rgba(26,115,232,0.15); box-shadow: 0 2px 12px rgba(0,0,0,0.3); }
        .topbar-inner { max-width: 1120px; margin: 0 auto; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; }
        .brand { display: flex; align-items: center; gap: 14px; cursor: pointer; transition: all 0.3s ease; }
        .brand:hover { transform: translateY(-2px); }
        .brand-mark { position: relative; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(26,115,232,0.3) 0%, rgba(0,209,193,0.12) 100%); border: 1.5px solid rgba(26,115,232,0.4); box-shadow: 0 0 20px rgba(26,115,232,0.25), inset 0 1px 3px rgba(255,255,255,0.15), 0 8px 24px rgba(26,115,232,0.12); overflow: hidden; backdrop-filter: blur(8px); }
        .brand-mark::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.12) 0%, transparent 60%); border-radius: 12px; z-index: 1; }
        .brand-mark-letter { position: relative; z-index: 2; font-weight: 900; font-size: 1rem; letter-spacing: -0.02em; line-height: 1; }
        .brand-mark-g { color: #1A73E8; text-shadow: 0 0 12px rgba(26,115,232,0.4); }
        .brand-mark-t { color: #FFFFFF; text-shadow: 0 0 12px rgba(0,209,193,0.3); }
        .brand-mark-accent { position: absolute; bottom: 2px; right: 2px; width: 7px; height: 7px; background: linear-gradient(135deg, #00D1C1, #1A73E8); border-radius: 50%; box-shadow: 0 0 12px rgba(0,209,193,0.8); z-index: 3; animation: pulse-accent 2s ease-in-out infinite; }
        .brand-mark-glow { position: absolute; inset: -4px; background: radial-gradient(circle, rgba(26,115,232,0.15) 0%, transparent 70%); border-radius: 12px; z-index: 0; }
        @keyframes pulse-accent { 0%, 100% { box-shadow: 0 0 12px rgba(0,209,193,0.8), 0 0 0px rgba(0,209,193,0.4); } 50% { box-shadow: 0 0 16px rgba(0,209,193,1), 0 0 8px rgba(0,209,193,0.6); } }
        .brand-text { display: flex; flex-direction: column; gap: 4px; }
        .brand-name { font-weight: 900; letter-spacing: 0.01em; font-size: 0.95rem; display: flex; gap: 0.5px; line-height: 1; }
        .brand-letter-blue { color: #1A73E8; }
        .brand-letter-white { color: #FFFFFF; text-shadow: 0 2px 4px rgba(26,115,232,0.3); }
        .brand-divider { width: 24px; height: 1px; background: linear-gradient(90deg, rgba(26,115,232,0.5) 0%, transparent 100%); margin: 1px 0 1px 0; }
        .brand-tag { font-size: 0.65rem; color: rgba(0,209,193,0.85); margin-top: 2px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
        .nav { display: flex; gap: 24px; font-size: 14px; color: rgba(234,240,255,0.78); }
        .navlink { text-decoration: none; color: rgba(234,240,255,0.78); transition: all 0.2s; font-weight: 500; position: relative; padding-bottom: 2px; }
        .navlink::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1.5px; background: #00D1C1; transition: width 0.3s ease; }
        .navlink:hover { color: #FFFFFF; }
        .navlink:hover::after { width: 100%; }
        
        /* Hamburger Menu */
        .hamburger { display: none; background: transparent; border: none; cursor: pointer; gap: 6px; flex-direction: column; padding: 0; margin-right: -8px; }
        .hamburger-line { width: 24px; height: 2px; background: #00D1C1; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: block; border-radius: 1px; }
        .hamburger-line.active:nth-child(1) { transform: translateY(8px) rotate(45deg); }
        .hamburger-line.active:nth-child(2) { opacity: 0; }
        .hamburger-line.active:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }
        
        /* Mobile Navigation */
        .mobile-nav { display: none; background: rgba(7,11,20,0.98); border-bottom: 1px solid rgba(0,209,193,0.2); padding: 1rem; flex-direction: column; gap: 0; }
        .mobile-nav-link { display: block; padding: 0.75rem 1rem; color: rgba(234,240,255,0.78); text-decoration: none; transition: all 0.2s; border-radius: 4px; text-transform: uppercase; font-size: 14px; letter-spacing: 0.05em; font-weight: 500; }
        .mobile-nav-link:hover { background: rgba(0,209,193,0.1); color: #00D1C1; }

        @media (max-width: 900px) {
          .nav { display: none; }
          .hamburger { display: flex; }
          .mobile-nav { display: flex; }
        }


        .main { max-width: 1120px; margin: 0 auto; padding: 26px 20px 40px; }

        .hero { position: relative; border: 1px solid rgba(255,255,255,0.08); border-radius: 22px; overflow: hidden; background: radial-gradient(1000px 520px at 30% 10%, rgba(26,115,232,0.22), transparent 60%),
                 radial-gradient(800px 520px at 70% 30%, rgba(0,209,193,0.12), transparent 55%),
                 rgba(255,255,255,0.02); }
        .hero-bg { position: absolute; inset: 0; pointer-events: none; }
        .grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px);
                background-size: 44px 44px; opacity: 0.08; transform: translateZ(0); }
        .world { position: absolute; inset: -2px; background:
                 radial-gradient(600px 220px at 65% 35%, rgba(0,209,193,0.10), transparent 65%),
                 radial-gradient(520px 180px at 45% 55%, rgba(26,115,232,0.14), transparent 70%);
                 opacity: 0.9; }
        .beam { position: absolute; left: -20%; top: -30%; width: 65%; height: 160%;
                background: linear-gradient(90deg, transparent 0%, rgba(26,115,232,0.25) 30%, rgba(0,209,193,0.18) 55%, transparent 80%);
                transform: rotate(18deg);
                filter: blur(0.3px);
                animation: sweep 10.5s ease-in-out infinite; opacity: 0.85; }
        .beam2 { position: absolute; left: 10%; top: -40%; width: 55%; height: 170%;
                background: linear-gradient(90deg, transparent 0%, rgba(0,209,193,0.18) 35%, rgba(255,255,255,0.10) 55%, transparent 80%);
                transform: rotate(12deg);
                animation: sweep2 13.5s ease-in-out infinite; opacity: 0.55; }
        .glow { position: absolute; inset: 0; background: radial-gradient(700px 420px at 20% 20%, rgba(255,255,255,0.10), transparent 60%);
                opacity: 0.55; }

        @keyframes sweep {
          0% { transform: translateX(-18%) rotate(18deg); opacity: 0.45; }
          50% { transform: translateX(18%) rotate(18deg); opacity: 0.85; }
          100% { transform: translateX(-18%) rotate(18deg); opacity: 0.45; }
        }
        @keyframes sweep2 {
          0% { transform: translateX(12%) rotate(12deg); opacity: 0.35; }
          50% { transform: translateX(-10%) rotate(12deg); opacity: 0.65; }
          100% { transform: translateX(12%) rotate(12deg); opacity: 0.35; }
        }

        .hero-inner { position: relative; z-index: 2; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 18px; padding: 28px; }
        @media (max-width: 980px) { .hero-inner { grid-template-columns: 1fr; } }

        .kicker { font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(234,240,255,0.75); }
        .headline { margin: 14px 0 10px; font-size: 44px; line-height: 1.08; letter-spacing: -0.02em; }
        .headline-accent { background: linear-gradient(90deg, #1A73E8, #00D1C1); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .subhead { margin: 0; max-width: 56ch; color: rgba(234,240,255,0.78); font-size: 16px; line-height: 1.55; }

        .cta-row { display: flex; gap: 12px; margin-top: 18px; flex-wrap: wrap; }
        .cta-card { border-radius: 16px; border: 1px solid rgba(255,255,255,0.12); padding: 18px; display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 160px; transition: all 0.2s ease; text-decoration: none; }
        .cta-card.primary { background: rgba(26, 115, 232, 0.15); border-color: rgba(26, 115, 232, 0.30); }
        .cta-card.primary:hover { background: rgba(26, 115, 232, 0.25); border-color: rgba(26, 115, 232, 0.50); transform: translateY(-2px); }
        .cta-card.secondary { background: rgba(0, 209, 193, 0.12); border-color: rgba(0, 209, 193, 0.25); }
        .cta-card.secondary:hover { background: rgba(0, 209, 193, 0.20); border-color: rgba(0, 209, 193, 0.40); transform: translateY(-2px); }
        .cta-card.ghost { background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.10); }
        .cta-card.ghost:hover { background: rgba(255, 255, 255, 0.12); border-color: rgba(255, 255, 255, 0.20); transform: translateY(-2px); }
        .cta-icon { font-size: 32px; display: block; }
        .cta-title { margin: 0; font-size: 15px; font-weight: 800; letter-spacing: -0.01em; }
        .cta-desc { margin: 0; font-size: 12px; color: rgba(234, 240, 255, 0.70); line-height: 1.4; }
        .btn-primary { background: #ffffff; color: #070B14; padding: 12px 14px; border-radius: 14px; font-weight: 700; font-size: 14px; }
        .btn-primary:hover { background: #f3f6ff; }
        .btn-secondary { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); padding: 12px 14px; border-radius: 14px; font-weight: 700; font-size: 14px; }
        .btn-secondary:hover { background: rgba(255,255,255,0.10); }
        .btn-ghost { padding: 12px 14px; border-radius: 14px; font-weight: 700; font-size: 14px; color: rgba(234,240,255,0.82); border: 1px solid rgba(255,255,255,0.08); background: rgba(7,11,20,0.1); }
        .btn-ghost:hover { background: rgba(255,255,255,0.06); }

        .pillars { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
        .pill { font-size: 12px; padding: 7px 10px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.10); background: rgba(255,255,255,0.04); color: rgba(234,240,255,0.80); }

        .hero-right { display: flex; flex-direction: column; gap: 12px; }
        .card { border-radius: 18px; border: 1px solid rgba(255,255,255,0.10); background: rgba(5,8,18,0.65); overflow: hidden; }
        .card-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 14px 14px 10px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .card-title { font-weight: 800; letter-spacing: 0.01em; }
        .card-subtitle { font-size: 12px; color: rgba(234,240,255,0.65); margin-top: 2px; }
        .badge { font-size: 11px; padding: 5px 8px; border-radius: 999px; border: 1px solid rgba(0,209,193,0.30); background: rgba(0,209,193,0.10); color: rgba(186,255,245,0.92); font-weight: 700; }

        .card-body { padding: 14px; }
        .row { display: grid; grid-template-columns: 90px 1fr; gap: 10px; align-items: center; }
        .label { color: rgba(234,240,255,0.55); font-size: 12px; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
        .link { color: rgba(234,240,255,0.85); }
        .link:hover { text-decoration: underline; }

        .meta { margin-top: 12px; display: grid; gap: 8px; }
        .kv { display: grid; grid-template-columns: 90px 1fr; gap: 10px; }
        .k { color: rgba(234,240,255,0.55); font-size: 12px; }
        .v { color: rgba(234,240,255,0.88); font-size: 13px; }

        .card-actions { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
        .btn-mini { display: inline-block; padding: 10px 12px; border-radius: 12px; background: #ffffff; color: #070B14; font-weight: 800; font-size: 13px; }
        .btn-mini:hover { background: #f3f6ff; }
        .btn-mini.ghost { background: rgba(255,255,255,0.06); color: rgba(234,240,255,0.92); border: 1px solid rgba(255,255,255,0.12); }
        .btn-mini.ghost:hover { background: rgba(255,255,255,0.10); }

        .card-foot { margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); }
        .foot-title { font-weight: 800; font-size: 13px; margin-bottom: 8px; }
        .list { margin: 0; padding-left: 18px; color: rgba(234,240,255,0.70); font-size: 13px; line-height: 1.55; }

        .alert { margin-top: 12px; border-radius: 14px; border: 1px solid rgba(255,120,120,0.28); background: rgba(255,70,70,0.10); padding: 12px; }
        .alert-title { font-weight: 800; font-size: 13px; color: rgba(255,210,210,0.95); }
        .alert-text { margin-top: 6px; font-size: 12px; color: rgba(255,210,210,0.85); }

        .mini { border-radius: 18px; border: 1px solid rgba(255,255,255,0.10); background: rgba(255,255,255,0.03); padding: 14px; }
        .mini-title { font-weight: 800; }
        .mini-text { margin-top: 6px; color: rgba(234,240,255,0.72); font-size: 13px; line-height: 1.55; }

        .section { margin-top: 18px; padding: 18px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02); }
        .section-title { font-weight: 900; letter-spacing: -0.01em; margin-bottom: 12px; }
        .section-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        @media (max-width: 980px) { .section-grid { grid-template-columns: 1fr; } }
        .box { border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); background: rgba(5,8,18,0.55); padding: 14px; }
        .box-title { font-weight: 800; }
        .box-text { margin-top: 6px; color: rgba(234,240,255,0.72); font-size: 13px; line-height: 1.55; }

        .section-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .section-last { margin-bottom: 10px; }

        .footer { max-width: 1120px; margin: 0 auto; padding: 18px 20px 26px; color: rgba(234,240,255,0.62); font-size: 12px;
                  display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .footer-right { display: flex; align-items: center; gap: 10px; }
        .footer-link:hover { color: rgba(255,255,255,0.92); text-decoration: underline; }
        .sep { opacity: 0.35; }

        /* Metrics Card */
        .metrics-card .card-body { padding: 18px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .metric { text-align: center; }
        .metric-value { font-size: 32px; font-weight: 900; letter-spacing: -0.02em; background: linear-gradient(135deg, #ffffff, rgba(234,240,255,0.85)); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .metric-label { font-size: 11px; color: rgba(234,240,255,0.60); margin-top: 4px; letter-spacing: 0.08em; text-transform: uppercase; }
        .divider { border-top: 1px solid rgba(255,255,255,0.08); margin: 14px 0; }
        .snapshot-info { display: flex; flex-direction: column; gap: 8px; }
        .info-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
        .info-label { color: rgba(234,240,255,0.55); }
        .info-value { color: rgba(234,240,255,0.88); }
        .badge-success { border-color: rgba(0,209,193,0.30); background: rgba(0,209,193,0.10); color: rgba(186,255,245,0.92); }
        .badge-warning { border-color: rgba(255,183,0,0.30); background: rgba(255,183,0,0.10); color: rgba(255,220,150,0.92); }
        .btn-icon { font-size: 16px; margin-right: 4px; }

        /* Why Now Section - Regulatory Urgency Callout */
        .why-now-section { margin-top: 18px; }
        .why-now-callout { 
          padding: 32px 28px; 
          border-radius: 18px; 
          background: linear-gradient(135deg, rgba(255,119,0,0.15), rgba(255,183,0,0.12)); 
          border: 2px solid rgba(255,150,0,0.35);
          box-shadow: 0 4px 24px rgba(255,119,0,0.12);
        }
        .why-now-content { max-width: 920px; margin: 0 auto; }
        .why-now-header { text-align: center; margin-bottom: 18px; }
        .why-now-badge { 
          display: inline-block; 
          padding: 6px 14px; 
          border-radius: 20px; 
          background: rgba(255,119,0,0.20); 
          border: 1px solid rgba(255,150,0,0.40);
          color: #FFB366; 
          font-weight: 800; 
          font-size: 11px; 
          letter-spacing: 0.08em; 
          margin-bottom: 12px;
        }
        .why-now-title { 
          font-weight: 900; 
          font-size: 28px; 
          letter-spacing: -0.02em; 
          line-height: 1.3;
          background: linear-gradient(135deg, #FFFFFF, rgba(255,200,100,0.95)); 
          -webkit-background-clip: text; 
          background-clip: text; 
          color: transparent;
        }
        .why-now-text { 
          text-align: center; 
          color: rgba(234,240,255,0.82); 
          font-size: 15px; 
          line-height: 1.65; 
          margin-bottom: 24px; 
          max-width: 72ch; 
          margin-left: auto; 
          margin-right: auto;
        }
        .why-now-phases { 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 10px; 
          margin-bottom: 24px; 
          flex-wrap: wrap;
        }
        .phase-item { 
          flex: 1; 
          min-width: 140px; 
          max-width: 180px; 
          padding: 16px 14px; 
          border-radius: 14px; 
          border: 1px solid rgba(255,255,255,0.12); 
          background: rgba(5,8,18,0.60); 
          text-align: center;
          transition: all 0.2s ease;
        }
        .phase-item.active { 
          border-color: rgba(255,150,0,0.45); 
          background: rgba(255,119,0,0.12);
          box-shadow: 0 0 16px rgba(255,119,0,0.18);
        }
        .phase-icon { font-size: 28px; margin-bottom: 6px; }
        .phase-label { font-size: 10px; color: rgba(255,183,0,0.75); font-weight: 800; letter-spacing: 0.06em; margin-bottom: 4px; }
        .phase-title { font-weight: 800; font-size: 14px; margin-bottom: 3px; }
        .phase-desc { font-size: 11px; color: rgba(234,240,255,0.65); }
        .phase-arrow { font-size: 24px; color: rgba(255,150,0,0.60); font-weight: 800; }
        .why-now-cta { 
          display: flex; 
          gap: 12px; 
          justify-content: center; 
          align-items: center;
          flex-wrap: wrap;
        }
        .btn-primary { 
          padding: 12px 24px; 
          border-radius: 12px; 
          background: linear-gradient(135deg, #FF7700, #FF9500); 
          color: #FFFFFF; 
          font-weight: 800; 
          font-size: 14px; 
          border: none;
          transition: all 0.2s ease;
          display: inline-block;
        }
        .btn-primary:hover { 
          background: linear-gradient(135deg, #FF8800, #FFA500); 
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(255,119,0,0.35);
        }
        .btn-ghost { 
          padding: 12px 24px; 
          border-radius: 12px; 
          background: transparent; 
          color: rgba(255,183,0,0.90); 
          font-weight: 800; 
          font-size: 14px;
          border: 1px solid rgba(255,150,0,0.35);
          transition: all 0.2s ease;
          display: inline-block;
        }
        .btn-ghost:hover { 
          border-color: rgba(255,150,0,0.55); 
          background: rgba(255,119,0,0.08);
        }

        /* Trust Section */
        .trust-section, .pipeline-section, .explore-section { margin-top: 18px; padding: 32px 24px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02); }
        .section-header { text-align: center; margin-bottom: 28px; }
        .section-title { font-weight: 900; font-size: 28px; letter-spacing: -0.02em; margin-bottom: 8px; }
        .section-subtitle { color: rgba(234,240,255,0.68); font-size: 15px; max-width: 60ch; margin: 0 auto; }
        .trust-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        @media (max-width: 980px) { .trust-grid { grid-template-columns: 1fr; } }
        .trust-card { border-radius: 16px; border: 1px solid rgba(255,255,255,0.10); background: rgba(5,8,18,0.65); padding: 20px; text-align: center; }
        .trust-icon { font-size: 48px; margin-bottom: 12px; }
        .trust-title { font-weight: 800; font-size: 16px; margin-bottom: 8px; }
        .trust-text { color: rgba(234,240,255,0.72); font-size: 13px; line-height: 1.55; }

        /* Pipeline Section */
        .pipeline { display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; }
        .pipeline-step { border-radius: 16px; border: 1px solid rgba(255,255,255,0.12); background: rgba(5,8,18,0.72); padding: 18px 20px; text-align: center; min-width: 140px; }
        .step-icon { font-size: 32px; margin-bottom: 8px; }
        .step-title { font-weight: 800; font-size: 14px; margin-bottom: 4px; }
        .step-desc { font-size: 11px; color: rgba(234,240,255,0.65); line-height: 1.4; }
        .pipeline-arrow { font-size: 24px; color: rgba(0,209,193,0.60); font-weight: 800; }

        /* Explore Section */
        .explore-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        @media (max-width: 980px) { .explore-grid { grid-template-columns: 1fr; } }
        .explore-card { border-radius: 16px; border: 1px solid rgba(255,255,255,0.10); background: rgba(5,8,18,0.65); padding: 20px; display: flex; flex-direction: column; transition: all 0.2s ease; }
        .explore-card:hover { border-color: rgba(0,209,193,0.35); background: rgba(5,8,18,0.85); transform: translateY(-2px); }
        .explore-icon { font-size: 48px; margin-bottom: 12px; }
        .explore-title { font-weight: 800; font-size: 16px; margin-bottom: 8px; }
        .explore-text { color: rgba(234,240,255,0.72); font-size: 13px; line-height: 1.55; flex-grow: 1; }
        .explore-cta { margin-top: 12px; color: rgba(0,209,193,0.92); font-weight: 700; font-size: 13px; }
        .explore-card:hover .explore-cta { color: #00D1C1; }

        /* Punchline Hero - inline with left column */
        .punchline-hero {
          margin: 18px 0 20px 0;
          padding: 16px 0;
        }
        .punchline-line { 
          font-weight: 900; 
          font-size: 18px; 
          letter-spacing: -0.01em; 
          line-height: 1.3;
          margin: 0 0 6px 0;
          color: rgba(234,240,255,0.88);
        }
        .punchline-highlight {
          background: linear-gradient(135deg, #00D1C1, #1A73E8);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        /* Mobile Responsive - 640px and below */
        @media (max-width: 640px) {
          .topbar-inner { padding: 12px 16px; }
          .nav { display: none; }
          .hamburger { display: flex; }
          .hamburger-line:nth-child(1).active { transform: rotate(45deg) translateY(11px); }
          .hamburger-line:nth-child(2).active { opacity: 0; }
          .hamburger-line:nth-child(3).active { transform: rotate(-45deg) translateY(-11px); }
          .mobile-nav { display: flex; }
          .main { padding: 16px 16px 24px; }
          .hero-inner { padding: 16px; gap: 12px; }
          .kicker { font-size: 11px; }
          .headline { font-size: 24px; line-height: 1.1; margin: 10px 0 8px; }
          .subhead { font-size: 14px; line-height: 1.5; }
          .cta-row { gap: 10px; margin-top: 14px; }
          .cta-card { padding: 12px; min-width: 140px; }
          .cta-icon { font-size: 24px; }
          .cta-title { font-size: 13px; }
          .cta-desc { font-size: 11px; }
          .pillars { gap: 6px; margin-top: 12px; }
          .pill { font-size: 11px; padding: 6px 9px; }
          .why-now-section { margin-top: 12px; }
          .why-now-callout { padding: 20px 16px; }
          .why-now-title { font-size: 18px; line-height: 1.25; margin-bottom: 12px; }
          .why-now-text { font-size: 13px; line-height: 1.55; margin-bottom: 16px; }
          .why-now-phases { gap: 8px; }
          .phase-item { flex: 1; min-width: 100px; max-width: 140px; padding: 12px 10px; }
          .phase-icon { font-size: 24px; margin-bottom: 4px; }
          .phase-label { font-size: 9px; margin-bottom: 3px; }
          .phase-title { font-size: 12px; margin-bottom: 2px; }
          .phase-desc { font-size: 10px; }
          .phase-arrow { font-size: 18px; }
          .btn-primary { padding: 10px 16px; font-size: 12px; }
          .btn-ghost { padding: 10px 16px; font-size: 12px; }
          .why-now-cta { flex-direction: column; gap: 10px; }
          .section-title { font-size: 20px; }
          .section-subtitle { font-size: 13px; }
          .trust-grid { gap: 10px; }
          .trust-card { padding: 14px; }
          .trust-icon { font-size: 36px; margin-bottom: 10px; }
          .trust-title { font-size: 14px; margin-bottom: 6px; }
          .trust-text { font-size: 12px; }
          .pipeline { gap: 6px; }
          .pipeline-step { padding: 12px 14px; min-width: 120px; }
          .step-icon { font-size: 24px; margin-bottom: 6px; }
          .step-title { font-size: 12px; margin-bottom: 3px; }
          .step-desc { font-size: 10px; }
          .pipeline-arrow { font-size: 18px; }
          .explore-grid { gap: 10px; }
          .explore-card { padding: 14px; }
          .explore-icon { font-size: 36px; margin-bottom: 10px; }
          .explore-title { font-size: 14px; margin-bottom: 6px; }
          .explore-text { font-size: 12px; }
          .explore-cta { font-size: 12px; margin-top: 10px; }
          .punchline-hero { margin: 14px 0 16px 0; padding: 12px 0; }
          .punchline-line { font-size: 16px; line-height: 1.3; margin: 0 0 4px 0; }
          .card { border-radius: 14px; }
          .card-head { padding: 10px 10px 8px; }
          .card-title { font-size: 13px; }
          .card-subtitle { font-size: 11px; }
          .card-body { padding: 10px; }
          .metrics-grid { gap: 10px; }
          .metric-value { font-size: 24px; }
          .metric-label { font-size: 10px; }
          .btn-mini { padding: 8px 10px; font-size: 11px; }
          .btn-icon { font-size: 14px; margin-right: 3px; }
          .footer { padding: 12px 16px 16px; flex-direction: column; align-items: flex-start; font-size: 11px; }
          .footer-right { width: 100%; flex-wrap: wrap; }
          .hero { border-radius: 16px; }
        }

        /* Tablet (641px - 980px) */
        @media (max-width: 980px) and (min-width: 641px) {
          .headline { font-size: 32px; }
          .subhead { font-size: 15px; }
          .kicker { font-size: 11px; }
          .cta-row { gap: 10px; }
          .cta-card { padding: 14px; }
          .cta-icon { font-size: 28px; }
          .cta-title { font-size: 14px; }
          .cta-desc { font-size: 11px; }
          .main { padding: 20px 16px 32px; }
          .topbar-inner { padding: 14px 16px; }
          .hero-inner { padding: 20px; }
        }
      `}</style>
    </>
  );
}

export async function getStaticProps() {
  try {
    const rawBasePublic = (
      process.env.NEXT_PUBLIC_SNAPSHOT_BASE_URL ||
      process.env.NEXT_PUBLIC_MINIO_PUBLIC_BASE ||
      "http://localhost:9002/gpti-snapshots"
    ).replace(/\/+$/, "");
    const basePublic = /^https?:\/\//i.test(rawBasePublic)
      ? rawBasePublic
      : (process.env.MINIO_INTERNAL_ROOT || "http://localhost:9002/gpti-snapshots").replace(/\/+$/, "");

    const snapshotKey = process.env.NEXT_PUBLIC_PUBLIC_SNAPSHOT_KEY || "universe_v0.1_public";
    const latestUrl = `${basePublic}/${snapshotKey}/_public/latest.json`;

    const latestRes = await fetch(latestUrl);
    if (!latestRes.ok) throw new Error(`latest.json HTTP ${latestRes.status}`);
    const latest = await latestRes.json();

    const objectPath = latest?.object ? `${basePublic}/${latest.object}` : null;
    if (!objectPath) throw new Error("latest.json missing object");

    const snapshotRes = await fetch(objectPath);
    if (!snapshotRes.ok) throw new Error(`snapshot HTTP ${snapshotRes.status}`);
    const snapshot = await snapshotRes.json();

    const records = Array.isArray(snapshot?.records) ? snapshot.records : [];
    const { metrics, ptr } = computeMetricsFromRecords(records, latest?.created_at);

    const initialPtr: LatestPointer = {
      object: latest?.object || ptr.object,
      sha256: latest?.sha256 || "",
      created_at: latest?.created_at || ptr.created_at,
      count: latest?.count || ptr.count,
    };

    return {
      props: {
        initialPtr,
        initialMetrics: metrics,
      },
      revalidate: 300,
    };
  } catch (error) {
    return {
      props: {
        initialPtr: null,
        initialMetrics: null,
      },
      revalidate: 300,
    };
  }
}
