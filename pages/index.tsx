'use client';

import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useTranslation } from "../lib/useTranslationStub";

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

const computeMetricsFromRecords = (records: any[], fallbackCreatedAt?: string): { metrics: GlobalMetrics; ptr: LatestPointer } => {
  const totalFirms = records.length;
  const scores = records.map((f: any) => Number(f.score_0_100) || 0).filter((s: number) => s > 0);
  const avgScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
  const passCount = records.filter((f: any) => (f.gtixt_status || f.status || '').toLowerCase() === 'pass').length;
  const passRate = totalFirms > 0 ? (passCount / totalFirms) * 100 : 0;
  const naRates = records
    .map((f: any) => {
      const v = f.na_rate;
      if (v === null || v === undefined) return null;
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    })
    .filter((v: number | null): v is number => v !== null);
  const avgNaRate = naRates.length > 0 ? naRates.reduce((a: number, b: number) => a + b, 0) / naRates.length : 0;

  return {
    metrics: {
      totalFirms,
      avgScore: Math.round(avgScore),
      passRate: Math.round(passRate),
      naRate: Math.round(avgNaRate),
      lastUpdate: fallbackCreatedAt || new Date().toISOString(),
      integrityStatus: avgScore > 70 ? 'healthy' : avgScore > 50 ? 'warning' : 'error',
    },
    ptr: {
      object: 'snapshot.json',
      sha256: '',
      created_at: fallbackCreatedAt || new Date().toISOString(),
      count: totalFirms,
    },
  };
};

export default function HomeBeaconV3({ initialPtr = null, initialMetrics = null }: HomeProps) {
  const basePublic = useMemo(() => {
    return (
      process.env.NEXT_PUBLIC_SNAPSHOT_BASE_URL ||
      process.env.NEXT_PUBLIC_MINIO_PUBLIC_BASE ||
      "https://data.gtixt.com/gpti-snapshots"
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
  const { t } = useTranslation("common");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr(null);
        const r = await fetch('/api/firms/?limit=200', { cache: "no-store" });
        if (!r.ok) throw new Error(`API firms HTTP ${r.status}`);
        const apiData = await r.json();
        if (!alive) return;

        const j: LatestPointer = {
          object: apiData.snapshot_info?.object || 'snapshot.json',
          sha256: apiData.snapshot_info?.sha256 || '',
          created_at: apiData.snapshot_info?.created_at || new Date().toISOString(),
          count: apiData.total || 0,
        };
        setPtr(j);

        if (apiData.firms && Array.isArray(apiData.firms)) {
          const { metrics: computed } = computeMetricsFromRecords(apiData.firms, j.created_at);
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
  }, [latestUrl]);

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
              <div className="brand-mark">GT</div>
              <div className="brand-text">
                <div className="brand-name">GTIXT</div>
                <div className="brand-tag">The Global Prop Trading Index</div>
              </div>
            </div>

            <nav className="nav">
              <Link className="navlink" href="/rankings">Dashboard</Link>
              <Link className="navlink" href="/integrity">Integrity</Link>
              <Link className="navlink" href="/methodology">Methodology</Link>
            </nav>
          </div>
        </header>

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

                <div className="cta-row">
                  <Link href="/rankings" className="cta-card primary">
                    <span className="cta-icon">📊</span>
                    <h2 className="cta-title">Explorer l'Index</h2>
                    <p className="cta-desc">Classement des {metrics?.totalFirms || 106} firmes de trading propriétaire</p>
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
                  <div className="card-head">
                    <div>
                      <div className="card-title">Index Overview</div>
                      <div className="card-subtitle">Real-time benchmark metrics</div>
                    </div>
                    <span className={`badge ${metrics?.integrityStatus === 'healthy' ? 'badge-success' : 'badge-warning'}`}>
                      {metrics?.integrityStatus === 'healthy' ? '✓ HEALTHY' : '⚠ REVIEW'}
                    </span>
                  </div>

                  <div className="card-body">
                    <div className="metrics-grid">
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

                    <div className="divider" />

                    <div className="snapshot-info">
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
                          {metrics ? formatIso(metrics.lastUpdate) : "—"}
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
                  View all {metrics?.totalFirms || 'prop'} firms ranked by GTIXT score. Filter by jurisdiction, sort by pillars.
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
        .topbar { position: sticky; top: 0; z-index: 20; backdrop-filter: blur(10px); background: rgba(7,11,20,0.72); border-bottom: 1px solid rgba(255,255,255,0.08); }
        .topbar-inner { max-width: 1120px; margin: 0 auto; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; }
        .brand { display: flex; align-items: center; gap: 12px; }
        .brand-mark { width: 38px; height: 38px; border-radius: 14px; display: grid; place-items: center; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.10); font-weight: 700; letter-spacing: 0.02em; }
        .brand-name { font-weight: 800; letter-spacing: 0.02em; }
        .brand-tag { font-size: 12px; color: rgba(234,240,255,0.66); margin-top: 2px; }
        .nav { display: flex; gap: 16px; font-size: 14px; color: rgba(234,240,255,0.78); }
        .navlink:hover { color: #fff; }

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
      `}</style>
    </>
  );
}

export async function getStaticProps() {
  try {
    const basePublic = (
      process.env.NEXT_PUBLIC_SNAPSHOT_BASE_URL ||
      process.env.NEXT_PUBLIC_MINIO_PUBLIC_BASE ||
      "https://data.gtixt.com/gpti-snapshots"
    ).replace(/\/+$/, "");

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
